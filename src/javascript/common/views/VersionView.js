var Backbone        = require('backbone'),
    moment          = require('moment'),
    Marionette      = require('backbone.marionette');

module.exports = VersionView = Marionette.ItemView.extend({
    template: require('../templates/version.hbs'),
    initialize : function (options){
        this.modules = options.modules;
    },
    events:{
        'click #refresh':'refresh'
    },
    onShow: function(name){
        $('.modules').html('');
        for (var property in this.modules) {
            if (this.modules.hasOwnProperty(property)) {
                $('.modules').append('<li class="list-group-item">' + RecruiterApp.polyglot.t(property) + '<span class="badge">' + this.modules[property] + '</span></li>');
            }
        }
    },
    refresh:function(){
        clearCache = confirm(RecruiterApp.polyglot.t('confirmClearAllCacheAndRefresh'));

        if (clearCache) {
            // localStorage.removeItem('cacheConfig')
            
            // localStorage.removeItem('candidateGridOpt')
            // localStorage.removeItem('candidateGridSaved')
            // localStorage.removeItem('candidateCurrentPage')
            // localStorage.removeItem('candidateFilter')
            // localStorage.removeItem('candidateMenu')
            // localStorage.removeItem('candidateSearchCriteria')
            // localStorage.removeItem('candidateCurrentSavedSearch')
            // localStorage.removeItem('candidateLayoutGridStack')

            // localStorage.removeItem('companyGridOpt')
            // localStorage.removeItem('companyGridSaved')
            // localStorage.removeItem('companyCurrentPage')
            // localStorage.removeItem('companyFilter')
            // localStorage.removeItem('companyMenu')
            // localStorage.removeItem('companySearchCriteria')
            // localStorage.removeItem('companyCurrentSavedSearch')
            // localStorage.removeItem('companyLayoutGridStack')

            // localStorage.removeItem('clientGridOpt')
            // localStorage.removeItem('clientGridSaved')
            // localStorage.removeItem('clientCurrentPage')
            // localStorage.removeItem('clientFilter')
            // localStorage.removeItem('clientMenu')
            // localStorage.removeItem('clientSearchCriteria')
            // localStorage.removeItem('clientCurrentSavedSearch')
            // localStorage.removeItem('clientLayoutGridStack')

            // localStorage.removeItem('jobGridOpt')
            // localStorage.removeItem('jobGridSaved')
            // localStorage.removeItem('jobCurrentPage')
            // localStorage.removeItem('jobFilter')
            // localStorage.removeItem('jobMenu')
            // localStorage.removeItem('jobSearchCriteria')  
            // localStorage.removeItem('jobCurrentSavedSearch')  
            // localStorage.removeItem('jobDetailDashboardGridStack')

            // localStorage.removeItem('activityGridOpt')
            // localStorage.removeItem('activityGridSaved')
            // localStorage.removeItem('activityCurrentPage')
            // localStorage.removeItem('activityFilter')
            // localStorage.removeItem('activityMenu')
            // localStorage.removeItem('activitySearchCriteria')

            // localStorage.removeItem('candidate/shortListGridOpt')
            // localStorage.removeItem('candidate/shortListGridSaved')
            // localStorage.removeItem('candidate/shortListCurrentPage')
            // localStorage.removeItem('candidate/shortListFilter')
            // localStorage.removeItem('candidate/shortListMenu')
            // localStorage.removeItem('candidate/shortListSearchCriteria')

            localStorage.clear();
            window.location.reload(true);
        }
    }
});