import { HID, Device } from 'node-hid';
import { InputReport } from './models/indes';
export declare function findDevices(): {
    joyconDevices: Device[];
    proControllerDevices: Device[];
};
export declare function convertToHumanInterfaceDevice(joyconDevice: Device): HID;
export declare function addJoyConHandler(joycon: HID, callback: (packet: InputReport) => void): void;
/**
 * Enable IMU data will make Jon-Con sends **Input Report 0x30**.
 */
export declare function enableJoyConIMU(joycon: HID): void;
/**
 * Disable IMU data will cancel Jon-Con to send **Input Report 0x30**.
 */
export declare function disableJoyConIMU(joycon: HID): void;
