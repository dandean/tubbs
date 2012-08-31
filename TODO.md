TODO
====

* Data store's should be able to extend their Model API when necessary.
* Fire data-driven events (EventEmitter2)

  √ model.on('change', function(name, value, old) {});
  √ model.on('change:name', function(value, old) {});
  model.on('delete', function(model) {});

* Fire Model-type level data-driven events:

  Model.on('create', function(model) {});
  Model.on('delete', function(model) {});
  Model.on('change', function(model, property, value, old) {});
  Model.on('change:name', function(model, value, old) {});

* Figure out methodology for setting data w/o firing events.

  model.shhh('name', 'Dan');
  model.quiet('name', 'Dan');
  model._name = 'Dan';


