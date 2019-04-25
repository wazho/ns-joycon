export interface IDeviceInfo {
    firmwareVersion: {
        major: number;
        minor: number;
    };
    type: string;
    macAddress: string;
    spiColorInUsed: boolean;
}
export declare type InputReportMode = 'standard-full-mode' | 'simple-hid-mode';
