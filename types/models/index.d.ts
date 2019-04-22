/// <reference types="node" />
interface IPacketBuffer {
    _raw: Buffer;
    _hex: String | String[];
}
export declare type BatteryLevel = 'full' | 'medium' | 'low' | 'critical' | 'empty' | 'charging';
interface IBatteryLevel extends IPacketBuffer {
    level: BatteryLevel;
}
interface IButtonStatus extends IPacketBuffer {
    y: Boolean;
    x: Boolean;
    b: Boolean;
    a: Boolean;
    r: Boolean;
    zr: Boolean;
    down: Boolean;
    up: Boolean;
    right: Boolean;
    left: Boolean;
    l: Boolean;
    zl: Boolean;
    sr: Boolean;
    sl: Boolean;
    minus: Boolean;
    plus: Boolean;
    rightStick: Boolean;
    leftStick: Boolean;
    home: Boolean;
    caputure: Boolean;
    chargingGrip: Boolean;
}
interface IAnalogStick extends IPacketBuffer {
    horizontal: number;
    vertical: number;
}
interface IStandardInputReport {
    inputReportID: IPacketBuffer;
    timer: IPacketBuffer;
    batteryLevel: IBatteryLevel;
    connectionInfo: IPacketBuffer;
    buttonStatus: IButtonStatus;
    analogStickLeft: IAnalogStick;
    analogStickRight: IAnalogStick;
    vibrator: IPacketBuffer;
}
export declare type Accelerometer = {
    x: IPacketBuffer & {
        acc: number;
    };
    y: IPacketBuffer & {
        acc: number;
    };
    z: IPacketBuffer & {
        acc: number;
    };
};
export declare type Gyroscope = Array<IPacketBuffer & {
    dps: number;
    rps: number;
}>;
export interface IInputReport0x21 extends IStandardInputReport {
    ack: IPacketBuffer;
    replySubcommand: IPacketBuffer;
}
export interface IInputReport0x30 extends IStandardInputReport {
    accelerometers: Accelerometer[];
    gyroscopes: Gyroscope[];
    actualAccelerometer: {
        acc: {
            x: number;
            y: number;
            z: number;
        };
    };
    actualGyroscope: {
        dps: number[];
        rps: number[];
    };
}
export interface IInputReport0x3f {
    inputReportID: IPacketBuffer;
    buttonStatus: IPacketBuffer;
    analogStick: IPacketBuffer;
    filter: IPacketBuffer;
}
export declare type InputReport = IInputReport0x3f | IInputReport0x21 | IInputReport0x30;
export {};
