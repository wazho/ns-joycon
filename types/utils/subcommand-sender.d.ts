import { HID } from 'node-hid';
import { IDeviceInfo, InputReportMode } from '../models/subcommand';
/**
 * **Subcommand 0x02**: Request device info
 *
 * doc: https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x02-request-device-info
 */
export declare function requestDeviceInfo(hid: HID, manageHandler: Function): Promise<IDeviceInfo>;
/**
 * **Subcommand 0x40**: Enable IMU (6-Axis sensor)
 *
 * **Argument 0x00**: Disable
 *
 * **Argument 0x01**: Enable
 *
 * doc: https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x40-enable-imu-6-axis-sensor
 */
export declare function enableIMU(hid: HID, manageHandler: Function, enable: boolean): Promise<{}>;
/**
 * **Subcommand 0x03**: Set input report mode
 *
 * **Argument 0x30**: Standard full mode. Pushes current state @60Hz
 *
 * **Argument 0x3f**: Simple HID mode. Pushes updates with every button press
 *
 * doc: https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x03-set-input-report-mode
 */
export declare function setInputReportMode(hid: HID, manageHandler: Function, mode: InputReportMode): Promise<{}>;
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
export declare function enableVibration(hid: HID, manageHandler: Function, enable: boolean): Promise<{}>;
