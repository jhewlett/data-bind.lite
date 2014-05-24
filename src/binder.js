var DataBind = (function (dataBind) {
    "use strict";

    dataBind.Binder = function (model, document) {
        var doc = document || window.document;  //inject mock for testing
        var scopeElement = doc.querySelector('[data-scope=' + model.scope + ']');
        var currentValue = {};
        var foreach = {};

        model.setValueChanged(valueChangedHandler);

        function valueChangedHandler(name) {
            var foreachElements = scopeElement.querySelectorAll('[data-foreach$="in ' + name + '"]');
            bindForeach(foreachElements, name);

            bindElementsInForeach(foreachElements);

            var valueElements = scopeElement.querySelectorAll('[data-bind="' + name + '"]');
            bindValues(valueElements);

            var classElements = scopeElement.querySelectorAll('[data-class="' + name + '"]');
            bindClasses(classElements);

            var computedClassElements = scopeElement.querySelectorAll('[data-class^="' + name + '("]');
            bindClasses(computedClassElements);
        }

        var bindElementsInForeach = function (elements) {
            for (var i = 0; i < elements.length; i++) {

                var valueElements = elements[i].querySelectorAll('[data-bind]');
                bindValues(valueElements);

                var classElements = elements[i].querySelectorAll('[data-class]');
                bindClasses(classElements);

                var clickElements = elements[i].querySelectorAll('[data-click]');
                bindClicks(clickElements);

                var enterElements = scopeElement.querySelectorAll('[data-enter]');
                bindEnters(enterElements);
            }
        };

        var bindClasses = function (elements) {
            for (var i = 0; i < elements.length; i++) {
                bindClass(elements[i]);
            }
        };

        var bindClass = function (element) {
            var attrValue = element.getAttribute('data-class');

            var oldValue = currentValue[attrValue];
            if (oldValue) {
                element.classList.remove(oldValue);
            }

            var newClass = model.get(attrValue);
            currentValue[attrValue] = newClass;

            if (newClass) {
                element.classList.add(newClass);
            }
        };

        var bind = function () {
            var foreachElements = scopeElement.querySelectorAll('[data-foreach]');
            captureForeach(foreachElements);
            bindForeach(foreachElements);

            var valueElements = scopeElement.querySelectorAll('[data-bind]');
            bindValues(valueElements);

            var classElements = scopeElement.querySelectorAll('[data-class]');
            bindClasses(classElements);

            var clickElements = scopeElement.querySelectorAll('[data-click]');
            bindClicks(clickElements);

            var enterElements = scopeElement.querySelectorAll('[data-enter]');
            bindEnters(enterElements);
        };

        var bindEnters = function (elements) {
            for (var i = 0; i < elements.length; i++) {
                bindEnter(elements[i]);
            }
        };

        var bindEnter = function (element) {
            var expression = element.getAttribute('data-enter');

            element.onkeydown = function (event) {
                if (event.which === 13) {
                    model.get(expression);
                }
            };
        };

        var bindClicks = function (elements) {
            for (var i = 0; i < elements.length; i++) {
                bindClick(elements[i]);
            }
        };

        var captureForeach = function (elements) {
            for (var i = 0; i < elements.length; i++) {
                var templateChildren = [];
                for (var j = 0; j < elements[i].children.length; j++) {
                    templateChildren.push(elements[i].children[j].cloneNode(true));
                }

                var forIn = elements[i].getAttribute('data-foreach');
                var pieces = forIn.split('in');

                foreach[elements[i].id] = { template: templateChildren, items: pieces[1].trim(), item: pieces[0].trim() };
            }
        };

        var bindForeach = function (elements) {
            for (var i = 0; i < elements.length; i++) {

                clearChildren(elements[i]);

                var foreachTemplate = foreach[elements[i].id];

                var value = model.get(foreachTemplate.items);
                for (var j = 0; j < value.length(); j++) {
                    for (var k = 0; k < foreachTemplate.template.length; k++) {
                        var clone = foreachTemplate.template[k].cloneNode(true);
                        elements[i].appendChild(clone);

                        convertBinding(clone, 'data-bind', foreachTemplate, j);
                        convertBinding(clone, 'data-class', foreachTemplate, j);
                    }
                }
            }
        };

        var clearChildren = function (element) {
            while (element.lastChild) {
                element.removeChild(element.lastChild);
            }
        };

        var convertBinding = function (element, attribute, template, index) {
            var replace = function (match) {
                return match.replace(template.item, template.items + '[' + index + ']')
            };

            if (element.hasAttribute(attribute)) {
                var newAttribute = element.getAttribute(attribute)
                    .replace(new RegExp('^' + template.item + '(?=[.]|$)'), template.items + '[' + index + ']')
                    .replace(new RegExp('[(,] *' + template.item + ' *(?=[,)])', 'g'), replace);

                element.setAttribute(attribute, newAttribute);
            }

            for (var i = 0; i < element.children.length; i++) {
                convertBinding(element.children[i], attribute, template, index);
            }
        };

        var bindClick = function (element) {
            var expression = element.getAttribute('data-click');

            element.onclick = function () {
                model.get(expression);
            };
        };

        var bindValues = function (elements) {
            for (var i = 0; i < elements.length; i++) {
                bindValue(elements[i]);
            }
        };

        var bindValue = function (element) {
            var name = element.getAttribute('data-bind');

            var modelValue = model.get(name);

            if (modelValue === undefined) {
                model.attr(name, "");
            } else if (element.type === 'checkbox') {
                element.checked = modelValue;
                element.onclick = function () {
                    model.attr(name, element.checked);
                };
            }
            else if (element.type === 'radio') {
                element.checked = modelValue === element.value;
                element.onclick = function () {
                    model.attr(name, element.value);
                };
            }
            else if (element.tagName.toLowerCase() === 'select') {
                element.value = modelValue;
                element.onchange = function () {
                    model.attr(name, element.value);
                };
            }
            else if (element.type === 'text' || element.type === 'textarea') {
                if (element.value !== modelValue) {
                    element.value = modelValue;
                }
                element.oninput = function () {
                    model.attr(name, element.value);
                };
            } else {
                element.innerHTML = modelValue;
            }
        };

        return {
            bind: bind
        };
    };

    return dataBind;
}(DataBind || {}));
