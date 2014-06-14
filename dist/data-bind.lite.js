var DataBind = (function (dataBind) {
    "use strict";

    dataBind.Binder = function (model, document) {
        var doc = document || window.document;  //inject mock for testing
        var scopeElement = doc.querySelector('[data-scope=' + model.scope + ']');
        var currentValue = {};
        var foreach = {};

        model.addValueChangedListener(valueChangedHandler);

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

        function excludeNested(all, nested) {
            var arr = [].slice.call(all);
            for(var i = 0; i < arr.length; i++) {
                for (var j = 0; j < nested.length; j++) {
                    if (arr[i] === nested[j]) {
                        arr.splice(i, 1);
                    }
                }
            }

            return arr;
        }

        var bind = function () {
            var foreachElements = scopeElement.querySelectorAll('[data-foreach]');
            var nestedForeachElements = scopeElement.querySelectorAll('[data-foreach] [data-foreach]');

            var outerForeachElements = excludeNested(foreachElements, nestedForeachElements);

            captureForeach(outerForeachElements);
            bindForeach(outerForeachElements);

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
                var pieces = forIn.split(' in ');

                foreach[forIn] = { template: templateChildren, items: pieces[1].trim(), item: pieces[0].trim() };
            }
        };

        var bindForeach = function (elements) {
            for (var i = 0; i < elements.length; i++) {
                clearChildren(elements[i]);

                var forIn = elements[i].getAttribute('data-foreach');
                var foreachTemplate = foreach[forIn];

                var value = model.get(foreachTemplate.items);

                for (var j = 0; j < value.length(); j++) {
                    for (var k = 0; k < foreachTemplate.template.length; k++) {
                        var clone = foreachTemplate.template[k].cloneNode(true);
                        elements[i].appendChild(clone);

                        convertBinding(clone, 'data-bind', foreachTemplate, j);
                        convertBinding(clone, 'data-class', foreachTemplate, j);
                        convertBinding(clone, 'data-click', foreachTemplate, j);
                        convertBinding(clone, 'data-foreach', foreachTemplate, j);
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
                var oldAttribute = element.getAttribute(attribute);
                var newAttribute = oldAttribute
                    .replace(new RegExp('^' + template.item + '(?=[.]|$)'), template.items + '[' + index + ']')     //lone identifiers
                    .replace(new RegExp('[(,] *' + template.item + ' *(?=[,)])', 'g'), replace)    //method parameters
                    .replace(new RegExp(' in ' + template.item + '$'), ' in ' + template.items + '[' + index + ']');

                element.setAttribute(attribute, newAttribute);

                if (attribute === 'data-foreach') {
                    captureForeach([element]);
                    bindForeach([element]);
                }
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

var DataBind = (function (dataBind) {
    "use strict";

    dataBind.Model = function (scope) {
        var attrs = {};
        var dependsOn = {};
        var valueChangedListeners = [];
        var parser = new DataBind.Parser(fireValueChangedForAllDependencies, doLookup, updateValue);

        function doLookup(name) {
            return attrs[name];
        }

        function updateValue(name, value) {
            attrs[name] = value;
        }

        var attr = function (name, value) {
            parser.attr(name, value);
        };

        var get = function (expr) {
            return parser.get(expr);
        };

        function fireValueChangedForAllDependencies(name) {
            valueChangedListeners.forEach(function(listener) {
                listener(name);
            });

            if (dependsOn.hasOwnProperty(name)) {
                dependsOn[name].forEach(function (dependency) {
                    fireValueChangedForAllDependencies(dependency);
                });
            }
        }

        var computed = function (name, func, explicitDependencies) {
            if (explicitDependencies) {
                explicitDependencies.forEach(function (dependency) {
                    addDependency(name, dependency);
                });
            }

            var regEx = /this\.get\(['"]([^'"]+)['"]\)/g;

            var match = regEx.exec(func.toString());
            while (match != null) {
                addDependency(name, match[1]);
                match = regEx.exec(func.toString());
            }

            attrs[name] = func;
        };

        var action = function (name, func) {
            attrs[name] = func;
        };

        var addDependency = function (name, dependency) {
            dependsOn[dependency] = dependsOn[dependency] || [];
            dependsOn[dependency].push(name);
        };

        var addValueChangedListener = function(callback) {
            valueChangedListeners.push(callback);
        };

        return {
            attr: attr,
            get: get,
            computed: computed,
            action: action,
            scope: scope,
            addValueChangedListener: addValueChangedListener,
            invoke: function(actionExpr) { get(actionExpr); }
        };
    };

    return dataBind;
}(DataBind || {}));
var DataBind = (function (dataBind) {
    "use strict";

    dataBind.Collection = function(name, arr, valueChangedCallback) {
        var push = function(value) {
            arr.push(value);
            valueChangedCallback(name);
        };

        var pop = function() {
            arr.pop();
            valueChangedCallback(name);
        };

        var forEach = function(callback) {
            arr.forEach(function(item) {
                callback(item);
            });
            valueChangedCallback(name);
        };

        var clear = function() {
            arr.length = 0;
            valueChangedCallback(name);
        };

        return {
            push: push,
            pop: pop,
            value: arr,
            length: function() { return arr.length; },
            forEach: forEach,
            clear: clear
        };
    };

    return dataBind;
}(DataBind || {}));

