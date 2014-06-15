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