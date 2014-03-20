var DataBind = DataBind || {};

DataBind.Model = function() {
    var attrs = {};
    var myCallback;
    var attr = function(name, value) {
        if (value) {
            attrs[name] = value;
            console.log(typeof myCallback);
            if (typeof myCallback === "function")
                myCallback(name);
        } else {
            return attrs[name];
        }
    };

    var onValueChange = function(callback) {
        myCallback = callback;
    };

    return {
        attr: attr,
        onValueChange: onValueChange
    };
};