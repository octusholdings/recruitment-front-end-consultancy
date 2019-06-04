var Marionette              = require('backbone.marionette'),
    Bloodhound              = require('bloodhound'),
    DocumentList            = require('../../jobDetailDashboard/document/DocumentList'),
    UserHotListHelpers      = require('../../userHotList/UserHotListHelpers');

var typeaheadOptions = {
    hint: false,
    highlight: true,
    minLength: 1,
}

var Job = Backbone.Model.extend({
    url: function () {
        return RecruiterApp.config.API_ROOT + '/jobPosting/' + this.get('id');
    },
})

var UserHotList = Backbone.Model.extend({
    url: function () {
        return RecruiterApp.config.API_ROOT + '/userhotlist/' + this.get('id');
    },
})

module.exports = SendJobItemView = Marionette.ItemView.extend({
	template: require('../templates/baseSendJobItem.hbs'),

    events: {
        'click .btn-refresh-jd'     : 'loadJobDescription',
        'change .jd-dropdown'       : 'changeJd',
        'change .doc-dropdown'      : 'changeDoc',
        'click .btn-remove-job'     : 'removeRecord'
    },

    initialize () {
        let jdList = this.model.get('descriptionList') ? this.model.get('descriptionList').filter(item => item.type != "INTERNAL") : [];
        if (!_.isEmpty(jdList)) {
            let firstJd = jdList[0];
                firstJd.selected = true;

            this.model.set('jdId', [firstJd.language + '-' + firstJd.type])
        }
        this.loadDocuments();
        this.loadJobDescription();
    },

    loadDocuments () {
        if (!this.model.get('id')) return;
        
        let jobDoc = new DocumentList();
            jobDoc.jobId = this.model.get('id');

        jobDoc.fetch().then(() => {
            this.model.set('documentList', jobDoc.toJSON().map(document => ({
                id      : document.id,
                fileName: document.displayName || document.fileName
            })));
            this.model.unset('loadingDocuments');
            this.render();
        })
    },

    loadJobDescription () {
        if (!this.model.get('id')) return;

        var job = new Job({id: this.model.get('id')});

        job.fetch().then(() => {

            this.model.set('descriptionList', job.get('descriptionList').filter(desp => desp.type == 'EXTERNAL'));

            let firstJd = this.model.get('descriptionList')[0];

            if (firstJd) {
                firstJd.selected = true;
                this.model.set('jdId', [firstJd.language + '-' + firstJd.type]);
            }

            this.model.unset('loadingDescriptions');
            this.render();
        })
    },

    onRender () {
        if (!_.isEmpty(this.model.get('descriptionList'))) this.initializeSelect2_jd();
        if (!_.isEmpty(this.model.get('documentList'))) this.initializeSelect2_doc();
        this.initTypeAhead();
        this.options.parentView.checkJobList();
        this.options.parentView.setSendJobRequestList();
    },

    initializeSelect2_jd () {
        this.$('.jd-dropdown').selectpicker({ dropdownAlignRight: 'auto' });
    },

    initializeSelect2_doc () {
        this.$('.doc-dropdown').selectpicker({ dropdownAlignRight: 'auto' });
    },

    initTypeAhead () {
        var queryInput = this.$("input.title-input");        
        var queryController = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            limit: 10,
            remote: {
                url: function() {     
                    return RecruiterApp.config.API_ROOT + '/jobPosting/list/0/10?criteria=%QUERY'
                } (),
                wildcard: '%QUERY',
                ajax: {
                    beforeSend: function (jqXhr, settings) {
                        settings.data = $.param({criteria: queryInput.val()});
                        jqXhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
                    }
                },
                filter: function (searchResponse) {
                    return $.map(searchResponse, function (searchResult) {
                        return { title: searchResult.title, company: searchResult.company, type: searchResult.type[0], id: searchResult.id }    
                    });
                }
            }
        })

        queryController.initialize();

        queryInput.typeahead(typeaheadOptions, {
            name: 'queryController',
            source: queryController.ttAdapter(),
            limit: 10,
            display (item) { return item.title + ' - ' + item.company;   },
            templates: {
                suggestion (item) { return '<span>' + item.title + ' - ' + item.company + '</span>' },
                empty: ['<div class="marginLeft10">No Matches Found</div>'].join('\n')
            } 
        }).on('typeahead:selected', (obj, model) => {    
            if (this.options.parentView.duplicationCheck(model)) {    
                this.model.unset('documentList');
                this.model.unset('descriptionList')
                this.model.unset('jdId')
                this.model.set({
                    id:     model.id,
                    title:  model.title + ' - ' + model.company,
                    loadingDocuments: true,
                    loadingDescriptions: true,
                });
                this.loadJobDescription();
                this.loadDocuments();
                this.render();
            } else {
                this.render();
            }
        }).on('typeahead:asyncrequest', () => {
            this.$('.tt-spinner').show();
        }).on('typeahead:asynccancel typeahead:asyncreceive', () => {
            this.$('.tt-spinner').hide();
        }).on('change', () => {
            if (_.isEmpty(queryInput.val())) {
                this.model.unset('documentList');
                this.model.unset('descriptionList');
                this.model.unset('id');
                this.model.unset('title');
                this.render();
            }
        });
    },

    changeJd () {
        let jdIdValList = this.$('.jd-dropdown').val();

        let jdList = this.model.get('descriptionList');
        jdList = jdList.map(jd => ({
            contentMap: jd.contentMap,
            language: jd.language,
            title: jd.title,
            type: jd.type,
        }));
        this.model.set('descriptionList', jdList);

        if (_.isEmpty(jdIdValList)) {
            this.model.unset('jdId');
        } else {
            jdIdValList.forEach(jdIdVal => {
                let jdLang = jdIdVal.split('-')[0];
                let jdType = jdIdVal.split('-')[1];
                
                jdList.find(jd => jd.language == jdLang && jd.type == jdType).selected = true;
            })

            this.model.set('jdId', jdIdValList)
        }
        this.options.parentView.setSendJobRequestList();
    },

    changeDoc() {
        let docIdValList = this.$('.doc-dropdown').val();
        let docList = this.model.get('documentList');
        docList = docList.map(doc => ({
            fileName: doc.fileName,
            id: doc.id,
            displayName: doc.displayName
        }));

        this.model.set('documentList', docList);

        if (_.isEmpty(docIdValList)) {
            this.model.unset('docName');
            this.model.unset('docId');
        } else {
            docIdValList.forEach(docIdVal => {                
                docList.find(doc => doc.id == docIdVal).selected = true;
            })

            this.model.set('docName', docIdValList.map(docId => _.findWhere(docList, {id: docId})));
            this.model.set('docId', docIdValList)
        }
        this.options.parentView.setSendJobRequestList();
    },

    removeRecord () {
        this.options.parentView.collection.remove(this.model)
        this.options.parentView.setSendJobRequestList()
    },

    showEditor (show) {
        if (show) {
            this.$('.group-wrapper.display').addClass('hidden');
            this.$('.group-wrapper.editor').removeClass('hidden');
        } else {
            if (!_.isUndefined(this.model.get('id')) && !_.isEmpty(this.model.get('jdId')) && !_.isEmpty(this.model.get('title'))) {
                this.$('.group-wrapper.display').removeClass('hidden');
                this.$('.group-wrapper.editor').addClass('hidden');
                this.render();
            }
        }
    }
});

