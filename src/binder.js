var DataBind = DataBind || {};

DataBind.Binder = function(model) {
    model.onValueChange(function(name) {
        var bindings = document.querySelectorAll('[data-bind=' + name + ']');
        for (var i = 0; i < bindings.length; i++) {
            var name = bindings[i].getAttribute('data-bind');
            bindings[i].innerHTML = model.attr(name);
        }
    });

    var bind = function() {
        var bindings = document.querySelectorAll('[data-bind]');

        for (var i = 0; i < bindings.length; i++) {
            var name = bindings[i].getAttribute('data-bind');
            if (model.attr(name)) {
                bindings[i].innerHTML = model.attr(name);
            }
        }
    };

    return {
        bind: bind
    };
};
