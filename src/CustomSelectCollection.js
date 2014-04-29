define([
  'backbone',
  '../models/CustomSelectModel'
], function(
  Backbone,
  CustomSelectModel
) {
  'use strict';

  return Backbone.Collection.extend({
    model: CustomSelectModel
  });
});