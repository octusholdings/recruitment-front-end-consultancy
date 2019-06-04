var RangeView               = require('./RangeView'),
    RangeItemView           = require('./RangeItemView');

module.exports = TypeRangeSubItemView = RangeItemView.extend({
    template: require('../templates/typeRangeItemView.hbs'),
    list: 'companyTypeList',
    select: '.select-type',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/filterChoice/list/' + this.model.get('domain') + '/type.value/10/adding/reference/data/companyType?criteria=' + params;
    }
});

module.exports = TypeRangeItemView = RangeItemView.extend({
    template: require('../templates/typeRangeItemView.hbs'),
    itemView: TypeRangeSubItemView,
    list: 'companyTypeList',
    select: '.select-type',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/filterChoice/list/' + this.options.parentView.options.domain + '/type.value/10/adding/reference/data/companyType?criteria=' + params;
    }
});

module.exports = TypeRangeView = RangeView.extend({
    template: require('../templates/typeRange.hbs'),
    itemView: TypeRangeItemView,
    list: 'companyTypeList',
    confirmEvent: 'typeRangeQueryConfirmed'
});