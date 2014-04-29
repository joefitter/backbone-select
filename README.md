# Backbone Select
> Lightweight Bootstrap-esque select element that doesn't require Bootstrap

Backbone Select is a fully customisable plugin for use in web applications. It is written in BackboneJS but can be used in any front end environment.

## Current version
The latest version of Backbone Select is **v0.0.1**. 

## Prerequisites
Backbone Tooltip requires:
* [jQuery](http://jquery.com/) >= v1.9.0
* [Backbone](http://backbonejs.org) >= v0.9.0

Note: Backbone requires either [Underscore](http://underscorejs.org/) or [Lo-Dash](http://lodash.com/) so you will need to also include one of these manually if you are not installing with Bower.

## Get Backbone Select
Backbone Select can be installed using [Bower](http://bower.io/)

```bash
$ bower install backbone-select
```

You can clone the GitHub repository

```bash
$ git clone https://github.com/joefitter/backbone-select
```

Or you can download the repo as a .zip [here](https://github.com/joefitter/backbone-select/archive/master.zip) - extract and copy the src folder into your project.

## Installation
You will need to include the stylesheet in the `<head>` of every page the select element will be used on:

```html
<link rel="stylesheet" href="bower_components/backbone-select/src/backbone-select.css">
```

#### AMD
If your project uses [RequireJS](http://requirejs.org/), Backbone Select can be included as an AMD module by adding the AMD version to your paths config, you will also need to specify the locations of jQuery, Backbone and Underscore:

```js
requirejs.config({
  paths: {
    select: 'bower_components/backbone-select/src/backbone-select.amd',
    backbone: 'bower_components/backbone/backbone',
    jquery: 'bower_components/jquery/dist/jquery',
    underscore: 'bower_components/underscore/underscore'
    ...
  }
});
```

You can now use require to include the select whenever it is needed:

```js
require(['select'], function(Select){
  ...
});

define('module-name', ['select', ...], function(Select, ...){
  ...
});
```

#### Non-AMD
For non-AMD projects, include the following scripts before the closing `<head>` tag

```html
<script src="bower_components/jquery/dist/jquery.js"></script>
<script src="bower_components/underscore/underscore.js"></script>
<script src="bower_components/backbone/backbone.js"></script>
<script src="bower_components/backbone-select/src/backbone-select.js"></script>
```

Alter the paths above so they point to the correct locations in your file structure.

If you use the non-AMD version, the select is instantiated by creating a `new Backbone.Select();`