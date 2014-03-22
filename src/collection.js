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
        arr: arr,
        length: arr.length,
        toString: arr.toString
    };
}