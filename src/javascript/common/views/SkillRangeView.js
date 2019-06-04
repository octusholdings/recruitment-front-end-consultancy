var RangeView               = require('./RangeView'),
    RangeItemView           = require('./RangeItemView');

module.exports = SkillRangeSubItemView = RangeItemView.extend({
    template: require('../templates/skillRangeItemView.hbs'),
    list: 'skillList',
    select: '.select-skill',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/filterChoice/list/' + this.model.get('domain') + '/skillList/10/adding/reference/data/skill?criteria=' + params;
    }
});

module.exports = SkillRangeItemView = RangeItemView.extend({
    template: require('../templates/skillRangeItemView.hbs'),
    itemView: SkillRangeSubItemView,
    list: 'skillList',
    select: '.select-skill',
    getReferenceDataUrl: function(params) {
        return RecruiterApp.config.API_ROOT + '/filterChoice/list/' + this.options.parentView.options.domain + '/skillList/10/adding/reference/data/skill?criteria=' + params;
    }
});

module.exports = SkillRangeView = RangeView.extend({
    template: require('../templates/skillRange.hbs'),
    itemView: SkillRangeItemView,
    list: 'skillList',
    confirmEvent: 'skillQueryConfirmed'
});