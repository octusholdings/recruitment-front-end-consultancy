var Marionette = require('backbone.marionette'),
    stickit = require('backbone.stickit'),
    Typeahead = require('corejs-typeahead'),
    Share = require('../models/Share.js'),
    Bloodhound = require('bloodhound'),
    Session = require('../../session/models/Session'),
    _ = require('underscore'),
    BaseCompositeView = require('../../common/views/BaseCompositeView');

module.exports = KendoShareFilter = Marionette.CompositeView.extend({
    template: require('../templates/kendoShareFilter.hbs'),
    events: {
    	"click .share-filter" : "shareFilter",
        "keyup .consultant-name" : "checkConsultantName"
    },
    bindings: {
    	'.consultant-name' : 'consultantName'
    },
    onRender: function () {
    	this.stickit();	
    },
    onShow: function() {
        var self = this;
        var session = new Session();
        var queryInput = self.$el.find(".consultant-name");

        var shareId = self.model.get('shareId')
        var completePerm = new Share()
        completePerm.type = 'usersearch'
        completePerm.typeId = shareId

        $.when(
            completePerm.fetch()
        ).then(function () {
            self.model.set('completePerm', completePerm.toJSON())

            var queryController = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                limit: 10,
                remote: {
                    url: RecruiterApp.config.API_ROOT + '/consultant/?name=%QUERY&limit=10' ,
                    wildcard: '%QUERY',
                    ajax: {
                        beforeSend: function (jqXhr, settings) {
                            settings.data = $.param({criteria: queryInput.val()});
                            jqXhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
                        }
                    },
                    filter: function (searchResponse) {
                        var withNoPerm = _.filter(searchResponse, function(seaRes) {
                            return _.indexOf(_.pluck(self.model.get('completePerm'), 'target'), seaRes.username) == -1
                        })
                        return $.map(withNoPerm, function (searchResult) {
                            return { firstName: searchResult.firstName, lastName: searchResult.lastName, username: searchResult.username }
                        });
                    }
                }
            });            

            // kicks off the loading/processing of `local` and `prefetch`
            queryController.initialize();

            queryInput.typeahead({
                hint: false,
                highlight: true,
                minLength: 1
            },
            {
                name: 'queryController',
                display: function(item){
                    //return '<p><span class="personLabel">'+item.firstName+' '+item.lastName+'</span><span class="typeClass">'+item.type+'</span></p>'
                    return item.firstName+' '+item.lastName;
                },
                limit: 10,
                source: queryController.ttAdapter(),
                templates: {
                    empty: [
                        '<div class="marginLeft10">No Matches Found</div>'].join('\n')
                }
            }).on('typeahead:selected', function (obj, model) {
                self.selectedConsultant = model.username;
            }).on('typeahead:asyncrequest', function() {
                $(this).parents('.tt-wrapper').find('.tt-spinner').show();
            }).on('typeahead:asynccancel typeahead:asyncreceive', function() {
                $(this).parents('.tt-wrapper').find('.tt-spinner').hide();
            });
        });
    },
    shareFilter: function () {
    	this.trigger('onShareFilter', this.selectedConsultant)
    },
    checkConsultantName: function () {
        var self = this;        
        if (self.$el.find('.consultant-name').val() != '') {
            self.$el.find('.share-filter').prop('disabled', false);
        }
    }
});