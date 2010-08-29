var fs = require("fs");

for (var key in fs) {
  exports[key] = "FS is disabled."
}