var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var sys = require('util');
var exec = require('child_process').exec;
var queue = require('express-queue');
var child;
app.use(queue({ activeLimit: 1 }));
app.use(bodyParser.json());       // to support JSON-encoded bodies

var rpi433    = require('rpi-433'),
    rfSniffer = rpi433.sniffer({
      pin: 27,                     //Snif on GPIO 2 (or Physical PIN 13)
      debounceDelay: 500          //Wait 500ms before reading another code
    }),
    rfEmitter = rpi433.emitter({
      pin: 0,                     //Send through GPIO 0 (or Physical PIN 11)
      pulseLength: 350            //Send the code with a 350 pulse length
    });

// Receive (data is like {code: xxx, pulseLength: xxx})
rfSniffer.on('data', function (data) {
  console.log('Code received: '+data.code+' pulse length : '+data.pulseLength);
  if (data.equals("70929")) {
    console.log("hola");
  }
});

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});



// JSON API
app.post('/switch',function (req,res){
    console.log(req.body);
    var systemCode = req.body.systemCode;
    var socketNumber = req.body.socketNumber;
    var status = req.body.status;
    var executedString = systemCode + " " + socketNumber;
    executeSudoSend(executedString + " " + status, res);

});

app.post('/switchallon',function (req,res){
    console.log(req.body);
    var status = 1;
    var executedString= "";
    req.body.forEach( function (jsonPart){
        executedString+=jsonPart.systemCode + " "+ jsonPart.socketNumber + " ";
    });
    executeSudoSend(executedString + " " + status, res);
});

app.post('/switchalloff',function (req,res){
    console.log(req.body);
    var status = 0;
    var executedString = "";
    req.body.forEach( function (jsonPart){
        executedString+=jsonPart.systemCode + " "+ jsonPart.socketNumber + " ";
    });

    executeSudoSend(executedString + " " + status, res);
});

function executeSudoSend(string,res){
    child = exec('sudo /home/pi/raspberry-remote/send '+ string, function (error, stdout, stderr) {
      sys.print('stdout: ' + stdout);
      sys.print('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
        res.sendStatus(500);
      } else {
        res.sendStatus(200);
      }
  });
};

// Start server
var port= 8081;
app.listen(port);
console.log("Server running at http://localhost:" + port );
