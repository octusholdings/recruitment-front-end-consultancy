/**
 * NoItemsFoundView
 * @type {exports}
 */
var Backbone = require('backbone'),
    Marionette = require('backbone.marionette');

module.exports = DemoAccountActivityView = Marionette.ItemView.extend({
    template: require('../templates/demoAccountActivity.hbs')

});