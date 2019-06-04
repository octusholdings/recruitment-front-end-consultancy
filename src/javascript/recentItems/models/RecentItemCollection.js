var Backbone = require('backbone'),
    RecentItem = require('./RecentItem');

module.exports = RecentItemCollection = Backbone.Collection.extend({
	model: RecentItem,
	url() {
		if (!this.type) {
			console.error('Fetch method can not be executed. Type is not defined');
		}	
		let url = RecruiterApp.config.API_ROOT + '/recentitem/' + this.type;
		if (this.actions) {
			url += '?';
			this.actions.forEach((action) => {
				url += '&action=' + action;
			});
		}
		return url;
	},
	initialize(models, options) {
		this.type = options.type;
		this.actions = options.actions;
	}	
});