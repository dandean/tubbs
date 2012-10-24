var Emitter = require('emitter-component');
var MemoryStore = require('./lib/memory');

module.exports = Tubbs;

/*

GOALS
=====

1. Succinct API
2. Mixin to *any* Function
3. Mixin observability to singleton?

*/

/**
 * noop() -> undefined
 * Does nothing, used as a fallback when callback isn't provided.
**/
function noop() {}

function isEventEmitter(object) {
  return object
    && 'on'   in object
    && 'off'  in object
    && 'emit' in object;
}

function getAndDelete(source, prop, defaultValue) {
  var result = defaultValue;
  if (prop in source) {
    result = source[prop];
    delete source[prop];
  }
  return result;
}

var createId = (function() {
  var id = 0;
  return function() {
    return ++id;
  };
})();

// Take a function and mixes in model functionality.
function Tubbs(fn, options) {
  var primary = getAndDelete(options, 'primaryKey', null);
  var dataStore = getAndDelete(options, 'dataStore', new MemoryStore());

  // Basic instance property descriptor:
  var descriptor = {
    // Instance prototype has a getter which creates a __cid__ property
    // on the instance itself. Once this is called it will be ignored.
    __cid__: {
      get: function() {
        if (!this.hasOwnProperty('__cid__')) {
          var cid;
          Object.defineProperty(this, '__cid__', {
            value: cid = ('cid' + createId())
          });
          return cid;
        }
        return this.__cid__;
      }
    },

    toJSON: {
      value: function() {
        var json = {};
        var data = this.__data__ || {};
        for (var key in data) {
          var value = data[key];
          if (typeof value != 'undefined' && value !== null)
            json[key] = value;
        }
        return json;
      }
    },

    setData: {
      value: function(data) {
        this.__data__ = data || {};
        return this;
      },
      configurable: true,
    },

    setValue: {
      value: function(name, value, silent) {
        if (!this.__data__) this.__data__ = {};
        var data    = this.__data__;
        var was     = data[name];
        data[name] = value;

        if (was !== value && !silent) {
          this.emit('change', name, value, was);
          this.emit('change:' + name, value, was);
        }

        return this;
      }
    },

    set: {
      value: function(name, value, silent) {
        // Search for a setter for this property: 
        var descriptor = Object.getOwnPropertyDescriptor(this, name);
        var obj = this.__proto__;

        // Not found locally, search up the prototype chain:
        while (!descriptor && obj != null) {
          descriptor = Object.getOwnPropertyDescriptor(obj, name);
          if (!descriptor) obj = obj.__proto__;
        }

        if (descriptor && 'set' in descriptor) {
          descriptor.set.call(this, value, silent);
        } else this.setValue(name, value, silent);
      }
    },

    get: {
      value: function(name) {
        return this.__data__ ? this.__data__[name] : undefined ;
      }
    },

    isNew: {
      get: function() {
        return typeof this.get(primary) == 'undefined';
      }
    },

    id: {
      get: function() {
        return this.isNew ? this.__cid__ : this.get(primary) ;
      },
      set: function(value) {
        this.setValue(primary, value);
      },
      enumerable: true
    },

    save: {
      value: function(cb) {
        var t = this;
        dataStore.save(this, function(e, result) {
          if (e) {
            if (cb) cb(e);
            return;
          }
          if (cb) cb(null, t);
          t.emit('save');
          fn.emit('save', t);
        });
      },
      enumerable: true
    },

    delete: {
      value: function(cb) {
        var t = this;
        dataStore.delete(this, function(e, result) {
          if (e) {
            if (cb) cb(e);
            return;
          }
          t.emit('delete');
          fn.emit('delete', t);
          cb(null, t);
        });
      },
      enumerable: true
    }
  };

  var options = options || {};

  // Extract validation from the options:
  // var validation = getAndDelete(options, 'validation', {});

  // Add basic properties to the property descriptor:
  getAndDelete(options, 'basicProperties', []).forEach(function(name){
    descriptor[name] = {
      get: function() {
        return this.get(name);
      },
      set: function(value, silent) {
        this.setValue(name, value, silent);
      },
      enumerable: true,
      configurable: true
    };
  });

  // Remaining options will be property descriptors:
  for (var name in options) {
    descriptor[name] = options[name];
  }

  fn.prototype = Object.create(fn.prototype || {}, descriptor);

  Object.defineProperties(fn, {

    primaryKey: {
      get: function() { return primary; },
      set: function(value) { primary = value; },
      enumerable: true
    },

    dataStore: {
      get: function() { return dataStore; },
      set: function(value) { primary = dataStore; },
      enumerable: true
    },

    find: {
      value: function(id, cb) {
        dataStore.find(id, cb);
      },
      enumerable: true
    },

    where: {
      value: function(args, filter, cb) {
        dataStore.where(args, filter, cb);
      },
      enumerable: true
    },

    all: {
      value: function(cb) {
        dataStore.all(cb);
      },
      enumerable: true
    },

    fetch: {
      value: function(cb) {
        dataStore.fetch(function(e) {
          if (cb) cb(e);
          if (!e) fn.emit('fetch');
        });
      },
      enumerable: true
    },

    use: {
      value: function(data, cb) {
        dataStore.use(function(e) {
          if (cb) cb(e);
          if (!e) fn.emit('load');
        });
      },
      enumerable: true
    },

    delete: {
      value: function(id, cb) {
        fn.find(id, function(e, result) {
          if (e) {
            if (cb) cb(e);
            return
          }
          result.delete(function() {
            // TODO: make sure "delete" event is emitted on instance AND type.
            if (cb) cb.apply(null, arguments);
          });
        });
      },
      enumerable: true
    }
  });

  // Make fn and fn.prototype an Emitter
  if (!isEventEmitter(fn)) Emitter(fn);
  if (!isEventEmitter(fn.prototype)) Emitter(fn.prototype)

  // Class-level events emit whenever an instance event is emitted:
  var emit = fn.prototype.emit;
  fn.prototype.emit = function() {
    // Emit the instance event:
    emit.apply(this, arguments);

    // Shuffle args for class-level event:
    // First arg should be the same, inject instance as second arg:
    var args = [arguments[0], this].concat(Array.prototype.slice.call(arguments, 1));
    fn.emit.apply(fn, args);
  }

  return fn;
}
