var Backbone = require('backbone'),
    Acl = require('./Acl');
module.exports = AclList = Backbone.Collection.extend({
    model: Acl,

    url: function() {
        return RecruiterApp.config.ADMIN_API_ROOT +  '/acl/' + this.username + '/list';
    }

});