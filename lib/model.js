var util = require('./util');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

/**
 * noop() -> undefined
 * Does nothing, used as a fallback when callback isn't provided.
**/
function noop() {}

var createId = (function() {
  var id = -1;
  return function() { return '__' + ++id + '__'; };
})();

/**
 * class Tubbs
 *
 * new Tubbs(data) -> Tubbs
 * data (Object): Hash of data to apply to the model.
**/
function Tubbs(data) {
  EventEmitter2.call(this);

  // Create a "fields" property on the instance for local data.
  Object.defineProperty(this, 'fields', {
    // Inherit from the constructor's prototype's `fields` property.
    value: Object.create(this.constructor.prototype.fields)
  });
  
  data = data || {};
  
  for (var key in this) {
    if (key in data) {
      this[key] = data[key];
    } else {
      // Trigger the getter, which calls default value functions if configured.
      var x = this[key];
    }
  }

  // Every instance has a unique client ID.
  Object.defineProperty(this, '__cid__', {
    value: createId()
  });
  
  if (this.initialize) this.initialize();
  this.initialized = true;

  // Emit "new" event on next tick so that the instance exists within the Model
  // dataStore when handlers are notified.
  setTimeout(function() {
    this.constructor.emit('new', this);
  }.bind(this), 0)
}

// Extend EventEmitter2
Tubbs.prototype = Object.create(EventEmitter2.prototype);

Object.defineProperties(Tubbs.prototype, {
  
  // Define 'fields' object on Tubbs base. Model class's `fields' property will
  // use this as their __proto__ object.
  fields: {
    value: {}
  },

  /**
   * Tubbs#toJSON() -> Object
   * Returns an object representing the model which is ready for serialization.
  **/
  toJSON: {
    value: function() {
      var json = {};
      
      for (var key in this.fields) {
        if (key == this.constructor.primaryKey && this.isNew) continue;
        var value = this[key];
        json[key] = value;
      }

      return json;
    },
    configurable: true
  },

  inspect: {
    value: function() {
      var primaryKey = this.constructor.primaryKey;
      var out = 'Tubbs<#';
      if (primaryKey in this) {
        out += this[primaryKey];
      }
      out += ' ';

      var json = {};
      var i = 0;
      var broke = false;

      for (var key in this) {
        if (this[key] instanceof Function || key == primaryKey) continue;

        if (i > 4) {
          broke = true;
          break;
        }

        json[key] = this[key];
        i++;
      }
      out += JSON.stringify(json);
      out += (broke) ? ' ...' : '' ;
      out += ' >';
      return out;
    },
    configurable: true
  },

  save: {
    value: function(cb) {
      this.constructor.save(this, cb);
    },
    configurable: true
  },

  delete: {
    value: function(cb) {
      this.constructor.delete(this, cb);
    },
    configurable: true
  },

  errors: { value: {} },
  
  addError: {
    value: function(field, message) {
      if (!this.errors[field]) this.errors[field] = [];
      this.errors[field].push(message);
    },
    configurable: true
  },

  validate: {
    value: function(cb) {
      if (!cb) {
        throw util.Error('ArgumentError', 'Tubbs#validate requires a callback function.');
      }
      
      var index = 0;
      var t = this;

      // Empty out the errors object
      Object.keys(this.errors).forEach(function(key) {
        delete t.errors[key];
      });

      var validators = [];

      // Collapse the validators into a single array.
      for (var key in this.validators) {
        validators = validators.concat(this.validators[key]);
      }
      
      // TODO: It might be wise to filter the validators array before iterating.
      // TODO: Filtering could keep us from accidentally thinking we're done if
      // TODO: a falsy value slips into the array of validators.
      
      // Async iterate over each validation function. This will allow for
      // async IO during validation.
      var valid = true;
      var next = function() {
        var validator = validators[index];
        
        if (!validator) { // We've run out of validators -- call complete() !
          complete();
          return;
        }

        var name = validator.fieldName;
        
        var proceed = function() {
          index++;
          next();
        };
        
        var options = validator.options;
        
        if ((options.if && !options.if(t, t[name])) || (options.unless && options.unless(t, t[name]))) {
          proceed();
          return;
        }
        
        // Call the validator's function on the instance, passing the instance,
        // value and callback.
        validator.fn(t, t[name], function(message) {
          // Message only has a value if the validator failed.
          if (message) {
            // Make sure the instance has an error array...
            if (!t.errors[name]) {
              t.errors[name] = [];
            }
            // add the new error to the instance's error array.
            t.errors[name].push(message);
            valid = false;
          }
          proceed();
        });
      };

      // Call the next validator in the list.
      next();
      
      function complete() {
        if (valid === false) {
          cb(new Error('Tubbs contains invalid data.'), false);
        } else {
          cb(null, true);
        }
      }
    },
    configurable: true
  },

  isNew: {
    get: function() {
      var id = this.id;
      return id.match && id.match(/__\d+__/);
    }
  },

  initialized: {
    value: false
  }
});

