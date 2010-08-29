var sys = require("sys")
  , fs = require("fs")
  , http = require("http")
  , repl = require("repl")
  , ws = require('websocket-server')
  , express = require('express');

var disabled_modules = ['fs'];

var PORT = 80;

function log(msg) {
  sys.puts(msg);
}

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

/*-----------------------------------------------
  Spin up our websocket server:
-----------------------------------------------*/

var server = ws.createServer({ debug: true, server: app });

server.addListener("listening", function(){
  log("Listening for connections.");
});

var PROMPT = ">";

// Handle WebSocket Requests
server.addListener("connection", function(conn){
  log("opened connection: "+conn.id);
  conn.repl = repl.start(PROMPT, conn);

  conn.repl.context.require = function(x) {
    if (disabled_modules && disabled_modules.indexOf(x) > -1)
      throw 'module access is disabled';
    return require(x);
  };

  server.send(conn.id, "Connected as: "+conn.id);
  conn.addListener("message", function(response){
    var data = JSON.parse(response);
    log("<"+conn.id+"> "+ data.action + " " + data.code);
    if (data.action == "execute") {
      var lines = data.code.split(/\n/);
      for (var i=0; i<lines.length; i++) {
        conn.repl.rli.write(lines[i]);
      }
    } else if (data.action == "complete") {
      if (data.code) {
        var result = conn.repl.complete(data.code);
        if (result && result.length) {
         conn.write(JSON.stringify(result));
        }
      }
    }
  });

});

server.addListener("close", function(conn){
  log("closed connection: "+conn.id);
  conn.broadcast("<"+conn.id+"> disconnected");
});

server.listen(parseInt(process.env.PORT) || 8000);
