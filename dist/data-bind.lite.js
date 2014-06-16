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
                    model.invoke(expression);
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
                model.invoke(expression);
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


var DataBind = (function (dataBind) {
    "use strict";

    dataBind.Parser = function(fireValueChangedForAllDependencies, lookupFunc, updateValueFunc) {

        var checkWrapArray = function (name, object) {
            return Array.isArray(object)
                ? new DataBind.Collection(name, object, fireValueChangedForAllDependencies)
                : object;
        };

        var tokenize = function(name) {
            var pieces = name.split('.');
            for(var i = 0; i < pieces.length; i++) {
                var splitArr = pieces[i].indexOf('][');
                if (splitArr >= 0) {
                    var firstPart = pieces[i].substring(0, splitArr + 1);
                    var secondPart = pieces[i].substring(splitArr + 1);

                    pieces.splice(i, 1);
                    pieces.splice(i, 0, firstPart);
                    pieces.splice(i + 1, 0, secondPart);
                }
            }

            return pieces;
        };

        var getArrayIndexerMatch = function (name) {
            var arrayAccessRegex = /\[([^\]]+)\]/;

            return arrayAccessRegex.exec(name);
        };

        var getIndex = function (capture) {
            var intRegex = /^\d+$/;

            return intRegex.test(capture)
                ? parseInt(capture)
                : lookupFunc(capture);
        };

        var parseFunction = function(lexer, context) {
            var functionName = lexer.currentToken().text;

            lexer.consume();
            var args = [];

            if (lexer.currentToken().token === 'LPAREN') {
                lexer.consume();
                var argText = '';
                while(lexer.hasNextToken() && lexer.currentToken().token !== 'RPAREN') {
                    if (lexer.currentToken().token === 'COMMA') {
                        args.push(get(argText));
                        argText = '';
                    } else {
                        argText += lexer.currentToken().text;
                    }
                    lexer.consume();
                }

                if (lexer.currentToken().token === 'RPAREN' && argText) {
                    args.push(get(argText));
                }
            }

            return lookupFunc(functionName).apply(context, args);
        };

        var parseProperty = function(lexer, id, object) {
            lexer.consume();

            if (object) {
                return object[lookupFunc(id)[lexer.currentToken().text]];
            }

            return lookupFunc(id)[lexer.currentToken().text];
        };

        var get = function(name) {
            var lexer = new DataBind.Lexer(name);

            var object = null;

            while (lexer.hasNextToken()) {
                lexer.consume();
                if (lexer.currentToken().token === 'NUMBER') {
                    return parseInt(lexer.currentToken().text);
                }
                if (lexer.currentToken().token === 'LITERAL') {
                    return lexer.currentToken().text.replace(/'/g, '').replace(/"/g, "");
                }

                if (lexer.currentToken().token === 'ID') {
                    if (typeof lookupFunc(lexer.currentToken().text) === 'function') {
                        object = parseFunction(lexer, this);
                    } else {
                        var id = lexer.currentToken().text;

                        lexer.consume();

                        if (lexer.currentToken().token === 'DOT') {
                            object = parseProperty(lexer, id, object);
                        } else if (lexer.currentToken().token === 'LBRACK') {
                            lexer.consume();

                            var index = getIndex(lexer.currentToken().text);

                            object = lookupFunc(id)[index];
                        } else {
                            object = checkWrapArray(id, lookupFunc(id));
                        }
                    }
                }

                if (lexer.currentToken().token === 'DOT') {
                    lexer.consume();

                    object = object[lexer.currentToken().text];
                } else if (lexer.currentToken().token === 'LBRACK') {
                    lexer.consume();

                    object = object[getIndex(lexer.currentToken().text)];
                }
            }

            return checkWrapArray(name, object);
        };

        var attr = function (name, value, object, fullName, changedCollections) {
            fullName = fullName || name;
            changedCollections = changedCollections || [];

            var dotPieces = tokenize(name);
            var rest = dotPieces.slice(1, dotPieces.length).join('.');

            var arrayIndexer = getArrayIndexerMatch(dotPieces[0]);
            if (arrayIndexer !== null) {
                var prop = dotPieces[0].substring(0, arrayIndexer.index);
                var index = getIndex(arrayIndexer[1]);

                if (prop !== '') {
                    changedCollections.push(prop);
                }

                if (object !== undefined) {
                    if (prop === '') {
                        if (dotPieces.length === 1) {
                            object[index] = value;
                            fireValueChangedForAllDependencies(fullName);
                            fireValueChangedForAll(changedCollections);
                        } else {
                            attr(rest, value, object[index], fullName, changedCollections);
                        }
                    } else {
                        attr(rest, value, object[prop][index], fullName, changedCollections);
                    }
                } else if (dotPieces.length === 1) {
                    lookupFunc(prop)[index] = value;
                    fireValueChangedForAllDependencies(fullName);
                    fireValueChangedForAll(changedCollections);
                } else {
                    attr(rest, value, lookupFunc(prop)[index], fullName, changedCollections);
                }
            } else if (object !== undefined) {
                if (dotPieces.length === 1) {
                    object[dotPieces[0]] = value;
                    fireValueChangedForAllDependencies(fullName);
                    fireValueChangedForAll(changedCollections);
                } else {
                    attr(rest, value, object[dotPieces[0]], fullName);
                }
            } else if (dotPieces.length === 1) {
                updateValueFunc(name, value);
                fireValueChangedForAllDependencies(name);
            } else {
                if (lookupFunc(dotPieces[0]) === undefined) {
                    updateValueFunc(dotPieces[0], {});
                }
                attr(rest, value, lookupFunc(dotPieces[0]), fullName);
            }
        };

        var fireValueChangedForAll = function (items) {
            items.forEach(function (item) {
                fireValueChangedForAllDependencies(item);
            });
        };

        return {
            get: get,
            attr: attr
        };
    };

    return dataBind;
}(DataBind || {}));

