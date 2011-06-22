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
    
    assert.ok("id" in TestModel.prototype);
    assert.ok("username" in TestModel.prototype);
    assert.ok("first" in TestModel.prototype);
    assert.ok("last" in TestModel.prototype);
    assert.ok("name" in TestModel.prototype);
    assert.ok("toJSON" in TestModel.prototype);
    console.log(Object.keys(TestModel.prototype));
    assert.equal(5, Object.keys(TestModel.prototype).length);

    var instance = new TestModel({
      first: "Rad"
    });
    
    assert.equal("Rad", instance.first);
    assert.equal("Doe", instance.last);
    assert.equal(undefined, instance.username);
    assert.equal(1, instance.id);
    assert.equal("Rad Doe", instance.name);
    
    // Unset instance values so that their defaults come back.
    instance.first = undefined;
    instance.id = undefined;

    assert.equal("John", instance.first, "`first` should be 'John' but is " + instance.first);
    assert.equal(2, instance.id, 'default `id` should have been generated but was not, and is ' + instance.id);
    
    TestModel.all(function(e, result) {
      console.log(e, result);
    });
    
    instance.save();
    instance.delete();
  }
};
