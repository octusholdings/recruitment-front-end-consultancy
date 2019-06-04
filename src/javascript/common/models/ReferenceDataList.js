var Backbone = require('backbone'),
    _ = require('underscore'),
    ReferenceData = require('./ReferenceData');
module.exports = ReferenceDataList = Backbone.Collection.extend({
    model: ReferenceData,
    initialize: function (options) {
        if (options !== undefined) {
            this.type = options.type;
            this.key = options.key;
        }
    },
    comparator: function (refData) {
        return refData.get('index');
    },
    url: function () {
        if (this.type == 'kpiEventList') {
            return RecruiterApp.config.API_ROOT + '/refData/list/eventReportType';
        } else if (this.type == 'organisationUserAndUnitList'){
            return RecruiterApp.config.API_ROOT + '/hierarchy/all';
        } else if ( this.type == 'shortEventList') {
            return RecruiterApp.config.API_ROOT + '/report/event/custom/refData';
        } else if (this.type !== undefined && this.key !== undefined) {
            return RecruiterApp.config.API_ROOT + '/refData/list/' + this.type + '?key=' + this.key;
        } else if (this.type !== undefined && this.category !== undefined) {
            return RecruiterApp.config.API_ROOT + '/refData/list/' + this.type + '/' + this.category;
        } else if (this.type !== undefined) {
            return RecruiterApp.config.API_ROOT + '/refData/list/' + this.type;
        } else {
            return RecruiterApp.config.API_ROOT + '/refData/list';
        }
    },
    getOptGroupFormat: function () {
        var labels = [];
        var flattenedMap = _.groupBy(this, "category");
        _.each(flattenedMap, function (val, key) {
            labels.push(key);
        });
        flattenedMap.opt_labels = labels;
        console.log("Flattened map", flattenedMap);
        return flattenedMap;
    },
    // Label Priorities:
    // - translation from reference data
    // - value from reference data
    // - polyglot.t translation
    // - key
    parse: function (response) {
        _.each(response,function(val) {
            if (val.key != undefined && val.key!='') {
                // if reference data provides translations
                if (!_.isNull(val.translations)) {
                    var curLang = localStorage.getItem('language');
                    var langObj = _.find(val.translations, {lang: curLang}); 
                    
                    if (!_.isUndefined(langObj) && !_.isEmpty(langObj.translation)) {
                        val.label = langObj.translation;
                    }
                }

                // if label is still undefined
                // reason why its not added as "else if" to the above condition instead is because maybe
                // translation is not null but translation for EN could still null and label will still
                // be not provided
                if (_.isUndefined(val.label)) {
                    // if there is a value, use value
                    if (!_.isUndefined(val.value) && !_.isEmpty(val.value)) { 
                       val.label = val.value;
                    // else if there is a translation in polyglot with key, use polyglot.t(val.key)
                    } else if (RecruiterApp.polyglot.has(val.key)) {
                        val.label = RecruiterApp.polyglot.t(val.key);
                    // else just use key as the label
                    } else {
                        val.label = val.key;
                        RecruiterApp.core.vent.trigger('app:warn', ['RefData','No translation provided for ' + val.key]);
                    }
                }
            }
        });
        return response;
    }
});