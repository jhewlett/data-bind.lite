var model = new DataBind.Model('one');

model.attr('firstName', 'Justin');
model.attr('lastName', 'Hewlett');
model.attr('checked', true);
model.attr('sex', 'male');
model.computed('fullName', ['firstName', 'lastName'], function() {
    return this.attr('firstName') + ' ' + this.attr('lastName');
});

var binder = new DataBind.Binder(model);
binder.bind();