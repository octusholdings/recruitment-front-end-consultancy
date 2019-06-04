var RangeView       = require('./RangeView'),
    RangeItemView   = require('./RangeItemView');

module.exports = JobFnRangeSubItemView = RangeItemView.extend({
    template: require('../templates/jobFnRangeItemView.hbs'),
    list: 'jobFunctionList',
    select: '.select-jobFunction',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/filterChoice/list/' + this.model.get('domain') + '/jobFunctionList/10/adding/reference/data/jobFunction?criteria=' + params;
    }
});

module.exports = JobFnRangeItemView = RangeItemView.extend({
    template: require('../templates/jobFnRangeItemView.hbs'),
    itemView: JobFnRangeSubItemView,
    list: 'jobFunctionList',
    select: '.select-jobFunction',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/filterChoice/list/' + this.options.parentView.options.domain + '/jobFunctionList/10/adding/reference/data/jobFunction?criteria=' + params;
    }
});

module.exports = JobFnRangeView = RangeView.extend({
    template: require('../templates/jobFnRange.hbs'),
    itemView: JobFnRangeItemView,
    list: 'jobFunctionList',
    confirmEvent: 'jobFnQueryConfirmed'
});