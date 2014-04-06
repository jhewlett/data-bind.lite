var DataBind = DataBind || {};

DataBind.Collection = function(name, arr, valueChangedCallback) {
    var push = function(value) {
        arr.push(value);
        valueChangedCallback(name);
    };

    var pop = function() {
        arr.pop();
        valueChangedCallback(name);
    };

    return {
        push: push,
        pop: pop,
        value: arr,
        length: function() { return arr.length; }
    };
};