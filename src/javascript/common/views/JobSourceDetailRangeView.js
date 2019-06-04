var RangeView       = require('./RangeView'),
    RangeItemView   = require('./RangeItemView');

module.exports = JobSourceDetailRangeSubItemView = RangeItemView.extend({
    template: require('../templates/jobSourceDetailRangeItemView.hbs'),
    list: 'jobSourceDetails.value',
    select: '.select-job-source-detail',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/filterChoice/list/' + this.options.parentView.options.domain + '/jobSourceDetails.value/10/adding/reference/data/jobSourceDetails.value?criteria=' + params;
    }
});

module.exports = JobSourceDetailRangeItemView = RangeItemView.extend({
    template: require('../templates/jobSourceDetailRangeItemView.hbs'),
    itemView: JobSourceDetailRangeSubItemView,
    list: 'jobSourceDetails.value',
    select: '.select-job-source-detail',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/filterChoice/list/' + this.options.parentView.options.domain + '/jobSourceDetails.value/10/adding/reference/data/jobSourceDetails.value?criteria=' + params;
    }
});

module.exports = JobSourceDetailRangeView = RangeView.extend({
    template: require('../templates/jobSourceDetailRange.hbs'),
    itemView: JobSourceDetailRangeItemView,
    list: 'jobSourceDetails.value',
    confirmEvent: 'jobSourceDetailsConfirmed'
});