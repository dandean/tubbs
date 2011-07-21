/**
 * new Null()
 *
 * Defines the required base data store API.
**/
function Null() {}

/**
 * Null#all(callback(e, result))
 *
 * Provides an Array of all records in the dataset.
**/
Null.prototype.all = function(callback) {
  callback(null, []);
};

/**
 * Null#all(id, callback(e, result))
 * - id (?): The record ID in the database
 *
 * Provides an Array of all records in the dataset.
**/
Null.prototype.find = function(id, callback) {
  callback(new Error("Document not found."), null);
};

/**
 * Null#where(filter, callback(e, result))
 * - args (Object): An object hash of named arguments which becomes the 2nd arg passed to `filter`.
 * - filter (Function): A function executed against each document which returns
 * `true` if the document should be included in the result.
 *
 * Provides an Array of all records which pass the `filter`.
**/
Null.prototype.where = function(filter, callback) {
  callback(null, []);
};

/**
 * Null#save(record, callback(e, result))
 * - record (Object): An object (or JSON serializable object) to be saved to the database.
 *
 * Saves the provides object to the database.
**/
Null.prototype.save = function(record, callback) {
  callback(null, record);
};

/**
 * Null#delete(record, callback(e, result))
 * - record (Object): An object (or JSON serializable object) to be deleted from the database.
 *
 * Deletes the provides object from the database.
**/
Null.prototype.delete = function(record, callback) {
  callback(null, record);
};

module.exports = Null;