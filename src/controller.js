var model = new DataBind.Model();

model.attr('firstName', 'Justin');
model.attr('lastName', 'Hewlett');

var binder = new DataBind.Binder(model);

binder.bind();

setTimeout(function() {
    model.attr('firstName', 'Jus');
}, 2000);