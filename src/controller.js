"use strict";

var model = new DataBind.Model('one');

model.attr('firstName', 'Justin');
model.attr('lastName', 'Hewlett');
//model.attr('checked', true);
//model.attr('sex', 'male');
model.computed('fullName', function() {
    return this.get('firstName') + ' ' + this.get('lastName');
});
model.computed('sentence', function() {
    return this.get("fullName") + ' went to the store';
});

model.attr('items', ['joe', 'john', 'my']);

model.add = function() {
    this.get('items').push({firstName: 'john', color: 'four'});
};

var binder = new DataBind.Binder(model);
binder.bind();