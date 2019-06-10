/*
 * UserProfileFormView
 */
var Marionette = require('backbone.marionette'),
    PermissionHelper = require("../../session/models/PermissionHelper"),
    Session = require("../../session/models/Session"),
    stickit = require('backbone.stickit');
module.exports = UserProfileFormView = Marionette.ItemView.extend({
    template: require('../templates/userProfileForm.hbs'),

    events: {
        'click .button-logout': 'logout',
        'click .button-save'  : 'saveForm'
        //'click .button-cancel': 'cancel'
    },
    bindings: {
        '.firstName': 'firstName',
        '.lastName': 'lastName',
        'select#team': {
            selectOptions: {
                collection: 'window.Octus.teamList',
                defaultOption: {
                    label: function () {return RecruiterApp.polyglot.t('chooseOne');},
                    value: null
                },
                labelPath: 'value',
                valuePath: 'id'
            },
            observe: 'team'
        },
        'select#country': {
            selectOptions: {
                collection: 'window.Octus.countryList',
                defaultOption: {
                    label: function () {return RecruiterApp.polyglot.t('chooseOne');},
                    value: null
                },
                labelPath: 'value',
                valuePath: 'id'
            },
            observe: 'country'
        },
        'select#division': {
            selectOptions: {
                collection: 'window.Octus.divisionList',
                defaultOption: {
                    label: function () {return RecruiterApp.polyglot.t('chooseOne');},
                    value: null
                },
                labelPath: 'value',
                valuePath: 'id'
            },
            observe: 'division'
        },
        //'.profilePicture': 'profilePicture',
        '.emailSignature': 'emailSignature',
        '.currentPassword': 'currentPassword',
        '.newPassword': 'newPassword',
        '.repeatPassword': 'repeatPassword'
    },
    onRender: function () {
        this.stickit();
    },
    onShow: function () {
        var session = new Session();
        var permissionHelper = new PermissionHelper(),
            permissionApplied = false;

        if (session.getAuthToken() != undefined && !permissionApplied) {
            console.log('apply permission')
            permissionApplied = true;
            permissionHelper.processRole();
            // permissionHelper.processPermission();
        }  
    },
    logout: function(e) {
        e.preventDefault();
        console.log("Logging out user");
        var session = window.Octus.activeSession;
        session.logout();
    },
    saveForm: function (e) {
        e.preventDefault();
        var self = this;
        var isValid = this.model.isValid(true);
        if (isValid) {
            console.log("UserProfile model is valid");
            self.trigger('userProfile:save', this.model);
        } else {
            console.log("UserProfile model is not valid");
        }
    },
    cancelForm: function (e) {
        e.preventDefault();
        this.destroy();
        RecruiterApp.core.vent.trigger('userProfileForm:cancel');
    }
});
