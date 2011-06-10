var Model = require('../../index');

var TestModel = Model.create({
  schema: {
    dateCreated: Date,
    dateModified: Date,
    id: String,
    name: String
  },
  bucket: "test"
});

module.exports = TestModel;