interface IPacketBuffer {
    _raw: Buffer;
    _hex: String | String[];
};

export type BatteryLevel = 'full' | 'medium' | 'low' | 'critical' | 'empty' | 'charging';

interface IBatteryLevel extends IPacketBuffer {
    level: BatteryLevel;
};

interface IButtonStatus extends IPacketBuffer {
    // Byte 3 (Right Joy-Con)
    y: Boolean;
    x: Boolean;
    b: Boolean;
    a: Boolean;
    r: Boolean;
    zr: Boolean;
    // Byte 5 (Left Joy-Con)
    down: Boolean;
    up: Boolean;
    right: Boolean;
    left: Boolean;
    l: Boolean;
    zl: Boolean;
    // Byte 3,5 (Shared)
    sr: Boolean;
    sl: Boolean;
    // Byte 4 (Shared)
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
};

export type Accelerometer = {
    x: string[];
    y: string[];
    z: string[];
};

export type Gyroscope = string[][];

export interface IInputReport0x21 extends IStandardInputReport {
    ack: IPacketBuffer;
    replySubcommand: IPacketBuffer;
};

export interface IInputReport0x30 extends IStandardInputReport {
    accelerometers: Accelerometer[];
    gyroscopes: Gyroscope[];
};

export interface IInputReport0x3f {
    inputReportID: IPacketBuffer;
    buttonStatus: IPacketBuffer;
    analogStick: IPacketBuffer;
    filter: IPacketBuffer;
};

export type InputReport = IInputReport0x3f | IInputReport0x21 | IInputReport0x30;
