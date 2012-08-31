var util = require('./util');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

// SPEC:
// -----------------------------------------------------------------------------
// 
// Define the user Model
// 
// var User = Model.create({
// 
//   dataStore: new Model.NullStore(),
// 
//   fields: {
//     id: Guid.Empty,
//     username: undefined,
//     first: '',
//     last: '',
//     dateCreated: function() { return new Date(); },
//     dateModified: function() { return new Date(); }
//   },
// 
//   virtual: {
//     name: function() {
//       return ((this.first || '') + ' ' + (this.last || '')).trim();
//     }
//   },
// 
//   validation: {
//     id: []
//   }
// });
// 
// Create a new user
//
// var user = new User({
//   username: "dandean",
//   first: "dan",
//   last: "dean"
// });
// 
// Extend the User model as the Employee model
// 
// var Employee = User.create({
//   title: "amazing employee"
// });
// 
// Create a new Employee
// 
// var enginner = new Employee({
//   username: "dandean",
//   first: "dan",
//   last: "dean",
//   title: "software engineer"
// });
// -----------------------------------------------------------------------------

/**
 * noop() -> undefined
 * Does nothing, used as a fallback when callback isn't provided.
**/
function noop() {}

/**
 * class Model
 *
 * new Model(data) -> Model
 * data (Object): Hash of data to apply to the model.
**/
function Model(data) {
  EventEmitter2.call(this);

  // Create a "fields" property on the instance for local data.
  Object.defineProperty(this, "fields", {
    // Inherit from the constructor's prototype's `fields` property.
    value: Object.create(this.constructor.prototype.fields),
    enumerable: false, configurable: false
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
  
  if (this.initialize) this.initialize();
}

// Extend EventEmitter2
Model.prototype = Object.create(EventEmitter2.prototype);

Object.defineProperties(Model.prototype, {
  
  // Define 'fields' object on the ROOT model class. Child class's `fields'
  // property will use this as their __proto__ object.
  fields: {
    value: {},
    configured: false,
    enumerable: false
  },

  /**
   * Model#toJSON() -> Object
   * Returns an object representing the model which is ready for serialization.
  **/
  toJSON: {
    value: function() {
      var json = {};
      
      for (var key in this.fields) {
        var value = this[key];
        json[key] = value;
      }

      return json;
    }, enumerable: false, configurable: true
  },

  inspect: {
    value: function() {
      var primaryKey = this.constructor.primaryKey;
      var out = 'Model<#';
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
    }, enumerable: false, configurable: true
  },

  save: {
    value: function(cb) {
      this.constructor.save(this, cb);
    },
    enumerable: false, configurable: true
  },

  delete: {
    value: function(cb) {
      this.constructor.delete(this, cb);
    },
    enumerable: false, configurable: true
  },

  errors: {
    value: {},
    enumerable: false, configurable: false
  },
  
  addError: {
    value: function(field, message) {
      if (!this.errors[field]) this.errors[field] = [];
      this.errors[field].push(message);
    },
    enumerable: false, configurable: true
  },

  validate: {
    value: function(cb) {
      if (!cb) {
        throw util.Error('ArgumentError', 'Model#validate requires a callback function.');
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
          cb(new Error('Model contains invalid data.'), false);
        } else {
          cb(null, true);
        }
      }
    },
    enumerable: false, configurable: true
  }
});


module.exports = Model;

/**
 * Model.create(options) -> Model
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
Model.create = function(options) {
  // Identify the parent Type
  var Parent = this;

  // Define the constructor, ensuring construction inheritance.
  var Type = function() {
    Parent.apply(this, arguments);
  };
  
  // Store the Parent Type on the Type
  Type.parent = Parent;
  
  // Default primary key is 'id'
  Type.primaryKey = options.primaryKey || Parent.primaryKey || 'id';
  
  Type.prototype = Object.create(Parent.prototype);
  
  // Reference for the Type's defaults
  var defaults = options.fields || {};
  var setters = {};
  
  Object.defineProperty(Type.prototype, 'fields', {
    // Add to the fields prototype chain so that the base type is not modified
    value: Object.create(Object.create(Type.prototype.fields)),
    enumerable: false,
    configurable: false
  });

  // Store the defaults on the Type's prototype
  for (var field in defaults) {
    Type.prototype.fields[field] = defaults[field];
  }
  
  defaults = Type.prototype.fields;
  
  // Validators are stored in a hash by their field name.
  // TODO: this should merge parent validators in, if present.
  Object.defineProperty(Type.prototype, "validators", {
    value: {},
    enumerable: false, configurable: false
  });

  // Add fields to the new Type based on the `fields` option
  Object.keys(defaults).forEach(function(key) {
    
    if (defaults[key]) {
      if (defaults[key].set instanceof Function) {
        setters[key] = defaults[key].set;       // Pull out the defined setter function
        defaults[key] = defaults[key].default;  // Save the defined default value
        // TODO: detect `default` property in property def independent of `set` prop.
      }
    }
    
    Object.defineProperty(Type.prototype, key, {
      get: function() {
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
      },
      set: function(value) {
        var oldValue = this.fields[key];

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
        var newValue = this.fields[key];

        if (oldValue !== newValue) {
          this.emit('change', key, oldValue, newValue);
          Type.emit('change', this, key, oldValue, newValue);
          this.emit('change:' + key, oldValue, newValue);
          Type.emit('change:' + key, this, oldValue, newValue);
        }
      },
      enumerable: true,
      configurable: false
    });
    
    // Default validators list for each field is an empty array.
    Type.prototype.validators[key] = [];
  });
  
  // Store a referent to the Type on the Type's prototype so it can be easily
  // accessed by `this.constructor` later on.
  Object.defineProperty(Type.prototype, 'constructor', {
    value: Type,
    enumerable: false,
    configurable: false
  });
  
  // Add virtual properties to the model
  if (options.virtual) {
    Object.keys(options.virtual).forEach(function(key) {
      Object.defineProperty(Type.prototype, key, {
        get: options.virtual[key],
        enumerable: true,
        configurable: false
      });
    });
  }
  
  // Add validations if they've been defined on the model Type.
  var validation = options.validation;
  if (validation && Array.isArray(validation)) {
    validation.forEach(function(v) {
      // Get previously stored validators for this field
      var validators = Type.prototype.validators[v.fieldName];
      if (validators) {
        validators.push(v); // Add to the list.
        
        if (v.confirmation) {
          Type.prototype[v.fieldName + 'Confirmation'] = undefined;
        }
      }
    });
  }
  
  // Add a reference to the dataStore on the Class.
  Type.dataStore = options.dataStore || new Model.NullStore();
  Type.dataStore.DataType = Type;

  // Copy class-level methods from Model to Type
  Object.keys(this).forEach(function(key) {
    // Exclude and "...Store" properties
    if (Parent.hasOwnProperty(key) && !key.match(/Store$/)) {
      Type[key] = Parent[key];
    }
  });
  
  if (options.initialize) {
    Object.defineProperty(Type.prototype, 'initialize', {
      value: options.initialize,
      enumerable: false
    });
  }
  
  return Type;
};

/**
 * Model.find(id, cb)
 * - id (String): The model id on the server
 * - cb (Function(e, result))
**/
Model.find = function(id, cb) {
  this.dataStore.find(id, cb);
};


/**
 * Model.all(id, cb)
 * - cb (Function(e, result))
**/
Model.all = function(cb) {
  this.dataStore.all(cb);
};


/**
 * Model.where(id, cb)
 * - filter (Function): Function which is called against each document.
 * - cb (Function(e, result))
**/
Model.where = function(args, filter, cb) {
  this.dataStore.where(args, filter, cb);
};


/**
 * Model.save(model, cb)
 * - model (Model): The model to save back to the database.
 * - cb (Function(e, result))
**/
Model.save = function(model, cb) {
  model.validate(function(e, success) {
    if (e) {
      cb(e, model);
      return;
    }
    this.dataStore.save(model, cb || noop);
  }.bind(this));
};


/**
 * Model.delete(model, cb)
 * - model (Model|String): The model or primary key value to delete from the database.
 * - cb (Function(e, model))
**/
Model.delete = function(model, cb) {
  if (Object.prototype.toString.call(model) == '[object String]' || Object.prototype.toString.call(model) == '[object Number]') {
    var id = model;
    model = new this();
    model[this.primaryKey] = id;
  }
  this.dataStore.delete(model, cb || noop);
};


/**
 * Model.fetch(cb)
 * - cb (Function(e))
 *
 * Fetch model data, if model data store supports this method.
**/
Model.fetch = function(cb) {
  if (!this.dataStore) {
    callback(util.Error('ConfigurationError', 'Model does not have a dataStore.'));
  } else if (!this.dataStore.fetch) {
    callback(util.Error('ConfigurationError', 'Data store does not have a fetch method.'));
  } else this.dataStore.fetch(cb);
};

Model.on = function() {
  EventEmitter2.prototype.on.apply(this, arguments);
};

Model.emit = function() {
  EventEmitter2.prototype.emit.apply(this, arguments);
};


Model.NullStore = require('./store/null');
Model.MemoryStore = require('./store/memory');
Model.Validate = require('./validate');
