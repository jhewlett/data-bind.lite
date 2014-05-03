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

model.computed('getClass', function(number) {
    return number;
}, ['tasks']);

model.alert = function() {
    alert('enter pressed!');
};

model.computed('add', function(newTask) {
    this.get('tasks').push(newTask);
});

model.attr('tasks', ["do this", "do that", "and the other"]);

var binder = new DataBind.Binder(model);
binder.bind();