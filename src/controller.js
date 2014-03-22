var model = new DataBind.Model('one');

model.attr('firstName', 'Justin');
model.attr('lastName', 'Hewlett');
model.attr('checked', true);
model.attr('sex', 'male');
model.computed('fullName', function() {
    return this.get('firstName') + ' ' + this.get('lastName');
});
model.computed('sentence', function() {
    return this.get("fullName") + ' went to the store';
});
model.attr('array', [1, 2, 3]);
model.pop = function() {
    this.get('array').pop();
};

var binder = new DataBind.Binder(model);
binder.bind();