data-bind.lite
==============

Tiny 2-way data-binding library written in javascript.

Declarative syntax with data-* attributes:
-------------------

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
<button data-click="addAlias()">Add alias</button>
```

Binding to enter key press:
```html
<input data-enter="addAlias()" type="text" data-bind="newAlias">
```

Repeating elements:
```html
<ul id="aliases" data-foreach="alias in aliases">
  <li data-bind="alias.title"></li>
</ul>
```

Model definition:

Computed Properties:
