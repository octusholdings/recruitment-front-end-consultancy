var Backbone = require('backbone'),
    Session = require("../../session/models/Session"),
	_ = require('underscore');

var session = new Session();

module.exports = UserHotList = Backbone.Model.extend({
	url: function () {
        if (!_.isUndefined(this.permissions)) {
            if (!_.isUndefined(this.type)) {
                return RecruiterApp.config.API_ROOT + '/userhotlist/?permissions=true' + '&type=' + this.type;
            } else if (!_.isUndefined(this.id)) {
                return RecruiterApp.config.API_ROOT + '/userhotlist/' + this.id + '?permissions=true';
            }
        } else if (!_.isUndefined(this.id)) {
            if (!_.isUndefined(this.itemID)) {
                return RecruiterApp.config.API_ROOT + '/userhotlist/' + this.id + '/items/' + this.itemID;    
            } else if (!_.isUndefined(this.getItems) || !_.isUndefined(this.delItems)) {
                return RecruiterApp.config.API_ROOT + '/userhotlist/' + this.id + '/items/';
            } else if (!_.isUndefined(this.share)) {
                if (!_.isUndefined(this.targetID)) {
                    return RecruiterApp.config.API_ROOT + '/userhotlist/' + this.id + '/share/' + this.targetID;
                } else {
                    return RecruiterApp.config.API_ROOT + '/userhotlist/' + this.id + '/share/';
                }
            } else {
                return RecruiterApp.config.API_ROOT + '/userhotlist/' + this.id;
            }
        } else if (!_.isUndefined(this.type)) {
            if (!_.isUndefined(this.itemID)) {
                return RecruiterApp.config.API_ROOT + '/userhotlist/' + this.type + '/items/' + this.itemID;
            } else {
                return RecruiterApp.config.API_ROOT + '/userhotlist/?type=' + this.type;
            }
        } else {
            return RecruiterApp.config.API_ROOT + '/userhotlist/';
        }
	}
})