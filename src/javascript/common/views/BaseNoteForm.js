/*
 * NoteFormView
 */
var Marionette           = require('backbone.marionette'),
    stickit              = require('backbone.stickit'),
    BaseLayout           = require('./BaseLayout'),
    BaseNoteFormItemView = require('./BaseNoteFormItemView'),
    Candidate            = require('../../candidate/models/Candidate'),
    Client               = require('../../client/models/Client'),
    Company              = require('../../company/models/Company'),
    Job                  = require('../../job/models/Job');

var _content, isPastedContent = false, ccdItemView, clientItemView, companyItemView, jobItemView;

const STAKEHOLDER_CANDIDATE = 'candidate',
      STAKEHOLDER_CLIENT    = 'client',
      STAKEHOLDER_COMPANY   = 'company',
      STAKEHOLDER_JOB       = 'job';
    
module.exports = BaseNoteForm = BaseLayout.extend({
    template: require('../templates/noteForm.hbs'),
    regions: {
        candidateList: '.candidate-list',
        companyList  : '.company-list',
        clientList   : '.client-list',
        jobList      : '.job-list'
    },
    onRender () {
        this.stickit();
    },
    onShow () {
        let self = this;
        _content = '';

        this.initializeSelect2Fields();

        this.$('#note-editor').kendoEditor({
            change () { self.model.set('content', this.value()) },
            keyup () {
                if (_content) _content = null;
                isPastedContent        = false;
                _content               = this.value();
                self.validate();
            },
            paste (e) {
                if (_content) _content = null;
                isPastedContent        = true;
                _content               = e.html;
                self.validate();
            },
            tools: window.Octus.KENDO_EDITOR_DEFAULT_TOOLS,
            pasteCleanup: window.Octus.KENDO_EDITOR_PASTE_CLEANUP
        });

        // hack to focus on hyperlink menu
        // known kendo bug: http://www.telerik.com/forums/column-menu-filter-input-box-not-selectable
        $(document).off('focusin.modal');
    },
    initializeSelect2Fields() {

        // Note Type
        this.select2Base({
            selector: 'select.type',
            hasModalParent: true, // mandatory for select2 within modal popups
            closeOnSelect: true
        });

        // Stakeholders
        ccdItemView     = new BaseNoteFormItemView({ model: this.model, displayName:'candidate',    type:STAKEHOLDER_CANDIDATE, extraQueryParameters: {} });
        clientItemView  = new BaseNoteFormItemView({ model: this.model, displayName:'clientPerson', type:STAKEHOLDER_CLIENT,    extraQueryParameters: {} });
        companyItemView = new BaseNoteFormItemView({ model: this.model, displayName:'company',      type:STAKEHOLDER_COMPANY,   extraQueryParameters: {} });
        jobItemView     = new BaseNoteFormItemView({ model: this.model, displayName:'job',          type:STAKEHOLDER_JOB,       extraQueryParameters: {} });

        // Trigger changes in selections for Company, Client and Job fields
        companyItemView.on('noteOptionSelected', selection => {
            clientItemView.options.extraQueryParameters = selection;
            jobItemView.options.extraQueryParameters = selection;
        });

        clientItemView.on('noteOptionSelected', clientInfo =>{
            let clientIdList = clientInfo['filterValue'].split(' ');
            let companyOptions = [];
            let client;
            clientIdList.forEach(client => {
                client = new Client({ id:client });
                client.fetch({
                    success: result => {
                        companyOptions.push({
                            id: result.get('companyId'),
                            text: result.get('company')
                        });
                        if (companyOptions.length == clientIdList.length) {
                            companyItemView.trigger('updateCompanySelection', companyOptions);
                        }
                    }
                })
            });
        });

        jobItemView.on('noteOptionSelected', jobInfo => {
            let jobIdList = jobInfo['filterValue'].split(' ');
            let companyOptions = [];
            let job;
            jobIdList.forEach(jobId => {
                job = new Job({id:jobId});
                job.fetch({
                    success: result =>{
                        companyOptions.push({
                            id: result.get('companyId'),
                            text: result.get('company')
                        });
                        if (companyOptions.length == jobIdList.length) {
                            companyItemView.trigger('updateCompanySelection', companyOptions);
                        }
                    }
                })
            });
        });

        this.candidateList.show(ccdItemView);
        this.clientList.show(clientItemView);
        this.companyList.show(companyItemView);
        this.jobList.show(jobItemView);
        this.initializeValues();
    },
    initializeValues () {
        let candidateList = this.model.get('candidateIdList') ? this.model.get('candidateIdList').map(cddId => { return new Candidate({id: cddId}).fetch() })   : [],  
            clientList    = this.model.get('clientIdList')    ? this.model.get('clientIdList').map(cliId    => { return new Client({id: cliId}).fetch() })      : [], 
            companyList   = this.model.get('companyIdList')   ? this.model.get('companyIdList').map(comId   => { return new Company({id: comId}).fetch() })     : [], 
            jobList       = this.model.get('jobList')         ? this.model.get('jobList').map(jobId         => { return new Job({id: jobId.id}).fetch() })      : [],
            listLoaded    = 0,
            
            loadedFunc = (loaded, selector) => {
                listLoaded ++;
                if (loaded.length > 0) this.updateSelectHtmlBase(loaded, selector);
                if (listLoaded == 4) RecruiterApp.core.vent.trigger('unBlockUI');
            };

        Promise.all(candidateList).then(loadedCdd => { loadedFunc(loadedCdd, '.candidate-list select.select2')  });
        Promise.all(clientList).then(loadedCli    => { loadedFunc(loadedCli, '.client-list select.select2')     });
        Promise.all(companyList).then(loadedCom   => { loadedFunc(loadedCom, '.company-list select.select2')    });
        Promise.all(jobList).then(loadedJob       => { loadedFunc(loadedJob, '.job-list select.select2')        });
    },
    validate (e) {
        const htmlText = isPastedContent ? $(_content).text().trim() : _content;

        if (_.isEmpty($('select.type').val()) || _.isEmpty(htmlText)) {
            this.$('.addNote').prop('disabled', 'disabled');

        } else {
            this.$('.addNote').removeProp('disabled');
        }
    },
    cancelNote (e) {
        e.preventDefault();
        if (_content) _content = null;
    },

    // Getters and Setters
    getContent()                        { return _content;                          },
    setContent(content)                 { _content = content;                       },

    getCandidates()                     { return ccdItemView.val()                  },
    getClients()                        { return clientItemView.val()               },
    getCompanies()                      { return companyItemView.val()              },
    getJobs()                           { return jobItemView.val()                  },

    isPastedContent()                   { return isPastedContent                    },
    setPastedContent(_isPastedContent)  { return isPastedContent = _isPastedContent }
});