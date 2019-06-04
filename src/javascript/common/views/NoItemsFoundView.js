/**
 * NoItemsFoundView
 * @type {exports}
 */
var Backbone = require('backbone'),
    Marionette = require('backbone.marionette');

module.exports = FooterView = Marionette.ItemView.extend({
    template: require('../templates/noItemsFoundView.hbs'),
});