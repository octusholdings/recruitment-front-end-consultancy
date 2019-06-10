/*
 * UserProfileHeader
 */
var Marionette = require('backbone.marionette'),
    stickit = require('backbone.stickit');
module.exports = UserNavView = Marionette.ItemView.extend({
    template: require('../templates/userNavView.hbs'),
    className: 'nav nav-tabs',
    tagName: 'ul',
    events: {
        'click #nav-profile': 'showProfile',
        'click #nav-email': 'showEmail',
        'click #nav-settings': 'showSettings',
        'click #nav-locale': 'showLocale',
        'click #nav-password-change': 'showPasswordChange'
    },
    behaviors: {
        CheckPermissions: { view: "userNavView" }
    },
    showProfile: function () {
        RecruiterApp.core.vent.trigger('userProfile:nav:change', 'profile');
    },
    showEmail: function () {
        RecruiterApp.core.vent.trigger('userProfile:nav:change', 'email');
    },
    showSettings: function () {
        RecruiterApp.core.vent.trigger('userProfile:nav:change', 'settings');
    },
    showLocale: function () {
        RecruiterApp.core.vent.trigger('userProfile:nav:change', 'locale');
    },
    showPasswordChange: function () {
        RecruiterApp.core.vent.trigger('userProfile:nav:change', 'password');
    }
});