var DataBind = (function (dataBind) {
    "use strict";

    dataBind.Lexer = function(expr) {
        var rules = {root: [
            [/\[/, 'LBRACK'],
            [/\]/, 'RBRACK'],
            [/[(]/, 'LPAREN'],
            [/[)]/, 'RPAREN'],
            [/,/, 'COMMA'],
            [/['][^']*[']/, 'LITERAL'],
            [/["][^"]*["]/, 'LITERAL'],
            [/[a-zA-Z][a-zA-Z0-9]*/, 'ID'],    //todo: allow more id characters
            [/[0-9]+/, 'NUMBER'],
            [/[.]/, 'DOT'],
            [/\s+/, TokenJS.Ignore],  //ignore whitespace
        ]};

        var lexer = new TokenJS.Lexer(expr, rules, false);

        var tokens = lexer.tokenize();

        var i = -1;

        var hasNextToken = function() {
            return i < tokens.length - 1;
        };

        return {
            currentToken: function() {
                if (i < tokens.length)
                    return tokens[i];
                else
                    return TokenJS.EndOfStream;
            },
            consume: function() { i++; },
            hasNextToken: hasNextToken
        };
    };

    return dataBind;
}(DataBind || {}));

var TokenJS = TokenJS || {};

TokenJS.Ignore = {
    toString: function() {
        return 'Ignored rule';
    }
};

TokenJS.EndOfStream = {
    toString: function() {
        return "End of token stream";
    }
};

TokenJS.SyntaxError = function(message) {
    this.name = "SyntaxError";
    this.message = message;
};

TokenJS.StateError = function(message) {
    this.name = "StateError";
    this.message = message;
};

/**
 * @param input: text to lex
 * @param rules: dictionary of lexing rules. Must contain a 'root' state.
 * @param ignoreAllUnrecognized: if true, ignores unrecognized characters instead of throwing an error
 */
 TokenJS.Lexer = function(input, rules, ignoreUnrecognized){
    var _rules = rules;
    var _currentState;
    var _input = input;
    var _index = 0;
    var _ignoreUnrecognized = ignoreUnrecognized;

    var state = function(newState) {
        if (!_rules.hasOwnProperty(newState)) {
            throw new TokenJS.StateError("Missing state: '" + newState + "'.");
        }
        _currentState = newState;
    };

    state('root');

    var getNextToken = function() {
        if (_index >= _input.length) {
            return TokenJS.EndOfStream;
        }

        var oldState = _currentState;

        var allMatches = getAllMatches();

        for (var i = 0; i < allMatches.length; i++) {
            var bestMatch = allMatches[i];
            if (typeof bestMatch.value === 'function') {
                var returnValue = bestMatch.value.call(callbackContext, bestMatch.matchText);
                if (returnValue === TokenJS.Ignore) {
                    consume(bestMatch.matchText);
                    return getNextToken();
                } else if (hasValue(returnValue)) {
                    consume(bestMatch.matchText);
                    return {text: bestMatch.matchText, token: returnValue, index: bestMatch.index};
                } else if (changedStateWithoutReturningToken(oldState)) {
                    throwSyntaxError();
                }
            } else {
                consume(bestMatch.matchText);
                if (bestMatch.value === TokenJS.Ignore) {
                    return getNextToken();
                } else {
                    return {text: bestMatch.matchText, token: bestMatch.value, index: bestMatch.index};
                }
            }
        }

        if (_ignoreUnrecognized) {
            _index += 1;
            return getNextToken();
        } else {
            throwSyntaxError();
        }
    };

    var getAllMatches = function () {
        var allMatches = [];

        var currentRules = _rules[_currentState];
        for (var i = 0; i < currentRules.length; i++) {
            var regex = currentRules[i][0];

            var match = regex.exec(_input.substring(_index));

            if (match && match.index === 0) {
                allMatches.push({matchText: match[0], value: currentRules[i][1], index: _index});
            }
        }
        sortByLongestMatchDescending(allMatches);

        return allMatches;
    };

    var sortByLongestMatchDescending = function(allMatches) {
        allMatches.sort(function (a, b) {
            if (a.matchText.length < b.matchText.length) {
                return 1;
            } else if (a.matchText.length > b.matchText.length) {
                return -1;
            }
            return 0;
        });
    };

    var changedStateWithoutReturningToken = function(oldState) {
        return _currentState !== oldState;
    };

    var throwSyntaxError = function() {
        throw new TokenJS.SyntaxError("Invalid character '" + _input[_index] + "' at index " + (_index + 1));
    };

    var consume = function(match) {
        _index += match.length;
    };

    var reset = function() {
        _index = 0;
        _currentState = 'root';
    };

    var tokenize = function() {
        reset();
        var allTokens = [];
        var token = getNextToken();
        while (token !== TokenJS.EndOfStream) {
            allTokens.push(token);
            token = getNextToken();
        }

        return allTokens;
    };

    var hasValue = function(variable) {
        return typeof variable !== 'undefined' && variable !== null;
    };

    var callbackContext = {
        state: state
    };

    return {
        getNextToken: getNextToken,
        tokenize: tokenize,
        state: state,
        reset: reset
    };
};