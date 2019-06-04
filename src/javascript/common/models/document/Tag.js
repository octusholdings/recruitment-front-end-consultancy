/*
 * Tag
 */
var Backbone = require('backbone')
module.exports = Tag = Backbone.Model.extend({


    comparator: function (tag) {
        return tag.get('key');
    }

});