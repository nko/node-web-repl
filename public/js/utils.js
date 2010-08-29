Array.prototype.__defineGetter__("last", function(){
  return this[this.length - 1];
});

/**
 * @param {Number} [start=0] >= 0
 * @param {Number} [end=start] >= 0
 * @see http://github.com/NV/select-text.js
 */