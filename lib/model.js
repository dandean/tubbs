var guid = require("guid");
var riak = require('riak-js');


/**
 * new Model([data[, block]]) -> Model
 * - data (Object): Optional hash of model property values.
 * - block (Function): Optional block to be executed after instantiation. Only
 *   argument is the new instance.
 *
 * Don't call this directly. It is called by subclass constructor's.
**/
function Model(data, block) {
  if (data && data instanceof Function) {
    block = data;
    data = undefined;
  }
  
  Object.defineProperty(this, "_data", {
    value: {},
    enumerable: false,
    configurable: false
  });
  
  // set data if it's provided and it's in the schema.
  if (data) {
    var schema = this.klass.schema;
    for (var key in data) {
      if (key in schema) this[key] = data[key];
    }
  }
  
  if (block) block(this);
}

/**
 * class Model.NotFound(bucket, id) < Error
**/
Model.NotFound = function(bucket, id) {
  var message = "Document Not Found for " + JSON.stringify({
    ID: id,
    BUCKET: bucket
  });
  Error.call(this, message);
  this.message = message;
  this.statusCode = 404;
  this.name = "Model.NotFound";
};

Model.NotFound.prototype = (function() {
  var Proxy = function() {};
  Proxy.prototype = Error.prototype;
  return new Proxy();
})();


/**
 * Riak configuration
**/
Model.config = {
  host: "127.0.0.1",
  port: 8098,
  debug: true
};


var client;

/**
 * Model.db -> Riak http client.
**/
Object.defineProperty(Model, "db", {
  get: function() {
    if (!client) {
      client = riak.getClient(Model.config);
    }
    return client;
  },
  enumerable: true,
  configurable: false
});


/**
 * Model#toString() -> String
 * Returns the JSON encoded string for the object.
 *
 * Model#inspect() -> String
 * Returns the JSON encoded string for the object.
**/
Model.prototype.toString = Model.prototype.inspect = function() {
  return JSON.stringify(this);
};


/**
 * Model#toJSON() -> Object
 * Returns the object that can be encoded as JSON.
**/
Model.prototype.toJSON = function() {
  return this._data;
};


/**
 * Model#save(cb)
 * Saves the instance back to the database.
**/
Model.prototype.save = function(cb) {
  this.klass.save(this, cb);
};


/**
 * Model#delete(cb)
 * Deletes the instance from the database.
**/
Model.prototype.delete = function(cb) {
  this.klass.delete(this, cb);
};


/**
 * Model.bucket -> String
 * Placeholder for subclass "bucket" property.
**/
Model.__defineGetter__("bucket", function() {
  throw new Error("NOT IMPLEMENTED");
});


/**
 * Model.find(id, cb)
 * - id (String): The model id on the server
 * - cb (Function(e, result))
**/
Model.find = function(id, cb) {
  // TODO: how should find deal with 404's?
  var T = this;
  var bucket = this.bucket;
  Model.db.get(bucket, id, function(e, data, meta) {
    if (e) {
      if (e.statusCode && e.statusCode == 404) {
        e = new Model.NotFound(bucket, id);
      }
      cb(e, undefined);
      return;
    }
    
    cb(undefined, new T(data));
  });
};


/**
 * Model.all(id, cb)
 * - cb (Function(e, result))
**/
Model.all = function(cb) {
  var T = this;
  Model.db.getAll(this.bucket, function(e, data, meta) {
    var results = [];

    if (e) cb(e, results);
  
    data.forEach(function(item) {
      results.push(new T(item.data));
    });

    cb(undefined, results);
  });
};


/**
 * Model.where(id, cb)
 * - filter (Function): Function which is called against each document.
 * - cb (Function(e, result))
**/
Model.where = function(filter, cb) {
  // TODO: figure out how to map/reduce on various keys
  filter = filter.toString();
  filter = filter.substring(filter.indexOf("{") + 1, filter.lastIndexOf("}"));
  
  var filterRoutine = function(value, keyData, body) {
    var record = Riak.mapValuesJson(value)[0];
    var f = new Function("doc", body);
    return (f(record)) ? [record] : [];
  };

  Model.db.add(this.bucket).map(filterRoutine, filter).run(cb);
};


