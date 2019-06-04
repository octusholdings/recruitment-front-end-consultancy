/*
 * UserEmail
 */
var Backbone = require('backbone');

module.exports = UserEmail = Backbone.Model.extend({
    url: function () {
        return RecruiterApp.config.API_ROOT + '/user/email';
    },
    validation: {
        address: {
            required: true
        }
    }
});