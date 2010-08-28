var prompt = $("#prompt");
var prompt_line = $("#prompt_line");
var output_log = $("#log");
var suggestion = $("#suggestion");
var toggle = $("#toggle");

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

    var group = $("<div class='group' />");
    group.text(data);
    output_log.append(group);
  }
}


var conn;
function connect() {
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
        var compl = json[0][0];
        if (compl && compl != suggestion.text()) {
          suggestion.text(compl.slice(json[1].length));
        } else {
          suggestion.text("");
        }
      } else {
        suggestion.text("");
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
  } else {
    $(document.body).addClass("error").html("<h1>Your browser does not support WebSockets :-(</h1>");
  }
}


// Toggle Connection
toggle.click(function(e) {
  e.preventDefault();

  if (/close/gi.test(this.innerHTML)) {
    if (conn) {
      conn.close();
      conn = false;
      this.innerHTML = "Open Connection";
      this.className = "off";
    }
  } else {
    if (!conn) {
      connect();
      this.innerHTML = "Close Connection";
      this.className = "on"; 
    }
  }
});

function execute() {
  var code = prompt_line.text().trimRight();
  var group = document.createElement("div");
  group.className = "group";
  group.textContent = prompt.textContent;
  output_log.append(group);
  conn.send(JSON.stringify({action: "execute", code: code}) );
  prompt_line.html(" ");
  prompt_line[0].select();
}

function accept_suggestion() {
  if (suggestion.text()) {
    var new_value = prompt_line.text().trimRight() + suggestion.text();
    prompt_line.text(new_value);
    suggestion.text();
    prompt_line[0].select(new_value.length);
  }
}


prompt_line.keypress(function(event) {
  if (event.which === 13 && !event.ctrlKey && !event.altKey && !event.metaKey) { // Enter key
    execute();
    event.preventDefault();
  }
});


prompt_line.keydown(function(event) {
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
      var prevCode = prompt_line.text().trimRight();
      if (prompt_line[0].selectionLeftOffset >= prevCode.length) {
        setTimeout(function() {
          var code = prompt_line.text().trimRight();
          if (prevCode !== code) {
            conn.send(JSON.stringify({action: "complete", code: code}));
            suggestion.text("");
          }
        }, 0);
      }
      break;
  }
});


$(document.documentElement).click(function(event) {
  if (event.target.id == "prompt_line" || event.target.parentNode.id == "prompt_line") {
    return;
  }
  selectEnd();
}, true);


function selectEnd(){
  var l = prompt_line.text().length;
  prompt_line[0].select(l);
}


window.onload = function(){
  connect();
  selectEnd()
};
