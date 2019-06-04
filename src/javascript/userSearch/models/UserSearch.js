/**
 * UserSearch
 */
var Backbone = require('backbone'),
    Session = require("../../session/models/Session"),
	_ = require('underscore');

var session = new Session();

module.exports = UserSearch = Backbone.Model.extend({
	url: function () {
		if (!_.isUndefined(this.id)) {
            return RecruiterApp.config.API_ROOT + '/usersearch/' + this.id;
		} else if (!_.isUndefined(this.type)) {
            return RecruiterApp.config.API_ROOT + '/usersearch/?type=' + this.type;
		} else {
			return RecruiterApp.config.API_ROOT + '/usersearch/'
		}
	}
})