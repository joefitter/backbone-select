define([
  'backbone'
], function(
  Backbone
) {
  'use strict';

  return Backbone.Model.extend({
    getAttr: function() {
      var self = this;
      return function(attr) {
        return self.get(attr);
      };
    }
  });
});