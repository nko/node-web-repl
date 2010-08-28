var prompt = document.getElementById("prompt");
var prompt_line = document.getElementById("prompt_line");
var output_log = document.getElementById("log");


function scrollToBottom() {
  window.scrollBy(0, document.body.scrollHeight - document.body.scrollTop);
}

function log(data){
  if (data != ">") {
    output_log.innerHTML += data;
  }
}


var conn;
var connect = function() {
  if (window.WebSocket) {
    conn = new WebSocket("ws://"+ location.host +"/test");

    conn.onmessage = function(event) {
      log(event.data);
    };

    conn.onclose = function() {
      log("closed");
    };

    conn.onopen = function() {
      log("opened");
    };
  }
};



document.getElementById("close").addEventListener("click", function(e) {
  if (conn) {
    conn.close();
    conn = false;
  }
  e.preventDefault();
  return false;
}, false);

document.getElementById("open").addEventListener("click", function(e) {
  if (!conn) {
    connect();
  }
  e.preventDefault();
  return false;
}, false);


function execute() {
  var code = prompt_line.textContent;
  output_log.innerHTML += prompt.textContent + "\n";
  conn.send(code);
  prompt_line.innerHTML = " <br>";
  prompt_line.select();
}


prompt_line.addEventListener("keypress", function(event) {
  if (event.which === 13) { // Enter key
    execute();
    event.preventDefault();
  }
}, false);

document.documentElement.addEventListener("click", function(event) {
  if (event.target.id == "prompt_line" || event.target.parentNode.id == "prompt_line") {
    return;
  }
  selectEnd();
}, true);


function selectEnd(){
  var l = prompt_line.textContent.length;
  prompt_line.select(l);
}


window.onload = function(){
  connect();
  selectEnd()
};