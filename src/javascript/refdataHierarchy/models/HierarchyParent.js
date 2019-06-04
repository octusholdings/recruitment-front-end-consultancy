var Backbone        = require('backbone');

module.exports = HierarchyParent = Backbone.Model.extend({
    url: function () {
        return RecruiterApp.config.API_ROOT + '/refData/' + this.refDataId + '/parents'
    }
});