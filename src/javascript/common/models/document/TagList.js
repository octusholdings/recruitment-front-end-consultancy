/*
 * TagList
 */
var Backbone = require('backbone'),
    Tag = require('./Tag');

module.exports = TagList = Backbone.Collection.extend({
    model: Tag,
    comparator: function (tag) {
        return tag.get('key');
    }

});