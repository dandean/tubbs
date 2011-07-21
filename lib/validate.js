var util = require('./util');

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
    options = options || {};
    var min = options.min || 0;
    var max = options.max || undefined;
    var message = options.message || '"' + name + '" is the wrong length';
    var tooLongMessage = options.tooLongMessage || message;
    var tooShortMessage = options.tooShortMessage || message;
    var tokenizer = options.tokenizer;
    
    if (min === 0 && max === undefined) {
      throw util.Error('ArgumentError', '`min` cannot be `0` while `max` is `undefined`.');
    }
    
    return {
      fieldName: name,
      options: options,
      fn: function(instance, value, cb) {

        // Convert the value to a String for length check, if necessary.
        if ((value === undefined && options.allowUndefined) || (value === null && options.allowNull)) {
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
    options = options || {};
    var message = options.message || name + ' is invalid';
    var format = options.with;
    var notFormat = options.without;
    
    if (!format && !notFormat) {
      throw util.Error('ArgumentError', '`with` and/or `without` options are required.');
    }
    
    return {
      fieldName: name,
      options: options,
      fn: function(instance, value, cb) {
        if ((value === undefined && options.allowUndefined) || (value === null && options.allowNull)) {
          cb(false);
          return;

        } else if (value === undefined || value === null) {
          // Convert the value to a String for format check, if necessary.
          value = '';

        } else if (!isString(value)) {
          value = value.toString();
        }
        
        // Do NOT return early so that we can test both `with` and `without`
        // options, and return messages for both if necessary.
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
    options = options || {};
    var message = options.message || name + ' is not included in the list.';
    var list = options.in;
    
    return {
      fieldName: name,
      options: options,
      fn: function(instance, value, cb) {
        if ((value === undefined && options.allowUndefined) || (value === null && options.allowNull)) {
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
    options = options || {};
    var message = options.message || name + ' is reserved.';
    var list = options.in;
    
    return {
      fieldName: name,
      options: options,
      fn: function(instance, value, cb) {
        if ((value === undefined && options.allowUndefined) || (value === null && options.allowNull)) {
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
    options = options || {};
    var message = options.message || name + ' can\'t be blank.';
    
    return {
      fieldName: name,
      options: options,
      fn: function(instance, value, cb) {
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
    options = options || {};
    var message = options.message || name + ' doesn\'t match confirmation';
    
    return {
      fieldName: name,
      options: options,
      confirmation: true,
      fn: function(instance, value, cb) {
        if ((value === undefined && options.allowUndefined) || (value === null && options.allowNull)) {
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