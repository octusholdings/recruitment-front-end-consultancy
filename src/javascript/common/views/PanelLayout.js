var Marionette 			= require('backbone.marionette'),
	Backbone            = require('backbone');

module.exports = PanelLayout = Marionette.Layout.extend({
    template: require('../templates/panelLayout.hbs'),
    regions: {
        panelContent: '.panel-content'
    },
   
    onShow() {
    	if (this.options.content) {
	    	this.panelContent.show(this.options.content);
    	}
    }

});