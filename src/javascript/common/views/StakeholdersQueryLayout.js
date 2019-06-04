var Backbone               = require('backbone'),
    moment                 = require('moment'),
    Marionette             = require('backbone.marionette'),
    numeral                = require('numeral'),
    Typeahead              = require('corejs-typeahead'),
    Bloodhound             = require('bloodhound'),
    Session                = require('../../session/models/Session'),
    stickit                = require('backbone.stickit');
    StakeholdersItemView   = require('./StakeholdersQueryItemView');

module.exports = StakeholdersQueryLayout = Marionette.Layout.extend({
    template: require('../templates/stakeholdersQueryLayout.hbs'),
    events: {
        'click .confirm-range'      : 'confirmStakeholders'
    },
    // bindings: {
    //     'input.candidate-input'     : 'candidate',
    //     'input.client-input'        : 'client',
    //     'input.company-input'       : 'company',
    //     'input.job-input'           : 'job'
    // },
    
    onRender: function () {
        if (!this.model) this.model = new Backbone.Model();
        this.stickit();
    },
    regions: {
        candidateList: ".candidate-list",
        companyList: ".company-list",
        clientList: ".client-list",
        jobList: ".job-list"
    },
    onShow: function () {
        var self = this;
        var session = new Session();

        var filterData = this.options.filterData;

        var ccdStakeholdersView = new StakeholdersItemView({ model: this.model, displayName: 'candidate', type: 'candidate' });
        var comStakeholdersView = new StakeholdersItemView({ model: this.model, displayName: 'company', type: 'company' });
        var cliStakeholdersView = new StakeholdersItemView({ model: this.model, displayName: 'clientPerson', type: 'client' });
        var jobStakeholdersView = new StakeholdersItemView({ model: this.model, displayName: 'job', type: 'job' });

        this.candidateList.show(ccdStakeholdersView);
        this.companyList.show(comStakeholdersView);
        this.clientList.show(cliStakeholdersView);
        this.jobList.show(jobStakeholdersView);

        if (this.model.get('disabled') == 'candidateList') {
            ccdStakeholdersView.disableThis();
        } else if (this.model.get('disabled') == 'clientList') {
            cliStakeholdersView.disableThis();
        } else if (this.model.get('disabled') == 'companyList') {
            comStakeholdersView.disableThis();
        } else if (this.model.get('disabled') == 'jobList') {
            jobStakeholdersView.disableThis();
        }

        // ccdStakeholdersView.setValue(filterData);
        // comStakeholdersView.setValue(filterData);
        // cliStakeholdersView.setValue(filterData);
        // jobStakeholdersView.setValue(filterData);

        ccdStakeholdersView.on('selected', function (res) { this.model.set('candidateList', res); })
        comStakeholdersView.on('selected', function (res) { this.model.set('companyList', res); })
        cliStakeholdersView.on('selected', function (res) { this.model.set('clientList', res); })
        jobStakeholdersView.on('selected', function (res) { this.model.set('jobList', res); })

        $('.modal .tt-input').focus();
    },
    getStakeholders: function () {
        var self = this;

        var disabled = _.isUndefined(self.model.get("disabled")) ? '' : self.model.get("disabled");
        var result = {rules: []};

        var fields = ['candidateList', 'clientList', 'companyList', 'jobList'];

        fields.forEach(function(_field) {

            var val = _.isUndefined(self.model.get(_field)) ? '' : self.model.get(_field);
                val = _.size(val) > 0 ? _.map(val, 'id').join(" OR ") : "";

            // if (!_.isEmpty(val)) {
                result.rules.push({ 
                    field: _field + '.id',
                    value: val,
                    operator: 'contains'
                });
            // }
        });

        return result;
    },
    confirmStakeholders: function() {
        this.trigger('stakeholdersConfirmed', this.getStakeholders());
    }
});