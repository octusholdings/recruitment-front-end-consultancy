var Backbone = require('backbone'),
    Team     = require('./Team');

/* Use to provide suggestion - hierarchy bound */
module.exports = TeamListForm = Backbone.Collection.extend({
    model: Team,
    url: function () {
    	if (this.suggest) {
    		return RecruiterApp.config.API_ROOT + '/hierarchy/suggest/organizationalunit/'
    	} else {
    		return RecruiterApp.config.API_ROOT + '/hierarchy/organizationalunit?value=' + this.query
    	}
    }
});