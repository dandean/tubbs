var assert = require('assert');
var Guid = require('guid');
var Model = require('../index');
var TestModel = require('./fixtures/testmodel');
var id;

var Test = {
  create: function() {
    // var record = new TestModel({
    //   name: "test model"
    // });
    // 
    // record.save(function(e, result) {
    //   id = result.id;
    //   assert.equal(record.name, result.name);
    //   assert.ok(Guid.isGuid(result.id));
    //   assert.ok(result.dateCreated instanceof Date);
    //   assert.ok(result.dateModified instanceof Date);
    //   Test.get();
    // });
  },
  get: function() {
    TestModel.find(id, function(e, result) {
      assert.equal(id, result.id);
      Test.update();
    });
  },
  update: function() {
    var newName = "new name";
    TestModel.find(id, function(e, result) {
      result.name = newName;
      result.save(function(e, result) {
        assert.equal(newName, result.name);
        Test.verify();
      });
    });
  },
  verify: function() {
    TestModel.find(id, function(e, result) {
      assert.equal("new name", result.name);
      Test.delete();
    });
  },
  delete: function() {
    TestModel.find(id, function(e, result) {
      result.delete(Test.verifyDelete);
    });
  },
  verifyDelete: function() {
    TestModel.find(id, function(e, result) {
      assert.ok(e instanceof Model.NotFound);
    });
  },
  all: function() {},
  dynamicFinders: function() {}
};

module.exports = {
  'test suite': Test.create
};
