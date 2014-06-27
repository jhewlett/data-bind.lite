var DataBind = (function (dataBind) {
    "use strict";

    dataBind.Parser = function(fireValueChangedForAllDependencies, lookupFunc, updateValueFunc) {

        var checkWrapArray = function (name, object) {
            return Array.isArray(object)
                ? new DataBind.Collection(name, object, fireValueChangedForAllDependencies)
                : object;
        };

        var parseFunction = function(lexer, context) {
            var functionName = lexer.currentToken().text;

            lexer.consume();
            var args = [];

            if (lexer.currentToken().token === 'LPAREN') {
                lexer.consume();
                var argText = '';
                while(lexer.currentToken().token !== 'RPAREN') {
                    if (lexer.currentToken().token === 'COMMA') {
                        args.push(get(argText));
                        argText = '';
                    } else {
                        argText += lexer.currentToken().text;
                    }
                    lexer.consume();
                }

                if (argText) {
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

                var index = get(lexer.currentToken().text);

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

                    object = object[get(lexer.currentToken().text)];
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

                    if (!object)
                        object = lookupFunc(id);

                    if (object === undefined) {
                        object = {};
                        updateValueFunc(id, object);
                    }

                    if (!lexer.hasNextToken()) {
                        updateValueFunc(id, value);
                        fireValueChangedForAllDependencies(id);
                    }

                    lexer.consume();
                }

                if (lexer.currentToken().token === 'LBRACK') {
                    changedCollections.push(id);
                    lexer.consume();

                    var index = get(lexer.currentToken().text);

                    lexer.consume();    //RBRACK

                    if (lexer.hasNextToken()) {
                        object = object[index];
                    } else {
                        object[index] = value;

                        fireValueChangedForAllDependencies(name);
                        fireValueChangedForAll(changedCollections);
                    }
                } else if (lexer.currentToken().token === 'DOT') {
                    lexer.consume();

                    if (lexer.hasNextToken()) {
                        object[lexer.currentToken().text] = object[lexer.currentToken().text] || {};
                        object = object[lexer.currentToken().text];
                    } else {
                        object[lexer.currentToken().text] = value;
                        fireValueChangedForAllDependencies(name);
                        fireValueChangedForAll(changedCollections);
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
