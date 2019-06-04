var
    ValidatedModel = require('../../../common/models/ValidatedModel');

module.exports = NylasAccount = ValidatedModel.extend({
    model: NylasAccount,
    url() {
        return RecruiterApp.config.ADMIN_API_ROOT + '/nylas/account/' + this.attributes.username;
    }
});