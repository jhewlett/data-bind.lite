var DataBind = DataBind || {};

DataBind.Model = function(scope) {
    var attrs = {};
    var dependsOn = {};
    var valueChanged = function(name) { };

    var attr = function(name, value) {
        if (Array.isArray(value)) {
            addCollection(name, value);
        } else {
            attrs[name] = value;
        }
        fireValueChangedForAllDependencies(name);
    };

    var addCollection = function(name, value) {
        attrs[name] = new DataBind.Collection(name, value, fireValueChangedForAllDependencies);
        fireValueChangedForAllDependencies(name);
    };

    var fireValueChangedForAllDependencies = function(name) {
        valueChanged(name);
        if (dependsOn.hasOwnProperty(name)) {
            for(var i = 0; i < dependsOn[name].length; i++) {
                fireValueChangedForAllDependencies(dependsOn[name][i]);
            }
        }
    };

    var computed = function(name, func) {
        var regEx = /this\.get\(['"](\w+)['"]\)/g;

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
        //todo: array access
        //todo: more than one layer deep
        var pieces = name.split('.');

        return attrs.hasOwnProperty(pieces[0]) && (pieces.length === 1 || attrs[pieces[0]].hasOwnProperty(pieces[1]));
    };

    var setValueChanged = function(callback) {
        valueChanged = callback;
    };

    var get = function(name, object) {
        var pieces = name.split('.');

        var rest = pieces.slice(1, pieces.length).join('.');

        if (object !== undefined && pieces[0] === '') {
            return object;
        }
        if (object !== undefined) {
            return get(rest, eval('object.' + pieces[0]));
        }
        if (pieces.length === 1) {
            return typeof attrs[name] === 'function'
                ? attrs[name].call(this)
                : attrs[name];
        }

        var object = typeof attrs[pieces[0]] === 'function'
            ? attrs[pieces[0]].call(this)
            : attrs[pieces[0]];

        return get(rest, object);
    };

    return {
        attr: attr,
        get: get,
        computed: computed,
        hasAttr: hasAttr,
        scope: scope,
        setValueChanged: setValueChanged
    };
};