var OBDReader = require('bluetooth-obd');
var btOBDReader = new OBDReader();
var dataReceivedMarker = {};

btOBDReader.on('connected', function () {
    //this.requestValueByName("vss"); //vss = vehicle speed sensor
    console.log('Connected');

    this.addPoller("vss");
    this.addPoller("rpm");
    this.addPoller("temp");
    this.addPoller("load_pct");
    this.addPoller("map");
    this.addPoller("frp");

    this.startPolling(5000); //Request all values each second.
});

btOBDReader.on('dataReceived', function (data) {
    console.log(data);
    dataReceivedMarker = data;
});

// Use first device with 'obd' in the name
btOBDReader.autoconnect('OBDII');
