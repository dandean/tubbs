/**
 * new Memory(constructor, data)
 * - constructor (Tubbs): Tubbs model constructor.
 * - data (Object): An object containing documents, indexed by ID.
**/
function Memory(constructor, data) {
  this.Model = constructor;
  this.data = data || {};
}

/**
 * Memory#all(callback(e, result))
 *
 * Provides an Array of all records in the dataset.
**/
Memory.prototype.all = function(callback) {
  var result = [];
  var Model = this.Model;

  Object.keys(this.data).forEach(function(id) {
    var doc = this.data[id];
    if (doc instanceof Model === false) doc = new Model(doc);
    result.push(doc);
  }.bind(this));

  callback(null, result);
};

/**
 * Memory#find(id, callback(e, result))
 * - id (?): The record ID in the database
 *
 * Finds a single record in the database.
**/
Memory.prototype.find = function(id, callback) {
  var Model = this.Model;
  if (id in this.data) {
    var doc = this.data[id];
    if (doc instanceof Model === false) doc = new Model(doc);
    callback(null, doc);
    return;
  }
  callback(new Error("Document not found."), null);
};

/**
 * Memory#where(args, filter, callback(e, result))
 * - args (Object): An object hash of named arguments which becomes the 2nd arg passed to `filter`.
 * - filter (Function): A function executed against each document which returns
 * `true` if the document should be included in the result.
 *
 * Provides an Array of all records which pass the `filter`.
**/
Memory.prototype.where = function(args, filter, callback) {
  // TODO: decompose and recompose filter so that it is executed outside of
  // TODO: its originating clusure. This is needed so that the MemoryStore
  // TODO: API operates the same as other server-based map/reduce API's.
  var Model = this.Model;
  var result = [];
  Object.keys(this.data).forEach(function(id) {
    var doc = this.data[id];
    if (filter(doc, args)) {
      if (doc instanceof Model === false) doc = new Model(doc);
      result.push(doc);
    }
  }.bind(this));
  callback(null, result);
};

/**
 * Memory#save(record, callback(e, result))
 * - record (Object): An object (or JSON serializable object) to be saved to the database.
 *
 * Saves the provides object to the database.
**/
Memory.prototype.save = function(record, callback) {
  var Model = this.Model;
  var primaryKey = Model.primaryKey;

  if (primaryKey in record && record[primaryKey] !== undefined && record[primaryKey] !== '') {
    this.data[record[primaryKey]] = record;
    callback(null, record);
    return;
  }
  callback(new Error("Invalid or missing record id."), null);
};

/**
 * Memory#delete(record, callback(e, result))
 * - record (Object): An object (or JSON serializable object) to be deleted from the database.
 *
 * Deletes the provides object from the database.
**/
Memory.prototype.delete = function(record, callback) {
  var Model = this.Model;
  var primaryKey = Model.primaryKey;

  if (Object.prototype.toString.call(record).match(/\[object (String|Number)\]/)) {
    var r = record;
    record = {};
    record[primaryKey] = r;
  }

  if (record[primaryKey] in this.data) {
    delete this.data[record[primaryKey]];
    callback(null, record);
    return;
  }
};

module.exports = Memory;