var fs = require("fs")
  , path = require("path")
  , http = require("http")
  , repl = require("repl")
  , io = require('socket.io')
  , express = require('express');

var PORT = 80,
    PROMPT = ">";
    
var aRepl;

/*-----------------------------------------------
  Spin up our web server:
-----------------------------------------------*/

var app = express.createServer();

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyDecoder());
    app.use(app.router);
    app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

app.get('/', function(req, res){
  res.sendfile('public/index.html');
});

app.listen(PORT);

/*-----------------------------------------------
  Spin up our websocket server:
-----------------------------------------------*/

var socket = io.listen(app);

socket.on('connection', function(client){
  console.log("opened connection: " + client.sessionId);
  aRepl = repl.start(PROMPT, client);
  client.send("Connected as: " + client.sessionId);
  
  client.on('message', function(msg) {
    var data = JSON.parse(msg);
    console.log("<"+client.sessionId+"> "+ data.action + " " + data.code);
    if (data.action == "execute") {
      var lines = data.code.split(/\n/);
      for (var i=0; i<lines.length; i++) {
        aRepl.rli.write(lines[i]);
      }
      client.send(data.code);
    } else if (data.action == "complete") {
      if (data.code) {
        var result = aRepl.complete(data.code);
        if (result && result.length) {
         client.send(JSON.stringify(result));
        }
      }
    }
  });
  
  client.on('disconnect', function(){  })
});

console.log('listening: ' + PORT);