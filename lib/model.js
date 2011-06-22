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
  // Save the default values into the prototype
  // Extend the defaults with the fields object.
  
  var Parent = this;

  var Type = function() {
    Parent.apply(this, arguments);
  };

  var ProtoProxy = function() {};
  ProtoProxy.prototype = Parent.prototype;
  Type.prototype = new ProtoProxy();
  
  // Create the default for the fields of the model.
  var defaults = options.fields || {};
  
  // Create the fields for the model..
  var fields = {};
  
  // Add fields to the Model based on the `fields` option
  Object.keys(defaults).forEach(function(key) {
    
    Object.defineProperty(Type.prototype, key, {
      get: function() {
        if (!fields.hasOwnProperty(key)) {
          var value = defaults[key];
          if (value instanceof Function) {
            value = fields[key] = value();
            return value;
          }
          return defaults[key];
        }
        return fields[key];
      },
      set: function(value) {
        if (value === undefined) {
          if (fields.hasOwnProperty(key)) {
            delete fields[key];
          }
          if (defaults[key] instanceof Function) {
            fields[key] = defaults[key]();
          }
          return;
        }
        fields[key] = value;
      },
      enumerable: true,
      configurable: false
    });
  });
  
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
  
  // Add a reference to the dataStore on the Class.
  Type.dataStore = options.dataStore || new Model.NullStore();
  
  // Copy class-level methods from Model to Type
  Object.keys(this).forEach(function(key) {
    // Exclude and "...Store" properties
    if (Parent.hasOwnProperty(key) && !key.match(/Store$/)) {
      Type[key] = Parent[key];
    }
  });
  
  return Type;
};


Model.prototype.toJSON = function() {
  var json = {};
  // Using for..in instead of Object.keys so that props from the prototype
  // chain are pulled into the serialization.
  for (var key in this) {
    json[key] = this[key];
  }
  return json;
};

Model.prototype.save = function(cb) {
  this.__type.save(this, cb);
};

Model.prototype.delete = function(cb) {
  this.__type.delete(this, cb);
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
