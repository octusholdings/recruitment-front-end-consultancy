/** Share Model

   	POST "/{type}/{typeId}/share/{shareTo}" --> Share A to B
   	GET "/{type}/{typeId}/share" --> Get info about A

   	type = userSearch
   	typeId = saved search id
   	shareTo = id to share to
 */

var Backbone = require('backbone'),
    Session = require("../../session/models/Session"),
	_ = require('underscore');

var session = new Session();

module.exports = Share = Backbone.Model.extend({
	url : function () {
		if (_.isUndefined(this.shareTo)) {
			return RecruiterApp.config.API_ROOT + '/' + this.type + '/' + this.typeId + '/share'
		} else {
			return RecruiterApp.config.API_ROOT + '/' + this.type + '/' + this.typeId + '/share/' + this.shareTo
		}
	}
})