"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// Node modules.
const node_hid_1 = require("node-hid");
const PacketParser = __importStar(require("./utils/packet-parser"));
const SubcommandSender = __importStar(require("./utils/subcommand-sender"));
function getType(product) {
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
    constructor(device) {
        this.listeners = [];
        this.vendorId = device.vendorId;
        this.productId = device.productId;
        this.serialNumber = device.serialNumber;
        this.product = device.product;
        this.type = getType(device.product);
        this.path = device.path;
        this.usage = device.usage;
        this.hid = new node_hid_1.HID(device.vendorId, device.productId);
        // System handler.
        if (this.type === 'joy-con') {
            this.activateJoyConStream();
        }
    }
    get meta() {
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
     * Add / remove a handler to recevice packets when device send streaming data.
     */
    manageHandler(action, callback) {
        if (action === 'add') {
            this.listeners.push(callback);
        }
        else {
            this.listeners = this.listeners.filter((listener) => listener !== callback);
        }
    }
    /**
     * Request device info to Jon-Con.
     */
    requestDeviceInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.type === 'joy-con') {
                const manageHandler = this.manageHandler.bind(this);
                const deviceInfo = yield SubcommandSender.requestDeviceInfo(this.hid, manageHandler);
                return deviceInfo;
            }
        });
    }
    /**
     * Enable IMU data will make Jon-Con sends **Input Report 0x30**.
     */
    enableIMU() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.type === 'joy-con') {
                yield SubcommandSender.enableIMU(this.hid, this.manageHandler.bind(this), true);
                yield SubcommandSender.setInputReportMode(this.hid, this.manageHandler.bind(this), 'standard-full-mode');
                console.info(`Device ${this.product} (${this.serialNumber}) enabled IMU.`);
            }
        });
    }
    /**
     * Disable IMU data will cancel Jon-Con to send **Input Report 0x30**.
     */
    disableIMU() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.type === 'joy-con') {
                yield SubcommandSender.enableIMU(this.hid, this.manageHandler.bind(this), false);
                yield SubcommandSender.setInputReportMode(this.hid, this.manageHandler.bind(this), 'simple-hid-mode');
                console.info(`Device ${this.product} (${this.serialNumber}) disabled IMU.`);
            }
        });
    }
    /**
     * Enable Jon-Con's vibration.
     */
    enableVibration() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.type === 'joy-con') {
                yield SubcommandSender.enableVibration(this.hid, this.manageHandler.bind(this), true);
                console.info(`Device ${this.product} (${this.serialNumber}) enabled vibration.`);
            }
        });
    }
    /**
     * Disable Jon-Con's vibration.
     */
    disableVibration() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.type === 'joy-con') {
                yield SubcommandSender.enableVibration(this.hid, this.manageHandler.bind(this), false);
                console.info(`Device ${this.product} (${this.serialNumber}) disabled vibration.`);
            }
        });
    }
    activateJoyConStream() {
        return __awaiter(this, void 0, void 0, function* () {
            this.hid.on('data', (rawData) => {
                const data = rawData.toString('hex').match(/.{2}/g);
                if (!data) {
                    return;
                }
                const inputReportID = parseInt(data[0], 16);
                let packet = {
                    inputReportID: PacketParser.parseInputReportID(rawData, data),
                };
                switch (inputReportID) {
                    case 0x3f: {
                        packet = Object.assign({}, packet, { buttonStatus: PacketParser.parseButtonStatus(rawData, data), analogStick: PacketParser.parseAnalogStick(rawData, data), filter: PacketParser.parseFilter(rawData, data) });
                        break;
                    }
                    case 0x21:
                    case 0x30: {
                        packet = Object.assign({}, packet, { timer: PacketParser.parseTimer(rawData, data), batteryLevel: PacketParser.parseBatteryLevel(rawData, data), connectionInfo: PacketParser.parseConnectionInfo(rawData, data), buttonStatus: PacketParser.parseCompleteButtonStatus(rawData, data), analogStickLeft: PacketParser.parseAnalogStickLeft(rawData, data), analogStickRight: PacketParser.parseAnalogStickRight(rawData, data), vibrator: PacketParser.parseVibrator(rawData, data) });
                        if (inputReportID === 0x21) {
                            packet = Object.assign({}, packet, { ack: PacketParser.parseAck(rawData, data), subcommandID: PacketParser.parseSubcommandID(rawData, data), subcommandReplyData: PacketParser.parseSubcommandReplyData(rawData, data) });
                        }
                        if (inputReportID === 0x30) {
                            const accelerometers = PacketParser.parseAccelerometers(rawData, data);
                            const gyroscopes = PacketParser.parseGyroscopes(rawData, data);
                            packet = Object.assign({}, packet, { accelerometers,
                                gyroscopes, actualAccelerometer: {
                                    acc: PacketParser.calculateActualAccelerometer(accelerometers.map(a => [a.x.acc, a.y.acc, a.z.acc])),
                                }, actualGyroscope: {
                                    dps: PacketParser.calculateActualGyroscope(gyroscopes.map(g => g.map(v => v.dps))),
                                    rps: PacketParser.calculateActualGyroscope(gyroscopes.map(g => g.map(v => v.rps))),
                                } });
                        }
                        break;
                    }
                }
                // Broadcast.
                this.listeners.forEach((listener) => listener(packet));
            });
            this.hid.on('error', (data) => {
                throw new Error(data);
            });
        });
    }
}
function findControllers() {
    const joycons = [];
    const proControllers = [];
    const devices = node_hid_1.devices().reduce((prev, d) => {
        // Products: ['Pro Controller', 'Joy-Con (L)', 'Joy-Con (R)']
        if (d.product && d.product.includes('Pro Controller')) {
            prev.proControllers.push(new NsSwitchHID(d));
        }
        else if (d.product && d.product.includes('Joy-Con')) {
            prev.joycons.push(new NsSwitchHID(d));
        }
        return prev;
    }, { joycons, proControllers });
    return devices;
}
exports.findControllers = findControllers;
//# sourceMappingURL=index.js.map