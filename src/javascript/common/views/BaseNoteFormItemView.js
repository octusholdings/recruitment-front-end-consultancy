/*
 * NoteFormItemView
 */
var Marionette   = require('backbone.marionette'),
    Typeahead    = require('corejs-typeahead'),
    Bloodhound   = require('bloodhound'),
    Session      = require('../../session/models/Session'),
    BaseItemView = require('./BaseItemView'),
    self;

const STAKEHOLDER_CANDIDATE = 'candidate',
      STAKEHOLDER_CLIENT    = 'client',
      STAKEHOLDER_COMPANY   = 'company',
      STAKEHOLDER_JOB       = 'job';

module.exports = BaseNoteFormItemView = BaseItemView.extend({
    template: require('../templates/noteFormItemView.hbs'),

    onBeforeRender () {
        this.model.set('filterType', this.options.type);
        this.model.set('displayName', this.options.displayName);
        this.noteQuery = {};
    },

    events: {
        'select2:select select.select2'  : 'optionSelected',
        'select2:unselect select.select2': 'optionSelected'
    },

    onShow () {
        let session   = new Session(),
            dataurl   = this.getURL();
            self      = this;

        this.selectType  = this.$('select.select2').attr('name');
        this.selectInput = this.$('select.form-control.select-input');

        this.on('updateCompanySelection', companyOptions => {
            let existingSelects = this.selectInput.select2('data');
            let options = _.difference(companyOptions, existingSelects);
            options.forEach(company => {
                if (!existingSelects.filter(item => { return item.id == company.id; }).length){
                    $('select[name=company]').append(`<option value="${company.id}" selected="selected">${company.text}</option>`);
                }
            });
            $('select[name=company]').trigger('change');
        })

        this.select2Base({
            selector: 'select.form-control.select-input',
            hasRemoteData: true,
            hasModalParent: true,
            url: dataurl,
            placeholder: RecruiterApp.polyglot.t(self.model.get('displayName')),
            remoteDataParams: 'criteria',
            templateResult: (repo) => {
                let response = '';

                if (repo.firstName && repo.lastName) {
                    let email = !repo.email ? '' : ` <code>${repo.email}</code> `;
                    response  = `${repo.firstName} ${repo.lastName}${email}`;

                } else if (repo.name) {
                    let website = !repo.website ? '' : ` <code>${repo.website.replace(/^https?\:\/\//i, "")}</code> `;
                    response    = `${repo.name} ${website}`;

                } else if (repo.title) {
                    var company = !repo.company ? '' : ` <code>${repo.company}</code> `;
                    response    = `${repo.title} ${company}`;

                } else {
                    response    = repo.text || 'Loading...';
                }

                return markup = 
                    `<div class='select2-result-repository clearfix'>
                        <div class='select2-result-repository__meta'>
                            <div class='select2-result-repository__title'>${response}</div>
                        </div>
                    </div>`;
            
            },
            templateSelection: (repo) =>{
                if (repo.firstName && repo.lastName) return `${repo.firstName} ${repo.lastName}`;
                else if (repo.name)                  return repo.name;
                else if (repo.title)                 return repo.title;
                else                                 return repo.text;
            },
            processResults: (data, params) => {
                params.page = params.page || 1;
                return {results: _.compact(data), pagination: false}
            }
        });
    },
    getURL () {
        if (this.model.get('filterType') == STAKEHOLDER_CANDIDATE) return `${RecruiterApp.config.API_ROOT}/people/list/candidate/0/10`;
        if (this.model.get('filterType') == STAKEHOLDER_CLIENT)    return `${RecruiterApp.config.API_ROOT}/people/list/client/0/10`;
        if (this.model.get('filterType') == STAKEHOLDER_COMPANY)   return `${RecruiterApp.config.API_ROOT}/company/list/0/10`;
        if (this.model.get('filterType') == STAKEHOLDER_JOB)       return `${RecruiterApp.config.API_ROOT}/jobPosting/list/0/10`;
    },
    val () {
        let list = this.$("select.select2").val();

        if (this.options.type == STAKEHOLDER_JOB) { 
            list = _.map(list, dat => { 
                return { id: dat }
            }); 
        }

        return list;
    },
    optionSelected (e) {
        if (this.selectType == STAKEHOLDER_CANDIDATE) { return; }
        if (this.selectType != STAKEHOLDER_COMPANY && e.type=='select2:unselect') { return; }

        let selectValuesJoined;
        let data = $(e.currentTarget).select2('data');

        if (data.length) {
            selectValuesJoined = data.map(item => { return item.id; }).join(' ');
            this.noteQuery     = {
                filterBy    : `${this.selectType}Id`,
                filterValue : selectValuesJoined
            }
        }

        this.trigger('noteOptionSelected', this.noteQuery);
    }
});