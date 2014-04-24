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

model.computed('getClass', function(item) {
    return item.name;
}, ['items']);

model.alert = function() {
    alert('enter pressed!');
};

model.attr('items', [{color: 'four', name: 'joe'}, {color: 'three', name: 'john'}]);
model.attr('items2', [{color: 'four', name: 'joe'}, {color: 'three', name: 'john'}]);

var binder = new DataBind.Binder(model);
binder.bind();