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
            bindValue(bindings[i]);
        }
    };

    var bindValue = function(binding) {
        var name = binding.getAttribute('data-bind');
        if (model.attr(name)) {
            if (binding.value !== undefined) {
                binding.value = model.attr(name);
                binding.addEventListener('input', function() {
                    model.attr(name, binding.value);
                    console.log(model.attr(name));
                });
            } else {
                binding.innerHTML = model.attr(name);
            }
        }
    };

    return {
        bind: bind
    };
};
