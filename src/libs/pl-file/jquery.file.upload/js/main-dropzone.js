/*
 * jQuery File Upload Plugin JS Example 7.0
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*jslint nomen: true, unparam: true, regexp: true */
/*global $, window, document */

$(function () {
        'use strict';

        // Initialize the jQuery File Upload widget:
        $('#fileupload').fileupload({
                // Uncomment the following to send cross-domain cookies:
                //xhrFields: {withCredentials: true},
        });

        // Demo settings:
        $('#fileupload').fileupload('option', {
                url: 'upload/php/',
                dropZone: $('#dropzone'),
                maxFileSize: 5000000,
                acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
                process: [{
                        action: 'load',
                        fileTypes: /^image\/(gif|jpeg|png)$/,
                        maxFileSize: 5000000 // 5MB
                }, {
                        action: 'resize',
                        maxWidth: 800,
                        maxHeight: 600
                }, {
                        action: 'save'
                }]
        });
        // Upload server status check for browsers with CORS support:
        if($.support.cors) {
                $.ajax({
                        url: 'upload/php/',
                        type: 'HEAD'
                }).fail(function () {
                        $('<span class="alert alert-error"/>')
                                .text('Upload server currently unavailable - ' + new Date())
                                .appendTo('#fileupload');
                });
        }

        // Load existing files:
        $.ajax({
                // Uncomment the following to send cross-domain cookies:
                //xhrFields: {withCredentials: true},
                url: $('#fileupload').fileupload('option', 'url'),
                dataType: 'json',
                context: $('#fileupload')[0]
        }).done(function (result) {
                $(this).fileupload('option', 'done')
                        .call(this, null, {
                        result: result
                });
        });


        $(document).bind('drop dragover', function (e) {
                e.preventDefault();
                // define animate fot dropzone
                var dropZone = $('.dropzone'),
                        timeout = window.dropZoneTimeout;

                // set class for animate dropzone
                if(!timeout) {
                        dropZone.addClass('in');
                }
                else {
                        clearTimeout(timeout);
                }
                if(e.target === dropZone[0]) {
                        dropZone.addClass('hover');
                }
                else {
                        dropZone.removeClass('hover');
                }
                window.dropZoneTimeout = setTimeout(function () {
                        window.dropZoneTimeout = null;
                        dropZone.removeClass('in hover');
                }, 100);
        });

});