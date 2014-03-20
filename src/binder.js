var DataBind = DataBind || {};

DataBind.Binder = function(model) {
    model.setOnValueChanged(function(name) {
        var bindings = document.querySelectorAll('[data-bind=' + name + ']');
        updateDom(bindings);
    });

    var bind = function() {
        var bindings = document.querySelectorAll('[data-bind]');
        updateDom(bindings);
    };

    var updateDom = function(bindings) {
        for (var i = 0; i < bindings.length; i++) {
            var name = bindings[i].getAttribute('data-bind');
            if (model.attr(name)) {
                bindings[i].innerHTML = model.attr(name);
            }
        }
    }

    return {
        bind: bind
    };
};
