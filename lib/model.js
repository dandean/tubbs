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

  var Klass = function() {
    Parent.apply(this, arguments);
  };

  var ProtoProxy = function() {};
  ProtoProxy.prototype = Parent.prototype;
  Klass.prototype = new ProtoProxy();
  
  Klass.create = Model.create;

  // Create the default for the fields of the model.
  var defaults = options.fields || {};
  
  // Create the fields for the model..
  var fields = {};
  
  // Add the fields as the "_fields" propert of the model class
  // Object.defineProperty(Klass.prototype, "_fields", {
  //   value: fields,
  //   enumerable: false,
  //   configurable: false
  // });
  
  Object.keys(defaults).forEach(function(key) {
    
    Object.defineProperty(Klass.prototype, key, {
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
  
  if (options.virtual) {
    Object.keys(options.virtual).forEach(function(key) {
      Object.defineProperty(Klass.prototype, key, {
        get: options.virtual[key],
        enumerable: true,
        configurable: false
      });
    });
  }
  
  return Klass;
};

Model.prototype.toJSON = function() {
  var json = {};
  for (var key in this) {
    json[key] = this[key];
  }
  return json;
};


  // // Create new object which inherits Model.
  // var Klass = function() {
  //   Model.apply(this, arguments);
  // };
  // 
  // var Proxy = function() {};
  // Proxy.prototype = Model.prototype;
  // Klass.prototype = new Proxy();
  // 
  // Object.defineProperty(Klass.prototype, "klass", {
  //   value: Klass,
  //   enumerable: false,
  //   configurable: false
  // });

  // Add the SCHEMA to model class
  // var schema = opts.schema || {};
  // Object.defineProperty(Klass, "schema", {
  //   value: schema,
  //   enumerable: false,
  //   configurable: false
  // });
  
  // Add the PRIMARY KEY to model class
  // var primaryKey = opts.primaryKey || "id";
  // Object.defineProperty(Klass, "primaryKey", {
  //   value: primaryKey,
  //   enumerable: false,
  //   configurable: false
  // });

  // Create a class-level getter for the "bucket" property.
  // var bucket = opts.bucket;
  // 
  // Object.defineProperty(Klass, "bucket", {
  //   get: function() {
  //     if (!bucket) throw new Error("`bucket` is not configured.");
  //     return bucket;
  //   },
  //   set: function(value) {
  //     bucket = value;
  //   },
  //   enumerable: true,
  //   configurable: false
  // });
  // 
  // // Copy over the db fetcher functions.
  // Klass.find = Model.find;
  // Klass.all = Model.all;
  // Klass.where = Model.where;
  // Klass.save = Model.save;
  // Klass.delete = Model.delete;
  
  // TODO: create dynamic schema-based class-level finders
  // ex: User.findByEmail
  // will need to use dynamically generated map/reduce functions for this - it
  // use Klass.where
  
  // Object.keys(opts.schema).forEach(function(key) {
  //   // TODO: deal with type coercion more fully.
  //   var type = opts.schema[key],
  //       typeString = Object.prototype.toString.call(new type());
  // 
  //   Object.defineProperty(Klass.prototype, key, {
  //     get: function() {
  //       return this._data[key];
  //     },
  //     set: function(value) {
  //       var valueTypeString = Object.prototype.toString.call(value);
  //       
  //       if (type == Date && valueTypeString == "[object String]") {
  //         // Convert JSON date into real Date object.
  //         value = new Date(Date.parse(value));
  // 
  //       } else if (valueTypeString != typeString) {
  //         throw new Error("Invalid type. " + key + " must be of type " + type);
  //       }
  // 
  //       this._data[key] = value;
  //     },
  //     enumerable: true
  //   });
  // });
  // return Klass;
// };

Model.NullStore = require('./store/null');
Model.MemoryStore = require('./store/memory');
Model.RiakStore = require('./store/riak');
