"use strict";

var DataBind = DataBind || {};

DataBind.Binder = function(model, document) {
    var doc = document || window.document;
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

    var bindElementsInForeach = function(elements) {
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

        var valueElements = scopeElement.querySelectorAll('[data-bind]');
        bindValues(valueElements);

        var classElements = scopeElement.querySelectorAll('[data-class]');
        bindClasses(classElements);

        var clickElements = scopeElement.querySelectorAll('[data-click]');
        bindClicks(clickElements);

        var enterElements = scopeElement.querySelectorAll('[data-enter]');
        bindEnters(enterElements);
    };

    var bindEnters = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            bindEnter(elements[i]);
        }
    };

    var bindEnter = function(element) {
        var expression = element.getAttribute('data-enter');

        element.onkeydown = function(event) {
            if (event.which === 13) {
                model.get(expression);
            }
        };
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

            foreach[elements[i].id] = { template: templateChildren, items: pieces[1].trim(), item: pieces[0].trim() };
        }
    };

    var bindForeach = function(elements) {
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

    var clearChildren = function(element) {
        while (element.lastChild) {
            element.removeChild(element.lastChild);
        }
    };

    var convertBinding = function(element, attribute, template, index) {
        var replace = function(match) {
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

    var bindClick = function(element) {
        var expression = element.getAttribute('data-click');

        element.onclick = function() {
            model.get(expression);
        };
    };

    var bindValues = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            bindValue(elements[i]);
        }
    };

    var bindValue = function(element) {
        var name = element.getAttribute('data-bind');

        var modelValue = model.get(name);

        if (modelValue === undefined) {
            model.attr(name, "");
        } else if (element.type === 'checkbox') {
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
        else if (element.type ==='text' || element.type === 'textarea') {
            if (element.value !== modelValue) {
                element.value = modelValue;
            }
            element.oninput = function() {
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

"use strict";

var DataBind = DataBind || {};

DataBind.Model = function(scope) {
    var attrs = {};
    var dependsOn = {};
    var valueChanged = function(name) { };

    var getArrayIndexerMatch = function(name) {
        var arrayAccessRegex = /\[([^\]]+)\]/;

        return arrayAccessRegex.exec(name);
    };

    var fireValueChangedForAll = function (items) {
        items.forEach(function(item) {
            fireValueChangedForAllDependencies(item);
        });
    };

    var attr = function(name, value, object, fullName, changedCollections) {
        fullName = fullName || name;
        changedCollections = changedCollections || [];

        var dotPieces = name.split('.');
        var rest = dotPieces.slice(1, dotPieces.length).join('.');

        var arrayIndexer = getArrayIndexerMatch(dotPieces[0]);

        if (arrayIndexer !== null) {
            var prop = dotPieces[0].substring(0, arrayIndexer.index);
            var index = getIndex(arrayIndexer[1]);

            changedCollections.push(prop);

            if (object !== undefined) {
                attr(rest, value, eval('object.' + prop)[index], fullName, changedCollections);
            } else if (dotPieces.length === 1) {
                attrs[prop][index] = value;
                fireValueChangedForAllDependencies(fullName);
                fireValueChangedForAll(changedCollections);
            } else {
                attr(rest, value, attrs[prop][index], fullName, changedCollections);
            }
        } else if (object !== undefined) {
            if (dotPieces.length === 1) {
                object[dotPieces[0]] = value;
                fireValueChangedForAllDependencies(fullName);
                fireValueChangedForAll(changedCollections);
            } else {
                attr(rest, value, eval('object.' + dotPieces[0]), fullName);
            }
        } else if (dotPieces.length === 1) {
            attrs[name] = value;
            fireValueChangedForAllDependencies(name);
        } else {
            if (attrs[dotPieces[0]] === undefined) {
                attrs[dotPieces[0]] = {};
            }
            attr(rest, value, attrs[dotPieces[0]], fullName);
        }
    };

    var parseFunctionCall = function(expression) {
        var args = [];
        var functionName = expression;

        var argsRegex = /[(][^)]*[)]/;
        var match = argsRegex.exec(expression);
        if (match !== null) {
            functionName = expression.substring(0, match.index);

            var commaSeparatedArgs = match[0].replace('(', '').replace(')', '');

            var argPieces = commaSeparatedArgs.length > 0
                ? commaSeparatedArgs.split(',')
                : [];

            argPieces.forEach(function(piece) {
                args.push(get.call(this, piece.trim()));
            });
        }

        return {name: functionName, args: args, isMatch: match !== null };
    };

    var get = function(name, object, fullName) {
        fullName = fullName || name;

        if (/^\d+$/.test(name)) {
            return parseInt(name);
        }

        var dotPieces = name.split('.');
        var rest = dotPieces.slice(1, dotPieces.length).join('.');

        var parseFuncResult = parseFunctionCall(dotPieces[0]);

        if (!parseFuncResult.isMatch) {
            var arrayIndexer = getArrayIndexerMatch(dotPieces[0]);

            if (arrayIndexer !== null) {
                var prop = dotPieces[0].substring(0, arrayIndexer.index);
                var index = getIndex(arrayIndexer[1]);

                if (object !== undefined) {
                    return get.call(this, rest, eval('object.' + prop)[index], fullName);
                }

                return get.call(this, rest, attrs[prop][index], fullName);
            }
        }

        if (object !== undefined) {
            if (dotPieces[0] === '') {
                return checkWrapArray(fullName, object);
            }

            return get.call(this, rest, eval('object.' + dotPieces[0]), fullName);
        }

        if (dotPieces.length === 1) {
            if (typeof attrs[parseFuncResult.name] === 'function') {
                return attrs[parseFuncResult.name].apply(this, parseFuncResult.args);
            }
            return checkWrapArray(name, attrs[name]);
        }

        var thisObject = typeof attrs[parseFuncResult.name] === 'function'
            ? attrs[parseFuncResult.name].apply(this, parseFuncResult.args)
            : attrs[dotPieces[0]];

        return get.call(this, rest, thisObject, fullName);
    };

    var checkWrapArray = function(name, object) {
        return Array.isArray(object)
            ? new DataBind.Collection(name, object, fireValueChangedForAllDependencies)
            : object;
    };

    var fireValueChangedForAllDependencies = function(name) {
        valueChanged(name);

        if (dependsOn.hasOwnProperty(name)) {
            dependsOn[name].forEach(function(dependency) {
                fireValueChangedForAllDependencies(dependency);
            });
        }
    };

    var computed = function(name, func, explicitDependencies) {
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

    var action = function(name, func) {
        attrs[name] = func;
    };

    var addDependency = function(name, dependency) {
        dependsOn[dependency] = dependsOn[dependency] || [];
        dependsOn[dependency].push(name);
    };

    var setValueChanged = function(callback) {
        valueChanged = callback;
    };

    var getIndex = function(capture) {
        var intRegex = /^\d+$/;

        return intRegex.test(capture)
            ? parseInt(capture)
            : attrs[capture];
    };

    return {
        attr: attr,
        get: get,
        computed: computed,
        action: action,
        scope: scope,
        setValueChanged: setValueChanged
    };
};
"use strict";

var DataBind = DataBind || {};

DataBind.Collection = function(name, arr, valueChangedCallback) {
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