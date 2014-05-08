/*global _*/

define([
  'jquery',
  'backbone',
  'scrollTo'
], function(
  $,
  Backbone
) {
  'use strict';

  var CustomSelectModel = Backbone.Model.extend(),
    CustomSelectCollection = Backbone.Collection.extend({model: CustomSelectModel});

  return Backbone.View.extend({
    initialize: function(options) {
      if (!options || typeof options !== 'object') {
        throw new Error('Tooltip needs to be provided with a jQuery element object or options hash');
      }

      /*
       * Check if Select was instantiated with
       * a jQuery object or an options hash.
       */
      if (options instanceof $) {
        this.options = this.parseDataAttributes(options);
      } else {
        this.options = options;
      }

      /*
       * check collection passed in options, if so
       * check if it is a collection of strings,
       * if so, map to array of objects
       */
      if(this.options.collection.length){
        if(typeof this.options.collection[0] === 'string'){
          this.options.collection = _.map(this.options.collection, function(item){
            return {value:item, title:item};
          });
        }
      }
      
      this.collection = new CustomSelectCollection(this.options.collection);

      /*
       * Adding placeholder as option will enable the user
       * unassign value if this is clicked
       */
      if (this.options.placeholder && this.options.addPlaceholderAsOption) {
        this.collection.add({
          value: -1,
          title: this.options.placeholder
        }, {
          at: 0
        });
      }
      this.options.emptyText = this.options.emptyText || 'No results available';
      this.options.placeholder = this.options.placeholder || 'Choose one...';
      this.render();

      /*
       * Create new jQuery :Contains selector
       * which ignores case
       */
      $.expr[':'].Contains = jQuery.expr.createPseudo(function(arg) {
        return function(elem) {
          return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
        };
      });
    },
    parseDataAttributes: function($el){
      var ops = {};
      ops.$el = $el;
      ops.id = $el.attr('data-bbselect');
      ops.placeholder = $el.attr('placeholder');
      ops.quickSearch = $el.attr('data-bbselect-quicksearch');
      ops.collection = this.parseOptions($el);
      return ops;
    },
    parseOptions: function($el){
      if($el.children('option').length){
        var collection = [];
        $el.children('option').each(function(){
          var $this = $(this),
            model = {value: $this.attr('value') ? $this.attr('value') : $this.text(), title: $this.text()};
          collection.push(model);
        });
        return collection;
      }
    },
    events: {
      'click': 'focusSelect',
      'focus input.custom-select-input': 'handleFocus',
      'keydown input.custom-select-input': 'navigate',
      'mouseenter .custom-select-options a': 'highlightOption',
      'mouseout .custom-select-wrapper': 'deselectAll'
    },
    focus: false,
    render: function() {
      if(this.options.$el){
        this.options.$el.replaceWith(this.$el);  
      }
      var template = this.buildTemplate();
      this.$el.html(_.template(template)(this));
      this.bindWindowEvents();
      return this;
    },

    bindWindowEvents: function(){
      this.boundClickHandler = _.bind(this.clickHandler, this);
      this.boundKeypressHandler = _.bind(this.keypressHandler, this);
      $(window).bind('mousedown', this.boundClickHandler);
      $(window).bind('keydown', this.boundKeypressHandler);
    },

    buildTemplate: function(){
      var tpl = '<div class="custom-select-wrapper <%= options.shade %>">';
      if(!this.options.multiSelect){
        tpl += '   <div class="custom-select"';
        if(!this.collection.length){
          tpl += '   data-disabled="true"';  
        }
        tpl += '     >';
        tpl += '     <div class="custom-select-button">&#x25BC;</div>';
        tpl += '     <div class="custom-select-content"';
        if(this.options.multiSelect){
          tpl += '     data-multi="true"';
        }
        tpl += '       >';
        if(!this.options.value){
          if(this.collection.length){
            tpl += '<span class="placeholder"><%= options.placeholder %></span>';
          }
          else {
            tpl += this.options.emptyText;
          }
        } else {
          tpl += this.options.value;
        }
        tpl += '     </div>';
        tpl += '     <input class="custom-select-input" id="<%= options.id %>" type="text" />';
        tpl += '     <div class="clear"></div>';
        tpl += '   </div>';
      } else {
        tpl += '   <input class="custom-select-content <%= options.className %>" type="text"';
        if(this.options.placeholder){
          tpl += '   placeholder="<%= options.placeholder %>"';
        }
        tpl += '   >';
      }
      tpl += '     <div class="custom-select-options">';
      if(this.options.quickSearch){
        tpl += '     <input type="text" class="form-control quicksearch" placeholder="Start typing..">';
      }
      tpl += '       <div class="options-container">';
      this.collection.each(function(model){
        tpl += '       <a data-value="' + model.get('value') + '" href="#">' + model.get('title') + '</a>';
      });
      tpl += '       </div>';
      tpl += '     </div>';
      tpl += '  </div>';
      return tpl;
    },
    clickHandler: function(e) {
      var $el = $(e.target);
      //Check if element clicked is root element, or one of its children.
      if (this.el === $el.get(0) || this.$el.find($el).length > 0) {
        if (!$el.parents('.custom-select-options').hasClass('custom-select-options')) {
          this.focusSelect();
        } else {
          if($el.hasClass('quicksearch')){
            return;
          }
          if (!this.options.multiSelect) {
            this.handleOptionClick(e);
          } 
        }
      } else {
        this.handleBlur();
      }
    },
    handleOptionClick: function(e) {
      var $el = $(e.target);
      if($el.prop('tagName') === 'A'){
        this.clickOption($el);
      }
    },
    clickOption: function($el) {
      if (!this.options.multiSelect) {
        this.changeOption($el);
        this.hideOptions();
      } else {
        this.changeOption($el);
      }
    },
    keypressHandler: function(e) {
      if (e.keyCode === 9) {
        this.handleBlur();
      }
    },
    handleBlur: function() {
      this.hideOptions();
      this.$el.find('.custom-select').removeClass('focused');
    },
    focusSelect: function() {
      this.$el.find('input.custom-select-input').focus();
    },
    handleFocus: function() {
      this.$el.find('.custom-select').addClass('focused');
      this.showOptions();
    },
    navigate: function(e){
      var kc = e.keyCode, current;
      switch(kc){
        case 9: //tab key
          this.handleBlur();
          return true;
        case 37: //left arrow
        case 38: //up arrow
          current = $('a.current', this.el).length ? $('a.current', this.el).prev() : $('a', this.el).last();
          $('a.current', this.el).removeClass('current');
          current.addClass('current');
          if (current.length) {
            $('.options-container', this.el).stop().scrollTo(current, 400);
          }
          break;
        case 39: //right arrow
        case 40: //down arrow
          current = $('a.current', this.el).length ? $('a.current', this.el).next() : $('a', this.el).first();
          $('a.current', this.el).removeClass('current');
          current.addClass('current');
          if (current.length) {
            $('.options-container', this.el).stop().scrollTo(current, 400);
          }
          break;
        case 13: //enter
          this.clickOption($('a.current', this.el));
          $('a', this.el).removeClass('current');
          break;
        default:
          return true;
      }
    },
    showOptions: function() {
      $('.custom-select-options', this.el).show();
    },
    hideOptions: function() {
      $('.custom-select-options', this.el).hide();
    },
    cursorTimeout: [],
    highlightOption: function(event) {
      var $el = $(event.target);
      this.$el.find('a').removeClass('current');
      $el.addClass('current');
    },
    deselectAll: function() {
      $('.custom-select-options a', this.el).removeClass('current');
    },
    changeOption: function($target) {
      this.trigger('option-added', $target.attr('data-value'));
      
      if (!this.options.multiSelect) {
        $('.custom-select-content', this.el).text($target.text());
        this.trigger('changed', $target.attr('data-value'));
      }
    },
    unbindWindowEvents: function(){
      $(window).unbind('mousedown', this.boundClickHandler);
      $(window).unbind('keydown', this.boundKeypressHandler);
    },
    destroy: function() {
      this.unbindWindowEvents();
      this.unbind();
      this.remove();
    },
    reset: function() {
      this.unbindWindowEvents();
      this.render();
    },
    empty: function(){
      this.unbindWindowEvents();
      this.$el.empty();
      this.undelegateEvents();
      this.$el.removeData().unbind();    
    }
  });
});