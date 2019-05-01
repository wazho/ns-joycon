// Node modules.
import { HID, Device, devices as findDevices } from 'node-hid';
import { IInputReport0x3f, IInputReport0x21, IInputReport0x30, InputReport } from './models/';
// Local modules.
import { IDeviceInfo } from './models/subcommand';
import * as PacketParser from './utils/packet-parser';
import * as SubcommandSender from './utils/subcommand-sender';

function getType(product?: string) {
    if (product === undefined) {
        return 'unknown';
    }

    switch (true) {
        case /Pro Controller/i.test(product):
            return 'pro-controller';
        case /Joy-Con \([LR]\)/i.test(product):
            return 'joy-con';
        default:
            return 'unknown';
    }
}

class NsSwitchHID {
    private vendorId: number;
    private productId: number;
    private serialNumber?: string;
    private product?: string;
    private type: 'joy-con' | 'pro-controller' | 'unknown';
    private path?: string;
    private usage?: number;
    private hid: HID;
    private listeners: Array<(packet: InputReport) => void> = [];

    constructor(device: Device) {
        this.vendorId = device.vendorId;
        this.productId = device.productId;
        this.serialNumber = device.serialNumber;
        this.product = device.product;
        this.type = getType(device.product);
        this.path = device.path;
        this.usage = device.usage;
        this.hid = new HID(device.vendorId, device.productId);
        // System handler.
        if (this.type === 'joy-con') {
            this.activateJoyConStream();
        }
    }

    public get meta() {
        return {
            vendorId: this.vendorId,
            productId: this.productId,
            serialNumber: this.serialNumber,
            product: this.product,
            type: this.type,
            path: this.path,
            usage: this.usage,
        };
    }

    /**
     * Add / remove a handler to recevice packets when device send streaming data.
     */
    public manageHandler(action: 'add' | 'remove', callback: (packet: InputReport) => void) {
        if (action === 'add') {
            this.listeners.push(callback);
        } else {
            this.listeners = this.listeners.filter((listener) => listener !== callback);
        }
    }

    /**
     * Request device info to Jon-Con.
     */
    public async requestDeviceInfo() {
        if (this.type === 'joy-con') {
            const manageHandler = this.manageHandler.bind(this);
            const deviceInfo: IDeviceInfo = await SubcommandSender.requestDeviceInfo(this.hid, manageHandler);

            return deviceInfo;
        }
    }

    /**
     * Enable IMU data will make Jon-Con sends **Input Report 0x30**.
     */
    public async enableIMU() {
        if (this.type === 'joy-con') {
            await SubcommandSender.enableIMU(this.hid, this.manageHandler.bind(this), true);
            await SubcommandSender.setInputReportMode(this.hid, this.manageHandler.bind(this), 'standard-full-mode');

            console.info(`Device ${this.product} (${this.serialNumber}) enabled IMU.`);
        }
    }

    /**
     * Disable IMU data will cancel Jon-Con to send **Input Report 0x30**.
     */
    public async disableIMU() {
        if (this.type === 'joy-con') {
            await SubcommandSender.enableIMU(this.hid, this.manageHandler.bind(this), false);
            await SubcommandSender.setInputReportMode(this.hid, this.manageHandler.bind(this), 'simple-hid-mode');

            console.info(`Device ${this.product} (${this.serialNumber}) disabled IMU.`);
        }
    }

    /**
     * Enable Jon-Con's vibration.
     */
    public async enableVibration() {
        if (this.type === 'joy-con') {
            await SubcommandSender.enableVibration(this.hid, this.manageHandler.bind(this), true);

            console.info(`Device ${this.product} (${this.serialNumber}) enabled vibration.`);
        }
    }

    /**
     * Disable Jon-Con's vibration.
     */
    public async disableVibration() {
        if (this.type === 'joy-con') {
            await SubcommandSender.enableVibration(this.hid, this.manageHandler.bind(this), false);

            console.info(`Device ${this.product} (${this.serialNumber}) disabled vibration.`);
        }
    }

    private async activateJoyConStream() {
        this.hid.on('data', (rawData: Buffer) => {
            const data = rawData.toString('hex').match(/.{2}/g);

            if (!data) { return; }

            const inputReportID = parseInt(data[0], 16);

            let packet: Partial<InputReport> = {
                inputReportID: PacketParser.parseInputReportID(rawData, data),
            };

            switch (inputReportID) {
                case 0x3f: {
                    packet = {
                        ...packet,
                        buttonStatus: PacketParser.parseButtonStatus(rawData, data),
                        analogStick: PacketParser.parseAnalogStick(rawData, data),
                        filter: PacketParser.parseFilter(rawData, data),
                    } as IInputReport0x3f;
                    break;
                }
                case 0x21:
                case 0x30: {
                    packet = {
                        ...packet,
                        timer: PacketParser.parseTimer(rawData, data),
                        batteryLevel: PacketParser.parseBatteryLevel(rawData, data),
                        connectionInfo: PacketParser.parseConnectionInfo(rawData, data),
                        buttonStatus: PacketParser.parseCompleteButtonStatus(rawData, data),
                        analogStickLeft: PacketParser.parseAnalogStickLeft(rawData, data),
                        analogStickRight: PacketParser.parseAnalogStickRight(rawData, data),
                        vibrator: PacketParser.parseVibrator(rawData, data),
                    };

                    if (inputReportID === 0x21) {
                        packet = {
                            ...packet,
                            ack: PacketParser.parseAck(rawData, data),
                            subcommandID: PacketParser.parseSubcommandID(rawData, data),
                            subcommandReplyData: PacketParser.parseSubcommandReplyData(rawData, data),
                        } as IInputReport0x21;
                    }

                    if (inputReportID === 0x30) {
                        const accelerometers = PacketParser.parseAccelerometers(rawData, data);
                        const gyroscopes = PacketParser.parseGyroscopes(rawData, data);

                        packet = {
                            ...packet,
                            accelerometers,
                            gyroscopes,
                            actualAccelerometer: {
                                acc: PacketParser.calculateActualAccelerometer(accelerometers.map(a => [a.x.acc, a.y.acc, a.z.acc])),
                            },
                            actualGyroscope: {
                                dps: PacketParser.calculateActualGyroscope(gyroscopes.map(g => g.map(v => v.dps))),
                                rps: PacketParser.calculateActualGyroscope(gyroscopes.map(g => g.map(v => v.rps))),
                            },
                        } as IInputReport0x30;
                    }
                    break;
                }
            }

            // Broadcast.
            this.listeners.forEach((listener) => listener(packet as InputReport));
        });

        this.hid.on('error', (error) => {
            console.warn({
                ...this.meta,
                error,
            });
        });
    }
}

export function findControllers(callback: (controllers: NsSwitchHID[]) => void) {
    let deviceList = new Set();

    const work = () => {
        const tempDeviceList = new Set();
        const devices = findDevices().reduce((prev, d) => {
            if (getType(d.product) !== 'unknown') {
                prev.push(new NsSwitchHID(d));
            }

            return prev;
        }, [] as NsSwitchHID[]);

        devices.forEach((d) => {
            const distinctId = `${d.meta.vendorId},${d.meta.productId},${d.meta.type}`;
            tempDeviceList.add(distinctId);

            if (!deviceList.has(distinctId)) {
                callback(devices);
            }
        });

        deviceList = tempDeviceList;
    };

    work();
    setInterval(work, 1000);
}
