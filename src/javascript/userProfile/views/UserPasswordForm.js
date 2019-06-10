/*
 * UserPasswordFormView
 */
var Marionette = require('backbone.marionette'),
    BaseItemView = require('../../common/views/BaseItemView'),
    stickit = require('backbone.stickit');

module.exports = UserPasswordFormView = BaseItemView.extend({
    template: require('../templates/userPasswordForm.hbs'),
    events: {
        'click .button-update-password': 'updatePassword',
        'click .showPassword' : 'showPassword'
    },
    bindings: {
        '.currentPassword':'currentPassword',
        '.newPassword': 'newPassword',
        '.confirmNewPassword': 'confirmNewPassword'
    },
    onRender: function () {
        this.stickit();
    },
    updatePassword: function (e) {
        e.preventDefault();
        var self = this;
        //console.log("Current="+this.model.get('currentPassword')+" new=" + this.model.get('newPassword')+ " confirmNewPassword="+this.model.get('confirmNewPassword'));
        if (this.model.isValid(true)) {
            if(  this.model.get('newPassword') != this.model.get('confirmNewPassword') )
                RecruiterApp.core.vent.trigger('app:message:error', 'New password and Re-enter Password are different');
            else {
                self.trigger('userProfile:password:update', this.model);
            }
        } else {
            console.log("Model is not valid");
        }
    },
    showPassword: function (e) {
        if( $('.showPassword').prop('checked') )
            $('.currentPassword,.newPassword,.confirmNewPassword').prop('type', 'text');
        else
            $('.currentPassword,.newPassword,.confirmNewPassword').prop('type', 'password');
    }
});