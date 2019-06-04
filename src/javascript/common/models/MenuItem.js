var Backbone = require('backbone');

module.exports = Task = Backbone.Model.extend({
    idAttribute: '_id',
    urlRoot: 'api/task',
    comparator : function(currentUser) {
        return currentUser.get('username');
    }
});



