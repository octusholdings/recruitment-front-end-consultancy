var Backbone      = require('backbone'),
    NoteList      = require('../../../note/models/NoteList'),
    BaseDocument  = require('./BaseDocument');

module.exports = Document = BaseDocument.extend({
    url: function () {
        return RecruiterApp.config.API_ROOT + '/document/' + this.id;
    },
    parse: function (response) {
        return response;
    }
});