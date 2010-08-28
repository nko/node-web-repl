var prompt = document.getElementById("prompt");
var prompt_line = document.getElementById("prompt_line");
var output_log = document.getElementById("log");
var suggestion = document.getElementById("suggestion");


function scrollToBottom() {
  window.scrollBy(0, document.body.scrollHeight - document.body.scrollTop);
}

function log(data){
  if (data != ">") { // FIXME

    if (typeof data == "undefined") {
      data = "undefined"
    } else if (data === null) {
      data = "null";
    }

    var group = document.createElement("div");
    group.className = "group";
    group.textContent = data;
    output_log.appendChild(group);
  }
}


var conn;
var connect = function() {
  if (window.WebSocket) {
    conn = new WebSocket("ws://"+ location.host +"/test");

    conn.onmessage = function(event) {
      try {
        // FIXME: we should send JSON everytime
        var json = JSON.parse(event.data);
      } catch (err) {
        console.warn(err);
        return;
      }

      if (json && json.length && json[0].length && json[0][0].slice) {
        var compl = json[0][0].slice(json[1].length);
        if (compl && compl != suggestion.textContent) {
          suggestion.textContent = compl;
        } else {
          suggestion.textContent = "";
        }
      } else {
        suggestion.textContent = "";
        if (!json.splice) {
          log(event.data);
        }
      }
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
  var code = prompt_line.textContent.trimRight();
  var group = document.createElement("div");
  group.className = "group";
  group.textContent = prompt.textContent;
  output_log.appendChild(group);
  conn.send(JSON.stringify({action: "execute", code: code}) );
  prompt_line.innerHTML = " ";
  prompt_line.select();
}

function accept_suggestion() {
  if (suggestion.textContent) {
    var new_value = prompt_line.textContent.trimRight() + suggestion.textContent;
    prompt_line.textContent = new_value;
    suggestion.textContent = "";
    prompt_line.select(new_value.length);
  }
}


prompt_line.addEventListener("keypress", function(event) {
  if (event.which === 13 && !event.ctrlKey && !event.altKey && !event.metaKey) { // Enter key
    execute();
    event.preventDefault();
  }
}, false);


prompt_line.addEventListener("keydown", function(event) {
  switch (event.which) {
    case 38: // Arrow Up
      //FIXME: previous history item
      break;
    case 40: // Arrow Down
      //FIXME: next history item
      break;
    case 39: // Arrow Right
    case 9:  // Tab key
      accept_suggestion();
      event.preventDefault();
      break;
    default:
      var prevCode = prompt_line.textContent.trimRight();
      if (prompt_line.selectionLeftOffset >= prevCode.length) {
        setTimeout(function() {
          var code = prompt_line.textContent.trimRight();
          if (prevCode !== code) {
            conn.send(JSON.stringify({action: "complete", code: code}));
            suggestion.textContent = "";
          }
        }, 0);
      }
      break;
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