/**
 * Model.save(model, cb)
 * - model (Model): The model to save back to the database.
 * - cb (Function(e, result))
**/
Model.save = function(model, cb) {
  cb = cb || function() {};
  
  if (!model instanceof Model) {
    cb(new Error("Value is not a Model, cannot save it."), model);
    return;
  }
  
  var klass = model.klass;
  var schema = klass.schema;
  var now = new Date();
  
  if ("dateCreated" in schema && ("dateCreated" in model === false || !model.dateCreated)) {
    // Schema defined dateCreated -- populate this if it doesn't exist.
    model.dateCreated = now;
  }

  if ("dateModified" in schema) {
    // Schema defines dateModified, update or create this
    model.dateModified = now;
  }
  
  // Make sure the document has value for its primary key.
  if (klass.primaryKey in model === false || !model[klass.primaryKey]) {
    model[klass.primaryKey] = guid.raw();
  }
  
  Model.db.save(klass.bucket, model[klass.primaryKey], model.toJSON(), function(e, data, meta) {
    if (e) {
      cb(e, undefined);
      return;
    }
    
    cb(undefined, model);
  });
};


/**
 * Model.delete(model, cb)
 * - model (Model): The model to delete from the database.
 * - cb (Function(e, result))
**/
Model.delete = function(model, cb) {
  cb = cb || function() {};

  if (!model instanceof Model) {
    cb(new Error("Value is not a Model, cannot delete it."), model);
    return;
  }

  var klass = model.klass;
  var bucket = klass.bucket;
  
  if (!bucket) {
    cb(new Error("Bucket is not defined, cannot delete from it."), undefined);
    return;
  }
  
  var id = model[klass.primaryKey];
  if (id !== 0 && !id) {
    cb(new Error("Model does not have a value for its primary key property '" + klass.primaryKey + "', cannot delete it from the database."), undefined);
    return;
  }

  Model.db.remove(bucket, id, function(e, data, meta) {
    if (e) {
      if (e.statusCode && e.statusCode == 404) {
        e = new Model.NotFound(bucket, id);
      }
      cb(e, undefined);
      return;
    }
    
    cb(undefined, model);
  });
};


/**
 * Model.create(opts) -> Model
 * - opts (Object): Options to define new Model subclass.
 *
 * **Optons**
 *
 * - scheme (Object): Descriptor for model properties.
 * - primaryKey (String): Name of the property used as the db primary key (or ID)
 * - bucket (String|Function): Name of the db bucket which holds the records. If
 *     `bucket` is a function, it is executed to produce the bucket name.
**/
Model.create = function(opts) {

  // Create new object which inherits Model.
  var Klass = function() {
    Model.apply(this, arguments);
  };
  
  var Proxy = function() {};
  Proxy.prototype = Model.prototype;
  Klass.prototype = new Proxy();
  
  Object.defineProperty(Klass.prototype, "klass", {
    value: Klass,
    enumerable: false,
    configurable: false
  });

  // Add the SCHEMA to model class
  var schema = opts.schema || {};
  Object.defineProperty(Klass, "schema", {
    value: schema,
    enumerable: false,
    configurable: false
  });
  
  // Add the PRIMARY KEY to model class
  var primaryKey = opts.primaryKey || "id";
  Object.defineProperty(Klass, "primaryKey", {
    value: primaryKey,
    enumerable: false,
    configurable: false
  });

  // Create a class-level getter for the "bucket" property.
  var bucket = opts.bucket;
  
  Object.defineProperty(Klass, "bucket", {
    get: function() {
      if (!bucket) throw new Error("`bucket` is not configured.");
      return bucket;
    },
    set: function(value) {
      bucket = value;
    },
    enumerable: true,
    configurable: false
  });
  
  // Copy over the db fetcher functions.
  Klass.find = Model.find;
  Klass.all = Model.all;
  Klass.where = Model.where;
  Klass.save = Model.save;
  Klass.delete = Model.delete;
  
  // TODO: create dynamic schema-based class-level finders
  // ex: User.findByEmail
  // will need to use dynamically generated map/reduce functions for this - it
  // use Klass.where
  
  Object.keys(opts.schema).forEach(function(key) {
    // TODO: deal with type coercion more fully.
    var type = opts.schema[key],
        typeString = Object.prototype.toString.call(new type());

    Object.defineProperty(Klass.prototype, key, {
      get: function() {
        return this._data[key];
      },
      set: function(value) {
        var valueTypeString = Object.prototype.toString.call(value);
        
        if (type == Date && valueTypeString == "[object String]") {
          // Convert JSON date into real Date object.
          value = new Date(Date.parse(value));

        } else if (valueTypeString != typeString) {
          throw new Error("Invalid type. " + key + " must be of type " + type);
        }

        this._data[key] = value;
      },
      enumerable: true
    });
  });
  
  return Klass;
};


module.exports = Model;