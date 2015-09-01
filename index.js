var argv = require('minimist')(process.argv.slice(2));
var P    = require('bluebird');
var osc  = require('osc');

// print if --help is specified
if(argv.help) {
  console.log("Usage: soscu --devicePath='/dev/ttyusbmodem'");

  console.log('\nFlags:\n');
  console.log("--devicePath='/dev/tty.usbmodem'");
  console.log("--ip='127.0.0.1'");
  console.log('--remotePort=57120');
  console.log('--localPort=65120');

  return;
}

function setupUdp() {
  return new P(function(resolve, reject) {
    var args = {
      localAddress:  argv.ip         || '127.0.0.1',
      localPort:     argv.localPort  || 65120,
      remoteAddress: argv.ip         || '127.0.0.1',
      remotePort:    argv.remotePort || 57120,
    };

    var udp = new osc.UDPPort(args);

    udp.open();

    udp.on('ready', resolve(udp));
    udp.on('error', reject);
  });
}

function setupSerial() {
  return new P(function(resolve, reject) {
    var args = {
      devicePath: argv.devicePath || '/dev/tty.usbmodem1044141'
    };

    var serial = new osc.SerialPort(args);

    serial.open();

    serial.on('ready', resolve(serial));
    serial.on('error', reject);
  });
}

setupUdp().then(function(udpPort) {
  setupSerial().then(function(serialPort) {
    // register handlers
    serialPort.on('message', function(msg) {
      // forward all incoming messages from the slip stream
      udpPort.send(msg);
    });

    serialPort.on('close', function(err) {
      // serial port closed unexpectedly
      console.error(err);
    });
  });
}).catch(function(e) {
  console.error(e);
});
