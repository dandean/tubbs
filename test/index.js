// This file will get compiled by Modulr and served as /tubbs.js
var assert = require('assert');
var Memory = require('../lib/memory');
var Tubbs = require('../index');

// Export the require function for easy console debugger.
if (typeof window != 'undefined') window.__require = require;

describe('Tubbs', function() {

  it('should decorate a Function', function() {
    function User(data) {
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
    function User(data) {
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
  });

  it('decorations should not clobber each other', function() {
    function Type1(data) {
      this.setData(data);
    }

    Tubbs(Type1, {
      primaryKey: 'id',
      dataStore: new Memory(Type1)
    });

    function Type2(data) {
      this.setData(data);
    }

    Tubbs(Type2, {
      primaryKey: 'uuid',
      dataStore: new Memory(Type2)
    });

    assert.notEqual(Type1.primaryKey, Type2.primaryKey);
    assert.notEqual(Type1.dataStore, Type2.dataStore);
  });

  it('should load data from on object', function(done) {
    var data = {
      "rad": {
        "id": 50,
        "username": 'rad',
        "firstName": 'Rad',
        "lastName": 'Radical',
        "email": 'rad@radical.com'
      }
    };

    function User(data) {
      this.setData(data);
    }

    Tubbs(User, {
      primaryKey: 'id',
      dataStore: new Memory(User)
    });

    User.use(data, function() {
      done();
    });
  });

  it('should save and find data', function(done) {
    function User(data) {
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

  it('should create instances with unique client id\'s', function() {
    function User(data) {
      this.setData(data);
    }

    Tubbs(User, {
      primaryKey: 'id',
      dataStore: new Memory(User)
    });

    var user1 = new User();
    var user2 = new User();
    assert.notEqual(user1.id, user2.id);
  });

  it('should have a client id until saved', function(done) {
    function User(data) {
      this.setData(data);
    }

    Tubbs(User, {
      primaryKey: 'id',
      dataStore: new Memory(User)
    });

    var user = new User();
    assert.strictEqual(true, user.isNew);

    var clientId = user.id;
    user.save(function(e, saveResult) {
      assert.strictEqual(false, user.isNew);
      assert.notEqual(clientId, user.id);
      done();
    });
  });

  it('should set and get data via #set and #get', function() {
    function User(data) {
      this.setData(data);
    }

    Tubbs(User, {
      primaryKey: 'id',
      dataStore: new Memory(User)
    });

    var user = new User();
    user.set('rad', 'cool');
    assert.equal('cool', user.get('rad'));
  });

  it('should set and get data via setters and getters', function() {
    function User(data) {
      this.setData(data);
    }

    Tubbs(User, {
      primaryKey: 'id',
      basicProperties: ['rad'],
      dataStore: new Memory(User)
    });

    var user = new User();
    user.rad = 'cool';
    assert.equal('cool', user.get('rad'));
    assert.equal('cool', user.rad);
  });

  describe('#isDirty', function() {
    it('should be marked when a property changes', function(done) {
      function User(data) {
        this.setData(data);
      }

      Tubbs(User, {
        primaryKey: 'id',
        basicProperties: ['rad'],
        dataStore: new Memory(User)
      });

      var user = new User();
      var other = new User();
      assert.strictEqual(false, user.isDirty);

      user.rad = 'cool';
      assert.strictEqual(true, user.isDirty);
      assert.strictEqual(false, other.isDirty); // Make sure instances are atomic.

      user.save(function(e) {
        assert.strictEqual(false, user.isDirty);
        done();
      });
    });
  })


  describe('instance "change" events', function() {
    it('should emit for specific property via `#set`', function(done) {
      function User(data) {
        this.setData(data);
      }

      Tubbs(User, {
        primaryKey: 'id',
        dataStore: new Memory(User)
      });

      var user = new User();
      user.on('change:username', function(newValue, oldValue) {
        assert.strictEqual('rad', newValue);
        assert.strictEqual(undefined, oldValue);
        done();
      });

      user.set('username', 'rad');
    });

    it('should emit for any property via `#set`', function(done) {
      function User(data) {
        this.setData(data);
      }

      Tubbs(User, {
        primaryKey: 'id',
        dataStore: new Memory(User)
      });

      var user = new User();
      user.on('change', function(property, newValue, oldValue) {
        assert.strictEqual('username', property);
        assert.strictEqual('rad', newValue);
        assert.strictEqual(undefined, oldValue);
        done();
      });

      user.set('username', 'rad');
    });

    it('should emit for specific property via setter', function(done) {
      function User(data) {
        this.setData(data);
      }

      Tubbs(User, {
        primaryKey: 'id',
        dataStore: new Memory(User),
        basicProperties: ['username']
      });

      var user = new User();
      user.on('change:username', function(newValue, oldValue) {
        assert.strictEqual('rad', newValue);
        assert.strictEqual(undefined, oldValue);
        done();
      });

      user.username = 'rad';
    });

    it('should emit for any property via setter', function(done) {
      function User(data) {
        this.setData(data);
      }

      Tubbs(User, {
        primaryKey: 'id',
        dataStore: new Memory(User),
        basicProperties: ['username']
      });

      var user = new User();
      user.on('change', function(property, newValue, oldValue) {
        assert.strictEqual('username', property);
        assert.strictEqual('rad', newValue);
        assert.strictEqual(undefined, oldValue);
        done();
      });

      user.username = 'rad';
    });
  });

  describe('class "change" events', function() {
    it('should emit for specific property via `#set`', function(done) {
      function User(data) {
        this.setData(data);
      }

      Tubbs(User, {
        primaryKey: 'id',
        dataStore: new Memory(User)
      });

      User.on('change:username', function(instance, newValue, oldValue) {
        assert.strictEqual('rad', newValue);
        assert.strictEqual(undefined, oldValue);
        done();
      });

      var user = new User();
      user.set('username', 'rad');
    });

    it('should emit for any property via `#set`', function(done) {
      function User(data) {
        this.setData(data);
      }

      Tubbs(User, {
        primaryKey: 'id',
        dataStore: new Memory(User)
      });

      User.on('change', function(instance, property, newValue, oldValue) {
        assert.strictEqual('username', property);
        assert.strictEqual('rad', newValue);
        assert.strictEqual(undefined, oldValue);
        done();
      });

      var user = new User();
      user.set('username', 'rad');
    });

    it('should emit for specific property via setter', function(done) {
      function User(data) {
        this.setData(data);
      }

      Tubbs(User, {
        primaryKey: 'id',
        dataStore: new Memory(User),
        basicProperties: ['username']
      });

      User.on('change:username', function(instance, newValue, oldValue) {
        assert.strictEqual('rad', newValue);
        assert.strictEqual(undefined, oldValue);
        done();
      });

      var user = new User();
      user.username = 'rad';
    });

    it('should emit for any property via setter', function(done) {
      function User(data) {
        this.setData(data);
      }

      Tubbs(User, {
        primaryKey: 'id',
        dataStore: new Memory(User),
        basicProperties: ['username']
      });

      User.on('change', function(instance, property, newValue, oldValue) {
        assert.strictEqual('username', property);
        assert.strictEqual('rad', newValue);
        assert.strictEqual(undefined, oldValue);
        done();
      });

      var user = new User();
      user.username = 'rad';
    });
  });

  it('should emit instance "save" events', function(done) {
    function User(data) {
      this.setData(data);
    }

    Tubbs(User, {
      primaryKey: 'id',
      dataStore: new Memory(User)
    });

    var user = new User();
    user.on('save', function() {
      done();
    });

    user.save();
  });

  it('should emit class "save" events', function(done) {
    function User(data) {
      this.setData(data);
    }

    Tubbs(User, {
      primaryKey: 'id',
      dataStore: new Memory(User)
    });

    var user = new User();

    User.on('save', function(result) {
      assert.equal(user, result);
      done();
    });

    user.save();
  });

  it('should emit instance "delete" events', function(done) {
    function User(data) {
      this.setData(data);
    }

    Tubbs(User, {
      primaryKey: 'id',
      dataStore: new Memory(User)
    });

    var user = new User();
    user.on('delete', function() {
      done();
    });

    user.save(function() {
      user.delete();
    });
  });

  it('should emit class "delete" events', function(done) {
    function User(data) {
      this.setData(data);
    }

    Tubbs(User, {
      primaryKey: 'id',
      dataStore: new Memory(User)
    });

    var user = new User();

    User.on('delete', function(result) {
      assert.equal(user, result);
      done();
    });

    user.save(function() {
      user.delete();
    });
  });

  it('should delete by id from class `delete()` method', function(done) {
    function User(data) {
      this.setData(data);
    }

    Tubbs(User, {
      primaryKey: 'id',
      dataStore: new Memory(User)
    });

    var user = new User();

    User.on('delete', function(result) {
      assert.equal(user, result);
      done();
    });

    user.save(function() {
      User.delete(user.id);
    });
  });

  describe('with custom primary key', function() {
    it('should get/set it correctly', function(done) {
      function User(data) {
        this.setData(data);
      }

      Tubbs(User, {
        primaryKey: 'uuid',
        dataStore: new Memory(User)
      });

      var user = new User();
      assert.notEqual(user.id, user.get('uuid'));

      user.save(function() {
        assert.equal(user.id, user.get('uuid'));

        user.id = 'radical';
        assert.equal(user.id, user.get('uuid'));

        user.set('uuid', 'super radical');
        assert.equal(user.id, user.get('uuid'));

        done();
      });
    });
  });

  it('should allow type methods to be overwritten', function(done) {
    function User(data) {
      this.setData(data);
    }

    Tubbs(User, {
      primaryKey: 'id',
      dataStore: new Memory(User)
    });

    User.fetch = function(cb) {
      done();
    };

    User.fetch();
  });
});
