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
