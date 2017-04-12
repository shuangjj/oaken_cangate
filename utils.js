/**
 * Utilitity functions w.r.t CanGateway apps.
 * 
 */

/**
 * Return CRC of the raw data.
 * 
 * @returns {Number} The CRC code.
 */
exports.calcCRC = function (bytes) {
    var crcValue = 0;
    var flag, c15;
    console.log('CRC data ' + bytes);
    for(var i = 0; i < bytes.length; i++) {
        for (var j = 0; j < 8; j++) {
            flag = (((bytes[i] >> (7-j)) & 0x0001) == 1);
            c15 = ((crcValue >> 15 & 1) == 1);
            crcValue <<= 1;
            if (c15 ^ flag) {
                crcValue ^= 0x1021;
            }
        }
    }
    crcValue ^= 0x0000;
    crcValue &= 0x0000ffff;
    return crcValue;
}

