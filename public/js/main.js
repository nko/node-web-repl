var prompt = $("#prompt");
var prompt_line = $("#prompt_line");
var output_log = $("#log");
var suggestion = $("#suggestion");
var toggle = $("#toggle");

var prompt_history = [];
prompt_history.current_index = 0;

function scrollToBottom() {
  window.scrollBy(0, document.body.scrollHeight - document.body.scrollTop);
}

// loggin 
function log(data){
  data = data.trim();
  if (data != ">") { // FIXME

    if (typeof data == "undefined") {
      data = "undefined"
    } else if (data === null) {
      data = "null";
    } else {
      data = data.replace(/\\n/g, "\n").replace(/\\'/g, "'");
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
      } catch (err) {}

      if (json && json.length && json[0].length && json[0][0].slice) {
        var compl = json[0][0];
        if (compl && compl != suggestion.text()) {
          suggestion.text(compl.slice(json[1].length));
        } else {
          suggestion.text("");
        }
      } else {
        suggestion.text("");
        if (!json || !json.splice) {
          log(event.data);
        }
        scrollToBottom();
      }
    };

    conn.onclose = function() {
      log("closed");
    };

    conn.onopen = function() {
      log("opened");
    };
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
  var code = prompt_line.text().trim();
  var group = $("<div class='group input' />");
  group.text(prompt.text().trim());
  output_log.append(group);
  conn.send(JSON.stringify({action: "execute", code: code}) );
  prompt_line.html("<p><br></p>");
  prompt_line[0].select();

  if (code && prompt_history.last != code) {
    prompt_history.push(code);
  }
}

function accept_suggestion() {
  if (suggestion.text()) {
    var new_value = prompt_line.text().trimRight() + suggestion.text();
    prompt_line.text(new_value);
    suggestion.text("");
    prompt_line[0].select(new_value.length);
  }
}


prompt_line.keypress(function(event) {
  if (event.which === 13 && !event.ctrlKey && !event.altKey && !event.metaKey) { // Enter key
    execute();
    event.preventDefault();
  }
});


function prompt_history_previous() {
  if (prompt_history.current_index > 0) {
    prompt_history.current_index--;
  } else {
    prompt_history.current_index = prompt_history.length - 1;
  }
  return prompt_history[prompt_history.current_index]
}

function prompt_history_next() {
  if (prompt_history.current_index >= prompt_history.length - 1) {
    prompt_history.current_index = 0;
  } else {
    prompt_history.current_index++;
  }
  return prompt_history[prompt_history.current_index]
}

prompt_line.keydown(function(event) {
  switch (event.which) {
    case 38: // Arrow Up
      prompt_line.text(prompt_history_previous());
      selectEnd();
      event.preventDefault();
      break;
    case 40: // Arrow Down
      prompt_line.text(prompt_history_next());
      selectEnd();
      event.preventDefault();
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

connect();
selectEnd();