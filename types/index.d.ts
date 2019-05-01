import { Device } from 'node-hid';
import { InputReport } from './models/';
import { IDeviceInfo } from './models/subcommand';
declare class NsSwitchHID {
    private vendorId;
    private productId;
    private serialNumber?;
    private product?;
    private type;
    private path?;
    private usage?;
    private hid;
    private listeners;
    constructor(device: Device);
    readonly meta: {
        vendorId: number;
        productId: number;
        serialNumber: string | undefined;
        product: string | undefined;
        type: "unknown" | "pro-controller" | "joy-con";
        path: string | undefined;
        usage: number | undefined;
    };
    /**
     * Add / remove a handler to recevice packets when device send streaming data.
     */
    manageHandler(action: 'add' | 'remove', callback: (packet: InputReport) => void): void;
    /**
     * Request device info to Jon-Con.
     */
    requestDeviceInfo(): Promise<IDeviceInfo | undefined>;
    /**
     * Enable IMU data will make Jon-Con sends **Input Report 0x30**.
     */
    enableIMU(): Promise<void>;
    /**
     * Disable IMU data will cancel Jon-Con to send **Input Report 0x30**.
     */
    disableIMU(): Promise<void>;
    /**
     * Enable Jon-Con's vibration.
     */
    enableVibration(): Promise<void>;
    /**
     * Disable Jon-Con's vibration.
     */
    disableVibration(): Promise<void>;
    private activateJoyConStream;
}
export declare function findControllers(callback: (controllers: NsSwitchHID[]) => void): void;
export {};
