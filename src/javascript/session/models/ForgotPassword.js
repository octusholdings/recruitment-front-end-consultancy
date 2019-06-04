var Backbone = require('backbone');

module.exports = Skill = Backbone.Model.extend({
    url() {
            return `${RecruiterApp.config.API_ROOT}/login/forgotpassword`;
    }
});
