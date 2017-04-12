/*
 * CANGatewayECU NodeJS Client.
 *
 */

const BluetoothSerialPort = require('bluetooth-serial-port');            
const rfcomm = new BluetoothSerialPort.BluetoothSerialPort();                   

var cansignal = require('./cangateway-signals');
                                                                                
rfcomm.on('found', function (address, name) {                                   
    console.log('found device:', name, 'with address:', address);               

    if (name == 'Xperia Z2') {
        rfcomm.removeAllListeners('finished');
        rfcomm.removeAllListeners('found');
        
        rfcomm.findSerialPortChannel(address,  function (channel) {
            console.log('Find device channel ' + channel);

            rfcomm.connect(address, channel, function () {
                console.log('Connected to device ' + address);
                var request = new cansignal.VehicleSignalRequest();
                request.addSignal(13);
                var raw =  request.getRawData();
                console.log(raw);
                rfcomm.write(new Uint8Array(raw), function (err) {
                    if (err) {
                        console.log('Error write to OBD: ' + err);
                    }
                });
            }, function (err) {
                console.log('Error connecting to OBDII device ' + err);
            });
        }, function (err) {
            console.log('Error finding serial port channel ' + err);
        });
    }
});                                                                             

rfcomm.on('data', function (data) {
    console.log(data);
});
                                                                                
rfcomm.on('finished', function () {                                             
  console.log('inquiry finished');                                              
});                                                                             
                                                                                
console.log('start inquiry');                                                   
rfcomm.inquire();                                                               

/**
 * CAN Gateway ECU Client.
 *
 * @constructor
 */
function CANGatewayECU() {
    var self = this;
}




