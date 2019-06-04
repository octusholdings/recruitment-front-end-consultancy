var Backbone = require('backbone');
module.exports = CalendarData = Backbone.Model.extend({
	initialize: function (options) {
        if (options) {
            this.type = options.type;
        }
    },
	url: function() {
		switch (this.type) {
			case 'week':
				return RecruiterApp.config.API_ROOT + '/report/calendar/thisweek';
				break;
			case 'month':
				return RecruiterApp.config.API_ROOT + '/report/calendar/thismonth';
				break;
			case 'quarter':
				return RecruiterApp.config.API_ROOT + '/report/calendar/thisquarter';
				break;
			case 'year':
				return RecruiterApp.config.API_ROOT + '/report/calendar/thisyear';
				break;
			case 'now':
				return RecruiterApp.config.API_ROOT + '/report/calendar/now';
				break;
		}
	}
});