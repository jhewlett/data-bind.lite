var DataBind = DataBind || {};

DataBind.Model = function(scope) {
    var attrs = {};
    var dependsOn = {};
    //var collections = {};
    var valueChanged = function(name) { };

    var attr = function(name, value) {
        if (value !== undefined) {
            if (Array.isArray(value)) {
                addCollection(name, value);
            } else {
                attrs[name] = value;
            }
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

    var addCollection = function(name, value) {
        attrs[name] = new DataBind.Collection(name, value, fireValueChangedForAllDependencies);
        fireValueChangedForAllDependencies(name);
    };

    var computed = function(name, func) {
        var regEx = /this\.attr\('(\w+)'\)/g;

        var match = regEx.exec(func.toString());
        while (match != null) {
            addDependency(name, match[1]);
            match = regEx.exec(func.toString());
        }

        attrs[name] = func;
    };

    var addDependency = function(name, dependency) {
        dependsOn[dependency] = dependsOn[dependency] || [];
        dependsOn[dependency].push(name);
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