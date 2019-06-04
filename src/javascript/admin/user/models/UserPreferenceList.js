var Backbone = require('backbone');

module.exports = UserPreferenceList = Backbone.Collection.extend({
    url() {
	    return RecruiterApp.config.ADMIN_API_ROOT + '/user/preference';
    }
});
