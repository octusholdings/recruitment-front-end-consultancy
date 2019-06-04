var Backbone = require('backbone');
module.exports = ReferenceData = Backbone.Model.extend({
    url: function() {
        if (typeof(this.id) == 'undefined') {
            return RecruiterApp.config.API_ROOT + '/refData';
        } else {
            return RecruiterApp.config.API_ROOT + '/refData/' + this.id;
        }
    },
    comparator : function(referenceData) {
        return referenceData.get('id');
    },
    validation: {
        type: [{
            required: true,
            msg: 'Type is required'
        }],
        key: {
            required: true,
            msg: 'Key is required'
        },
        value: {
            required: true,
            msg: 'Value is required'
        }
    }
});