var Backbone = require('backbone');

module.exports = RecentItem = Backbone.Model.extend({
	url() {		
		return RecruiterApp.config.API_ROOT + '/recentitem';
	}
}, {

	TYPE: {
		CANDIDATE: "CANDIDATE", 
		CLIENT: "CLIENT", 
		COMPANY: "COMPANY", 
		JOB: "JOB",
		MAILBOX: "MAILBOX"
	},

	TYPES() {
		return Object.keys(RecentItem.TYPE);
	},

	ACTION: {
		OPEN: "OPEN",
		CREATE: "CREATE",
		UPDATE: "UPDATE",
		SEARCH: "SEARCH"
	}

});