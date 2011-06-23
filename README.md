Model
============

Roadmap
-------

* Unit Tests
* Subclassing
* Validation



Provides a model abstraction around [riak-js](http://riakjs.org/).


Simple Example
--------------

``` javascript
var Model = require('riakjs-model');

// Create a model
var TestModel = Model.create({
  // Define it's properties
  schema: {
    dateCreated: Date,
    dateModified: Date,
    id: String,
    name: String
  },
  // Bucket for this model's data
  bucket: "test"
});


var record = new TestModel({
  name: "test model"
});

record.save(function(e, result) {
  console.log("Saved!", result);
  
  TestModel.find(result.id, function(e, result) {
    console.log("Found!", result);
  });
});
```
