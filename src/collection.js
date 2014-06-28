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

        var remove = function(item) {
            var index = arr.indexOf(item);

            if (index >= 0) {
                arr.splice(index, 1);
                valueChangedCallback(name);

                return true;
            }

            return false;
        };

        var clear = function() {
            arr.length = 0;
            valueChangedCallback(name);
        };

        return {
            push: push,
            pop: pop,
            remove: remove,
            value: arr,
            length: function() { return arr.length; },
            forEach: forEach,
            clear: clear
        };
    };

    return dataBind;
}(DataBind || {}));

