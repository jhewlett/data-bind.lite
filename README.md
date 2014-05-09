data-bind.lite
==============

Tiny 2-way data-binding library written in javascript.

Declarative syntax with data-* attributes:
-------------------

Declaring a scope:
```html
<div data-scope="scope">
  ...
<div>
```
Any expressions within that element have the context of the "scope" model.

Binding to values:
```html
<p data-bind="fullName"></p>
```
```html
<input type="checkbox" data-bind="checked">
```

Binding to classes:
```html
<p data-class="myStyle"></p>
```

Binding to click events:
```html
<button data-click="addAlias(alias)">Add alias</button>
```

Binding to enter key press:
```html
<input data-enter="addAlias(alias)" type="text" data-bind="alias">
```

Repeating elements:
```html
<ul id="aliases" data-foreach="alias in aliases">
  <li data-bind="alias.title"></li>
</ul>
```

Model definition:
-----------------

Declaring a scope:
```javascript
var model = new DataBind.Model('scope');
```

Defining a property
```javascript
model.attr('firstName', 'Justin');
```

Defining a computed property
```javascript
model.computed('fullName' function() {
  return this.get('firstName') + ' ' + this.get('lastName'); 
});
```
Computed properties are automatically updated when any of their underlying properties change.

Defining an action:
```javascript
model.action('addItem', function(item) {
    this.get('items').push(item);
});
```

Binding the model:
```javascript
var binder = new DataBind.Binder(model);
binder.bind();
```


