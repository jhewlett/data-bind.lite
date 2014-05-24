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

