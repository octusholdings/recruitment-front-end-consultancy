/*
 * PageControl View
 */
var Marionette = require('backbone.marionette'),
    numeral = require('numeral'),
    stickit = require('backbone.stickit');
module.exports = PageControlView = Marionette.ItemView.extend({
    template: require('./pageControl.hbs'),

    initialize: function(options) {
        this.selectPageEvent = options.selectPageEvent;
    },
    events: {
        'click .previousPage' : 'previousPage',
        'click .nextPage'     : 'nextPage',
        'click .selectPage'   : 'selectPage'
    },
    bindings: {
        '.page' : 'page',
        '.pageSize'    : 'pageSize',
        '.pageList': 'pageList',
        '.totalPages'  : {
            observe: 'totalPages',
            onGet: function(value) {
                return this.formatNumber(value);
            }
        },
        '.totalResults': {
            observe: 'totalResults',
            onGet: function(value) {
                return this.formatNumber(value);
            }

        }
    },
    formatNumber: function (val) {
        return numeral(val).format('0,0');
    },
    onRender: function() {
        this.stickit();
    },
    previousPage: function(e) {
        e.preventDefault();
        if (this.model.get("page") > 1) {
            var newPage = this.model.get("page") - 1;
            RecruiterApp.core.vent.trigger(this.selectPageEvent, newPage) ;
        }
    },
    nextPage: function(e) {
        e.preventDefault();
        if (this.model.get("page") < this.model.get("totalPages")){
            var newPage = this.model.get("page") + 1;
            RecruiterApp.core.vent.trigger(this.selectPageEvent, newPage);
        }
    },
    selectPage: function(e) {
        e.preventDefault();
        var page = e.currentTarget.text;
        RecruiterApp.core.vent.trigger(this.selectPageEvent, page);
    }

});