var Backbone = require('backbone'),
    User = require('./User');
module.exports = UserList = Backbone.Collection.extend({
    model: User,
    url: function() {
        return RecruiterApp.config.ADMIN_API_ROOT +  '/user/list';
    },
    firstRun: true,
	filterByName: function(name) {

    	if (this.firstRun) {
    		this.users = this.models;
    		this.firstRun = false;
    	}

    	if (!name) {
    		return this.users; 
    	}

		return this.users.filter(function (model) {
            var firstName   = model.get('firstName') || '';
            var lastName    = model.get('lastName') || '';
            var userName    = model.get('username') || '';

            return (firstName.toLowerCase().indexOf(name.toLowerCase()) >= 0 || lastName.toLowerCase().indexOf(name.toLowerCase()) >= 0 || userName.toLowerCase().indexOf(name.toLowerCase()) >= 0);
		});

    },
    filterByEnable(accountEnabled) {
        return this.models.filter((model) => {
            return model.get('status') === accountEnabled;
        });
    }    
});