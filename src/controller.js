var model = new DataBind.Model('one');

model.attr('firstName', 'Justin');
model.attr('lastName', 'Hewlett');

var binder = new DataBind.Binder(model);
binder.bind();

var model2 = new DataBind.Model('two');

model2.attr('firstName', 'Joe');
model2.attr('lastName', 'Schmoe');

var binder2 = new DataBind.Binder(model2);
binder2.bind();

setTimeout(function() {
    model.attr('firstName', 'Jus');
    model2.attr('lastName', 'Smith');
}, 2000);