"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_hid_1 = require("node-hid");
// Local modules.
const PacketParser = __importStar(require("./utils/packet-parser"));
function findDevices() {
    const devices = node_hid_1.devices();
    // Products: ['Pro Controller', 'Joy-Con (L)', 'Joy-Con (R)']
    const proControllerDevices = devices.filter((d) => d.product && d.product.includes('Pro Controller'));
    const joyconDevices = devices.filter((d) => d.product && d.product.includes('Joy-Con'));
    return {
        joyconDevices,
        proControllerDevices,
    };
}
exports.findDevices = findDevices;
function convertToHumanInterfaceDevice(joyconDevice) {
    const joycon = new node_hid_1.HID(joyconDevice.vendorId, joyconDevice.productId);
    return joycon;
}
exports.convertToHumanInterfaceDevice = convertToHumanInterfaceDevice;
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
exports.addJoyConHandler = addJoyConHandler;
/**
 * Enable IMU data will make Jon-Con sends **Input Report 0x30**.
 */
function enableJoyConIMU(joycon) {
    // Subcommand format:
    // https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_notes.md#output-0x01
    // https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x40-enable-imu-6-axis-sensor
    // Subcommand 0x40: Enable IMU (6-Axis sensor)
    // Argument 0x01: Enable
    setTimeout(() => joycon.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x01]), 1000);
    // https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x03-set-input-report-mode
    // Subcommand 0x03: Set input report mode
    // Argument 0x30: Standard full mode. Pushes current state @60Hz
    setTimeout(() => joycon.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x30]), 2000);
}
exports.enableJoyConIMU = enableJoyConIMU;
/**
 * Disable IMU data will cancel Jon-Con to send **Input Report 0x30**.
 */
function disableJoyConIMU(joycon) {
    // Subcommand 0x40: Enable IMU (6-Axis sensor)
    // Argument 0x00: Disable
    setTimeout(() => joycon.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00]), 1000);
    // Subcommand 0x03: Set input report mode
    // Argument 0x3f: Simple HID mode. Pushes updates with every button press
    setTimeout(() => joycon.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x3f]), 2000);
}
exports.disableJoyConIMU = disableJoyConIMU;
//# sourceMappingURL=index.js.map