module.exports = Tubbs;

/**
 * Tubbs.define(options) -> Tubbs
 * - options (Object): A hash object which defines what the resulting model is.
 *
 * **Options**
 * - fields (Object): A hash of field names and default values.
 * - primaryKey (String): The name of the field to use as the primary key when interactive with the database.
 * - virtual (Object<Function>): A hash of functions which define virtual properties on the model.
 * - dataStore (?): A data store to use with the model type. Defaults to `new MemoryStore`.
 * - validation (Array<Function>): An array of validation functions.
 *
 * Type -> Base
 * Type#fields -> {} -> Base#fields
**/
Tubbs.define = function(options) {
  options = options || {};

  // Define the constructor
  function Model() {
    // Call initialization logic on new Model
    Tubbs.apply(this, arguments);
  }
  
  // Default primary key is 'id'
  Model.primaryKey = options.primaryKey || Model.primaryKey || 'id';

  // Inherit from Tubbs
  Model.prototype = Object.create(Tubbs.prototype);
  
  // Reference for the Model's defaults
  var defaults = options.fields || {};
  var setters = {};

  if (Model.primaryKey in defaults) {
    if (defaults[Model.primaryKey] !== undefined)
      throw util.Error('ConfigurationError', 'Primary key cannot have a default value other than `undefined`.');
  } else {
    // If primary key no supplied in default, add it.
    defaults[Model.primaryKey] = undefined;
  }

  Object.defineProperty(Model.prototype, 'fields', { value: {} });
  
  // Store the defaults on the Model's prototype
  for (var field in defaults) {
    Model.prototype.fields[field] = defaults[field];
  }
  
  defaults = Model.prototype.fields;
  
  // Validators are stored in a hash by their field name.
  // TODO: this should merge parent validators in, if present.
  Object.defineProperty(Model.prototype, "validators", { value: {} });

  // Add fields to the new Type based on the `fields` option
  Object.keys(defaults).forEach(function(key) {
    
    if (defaults[key]) {
      if (defaults[key].set instanceof Function)
        setters[key] = defaults[key].set;       // Pull out the defined setter function

      if (typeof defaults[key].default !== 'undefined')
        defaults[key] = defaults[key].default;  // Save the defined default value
    }

    // Define silent setters on the model prototype.
    Object.defineProperty(Model.prototype, '_' + key, {
      set: function(value) {
        // Note: setting value to undefined resets the property to its default
        // value, if configured.
        if (value === undefined) {
          // Remove the local field value, if present.
          if (key in this.fields) {
            delete this.fields[key];
          }

          // If the Parent Type's value is a function, return early. It will
          // be executed next time this property's getter is executed.
          // value = Type.prototype.fields[key];
          value = this.fields[key];
          if (typeof value == "function") {
            return;
          }
        }

        // If property was configured with a setter -- pass the value through it.
        this.fields[key] = setters[key] ? setters[key](value) : value ;
      }
    });

    Object.defineProperty(Model.prototype, key, {
      get: (function() {
        if (key == Model.primaryKey) {
          return function() {
            var value = this.fields[Model.primaryKey];
            if (value === undefined) return this.__cid__;
            return value;
          }
        }
        return function() {
          /* Where does the value come from?
           * - key in this.fields -> this.fields[key]
           * - key in Type.prototype.fields -> Type.prototype.fields[key]
           **/
          var value;
          // if (key in this.fields) { // Grab the local value, if present.
          //   value = this.fields[key];
          // } else { // Grap the default from the Parent Type
          //   value = Type.prototype.fields[key];
          // }
          value = this.fields[key];
          
          // If the value is a function, execute it and store the value on the local
          // object.
          if (typeof value == "function") {
            this.fields[key] = value = value();
          }
          return value;
        }
      })(),
      set: function(value) {
        var oldValue = this.fields[key];

        this['_' + key] = value ;

        var newValue = this.fields[key];

        if (this.initialized && oldValue !== newValue) {
          this.emit('change', key, oldValue, newValue);
          Model.emit('change', this, key, oldValue, newValue);
          this.emit('change:' + key, oldValue, newValue);
          Model.emit('change:' + key, this, oldValue, newValue);
        }
      },
      enumerable: true
    });

    // Default validators list for each field is an empty array.
    Model.prototype.validators[key] = [];
  });

  if ('id' in defaults === false) {
    Object.defineProperty(Model.prototype, 'id', {
      get: function() {
        return this[Model.primaryKey];
      },
      set: function(value) {
        this[Model.primaryKey] = value;
      },
      enumerable: true
    });
  }
  
  // Store a referent to the Type on the Type's prototype so it can be easily
  // accessed by `this.constructor` later on.
  Object.defineProperty(Model.prototype, 'constructor', { value: Model });
  
  // Add virtual properties to the model
  if (options.virtual) {
    Object.keys(options.virtual).forEach(function(key) {
      Object.defineProperty(Model.prototype, key, {
        get: options.virtual[key],
        enumerable: true
      });
    });
  }
  
  // Add validations if they've been defined on the model Type.
  var validation = options.validation;
  if (validation && Array.isArray(validation)) {
    validation.forEach(function(v) {
      // Get previously stored validators for this field
      var validators = Model.prototype.validators[v.fieldName];
      if (validators) {
        validators.push(v); // Add to the list.
        
        if (v.confirmation) {
          Model.prototype[v.fieldName + 'Confirmation'] = undefined;
        }
      }
    });
  }
  
  // Copy class-level methods from Tubbs to Type
  Object.keys(this).forEach(function(key) {
    // Exclude and "...Store" and "define" properties
    if (Tubbs.hasOwnProperty(key) && key != 'define' && !key.match(/Store$/)) {
      Model[key] = Tubbs[key];
    }
  });
  
  if (options.initialize) {
    Object.defineProperty(Model.prototype, 'initialize', { value: options.initialize });
  }
  
  var ds = options.dataStore || { type: Tubbs.NullStore };

  // Add a reference to the dataStore on the Model.
  Model.dataStore = new ds.type(Model, ds.options);

  return Model;
};

