This project is an implementation from [dekuNukem/Nintendo_Switch_Reverse_Engineering](https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering) by Node.js.

## Quick start

Connect your Joy-Con(s) using bluetooth with PC (currently Linux only). And then execute commands below.

```shell
npm install
# Root permission necessary.
npm start
```

## Extraction

* [x] Basic info (e.g. mac, battery, ... etc)
* [x] Buttons
* [x] Analog Sticks
* [x] Accelerometer
* [x] Gyroscope

### Sample data

```jsonc
// Joy-Con (R)
{
  "inputReportID": "30",
  "timer": "2c",
  "batteryLevel": "8",
  "connectionInfo": "e",
  "buttonStatus": [ "00", "00", "00" ],
  "analogStickLeft": [ "00", "00", "00" ],
  "analogStickRight": [ "bc", "38", "74" ],
  "vibrator": "09",
  "accelerometers":
   [ { "x": [ "f7", "0d" ], "y": [ "06", "f8" ], "z": [ "94", "fd" ] },   // 5ms
     { "x": [ "f3", "0d" ], "y": [ "c6", "f7" ], "z": [ "b9", "fd" ] },   // 10ms
     { "x": [ "00", "0e" ], "y": [ "9e", "f7" ], "z": [ "b4", "fd" ] } ], // 15ms
  "gyroscopes":
   [ [ [ "59", "fc" ], [ "52", "fe" ], [ "a8", "f9" ] ],  // 5ms
     [ [ "66", "fc" ], [ "92", "fe" ], [ "60", "fa" ] ],  // 10ms
     [ [ "6e", "fc" ], [ "c6", "fe" ], [ "16", "fb" ] ] ] // 15ms
}
```
