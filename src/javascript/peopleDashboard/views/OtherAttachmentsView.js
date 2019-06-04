var Marionette = require('backbone.marionette'),
    _          = require('underscore'),
    stickit    = require('backbone.stickit'),
    Session    = require('../../session/models/Session'),
    imageViewer = require('imageViewer'),
    viewer,
    docId, 
    contentObj,
    _selectedDoc;

module.exports = OtherAttachmentsView = Marionette.ItemView.extend({
    template: require('../templates/otherAttachmentsModal.hbs'),
    onRender: function () {
        this.stickit();
    },
    events: {
        'click .importCandidate' : 'importCandidate',
        'click .show-text'       : 'showText',
        'click .show-pdf'        : 'showPDF',
        'click .show-image'      : 'showImage',
        'click .show-office'     : 'showOffice'
    },
    onShow: function () {
        var self = this;
        var optionTemplate = '';
        contentObj = new Object();

        console.log(this.model);

        //set default cv content & drop down menu
        docId = this.model.get('content')[0].id;
        var documentRender = new UserHotListDocumentRender({ id: docId });
        documentRender.fetch({success: function() {
            _selectedDoc = documentRender;

            self.showText();
            self.hideTabs();
        }});

        $(".btn.cvSelection").html(this.model.get('content')[0].fileName+' <span class="caret"></span>');
        $("#documentId").val(docId);
        $("#candidateId").val(this.model.get('candidateId'));

        //iterator
        $.each(this.model.get('content'), function(num, val) {
            contentObj[val.id] = val.fileContent;
            optionTemplate += "<li data-value=" + val.id + "><a>" + val.fileName + "</a></li>";
        });
        $(".dropdown-menu.cvOption").append(optionTemplate);

        //binding option change event
        $('.dropdown-menu li').click(function(){
            $(".btn.cvSelection").html($(this).text()+' <span class="caret"></span>');
            docId = $(this).data('value');

            var documentRender = new UserHotListDocumentRender({ id: docId });
            documentRender.fetch({success: function() {
                _selectedDoc = documentRender;

                self.showText();
                self.hideTabs();
            }});

            $("#documentId").val(docId);
        });

        //modal popup layout
        var winHeight = $( window ).height();
        $("#defaultModal .modal-body").css("max-height", (winHeight*0.75));
        $("#defaultModal").css("top","5%");
    },
    importCandidate: function(e){
        e.preventDefault();
        var candidateId = $("#candidateId").val();
        var documentId = $("#documentId").val();
        this.trigger('candidate:import', candidateId, documentId);
    },
    showText: function(e) {
        var self = this;

        self.loadTextOnly();
        self.toggleTabs('TEXT-ONLY');
    },
    showPDF: function(e) {
        var self = this;

        self.loadFilePreview('PDF');
        self.toggleTabs('PDF');
    },
    showImage: function(e) {
        var self = this;

        self.loadImage();
        self.toggleTabs('IMAGE');
    },
    showOffice: function(e) {
     var self = this;

     self.loadFilePreview();
     self.toggleTabs('OFFICE');
    },
    loadTextOnly: function() {
        var self = this;
        var emptyMessage = '<p>' + RecruiterApp.polyglot.t('noPreviewAvailable') + '</p>';

        var contents = _selectedDoc.attributes.content ? _selectedDoc.attributes.content : emptyMessage;
        self.$el.find('#document-text').html(contents);

        // Handle empty text contents for certain images
        var htmlBody = self.$el.find('#document-text');
        if (_.isEmpty(htmlBody.text().trim())) {
            self.$el.find('#document-text').html(emptyMessage);
        }

    },
    loadFilePreview: function(tabName) {
        var self = this;

        var session = new Session();
        var url = RecruiterApp.config.API_ROOT + '/document/' + docId + '/preview';

        if (tabName == 'PDF') {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
            xhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
            xhr.onload = function(e) {
                if (this.status == 200) {
                    var type = xhr.getResponseHeader('Content-Type');
                    var blob = new Blob([this.response], {type: type});
                    var fileUrl = URL.createObjectURL(blob); 
                    var html = '<iframe src="' + fileUrl + '" width="100%" height="450" allowfullscreen webkitallowfullscreen></iframe>';
                    self.$el.find('#document-pdf').html(html);

                } else {
                    RecruiterApp.core.vent.trigger('unBlockUI');
                    RecruiterApp.core.vent.trigger('app:message:error', 'Unable to render document');
                }
            };
            xhr.send(JSON.stringify(self.model.attributes));

        } else {
            var html = '<iframe src="https://docs.google.com/gview?url=' + url + '?X-Auth-Token=' + encodeURIComponent(session.get('authToken')) + '&embedded=true" width="100%" height="450" allowfullscreen webkitallowfullscreen></iframe>';
            self.$el.find('#document-office').html(html);
        }

    },
    loadImage: function() {
        var self = this;
        var id = docId || contentObj[docId];

        var session = new Session();
        var url = RecruiterApp.config.API_ROOT + '/document/' + id + '/preview';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
        xhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
        xhr.onload = function(e) {
            if (this.status == 200) {
                var type = xhr.getResponseHeader('Content-Type');
                var blob = new Blob([this.response], {type: type});
                var fileUrl = URL.createObjectURL(blob);

                var html = 
                    '<p><b>' + RecruiterApp.polyglot.t('mouseWheelOrPinchToZoomOnImage') + '</b></p>' +
                    '<img src="' + fileUrl + '" data-high-res-src="' + fileUrl + '" width="100%" alt="Document preview" />'

                if (!_.isNull(viewer) && !_.isUndefined(viewer)) {
                    viewer.destroy();
                }

                self.$el.find('#document-image').html(html);
                viewer = ImageViewer('#document-image img');

            } else {
                RecruiterApp.core.vent.trigger('unBlockUI');
                RecruiterApp.core.vent.trigger('app:message:error', 'Unable to render document');
            }
        };
        xhr.send(JSON.stringify(self.model.attributes));
    },
    hideTabs: function() {
        var self = this;

        if (!_.isNull(_selectedDoc) && !_.isUndefined(_selectedDoc)) {
            var fileName = _selectedDoc.attributes.fileName;

            if (fileName.indexOf('.pdf') > -1) {
                self.$el.find('.show-image').addClass('wb');
                self.$el.find('.show-text').removeClass('wb');
                self.$el.find('.show-pdf').removeClass('wb');
                self.$el.find('.show-office').addClass('wb');

            } else if (fileName.indexOf('.jpg') > -1 || fileName.indexOf('.jpeg') > -1 || fileName.indexOf('.gif') > -1 || fileName.indexOf('.ico') > -1 || fileName.indexOf('.png') > -1 || fileName.indexOf('.svg') > -1 || fileName.indexOf('.tiff') > -1) {
                self.$el.find('.show-image').removeClass('wb');
                self.$el.find('.show-text').removeClass('wb');
                self.$el.find('.show-pdf').addClass('wb');
                self.$el.find('.show-office').addClass('wb');

            } else {
                self.$el.find('.show-image').addClass('wb');
                self.$el.find('.show-text').removeClass('wb');
                self.$el.find('.show-pdf').addClass('wb');
                self.$el.find('.show-office').removeClass('wb');
            }
        }
    },
    toggleTabs: function(tabName) {
        var self = this;

        switch(tabName) {
            case 'TEXT-ONLY':
                self.$el.find('.show-text').addClass('active');
                self.$el.find('.show-pdf').removeClass('active');
                self.$el.find('.show-image').removeClass('active');
                self.$el.find('.show-office').removeClass('active');

                self.$el.find('#document-text').parent().removeClass('hidden');
                self.$el.find('#document-pdf').parent().addClass('hidden');
                self.$el.find('#document-image').parent().addClass('hidden');
                self.$el.find('#document-office').parent().addClass('hidden');

                break;

            case 'PDF':
                self.$el.find('.show-text').removeClass('active');
                self.$el.find('.show-pdf').addClass('active');
                self.$el.find('.show-image').removeClass('active');
                self.$el.find('.show-office').removeClass('active');

                self.$el.find('#document-text').parent().addClass('hidden');
                self.$el.find('#document-pdf').parent().removeClass('hidden');
                self.$el.find('#document-image').parent().addClass('hidden');
                self.$el.find('#document-office').parent().addClass('hidden');

                break;

            case 'IMAGE':
                self.$el.find('.show-text').removeClass('active');
                self.$el.find('.show-pdf').removeClass('active');
                self.$el.find('.show-image').addClass('active');
                self.$el.find('.show-office').removeClass('active');

                self.$el.find('#document-text').parent().addClass('hidden');
                self.$el.find('#document-pdf').parent().addClass('hidden');
                self.$el.find('#document-image').parent().removeClass('hidden');
                self.$el.find('#document-office').parent().addClass('hidden');

                break;

            case 'OFFICE':
             self.$el.find('.show-text').removeClass('active');
             self.$el.find('.show-pdf').removeClass('active');
             self.$el.find('.show-image').removeClass('active');
             self.$el.find('.show-office').addClass('active');

             self.$el.find('#document-text').parent().addClass('hidden');
             self.$el.find('#document-pdf').parent().addClass('hidden');
             self.$el.find('#document-image').parent().addClass('hidden');
             self.$el.find('#document-office').parent().removeClass('hidden');

             break;
        }
    }
});