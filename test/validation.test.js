var assert = require('assert');
var Guid = require('guid');
var Model = require('../index');

module.exports = {
  'validation - required': function() {
    var TestModel1, m;
    
    createModelScaffold();

    function createModelScaffold() {
      TestModel1 = Model.create({
        dataStore: new Model.MemoryStore(),
        fields: {
          id: Guid.raw,
          username: undefined
        },
        validation: [
          Model.Validate.required("username")
        ]
      });
      validateWithUsernameAsUndefined();
    }
    
    function validateWithUsernameAsUndefined() {
      m = new TestModel1();
      m.validate(function(e, success) {
        assert.ok(e instanceof Error);
        assert.ok('username' in m.errors);
        assert.equal(1, m.errors.username.length);
        validateWithUsernameAsNull();
      });
    }
    
    function validateWithUsernameAsNull() {
      m.username = null;
      m.validate(function(e, success) {
        assert.ok(e instanceof Error);
        assert.ok('username' in m.errors);
        assert.equal(1, m.errors.username.length);
        validateWithUsernameAsBlank();
      });
    }
    
    function validateWithUsernameAsBlank() {
      m.username = '';
      m.validate(function(e, success) {
        assert.ok(e instanceof Error);
        assert.ok('username' in m.errors);
        assert.equal(1, m.errors.username.length);
        validateWithUsernamePresent();
      });
    }
    
    function validateWithUsernamePresent() {
      m.username = 'some username';
      m.validate(function(e, success) {
        assert.equal(null, e);
        assert.ok('username' in m.errors === false);
      });
    }
  }
};
