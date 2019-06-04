var Backbone = require('backbone');
module.exports = UserProfile = Backbone.Model.extend({
    url: function() {
        return RecruiterApp.config.API_ROOT + '/user/profile';
    },
    comparator : function(currentUser) {
        return currentUser.get('username');
    }
});