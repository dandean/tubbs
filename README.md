Tubbs
=====


**Tubbs** is Data Model Layer which makes working with your data much easier.


Features
--------

* Configurable default property values
* Virtual (non-serialized) properties
* ActiveModel-style validation
* Abstract data store interface. So far:
  * In-memory (built-in: `Tubbs.MemoryStore`)
  * Riak (via tubbs-riakstorage - server-side only at the moment)
  * REST (via rubbs-reststorage - browser-only, at the moment)


Examples
--------

```js
var User = Tubbs.define({

  // Persist our data with an in-memory store:
  dataStore: { type: Tubbs.MemoryStore },

  fields: {
    username: undefined,
    first: '',
    last: '',
  },

  virtual: {
    name: function() {
      return ((this.first || '') + ' ' + (this.last || '')).trim();
    }
  },

  validation: [
    Tubbs.Validate.required("username"),
    Tubbs.Validate.lengthOf("username", { min: 5 })
  ]
});
```


**Create a new user**

```js
var user = new User({
  username: "kbacon",
  first: "Kevin",
  last: "Bacon"
});
```


**Get one of its virtual properties**

```js
console.log(user.name);
// -> 'Kevin Bacon'
```


**Serialize the instance to pure JSON**

```js
console.log(JSON.stringify(user));
// ->
// {
//   "username": "kbacon",
//   "first": "Kevin",
//   "last": "Bacon"
// }
```


Roadmap (Also, see TODO.md)
---------------------------

* Validation
  * `allowBlank` option?
  * shortcut format validator strings, such as "email" and "phone"
* Add a `beforeSave` option: beforeSave: function() { this.dateModified = new Date(); }
* Figure out how to notify others when an error is thrown.
* More unit test coverage
* Schema-based generated class methods: Person.findAllByAge(50, cb)
* Documentation Pages
  * Model instance API
  * Model class API
  * Validators
* CouchStore
* MongoStore
* RedisStore
* LocalStorageStore
