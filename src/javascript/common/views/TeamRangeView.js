var RangeView       = require('./RangeView'),
    RangeItemView   = require('./RangeItemView');

module.exports = TeamRangeSubItemView = RangeItemView.extend({
    template: require('../templates/teamRangeItemView.hbs'),
    list: 'organizationUnitList',
    select: '.select-team',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/hierarchy/organizationalunit?value=' + params;
    }
});

module.exports = TeamRangeItemView = RangeItemView.extend({
    template: require('../templates/teamRangeItemView.hbs'),
    itemView: TeamRangeSubItemView,
    list: 'organizationUnitList',
    select: '.select-team',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/hierarchy/organizationalunit?value=' + params;
    }
});

module.exports = TeamRangeView = RangeView.extend({
    template: require('../templates/teamRange.hbs'),
    itemView: TeamRangeItemView,
    list: 'organizationUnitList',
    confirmEvent: 'teamQueryConfirmed'
});