// Node modules.
import { HID, Device, devices as findDevices } from 'node-hid';
import { IInputReport0x3f, IInputReport0x21, IInputReport0x30, InputReport } from './models/';
// Local modules.
import * as PacketParser from './utils/packet-parser';

class NsSwitchHID {
    private vendorId: number;
    private productId: number;
    private serialNumber?: string;
    private product?: string;
    private type: 'joy-con' | 'pro-controller' | 'unknown';
    private path?: string;
    private usage?: number;
    private hid: HID;

    constructor(device: Device) {
        this.vendorId = device.vendorId;
        this.productId = device.productId;
        this.serialNumber = device.serialNumber;
        this.product = device.product;
        this.type = getType(device.product);
        this.path = device.path;
        this.usage = device.usage;
        this.hid = new HID(device.vendorId, device.productId);
    }

    public get meta() {
        return {
            vendorId: this.vendorId,
            productId: this.productId,
            serialNumber: this.serialNumber,
            product: this.product,
            path: this.path,
            usage: this.usage,
        };
    }

    /**
     * Add a handler to recevice packets when device send streaming data.
     */
    public addHandler(callback: (packet: InputReport) => void) {
        if (this.type === 'joy-con') {
            addJoyConHandler(this.hid, callback);
        }
    }

    /**
     * Enable IMU data will make Jon-Con sends **Input Report 0x30**.
     */
    public async enableIMU() {
        // Subcommand format:
        // https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_notes.md#output-0x01
        if (this.type === 'joy-con') {
            // https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x40-enable-imu-6-axis-sensor
            // Subcommand 0x40: Enable IMU (6-Axis sensor)
            // Argument 0x01: Enable
            this.hid.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x01]);
            await this.inputReport21Promise();

            // https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x03-set-input-report-mode
            // Subcommand 0x03: Set input report mode
            // Argument 0x30: Standard full mode. Pushes current state @60Hz
            this.hid.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x30]);
            await this.inputReport21Promise();

            console.info(`Device ${this.product} (${this.serialNumber}) enabled IMU.`);
        }
    }

    /**
     * Disable IMU data will cancel Jon-Con to send **Input Report 0x30**.
     */
    public async disableIMU() {
        // Subcommand format:
        // https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_notes.md#output-0x01
        if (this.type === 'joy-con') {
            // Subcommand 0x40: Enable IMU (6-Axis sensor)
            // Argument 0x00: Disable
            this.hid.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00]);
            await this.inputReport21Promise();

            // Subcommand 0x03: Set input report mode
            // Argument 0x3f: Simple HID mode. Pushes updates with every button press
            this.hid.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x3f]);
            await this.inputReport21Promise();

            console.info(`Device ${this.product} (${this.serialNumber}) disabled IMU.`);
        }
    }

    private inputReport21Promise() {
        return new Promise((resolve) =>
            this.addHandler((packet) => packet.inputReportID._raw[0] === 0x21 && resolve())
        )
    }
}

export function findControllers() {
    const joycons: NsSwitchHID[] = [];
    const proControllers: NsSwitchHID[] = [];

    const devices = findDevices().reduce((prev, d) => {
        // Products: ['Pro Controller', 'Joy-Con (L)', 'Joy-Con (R)']
        if (d.product && d.product.includes('Pro Controller')) {
            prev.proControllers.push(new NsSwitchHID(d));
        } else if (d.product && d.product.includes('Joy-Con')) {
            prev.joycons.push(new NsSwitchHID(d));
        }

        return prev;
    }, { joycons, proControllers });

    return devices;
}

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

function addJoyConHandler(joycon: HID, callback: (packet: InputReport) => void) {
    joycon.on('data', (rawData: Buffer) => {
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
                        replySubcommand: PacketParser.parseReplySubcommand(rawData, data),
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

        callback(packet as InputReport);
    });

    joycon.on('error', (data) => {
        throw new Error(data);
    });
}
