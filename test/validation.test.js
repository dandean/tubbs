var assert = require('assert');
var Guid = require('guid');
var Model = require('../index');

// TODO: validate format

var m;

function FAIL(cb, log) {
  return function(e, success) {
    if (log) console.log(e, success, m.errors);
    assert.ok(e instanceof Error);
    assert.ok("username" in m.errors === true);
    assert.equal(1, m.errors.username.length);
    if (cb) cb();
  };
}

function PASS(cb, log) {
  return function(e, success) {
    if (log) console.log(e, success, m.errors);
    assert.equal(null, e);
    assert.ok("username" in m.errors === false);
    if (cb) cb();
  };
}



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
    var TestModel;
    
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
      m.validate(PASS(createModelScaffoldWithMinAndMaxAllowingUndefined));
    }

    // OPTION: MIN, MAX with allowUndefined and allowNull

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
      m.validate(PASS(validateNullWithAllowUndefined));
    }

    function validateNullWithAllowUndefined() {
      m = new TestModel();
      m.username = null;
      m.validate(FAIL(createModelScaffoldWithMinAndMaxAllowingNull));
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
      m.validate(FAIL(validateNullWithAllowNull));
    }

    function validateNullWithAllowNull() {
      m = new TestModel();
      m.username = null;
      m.validate(PASS());
    }
  },

  'validate - format': function() {
    
    createModelWithInvalidOptions();
    
    function createModelWithInvalidOptions() {
      assert.throws( function() {
        TestModel = Model.create({
          fields: {
            id: Guid.raw,
            username: undefined
          },
          validation: [
            // Lack of either "with" or "without" options is invalid
            Model.Validate.formatOf("username", {})
          ]
        });
      } );
      
      createAndValidateModelWithFormatWithOption();
    }
    
    function createAndValidateModelWithFormatWithOption() {
      TestModel = Model.create({
        fields: {
          id: Guid.raw,
          username: undefined
        },
        validation: [
          Model.Validate.formatOf("username", {
            with: /^\w+$/
          })
        ]
      });
      
      m = new TestModel();
      m.validate(FAIL(validateWordShouldPass));
    }
    
    function validateWordShouldPass() {
      m.username = 'hello';
      m.validate(PASS(validateNonWordShouldFail));
    }
    
    function validateNonWordShouldFail() {
      m.username = 'hello---';
      m.validate(FAIL(createAndValidateModelWithFormatWithoutOption));
    }
    
    function createAndValidateModelWithFormatWithoutOption() {
      TestModel = Model.create({
        fields: {
          id: Guid.raw,
          username: undefined
        },
        validation: [
          Model.Validate.formatOf("username", {
            without: /\w/
          })
        ]
      });
      
      m = new TestModel();
      m.validate(PASS(validateWithoutWordWithWordShouldFail));
    }
    
    function validateWithoutWordWithWordShouldFail() {
      m.username = 'hello';
      m.validate(FAIL(validateWithoutWordWithoutWordShouldPass));
    }
    
    function validateWithoutWordWithoutWordShouldPass() {
      m.username = '---';
      m.validate(PASS(createModelWithWithAndAllowNullOptions));
    }
    
    function createModelWithWithAndAllowNullOptions() {
      TestModel = Model.create({
        fields: {
          id: Guid.raw,
          username: undefined
        },
        validation: [
          Model.Validate.formatOf("username", {
            with: /\w/,
            allowNull: true
          })
        ]
      });
      
      m = new TestModel();
      
      validatingNullWithAllowNullOptionsShouldPass();
    }
    
    function validatingNullWithAllowNullOptionsShouldPass() {
      m.username = null;
      m.validate(PASS(validatingUndefinedWithAllowNullOptionsShouldFail));
    }
        
    function validatingUndefinedWithAllowNullOptionsShouldFail() {
      m.username = undefined;
      m.validate(FAIL(false));
    }
  },
  
  'validate - if option': function() {
    createAndValidateModelWithIFOption();
    
    function createAndValidateModelWithIFOption() {
      TestModel = Model.create({
        fields: {
          username: undefined
        },
        validation: [
          Model.Validate.formatOf("username", {
            with: /^\w+$/,
            if : function(instance, value) {
              // Only validate the username if it exists and does not contain "zwick"
              return value && value.indexOf('zwick') == -1;
            }
          })
        ]
      });
      
      m = new TestModel({ username: 'zwick hi there !!!' });
      m.validate(PASS(createAndValidateModelWithUNLESSOption));
    }
    
    function createAndValidateModelWithUNLESSOption() {
      TestModel = Model.create({
        fields: {
          username: undefined
        },
        validation: [
          Model.Validate.formatOf("username", {
            with: /^\w+$/,
            unless : function(instance, value) {
              // Run the validator unless the value contains "zwick"
              return value && value.indexOf('zwick') > -1;
            }
          })
        ]
      });
      
      m = new TestModel({ username: 'zwick hi there !!!' });
      m.validate(PASS());
    }
    
  }
};
