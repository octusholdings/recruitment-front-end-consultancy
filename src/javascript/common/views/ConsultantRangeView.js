var RangeView       = require('./RangeView'),
    RangeItemView   = require('./RangeItemView');

module.exports = ConsultantRangeSubItemView = RangeItemView.extend({
    template: require('../templates/consultantRangeItemView.hbs'),
    list: 'consultantList',
    select: '.select-consultant',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/consultant/getByUsername?username=' + params + '&limit=10';
    }
});

module.exports = ConsultantRangeItemView = RangeItemView.extend({
    template: require('../templates/consultantRangeItemView.hbs'),
    itemView: ConsultantRangeSubItemView,
    list: 'consultantList',
    select: '.select-consultant',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/consultant/getByUsername?username=' + params + '&limit=10';
    }
});

module.exports = ConsultantRangeView = RangeView.extend({
    template: require('../templates/consultantRange.hbs'),
    itemView: ConsultantRangeItemView,
    list: 'consultantList',
    confirmEvent: 'consultantConfirmed'
});