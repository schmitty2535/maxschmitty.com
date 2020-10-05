/**
 *  @file
 *  System Performance Monitoring Client
 *
 *  This module is client for the system and performance management
 */
(function($) {

    /*
     *  REQUIRED NODE MODULES
     */
    let app                                 = require("express")();
    let sys                                 = require("util");
    let os                                  = require('os');
    let fs                                  = require("fs");
    let moment                              = require("moment");
    let net			                        = require('net');
    var http                                = require("http").Server(app);
    var io                                  = require("socket.io")(http);
    var ping                                = require('ping');
    var diskSpace                           = require('diskspace');




    var msg                                 = { type: "", value: 0 };
    var model;
    var temp;
    var diskUsedPercent                     = 0.0;

    var clientSocket;
    var consoleServerPort                   = 6000;
    var openhabClient                       = "192.168.1.22";
    let connected                           = false;


    var consoleServer                           = net.createServer();
    consoleServer.on('connection', function (sock) {

        clientSocket                        = sock;

        /*
         *  When a client connection is closed .......
         */
        sock.on('close', function() {
            connected                           = false;
            // try to reconnect every 5 seconds if the connection fails
            console.log("Connection Lost");
        });

        /*
         *  Process incoming messages from client
         */
        sock.on('data', function (data) {
            try {
                var msg                     = JSON.parse(data);

                switch (msg.type) {
                    //Connect Message
                    case 'connect':
                        //console.log(msg);
                        console.log("Connected to: " + openhabClient);
                        sock.write(JSON.stringify({ type: "cack"}));
                        break;
                    case 'openhabStats':
                        var roundOHS = msg.temp;
                        var diskUsedPercentOHS = msg.diskStatus;
                        //console.log(round);

                        io.emit('homeautom', JSON.stringify({ type: 'openhabStats', value: roundOHS, status: diskUsedPercentOHS }));
                        //io.emit('homeautom', JSON.stringify({ type: 'spaceOHS', status: diskUsedPercentOHS}));
                        break;
                    case 'dash1stats':
                        var roundOHD1 = msg.temp;
                        var diskUsedPercentOHD1 = msg.diskStatus;
                        //console.log(round);

                        io.emit('homeautom', JSON.stringify({ type: 'cpuTempOHD1', value: roundOHD1 }));
                        io.emit('homeautom', JSON.stringify({ type: 'spaceOHD1', status: diskUsedPercentOHD1}));
                        break;
                    default:
                        break;
                }
            } catch (ex) {
                console.log(ex.message);
            }
        });

        sock.on('error', (error) => {
           console.log(error.message);
        });
    });
    consoleServer.listen(consoleServerPort, function () {
       console.log("Communication Port:  " + consoleServerPort);
    });




    setInterval(function () {
        var hosts = [openhabClient, "192.168.1.54"];  //a sting of IP addresses which will be pinged
        hosts.forEach(function(host) {
            ping.sys.probe(host, function (isAlive) {  //checking to see if each host is alive or not
                io.emit('homeautom', JSON.stringify({ type: 'ping', status: isAlive }));  //emitting a message with type ping and a status of isAlive(which is a true or false statement)
                var ping = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';    //creating a variable ping based on the state of "isAlive" either "host 'host' is alive" or "host 'host' is dead"
                console.log(ping); //logging the variable ping
            });
        })
    },10000)    //running the function every 5 seconds


    //Server Temp Handling
    setInterval(function() {
        try {
             temp = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp")/1000;
             var temp=Math.round(temp);
        }  catch (ex) {
            model                               = "unknown";
        }
        //io.emit('homeautom', JSON.stringify({ type: 'cpuTemp', value: round }));        //update the value of time
        console.log(temp);
    }, 10000);


//
// Websocket connection handling
//
    app.get('/', function(request, response) {
    //	console.log(__dirname + '/index.html');
        response.sendFile(__dirname + '/index.html');
    });
    app.get(/^(.+)$/, function(request, response) {
        response.sendFile(__dirname + request.params[0]);
    })

    io.on('connection', function(socket) {
//    	console.log("a ws socket request was received...");
    
        client                                  = socket;

        socket.on('isoiom17427', function(data) {

            try {
                msg                             = JSON.parse(data);

                    switch(msg.type) {
                        case 'on':   
                            if (msg.value == 'on'){
                                comm.moduleRegWrite(MODULE_ADDR_ISOIOM17427, 0x10, 0x03);
                                console.log("on");

                            } else if (msg.value == 'off'){
                                comm.moduleRegWrite(MODULE_ADDR_ISOIOM17427, 0x10, 0x08);
                                console.log("off");
                            }                         
                            break;
                }
            } catch (ex) { 
                console.log(ex.message);
            } 
        });
    });

    http.listen(80, function() {  //port used to open web app
        //   console.log("http listening on port 5555...");
    });

})();