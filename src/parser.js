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

        var parseId = function(lexer, object) {
            var id = lexer.currentToken().text;

            lexer.consume();

            if (lexer.currentToken().token === 'DOT') {
                return parseProperty(lexer, id, object);
            } else if (lexer.currentToken().token === 'LBRACK') {
                lexer.consume();

                var index = getIndex(lexer.currentToken().text);

                return lookupFunc(id)[index];
            } else {
                return checkWrapArray(id, lookupFunc(id));
            }
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
                    return lexer.currentToken().text.slice(1, -1);
                }

                if (lexer.currentToken().token === 'ID') {
                    if (typeof lookupFunc(lexer.currentToken().text) === 'function') {
                        object = parseFunction(lexer, this);
                    } else {
                        object = parseId(lexer, object);
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

        var attr = function (name, value) {
            var changedCollections = [];
            var object = null;

            var lexer = new DataBind.Lexer(name);

            while (lexer.hasNextToken()) {
                lexer.consume();

                var id;
                if (lexer.currentToken().token === 'ID') {
                    id = lexer.currentToken().text;

                    object = lookupFunc(id);
                    lexer.consume();

                    if (!lexer.hasNextToken()) {
                        updateValueFunc(id, value);
                        fireValueChangedForAllDependencies(id);
                    }
                }

                if (lexer.currentToken().token === 'LBRACK') {
                    changedCollections.push(id);
                    lexer.consume();

                    var index = parseInt(lexer.currentToken().text);

                    lexer.consume();    //RBRACK

                    if (!lexer.hasNextToken()) {
                        object[index] = value;

                        fireValueChangedForAllDependencies(name);
                        fireValueChangedForAll(changedCollections);
                    } else {
                        object = object[index];
                    }
                } else if (lexer.currentToken().token === 'DOT') {
                    lexer.consume();

                    if (!lexer.hasNextToken()) {
                        if (object) {
                            object[lexer.currentToken().text] = value;
                            fireValueChangedForAllDependencies(name);
                            fireValueChangedForAll(changedCollections);
                        } else {
                            var newObject = {};
                            newObject[lexer.currentToken().text] = value;
                            updateValueFunc(id, newObject);
                        }
                    } else if (object) {
                        object = object[lexer.currentToken().text];
                    }
                }
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
