var util = require('../util');

/**
 * new Rest(data)
 * - config (Object): Configuration options.
 *
 * TODO: rename this module BrowserRest.
 * TODO: create server-side variant.
 * TODO: OR, use node's Request module and its browserland variant.
**/
function Rest(config) {
  this.config = config;
  this.ready = false;
}

/**
 * request(options, callback) -> undefined
 * - options (Object): Optional configuration options.
 * - callback (Function): Callback function when request is complete.
 *
 * Makes a request for JSON from a server. If data is provided, it will be
 * stringified as JSON before sending.
**/
function request(options, callback) {
  var config = this.config;
  var xhr = new XMLHttpRequest();

  var url = options.url;
  var method = options.method || 'GET';

  if (method.match(/^PUT|DELETE|PATCH$/)) {
    if (options.id) {
      url += '/' + options.id;
    } else {
      callback(util.Error("ArgumentError", method + ' requests require the `id` option.'));
      return;
    }
  }

  // TODO: may need to override HTTP method. Browser support metrics needed.
  xhr.open(method, url, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) return;

    // TODO: handle user-defined timeout.
    var data;
    var error;
    try {
      data = JSON.parse(xhr.responseText)
    } catch (e) {}

    var status = xhr.status;
    if (status < 200 || status > 399) {
      if (status === 0) {
        error = util.Error('ConnectionError', 'Could not connect');
      } else if (status >= 500) {
        error = util.Error('ServerError');
      } else error = util.Error('HttpError');
    }

    callback(error, data);
  }.bind(this);

  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.setRequestHeader('Accept', 'application/json, text/javascript, */*');
  xhr.setRequestHeader('Content-type', 'application/json; charset=utf8');

  if (config.headers) for (var name in config.headers) {
    // Configuration-specific headers.
    xhr.setRequestHeader(name, config.headers[name]);
  }

  if (options.headers) for (var name in options.headers) {
    // Request-specific headers.
    xhr.setRequestHeader(name, options.headers[name]);
  }

  xhr.send(options.data ? JSON.stringify(options.data) : null);
}

/**
 * Rest#fetch(callback)
 * - callback (Function): Callback function can receive an error.
 *
 * Fetches all data from the endpoint and sets the internal collection to the result.
**/
Rest.prototype.fetch = fetch;
function fetch(callback) {
  request.call(this, 'GET', this.config.url, function(e, data) {
    if (e) {
      callback(e);
      return;
    }
    this.data = data;
    this.ready = true;
    callback();
  }.bind(this));
}

/**
 * Rest#all(callback(e, result))
 *
 * Provides an Array of all records in the dataset.
**/
Rest.prototype.all = function(callback) {
  var result = [];
  var Type = this.DataType;

  Object.keys(this.data).forEach(function(id) {
    var doc = this.data[id];
    if (doc instanceof Type === false) doc = new Type(doc);
    result.push(doc);
  }.bind(this));

  callback(null, result);
};

/**
 * Rest#find(id, callback(e, result))
 * - id (?): The record ID in the database
 *
 * Finds a single record in the database.
**/
Rest.prototype.find = function(id, callback) {
  var Type = this.DataType;
  if (id in this.data) {
    var doc = this.data[id];
    if (doc instanceof Type === false) doc = new Type(doc);
    callback(null, doc);
    return;
  }
  callback(new Error("Document not found."), null);
};

/**
 * Rest#where(args, filter, callback(e, result))
 * - args (Object): An object hash of named arguments which becomes the 2nd arg passed to `filter`.
 * - filter (Function): A function executed against each document which returns
 * `true` if the document should be included in the result.
 *
 * Provides an Array of all records which pass the `filter`.
**/
Rest.prototype.where = function(args, filter, callback) {
  // TODO: decompose and recompose filter so that it is executed outside of
  // TODO: its originating clusure. This is needed so that the RestStore
  // TODO: API operates the same as other server-based map/reduce API's.
  var Type = this.DataType;
  var result = [];
  Object.keys(this.data).forEach(function(id) {
    var doc = this.data[id];
    if (filter(doc, args)) {
      if (doc instanceof Type === false) doc = new Type(doc);
      result.push(doc);
    }
  }.bind(this));
  callback(null, result);
};

/**
 * Rest#save(record, callback(e, result))
 * - record (Object): An object (or JSON serializable object) to be saved to the database.
 *
 * Saves the provides object to the database.
**/
Rest.prototype.save = function(record, callback) {
  var Type = this.DataType;
  var primaryKey = Type.primaryKey;

  if (primaryKey in record && record[primaryKey] !== undefined && record[primaryKey] !== '') {
    this.data[record[primaryKey]] = record;
    callback(null, record);
    return;
  }
  callback(new Error("Invalid or missing record id."), null);
};

/**
 * Rest#delete(record, callback(e, result))
 * - record (Object): An object (or JSON serializable object) to be deleted from the database.
 *
 * Deletes the provides object from the database.
**/
Rest.prototype.delete = function(record, callback) {
  var Type = this.DataType;
  var primaryKey = Type.primaryKey;

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

module.exports = Rest;