var assert = require('assert');
var Guid = require('guid');
var Model = require('../index');

var id = 0;
var TestModel1 = Model.create((function(){
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

module.exports = {
  '1': function() {
    // var instance = new TestModel1({
    //   first: "Rad"
    // });
    // 
    // // Check that property defaults are used when value's are not specified.
    // assert.equal("Rad", instance.first);
    // assert.equal("Doe", instance.last);
    // assert.equal(undefined, instance.username);
    // assert.equal(1, instance.id);
    // assert.equal("Rad Doe", instance.name);
    // 
    // // Unset instance values so that their defaults come back.
    // instance.first = undefined;
    // instance.id = undefined;
    // 
    // // Check that default values are returned when local values are set to `undefined`.
    // assert.equal("John", instance.first, "`first` should be 'John' but is " + instance.first);
    // assert.equal(2, instance.id, 'default `id` should have been generated but was not, and is ' + instance.id);
    // 
    // // Use a real dataStore in order to check db methods.
    // TestModel1.dataStore = new Model.MemoryStore({
    //   1: {
    //     id: 1,
    //     username: 'one'
    //   }
    // });
    // 
    // TestModel1.find(1, function(e, result) {
    //   assert.ok(result, '`result` should have a value but does not: ' + result);
    //   assert.equal(1, result.id, '`result.id` should be the same as what was searched for.');
    //   assert.equal('one', result.username, '`result.username` should be "one"');
    // });
    // 
    // var two = new TestModel1({
    //   id: 2,
    //   username: 'two'
    // });
    // 
    // two.save(function(e, result) {
    //   TestModel1.find(2, function(e, result) {
    //     assert.ok(result, 'result should have been found.');
    //     assert.equal(2, result.id, 'result.id should have been 2.');
    //     assert.equal('two', result.username, 'result.username should have been "two".');
    //     
    //     result.delete(function(e, result) {
    // 
    //       TestModel1.find(2, function(e, result) {
    //         assert.ok(result === null, 'result.id should have been deleted from the dataStore.');
    //       });
    //     });
    //   });
    // });
  },

  'model definition': function() {
    // Check for the presence of all defined model properties (virtual and real)
    assert.ok("id" in TestModel1.prototype);
    assert.ok("username" in TestModel1.prototype);
    assert.ok("first" in TestModel1.prototype);
    assert.ok("last" in TestModel1.prototype);
    assert.ok("name" in TestModel1.prototype);
    
    // Only defined properties should  reside on the prototype...
    assert.equal(5, Object.keys(TestModel1.prototype).length);
    
    // Check for presence of defined properties on instance...
    var model = new TestModel1(); // id == 1
    
    assert.ok("id" in model);
    assert.ok("username" in model);
    assert.ok("first" in model);
    assert.ok("last" in model);
    assert.ok("name" in model);
  },
  'default property values': function() {
    var model = new TestModel1(); // id == 2
    
    // Check all default values...
    assert.equal(1, model.id);
    assert.equal(undefined, model.username);
    assert.equal('John', model.first);
    assert.equal('Doe', model.last);
    assert.equal('John Doe', model.name);
    
    // Set new value...
    model.first = 'Rad';
    assert.equal('Rad', model.first);
    assert.equal('Rad Doe', model.name);
    
    // Unset value, ensure defaults...
    model.first = undefined;
    assert.equal('John', model.first);
    assert.equal('John Doe', model.name);
    
    // Check function-type defaults for re-execution...
    model.id = undefined; // id == 3
    assert.equal(2, model.id, 'Function-default should have executed, incrementing the ID.');

    // Instantiate with a non-default value...
    model = new TestModel1({ first: 'Rad' }); // id == 4
    assert.equal('Rad', model.first);
    assert.equal('Rad Doe', model.name);

    // Unset value, ensure defaults...
    model.first = undefined;
    assert.equal('John', model.first);
    assert.equal('John Doe', model.name);
  },
  'json serialization': function() {
    var model = new TestModel1(); // id == 5
    var json = model.toJSON();
    assert.equal(4, Object.keys(json).length);
    assert.ok("id" in json);
    assert.ok("username" in json);
    assert.ok("first" in json);
    assert.ok("last" in json);
  },
  'subclassing': function() {
    var TestModel2 = TestModel1.create({
      fields: {
        power: 'i can fly'
      }
    });
    
    var model = new TestModel2(); // id == 6
    assert.ok("id" in model);
    assert.ok("username" in model);
    assert.ok("first" in model);
    assert.ok("last" in model);
    assert.ok("name" in model);
    assert.ok("power" in model);
    
    model.power = 'i cannot fly';
    assert.equal('i cannot fly', model.power);

    model.power = undefined;
    assert.equal('i can fly', model.power);
    
    var TestModel3 = TestModel2.create({
      fields: {
        weakness: 'i cannot swim'
      }
    });
    
    model = new TestModel3({ // id == 7
      power: 'punch hard',
      weakness: 'pizza'
    });

    assert.equal('punch hard', model.power);
    assert.equal('pizza', model.weakness);
    
    model.power = undefined;
    model.weakness = undefined;

    assert.equal('i can fly', model.power);
    assert.equal('i cannot swim', model.weakness);
  },
  'class-level database methods': function() {},
  'instance-level database methods': function() {},
  'validation': function() {}
};
