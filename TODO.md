TODO
====

* Data store's should be able to extend their Model API when necessary.
* Fire data-driven events (EventEmitter2)

	model.on('change', function(name, value, old) {});
	model.on('change:name', function(value, old) {});

* Figure out methodology for setting data w/o firing events.

	model.quiet('name', 'Dan');
	model._name = 'Dan';
