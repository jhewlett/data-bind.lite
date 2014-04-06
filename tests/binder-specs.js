describe('binder', function() {
    var binder, model, documentStub, scopeElement, element, element2;

    beforeEach(function() {
        model = new DataBind.Model("scope");
        model.attr('prop', 'myValue');
        model.attr('check', true);

        documentStub = sinon.stub({querySelector: function() {}});
        scopeElement = sinon.stub({querySelectorAll: function() {}});
        scopeElement.querySelectorAll.withArgs('[data-bind]').returns([]);
        scopeElement.querySelectorAll.withArgs('[data-click]').returns([]);
        scopeElement.querySelectorAll.withArgs('[data-class]').returns([]);
        scopeElement.querySelectorAll.withArgs('[data-template]').returns([]);
        scopeElement.querySelectorAll.withArgs('[data-foreach]').returns([]);
        documentStub.querySelector.withArgs('[data-scope=scope]').returns(scopeElement);
        binder = new DataBind.Binder(model, documentStub);
    });

    describe('bind', function() {
        describe('classes', function() {
            var classList;
            beforeEach(function() {
                classList = sinon.stub({add: function() {}, remove: function() {}});
                element = sinon.stub({getAttribute: function() {}, classList: classList});
                element.getAttribute.withArgs('data-class').returns('prop');

                scopeElement.querySelectorAll.withArgs('[data-class]').returns([element]);
            });

            it('should add attribute value as a class', function() {
                binder.bind();

                expect(classList.add.calledWith('myValue')).toBeTruthy();
            });

            describe('when the value changes to a new value', function() {
                beforeEach(function() {
                    scopeElement.querySelectorAll.withArgs('[data-class="prop"]').returns([element]);
                    scopeElement.querySelectorAll.withArgs('[data-bind="prop"]').returns([]);
                });

                it('should update the class', function() {
                    binder.bind();
                    model.attr('prop', 'newClass');

                    expect(classList.remove.calledWith('myValue')).toBeTruthy();
                    expect(classList.add.calledWith('newClass')).toBeTruthy();
                });
            });
        });

//        describe('templates', function() {
//            var template;
//
//            describe('with invalid attribute name', function() {
//                beforeEach(function() {
//                    template = {innerHTML: 'Hello {{invalid}}'};
//                    scopeElement.querySelectorAll.withArgs('[data-template]').returns([template]);
//                    binder.bind();
//                });
//
//                it('should replace with empty string', function() {
//                    expect(template.innerHTML).toEqual('Hello ');
//                });
//            });
//
//            describe('with valid attribute name', function() {
//                beforeEach(function() {
//                    template = {innerHTML: 'Hello {{prop}}'};
//                    scopeElement.querySelectorAll.withArgs('[data-template]').returns([template]);
//                    binder.bind();
//                });
//
//                it('should replace html', function() {
//                    expect(template.innerHTML).toEqual('Hello myValue');
//                });
//
//                describe('changing the value again', function() {
//                    beforeEach(function() {
//                        scopeElement.querySelectorAll.withArgs('[data-class=prop]').returns([]);
//                        scopeElement.querySelectorAll.withArgs('[data-bind=prop]').returns([]);
//                    });
//
//                    it('should replace html with new value', function() {
//                        model.attr('prop', 'newValue');
//                        expect(template.innerHTML).toEqual('Hello newValue');
//                    });
//                });
//            });
//        });

        describe('text input', function() {
            beforeEach(function() {
                element = sinon.stub({getAttribute: function() {}, tagName: '', type: 'text'});
                element.getAttribute.withArgs('data-bind').returns('prop');
                scopeElement.querySelectorAll.withArgs('[data-bind]').returns([element]);
            });

            it('should set value', function() {
                binder.bind();
                expect(element.value).toEqual('myValue');
            });
        });

        describe('textarea input', function() {
            beforeEach(function() {
                element = sinon.stub({getAttribute: function() {}, tagName: '', type: 'textarea'});
                element.getAttribute.withArgs('data-bind').returns('prop');
                scopeElement.querySelectorAll.withArgs('[data-bind]').returns([element]);
            });

            it('should set value', function() {
                binder.bind();
                expect(element.value).toEqual('myValue');
            });
        });

        describe('checkbox', function() {
            beforeEach(function() {
                element = sinon.stub({getAttribute: function() {}, type: 'checkbox', tagName: '', checked: false});
                element.getAttribute.withArgs('data-bind').returns('check');
                scopeElement.querySelectorAll.withArgs('[data-bind]').returns([element]);
            });

            it('should set checked', function() {
                binder.bind();
                expect(element.checked).toEqual(true);
            });
        });

        describe('select', function() {
            beforeEach(function() {
                element = sinon.stub({getAttribute: function() {}, tagName: 'SELECT'});
                element.getAttribute.withArgs('data-bind').returns('prop');
                scopeElement.querySelectorAll.withArgs('[data-bind]').returns([element]);
            });

            it('should set value', function() {
                binder.bind();
                expect(element.value).toEqual('myValue');
            });
        });

        describe('radio', function() {
            beforeEach(function() {
                element = sinon.stub({getAttribute: function() {}, type: 'radio', value: 'wrongValue', tagName: '', checked: false});
                element.getAttribute.withArgs('data-bind').returns('prop');
                element2 = sinon.stub({getAttribute: function() {}, type: 'radio', value: 'myValue', tagName: '', checked: false});
                element2.getAttribute.withArgs('data-bind').returns('prop');
                scopeElement.querySelectorAll.withArgs('[data-bind]').returns([element, element2]);
            });

            it('should set checked', function() {
                binder.bind();
                expect(element.checked).toEqual(false);
                expect(element2.checked).toEqual(true);
            });
        });

        describe('not an input element', function() {
            beforeEach(function() {
                element = sinon.stub({getAttribute: function() {}, tagName: ''});
                element.getAttribute.withArgs('data-bind').returns('prop');
                scopeElement.querySelectorAll.withArgs('[data-bind]').returns([element]);
            });

            it('should set innerHTML', function() {
                binder.bind();
                expect(element.innerHTML).toEqual('myValue');
            });
        });
    });
});