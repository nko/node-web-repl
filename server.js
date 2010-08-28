require.paths.unshift('./vendor');
var sys = require("sys")
  , fs = require("fs")
  , path = require("path")
  , http = require("http")
  , repl = require("repl")
  , ws = require('websocket-server/lib/ws')
  , meryl = require('meryl/lib/meryl');
	_ = require('underscore/underscore')._;



function log(msg) {
  sys.puts(msg);
}

// I took this from http://github.com/miksago/node-websocket-server/blob/master/examples/chat-server.js
// FIXME: Serve static files with Express
function serveFile(req, res){
  if( req.url.indexOf("favicon") > -1 ){
    log("HTTP: "+req.socket.remotePort+", inbound request, served nothing, (favicon)");

    res.writeHead(200, {'Content-Type': 'image/x-icon', 'Connection': 'close', 'Content-Length': '0'});
    res.end("");
  } else {
    log("HTTP: "+req.socket.remotePort+", inbound request, served index.html");

    res.writeHead(200, {'Content-Type': 'text/html'});
    fs.createReadStream( path.normalize(path.join(__dirname, "/public/index.html")), {
      'flags': 'r',
      'encoding': 'binary',
      'mode': 0666,
      'bufferSize': 4 * 1024
    }).addListener("data", function(chunk){
      res.write(chunk, 'binary');
    }).addListener("close",function() {
      res.end();
    });
  }
}

/*-----------------------------------------------
  Spin up our server:
-----------------------------------------------*/
var httpServer = http.createServer(serveFile);


var server = ws.createServer({
  debug: true
}, httpServer);

server.addListener("listening", function(){
  log("Listening for connections.");
});

var aRepl;
var PROMPT = ">";

// Handle WebSocket Requests
server.addListener("connection", function(conn){
  log("opened connection: "+conn.id);

  aRepl = repl.start(PROMPT, conn);

  server.send(conn.id, "Connected as: "+conn.id);
  conn.broadcast("<"+conn.id+"> connected");

  conn.addListener("message", function(response){
    log("<"+conn.id+"> "+ response);
    aRepl.rli.write(response);
  });

});

server.addListener("close", function(conn){
  log("closed connection: "+conn.id);
  conn.broadcast("<"+conn.id+"> disconnected");
});

server.listen(8000);

var readFile = function (path) {
	return fs.readFileSync(__dirname + path.replace(/^\.*/, ''), 'utf-8');
}

var static = function(path) {
	return readFile('/public/' + path);
};

var render = function(viewname, data) {
	var viewCnt = readFile('/view/' + viewname + '.html');
	return _.template(viewCnt, data);
};

meryl.h('GET /static/<filepath>', function () {
	return static(this.filepath);
});

meryl.h('GET /', function() {
	return static('index.html');
});

http.createServer(meryl.cgi).listen(8080);

console.log("http -> http://localhost:8080/ ws -> ws://localhost:8000");
