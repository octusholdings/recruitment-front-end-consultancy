var Backbone = require('backbone'),
    SettingList = require('./SettingList');

module.exports = CurrentUser = Backbone.Model.extend({

    url: function() {
        return RecruiterApp.config.API_ROOT + '/session/current';
    },
    comparator: function(currentUser) {
        return currentUser.get('username');
    },
    parse: function(response) {
        response.settings = new SettingList(response.settings, {parse: true, remove: true});
        return response;
    }

});