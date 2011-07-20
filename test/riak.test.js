var assert = require('assert');
var Guid = require('guid');
var Model = require('../index');

var m;

// TODO: complete these unit tests

module.exports = {
  'riak': function() {
    var TestModel, m, id;
    
    createModelScaffold();

    function createModelScaffold() {
      TestModel = Model.create({
        dataStore: new Model.RiakStore({ bucket: 'unit-tests' }),
        fields: {
          id: Guid.raw,
          username: undefined
        }
      });
      
      createAndSaveNewDocument();
    }

    function createAndSaveNewDocument() {
      m = new TestModel({
        username: "test 1"
      });
      
      m.save(function(e, result) {
        id = result.id;
        assert.ok(Guid.isGuid(id));
        getAllDocuments();
      });
    }
    
    function getAllDocuments() {
      TestModel.all(function(e, documents) {
        // documents.forEach(function(d) {
        //   d.delete(function() {});
        // });
        assert.equal(1, documents.length);
        assert.ok(documents[0] instanceof TestModel);
        assert.equal(documents[0].username, 'test 1');
        
        m.delete(function(e, result) {
          console.log(e, result);
        });
        
      });
    }

      
      
      
      // TestModel.all(function(e, results) {
      //   console.log(e, results);
      //   
      //   TestModel.find('60164656-6f7a-80b7-f9f1-5c74b8920809', function(e, results) {
      //     console.log(e, results);
      //     
      //     TestModel.where(
      //       function(doc) {
      //         return doc.id == '60164656-6f7a-80b7-f9f1-5c74b8920809';
      //       },
      //       function(e, results) {
      //         console.log(e, results);
      //         
      //         var record = results[0];
      //         record.id = Guid.raw();
      //         
      //         record.save(function(e, result) {
      //           console.log(e, result);
      //           
      //           record.delete(function(e, result) {
      //             console.log(e, result);
      //             
      //             TestModel.find(record.id, function(e, result) {
      //               console.log(e, result);
      //             });
      //           });
      //         });
      //       }
      //     );
      //   });
      // });
    

  },
};
