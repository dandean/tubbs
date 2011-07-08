var util = require('./util');

// TODO: add `if` option to check if validation should occur
// TODO: add `unless` option to check if validation should NOT occur
// TODO: Should `allowBlank` be an option?
// TODO: add formatOf string shortcuts for common formats: 'email', 'phone', etc...

function isString(value) {
  return Object.prototype.toString.call(value) == '[object String]';
}

function isNumber(value) {
  return Object.prototype.toString.call(value) == '[object Number]';
}


var Model = module.exports = {
  
  /**
   * lengthOf(name[, options]) -> Function
   * - name (String): Name of the field to validate.
   * - options (Object): Optional options argument.
   *
   * **Options**
   * - min (Number)
   * - max (Number)
   * - message (String)
   * - tooShortMessage (String)
   * - tooLongMessage (String)
   * - tokenizer (Function): Executed on `value` to determine what the length is.
   * - allowUndefined (Boolean): If `undefined` is valid.
   * - allowNull (Boolean): If `null` is valid.
  **/
  lengthOf: function(name, options) {
    var o = options || {};
    var min = o.min || 0;
    var max = o.max || undefined;
    var message = o.message || '"' + name + '" is the wrong length';
    var tooLongMessage = o.tooLongMessage || message;
    var tooShortMessage = o.tooShortMessage || message;
    var tokenizer = o.tokenizer;
    
    if (min === 0 && max === undefined) {
      throw util.Error('ArgumentError', '`min` cannot be `0` while `max` is `undefined`.');
    }
    
    return {
      field: name,
      options: options || {},
      function: function(instance, value, cb) {

        // Convert the value to a String for length check, if necessary.
        if ((value === undefined && o.allowUndefined) || (value === null && o.allowNull)) {
          cb(false);
          return;

        } else if (value === undefined || value === null) {
          value = '';

        } else if (!isString(value)) {
          value = value.toString();
        }

        var length = (tokenizer) ? tokenizer(value) : value.length ;

        if (length < min) {
          cb(tooShortMessage);

        } else if (max !== undefined && length > max) {
          cb(tooLongMessage);

        } else cb(false);
      }
    };
  },


  /**
   * formatOf(name[, options]) -> Function
   * - name (String): Name of the field to validate.
   * - options (Object): Optional options argument.
   *
   * **Options**
   * - message (String): Defaults to '[name] is invalid'
   * - with (RegExp)
   * - without: (RegExp) 
   * - allowUndefined (Boolean): If `undefined` is valid.
   * - allowNull (Boolean): If `null` is valid.
  **/
  formatOf: function(name, options) {
    var o = options || {};
    var message = o.message || name + ' is invalid';
    var format = o.with;
    var notFormat = o.without;
    
    return {
      field: name,
      options: options || {},
      function: function(instance, value, cb) {
        // Convert the value to a String for format check, if necessary.
        if ((value === undefined && o.allowUndefined) || (value === null && o.allowNull)) {
          cb(false);
          return;

        } else if (value === undefined || value === null) {
          value = '';

        } else if (!isString(value)) {
          value = value.toString();
        }
        
        var failed = false;
        
        if (format && !format.test(value)) {
          cb(message);
          failed = true;
        }
        
        if (notFormat && notFormat.test(value)) {
          cb(message);
          failed = true;
        }
        
        if (!failed) cb(false);
      }
    };
  },


  /**
   * inclusionOf(name[, options]) -> Function
   * - name (String): Name of the field to validate.
   * - options (Object): Optional options argument.
   *
   * **Options**
   * - message (String): Defaults to '[name] is not included in the list'
   * - in (RegExp)
   * - allowUndefined (Boolean): If `undefined` is valid.
   * - allowNull (Boolean): If `null` is valid.
  **/
  inclusionOf: function(name, options) {
    var o = options || {};
    var message = o.message || name + ' is not included in the list.';
    var list = o.in;
    
    return {
      field: name,
      options: options || {},
      function: function(instance, value, cb) {
        if ((value === undefined && o.allowUndefined) || (value === null && o.allowNull)) {
          cb(false);
          return;
        }

        if (list && list.indexOf(value) == -1) {
          cb(message);
          return;
        }

        cb(false);
      }
    };
  },


  /**
   * exclusionOf(name[, options]) -> Function
   * - name (String): Name of the field to validate.
   * - options (Object): Optional options argument.
   *
   * **Options**
   * - message (String): Defaults to '[name] is reserved'
   * - in (RegExp)
   * - allowUndefined (Boolean): If `undefined` is valid.
   * - allowNull (Boolean): If `null` is valid.
  **/
  exclusionOf: function(name, options) {
    var o = options || {};
    var message = o.message || name + ' is reserved.';
    var list = o.in;
    
    return {
      field: name,
      options: options || {},
      function: function(instance, value, cb) {
        if ((value === undefined && o.allowUndefined) || (value === null && o.allowNull)) {
          cb(false);
          return;
        }
        
        if (list && list.indexOf(value) > -1) {
          cb(message);
          return;
        }

        cb(false);
      }
    };
  },


  /**
   * required(name[, options]) -> Function
   * - name (String): Name of the field to validate.
   * - options (Object): Optional options argument.
   *
   * **Options**
   * - message (String): Defaults to '[name] can't be blank'
  **/
  required: function(name, options) {
    var o = options || {};
    var message = o.message || name + ' can\'t be blank.';
    
    return {
      field: name,
      options: options || {},
      function: function(instance, value, cb) {
        if (value === undefined || value === null || value === '') {
          cb(message);
          return;
        }
        cb(false);
      }
    };
  },
  

  /**
   * confirmationOf(name[, options]) -> Function
   * - name (String): Name of the field to validate.
   * - options (Object): Optional options argument.
   *
   * **Options**
   * - message (String): Defaults to '[name] doesn't match confirmation'
  **/
  confirmationOf: function(name, options) {
    var o = options || {};
    var message = o.message || name + ' doesn\'t match confirmation';
    
    return {
      field: name,
      options: options || {},
      confirmation: true,
      function: function(instance, value, cb) {
        if ((value === undefined && o.allowUndefined) || (value === null && o.allowNull)) {
          cb(false);
          return;
        }
        
        if (instance[name] !== instance[name + 'Confirmation']) {
          cb(message);
          return;
        }

        cb(false);
      }
    };
  }
};