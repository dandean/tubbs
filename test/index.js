// This file will get compiled by Modulr and served as /tubbs.js
var assert = require('assert');
var Memory = require('../lib/memory');
var Tubbs = require('../index');

// Export the require function for easy console debugger.
if (typeof window != 'undefined') window.__require = require;

describe('Tubbs', function() {

  it('should decorate a Function', function() {
    function User(data, options) {
      this.setData(data);
    }

    Tubbs(User, {
      primaryKey: 'id',
      dataStore: new Memory(User)
    });

    [ 'primaryKey', 'dataStore',
      'find', 'where', 'all', 'fetch', 'delete'
    ].forEach(function(name) {
      assert.ok(name in User);
    });

    assert.equal('id', User.primaryKey);
  });

  it('should decorate a Function\'s prototype', function() {
    // GENERIC USER
    function User(data, options) {
      this.setData(data);
    }

    Tubbs(User, {
      primaryKey: 'id',
      basicProperties: ['first','last'],
      fullName: {
        get: function() {
          return this.get('first') + ' ' + this.get('last');
        },
        enumerable: true
      }
    });

    var user = new User();

    // Verify all expected API properties exist:
    [ 'first', 'last', 'fullName',
      'id', 'isNew',
      'get', 'set', 'setValue',
      'setData',
      'toJSON',
      'on', 'off', 'emit'
    ].forEach(function(name) {
      assert.ok(name in user);
    });

    // ORGANIZATION
    // function Organization(data, options) {
    //   Tubbs.apply(this, arguments);
    // }

    // Organization.prototype = Object.create(Tubbs.prototype, {
    //   __dataStore__: {
    //     value: new Memory(Organization, { url: '/organizations' })
    //   },

    //   __primary__: { value: 'id' },

    //   // Basic getters and setters
    //   __fields__: {
    //     value: ['name','url']
    //   },

    //   User: {
    //     get: function() {
    //       if (this.__userModel) return this.__userModel;
    //       if (this.isNew) throw new Error();

    //       // TODO: create the model, assign it and return it.
    //       var id = this.id;

    //       function OrganizationUser(data, options) {
    //         User.apply(this, arguments);
    //       }

    //       OrganizationUser.prototype = Object.create(User.prototype);

    //       Tubbs(OrganizationUser, {
    //         dataStore: new Memory(OrganizationUser, {
    //           url: '/organizations' + id + '/users'
    //         })
    //       });

    //       return this.__userModel = OrganizationUser;
    //     }
    //   }

    // });

    // // Class-level Data Source Methods and the constructor reference
    // Tubbs.decorate(Organization);












    // User.where();

    // var x = new User();
    // x.save();
    // x.fullName;
  });

  it('decorations should not clobber each other', function() {
    function Type1(data, options) {
      this.setData(data);
    }

    Tubbs(Type1, {
      primaryKey: 'id',
      dataStore: new Memory(Type1)
    });

    function Type2(data, options) {
      this.setData(data);
    }

    Tubbs(Type2, {
      primaryKey: 'uuid',
      dataStore: new Memory(Type2)
    });

    assert.notEqual(Type1.primaryKey, Type2.primaryKey);
    assert.notEqual(Type1.dataStore, Type2.dataStore);
  });

  it('should save and find data', function(done) {
    function User(data, options) {
      this.setData(data);
    }

    Tubbs(User, {
      primaryKey: 'id',
      dataStore: new Memory(User)
    });

    var user = new User();

    user.save(function(e, saveResult) {
      assert.ok(saveResult instanceof User);
      assert.equal(user, saveResult);

      User.find(user.id, function(e, findResult) {
        assert.ok(findResult instanceof User);
        assert.equal(user, findResult);
        done();
      });
    });
  });
});












