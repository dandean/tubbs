var util = require('./util');

// TODO: should be some way to pre-process fields when they're set:
//  onSetId: function(value) {}
//
//  OR -->
//
//  fields: {
//    id: {
//      value: undefined,
//      set: function(value) {
//        return parseInt(value, 10);
//      }
//    }
//  }



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


function Model(data) {
  // Create a "fields" property on the instance for local data.
  Object.defineProperty(this, "fields", {
    value: {},
    enumerable: false, configurable: false
  });

  // set data if it's provided and it's in the schema.
  if (data) {
    for (var key in this) {
      if (key in data) {
        this[key] = data[key];
      }
    }
  }
}


module.exports = Model;


Model.create = function(options) {
  // Identify the parent Type
  var Parent = this;

  // Define the constructor, ensuring construction inheritance.
  var Type = function() {
    Parent.apply(this, arguments);
  };

  // Copy the parent as the prototype (Parent Type)
  var ProtoProxy = function() {};
  ProtoProxy.prototype = Parent.prototype;
  Type.prototype = new ProtoProxy();
  
  // Reference for the Type's defaults
  var defaults = options.fields || {};
  var setters = {};
  
  // Store the defaults on the Parent Type
  Object.defineProperty(Type.prototype, "fields", {
    value: defaults,
    enumerable: false,
    configurable: false
  });
  
  // Validators are stored in a hash by their field name.
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
        if (key in this.fields) { // Grab the local value, if present.
          value = this.fields[key];
        } else { // Grap the default from the Parent Type
          value = Type.prototype.fields[key];
        }
        
        // If the value is a function, execute it and store the value on the local
        // object.
        if (typeof value == "function") {
          this.fields[key] = value = value();
        }
        
        return value;
      },
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
          value = Type.prototype.fields[key];
          if (typeof value == "function") {
            return;
          }
        }
        
        if (setters[key]) {
          // Property was configured with a setter -- pass the value through it.
          this.fields[key] = setters[key](value);

        } else {
          this.fields[key] = value;
        }
      },
      enumerable: true,
      configurable: false
    });
    
    // Default validators list for each field is an empty array.
    Type.prototype.validators[key] = [];
  });
  
  // Store a referent to the Type on the Type's prototype so it can be easily
  // accessed by `this.__type` later on.
  Object.defineProperty(Type.prototype, '__type', {
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
      var validators = Type.prototype.validators[v.field];
      if (validators) {
        validators.push(v); // Add to the list.
        
        if (v.confirmation) {
          // Add a non-enumerable field for the confirmation field. This makes
          // it so that the confirmation data is not serialized as JSON.
          Object.defineProperty(Type.prototype, Type.prototype[v.field + 'Confirmation'], {
            value: undefined,
            enumerable: false,
            configurable: false
          });
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
  
  return Type;
};

Object.defineProperties(Model.prototype, {

  toJSON: {
    value: function() {
      var json = {};
      // Using for..in instead of Object.keys so that props from the prototype
      // chain are pulled into the serialization.
      for (var key in this) {
        var value = this[key];

        // Functions aren't added to data. May not need to do this as functions
        // aren't serialized during the stringification process.
        var isNotFunction = value instanceof Function === false;

        // Getters aren't added to data
        var isNotGetter = Object.getOwnPropertyDescriptor(this.constructor, key) === undefined;

        if (isNotFunction && isNotGetter) json[key] = value;
      }
      return json;
    }, enumerable: false, configurable: false
  },

  inspect: {
    value: function() {
      var out = 'Model<#';
      if ('id' in this) {
        out += this.id;
      }
      out += ' ';

      var json = {};
      var i = 0;
      var broke = false;

      for (var key in this) {
        if (this[key] instanceof Function || key == 'id') continue;

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
    }, enumerable: false, configurable: false
  },

  save: {
    value: function(cb) {
      this.__type.save(this, cb);
    },
    enumerable: false, configurable: false
  },

  delete: {
    value: function(cb) {
      this.__type.delete(this, cb);
    },
    enumerable: false, configurable: false
  },

  errors: {
    value: {},
    enumerable: false, configurable: false
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

        var field = validator.field;
        
        validator.function(t, t[field], function(message) {
          if (message) {
            if (!t.errors[field]) {
              t.errors[field] = [];
            }
            t.errors[field].push(message);
            valid = false;
          }
          index++;
          next();
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
    enumerable: false, configurable: false
  }
});


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
Model.where = function(filter, cb) {
  this.dataStore.where(filter, cb);
};


/**
 * Model.save(model, cb)
 * - model (Model): The model to save back to the database.
 * - cb (Function(e, result))
**/
Model.save = function(model, cb) {
  this.dataStore.save(model, cb || noop);
};


/**
 * Model.delete(model, cb)
 * - model (Model): The model to delete from the database.
 * - cb (Function(e, result))
**/
Model.delete = function(model, cb) {
  this.dataStore.delete(model, cb || noop);
};


Model.NullStore = require('./store/null');
Model.MemoryStore = require('./store/memory');
Model.RiakStore = require('./store/riak');

Model.Validate = require('./validate');
