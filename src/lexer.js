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
