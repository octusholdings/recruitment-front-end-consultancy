var Marionette = require('backbone.marionette'),
    UserHotListDocumentRender = require('../../userHotList/models/UserHotListDocumentRender'),
    stickit    = require('backbone.stickit'),
    Session    = require('../../session/models/Session'),
    imageViewer = require('imageViewer'),
    viewer,
    docId, 
    _tmpContent;

module.exports = CandidateCvView = Marionette.ItemView.extend({
    template: require('../templates/candidateCvModal.hbs'),
    events: {
        'click .show-text'  : 'showText',
        'click .show-pdf'   : 'showPDF',
        'click .show-image' : 'showImage',
        'click .show-office': 'showOffice'
    },
    onRender: function () {
        this.stickit();
    },
    onShow: function () {
        var self = this;
        var optionTemplate = '';
        var contentObj     = new Object();
        // var hasKendoGrid = $('#grid').data('kendoGrid') ? true : false;

        //iterator
        $.each(this.model.get('content'), function(num, val) {
            // if( val.active == true ) {
                contentObj[val.id] = val.content;
                optionTemplate    += '<li data-id="' + num + '" data-value="' + val.id + '"><a>' + val.fileName + '</a></li>';
            // }
        });
        $(".dropdown-menu.cvOption").append(optionTemplate);

        //binding option change event
        $('.dropdown-menu li').click(function(){
            $(".btn.cvSelection").html($(this).text()+' <span class="caret"></span>');
            docIndex     = $(this).data('id'),
            _selectedDoc = self.model.get('content')[docIndex];
            docId        = $(this).data('value');
            _tmpContent  = _selectedDoc.content;

            self.showText();
            self.hideTabs();
        });

        //set default cv content & drop down menu
        _selectedDoc = this.model.get('content')[0];
        docId        = _selectedDoc.id;
        _tmpContent  = _selectedDoc.content;
        $(".btn.cvSelection").html(_selectedDoc.fileName+' <span class="caret"></span>');
        
        self.showText();
        self.hideTabs();

        //modal popup layout
        var winHeight = $( window ).height();
        $("#defaultModal .modal-body").css("max-height", (winHeight*0.75));
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
        var contents = null;

        if (_tmpContent == 'Unable to access document content.') {
            var documentRender = new UserHotListDocumentRender({ id: docId });
            documentRender.fetch({ success: function() {
                _tmpContent = documentRender.attributes.content;

                contents = _tmpContent ? _tmpContent : emptyMessage;
                self.$el.find('#document-text').html(contents);

                // Handle empty text contents for certain images
                var htmlBody = self.$el.find('#document-text');
                if (_.isEmpty(htmlBody.text().trim())) {
                    self.$el.find('#document-text').html(emptyMessage);
                }
            }});

        } else {
            contents = _tmpContent ? _tmpContent : emptyMessage;
            self.$el.find('#document-text').html(contents);

            // Handle empty text contents for certain images
            var htmlBody = self.$el.find('#document-text');
            if (_.isEmpty(htmlBody.text().trim())) {
                self.$el.find('#document-text').html(emptyMessage);
            }
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

        var session = new Session();
        var url = RecruiterApp.config.API_ROOT + '/document/' + docId + '/preview';

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
            var fileName = _selectedDoc.fileName;

            if (fileName.indexOf('.pdf') > -1) {
                self.$el.find('.show-image').addClass('hidden');
                self.$el.find('.show-text').removeClass('hidden');
                self.$el.find('.show-pdf').removeClass('hidden');
                self.$el.find('.show-office').addClass('hidden');

            } else if (fileName.indexOf('.jpg') > -1 || fileName.indexOf('.jpeg') > -1 || fileName.indexOf('.gif') > -1 || fileName.indexOf('.ico') > -1 || fileName.indexOf('.png') > -1 || fileName.indexOf('.svg') > -1 || fileName.indexOf('.tiff') > -1) {
                self.$el.find('.show-image').removeClass('hidden');
                self.$el.find('.show-text').removeClass('hidden');
                self.$el.find('.show-pdf').addClass('hidden');
                self.$el.find('.show-office').addClass('hidden');

            } else {
                self.$el.find('.show-image').addClass('hidden');
                self.$el.find('.show-text').removeClass('hidden');
                self.$el.find('.show-pdf').addClass('hidden');
                self.$el.find('.show-office').removeClass('hidden');

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