/**
 * Tubbs.find(id, cb)
 * - id (String): The model id on the server
 * - cb (Function(e, result))
**/
Tubbs.find = function(id, cb) {
  this.dataStore.find(id, cb);
};


/**
 * Tubbs.all(id, cb)
 * - cb (Function(e, result))
**/
Tubbs.all = function(cb) {
  this.dataStore.all(cb);
};


/**
 * Tubbs.where(id, cb)
 * - filter (Function): Function which is called against each document.
 * - cb (Function(e, result))
**/
Tubbs.where = function(args, filter, cb) {
  this.dataStore.where(args, filter, cb);
};


/**
 * Tubbs.save(model, cb)
 * - model (Tubbs): The model to save back to the database.
 * - cb (Function(e, result))
**/
Tubbs.save = function(model, cb) {
  model.validate(function(e, success) {
    if (e) {
      cb(e, model);
      return;
    }
    var t = this;
    this.dataStore.save(model, function() {
      model.emit('save', model);
      t.emit('save', model);
      (cb || noop).apply(null, arguments);
    });
  }.bind(this));
};


/**
 * Tubbs.delete(model, cb)
 * - model (Tubbs|String): The model or primary key value to delete from the database.
 * - cb (Function(e, model))
**/
Tubbs.delete = function(model, cb) {
  if (Object.prototype.toString.call(model) == '[object String]' || Object.prototype.toString.call(model) == '[object Number]') {
    var id = model;
    model = new this();
    model[this.primaryKey] = id;
  }
  var t = this;
  this.dataStore.delete(model, function() {
    model.emit('delete', model);
    t.emit('delete', model);
    (cb || noop).apply(null, arguments);
  });
};


/**
 * Tubbs.fetch(cb)
 * - cb (Function(e))
 *
 * Fetch model data, if model data store supports this method.
**/
Tubbs.fetch = function(cb) {
  if (!this.dataStore) {
    callback(util.Error('ConfigurationError', 'Model does not have a dataStore.'));
  } else if (!this.dataStore.fetch) {
    callback(util.Error('ConfigurationError', 'Data store does not have a fetch method.'));
  } else this.dataStore.fetch(cb);
};

Tubbs.on = function() {
  EventEmitter2.prototype.on.apply(this, arguments);
};

Tubbs.emit = function() {
  EventEmitter2.prototype.emit.apply(this, arguments);
};


Tubbs.NullStore = require('./store/null');
Tubbs.MemoryStore = require('./store/memory');
Tubbs.Validate = require('./validate');
