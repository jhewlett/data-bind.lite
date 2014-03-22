var DataBind = DataBind || {};

DataBind.Binder = function(model) {
    var scopeElement = document.querySelector('[data-scope=' + model.scope + ']');

    model.setValueChanged(function(name) {
        var elements = scopeElement.querySelectorAll('[data-bind=' + name + ']');

        updateDom(elements);
    });

    var bind = function() {
        var elements = scopeElement.querySelectorAll('[data-bind]');
        updateDom(elements);

        var clickElements = scopeElement.querySelectorAll('[data-click]');
        for (var i = 0; i < clickElements.length; i++) {
            handleClick(clickElements[i]);
        }
    };

    var handleClick = function(element) {
        var expression = element.getAttribute('data-click');

        element.onclick = function() {
            eval('model.' + expression);
        }
    };

    var updateDom = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            bindValue(elements[i]);
        }
    };

    var bindValue = function(element) {
        var name = element.getAttribute('data-bind');
        if (model.hasAttr(name)) {
            if (element.type === 'checkbox') {
                element.checked = model.get(name);
                element.onclick = function() {
                    model.attr(name, element.checked);
                };
            }
            else if (element.type === 'radio') {
                element.checked = model.get(name) === element.value;
                element.onclick = function() {
                    model.attr(name, element.value);
                };
            }
            else if (element.tagName.toLowerCase() === 'select') {
                element.value = model.get(name);
                element.onchange = function() {
                    model.attr(name, element.value);
                };
            }
            else if (element.value !== undefined) {
                element.value = model.get(name);
                element.oninput = function() {
                    model.attr(name, element.value);
                };
            } else {
                element.innerHTML = getValue(name);
            }
        }
    };

    var getValue = function(name) {
        if (model.hasAttr(name) && model.get(name).value) {
            return model.get(name).value;
        }

        return model.get(name);
    };

    return {
        bind: bind
    };
};
