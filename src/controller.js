var model = new DataBind.Model('one');

model.attr('firstName', 'Justin');
model.attr('lastName', 'Hewlett');
//model.attr('checked', true);
//model.attr('sex', 'male');
model.computed('fullName', function() {
    console.log(this);
    return this.get('firstName') + ' ' + this.get('lastName');
});
model.computed('sentence', function() {
    //console.log(this)
    return this.get("fullName") + ' went to the store';
});
//model.attr('array', [1, 2, 3]);
//model.pop = function() {
//    this.get('array').pop();
//};
//model.computed('getClass', function() {
//    return this.get('firstName') === 'joe' ? 'hidden' : '';
//});

model.attr('items', [{firstName: 'joe', color: 'one'}, {firstName: 'john', color: 'two'}, {firstName: 'my', color: 'three'}]);

model.add = function() {
    this.get('items').push({firstName: 'john', color: 'four'});
};

var binder = new DataBind.Binder(model);
binder.bind();