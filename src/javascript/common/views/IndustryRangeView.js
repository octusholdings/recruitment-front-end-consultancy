var RangeView       = require('./RangeView'),
    RangeItemView   = require('./RangeItemView');

module.exports = IndustryRangeSubItemView = RangeItemView.extend({
    template: require('../templates/industryRangeItemView.hbs'),
    list: 'industryList',
    select: '.select-industry',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/filterChoice/list/' + this.model.get('domain') + '/industryList.value/10/adding/reference/data/industry?criteria=' + params;
    }
 });

module.exports = IndustryRangeItemView = RangeItemView.extend({
    template: require('../templates/industryRangeItemView.hbs'),
    itemView: IndustryRangeSubItemView,
    list: 'industryList',
    select: '.select-industry',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/filterChoice/list/' + this.options.parentView.options.domain + '/industryList.value/10/adding/reference/data/industry?criteria=' + params;
    }
 });

module.exports = IndustryRangeView = RangeView.extend({
    template: require('../templates/industryRange.hbs'),
    itemView: IndustryRangeItemView,
    list: 'industryList',
    confirmEvent: 'industryQueryConfirmed'
});