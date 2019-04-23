import { Device } from 'node-hid';
import { InputReport } from './models/';
declare class NsSwitchHID {
    private vendorId;
    private productId;
    private serialNumber?;
    private product?;
    private type;
    private path?;
    private usage?;
    private hid;
    constructor(device: Device);
    readonly meta: {
        vendorId: number;
        productId: number;
        serialNumber: string | undefined;
        product: string | undefined;
        path: string | undefined;
        usage: number | undefined;
    };
    /**
     * Add a handler to recevice packets when device send streaming data.
     */
    addHandler(callback: (packet: InputReport) => void): void;
    /**
     * Enable IMU data will make Jon-Con sends **Input Report 0x30**.
     */
    enableIMU(): Promise<void>;
    /**
     * Disable IMU data will cancel Jon-Con to send **Input Report 0x30**.
     */
    disableIMU(): Promise<void>;
    private inputReport21Promise;
}
export declare function findControllers(): {
    joycons: NsSwitchHID[];
    proControllers: NsSwitchHID[];
};
export {};
