// Node modules.
import { HID } from 'node-hid';
// Local modules.
import { IInputReport0x21 } from '../models';
import { IDeviceInfo, InputReportMode } from '../models/subcommand';

// Subcommand format:
// https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_notes.md#output-0x01

enum ControllerType {
    'Left Joy-Con' = 0x1,
    'Right Joy-Con' = 0x2,
    'Pro Controller' = 0x3,
}

/**
 * **Subcommand 0x02**: Request device info
 * 
 * doc: https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x02-request-device-info
 */
export function requestDeviceInfo(hid: HID, manageHandler: Function) {
    const outputReportID = 0x01;
    const subcommand = [0x02];
    hid.write([outputReportID, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ...subcommand]);

    return new Promise<IDeviceInfo>((resolve) => {
        const handler = (packet: IInputReport0x21) => {
            const { inputReportID, subcommandID, subcommandReplyData } = packet;
            if (inputReportID._raw[0] === 0x21 && subcommandID._raw[0] === 0x02) {
                // Remove the handler first.
                manageHandler('remove', handler);

                // Parse the packet.
                const firmwareMajorVersionRaw = subcommandReplyData._raw.slice(0, 1) // index 0
                const firmwareMinorVersionRaw = subcommandReplyData._raw.slice(1, 2) // index 1
                const typeRaw = subcommandReplyData._raw.slice(2, 3) // index 2
                const macAddressRaw = subcommandReplyData._raw.slice(4, 10) // index 4-9
                const spiColorInUsedRaw = subcommandReplyData._raw.slice(11, 12) // index 11

                const result = {
                    firmwareVersion: {
                        major: firmwareMajorVersionRaw.readUInt8(0),
                        minor: firmwareMinorVersionRaw.readUInt8(0),
                    },
                    type: ControllerType[typeRaw[0]],
                    macAddress: macAddressRaw.toString('hex').match(/(.{2})/g)!.join(':'),
                    spiColorInUsed: spiColorInUsedRaw[0] === 0x1,
                };

                resolve(result);
            }
        };

        manageHandler('add', handler);
    });
}

/**
 * **Subcommand 0x40**: Enable IMU (6-Axis sensor)
 * 
 * **Argument 0x00**: Disable
 * 
 * **Argument 0x01**: Enable
 * 
 * doc: https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x40-enable-imu-6-axis-sensor
 */
export function enableIMU(hid: HID, manageHandler: Function, enable: boolean) {
    const outputReportID = 0x01;
    const subcommand = enable
        ? [0x40, 0x01]
        : [0x40, 0x00];
    hid.write([outputReportID, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ...subcommand]);

    return new Promise((resolve) => {
        const handler = (packet: IInputReport0x21) => {
            const { inputReportID, subcommandID } = packet;
            if (inputReportID._raw[0] === 0x21 && subcommandID._raw[0] === 0x40) {
                manageHandler('remove', handler);
                resolve();
            }
        };

        manageHandler('add', handler);
    });
}

/**
 * **Subcommand 0x03**: Set input report mode
 * 
 * **Argument 0x30**: Standard full mode. Pushes current state @60Hz
 * 
 * **Argument 0x3f**: Simple HID mode. Pushes updates with every button press
 * 
 * doc: https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x03-set-input-report-mode
 */
export function setInputReportMode(hid: HID, manageHandler: Function, mode: InputReportMode) {
    const outputReportID = 0x01;
    const subcommand = mode === 'standard-full-mode'
        ? [0x03, 0x30]
        : [0x03, 0x3f];
    hid.write([outputReportID, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ...subcommand]);

    return new Promise((resolve) => {
        const handler = (packet: IInputReport0x21) => {
            const { inputReportID, subcommandID } = packet;
            if (inputReportID._raw[0] === 0x21 && subcommandID._raw[0] === 0x03) {
                manageHandler('remove', handler);
                resolve();
            }
        };

        manageHandler('add', handler);
    });
}

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
export function enableVibration(hid: HID, manageHandler: Function, enable: boolean) {
    const outputReportID = 0x01;
    const subcommand = enable
        ? [0x48, 0x01]
        : [0x48, 0x00];
        console.log(subcommand);
    // TODO: Control the vibration here.
    hid.write([outputReportID, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ...subcommand]);

    return new Promise((resolve) => {
        const handler = (packet: IInputReport0x21) => {
            const { inputReportID, subcommandID } = packet;
            if (inputReportID._raw[0] === 0x21 && subcommandID._raw[0] === 0x48) {
                manageHandler('remove', handler);
                resolve();
            }
        };

        manageHandler('add', handler);
    });
}
