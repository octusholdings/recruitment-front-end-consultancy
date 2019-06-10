/*
 * UserProfile
 */
var Backbone = require('backbone');

module.exports = UserProfile = Backbone.Model.extend({
    url: function () {
        return RecruiterApp.config.API_ROOT + '/user/profile/';
    },
    validation: {
        firstName: {
            required: true
        },
        lastName: {
            required: true
        }
        //,
        //currentPassword: {
        //    required: true
        //},
        //newPassword: {
        //    required: true
        //},
        //repeatPassword: {
        //    required: true
        //}
    }
});



