function isString(value) {
  return Object.prototype.toString.call(value) == '[object String]';
}

function isNumber(value) {
  return Object.prototype.toString.call(value) == '[object Number]';
}

var Model = module.exports = {
  lengthOf: function(name, options) {
    var t = this; // scoped to model
    var o = options || {};
    var min = o.min || 0;
    var max = o.max || undefined;
    var message = o.message || 'Property "' + name + '" is the wrong length';
    var tooLongMessage = o.tooLongMessage || message;
    var tooShortMessage = o.tooShortMessage || message;
    
    return {
      field: name,
      options: options || {},
      function: function(value, cb) {
        if (isNumber(value)) value += '';

        if (!isString(value)) {
          cb(message);
          return;
        }

        var length = value.length;

        if (length < min) {
          cb(tooShortMessage);

        } else if (max !== undefined && length > max) {
          cb(tooLongMessage);

        } else cb(false);
      }
    };
  }
};