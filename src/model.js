var DataBind = DataBind || {};

DataBind.Model = function(scope) {
    var attrs = {};
    var onValueChanged;
    var attr = function(name, value) {
        if (value !== undefined) {
            attrs[name] = value;
            fireOnValueChanged(name);
        } else if (typeof attrs[name] === "function") {
            return attrs[name].call(this);
        } else {
            return attrs[name];
        }
    };

    var computed = function(name, dependencies, func) {
        attrs[name] = func;
    };

    var hasAttr = function(name) {
        return attrs[name] !== undefined;
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
        computed: computed,
        hasAttr: hasAttr,
        scope: scope,
        setOnValueChanged: setOnValueChanged
    };
};