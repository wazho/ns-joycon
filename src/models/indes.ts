interface IStandardInputReport {
    inputReportID: string;
    timer: string;
    batteryLevel: string;
    connectionInfo: string;
    buttonStatus: string[];
    analogStickLeft: string[];
    analogStickRight: string[];
    vibrator: string;
};

export type Accelerometer = {
    x: string[];
    y: string[];
    z: string[];
};

export type Gyroscope = string[][];

export interface IInputReport0x21 extends IStandardInputReport {
    ack: string;
    replySubcommand: string;
};

export interface IInputReport0x30 extends IStandardInputReport {
    accelerometers: Accelerometer[];
    gyroscopes: Gyroscope[];
};

export interface IInputReport0x3f {
    inputReportID: string;
    buttonStatus: string[];
    analogStick: string;
    filter: string[];
};

export type InputReport = IInputReport0x3f | IInputReport0x21 | IInputReport0x30;
