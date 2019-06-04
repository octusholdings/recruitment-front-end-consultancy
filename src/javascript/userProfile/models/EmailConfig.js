/*
 * EmailConfig
 */
var Backbone = require('backbone');

module.exports = EmailConfig = Backbone.Model.extend({
    url: function () {
        return RecruiterApp.config.API_ROOT + '/email/config';
    }
});