module.exports = SendJobView = Marionette.CompositeView.extend({
	template: require('../templates/baseSendJob.hbs'),
	itemView: SendJobItemView,
    itemViewContainer: '#job-send',

    events: {
        "click .add-new-job"    : "addNew",
        "click .hotList-wrap"   : "addFromHotList",
    },

    itemViewOptions : function () { return { parentView: this } },

    initialize () {
        if (this.collection.isEmpty()) this.collection.add({});
    },

    onRender () {
        this.listenTo(this.collection, 'add remove change', this.checkJobList);
        this.checkJobList();

    	// Setting up the helper functions
        this.TYPE = 'job';
        this.userHotListHelpers = new UserHotListHelpers();
        this.userHotListHelpers.SELF = this;
        this.userHotListHelpers.KENDO = false;
        this.userHotListHelpers.TYPE = this.TYPE;

        this.userHotListHelpers.LOAD_SAVED_HOTLIST('list');

        this.$('.jobCount').html(this.collection.length);
    },

    checkJobList () {
        if (this.collection.length > 1) this.$('.btn-remove-job').removeAttr('disabled');
        else this.$('.btn-remove-job').prop('disabled', 'disabled');

        this.$('.jobCount').html(this.collection.length);
    },

    setSendJobRequestList () {
        let jobCollection = this.collection.reject(job => job.isEmpty());

        this.model.set({
            'sendJobRequestList': jobCollection.map(job => ({
                id : job.get('id'),
                jobDescriptionList: (() => {
                    if (job.get('jdId')) {
                        return job.get('jdId').map(jdId => ({
                            language : jdId.split('-')[0],
                            type     : jdId.split('-')[1]
                        }));
                    } else {
                        return []
                    }
                })(),
                attachedDocuments: _.flatten(jobCollection
                    .filter(job => job.has('docName'))
                    .map(job => (job.get('docName')
                        .map(docName => docName.id))))
            })),
            'attachmentList': _.flatten(jobCollection
                .filter(job => job.has('docName'))
                .map(job => (job.get('docName')
                    .map(docName => docName.id))))
        });
    },

    addNew (rec) {
        if ( rec && rec.id ) this.collection.add(rec);
        else this.collection.add({});
    },

    addFromHotList (e) {
        e.preventDefault()

        var hotListBtn      = this.$('.add-from-hotlist');
        var hotListText     = hotListBtn.addClass('disabled').html();
        var hotlist         = new UserHotList({id: $(e.currentTarget).attr('data-opt')});

        hotListBtn.addClass('disabled').attr('disabled', 'disabled').html(`${RecruiterApp.polyglot.t('loading')} <i class="fa fa-refresh fa-spin fa-fw"></i>`);

        hotlist.fetch().then(() => {
            let recList = hotlist.get('itemList').map(recId => new Job({id: recId}).fetch());
            Promise.all(recList).then(() => {
                recList = recList.map(rec => ({id: rec.responseJSON.id, title: rec.responseJSON.title + ' - ' + rec.responseJSON.company, loadingDocuments: true, loadingDescriptions: true}));
                recList.forEach(rec => {
                    if (this.duplicationCheck(rec)) {
                        let emptyModel = this.collection.find(model => !model.has('id') && !model.has('title'));
                        if (emptyModel) {
                            emptyModel.set(rec);
                            this.children.findByModel(emptyModel).render();
                            this.children.findByModel(emptyModel).loadDocuments();
                            this.children.findByModel(emptyModel).loadJobDescription();
                        } else {
                            this.addNew(rec);
                        }
                    }
                });
                hotListBtn.removeClass('disabled').removeAttr('disabled').html(hotListText);
            });

            if ($(e.currentTarget).find('.badge-added').length == 0) {
                $(e.currentTarget)
                    .addClass('added')
                    .find('a .name')
                        .append(' <span class="badge badge-notify badge-added"><i class="fa fa-check" aria-hidden="true"></i> Added </span> ')
            }
        })
    },

    duplicationCheck (newRecord) {
        if (_.isUndefined(this.collection.findWhere({id: newRecord.id}))) {
            return true;
        } else {
            RecruiterApp.core.vent.trigger('app:message:warning', `<h4>${RecruiterApp.polyglot.t('warning')}</h4><b>${newRecord.title}:</b> ${RecruiterApp.polyglot.t('thatRecordHaveBeenAdded')}`);
            return false;
        }
    },

    toggleEditor (targetId) {
        if (!targetId) {
            this.collection.each(model => {
                if (!_.isUndefined(model.get('title'))) {
                    this.children.findByModel(model).showEditor(false);
                }
            });
        } else {
            let targetModel = this.collection.findWhere({id: targetId});
            if (targetModel) {
                let targetView = this.children.findByModel(targetModel);
                targetView.showEditor(true);
            }
        }
    },
});