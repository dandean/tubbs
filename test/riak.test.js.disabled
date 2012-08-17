var assert = require('assert');
var Guid = require('guid');
var Model = require('../index');

// TODO: complete these unit tests

module.exports = {
  'riak': function() {
    var User = Model.create({
    
      // Persist our data with Riak
      dataStore: new Model.RiakStore({ bucket: 'users' }),
      
      primaryKey: 'username',
    
      fields: {
        username: undefined,
        password: undefined,
        first: "Rad",
        last: undefined,
        email: undefined
      },
    
      virtual: {
        name: function() {
          return ((this.first || '') + ' ' + (this.last || '')).trim();
        }
      }
    });
    
    User.where(
      {
        username: "dandean3",
        email: "me@dandean.com"
      },
      function(doc, args) {
        return doc.username == args.username && doc.email == args.email;
      },
      function(e, result) {
        console.log(e, result);
      }
    );

      
      
      
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
