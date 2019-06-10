/*
 * UserSettingList
 */
const Backbone = require('backbone');

module.exports = UserGenericSetting = Backbone.Model.extend({
    url() {
        return RecruiterApp.config.API_ROOT + '/user/setting';
    },
});

