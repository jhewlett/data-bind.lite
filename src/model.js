var DataBind = DataBind || {};

DataBind.Model = function(scope) {
    var attrs = {};
    var onValueChanged;
    var attr = function(name, value) {
        if (value) {
            attrs[name] = value;
            fireOnValueChanged(name);
        } else {
            return attrs[name];
        }
    };

    var fireOnValueChanged = function(name) {
        if (onValueChanged) {
            onValueChanged(name);
        }
    };

    var setOnValueChanged = function(callback) {
        onValueChanged = callback;
    };

    return {
        attr: attr,
        scope: scope,
        setOnValueChanged: setOnValueChanged
    };
};