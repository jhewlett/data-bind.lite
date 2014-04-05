"use strict";

var DataBind = DataBind || {};

DataBind.Binder = function(model, document) {
    var doc = document || window.document;
    var scopeElement = doc.querySelector('[data-scope=' + model.scope + ']');
    var currentValue = {};
    var templates = [];
    var foreach = [];

    model.setValueChanged(valueChangedHandler);

    function valueChangedHandler(name) {
        var foreachElements = scopeElement.querySelectorAll('[data-foreach]');
        bindForeach(foreachElements);

        bindElementsInForeach(foreachElements);

        var valueElements = scopeElement.querySelectorAll('[data-bind=' + name + ']');
        bindValues(valueElements);

        var classElements = scopeElement.querySelectorAll('[data-class=' + name + ']');
        bindClasses(classElements);

        var templateElements = scopeElement.querySelectorAll('[data-template]');
        captureTemplates(templateElements);
        bindTemplates(templateElements);
    }

    var bindElementsInForeach = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            var templateElements = elements[i].querySelectorAll('[data-template]');
            captureTemplates(templateElements);

            var valueElements = elements[i].querySelectorAll('[data-bind]');
            bindValues(valueElements);

            var classElements = elements[i].querySelectorAll('[data-class]');
            bindClasses(classElements);

            bindTemplates(templateElements);

            var clickElements = elements[i].querySelectorAll('[data-click]');
            bindClicks(clickElements);
        }
    };

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
            bindClass(elements[i]);
        }
    };

    var bindClass = function(element) {
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

    var bind = function() {
        var foreachElements = scopeElement.querySelectorAll('[data-foreach]');
        captureForeach(foreachElements);
        bindForeach(foreachElements);

        var templateElements = scopeElement.querySelectorAll('[data-template]');
        captureTemplates(templateElements);

        var valueElements = scopeElement.querySelectorAll('[data-bind]');
        bindValues(valueElements);

        var classElements = scopeElement.querySelectorAll('[data-class]');
        bindClasses(classElements);

        bindTemplates(templateElements);

        var clickElements = scopeElement.querySelectorAll('[data-click]');
        bindClicks(clickElements);
    };

    var bindClicks = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            bindClick(elements[i]);
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

            foreach[i] = { template: templateChildren, items: pieces[1].trim(), item: pieces[0].trim() };
        }
    };

    var bindForeach = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            elements[i].innerHTML = '';     //todo: make faster

            var value = model.get(foreach[i].items);
            for (var j = 0; j < value.length(); j++) {
                for (var k = 0; k < foreach[i].template.length; k++) {
                    var clone = foreach[i].template[k].cloneNode(true);
                    elements[i].appendChild(clone);

                    convertBinding(clone, 'data-bind', foreach[i], j);
                    convertBinding(clone, 'data-class', foreach[i], j);
                    convertBinding(clone, 'data-click', foreach[i], j);
                    convertTemplateBinding(clone, foreach[i], j);
                }
            }
        }
    };

    var convertTemplateBinding = function (element, template, index) {
        if (element.hasAttribute('data-template')) {
            var regEx = /{{[^}]+}}/g;

            var foreachReplace = function (match) {
                return match.replace(template.item, template.items + '[' + index + ']')
            };

            element.innerHTML = element.innerHTML.replace(regEx, foreachReplace);
        }

        for(var i = 0; i < element.children.length; i++) {
            convertTemplateBinding(element.children[i], template, index);
        }
    };

    var convertBinding = function(element, attribute, template, index) {
        if (element.hasAttribute(attribute)) {
            element.setAttribute(attribute, element.getAttribute(attribute).replace(template.item, template.items + '[' + index + ']'))
        }

        for (var i = 0; i < element.children.length; i++) {
            convertBinding(element.children[i], attribute, template, index);
        }
    };

    var captureTemplates = function(elements) {
        for(var i = 0; i < elements.length; i++) {
            templates[i] = elements[i].innerHTML;
        }
    };

    var bindClick = function(element) {
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

        var modelValue = model.get(name);

        if (modelValue !== undefined) {
            if (element.type === 'checkbox') {
                element.checked = modelValue;
                element.onclick = function() {
                    model.attr(name, element.checked);
                };
            }
            else if (element.type === 'radio') {
                element.checked = modelValue === element.value;
                element.onclick = function() {
                    model.attr(name, element.value);
                };
            }
            else if (element.tagName.toLowerCase() === 'select') {
                element.value = modelValue;
                element.onchange = function() {
                    model.attr(name, element.value);
                };
            }
            else if (element.value !== undefined) {
                if (element.value !== modelValue) {
                    element.value = modelValue;
                }
                element.oninput = function() {
                    model.attr(name, element.value);
                };
            } else {
                element.innerHTML = modelValue;
            }
        }
    };

    return {
        bind: bind
    };
};
