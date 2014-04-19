"use strict";

var DataBind = DataBind || {};

DataBind.Model = function(scope) {
    var attrs = {};
    var dependsOn = {};
    var valueChanged = function(name) { };

    var getArrayIndexerMatch = function(name) {
        var arrayAccessRegex = /\[([^\]]+)\]/;

        return arrayAccessRegex.exec(name);
    };

    var fireValueChangedForAll = function (items) {
        items.forEach(function(item) {
            fireValueChangedForAllDependencies(item);
        });
    };

    var attr = function(name, value, object, fullName, changedCollections) {
        fullName = fullName || name;
        changedCollections = changedCollections || [];

        var dotPieces = name.split('.');
        var rest = dotPieces.slice(1, dotPieces.length).join('.');

        var arrayIndexer = getArrayIndexerMatch(dotPieces[0]);

        if (arrayIndexer !== null) {
            var prop = dotPieces[0].substring(0, arrayIndexer.index);
            var index = getIndex(arrayIndexer[1]);

            changedCollections.push(prop);

            if (object !== undefined) {
                attr(rest, value, eval('object.' + prop)[index], fullName, changedCollections);
            } else if (dotPieces.length === 1) {
                attrs[prop][index] = value;
                fireValueChangedForAllDependencies(fullName);
                fireValueChangedForAll(changedCollections);
            } else {
                attr(rest, value, attrs[prop][index], fullName, changedCollections);
            }
        } else if (object !== undefined) {
            if (dotPieces.length === 1) {
                object[dotPieces[0]] = value;
                fireValueChangedForAllDependencies(fullName);
                fireValueChangedForAll(changedCollections);
            } else {
                attr(rest, value, eval('object.' + dotPieces[0]), fullName);
            }
        } else if (dotPieces.length === 1) {
            attrs[name] = value;
            fireValueChangedForAllDependencies(name);
        } else {
            attr(rest, value, attrs[dotPieces[0]], fullName);
        }
    };

    var get = function(name, object, fullName) {
        fullName = fullName || name;

        var dotPieces = name.split('.');
        var rest = dotPieces.slice(1, dotPieces.length).join('.');

        var argsRegex = /[(][^)]+[)]/;
        var match = argsRegex.exec(dotPieces[0]);
        var args = [];
        if (match !== null) {
            dotPieces[0] = dotPieces[0].substring(0, match.index);

            match[0] = match[0].replace('(', '').replace(')', '');

            var split = match[0].split(',');

            split.forEach(function(piece) {
                args.push(get.call(this, piece.trim()));
            });
        }

        var arrayIndexer = getArrayIndexerMatch(dotPieces[0]);

        if (arrayIndexer !== null) {
            var prop = dotPieces[0].substring(0, arrayIndexer.index);
            var index = getIndex(arrayIndexer[1]);

            if (object !== undefined) {
                return get.call(this, rest, eval('object.' + prop)[index], fullName);
            }

            return get.call(this, rest, attrs[prop][index], fullName);
        }

        if (object !== undefined) {
            if (dotPieces[0] === '') {
                return checkWrapArray(fullName, object);
            }

            return get.call(this, rest, eval('object.' + dotPieces[0]), fullName);
        }

        if (dotPieces.length === 1) {
            if (typeof attrs[dotPieces[0]] === 'function') {
                return attrs[dotPieces[0]].apply(this, args);
            }

            return checkWrapArray(name, attrs[name]);
        }

        var thisObject = typeof attrs[dotPieces[0]] === 'function'
            ? attrs[dotPieces[0]].apply(this, args)
            : attrs[dotPieces[0]];

        return get.call(this, rest, thisObject, fullName);
    };

    var checkWrapArray = function(name, object) {
        return Array.isArray(object)
            ? new DataBind.Collection(name, object, fireValueChangedForAllDependencies)
            : object;
    };

    var fireValueChangedForAllDependencies = function(name) {
        valueChanged(name);

        if (dependsOn.hasOwnProperty(name)) {
            for(var i = 0; i < dependsOn[name].length; i++) {
                fireValueChangedForAllDependencies(dependsOn[name][i]);
            }
        }
    };

    var computed = function(name, func, otherDependencies) {
        //otherDependencies = otherDependencies || [];

        var regEx = /this\.get\(['"]([^'"]+)['"]\)/g;

        var match = regEx.exec(func.toString());
        while (match != null) {
            addDependency(name, match[1]);
            match = regEx.exec(func.toString());
        }

//        otherDependencies.forEach(function(dependency) {
//            addDependency(name, dependency);
//        });

        attrs[name] = func;
    };

    var addDependency = function(name, dependency) {
        dependsOn[dependency] = dependsOn[dependency] || [];
        dependsOn[dependency].push(name);
    };

    var setValueChanged = function(callback) {
        valueChanged = callback;
    };

    var getIndex = function(capture) {
        var intRegex = /^\d+$/;

        return intRegex.test(capture)
            ? parseInt(capture)
            : attrs[capture];
    };

    return {
        attr: attr,
        get: get,
        computed: computed,
        scope: scope,
        setValueChanged: setValueChanged
    };
};