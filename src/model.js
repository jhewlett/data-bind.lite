var DataBind = (function (dataBind) {
    "use strict";

    dataBind.Model = function (scope) {
        var attrs = {};
        var dependsOn = {};
        var valueChangedListeners = [];
        var parser = new DataBind.Parser(this, fireValueChangedForAllDependencies, doLookup, updateValue);

        function doLookup(name) {
            return attrs[name];
        }

        function updateValue(name, value) {
            attrs[name] = value;
        }

        var attr = function (name, value) {
            parser.attr(name, value);
        };

        var get = function (expr) {
            var parser = new DataBind.Parser(this, fireValueChangedForAllDependencies, doLookup, updateValue);
            return parser.get(expr);
        };

        function fireValueChangedForAllDependencies(name) {
            valueChangedListeners.forEach(function(listener) {
                listener(name);
            });

            if (dependsOn.hasOwnProperty(name)) {
                dependsOn[name].forEach(function (dependency) {
                    fireValueChangedForAllDependencies(dependency);
                });
            }
        }

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

        var addValueChangedListener = function(callback) {
            valueChangedListeners.push(callback);
        };

        return {
            attr: attr,
            get: get,
            computed: computed,
            action: action,
            scope: scope,
            addValueChangedListener: addValueChangedListener,
            invoke: function(actionExpr) { get(actionExpr); }
        };
    };

    return dataBind;
}(DataBind || {}));