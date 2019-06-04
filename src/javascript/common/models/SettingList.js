var Backbone = require('backbone'),
    Setting = require('./Setting');
module.exports = SettingList = Backbone.Collection.extend({
    model: Setting
});