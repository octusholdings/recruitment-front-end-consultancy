var Marionette = require('backbone.marionette'),
    stickit = require('backbone.stickit'),
    Typeahead = require('corejs-typeahead'),
    Bloodhound = require('bloodhound'),
    Session = require('../../session/models/Session'),
    _ = require('underscore'),
    BaseCompositeView = require('../../common/views/BaseCompositeView');

var currItemSent;

module.exports = JobToCandidateView = Marionette.CompositeView.extend({
    template: require('../templates/searchJob.hbs'),
    enableAdd: function () {
        var self = this;
        self.$el.find('#add-item').removeProp('disabled')
    },
    initialize:function(item){
        console.log(item);
        this.item = item;
    },
    events: {
        "click #add-item" : "addNewItem"
    },
    onShow: function() {
        var self       = this;
        var session    = new Session();
        var queryInput = self.$el.find(".item-name");
        currItemSent   = 0;

        var queryController = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            limit: 20,
            remote: {
                url: function() { 
                    return RecruiterApp.config.API_ROOT + '/jobPosting/list/0/20?criteria=%QUERY'
                } (),
                wildcard: '%QUERY',
                ajax: {
                    beforeSend: function (jqXhr, settings) {
                        settings.data = $.param({criteria: queryInput.val()});
                        jqXhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
                    }
                },
                filter: function (searchResponse) {
                    return $.map(searchResponse, function (searchResult) {
                        return { 
                            title: searchResult.title, 
                            company: searchResult.company, 
                            id: searchResult.id,
                            referenceId: searchResult.referenceId
                        }
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
                var referenceId = "";
                if (item.referenceId) {
                    referenceId = "[" + item.referenceId + "] ";
                }

                return referenceId + item.title+' at '+item.company;
            },
            limit: 20,
            source: queryController.ttAdapter(),
            templates: {
                empty: [
                    `<div class="marginLeft10">${RecruiterApp.polyglot.t('noMatchesFound')}</div>`].join('\n')
            }
        }).on('typeahead:selected', function (obj, model) {
            self.enableAdd();
            self.jobID = model.id;
            self.jobName = model.title;
        }).on('typeahead:asyncrequest', function() {
            $(this).parents('.tt-wrapper').find('.tt-spinner').show();
        }).on('typeahead:asynccancel typeahead:asyncreceive', function() {
            $(this).parents('.tt-wrapper').find('.tt-spinner').hide();
        });

        $('.modal .tt-input').focus();

        jQuery('.tt-input').on('input propertychange paste', function() {
            //console.log('change');
            $('.personEmail').html('');
        });
    },
    addNewItem: function () {
        var self = this;

        if (currItemSent < this.item.length) {
            var url = RecruiterApp.config.API_ROOT + "/hotList/" + self.jobID + "/short/" + this.item[currItemSent].id;
            console.log(url);

            $.ajax({
                type: "POST",
                url: url,
                contentType: "application/json",
                dataType: "text",
                success: function (text) {
                    RecruiterApp.core.vent.trigger('app:message:info', "<h4><i class='fa fa-briefcase' aria-hidden='true'></i> " + self.jobName + "</h4>Job added to candidate");
                    currItemSent++;

                    if (self.scope) {
                        RecruiterApp.core.vent.trigger('ga:send', { 
                            hitType: 'event', 
                            eventCategory: self.scope,
                            eventAction: 'AddJobToCandidates',
                            eventLabel: 'Success'
                        });
                    }

                    self.addNewItem();

                },
                error: function (xhr) {
                    console.log(xhr.responseText);

                    if (self.scope) {
                        RecruiterApp.core.vent.trigger('ga:send', { 
                            hitType: 'event', 
                            eventCategory: self.scope,
                            eventAction: 'AddJobToCandidates',
                            eventLabel: 'Fail'
                        });
                    }
                }
            });
        } else {
            RecruiterApp.core.vent.trigger('app:modal:close');
        }
    }
});