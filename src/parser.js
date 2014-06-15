var DataBind = (function (dataBind) {
    "use strict";

    dataBind.Parser = function(fireValueChangedForAllDependencies, lookupFunc, updateValueFunc) {
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
                    args.push(get(piece.trim()));
                });
            }

            return {name: functionName, args: args, isMatch: match !== null };
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

        var get = function(name) {
            var lexer = new TokenJS.Lexer(name, rules, false);

            var token = lexer.getNextToken();
            var object;
            while (token !== TokenJS.EndOfStream) {
                if (token.token === 'NUMBER') {
                    return parseInt(token.text);
                }
                if (token.token === 'LITERAL') {
                    return token.text.replace(/'/g, '').replace(/"/g, "");
                }

                if (token.token === 'ID') {
                    if (typeof lookupFunc(token.text) === 'function') {
                        var functionName = token.text;

                        token = lexer.getNextToken();
                        var args = [];

                        if (token.token === 'LPAREN') {
                            token = lexer.getNextToken();
                            var argText = '';
                            while(token !== TokenJS.EndOfStream && token.token !== 'RPAREN') {
                                if (token.token === 'COMMA') {
                                    args.push(get(argText));
                                    argText = '';
                                } else {
                                    argText += token.text;
                                }
                                token = lexer.getNextToken();
                            }

                            if (token.token === 'RPAREN' && argText) {
                                args.push(get(argText));
                            }
                        }

                        object = lookupFunc(functionName).apply(this, args);
                    } else {
                        var id = token.text;

                        token = lexer.getNextToken();

                        if (token.token === 'DOT') {
                            token = lexer.getNextToken();

                            if (object) {
                                object = object[lookupFunc(id)[token.text]];
                            } else {
                                object = lookupFunc(id)[token.text];
                            }
                        } else if (token.token === 'LBRACK') {
                            token = lexer.getNextToken();

                            var index = getIndex(token.text);

                            object = lookupFunc(id)[index];
                        } else {
                            object = checkWrapArray(id, lookupFunc(id));
                        }
                    }
                }

                if (token.token === 'DOT') {
                    token = lexer.getNextToken();

                    object = object[token.text];
                } else if (token.token === 'LBRACK') {
                    token = lexer.getNextToken();

                    object = object[getIndex(token.text)];
                }

                token = lexer.getNextToken();
            }

            return checkWrapArray(name, object);
//
//            var parseFuncResult = parseFunctionCall(dotPieces[0]);
//            if (!parseFuncResult.isMatch) {
//                var arrayIndexer = getArrayIndexerMatch(dotPieces[0]);
//
//                if (arrayIndexer !== null) {
//                    var prop = dotPieces[0].substring(0, arrayIndexer.index);
//                    var index = getIndex(arrayIndexer[1]);
//
//                    if (object !== undefined) {
//                        if (prop === '') {
//                            return get(rest, object[index], fullName);
//                        }
//                        return get(rest, object[prop][index], fullName);
//                    }
//
//                    return get(rest, lookupFunc(prop)[index], fullName);
//                }
//            }
//
//            if (object !== undefined) {
//                if (dotPieces[0] === '') {
//                    return checkWrapArray(fullName, object);
//                }
//
//                return get(rest, object[dotPieces[0]], fullName);
//            }
//
//            if (dotPieces.length === 1) {
//                if (typeof lookupFunc(parseFuncResult.name) === 'function') {
//                    return lookupFunc(parseFuncResult.name).apply(this, parseFuncResult.args);
//                }
//                return checkWrapArray(name, lookupFunc(name));
//            }
//
//            var thisObject = typeof lookupFunc(parseFuncResult.name) === 'function'
//                ? lookupFunc(parseFuncResult.name).apply(this, parseFuncResult.args)
//                : lookupFunc(dotPieces[0]);
//
//            return get(rest, thisObject, fullName);
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
