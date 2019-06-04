var Backbone = require('backbone');

module.exports = UserPreference = Backbone.Model.extend({
    idAttribute: 'key',
    url() {
	    return RecruiterApp.config.ADMIN_API_ROOT + '/user/preference/' + this.attributes.key;
    }
}, 
// STATIC METHODS
{
    /**
     * Add/update an user preference.
     */
    setUserPreference(key, item) {
        new UserPreference({
            key: key,
            item: item
        }).save(null, {
            success: () => {
                localStorage.setItem(key, item);
            }, 
            error: (model, r) => {
                console.error('User preference not saved');
            }
        });
    }
});
