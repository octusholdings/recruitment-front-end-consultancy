/*
 * CandidateListView View
 */
var Marionette = require('backbone.marionette'),
    stickit = require('backbone.stickit');
module.exports = CandidateListViewItem = Marionette.ItemView.extend({
    template: require('../templates/candidateListItem.hbs'),
    tagName: 'tr',
    events: {
        'click .show-cv': 'showCv',
        'click .delete-candidate': 'deleteCandidate'
    },
    bindings: {
        '.name': {
            observe: ['firstName', 'lastName'],
            onGet: function (values) {
                return values[0] + " " + values[1];
            }
        },
        '.email': 'email',
        '.phone': {
            observe: 'telephoneList'
        },
        '.title': 'title',
        '.type': 'type',
        '.skillList': {
            observe: 'skillList'
        }
    },
    onRender: function () {
        this.stickit()
    },
    showCv: function() {
        RecruiterApp.core.vent.trigger('candidateList:show:cv', this.model.id);
    },
    deleteCandidate: function() {
        RecruiterApp.core.vent.trigger('candidateList:delete', this.model);
    }

});

module.exports = CandidateListView = Marionette.CompositeView.extend({
    template: require('../templates/candidateList.hbs'),
    itemView: CandidateListViewItem,
    itemViewContainer: '#candidateList',
    initialize: function () {
        var self = this;
        RecruiterApp.core.vent.on('candidateList:refresh', function () {
            self.render();
        })
    }
});