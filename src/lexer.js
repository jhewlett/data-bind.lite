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

        var i = 0;

        var hasNextToken = function() {
            return i < tokens.length - 1;
        };

        var currentToken = function() {
            if (i < tokens.length)
                return tokens[i];
            else
                return TokenJS.EndOfStream;
        };

        var consume = function(expected) {
            i++;

            if (expected && currentToken().token !== expected)
                throw {
                    toString: function() { return 'Syntax error: Expected token: ' + expected + ', actual: ' + currentToken().token }
                };
        };

        return {
            currentToken: currentToken,
            consume: consume,
            hasNextToken: hasNextToken
        };
    };

    return dataBind;
}(DataBind || {}));
