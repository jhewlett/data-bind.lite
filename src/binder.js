var DataBind = DataBind || {};

DataBind.Binder = function(model, document) {
    var doc = document || window.document;
    var scopeElement = doc.querySelector('[data-scope=' + model.scope + ']');
    var currentValue = {};
    var templates = [];
    var foreach = [];

    model.setValueChanged(function(name) {
        var valueElements = scopeElement.querySelectorAll('[data-bind=' + name + ']');
        bindValues(valueElements);

        var classElements = scopeElement.querySelectorAll('[data-class=' + name + ']');
        bindClasses(classElements);

        var templateElements = scopeElement.querySelectorAll('[data-template]');
        bindTemplates(templateElements);
    });

    var bindTemplates = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            var regEx = /{{([^}]+)}}/g;

            elements[i].innerHTML = templates[i].replace(regEx, fillValue);
        }
    };

    var fillValue = function(match, group1) {
        var value = model.get(group1);

        return value !== undefined
            ? value
            : '';
    };

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

        var templateElements = scopeElement.querySelectorAll('[data-template]');
        captureTemplates(templateElements);
        bindTemplates(templateElements);

//        var foreachElements = scopeElement.querySelectorAll('[data-foreach]');
//        captureForeach(foreachElements);
//        bindForeach(foreachElements);

        var clickElements = scopeElement.querySelectorAll('[data-click]');
        for (var i = 0; i < clickElements.length; i++) {
            handleClick(clickElements[i]);
        }
    };

    var captureForeach = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            var templateChildren = [];
            for (var j = 0; j < elements[i].children.length; j++) {
                templateChildren.push(elements[i].children[j].cloneNode(true));
            }

            var forIn = elements[i].getAttribute('data-foreach');
            var pieces = forIn.split('in');

            console.log(pieces);

            foreach[i] = {template: templateChildren, items: pieces[1].trim(), item: pieces[0].trim() };
        }
    };

    var bindForeach = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            elements[i].innerHTML = '';     //todo: make faster

            var value = model.get(foreach[i].items);
            for (var j = 0; j < value.length; j++) {
                var clone = foreach[i].template[0].cloneNode(true);
                elements[i].appendChild(clone);    //todo: handle multiple children

                bindForeachNode(clone, foreach[i].items, foreach[i].item, j);
                //todo: take care of any bindings
            }
        }
    };

    var bindForeachNode = function(element, items, item, iteration) {
        //todo: what about {{ }} templates?
        //todo: what about data-class?
        //todo: what about data-click?
        //todo: what about input elements, etc?
        //todo: what about descendants (make this recursive?)

        var dataBind = element.getAttribute('data-bind');

        if (dataBind === item) {
            element.innerHTML = model.get(items).value[iteration];
        } else if (dataBind.indexOf(item + '.') === 0) {
            var prop = dataBind.replace(item + '.', '');
            element.innerHTML = model.get(items).value[iteration][prop];
        }
    };

    var captureTemplates = function(elements) {
        for(var i = 0; i < elements.length; i++) {
            templates[i] = elements[i].innerHTML;
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
