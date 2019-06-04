var
    $ = require('jquery'),
    Backbone = require('backbone'),
    ReferenceDataList = require('./ReferenceDataList');
    module.exports = ReferenceDataCache = Backbone.Model.extend({

         _cache: {},

        url: function() {
                return '/refData/populate';
        },
        initialize: function() {
            var nationalityPromise = this.getList("nationality");
            var languagePromise = this.getList("language");
            var interestPromise = this.getList("interest");
            var sourcePromise = this.getList("candidateSource");
            var consultantPromise = this.getList("consultant");
            var emailTemplateTypePromise = this.getList("emailTemplateType");
            var noteTypePromise = this.getList("noteType");

            var getArray = [
                nationalityPromise,
                languagePromise,
                interestPromise,
                sourcePromise,
                consultantPromise,
                emailTemplateTypePromise,
                noteTypePromise];

            $.when.apply($, getArray).done(function() {
//                console.log("Triggering cache ready")
                RecruiterApp.core.vent.trigger('octus.refDataCache.ready');
            });

        },
        isCacheReady: function() {
            var self = this;
            var deferred = $.Deferred(function(dffd) {
                if (self.cacheReady) {
                    dffd.resolve(self.cacheReady);
                }
                RecruiterApp.core.vent.on('octus.refDataCache.ready', function() {
                    console.log("Setting cache ready");
                    self.cacheReady = true;
                    dffd.resolve(self.cacheReady);
                });
                setTimeout(function() {
                    console.error("TIMEOUT");
                    dffd.resolve( "timeout" );
                }, 5000 );
            }).promise();
            return deferred;
        },
        getList: function ( key ) {

//            console.log("Getting referenceData with key=" + key);
            var self = this,
                save = this._cache;

            return $.Deferred(function (deffered) {
                if ( save[key] ) {
                    deffered.resolve(save[key]);
                } else {
//                     console.log("cache not hit locally");
                    var referenceDataList = new ReferenceDataList({ type: key });
                    referenceDataList.fetch({
                        success: function ( data ) {
//                            console.log("Got data", data);
                            save[key] = referenceDataList;
//                            console.log("Resolving " + key + " promise, data", data);
                            deffered.resolve(referenceDataList);
                        }
                    });
                }
            }).promise();
        }
    });
