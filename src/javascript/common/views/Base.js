var _           = require('underscore'),
    Backbone    = require('backbone'),
    Validation  = require('backbone.validation'),
    Bloodhound  = require('bloodhound'),
    Typeahead   = require('corejs-typeahead');

module.exports = Base = {
    initialize: function () {
        var self = this;

        if (typeof(this.model) == 'undefined') {
            console.warn("Model is undefined");
        } else {
            self.model.on("model:valid", function(model) {
                self.clearErrors(self);
            });

            self.model.on("model:invalid", function(model, errors) {
                self.clearErrors(self);
                self.markErrors(self, errors);
            });
        }

        if (self.model) {
            self.resetAttributes = self.model.toJSON()
        }
    },
    clearErrors: function (view) {
        // console.log("Clearing errors", view);
        var inputs = view.$el.find(':input');
        inputs.each(function (index, element) {
            var attr = $(element).attr('name');
            if (!_.isEmpty(attr) && !_.isNull(attr) && !_.isUndefined(attr)) {
                Backbone.Validation.callbacks.valid(view, attr);
                //console.log("Call valid callback to remove all error classes", "attr->", attr, "element", element);
            }
        });
    },
    markErrors: function (view, errors) {
        // console.log("Marking errors", view);
        var firstError = _.first(_.keys(errors));
        var $element = view.$el.find("[name='" + firstError + "']");
        if ($element.length > 0) {
            $element.focus();
        }
        _.each(errors, function (error, attr, list) {
            //console.log("Error: " + "key->" + attr + " value->" + error);
            Backbone.Validation.callbacks.invalid(view, attr, error);
        });
    },
    showRequiredFields: function () {
        var self = this,
            el = this.$el, 
            fieldValidation;

        "object" == typeof self.model.validation ? fieldValidation = self.model.validation : 
        "function" == typeof self.model.validation && (fieldValidation = self.model.validation());

        _.each(fieldValidation, function(val, key){
            var isRequired = _.isFunction(val) ? val.call() : val.required;
            if (isRequired) {
                el.find('[name=' + key + ']')
                  .parents('.form-group')
                  .find('.control-label')
                  .first()
                  .append('<span class="requiredInput">*</span>');
                if (el.find('[name=' + key + ']').closest('.form-group').find('input[type="checkbox"]').length == 1) {
                    el.find('[name=' + key + ']').closest('.form-group').find('input[type="checkbox"]').prop('checked', 'checked').trigger('change');
                }

                if (key == 'contractorFreelance') { // employmentType need to set contract and checked
                    el.find('[value="contract"]').prop({
                        checked: 'checked',
                    }).trigger('change');
                }
            }
        });
    },
    checkChanged: function () {
        var self = this;
        var changed = self.model.toJSON(), changes = 0, dontSave;

        _.each(self.resetAttributes, function(val, key){ 

            // if originaly it was null but now its not null and its not empty 
            if (_.isNull(val) && !_.isNull(changed[key])) { 
                if (!_.isEmpty(changed[key])) {
                    console.error('changed:', key, '. Ori: ', val, '. Curr: ', changed[key])
                    changes ++; 
                }
            } else if (typeof val != typeof changed[key]) {
                // there has been a change in type
                // extra check, convert to string n check again
                if (String(val) !== String(changed[key])) {
                    console.error('changed:', key, '. Ori: ', val, '. Curr: ', changed[key])
                    changes ++; 
                }
            } else {
                // DEEP COMPARISON

                // if both are string or number
                if ((_.isString(val) && _.isString(changed[key])) || (_.isNumber(val) && _.isNumber(changed[key]))) {
                    
                    // if string
                    if (val !== changed[key]) {
                        console.error('changed:', key, '. Ori: ', val, '. Curr: ', changed[key])
                        changes ++;
                    }
                // if both are array
                } else if (_.isArray(val) && _.isArray(changed[key])) {
                    
                    _.each(val, function(va, i) {
                        // convert to string n test
                        if (JSON.stringify(va) !== JSON.stringify(changed[key][i])) {
                            if (_.isObject(va)) {
                                // go through all value and compare
                                if (_.isUndefined(_.find(va, function(v) { return v === changed[key][i] }))) {
                                    console.error('changed:', key, '. Ori: ', val, '. Curr: ', changed[key])
                                    changes ++;
                                }
                            }
                        }
                    });
                // if the original is an object and the changed is an array
                } else if (_.isObject(val) && _.isArray(changed[key])) {
                    
                    if (val.length != changed[key].length) {
                        console.error('changed:', key, '. Ori: ', val, '. Curr: ', changed[key])
                        changes ++;
                    }

                // if both are object
                } else if (_.isObject(val) && _.isObject(changed[key])) {    
                    
                    if (val instanceof Backbone.Model && changed[key] instanceof Backbone.Model) {
                        console.log('Backbone.Model', val.toJSON(), changed[key].toJSON())
                        // todo: test model is changed
                    } else if (val instanceof Backbone.Collection && changed[key] instanceof Backbone.Collection) {
                        // if the length collection have changed
                        if (val.length != changed[key].length) {
                            console.error('changed:', key, '. Ori: ', val, '. Curr: ', changed[key])
                            changes ++;
                        } else {
                            // compare each model to see if any changed
                            _.each(val.toJSON(), function(va, j) { 
                                _.each(va, function(v, k) {
                                    if (_.isUndefined(v) || _.isNull(v)) delete va[k]
                                });
                                if (!_.isEmpty(va)) {
                                    if (_.isUndefined(_.findWhere(changed[key].toJSON(), va))) {
                                        console.error('changed:', key, '. Ori: ', val, '. Curr: ', changed[key])
                                        changes ++;
                                    }
                                }
                            });
                        }
                    }
                } else {
                    if (!_.isNull(val) && !_.isNull(changed[key])) {
                        console.log('key not handled:', key)
                    }
                }
            }
        
        });

        if (window.location.href.includes('create') && !_.isEqual(self.resetAttributes, changed)) {
            changes ++;
            console.log(`User was just creating a new record and added some data but then cancelled`);
        }

        if (!!changes) {
            dontSave = confirm(RecruiterApp.polyglot.t('youHaveUnsavedChangesLeaveWithoutSaving'));

            if (dontSave) {
                self.model.set(self.resetAttributes)
                return true
            } else {
                return false
            }
        } else {
            return true
        }
    },
    /**
     * Select2 Field - for multiselection dropdown
     * @param  opt [JSON object containing options for Select2]
     * 
     * Required parameters:
     * - selector: string eg. '.example', '#example'
     * - hasRemoteData: true or false (true if select2 retrieving from BE data)
     * - url: string (if hasRemoteData is true, provide URL for retrieving data)
     * - remoteDataParams: string (if url is provided, this is required. If not provided, default value is 'value' in most cases)
     *   Eg. remoteDataParams: 'criteria', 
     *       url: http://localhost:8080/server/company/list/0/10
     *       Therefore, Request URL sent to BE is http://localhost:8080/server/company/list/0/10?criteria=a
     * - hasModalParent: boolean (if select2 field is inside a modal popup, SET TO TRUE)
     *
     * You can find the API here for more details on the options:
     * https://select2.org/configuration/options-api
     */
    select2Base (opt) {
        let defaultSelect2Options;

        if (!opt.selector) console.error("Select2Base: No selector provided");

        if (!opt.hasRemoteData)  opt.hasRemoteData  = opt.url ? true : false;
        if (!opt.placeholder)    opt.placeholder    = {id: null, text: RecruiterApp.polyglot.t("chooseOne"), disabled: true};
        if (!opt.hasModalParent) opt.hasModalParent = false;
        if (!opt.tags)           opt.tags           = false;
        if (!opt.closeOnSelect)  opt.closeOnSelect  = true;
        if (!opt.allowClear)     opt.allowClear     = false;
        if (!opt.templateResult) {
            opt.templateResult = dat => {
                let text = 
                    `<div class='select2-result-repository clearfix'>
                        <div class='select2-result-repository__meta'>
                            <div class='select2-result-repository__title'>${dat.text}</div>
                        </div>
                    </div`;

                return markup = text;
            }
        }
        if (!opt.templateSelection) opt.templateSelection = dat => { return dat.text; }

        // If Select2 requires remote URL to retrieve data, set hasRemoteData as true
        // Otherwise - hasRemoteData should be false
        if (opt.hasRemoteData == true) {

            if (!opt.url)              console.error("Select2Base: No URL provided");
            if (!opt.remoteDataParams) opt.remoteDataParams = 'value';

            defaultSelect2Options = {
                placeholder: opt.placeholder,
                tags: opt.tags,
                dataType: 'json',
                delay: 150,
                ajax: {
                    url: opt.url,
                    data: params => { 
                        if (opt.remoteDataParams == 'criteria') 
                            return { criteria: params.term }
                        else 
                            return { value: params.term } 
                    },
                    processResults: (data, params) => {

                        if (!opt.processResults) {
                            params.page = params.page || 1;

                            data = data.map(dat => {
                                let newDat = { id: dat.id || dat.key, text: dat.value || dat.name };

                                if (dat.types) 
                                    newDat.types = dat.types;

                                return newDat;
                            });

                            return { results: data, pagination: false };
                        }
                        
                        return opt.processResults(data, params);
                    },
                    cache: true
                },
                escapeMarkup: markup => { return markup; },
                minimumInputLength: 1,
                templateResult: opt.templateResult,
                templateSelection: opt.templateSelection,
                closeOnSelect: opt.closeOnSelect,
                allowClear  : opt.allowClear
            };

        } else {
            defaultSelect2Options = { 
                placeholder: opt.placeholder, 
                tags: opt.tags, 
                closeOnSelect: opt.closeOnSelect,
                allowClear  : opt.allowClear
            };

            if (opt.data) defaultSelect2Options.data = opt.data;
        }

        if (opt.hasModalParent == true) defaultSelect2Options.dropdownParent         = $('#defaultModal');
        if (opt.maximumSelectionLength) defaultSelect2Options.maximumSelectionLength = opt.maximumSelectionLength;
        return this.$(opt.selector).select2(defaultSelect2Options);
    },
    /* Typeahead Bloodhound Field (soon-to-be deprecated)
     * @param  opt [JSON object containing options for Typeahead]
     * 
     * Required parameters:
     * - selector: string eg. '.example', '#example'
     * - url: string eg. http://localhost:8080/server/filterChoice/list/candidate/industryList/10/adding/reference/data/industry?criteria=%QUERY
     * - wildcard: string (indicate the wildcard from URL, eg. '%QUERY')
     *
     * You can find the API here for more details on the options:
     * https://twitter.github.io/typeahead.js/examples/
     */
    typeaheadBase (opt) {
        let self = this, queryInput, queryController;

        if (!opt.url)      console.error("TypeaheadBase: No URL provided!");
        if (!opt.selector) console.error("TypeaheadBase: No selector provided!");

        if (!opt.displayText) opt.displayText = item => { return item.name; }
        if (!opt.onTypeaheadSelected) {
            opt.onTypeaheadSelected = (obj, model) => {
                console.log(obj, model);
            }
        }

        queryInput = $(opt.selector);
        queryInput.on('click', () => { $(this).select() });
        queryController = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            limit: 10,
            remote: {
                url: opt.url,
                wildcard: opt.wildcard,
                ajax: {
                    beforeSend: (jqXhr, settings) => {
                        settings.data = $.param({criteria: queryInput.val()});
                        jqXhr.setRequestHeader('X-Auth-Token', session.get('authToken'));
                    }
                },
                filter: searchResponse => {
                    return $.map(searchResponse, searchResult => {
                        return { name: searchResult.name, id: searchResult.id }
                    });
                }
            }
        });
        
        queryController.initialize();

        queryInput.typeahead({
            hint: false,
            highlight: true,
            minLength: 1
        }, {
            name: 'queryController',
            display: opt.displayText,
            limit: 10,
            source: queryController.ttAdapter(),
            templates: {
                empty: [`<div class="marginLeft10">${RecruiterApp.polyglot.t('noMatchesFound')}</div>`].join('\n')
            }
        })
        .on('typeahead:selected', opt.onTypeaheadSelected)
        .on('typeahead:asyncrequest', () => { 
            $(queryInput).parents('.tt-wrapper').find('.tt-spinner').show(); 
        })
        .on('typeahead:asynccancel typeahead:asyncreceive', () => { 
            $(queryInput).parents('.tt-wrapper').find('.tt-spinner').hide();
        });
    },
    select2SelectEvent (res) {
        var self = this;
        
        console.log(res);
        
        // var uniqId = _.indexOf(res.dataToSave, 'key') != -1 ? 'key' : 'id'; // unique id could be either a "key" or an "id"    
        var uniqId = res.dataToSave.findIndex(item => item.includes('key')) != -1 ? 'key' : 'id';
        if (res.uniqueId) {
            uniqId = res.uniqueId;
        }
        console.log(uniqId);

        var arr = self.model.get(res.attr) ? self.model.get(res.attr) : [];
            arr = _.filter(arr, function(ar) {
                return !_.isUndefined(ar[uniqId]);
            });

        console.log(arr);
        
        var dat = res.evt.params.data;

        if (res.evt.type == "select2:unselect") {
            switch (uniqId) {
                case 'id' : arr = _.without(arr, _.findWhere(arr, { id : dat.id })); break;
                default   : arr = _.without(arr, _.findWhere(arr, { key: dat.id })); break;
            }
            
            arr = _.uniq(arr, uniqId);

        } else if (res.evt.type == "select2:select") {

            var obj = {};

            if (_.indexOf(res.dataToSave, 'key') != -1) {
                obj.key = self.camelize(dat.id);
            }

            if (_.indexOf(res.dataToSave, 'keyNoTransform') != -1) {
                obj.key = dat.id;
            }

            if (_.indexOf(res.dataToSave, 'id') != -1) {
                obj.id = self.camelize(dat.id);
            }

            if (_.indexOf(res.dataToSave, 'idNoTransform') != -1) {
                obj.id = dat.id;
            }

            if (_.indexOf(res.dataToSave, 'value') != -1) {
                obj.value = dat.text;
            }

            if (_.indexOf(res.dataToSave, 'types') != -1) {
                obj.types = dat.types;
            }

            if (_.indexOf(res.dataToSave, 'allNames') != -1) {
                obj.allNames = dat.allNames;
            }

            if (_.indexOf(res.dataToSave, 'username') != -1) {
                obj.username = dat.username;
            }
            
            arr.push(obj);

            arr = _.uniq(arr, uniqId);
        }

        arr = _.filter(arr, function(ar) {
            return !_.isUndefined(ar[uniqId]);
        });

        console.log(arr);

        self.model.set(res.attr, arr);
    },
    updateSelectHtmlBase(dataList, select2_selector) {
        let dat  = _.isArray(dataList) ? dataList : dataList.toJSON();
        let self = this;
        let uniqId = dat[0].key ? 'key' : 'id';
        this.$(select2_selector).html('');

        _.each(dat, item => {
            self.$(select2_selector).append(`<option value="${uniqId == 'key' ? item.key : item.id}" selected="selected">${item.value || item.name || item.title}</option>`);
        });        

        self.$(select2_selector).val(_.pluck(dataList, uniqId)).trigger('change');
    },
    kendoDatePickerBase (opt) {
        if (!opt.selector) console.error("KendoDatePickerBase: No selector provided!");

        return this.$(opt.selector).kendoDatePicker({
            format: window.Octus.KENDO_DATE_FORMAT,
            close: function (e) {
                let el = $(this.element);
                setTimeout(function () { el.blur() }, 200);
            }
        }).data("kendoDatePicker");
    },
    /**
     * Kendo Editor Base
     * Required:
     * - selector: string
     * TIP:
     * For validating form by disabling Save button - see QuickNoteLayout.js example
     * 
     * For API Documentation and other customizations, see more here:
     * https://demos.telerik.com/kendo-ui/editor/index
     */
    kendoEditorBase (opt) {
        if (!opt.selector) console.error("kendoEditorBase: No selector provided!");
        if (!opt.change)   opt.change = (e) => {console.log('KENDO EDITOR BASE: CHANGE: ', $(opt.selector).val())};
        if (!opt.keyup)    opt.keyup  = (e) => {console.log('KENDO EDITOR BASE: KEYUP: ', $(opt.selector).val())};
        if (!opt.tools)    opt.tools  = window.Octus.KENDO_EDITOR_DEFAULT_TOOLS;

        let defaultOpts = {
            tools   : opt.tools,
            change  : opt.change,
            keyup   : opt.keyup
        }

        if (!opt.paste) {
            defaultOpts.pasteCleanup = window.Octus.KENDO_EDITOR_PASTE_CLEANUP;
        } else {
            defaultOpts.paste = opt.paste;
        }

        return this.$(opt.selector).kendoEditor(defaultOpts);
    },
    camelize (str) {
        if (_.isNull(str)) return '';
        return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
            if (+match === 0) return "";
            return index == 0 ? match.toLowerCase() : match.toUpperCase();
        });
    },
    titlelize (str) {
        if (_.isNull(str)) return '';
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    },
    // This function is made to disable the "choose one..." kind of dropdown options
    // which are there more for placeholder.
    // dropdownArray - an array of class names or IDs of the select items
    disableDropdownFirstValue (dropdownArray) {
        let self         = this,
            dropdownList = dropdownArray;

        _.each(dropdownList, (dropdown) => {
            self.$(dropdown+' option').first().removeAttr('value').attr('disabled', 'disabled');
        });
    },

    /**
     * Useful to convert rich text elements, such as pasted html to paragraphs (div to p)
     * or email content (p to div)
     * @param {string} string - The text you want converted
     * @param {string} oldElement - Which element should be swapped
     * @param {string} newElement - For which element should it be swapped
     */
    replaceAllHtmlTags(string, oldElement, newElement) {
        if (oldElement && newElement) {
            let container = document.createElement("div");
            container.innerHTML = string;
            const tagsToReplace = container.querySelectorAll(oldElement);

            tagsToReplace.forEach(oldTag => {
                let newTag = document.createElement(newElement);
                newTag.innerHTML = oldTag.innerHTML;
                oldTag.parentNode.replaceChild(newTag, oldTag);
            });

            return container.innerHTML;
        } else {
            console.warn(
                "To replace an html tag with another, both first and the second must be declared."
            );
            return false;
        }
    },

    cleanSimpleKendoExcelExport(e, kendoContext) {
        e.workbook.sheets[0].rows.forEach(row => {
            row.cells.forEach((cell, index) => {
                if (cell.value) {
                    if (typeof(cell.value) == 'string') {
                        if (cell.value.includes('mini-overview-list')) {
                            cell.value = 'Overview number cannot be exported';
                        }
                        cell.value = cell.value.replace(/<br[^>]*>/gi, '\n');
                        cell.value = $('<textarea>').html(cell.value).text();
                        cell.value = cell.value.replace(/(<([^>]+)>)|([0-9]+\smore...)|(more...)|(less...)|(show less...)|(^ +)|(^(?:[\t ]*(?:\r?\n|\r))+)/gim, '');
                        cell.value = cell.value.replace(/(^ +)|(^(?:[\t ]*(?:\r?\n|\r))+)/gim, '').trim();
                    }
                    if (typeof(cell.value) == 'object'){
                        if (cell.value.toString() == '[object Object]') {
                            cell.value = '';
                        } else {
                            cell.value = cell.value.toString();
                        }
                    }
                }
            })
        })
    },
}