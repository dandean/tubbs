/**
 * new Memory(data)
 * - data (Object): An object containing documents, indexed by ID.
**/
function Memory(data) {
  this.data = data;
}

/**
 * Memory#all(callback(e, result))
 *
 * Provides an Array of all records in the dataset.
**/
Memory.prototype.all = function(callback) {
  var result = [];
  Object.keys(this.data).forEach(function(id) {
    result.push(this.data[id]);
  });
  callback(null, result);
};

/**
 * Memory#all(id, callback(e, result))
 * - id (?): The record ID in the database
 *
 * Provides an Array of all records in the dataset.
**/
Memory.prototype.find = function(id, callback) {
  if ('id' in this.data) {
    callback(null, this.data[id]);
    return;
  }
  callback(new Error("Document not found."), null);
};

/**
 * Memory#where(filter, callback(e, result))
 * - filter (Function): A function executed against each document which returns
 * `true` if the document should be included in the result.
 *
 * Provides an Array of all records which pass the `filter`.
**/
Memory.prototype.where = function(filter, callback) {
  var result = [];
  Object.keys(this.data).forEach(function(id) {
    var doc = this.data[id];
    if (filter(doc)) result.push(doc);
  });
  callback(null, result);
};

/**
 * Memory#save(record, callback(e, result))
 * - record (Object): An object (or JSON serializable object) to be saved to the database.
 *
 * Saves the provides object to the database.
**/
Memory.prototype.save = function(record, callback) {
  if ('id' in record && record.id !== undefined && record.id !== '') {
    this.data[id] = record;
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
  if (Object.prototype.toString.call(record) === '[object String]') {
    record = { id: record };
  }
  if (record.id in this.data) {
    delete this.data[record.id];
    callback(null, record);
    return;
  }
};

module.exports = Memory;