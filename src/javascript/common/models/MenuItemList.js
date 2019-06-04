var Backbone = require('backbone'),
    MenuItem = require('./MenuItem');

module.exports = MenuItemList = Backbone.Collection.extend({
    model: MenuItem,
    idAttribute: '_id',
    urlRoot: 'api/task/list'
});