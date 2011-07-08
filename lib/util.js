module.exports = {
  Error: function(type, message) {
    var error = new Error(message);
    error.name = type;
    return error;
  }
};