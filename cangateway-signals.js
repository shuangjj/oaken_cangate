/**
 *
 *
 */
/**
 * Can-Gateway Signal Definitons.
 *
 * @license Apache-2.0 (TBD)
 */
const utils = require('./utils');

/**
 * Vechicle Signal Request Wrapper.
 *
 * @constructor
 */

// +-------------------+---------------------------------------------------+-------------+
// |        Header     |                         Data                      |  Footer     | 
// +-------------------+---------------------------------------------------+-------------+
// | S  |  Len  | Type | Num | Req. ID[1] | Req. ID[2] | ... |  Req. ID[N] | CRC   | END |
// +----+-------+------+-----+------------+------------+-----+-------------+-------+-----+
// | 7E | XX XX | 01   | XX  | XX XX      | XX XX      | ... | XX XX       | XX XX | 7F  |
// +----+-------+------+-----+------------+------------+-----+-------------+-------+-----+
function VehicleSignalRequest() {
    var self = this;
    self.signals = [];
}


/**
 * Add signal to the reqeusted signal list.
 *
 * @param {Number} signalID The signal ID.
 */
VehicleSignalRequest.prototype.addSignal = function (signalID) {
    var self = this;
    self.signals.push(signalID);
}

/**
 * Get message raw data.
 * 
 * @returns {Array} The raw data in bytes.
 */
VehicleSignalRequest.prototype.getRawData = function () {
    var self = this;
    var bytes = [];
    var numSignals = self.signals.length;
    var msgLen = numSignals * 2 + 1 + 1;

    bytes.push(0x7E);
    bytes.push(msgLen>>8&0xFF);
    bytes.push(msgLen&0xFF);
    bytes.push(0x01);
    bytes.push(numSignals&0xFF);
    for(var i = 0; i < self.signals.length; i++) {
        bytes.push(self.signals[i]>>8&0xFF);
        bytes.push(self.signals[i]&0xFF);
    }
    // -$- Calculate CRC -$-
    var msgCrc = utils.calcCRC(bytes.slice(1));
    console.log('CRC: %s ', msgCrc.toString(16));
    bytes.push(msgCrc>>8&0xFF);
    bytes.push(msgCrc&0xFF);
    //
    bytes.push(0x7F);
    return bytes;
}

/******************************** Response ************************************/

function CanGatewaySignals() {
    var self = this;
    self.version = "1.0.0", 
    self.SignalStatus = Object.freeze ({
        NORMALITY_VALUE = 0x0;
        UNSUPPORTED_SIGNAL = 0x8;
        INVALID_VALUE = 0xA;
        UNEXPECTED_VALUE = 0xB;
        EM_UNCONNECTED = 0xC;
        EM_UNEXPECTED = 0xD;
    }); 
    self.SignalCategories = Object.freeze( {
        TIMESTAMP: 1,
        DRIVING_OPERATION: 2,
        VEHICLE_STATUS: 3,
        GPS_GNSS: 4,
        PRIUS: 5
    });

    self.signals = [
        {id: 1, name: "Timestamp", parse: self._parseTimestamp},
        {id: 2, name: "Accelerator Position", parse: self._parseAccelPos},
        {id: 3, name: "Brake Pedal Status", parse: self._parseBrakePedalStatus},
        {id: 4, name: "Parking Brake Status", parse: self._parseParkingBrakeStatus}

    ];
    
}

CanGatewaySignals.prototype._parseTimestamp = function (value) {
    var body = {};
    body.timestamp = value;
    //body.repr = 
    // TODO: add other representations.
    return body;
}

CanGatewaySignals.prototype._parseAccelPos = function (value) {
    var body = {};
    body.accelPercent = value & 0x7F; 
    body.repr = value.toString() + '%';
    return body;
}

// TODO
CanGatewaySignals.prototype._parseBrakePedalStatus = function (value) {
    var body = {};

}

CanGatewaySignals.prototype._parseParkingBrakeStatus = function (value) {
}

/**
 * Parse signal based on ID and value.
 * 
 * @param {Number} sigID - Signal ID.
 * @param {Number} sigValue - 32-bits signal value.
 * @returns The signal object or null.
 */
CanGatewaySignals.prototype.parse = function (sigID, sigValue) {
    for (var i = 0; i < self.signals.length; i++) {
        if (sigID == self.signals[i].id) {
            return {id: sigID, name: self.signals[i].name, 
                body: self.signals[i].parse(sigValue)}
        }
    }
    return null;
}

/**
 * Vehicle Signal Response 
 *
 * @constructor
 */
function VehicleSignalResponse (rawData) {
    var self = this;
    self.rawData = rawData;
    self.signals = [];
}

/**
 * Parse message data block into signal objects.
 */

// +------+--------------+-------------------------------------------+
// |Status|   Signal ID  |                    Vaue                   |
// +------+--------------+----------+----------+---------------------+
// |  Byte 0  |  Byte 1  |  Byte 2  |  Byte 3  |  Byte 4  |  Byte 5  |
// +----------+----------+----------+----------+----------+----------+

VehicleSignalResponse.prototype.decodeSignals = function () {
    var self = this;
    var numOfSignals = self.rawData[4];
    var cansignals = new CanGatewaySignals();
    for (var i = 0; i < numOfSignals; i++) {
        var status = self.rawData[5] & 0xF0 >> 4;
        if (status == cansignals.SignalStatus.NORMALITY_VALUE) {

            var sigID = self.rawData[5] & 0x0F << 8 + self.rawData[6];
            var sigValue = self.rawData[7] << 24
                + self.rawData[8] << 16
                + self.rawData[9] << 8
                + self.rawData[10];
            self.signals.push(cansignals.decode(sigID, sigValue));
        }
    }
}

/**
 * Validate vehicle signal response message.
 * 
 * @throws {Error} Message must in line with the format.
 * @returns {Boolean} Return true if message is valid.
 */
VehicleSignalResponse.prototype.validate = function () {
    var self = this;
    if (self.rawData[0] != 0x7E) {
        throw new Error('Not a valid "Start" value!');
    }
    var dataLength = (self.rawData[1] << 8 & 0xFF00) + (self.rawData[2] & 0xFF);
    if ( dataLength < 8) {
        throw new Error('Length is not correct!');
    }
    // CRC
    var calcCrc = utils.calcCRC(self.rawData.slice(1, dataLength+2));
    var msgCrc = (self.rawData[dataLength+2] << 8 & 0xFF00) + 
        (self.rawData[dataLength+3] & 0xFF);
    if (calcCrc != msgCrc) {
        throw new Error('CRC is not correct!');
    }

    if (self.rawData[dataLength+4] != 0x7F) {
        throw new Error('Not a valid "End" value!');
    }
    return true; 
}

module.exports = exports = {
    VehicleSignalRequest : VehicleSignalRequest,
    VehicleSignalResponse : VehicleSignalResponse
};

