var RangeView       = require('./RangeView'),
    RangeItemView   = require('./RangeItemView');

module.exports = SpecializationRangeSubItemView = RangeItemView.extend({
    template: require('../templates/specializationRangeItemView.hbs'),
    list: 'specializationList',
    select: '.select-specialization',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/filterChoice/list/' + this.model.get('domain') + '/specializationList.value/10/adding/reference/data/specialization?criteria=' + params;
    }
});

module.exports = SpecializationRangeItemView = RangeItemView.extend({
    template: require('../templates/specializationRangeItemView.hbs'),
    itemView: SpecializationRangeSubItemView,
    list: 'specializationList',
    select: '.select-specialization',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/filterChoice/list/' + this.options.parentView.options.domain + '/specializationList.value/10/adding/reference/data/specialization?criteria=' + params;
    }
});

module.exports = SpecializationRangeView = RangeView.extend({
    template: require('../templates/specializationRange.hbs'),
    itemView: SpecializationRangeItemView,
    list: 'specializationList',
    confirmEvent: 'specializationQueryConfirmed'
});