var assert = require('assert');
var Guid = require('guid');
var Model = require('../index');

// TODO: validate length with allowUndefined and allowNull options...

module.exports = {
  'validation - required': function() {
    var TestModel, m;
    
    createModelScaffold();

    function createModelScaffold() {
      TestModel = Model.create({
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
      m = new TestModel();
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
  },
  
  'validate - length': function() {
    var TestModel, m;
    
    createModelScaffoldWithInvalidOptions();

    function createModelScaffoldWithInvalidOptions() {
      assert.throws( function() {
        TestModel = Model.create({
          fields: {
            id: Guid.raw,
            username: undefined
          },
          validation: [
            // This validator should throw an Error when it is created
            Model.Validate.lengthOf("username")
          ]
        });
      } );
      
      createModelScaffoldWithMinValue();
    }
    
    // OPTION: MIN
    
    function createModelScaffoldWithMinValue() {
      TestModel = Model.create({
        fields: {
          id: Guid.raw,
          username: undefined
        },
        validation: [
          Model.Validate.lengthOf("username", { min: 5 })
        ]
      });
      
      validateMinLengthAgainstNoValue();
    }
    
    function validateMinLengthAgainstNoValue() {
      m = new TestModel();
      m.validate(function(e, success) {
        assert.ok(e instanceof Error);
        assert.ok('username' in m.errors);
        assert.equal('"username" is the wrong length', m.errors.username[0]);
        validateMinLengthAgainstValueTooShort();
      });
    }
    
    function validateMinLengthAgainstValueTooShort() {
      m.username = 'hi';
      m.validate(function(e, success) {
        assert.ok(e instanceof Error);
        assert.ok('username' in m.errors);
        assert.equal('"username" is the wrong length', m.errors.username[0]);
        validateMinLengthAgainstValidValue();
      });
    }
    
    function validateMinLengthAgainstValidValue() {
      m.username = 'hello';
      m.validate(function(e, success) {
        assert.equal(null, e);
        assert.ok('username' in m.errors === false);
        
        createModelScaffoldWithMaxValue();
      });
    }
    
    // OPTION: MAX

    function createModelScaffoldWithMaxValue() {
      TestModel = Model.create({
        fields: {
          id: Guid.raw,
          username: undefined
        },
        validation: [
          Model.Validate.lengthOf("username", { max: 5 })
        ]
      });
      
      validateMaxLengthAgainstNoValue();
    }

    function validateMaxLengthAgainstNoValue() {
      m = new TestModel();
      m.validate(function(e, success) {
        assert.equal(null, e);
        assert.ok('username' in m.errors === false);
        validateMaxLengthAgainstValueTooLong();
      });
    }
    
    function validateMaxLengthAgainstValueTooLong() {
      m.username = 'hello!';
      m.validate(function(e, success) {
        assert.ok(e instanceof Error);
        assert.ok('username' in m.errors);
        assert.equal('"username" is the wrong length', m.errors.username[0]);
        validateMaxLengthAgainstValidValue();
      });
    }
    
    function validateMaxLengthAgainstValidValue() {
      m.username = 'hi';
      m.validate(function(e, success) {
        assert.equal(null, e);
        assert.ok('username' in m.errors === false);
        createModelScaffoldWithMinAndMax();
      });
    }

    // OPTION: MIN, MAX

    function createModelScaffoldWithMinAndMax() {
      TestModel = Model.create({
        fields: {
          id: Guid.raw,
          username: undefined
        },
        validation: [
          Model.Validate.lengthOf("username", { min: 2, max: 5 })
        ]
      });
      
      validateMinAndMaxLengthAgainstNoValue();
    }

    function validateMinAndMaxLengthAgainstNoValue() {
      m = new TestModel();
      m.validate(function(e, success) {
        assert.ok(e instanceof Error);
        assert.ok('username' in m.errors);
        assert.equal('"username" is the wrong length', m.errors.username[0]);
        validateMinAndMaxLengthAgainstValueTooLong();
      });
    }
    
    function validateMinAndMaxLengthAgainstValueTooLong() {
      m.username = 'hello!';
      m.validate(function(e, success) {
        assert.ok(e instanceof Error);
        assert.ok('username' in m.errors);
        assert.equal('"username" is the wrong length', m.errors.username[0]);
        validateMinAndMaxLengthAgainstValueTooShort();
      });
    }
    
    function validateMinAndMaxLengthAgainstValueTooShort() {
      m.username = 'h';
      m.validate(function(e, success) {
        assert.ok(e instanceof Error);
        assert.ok('username' in m.errors);
        assert.equal('"username" is the wrong length', m.errors.username[0]);
        validateMinAndMaxLengthAgainstValidValue();
      });
    }
    
    function validateMinAndMaxLengthAgainstValidValue() {
      m.username = 'wow';
      m.validate(function(e, success) {
        assert.equal(null, e);
        assert.ok('username' in m.errors === false);
        createModelScaffoldWithMinAndMaxAllowingUndefined();
      });
    }

    // OPTION: MIN, MAX with allowUndefined

    function createModelScaffoldWithMinAndMaxAllowingUndefined() {
      TestModel = Model.create({
        fields: {
          id: Guid.raw,
          username: undefined
        },
        validation: [
          Model.Validate.lengthOf("username", {
            min: 2,
            max: 5,
            allowUndefined: true
          })
        ]
      });
      
      validateUndefinedWithAllowUndefined();
    }

    function validateUndefinedWithAllowUndefined() {
      m = new TestModel();
      m.validate(function(e, success) {
        assert.equal(e, null);
        assert.ok('username' in m.errors === false);
        validateNullWithAllowUndefined();
      });
    }

    function validateNullWithAllowUndefined() {
      m = new TestModel();
      m.username = null;
      m.validate(function(e, success) {
        assert.ok(e instanceof Error);
        assert.ok('username' in m.errors);
        // validateMinAndMaxLengthAgainstValueTooLong();
      });
    }

    function createModelScaffoldWithMinAndMaxAllowingNull() {
      TestModel = Model.create({
        fields: {
          id: Guid.raw,
          username: undefined
        },
        validation: [
          Model.Validate.lengthOf("username", {
            min: 2,
            max: 5,
            allowNull: true
          })
        ]
      });
      
      validateUndefinedWithAllowNull();
    }

    function validateUndefinedWithAllowNull() {
      m = new TestModel();
      m.validate(function(e, success) {
        assert.ok(e instanceof Error);
        assert.ok('username' in m.errors);
        validateNullWithAllowNull();
      });
    }

    function validateNullWithAllowNull() {
      m = new TestModel();
      m.username = null;
      m.validate(function(e, success) {
        assert.equal(e, null);
        assert.ok('username' in m.errors === false);
      });
    }
  },

  'validate - format': function() {
    
  }
};
