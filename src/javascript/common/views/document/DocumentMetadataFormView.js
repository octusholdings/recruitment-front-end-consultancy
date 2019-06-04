var Marionette = require('backbone.marionette'),
    Tag = require('../../models/document/Tag'),
    stickit = require('backbone.stickit');
module.exports = DocumentMetadataFormView = Marionette.ItemView.extend({
    template: require('../../templates/document/documentMetadataForm.hbs'),
    modelEvents: {
        'change:displayName': 'saveDisplayName',
        'change:description': 'saveDisplayName'      
    },
    bindings: {
        '.name': 'name',
        '.fileName': 'fileName',
        '.displayName': 'displayName',
        '.description': 'description',
        'select#tagSelect' : {
            observe: 'selectedDocumentTag',
            selectOptions: {
                collection: 'window.Octus.documentTagList',
                valuePath: 'key',
                onGet: function(type) {
                    console.log(type);
                    return RecruiterApp.polyglot.t(type);
                },
                defaultOption: {
                    label: function () {return RecruiterApp.polyglot.t('chooseOne');},
                    value: null
                }
            },
            onSet: 'updateTag'
        }
    },
    onRender: function() {
        this.stickit();
        this.$el.find('select option:first-child').prop('disabled', 'disabled');
    },
    updateTag: function(tagValue) {
        var self = this;
        var tagList = this.model.get('tagList');
        if (tagList == undefined) {
            tagList = [];
        }
        var scope = self.options.scope || "Documents";
        tagList.push(tagValue);
        self.model.set('tagList', _.uniq(tagList));
        self.model.save(null, {success: function() {
            RecruiterApp.core.vent.trigger('app:message:success', RecruiterApp.polyglot.t('tagUpdated'));
            RecruiterApp.core.vent.trigger('ga:send', { 
                hitType: 'event', 
                eventCategory: scope,
                eventAction: 'TagUpdate',
                eventLabel: 'Success',
            });

            self.trigger('documentList:tagList:refresh');
        }});
    },
    displayNameTimeout: null,
    getFileExtension(fileName) {
        return fileName && fileName.lastIndexOf('.') > -1 ? fileName.split('.').pop() : null;
    },
    saveDisplayName() {
        clearTimeout(this.displayNameTimeout);
        this.displayNameTimeout = setTimeout(() => { 
            this.saveMetadata();
        }, 1500);
    },
    saveMetadata() {
        var self = this;

        var scope = this.options.scope || "Documents";

        // If the user deleted the custom file name, the document name is displayed again
        if (this.model.get('displayName').trim().length === 0) {
            this.model.set('displayName', this.model.get('fileName'));
        } else {

            // Make sure displayName contains a file extension
            let extDisplayName = this.getFileExtension(this.model.get('displayName'));
            let extFileName = this.getFileExtension(this.model.get('fileName'));

            if (!extDisplayName && extFileName) {
                this.model.set('displayName', 
                    `${ this.model.get('displayName').trim() +
                       (this.model.get('displayName').lastIndexOf('.') == this.model.get('displayName').length - 1 ? '' : '.') +
                       (extDisplayName || extFileName) }`);

            }

        }

        this.model.save(null, {success() {
            RecruiterApp.core.vent.trigger('app:message:success', RecruiterApp.polyglot.t('documentMetadataSaved'));
            RecruiterApp.core.vent.trigger('ga:send', { 
                hitType: 'event', 
                eventCategory: scope,
                eventAction: 'MetaUpdate',
                eventLabel: 'Success',
            });

            self.trigger('documentList:tagList:refresh');
        }});
    }
});