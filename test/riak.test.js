var assert = require('assert');
var Guid = require('guid');
var Model = require('../index');

var m;

module.exports = {
  'riak': function() {
    var TestModel, m;
    
    createModelScaffold();

    function createModelScaffold() {
      TestModel = Model.create({
        dataStore: new Model.RiakStore({ bucket: 'sites' }),
        fields: {
          id: Guid.raw,
          name: undefined,
          owner: undefined,
          theme: undefined
        }
      });
      
      TestModel.all(function(e, results) {
        console.log(e, results);
        
        TestModel.find('60164656-6f7a-80b7-f9f1-5c74b8920809', function(e, results) {
          console.log(e, results);
          
          TestModel.where(
            function(doc) {
              return doc.id == '60164656-6f7a-80b7-f9f1-5c74b8920809';
            },
            function(e, results) {
              console.log(e, results);
              
              var record = results[0];
              record.id = Guid.raw();
              
              record.save(function(e, result) {
                console.log(e, result);
                
                record.delete(function(e, result) {
                  console.log(e, result);
                  
                  TestModel.find(record.id, function(e, result) {
                    console.log(e, result);
                  });
                });
              });
            }
          );
        });
      });
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
};
