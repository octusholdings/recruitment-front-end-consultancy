/*
 * PanelView View
 */
var Marionette = require('backbone.marionette');
module.exports = Marionette.ItemView.extend({
    template: require('../templates/userProfile.hbs'),
    className: 'media profile',
    events: {
        'click .user-profile-trigger' : 'showUserProfile'
    },
    bindings: {
        '.lastAccess': 'lastAccess'
    },
    onRender: function() {
        this.stickit();
    },
    showUserProfile: function(e) {
        e.preventDefault();
        console.log("Showing user profile");
        RecruiterApp.core.vent.trigger('user:profile:show');
    }

});