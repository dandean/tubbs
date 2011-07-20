Tubbs
=====


**Tubbs** is Data Model Layer which makes working with your data much easier.


Features
--------

* Structural inheritance
* Configurable default property values
* Virtual (non-serialized) properties
* ActiveModel-style validation
* Built-in data store for in-memory and Riak persistence
* Abstract data store interface (implement your own persistence layer!)


Examples
--------

```js
var User = Tubbs.create({

  // Persist our data with Riak
  dataStore: new Tubbs.RiakStore({ bucket: 'users' }),

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


**Get one of its virtual properties**

console.log(user.name);
// -> 'Kevin Bacon'


**Serialize the instance to pure JSON**

console.log(JSON.stringify(user));
// ->
// {
//   "username": "kbacon",
//   "first": "Kevin",
//   "last": "Bacon"
// }
```


**Extend the User model as the Employee model**

```js
var Employee = User.create({
  dataStore: new Tubbs.RiakStore({ bucket: 'employees' }),
  title: "Layabout"
});
```


**Create a new Employee**

```js
var enginner = new Employee({
  username: "dandean",
  first: "Dan",
  last: "Dean",
  title: "Software Engineer"
});
```


Roadmap
-------

* Unit Tests
* Validation
  * `if` and `unless` options
  * `allowBlank` option?
  * shortcut format validator strings, such as "email" and "phone"
* Schema-based generated class methods: Person.findAllByAge(50, cb)
* RiakStore
* Documentation Pages
* CouchStore
* MongoStore
* RedisStore
