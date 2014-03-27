describe('model', function() {
    var model;

    beforeEach(function() {
        model = new DataBind.Model("my scope");
    });

    it('should set the scope', function() {
        expect(model.scope).toEqual("my scope");
    });

    describe('computed properties with dependencies', function() {
        var valueChanged;
        beforeEach(function() {
            model.attr('a', 1);
            valueChanged = sinon.stub();
            model.setValueChanged(valueChanged);
            model.computed('b', function() {
                return this.get('a');
            });
            model.computed('c', function() {
                return this.get("b");
            });

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
});