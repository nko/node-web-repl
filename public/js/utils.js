Array.prototype.__defineGetter__("last", function(){
  return this[this.length - 1];
});

/**
 * @param {Number} [start=0] >= 0
 * @param {Number} [end=start] >= 0
 * @see http://github.com/NV/select-text.js
 */
Element.prototype.select = function select(start, end) {
  start = start || 0;

  if (arguments.length < 2)
    end = start;
  else
    end = Math.min(end, this.textContent.length);

  var range = document.createRange();
  var node = this.firstChild;

  if (node) {

    var i = start;
    var length;

    while (i > (length = node.textContent.length)) {
      i -= length;
      node = node.nextSibling;
    }

    var startNode;
    if (node.firstChild) {
      startNode = node.firstChild;
      while (startNode.firstChild)
        startNode = startNode.firstChild;

    } else
      startNode = node;

    range.setStart(startNode, i);

    var j = end - (start - i);
    while (j > (length = node.textContent.length)) {
      j -= length;
      node = node.nextSibling;
    }

    var endNode;
    if (node.firstChild) {
      endNode = node.firstChild;
      while (endNode.firstChild)
        endNode = endNode.firstChild;

    } else
      endNode = node;

    range.setEnd(endNode, j);

  } else {
    range.setStartBefore(this);
    range.setEndBefore(this);
  }

  var selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  return this;
};


Element.prototype.__defineGetter__("selectionLeftOffset", function() {
  // Calculate selection offset relative to the current element.

  var selection = window.getSelection();
  if (!selection.containsNode(this, true))
    return null;

  var leftOffset = selection.anchorOffset;
  var node = selection.anchorNode;

  while (node !== this) {
    while (node.previousSibling) {
      node = node.previousSibling;
      leftOffset += node.textContent.length;
    }
    node = node.parentNode;
  }

  return leftOffset;
});


