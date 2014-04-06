"use strict";

var DataBind = DataBind || {};

DataBind.Model = function(scope) {
    var attrs = {};
    var dependsOn = {};
    var valueChanged = function(name) { };

    var attr = function(name, value) {
        var arrayAccessRegex = /\[([^\]]+)\]/;
        var match = arrayAccessRegex.exec(name);

        if (match !== null) {
            var prop = name.substring(0, match.index);
            var capture = match[1];
            //var intRegex = /^\d+$/;

//            var index = intRegex.test(capture)
//                ? parseInt(capture)
//                : attrs[capture];

            var index = parseInt(capture);

            attrs[prop][index] = value;
            fireValueChangedForAllDependencies(name);

            return;
        }

        attrs[name] = value;
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

    var setValueChanged = function(callback) {
        valueChanged = callback;
    };

    var checkWrapArray = function(name, object) {
        return Array.isArray(object)
            ? new DataBind.Collection(name, object, fireValueChangedForAllDependencies)
            : object;
    };

    var get = function(partialName, object, fullName) {
        fullName = fullName || partialName;

        var dotPieces = partialName.split('.');

        var arrayAccessRegex = /\[([^\]]+)\]/;
        var match = arrayAccessRegex.exec(dotPieces[0]);

        var rest = dotPieces.slice(1, dotPieces.length).join('.');

        if (match !== null) {
            var prop = dotPieces[0].substring(0, match.index);
            var capture = match[1];
            var intRegex = /^\d+$/;

            var index = intRegex.test(capture)
                ? parseInt(capture)
                : attrs[capture];

            if (object !== undefined) {
                return get.call(this, rest, eval('object.' + prop)[index], fullName);
            }

            return get.call(this, rest, attrs[prop][index], fullName);
        }

        if (object !== undefined && dotPieces[0] === '') {
            return checkWrapArray(fullName, object);
        }
        if (object !== undefined) {
            return get.call(this, rest, eval('object.' + dotPieces[0]), fullName);
        }
        if (dotPieces.length === 1) {
            if (typeof attrs[partialName] === 'function') {
                return attrs[partialName].call(this);
            } else {
                return checkWrapArray(partialName, attrs[partialName]);
            }
        }

        var thisObject = typeof attrs[dotPieces[0]] === 'function'
            ? attrs[dotPieces[0]].call(this)
            : attrs[dotPieces[0]];

        return get.call(this, rest, thisObject, fullName);
    };

    return {
        attr: attr,
        get: get,
        computed: computed,
        scope: scope,
        setValueChanged: setValueChanged
    };
};