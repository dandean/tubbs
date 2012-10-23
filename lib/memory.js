var createId = (function() {
  var id = 0;
  return function() {
    return id++;
  };
})();

module.exports = Memory;

/**
 * new Memory(constructor, data)
 * - constructor (Tubbs): Tubbs model constructor.
 * - data (Object): An object containing documents, indexed by ID.
**/
function Memory(constructor, data) {
  this.Model = constructor;
  this.use(data || {});
}

Memory.prototype = Object.create({}, {

  /**
   * Memory#all(callback(e, result))
   *
   * Provides an Array of all records in the dataset.
  **/
  all: {
    value: function(callback) {
      var result = [];

      Object.keys(this.data).forEach(function(id) {
        var doc = this.data[id];
        result.push(doc);
      }.bind(this));

      callback(null, result);
    }
  },

  /**
   * Memory#find(id, callback(e, result))
   * - id (?): The record ID in the database
   *
   * Finds a single record in the database.
  **/
  find: {
    value: function(id, callback) {
      if (id in this.data) {
        var doc = this.data[id];
        callback(null, doc);
        return;
      }
      callback(new Error("Document not found."), null);
    }
  },

  /**
   * Memory#where(args, filter, callback(e, result))
   * - args (Object): An object hash of named arguments which becomes the 2nd arg passed to `filter`.
   * - filter (Function): A function executed against each document which returns
   * `true` if the document should be included in the result.
   *
   * Provides an Array of all records which pass the `filter`.
  **/
  where: {
    value: function(args, filter, callback) {
      // TODO: decompose and recompose filter so that it is executed outside of
      // TODO: its originating clusure. This is needed so that the MemoryStore
      // TODO: API operates the same as other server-based map/reduce API's.
      var result = [];
      Object.keys(this.data).forEach(function(id) {
        var doc = this.data[id];
        if (filter(doc, args)) {
          result.push(doc);
        }
      }.bind(this));
      callback(null, result);
    }
  },

  /**
   * Memory#save(record, callback(e, result))
   * - record (Object): An object (or JSON serializable object) to be saved to the database.
   *
   * Saves the provides object to the database.
  **/
  save: {
    value: function(record, callback) {
      if (record instanceof this.Model === false) {
        record = new this.Model(record);
      }

      if (record.isNew)
        record.id = createId();

      this.data[record.id] = record;
      if(callback) callback(null, record);
    }
  },

  /**
   * Memory#delete(record, callback(e, result))
   * - record (Object): An object (or JSON serializable object) to be deleted from the database.
   *
   * Deletes the provides object from the database.
  **/
  delete: {
    value: function(record, callback) {
      if (Object.prototype.toString.call(record).match(/\[object (String|Number)\]/)) {
        var Model = this.Model;
        var primaryKey = Model.primaryKey;
        var r = record;
        record = {};
        record[primaryKey] = r;
      }

      if (record.id in this.data) {
        delete this.data[record.id];
        callback(null, record);
      } else callback(new Error('Document not found'), null);
    }
  },

  fetch: {
    value: function(callback) {
      callback();
    },
    enumerable: true
  },

  use: {
    value: function(data, callback) {
      var t = this;
      this.data = {};

      if (data) {
        if (Array.isArray(data)) {
          data.forEach(function(item) {
            var instance = new t.Model(item);
            t.data[instance.id] = instance;
          });
        } else {
          Object.keys(data).forEach(function(id) {
            var instance = new t.Model(data[id]);
            t.data[id] = instance;
          });
        }
      }
      if(callback) callback();
    },
    enumerable: true
  }
});
