describe('binder', function() {
    var binder, model, documentStub, scopeElement, element;

    beforeEach(function() {
        var model = new DataBind.Model("scope");
        model.attr('prop', 'myValue');

        documentStub = sinon.stub({querySelector: function() {}});
        scopeElement = sinon.stub({querySelectorAll: function() {}});
        element = sinon.stub({getAttribute: function() {}, tagName: ''});
        element.getAttribute.withArgs('data-bind').returns('prop');
        scopeElement.querySelectorAll.withArgs('[data-bind]').returns([element]);
        scopeElement.querySelectorAll.withArgs('[data-click]').returns([]);
        scopeElement.querySelectorAll.withArgs('[data-class]').returns([]);
        documentStub.querySelector.withArgs('[data-scope=scope]').returns(scopeElement);
        binder = new DataBind.Binder(model, documentStub);
    });

    describe('bind', function() {
        beforeEach(function() {
            binder.bind();
        });

        it('should set value from model', function() {
            expect(element.innerHTML).toEqual('myValue');
        });
    });
});