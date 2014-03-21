var model = new DataBind.Model('one');

model.attr('firstName', 'Justin');
model.attr('checked', true);
model.attr('sex', 'male');

var binder = new DataBind.Binder(model);
binder.bind();