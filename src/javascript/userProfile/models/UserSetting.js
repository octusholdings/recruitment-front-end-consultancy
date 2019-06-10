/*
 * UserSetting
 */
var Backbone = require('backbone');
var ValidatedModel = require('../../common/models/ValidatedModel');

module.exports = UserSetting = ValidatedModel.extend({
	idAttribute: 'key',
    url: function () {
        return RecruiterApp.config.API_ROOT + '/user/setting/';
    },
    validation: function() {
    	return {
    		key: {
                "required": true
    		},
    		value: {
                "required": true
    		}
    	}
    }
});



