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
**/
function Memory(constructor) {
  this.Model = constructor;
  this.data = {};
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
    },
    enumerable: true
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
    },
    enumerable: true
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
    },
    enumerable: true
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
    },
    enumerable: true
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
        if (callback) callback(null, record);
      } else if(callback) callback(new Error('Document not found'), null);
    },
    enumerable: true
  },

  fetch: {
    value: function(callback) {
      if (callback) callback();
    },
    enumerable: true
  },

  use: {
    value: function(data, callback) {
      var Model = this.Model;
      var primaryKey = Model.primaryKey;
      var t = this;
      this.data = {};

      if (Array.isArray(data)) {
        data.forEach(function(item) {
          Model.emit('add', t.data[item[primaryKey]] = new Model(item))
        });

      } else {
        Object.keys(data).forEach(function(key) {
          Model.emit('add', t.data[key] = new Model(data[key]));
        });
      }
      this.ready = true;
      if (callback) callback();
    },
    enumerable: true
  }
});
