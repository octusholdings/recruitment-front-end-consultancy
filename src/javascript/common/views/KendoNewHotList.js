var Marionette = require('backbone.marionette'),
    stickit = require('backbone.stickit'),
    _ = require('underscore');

module.exports = KendoNewHotList = Marionette.CompositeView.extend({
    template: require('../templates/kendoNewHotList.hbs'),
    events: {
    	"click .create-filter" : "createFilter",
        "keyup .hotlist-name" : "checkHotListName"
    },
    bindings: {
    	'.hotlist-name' : 'hotlistName'
    },
    onRender: function () {
    	this.stickit();	
    },
    createFilter: function () {
    	this.trigger('onCreateHotList', this.model.get('hotlistName'))
    },
    checkHotListName: function () {
        var self = this;        
        if (self.$el.find('.hotlist-name').val() != '') {
            self.$el.find('.create-filter').prop('disabled', false);
        }
    }
});