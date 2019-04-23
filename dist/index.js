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
// Local modules.
const PacketParser = __importStar(require("./utils/packet-parser"));
class NsSwitchHID {
    constructor(device) {
        this.vendorId = device.vendorId;
        this.productId = device.productId;
        this.serialNumber = device.serialNumber;
        this.product = device.product;
        this.type = getType(device.product);
        this.path = device.path;
        this.usage = device.usage;
        this.hid = new node_hid_1.HID(device.vendorId, device.productId);
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
     * Add a handler to recevice packets when device send streaming data.
     */
    addHandler(callback) {
        if (this.type === 'joy-con') {
            addJoyConHandler(this.hid, callback);
        }
    }
    /**
     * Enable IMU data will make Jon-Con sends **Input Report 0x30**.
     */
    enableIMU() {
        return __awaiter(this, void 0, void 0, function* () {
            // Subcommand format:
            // https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_notes.md#output-0x01
            if (this.type === 'joy-con') {
                // https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x40-enable-imu-6-axis-sensor
                // Subcommand 0x40: Enable IMU (6-Axis sensor)
                // Argument 0x01: Enable
                this.hid.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x01]);
                yield this.inputReport21Promise();
                // https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x03-set-input-report-mode
                // Subcommand 0x03: Set input report mode
                // Argument 0x30: Standard full mode. Pushes current state @60Hz
                this.hid.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x30]);
                yield this.inputReport21Promise();
                console.info(`Device ${this.product} (${this.serialNumber}) enabled IMU.`);
            }
        });
    }
    /**
     * Disable IMU data will cancel Jon-Con to send **Input Report 0x30**.
     */
    disableIMU() {
        return __awaiter(this, void 0, void 0, function* () {
            // Subcommand format:
            // https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_notes.md#output-0x01
            if (this.type === 'joy-con') {
                // Subcommand 0x40: Enable IMU (6-Axis sensor)
                // Argument 0x00: Disable
                this.hid.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00]);
                yield this.inputReport21Promise();
                // Subcommand 0x03: Set input report mode
                // Argument 0x3f: Simple HID mode. Pushes updates with every button press
                this.hid.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x3f]);
                yield this.inputReport21Promise();
                console.info(`Device ${this.product} (${this.serialNumber}) disabled IMU.`);
            }
        });
    }
    inputReport21Promise() {
        return new Promise((resolve) => this.addHandler((packet) => packet.inputReportID._raw[0] === 0x21 && resolve()));
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
function addJoyConHandler(joycon, callback) {
    joycon.on('data', (rawData) => {
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
                    packet = Object.assign({}, packet, { ack: PacketParser.parseAck(rawData, data), replySubcommand: PacketParser.parseReplySubcommand(rawData, data) });
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
        callback(packet);
    });
    joycon.on('error', (data) => {
        throw new Error(data);
    });
}
//# sourceMappingURL=index.js.map