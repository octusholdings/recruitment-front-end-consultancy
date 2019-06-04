var Marionette = require('backbone.marionette');
module.exports = PeopleNavView = Marionette.ItemView.extend({
    template: require('../templates/navView.hbs'),
    className: 'nav nav-tabs',
    tagName: 'ul',
    events: {
        'click #nav-clients': 'clientsNav',
        'click #nav-mailboxCandidates': 'mailboxCandidatesNav',
        'click #nav-candidates': 'candidatesNav'
    },
    behaviors: {
        CheckPermissions: { view: "peopleNavView" }
    },
    clientsNav : function(e) {
        window.location.hash = "/people/clients";
    },
    mailboxCandidatesNav : function(e) {
        window.location.hash = "/people/mailboxCandidates";
    },
    candidatesNav : function(e) {
        window.location.hash = "/people/candidates";
    }
});