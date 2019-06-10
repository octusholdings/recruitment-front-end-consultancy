/*
 * EmailConfig
 */
var Backbone = require('backbone');

module.exports = EmailConfigReset = Backbone.Model.extend({
    url: function () {
        return RecruiterApp.config.API_ROOT + '/email/config/reset';
    }
});