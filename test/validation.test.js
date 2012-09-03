var assert = require('assert');
var Model = require('../index');

// TODO: validate format

function FAIL(model, cb, log) {
  return function(e, success) {
    if (log) console.log(e, success, model.errors);
    assert.ok(e instanceof Error);
    assert.ok("username" in model.errors === true);
    assert.equal(1, model.errors.username.length);
    if (cb) cb();
  };
}

function PASS(model, cb, log) {
  return function(e, success) {
    if (log) console.log(e, success, model.errors);
    assert.equal(null, e);
    assert.ok("username" in model.errors === false);
    if (cb) cb();
  };
}

describe('Model', function() {

  it('should validate required fields', function(done) {
    var TestModel = Model.define({
      fields: {
        id: undefined,
        username: undefined
      },
      validation: [
        Model.Validate.required("username")
      ]
    });
    var m = new TestModel();

    validateWithUsernameAsUndefined();
    
    function validateWithUsernameAsUndefined() {
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
        done();
      });
    }
  });

  describe('`lengthOf` validator', function() {
    it('should throw an error when configured incorrectly', function() {
      assert.throws(function() {
        Model.define({
          fields: {
            id: undefined,
            username: undefined
          },
          validation: [
            // This validator should throw an Error when it is created
            Model.Validate.lengthOf("username")
          ]
        });
      });
    });

    describe('with `min` option set', function() {
      var TestModel = Model.define({
        fields: {
          id: undefined,
          username: undefined
        },
        validation: [
          Model.Validate.lengthOf("username", { min: 5 })
        ]
      });
      var m = new TestModel();

      it('should mark a property invalid when it is missing', function(done) {
        m.validate(function(e, success) {
          assert.ok(e instanceof Error);
          assert.ok('username' in m.errors);
          assert.equal('"username" is the wrong length', m.errors.username[0]);
          done();
        });
      });

      it('should mark a property invalid when it is too short', function(done) {
        m.username = 'hi';
        m.validate(function(e, success) {
          assert.ok(e instanceof Error);
          assert.ok('username' in m.errors);
          assert.equal('"username" is the wrong length', m.errors.username[0]);
          done();
        });
      });

      it('should NOT mark a valid property as invalid', function(done) {
        m.username = 'hello';
        m.validate(function(e, success) {
          assert.equal(null, e);
          assert.ok('username' in m.errors === false);
          done();
        });
      })
    });

    describe('with `max` option set', function() {
      var TestModel = Model.define({
        fields: {
          id: undefined,
          username: undefined
        },
        validation: [
          Model.Validate.lengthOf("username", { max: 5 })
        ]
      });
      var m = new TestModel();

      it('should not mark missing value is invalid', function(done) {
        m.validate(function(e, success) {
          assert.equal(null, e);
          assert.ok('username' in m.errors === false);
          done();
        });
      });

      it('should mark property invalid when it is too long', function(done) {
        m.username = 'hello!';
        m.validate(function(e, success) {
          assert.ok(e instanceof Error);
          assert.ok('username' in m.errors);
          assert.equal('"username" is the wrong length', m.errors.username[0]);
          done();
        });
      });

      it('should not mark property invalid when it is not too long', function(done) {
        m.username = 'hi';
        m.validate(function(e, success) {
          assert.equal(null, e);
          assert.ok('username' in m.errors === false);
          done();
        });
      });
    });

    describe('with `min` and `max` options set', function() {
      var TestModel = Model.define({
        fields: {
          id: undefined,
          username: undefined
        },
        validation: [
          Model.Validate.lengthOf("username", { min: 2, max: 5 })
        ]
      });
      var m = new TestModel();

      it('should mark property invalid when it is missing', function(done) {
        m.validate(function(e, success) {
          assert.ok(e instanceof Error);
          assert.ok('username' in m.errors);
          assert.equal('"username" is the wrong length', m.errors.username[0]);
          done();
        });
      });

      it('should mark property invalid when it is too long', function(done) {
        m.username = 'hello!';
        m.validate(function(e, success) {
          assert.ok(e instanceof Error);
          assert.ok('username' in m.errors);
          assert.equal('"username" is the wrong length', m.errors.username[0]);
          done();
        });
      });

      it('should mark property invalid when it is too short', function(done) {
        m.username = 'h';
        m.validate(function(e, success) {
          assert.ok(e instanceof Error);
          assert.ok('username' in m.errors);
          assert.equal('"username" is the wrong length', m.errors.username[0]);
          done();
        });
      });

      it('should NOT mark property invalid when between two options lengths', function(done) {
        m.username = 'wow';
        m.validate(PASS(m, done));
      });

      describe('and `allowUndefined:true`', function() {
        var TestModel = Model.define({
          fields: {
            id: undefined,
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
        var m = new TestModel();

        it('should not mark property invalid when `undefined`', function(done) {
          m.validate(PASS(m, done));
        });

        it('should mark property invalid when `null`', function(done) {
          m.username = null;
          m.validate(FAIL(m, done));
        });
      });

      describe('and `allowNull:true`', function() {
        var TestModel = Model.define({
          fields: {
            id: undefined,
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
        var m = new TestModel();

        it('should mark property invalid when `undefined`', function(done) {
          m.validate(FAIL(m, done));
        });

        it('should not mark property invalid when `null`', function(done) {
          m.username = null;
          m.validate(PASS(m, done));
        });
      });
    });
  });

  describe('`formatOf` validator', function() {
    it('should throw an error when configured incorrectly', function() {
      assert.throws(function() {
        Model.define({
          fields: {
            id: undefined,
            username: undefined
          },
          validation: [
            // Lack of either "with" or "without" options is invalid
            Model.Validate.formatOf("username", {})
          ]
        });
      });
    });

    describe('with `with` option set', function() {
      var TestModel = Model.define({
        fields: {
          id: undefined,
          username: undefined
        },
        validation: [
          Model.Validate.formatOf("username", {
            with: /^\w+$/
          })
        ]
      });
      var m = new TestModel();

      it('should not mark property invalid when matches', function(done) {
        m.validate(FAIL(m, done));
      });

      it('should mark property invalid when it does not match', function(done) {
        m.username = 'hello---';
        m.validate(FAIL(m, done));
      });

      describe('and `allowNull:true`', function() {
        var TestModel = Model.define({
          fields: {
            id: undefined,
            username: undefined
          },
          validation: [
            Model.Validate.formatOf("username", {
              with: /\w/,
              allowNull: true
            })
          ]
        });
        var m = new TestModel();

        it('should not mark property invalid when `null`', function(done) {
          m.username = null;
          m.validate(PASS(m, done));
        });

        it('should mark property invalid when `undefined`', function(done) {
          m.username = undefined;
          m.validate(FAIL(m, done));
        });

      });
    });

    describe('with `without` option set', function() {
      var TestModel = Model.define({
        fields: {
          id: undefined,
          username: undefined
        },
        validation: [
          Model.Validate.formatOf("username", {
            without: /\w/
          })
        ]
      });
      var m = new TestModel();

      it('should not mark property invalid if property does not match', function(done) {
        m.username = '---';
        m.validate(PASS(m, done));
      });

      it('should mark property invalid when it matches', function(done) {
        m.username = 'hello';
        m.validate(FAIL(m, done));
      });
    });
  });

  describe('`if` option', function() {

    var TestModel = Model.define({
      fields: {
        username: undefined
      },
      validation: [
        Model.Validate.formatOf("username", {
          with: /^\w+$/, // MUST be solid string of word characters
          if : function(instance, value) {
            // Only validate the username if it exists and contains "zwick"
            return value && value.indexOf('zwick') > -1;
          }
        })
      ]
    });
    var m = new TestModel();

    it('should run validator if `if` option returns true', function(done) {
      // Contains "zwick", validate it.
      m.username = 'df asdf__zwick__sdfasdfasdf';
      m.validate(FAIL(m, done));
    });

    it('should not run validator if `if` option returns false', function(done) {
      // Does not contain "zwick", do not validate it.
      m.username = 'df asdfsdfasdfasdf';
      m.validate(PASS(m, done));
    });

  });

  describe('`unless` option', function() {
    var TestModel = Model.define({
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
    var m = new TestModel();

    it('should skip validator if `unless` option returns true', function(done) {
      // Contains "zwick", skip validation.
      m.username = 'df asdf__zwick__sdfasdfasdf';
      m.validate(PASS(m, done));
    });

    it('should not skip validation if `unless` option returns false', function(done) {
      // Does not contain "zwick", do not skip validation.
      m.username = 'df asdfsdfasdfasdf';
      m.validate(FAIL(m, done));
    });

  });
});
