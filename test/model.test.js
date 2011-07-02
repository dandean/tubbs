var assert = require('assert');
var Guid = require('guid');
var Model = require('../index');

var id = 0;
var TestModel1 = Model.create((function(){
  var i = 0;
  return {
    dataStore: new Model.MemoryStore(),
    fields: {
      id: function() {i++; return i; },
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
    
    assert.equal(1, model.id);
    assert.ok("id" in model);
    assert.ok("username" in model);
    assert.ok("first" in model);
    assert.ok("last" in model);
    assert.ok("name" in model);
  },

  'default property values': function() {
    var model = new TestModel1(); // id == 2
    
    // Check all default values...
    assert.equal(2, model.id);
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
    assert.equal(3, model.id, 'Function-default should have executed, incrementing the ID.');

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
    // Subclass, adding a new property
    var TestModel2 = TestModel1.create({
      fields: {
        power: 'i can fly'
      }
    });
    
    // Ensure that all parent properties AND the new property are in the model.
    var model = new TestModel2(); // id == 6
    assert.ok("id" in model);
    assert.ok("username" in model);
    assert.ok("first" in model);
    assert.ok("last" in model);
    assert.ok("name" in model);
    assert.ok("power" in model);
    
    // Check default value for new property
    assert.equal('i can fly', model.power);
    
    // Override default value.
    model.power = 'i cannot fly';
    assert.equal('i cannot fly', model.power);

    // Subclass the subclass, adding a new property
    var TestModel3 = TestModel2.create({
      fields: {
        weakness: 'i cannot swim'
      }
    });
    
    // Set values for new properties...
    model = new TestModel3({ // id == 7
      power: 'punch hard',
      weakness: 'pizza'
    });
    

    // Check local values of new properties
    assert.equal('punch hard', model.power);
    assert.equal('pizza', model.weakness);
    
    // Unset local values...
    model.power = undefined;
    model.weakness = undefined;

    // Check that defaults return...
    assert.equal('i can fly', model.power, "Power was deleted so should be the default but is ", model.power);
    assert.equal('i cannot swim', model.weakness);
    
    // Check that subclasses are maintaining their inheritance chain.
    assert.ok(model instanceof TestModel3);
    assert.ok(model instanceof TestModel2);
    assert.ok(model instanceof TestModel1);
    assert.ok(model instanceof Model);
  },

  'class-level database methods': function() {
    TestModel1.save(new TestModel1({
      username: "userone",
      first: "User",
      last: "One"
    }), createUserTwo);
    
    function createUserTwo() {
      TestModel1.save(new TestModel1({
        username: "usertwo",
        first: "User",
        last: "Two"
      }), getAllRecords);
    }
    
    function getAllRecords(e, result) {
      TestModel1.all(function(e, all) {
        assert.equal(2, all.length);
        findRecord(all[0].id);
      });
    }
    
    function findRecord(id) {
      TestModel1.find(id, function(e, record) {
        assert.ok(record instanceof Model && record instanceof TestModel1);
        assert.equal("userone", record.username);
        
        getByWhereClause();
      });
    }
    
    function findUserOneAndTwo(userData) {
      return userData.username && userData.username.match(/user(one|two)/);
    }
    
    function getByWhereClause() {
      TestModel1.where(findUserOneAndTwo, assertWhereClauseResult);
    }
    
    function assertWhereClauseResult(e, result) {
      assert.ok(result[0] instanceof Model && result[0] instanceof TestModel1);
      assert.ok(result[1] instanceof Model && result[1] instanceof TestModel1);
      assert.equal(result.length, 2);
      
      deleteRecord(result[0].id);
    }
    
    function deleteRecord(id) {
      TestModel1.delete(id, function(e, result) {
        TestModel1.where(findUserOneAndTwo, assertUserDeleted);
      });
    }
    
    function assertUserDeleted(e, result) {
      assert.ok(result[0] instanceof Model && result[0] instanceof TestModel1);
      assert.equal(result.length, 1);
    }
  },

  'instance-level database methods': function() {
    new TestModel1({
      username: "userthree",
      first: "User",
      last: "Three"
    }).save(function(e, result) {
      findRecord(result.id);
    });
    
    function findRecord(id) {
      TestModel1.find(id, function(e, record) {
        assert.ok(record instanceof Model && record instanceof TestModel1);
        assert.equal("userthree", record.username);

        record.delete(function(e, result) {
          TestModel1.find(id, assertUserDeleted);
        });

      });
    }

    function assertUserDeleted(e, result) {
      assert.ok(e instanceof Error);
      assert.equal(e.message, 'Document not found.');
      assert.equal(null, result);
    }
  },

  'generated (schema-based) database methods': function() {},

  'validation': function() {
    // return;
    var TestModel1 = Model.create({
      dataStore: new Model.MemoryStore(),
      fields: {
        id: Guid.raw,
        username: undefined,
        first: 'John',
        last: 'Doe'
      },
      
      // `Validates.*` methods are factories which return an async function. These
      // functions are then called with the instance as `this`. Functions are
      // stored in a queue based on their event name ('on', for instance).
      validation: [
        // uniquenessOf: would need to refactor internals so that this isn't
        // executed on MyModel.find(id, cb), for instance.
        // Model.Validates.uniquenessOf("id"),
        
        Model.Validate.lengthOf("username", {
          min: 4,
          max: 20,
          tooShortMessage: 'Too damn short!',
          tooLongMessage: 'Too darn long!!!'
        })//,
        // 
        // Model.Validates.custom('username', function(value, callback) {
        //   callback(null, value != 'admin');
        // }, { on: 'create' })
      ]
    });
    
    var m = new TestModel1({ username: "i" });

    m.validate(function(e, success) {
      console.log(e, success, m.errors);
      m.username = 'asdfasdfasdf';

      m.validate(function(e, success) {
        console.log(e, success, m.errors);
      });
    });
  }
};
