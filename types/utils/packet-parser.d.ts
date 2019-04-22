/// <reference types="node" />
import { BatteryLevel } from '../models/';
export declare function parseInputReportID(rawData: Buffer, data: RegExpMatchArray): {
    _raw: Buffer;
    _hex: string[];
};
export declare function parseTimer(rawData: Buffer, data: RegExpMatchArray): {
    _raw: Buffer;
    _hex: string[];
};
export declare function parseBatteryLevel(rawData: Buffer, data: RegExpMatchArray): {
    _raw: Buffer;
    _hex: string;
    level: BatteryLevel;
};
export declare function parseConnectionInfo(rawData: Buffer, data: RegExpMatchArray): {
    _raw: Buffer;
    _hex: string;
};
export declare function parseButtonStatus(rawData: Buffer, data: RegExpMatchArray): {
    _raw: Buffer;
    _hex: string[];
};
export declare function parseCompleteButtonStatus(rawData: Buffer, data: RegExpMatchArray): {
    _raw: Buffer;
    _hex: string[];
    y: boolean;
    x: boolean;
    b: boolean;
    a: boolean;
    r: boolean;
    zr: boolean;
    down: boolean;
    up: boolean;
    right: boolean;
    left: boolean;
    l: boolean;
    zl: boolean;
    sr: boolean;
    sl: boolean;
    minus: boolean;
    plus: boolean;
    rightStick: boolean;
    leftStick: boolean;
    home: boolean;
    caputure: boolean;
    chargingGrip: boolean;
};
export declare function parseAnalogStick(rawData: Buffer, data: RegExpMatchArray): {
    _raw: Buffer;
    _hex: string[];
};
export declare function parseAnalogStickLeft(rawData: Buffer, data: RegExpMatchArray): {
    _raw: Buffer;
    _hex: string[];
    horizontal: number;
    vertical: number;
};
export declare function parseAnalogStickRight(rawData: Buffer, data: RegExpMatchArray): {
    _raw: Buffer;
    _hex: string[];
    horizontal: number;
    vertical: number;
};
export declare function parseFilter(rawData: Buffer, data: RegExpMatchArray): {
    _raw: Buffer;
    _hex: string[];
};
export declare function parseVibrator(rawData: Buffer, data: RegExpMatchArray): {
    _raw: Buffer;
    _hex: string[];
};
export declare function parseAck(rawData: Buffer, data: RegExpMatchArray): {
    _raw: Buffer;
    _hex: string[];
};
export declare function parseReplySubcommand(rawData: Buffer, data: RegExpMatchArray): {
    _raw: Buffer;
    _hex: string[];
};
export declare function parseAccelerometers(rawData: Buffer, data: RegExpMatchArray): {
    x: {
        _raw: Buffer;
        _hex: string[];
        acc: number;
    };
    y: {
        _raw: Buffer;
        _hex: string[];
        acc: number;
    };
    z: {
        _raw: Buffer;
        _hex: string[];
        acc: number;
    };
}[];
export declare function parseGyroscopes(rawData: Buffer, data: RegExpMatchArray): {
    _raw: Buffer;
    _hex: string[];
    dps: number;
    rps: number;
}[][];
export declare function calculateActualAccelerometer(accelerometers: number[][]): {
    x: number;
    y: number;
    z: number;
};
export declare function calculateActualGyroscope(gyroscopes: number[][]): number[];
