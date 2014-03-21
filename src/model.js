var DataBind = DataBind || {};

DataBind.Model = function(scope) {
    var map = {};
    var onValueChanged;
    var attr = function(name, value) {
        if (value !== undefined) {
            map[name] = value;
            fireOnValueChanged(name);
        } else {
            return map[name];
        }
    };

    var hasAttr = function(name) {
        return map[name] !== undefined;
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
        hasAttr: hasAttr,
        scope: scope,
        setOnValueChanged: setOnValueChanged
    };
};