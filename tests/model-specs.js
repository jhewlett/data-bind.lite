describe('model', function() {
    var model;

    beforeEach(function() {
        model = new DataBind.Model("my scope");
    });

    it('should set the scope', function() {
        expect(model.scope).toEqual("my scope");
    });

    describe('call function', function() {
        var actionSpy;
        beforeEach(function() {
            actionSpy = sinon.spy();
            model.action('doSomething', actionSpy);
            model.attr('arg', 1);
        });

        it('should invoke the action', function() {
	    model.invoke('doSomething(arg, 2, "literal")');
            
            expect(actionSpy.calledOnce).toBeTruthy();
            expect(actionSpy.calledWith(1, 2, "literal")).toBeTruthy();
        });
    });

    describe('calling attr with array index', function() {
        var valueChanged;
        beforeEach(function() {
            valueChanged = sinon.spy();
            model.attr('items', [0]);
            model.addValueChangedListener(valueChanged);
        });

        it('should update value in array', function() {
            model.attr('items[0]', 5);

            expect(model.get('items[0]')).toEqual(5);
            expect(valueChanged.calledWith('items[0]')).toBeTruthy();
        });
    });

    describe('calling attr with nonexistent object', function() {
        beforeEach(function() {
            model.attr('prop', 'dontTouchMe');

            model.attr('item.prop', 'myValue');
        });

        it('should create object and add to dictionary', function() {
            expect(model.get('item.prop')).toEqual('myValue');
        });

        it('should not use "prop" as key', function() {
            expect(model.get('prop')).toEqual('dontTouchMe')
        });
    });

    describe('pushing to array', function() {
        var valueChanged;
        beforeEach(function() {
            valueChanged = sinon.spy();
            model.attr('arr', [0]);
            model.addValueChangedListener(valueChanged);

            model.get('arr').push(1);
        });

        it('should call value changed', function() {
            expect(valueChanged.calledWith('arr')).toBeTruthy();
        });

        it('should push to array', function() {
            expect(model.get('arr').value).toEqual([0, 1]);
        });
    });

    describe('pushing to inner array', function() {
        var valueChanged;
        beforeEach(function() {
            valueChanged = sinon.spy();
            model.attr('arr', {inner: [1]});
            model.addValueChangedListener(valueChanged);

            model.get('arr.inner').push(2);
        });

        it('should call value changed', function() {
            expect(valueChanged.calledWith('arr.inner')).toBeTruthy();
        });

        it('should push to array', function() {
            expect(model.get('arr.inner').value).toEqual([1, 2]);
        });
    });

    describe('calling attr with dot property syntax', function() {
        var valueChanged;

        beforeEach(function() {
            valueChanged = sinon.spy();
            model.attr('object', {firstName: ''});
            model.addValueChangedListener(valueChanged);
        });

        it('should update property on object', function() {
            model.attr('object.firstName', 'john');

            expect(model.get('object.firstName')).toEqual('john');
            expect(valueChanged.calledWith('object.firstName')).toBeTruthy();
            expect(valueChanged.calledWith('object')).toBeFalsy();
        });
    });

    describe('calling attr with multiple layers of dot property syntax and array indexing', function() {
        var valueChanged;
        beforeEach(function() {
            valueChanged = sinon.spy();
            model.attr('object', {items: [{firstName: ''}]});
            model.addValueChangedListener(valueChanged);
        });

        it('should update property on object', function() {
            model.attr('object.items[0].firstName', 'john');

            expect(model.get('object.items[0].firstName')).toEqual('john');
            expect(valueChanged.calledWith('object.items[0].firstName')).toBeTruthy();
        });
    });

    describe('calling attr with 2d array indexing', function() {
        var valueChanged;
        beforeEach(function() {
            valueChanged = sinon.spy();
            model.attr('items', [[0, 1], [2, 3]]);
            model.addValueChangedListener(valueChanged);
        });

        it('should set the individual item', function() {
            model.attr('items[1][0]', 4);
            expect(model.get('items').value[1][0]).toEqual(4);
            expect(valueChanged.calledWith('items[1][0]')).toBeTruthy();
        })
    });

    describe('calling attr with 3d array indexing', function() {
        var valueChanged;
        beforeEach(function() {
            valueChanged = sinon.spy();
            model.attr('items', [[[0, 1]]]);
            model.addValueChangedListener(valueChanged);
        });

        it('should set the individual item', function() {
            model.attr('items[0][0][1]', 7);
            expect(model.get('items').value[0][0][1]).toEqual(7);
            expect(valueChanged.calledWith('items[0][0][1]')).toBeTruthy();
        })
    });

    describe('getting object graph', function() {
        it('should dig into object', function() {
            model.attr('object', {prop: 'value'});

            expect(model.get('object.prop')).toEqual('value');
        });

        it('should dig into object graph two levels deep', function() {
            model.attr('object', {prop: {prop2: 'value'}});

            expect(model.get('object.prop.prop2')).toEqual('value');
        });

        it('should handle computed property in object graph', function() {
            model.computed('computed', function() {return {computedProp: 4}});

            expect(model.get('computed.computedProp')).toEqual(4);
        });

        it('should handle computed property with args in object graph', function() {
            model.computed('computed', function(num) {return {computedProp: 3}});

            expect(model.get('computed(2).computedProp')).toEqual(3);
        });

        it('should handle array access at beginning', function() {
            model.attr('items', [{number: 0}, {number: 1}]);

            expect(model.get('items[1].number')).toEqual(1);
        });

        it('should handle array access in middle', function() {
            model.attr('object', {arr: [{number: 0}, {number: 1}]});

            expect(model.get('object.arr[0].number')).toEqual(0);
        });

        it('should handle variable array access at beginning', function() {
            model.attr('index', 1);
            model.attr('items', [0, 1]);

            expect(model.get('items[index]')).toEqual(1);
        });

        it('should handle multiple array indexing expressions', function() {
            model.attr('items', [[[0, 1]]]);

            expect(model.get('items[0][0][1]')).toEqual(1);
        });
    });

    describe('getting a number', function() {
        it('should return the number, parsed', function() {
            expect(model.get("5")).toEqual(5);
        });
    });

    describe('getting a single-quoted string', function() {
        it('should return the string', function() {
            expect(model.get("'string'")).toEqual('string');
        });
    });

    describe('getting a double-quoted string', function() {
        it('should return the string', function() {
            expect(model.get('"string"')).toEqual("string");
        });
    });

    describe('computed properties with dependencies', function() {
        var valueChanged;
        beforeEach(function() {
            model.attr('a', 1);
            valueChanged = sinon.spy();
            model.computed('b', function() {
                return this.get('a');
            });
            model.computed('c', function() {
                return this.get("b");
            });

            model.addValueChangedListener(valueChanged);

            model.attr('a', 2);
        });

        it('should trigger value changed for this attr', function() {
            expect(valueChanged.calledWith('a')).toBeTruthy();
        });

        it('should trigger value changed for dependent properties', function() {
            expect(valueChanged.calledWith('b')).toBeTruthy();
            expect(valueChanged.calledWith('c')).toBeTruthy();
        });

        it('should get computed value', function() {
            expect(model.get('c')).toEqual(2);
        });
    });

    describe('action with no arguments', function() {
        var spy;
        beforeEach(function() {
            spy = sinon.spy();

            model.action('myAction', spy);
        });

        it('should call action', function() {
            model.get('myAction()');

            expect(spy.calledWithExactly()).toBeTruthy();
        });
    });

    describe('modifying property on array item', function() {
        var valueChanged;

        beforeEach(function() {
            model.attr('items', [{completed: false}]);

            valueChanged = sinon.spy();
            model.addValueChangedListener(valueChanged);

            model.attr('items[0].completed', true);
        });

        it('should trigger value changed for array', function() {
            expect(valueChanged.calledWith('items')).toBeTruthy();
        })
    });

    describe('modifying property on inner array item', function() {
        var valueChanged;

        beforeEach(function() {
            model.attr('items', [{subItems: [{completed: false}]}]);

            valueChanged = sinon.spy();
            model.addValueChangedListener(valueChanged);

            model.attr('items[0].subItems[0].completed', true);
        });

        it('should set value', function() {
            expect(model.get('items[0].subItems[0].completed')).toEqual(true);
        });

        it('should trigger value changed for outer collection', function() {
            expect(valueChanged.calledWith('items')).toBeTruthy();
        });
    });

    describe('modifying array item', function() {
        var valueChanged;

        beforeEach(function() {
            model.attr('items', [0]);

            valueChanged = sinon.spy();
            model.addValueChangedListener(valueChanged);

            model.attr('items[0]', 1);
        });

        it('should trigger value changed for collection', function() {
            expect(valueChanged.calledWith('items')).toBeTruthy();
        });
    });

    describe('computed property with explicit dependency', function() {
        var valueChanged;

        beforeEach(function() {
            valueChanged = sinon.spy();

            model.attr('items', [0]);
            model.computed('prop', function() {
                return this.get('items[0]');
            }, ['items']);

            model.addValueChangedListener(valueChanged);

            model.get('items').push(1);
        });

        it('adding to items should trigger value changed for computed property', function() {
            expect(valueChanged.calledWith('prop')).toBeTruthy();
        });
    });

    describe('computed property with a parameter', function() {
        var methodSpy;

        beforeEach(function() {
            methodSpy = sinon.spy();

            model.attr('arg1', 'value1');
            model.attr('items', ['value2']);
            model.computed('func', methodSpy);
        });

        it('should pass parameter', function() {
            model.get('func(arg1, items[0])');

            expect(methodSpy.calledWith('value1', 'value2')).toBeTruthy();
        });
    });
});