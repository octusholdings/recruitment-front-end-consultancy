/*
 * PanelView View
 */
var Marionette = require('backbone.marionette');
module.exports = Marionette.ItemView.extend({
    initialize: function (options) {
        console.log("Setting template " + options.template);
        this.template = options.template;
    }

});