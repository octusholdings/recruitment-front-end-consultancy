/*
 * PasswordReset
 */
var Backbone = require('backbone'),
    ValidatedModel = require('../../common/models/ValidatedModel');

module.exports = PasswordReset = ValidatedModel.extend({
    initialize: function() {
        this.setupValidation();
    },
    url: function () {
        return RecruiterApp.config.API_ROOT + '/user/profile/updatePassword';
    },
    parse: function (response) {
        return response;
    },
    validation: {
        currentPassword: {
            required: true
        },
        newPassword: {
            required: true
        }
        //confirmNewPassword: {
        //    required: true,
        //    equalTo: "newPassword"
        //}
    }
});



