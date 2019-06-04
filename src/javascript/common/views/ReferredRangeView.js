var RangeView       = require('./RangeView'),
    RangeItemView   = require('./RangeItemView');

module.exports = ReferredRangeSubItemView = RangeItemView.extend({
    template: require('../templates/referredRangeItemView.hbs'),
    list: 'referredBy',
    select: '.select-referred',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/reference?limit=10&types=CONSULTANT,CANDIDATE,CLIENT&value=' + params;
    }
});

module.exports = ReferredRangeItemView = RangeItemView.extend({
    template: require('../templates/referredRangeItemView.hbs'),
    itemView: ReferredRangeSubItemView,
    list: 'referredBy',
    select: '.select-referred',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/reference?limit=10&types=CONSULTANT,CANDIDATE,CLIENT&value=' + params;
    }
});

module.exports = ReferredRangeView = RangeView.extend({
    template: require('../templates/referredRange.hbs'),
    itemView: ReferredRangeItemView,
    list: 'referredBy',
    confirmEvent: 'referredQueryConfirmed'
});
