"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Subcommand format:
// https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_notes.md#output-0x01
var ControllerType;
(function (ControllerType) {
    ControllerType[ControllerType["Left Joy-Con"] = 1] = "Left Joy-Con";
    ControllerType[ControllerType["Right Joy-Con"] = 2] = "Right Joy-Con";
    ControllerType[ControllerType["Pro Controller"] = 3] = "Pro Controller";
})(ControllerType || (ControllerType = {}));
/**
 * **Subcommand 0x02**: Request device info
 *
 * doc: https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x02-request-device-info
 */
function requestDeviceInfo(hid, manageHandler) {
    const outputReportID = 0x01;
    const subcommand = [0x02];
    hid.write([outputReportID, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ...subcommand]);
    return new Promise((resolve) => {
        const handler = (packet) => {
            const { inputReportID, subcommandID, subcommandReplyData } = packet;
            if (inputReportID._raw[0] === 0x21 && subcommandID._raw[0] === 0x02) {
                // Remove the handler first.
                manageHandler('remove', handler);
                // Parse the packet.
                const firmwareMajorVersionRaw = subcommandReplyData._raw.slice(0, 1); // index 0
                const firmwareMinorVersionRaw = subcommandReplyData._raw.slice(1, 2); // index 1
                const typeRaw = subcommandReplyData._raw.slice(2, 3); // index 2
                const macAddressRaw = subcommandReplyData._raw.slice(4, 10); // index 4-9
                const spiColorInUsedRaw = subcommandReplyData._raw.slice(11, 12); // index 11
                const result = {
                    firmwareVersion: {
                        major: firmwareMajorVersionRaw.readUInt8(0),
                        minor: firmwareMinorVersionRaw.readUInt8(0),
                    },
                    type: ControllerType[typeRaw[0]],
                    macAddress: macAddressRaw.toString('hex').match(/(.{2})/g).join(':'),
                    spiColorInUsed: spiColorInUsedRaw[0] === 0x1,
                };
                resolve(result);
            }
        };
        manageHandler('add', handler);
    });
}
exports.requestDeviceInfo = requestDeviceInfo;
/**
 * **Subcommand 0x40**: Enable IMU (6-Axis sensor)
 *
 * **Argument 0x00**: Disable
 *
 * **Argument 0x01**: Enable
 *
 * doc: https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x40-enable-imu-6-axis-sensor
 */
function enableIMU(hid, manageHandler, enable) {
    const outputReportID = 0x01;
    const subcommand = enable
        ? [0x40, 0x01]
        : [0x40, 0x00];
    hid.write([outputReportID, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ...subcommand]);
    return new Promise((resolve) => {
        const handler = (packet) => {
            const { inputReportID, subcommandID } = packet;
            if (inputReportID._raw[0] === 0x21 && subcommandID._raw[0] === 0x40) {
                manageHandler('remove', handler);
                resolve();
            }
        };
        manageHandler('add', handler);
    });
}
exports.enableIMU = enableIMU;
/**
 * **Subcommand 0x03**: Set input report mode
 *
 * **Argument 0x30**: Standard full mode. Pushes current state @60Hz
 *
 * **Argument 0x3f**: Simple HID mode. Pushes updates with every button press
 *
 * doc: https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x03-set-input-report-mode
 */
function setInputReportMode(hid, manageHandler, mode) {
    const outputReportID = 0x01;
    const subcommand = mode === 'standard-full-mode'
        ? [0x03, 0x30]
        : [0x03, 0x3f];
    hid.write([outputReportID, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ...subcommand]);
    return new Promise((resolve) => {
        const handler = (packet) => {
            const { inputReportID, subcommandID } = packet;
            if (inputReportID._raw[0] === 0x21 && subcommandID._raw[0] === 0x03) {
                manageHandler('remove', handler);
                resolve();
            }
        };
        manageHandler('add', handler);
    });
}
exports.setInputReportMode = setInputReportMode;
/**
 * **Subcommand 0x48**: Enable vibration
 *
 * **Argument 0x00**: Disable
 *
 * **Argument 0x01**: Enable
 *
 * doc: https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x48-enable-vibration
 * doc: https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_notes.md#rumble-data
 */
function enableVibration(hid, manageHandler, enable) {
    const outputReportID = 0x01;
    const subcommand = enable
        ? [0x48, 0x01]
        : [0x48, 0x00];
    console.log(subcommand);
    // TODO: Control the vibration here.
    hid.write([outputReportID, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ...subcommand]);
    return new Promise((resolve) => {
        const handler = (packet) => {
            const { inputReportID, subcommandID } = packet;
            if (inputReportID._raw[0] === 0x21 && subcommandID._raw[0] === 0x48) {
                manageHandler('remove', handler);
                resolve();
            }
        };
        manageHandler('add', handler);
    });
}
exports.enableVibration = enableVibration;
//# sourceMappingURL=subcommand-sender.js.map