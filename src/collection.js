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

    var set = function(index, value) {
        arr[index] = value;
        valueChangedCallback(name);
    };

    return {
        push: push,
        pop: pop,
        value: arr,
        set: set,
        length: function() { return arr.length; }
    };
};