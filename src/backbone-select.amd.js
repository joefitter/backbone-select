/*global _*/

define([
  'jquery',
  'backbone'
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
      
      this.collection = new CustomSelectCollection(this.options.collection);
      if (this.options.placeholder && this.options.addPlaceholderAsOption) {
        this.collection.add({
          value: -1,
          title: this.options.placeholder
        }, {
          at: 0
        });
      }
      if (!this.options.shade) {
        this.options.shade = 'light';
      }
      this.options.emptyText = this.options.emptyText || 'No results available';
      this.options.placeholder = this.options.placeholder || 'Choose one...';
      this.render();
      jQuery.expr[':'].Contains = jQuery.expr.createPseudo(function(arg) {
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
      'focus input': 'handleFocus',
      'keyup input': 'quickSearch',
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
      $(window).bind('mousedown', _.bind(this.clickHandler, this));
      $(window).bind('keydown', _.bind(this.keypressHandler, this));
      this.delegateEvents();
      return this;
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
        tpl += '     <input type="text" class="form-control">';
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
      //Check if element clicked is root element, or one of its children.
      if (this.el === $(e.target).get(0) || this.$el.find($(e.target)).length > 0) {
        if (!$(e.target).parent('.custom-select-options').hasClass('custom-select-options')) {
          this.focusSelect();
        } else {
          if (!this.options.multiSelect) {
            this.hideOptions();
            this.focus = false;
            this.handleOptionClick(e);
          } 
        }
      } else {
        this.handleBlur();
      }
    },
    handleOptionClick: function(e) {
      var $el = $(e.target);
      this.clickOption($el);
      return false;
    },
    clickOption: function($el) {
      if (!this.options.multiSelect) {
        this.changeOption($el);
        this.focus = false;
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
      this.focus = false;
      this.hideOptions();
      this.$el.find('.custom-select').removeClass('focused');
    },
    focusSelect: function() {
      if (!this.focus) {
        this.$el.find('input').focus();
        this.focus = true;
      }
    },
    handleFocus: function() {
      this.$el.find('.custom-select').addClass('focused');
      this.showOptions();
    },
    quickSearch: function(e) {
      var $el = $(e.target),
        val = $el.val(),
        key = e.keyCode,
        current;
      if (key === 13) { //enter
        $el.val('');
        this.clickOption($('a.current', this.el));
        $('a', this.el).removeClass('current');
      } else if (key === 27) { //esc
        this.hideOptions();
        this.focus = false;
      } else if (key === 40) { //down arrow
        e.preventDefault();
        this.showOptions();
        current = $('a.current', this.el).length ? $('a.current', this.el).next() : $('a', this.el).first();
        $('a.current', this.el).removeClass('current');
        current.addClass('current');
        if (current.length) {
          $('.custom-select-options', this.el).stop().scrollTo(current, 400);
        }
      } else if (key === 38) { //up arrow
        e.preventDefault();
        this.showOptions();
        current = $('a.current', this.el).length ? $('a.current', this.el).prev() : $('a', this.el).last();
        $('a.current', this.el).removeClass('current');
        current.addClass('current');
        if (current.length) {
          $('.custom-select-options', this.el).stop().scrollTo(current, 400);
        }
      } else if (val !== '') {
        $('a', this.el).removeClass('current');
        current = $('a:Contains("' + val + '")', this.el).first();
        current.addClass('current');
        if (current.length) {
          $('.custom-select-options', this.el).stop().scrollTo(current, 400);
        }
      } else {
        $('a', this.el).removeClass('current');
        $('.custom-select-options', this.el).stop().scrollTo({
          top: 0,
          left: 0
        }, 400);
      }
    },
    showOptions: function() {
      this.$el.find('.custom-select-options').show();
    },
    hideOptions: function() {
      this.$el.find('.custom-select-options').hide();
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
      this.$el.find('input').focus();
      if (!this.options.multiSelect) {
        $('.custom-select-content', this.el).text($target.text());
        this.trigger('changed', $target.attr('data-value'));
      }
    },
    destroy: function() {
      this.undelegateEvents();
      this.$el.removeData().unbind();
      this.remove();
    },
    reset: function() {
      this.render();
    }
  });
});