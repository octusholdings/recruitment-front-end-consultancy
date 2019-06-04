/*
 * ClientListView View
 */
var Marionette = require('backbone.marionette'),
    stickit = require('backbone.stickit');
module.exports = ClientListViewItem = Marionette.ItemView.extend({
    template: require('../templates/clientListItem.hbs'),
    tagName: 'tr',
    events: {
        'click .delete-client': 'deleteClient'
    },
    bindings: {
        '#name': {
            observe: ['firstName', 'lastName'],
            onGet: function (values) {
                return values[0] + " " + values[1];
            }
        },
        '.email': 'primaryEmail',
        //'.phone': {
          //  observe: 'telephoneList'
        //},
        '.jobTitle': 'jobTitle',
        '.company': 'currentCompany'
        //'select.actions' : {
        //
        //    selectOptions: {
        //        collection: 'window.Octus.massMailList',
        //        labelPath: 'name',
        //        valuePath: 'name'
        //    }
        //
        //}

    },
    convertToTypeList: function (val, options) {
        if (val != null) {
            return val.join("");
        } else {
            return "null";
        }

    }, onRender: function () {
        this.stickit()
    },
    deleteClient: function() {
        RecruiterApp.core.vent.trigger('clientList:delete', this.model);
    }


});

module.exports = ClientListView = Marionette.CompositeView.extend({
    template: require('../templates/clientList.hbs'),
    itemView: ClientListViewItem,
    className: 'tr',

    initialize: function () {
        var self = this;
        RecruiterApp.core.vent.on('candidateList:refresh', function () {
            self.render();
        })
    },
    appendHtml: function (collectionView, itemView) {
        collectionView.$("tbody").append(itemView.el);
    }

});