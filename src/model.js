var DataBind = DataBind || {};

DataBind.Model = function(scope) {
    var attrs = {};
    var dependsOn = {};
    var valueChanged = function(name) { };

    var attr = function(name, value) {
        if (value !== undefined) {
            attrs[name] = value;
            fireValueChangedForAllDependencies(name);
        } else if (typeof attrs[name] === "function") {
            return attrs[name].call(this);
        } else {
            return attrs[name];
        }
    };

    var fireValueChangedForAllDependencies = function(name) {
        valueChanged(name);
        if (dependsOn.hasOwnProperty(name)) {
            for(var i = 0; i < dependsOn[name].length; i++) {
                fireValueChangedForAllDependencies(dependsOn[name][i]);
            }
        }
    };

    var computed = function(name, dependencies, func) {
        //parse func and look for this.attr('{0}') ?
        for(var i = 0; i < dependencies.length; i++) {
            dependsOn[dependencies[i]] = dependsOn[dependencies[i]] || [];
            dependsOn[dependencies[i]].push(name);
        }
        attrs[name] = func;
    };

    var hasAttr = function(name) {
        return attrs.hasOwnProperty(name);
    };

    var setValueChanged = function(callback) {
        valueChanged = callback;
    };

    return {
        attr: attr,
        computed: computed,
        hasAttr: hasAttr,
        scope: scope,
        setValueChanged: setValueChanged
    };
};