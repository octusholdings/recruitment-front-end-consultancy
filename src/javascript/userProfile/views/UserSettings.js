/*
 * UserSettingsView
 */
var Marionette = require('backbone.marionette'),
    stickit = require('backbone.stickit');
module.exports = UserSettingsView = Marionette.ItemView.extend({
    template: require('../templates/settings.hbs'),

    events: {

        'click .button-update-password': 'updatePassword'

    }, bindings: {
        '.firstName': 'firstName', '.lastName': 'lastName', '.currentPassword': 'currentPassword', '.newPassword': 'newPassword', '.repeatPassword': 'repeatPassword'
    },
    onRender: function () {
        this.stickit();
    },
    updatePassword: function (e) {
        //
        console.log("Current = " + this.model.get('currentPassword') + " new = " + this.model.get('newPassword'));
        var self = this;

        var data = "{" +
            "\"currentPassword\" : \"" + self.model.get('currentPassword') + "\"" +
            ", \"newPassword\"   : \"" + self.model.get('newPassword') + "\"}";

        var promise = $.ajax({
            url: config.API_ROOT + "/userProfile/updatePassword", data: data, type: "POST", contentType: "application/json"

        });

        promise.done(function () {
            console.log("change password worked");
            RecruiterApp.core.vent.trigger('app:message:info', 'Password updated successfully');
        });

        promise.fail(function () {
            console.log("Change password failed");
            RecruiterApp.core.vent.trigger('app:message:error', 'Change password failed');
//                $.notify('Change password failed');
        });

    },
    saveForm: function (e) {
        e.preventDefault();
        var isValid = this.model.isValid(true);
        if (isValid) {
            console.log("UserProfile model is valid");
            RecruiterApp.core.vent.trigger('userProfile:save', this.model);
        } else {
            console.log("UserProfile model is not valid");
        }
    },
    cancelForm: function (e) {
        e.preventDefault();
        this.destroy();
        RecruiterApp.core.vent.trigger('settingsView:cancel');
    }
});