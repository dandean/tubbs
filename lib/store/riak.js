var guid = require("guid");
var riak = require('riak-js');
var util = require('../util');

var defaults = {
  host: "127.0.0.1",
  port: 8098,
  debug: true
};

/**
 * new Riak(config)
 * - config (Object): Object hash of configuration options.
 *
 * **Options**
 * - bucket (String): Required, the riak bucket which stores the model documents.
 * - host: (String): Optional, riak's hostname. Defaults to '127.0.0.1'.
 * - port: (Number): Optional, riak's http port. Defaults to 8098.
 * - debug: (Boolean): Optional, if debug messages should print. Defaults to `true`.
**/
function Riak(config) {
  if (!config.bucket) throw new Error('The "bucket" option is required.');

  this.bucket = config.bucket;

  this.client = riak.getClient({
    host: config.host || defaults.host,
    port: config.port || defaults.port,
    debug: (config.port === undefined) ? defaults.port : config.port
  });
}

/**
 * Riak#all(callback(e, result))
 *
 * Provides an Array of all records in the dataset.
**/
Riak.prototype.all = function(cb) {
  var result = [];
  var Type = this.DataType;

  this.client.getAll(this.bucket, function(e, data, meta) {
    var results = [];

    if (e) cb(e, results);
  
    data.forEach(function(item) {
      results.push(new Type(item.data));
    });
    
    cb(null, results);
  });
};

/**
 * Riak#all(id, callback(e, result))
 * - id (?): The record ID in the database
 *
 * Provides an Array of all records in the dataset.
**/
Riak.prototype.find = function(id, cb) {
  var Type = this.DataType;
  var bucket = this.bucket;

  this.client.get(bucket, id, function(e, data, meta) {
    if (e) {
      if (e.statusCode && e.statusCode == 404) {
        e = util.Error("NotFound", 'No record found with the id "' + id + '".');
      }
      cb(e, undefined);
      return;
    }
    
    cb(null, new Type(data));
  });
};

/**
 * Riak#where(filter, callback(e, result))
 * - filter (Function): A function executed against each document which returns
 * `true` if the document should be included in the result.
 *
 * Provides an Array of all records which pass the `filter`.
**/
Riak.prototype.where = function(filter, cb) {
  var Type = this.DataType;
  var bucket = this.bucket;
  var result = [];

  filter = filter.toString();
  filter = filter.substring(filter.indexOf("{") + 1, filter.lastIndexOf("}"));
  
  var filterRoutine = function(value, keyData, body) {
    var record = Riak.mapValuesJson(value)[0];
    var f = new Function("doc", body);
    return (f(record)) ? [record] : [];
  };

  this.client.add(bucket).map(filterRoutine, filter).run(function(e, docs) {
    if (e) {
      cb(e, undefined);
      return;
    }
    
    docs.forEach(function(doc, i) {
      docs[i] = new Type(doc);
    });
    
    cb(null, docs);
  });
};

/**
 * Riak#save(record, callback(e, result))
 * - record (Object): An object (or JSON serializable object) to be saved to the database.
 *
 * Saves the provides object to the database.
**/
Riak.prototype.save = function(record, cb) {
  var Type = this.DataType;
  var bucket = this.bucket;

  this.client.save(bucket, record.id, record.toJSON(), function(e, data, meta) {
    if (e) {
      cb(e, undefined);
      return;
    }
    
    cb(null, record);
  });
};

/**
 * Riak#delete(record, callback(e, result))
 * - record (Object): An object (or JSON serializable object) to be deleted from the database.
 *
 * Deletes the provides object from the database.
**/
Riak.prototype.delete = function(record, cb) {
  var Type = this.DataType;
  var bucket = this.bucket;
  
  this.client.remove(bucket, record.id, function(e, data, meta) {
    if (e) {
      if (e.statusCode && e.statusCode == 404) {
        e = util.Error("NotFound", "Could not find a record to delete with id '" + record.id + "'");
      }
      cb(e, undefined);
      return;
    }
    
    cb(null, record);
  });
};

module.exports = Riak;