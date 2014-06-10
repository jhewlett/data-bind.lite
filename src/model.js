var DataBind = (function (dataBind) {
    "use strict";

    dataBind.Model = function (scope) {
        var attrs = {};
        var dependsOn = {};
        var valueChanged = function (name) {
        };

        var getArrayIndexerMatch = function (name) {
            var arrayAccessRegex = /\[([^\]]+)\]/;

            return arrayAccessRegex.exec(name);
        };

        var fireValueChangedForAll = function (items) {
            items.forEach(function (item) {
                fireValueChangedForAllDependencies(item);
            });
        };

        function tokenize(name) {
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
        }

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
                        attr(rest, value, eval('object.' + prop)[index], fullName, changedCollections);
                    }
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

        var checkForStringLiteral = function(name) {
            var stringLiteralRegex = /^['"]([^'"]*)['"]$/;
            return stringLiteralRegex.exec(name);
        };

        var parseFunctionCall = function (expression) {
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

                argPieces.forEach(function (piece) {
                    args.push(get.call(this, piece.trim()));
                });
            }

            return {name: functionName, args: args, isMatch: match !== null };
        };

        var get = function (name, object, fullName) {
            fullName = fullName || name;

            if (/^\d+$/.test(name)) {
                return parseInt(name);
            }

            var stringLiteralMatch = checkForStringLiteral(name);
            if (stringLiteralMatch !== null) {
                return stringLiteralMatch[1];
            }

            var dotPieces = tokenize(name);

            var rest = dotPieces.slice(1, dotPieces.length).join('.');

            var parseFuncResult = parseFunctionCall(dotPieces[0]);
            if (!parseFuncResult.isMatch) {
                var arrayIndexer = getArrayIndexerMatch(dotPieces[0]);

                if (arrayIndexer !== null) {
                    var prop = dotPieces[0].substring(0, arrayIndexer.index);
                    var index = getIndex(arrayIndexer[1]);

                    if (object !== undefined) {
                        if (prop === '') {
                            return get.call(this, rest, object[index], fullName);
                        }
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

        var checkWrapArray = function (name, object) {
            return Array.isArray(object)
                ? new DataBind.Collection(name, object, fireValueChangedForAllDependencies)
                : object;
        };

        var fireValueChangedForAllDependencies = function (name) {
            valueChanged(name);

            if (dependsOn.hasOwnProperty(name)) {
                dependsOn[name].forEach(function (dependency) {
                    fireValueChangedForAllDependencies(dependency);
                });
            }
        };

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

        var setValueChanged = function (callback) {
            valueChanged = callback;
        };

        var getIndex = function (capture) {
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
            setValueChanged: setValueChanged,
            call: function(actionExpr) { get(actionExpr); }
        };
    };

    return dataBind;
}(DataBind || {}));