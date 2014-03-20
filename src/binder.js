var DataBind = DataBind || {};

DataBind.Binder = function(model) {
    var scopeElement = document.querySelector('[data-scope=' + model.scope + ']');

    model.setOnValueChanged(function(name) {
        var bindings = scopeElement.querySelectorAll('[data-bind=' + name + ']');
        updateDom(bindings);
    });

    var bind = function() {
        var bindings = scopeElement.querySelectorAll('[data-bind]');
        updateDom(bindings);
    };

    var updateDom = function(bindings) {
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
