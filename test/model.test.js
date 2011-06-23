var assert = require('assert');
var Guid = require('guid');
var Model = require('../index');

var TestModel;
var id = 0;

module.exports = {
  '1': function() {

    var TestModel = Model.create((function(){
      var i = 0;
      return {
        fields: {
          id: function() { i++; return i; },
          username: undefined,
          first: 'John',
          last: 'Doe'
        },
        virtual: {
          name: function() {
            return ((this.first || '') + ' ' + (this.last || '')).trim();
          }
        }
      };
    })());
    
    // Check for the presence of all defined model properties (virtual and real)
    assert.ok("id" in TestModel.prototype);
    assert.ok("username" in TestModel.prototype);
    assert.ok("first" in TestModel.prototype);
    assert.ok("last" in TestModel.prototype);
    assert.ok("name" in TestModel.prototype);
    assert.equal(5, Object.keys(TestModel.prototype).length);

    var instance = new TestModel({
      first: "Rad"
    });
    
    // Check that property defaults are used when value's are not specified.
    assert.equal("Rad", instance.first);
    assert.equal("Doe", instance.last);
    assert.equal(undefined, instance.username);
    assert.equal(1, instance.id);
    assert.equal("Rad Doe", instance.name);
    
    // Unset instance values so that their defaults come back.
    instance.first = undefined;
    instance.id = undefined;

    // Check that default values are returned when local values are set to `undefined`.
    assert.equal("John", instance.first, "`first` should be 'John' but is " + instance.first);
    assert.equal(2, instance.id, 'default `id` should have been generated but was not, and is ' + instance.id);
    
    // Use a real dataStore in order to check db methods.
    TestModel.dataStore = new Model.MemoryStore({
      1: {
        id: 1,
        username: 'one'
      }
    });

    TestModel.find(1, function(e, result) {
      assert.ok(result, '`result` should have a value but does not: ' + result);
      assert.equal(1, result.id, '`result.id` should be the same as what was searched for.');
      assert.equal('one', result.username, '`result.username` should be "one"');
    });
    
    var two = new TestModel({
      id: 2,
      username: 'two'
    });
    
    two.save(function(e, result) {
      TestModel.find(2, function(e, result) {
        assert.ok(result, 'result should have been found.');
        assert.equal(2, result.id, 'result.id should have been 2.');
        assert.equal('two', result.username, 'result.username should have been "two".');
        
        result.delete(function(e, result) {

          TestModel.find(2, function(e, result) {
            assert.ok(result === null, 'result.id should have been deleted from the dataStore.');
          });
        });
      });
    });
  },

  'model definition': function() {},
  'default property values': function() {},
  'json serialization': function() {},
  'class-level database methods': function() {},
  'instance-level database methods': function() {}
};
