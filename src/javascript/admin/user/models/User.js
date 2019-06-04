var
    ValidatedModel = require('../../../common/models/ValidatedModel'),
    RoleList = require('../../permission/models/RoleList');
module.exports = User = ValidatedModel.extend({
    initialize: function() {
        this.setupValidation();
        this.roleList = [];
    },
    url: function() {
        if (this.username  != undefined) {
            return RecruiterApp.config.ADMIN_API_ROOT + '/user/' + this.username;
        } else {
            return RecruiterApp.config.ADMIN_API_ROOT + '/user';
        }
    },
    parse: function(response) {
        response.roleList = new RoleList(response.roleList, {parse: true, remove: true});
        return response;
    },
    comparator : function(user) {
        return user.get('username');
    },
    validation: {
        firstName: {
            required: true
        },
        lastName: {
            required: true
        },
        email: {
            required: true
        },
        username: {
            required: true
        },
        language: {
            required: true
        }
    }
});