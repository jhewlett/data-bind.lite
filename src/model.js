var DataBind = (function (dataBind) {
    "use strict";

    dataBind.Model = function (scope) {
        var attrs = {};
        var dependsOn = {};
        var valueChanged = function (name) {
        };

        var attr = function (name, value) {
            var parser = new DataBind.Parser(attrs, fireValueChangedForAllDependencies, this);

            parser.attr(name, value);
        };

        var get = function (expr) {
            var parser = new DataBind.Parser(attrs, fireValueChangedForAllDependencies, this);

            return parser.get(expr);
        };

        var fireValueChangedForAllDependencies = function (name) {
            valueChanged(name);

            if (dependsOn.hasOwnProperty(name)) {
                dependsOn[name].forEach(function (dependency) {
                    fireValueChangedForAllDependencies(dependency);
                });
            }
        };

        var computed = function (name, func, explicitDependencies) {
            if (explicitDependencies) {
                explicitDependencies.forEach(function (dependency) {
                    addDependency(name, dependency);
                });
            }

            var regEx = /this\.get\(['"]([^'"]+)['"]\)/g;

            var match = regEx.exec(func.toString());
            while (match != null) {
                addDependency(name, match[1]);
                match = regEx.exec(func.toString());
            }

            attrs[name] = func;
        };

        var action = function (name, func) {
            attrs[name] = func;
        };

        var addDependency = function (name, dependency) {
            dependsOn[dependency] = dependsOn[dependency] || [];
            dependsOn[dependency].push(name);
        };

        var setValueChanged = function (callback) {
            valueChanged = callback;
        };

        return {
            attr: attr,
            get: get,
            computed: computed,
            action: action,
            scope: scope,
            setValueChanged: setValueChanged,
            call: function(actionExpr) { get(actionExpr); }
        };
    };

    return dataBind;
}(DataBind || {}));