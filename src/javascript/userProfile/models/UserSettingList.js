/*
 * UserSettingList
 */
var Backbone = require('backbone'),
    UserSetting = require('./UserSetting');

module.exports = UserSettingList = Backbone.Collection.extend({
    model: UserSetting,
    url: function () {
        return RecruiterApp.config.API_ROOT + '/user/setting';
    },
    comparator: function (userSettingList) {
        return userSettingList.get('id');
    }
});

