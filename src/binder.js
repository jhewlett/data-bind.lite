var DataBind = DataBind || {};

DataBind.Binder = function(model, document) {
    var doc = document || window.document;
    var scopeElement = doc.querySelector('[data-scope=' + model.scope + ']');
    var currentValue = {};

    model.setValueChanged(function(name) {
        var valueElements = scopeElement.querySelectorAll('[data-bind=' + name + ']');
        bindValues(valueElements);

        var classElements = scopeElement.querySelectorAll('[data-class=' + name + ']');
        bindClasses(classElements);
    });

    var bindClasses = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            var attrValue = elements[i].getAttribute('data-class');

            var oldValue = currentValue[attrValue];
            if (oldValue) {
                elements[i].classList.remove(oldValue);
            }

            var newClass = model.get(attrValue);
            currentValue[attrValue] = newClass;

            if (newClass) {
                elements[i].classList.add(newClass);
            }
        }
    };

    var bind = function() {
        var valueElements = scopeElement.querySelectorAll('[data-bind]');
        bindValues(valueElements);

        var classElements = scopeElement.querySelectorAll('[data-class]');
        bindClasses(classElements);

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

    var bindValues = function(elements) {
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
                if (element.value !== model.get(name)) {
                    element.value = model.get(name);
                }
                element.oninput = function() {
                    model.attr(name, element.value);
                };
            } else {
                element.innerHTML = getValue(name);
            }
        }
    };

    var getValue = function(name) {
        var attr = model.get(name);
        if (attr.value) {
            return attr.value;
        }

        return attr;
    };

    return {
        bind: bind
    };
};
