"use strict";

var model = new DataBind.Model('aboutMe');

model.attr('firstName', 'Justin');
model.attr('lastName', 'Hewlett');
model.attr('aliases', [{title: 'Jus', style: 'italic'}, {title: 'Justy', style: 'underline'}]);
model.attr('newAlias', '');

model.computed('fullName', function() {
    return this.get('firstName') + ' ' + this.get('lastName');
});

model.action('addAlias', function() {
    this.get('aliases').push({title: this.get('newAlias'), style: 'underline'});
    this.attr('newAlias', '');
});

var binder = new DataBind.Binder(model);
binder.bind();