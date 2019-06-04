var Backbone = require('backbone');
module.exports = Acl = Backbone.Model.extend({

    url: function() {
        return RecruiterApp.config.ADMIN_API_ROOT + '/acl/' + this.username;
    }
});