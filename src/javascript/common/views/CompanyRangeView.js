var RangeView               = require('./RangeView'),
    RangeItemView           = require('./RangeItemView');

module.exports = CompanyRangeSubItemView = RangeItemView.extend({
    template: require('../templates/companyRangeItemView.hbs'),
    list: 'companyList',
    select: '.select-company',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/filterChoice/list/' + this.model.get('domain') + '/subsidiaryList.value/10/adding/reference/data/company?criteria=' + params;
    }
});

module.exports = CompanyRangeItemView = RangeItemView.extend({
    template: require('../templates/companyRangeItemView.hbs'),
    itemView: CompanyRangeSubItemView,
    list: 'companyList',
    select: '.select-company',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/filterChoice/list/' + this.options.parentView.options.domain + '/subsidiaryList.value/10/adding/reference/data/company?criteria=' + params;
    }
});

module.exports = CompanyRangeView = RangeView.extend({
    template: require('../templates/companyRange.hbs'),
    itemView: CompanyRangeItemView,
    list: 'companyList',
    confirmEvent: 'companyRangeQueryConfirmed'
});