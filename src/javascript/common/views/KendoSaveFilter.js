var Marionette = require('backbone.marionette'),
    stickit = require('backbone.stickit'),
    _ = require('underscore'),
    BaseCompositeView = require('../../common/views/BaseCompositeView');

module.exports = KendoSaveFilter = Marionette.CompositeView.extend({
    template: require('../templates/kendoSaveFilter.hbs'),
    events: {
    	"click .save-filter" : "saveFilter",
        "keyup .filter-name" : "checkFilterName"
    },
    bindings: {
    	'.filter-name' : 'filterName'
    },
    onRender: function () {
    	this.stickit();	
    },
    saveFilter: function () {
    	this.trigger('onSaveFilter', this.model.get('filterName'))
    },
    checkFilterName: function () {
        var self = this;        
        if (self.$el.find('.filter-name').val() != '') {
            self.$el.find('.save-filter').prop('disabled', false);
        }
    }
});