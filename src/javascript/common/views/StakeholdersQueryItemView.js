/*
 * StakeholdersQueryItemView
 */
var Marionette = require('backbone.marionette'),
    Typeahead = require('corejs-typeahead'),
    Bloodhound = require('bloodhound'),
    Session = require('../../session/models/Session'),
    stickit = require('backbone.stickit');

module.exports = StakeholdersQueryItemView = Marionette.ItemView.extend({
    template: require('../templates/stakeholdersQueryItem.hbs'),

    onBeforeRender: function () {
        if (!this.model) this.model = new Backbone.Model();
        this.model.set('filterType', this.options.type);
        this.model.set('displayName', this.options.displayName);
    },

    onShow: function() {
        this.updateSelectHtml();
        this.initselect2();
    },

    initselect2: function () {
        var self    = this;
        var selectInput = self.$el.find("select.form-control.select-input");
        var dataurl = self.getURL();

        selectInput.select2({
            placeholder: RecruiterApp.polyglot.t(self.model.get('filterType')),
            ajax: {
                url: dataurl,
                delay: 500,
                data: function (param) {
                    return query = { criteria: param.term }
                },
                processResults: function (data, params) {
                    params.page = params.page || 1;
                    var modelData = self.getModelData();

                    var _data = _.filter(data, function(dat) {
                        if (modelData.indexOf(dat.id) == -1 || _.findWhere(modelData, {id: dat.id})) {
                            if (self.options.type == 'candidate' || self.options.type == 'client') {
                                if (dat.firstName.indexOf("FIRST NAME NOT FOUND") == -1) {
                                    return dat;
                                }
                            } else if (self.options.type == 'company') {
                                if (!_.isUndefined(dat.name)) {
                                    return dat;
                                }
                            } else if (self.options.type == 'job') {
                                if (!_.isUndefined(dat.title)) {
                                    return dat;
                                }
                            }
                        }
                    });
                    
                    return {
                        results: _data,
                        pagination: {
                            more: (params.page * 30) < data.total_count
                        }
                    }
                },
                cache: false
            },
            escapeMarkup: function (markup) { return markup; },
            minimumInputLength: 1,
            closeOnSelect: true,
            templateResult: function (repo) { 
                return self.formatReturn(repo); 
            },
            templateSelection: function (repo) { 
                return self.formatReturnSelection(repo); 
            },
            dropdownParent: $('#defaultModal')
        });

        selectInput.on('select2:select', function (e) { self.updateSelect(e) })
        selectInput.on('select2:unselect', function (e) { self.updateSelect(e) })
    },
    getURL: function () {
        if (this.options.type == 'candidate')   return RecruiterApp.config.API_ROOT + '/people/list/candidate/0/10';
        if (this.options.type == 'client')      return RecruiterApp.config.API_ROOT + '/people/list/client/0/10';
        if (this.options.type == 'company')     return RecruiterApp.config.API_ROOT + '/company/list/0/10';
        if (this.options.type == 'job')         return RecruiterApp.config.API_ROOT + '/jobPosting/list/0/10';
    },
    getList: function () {
        if (this.options.type == 'candidate')   return this.model.get('candidateList');
        if (this.options.type == 'client')      return this.model.get('clientList');
        if (this.options.type == 'company')     return this.model.get('companyList');
        if (this.options.type == 'job')         return this.model.get('jobList');
    },
    getModelData: function () {
        var datalist = this.getList();
        var modelData = [];

        if (!_.isUndefined(datalist)) {
            if (_.isArray(datalist)) {
                modelData = datalist;
            } else {
                modelData = datalist.toJSON();
            }
        }
        return modelData;  
    },
    updateSelect: function (e) {
        var repo = e.params.data;
        var modelData = this.getModelData();

        if (e.type == 'select2:select') {
            if (_.isUndefined(_.findWhere(modelData, {id: repo.id}))) {
                var res = { id: repo.id };

                if (this.options.type == 'candidate' || this.options.type == 'client') {
                    res.value = repo.firstName + " " + repo.lastName;
                } else if (this.options.type == 'company') {
                    res.value = repo.name
                } else if (this.options.type == 'job') {
                    res.value = repo.title
                }

                this.addToPersistentStakeholdersFilter(this.options.type, res.value, repo.id);
                modelData.push(res)
            };
        } else if (e.type == 'select2:unselect') {
            modelData = _.filter(modelData, function(model) {
                return model.id != e.params.data.id;
            });
            this.removeFromPersistentStakeholdersFilter(this.options.type, repo.id);
        }


        this.trigger('selected', modelData);
    },

    //We are saving the filters chosen in the stakeholders modal
    //to localstorage in case we don't have data to get names from IDs
    //when sending it to kendoGrid filter.
    addToPersistentStakeholdersFilter: function(type, value, id) {
        var persistentStakeholdersFilter = JSON.parse(localStorage.getItem("persistentStakeholdersFilter")) || {candidate:[], client:[], company:[], job:[]},
            itemExists,
            itemExistsInThisList;
        _.each(persistentStakeholdersFilter, function(list){
            itemExistsInThisList = _.findWhere(list, {id: id});
            if (itemExistsInThisList) {
                itemExists = itemExistsInThisList;
            }
        });
        if (!itemExists){
            persistentStakeholdersFilter[type].push({id: id, value: value});
            localStorage.setItem("persistentStakeholdersFilter", JSON.stringify(persistentStakeholdersFilter));
        }
    },

    removeFromPersistentStakeholdersFilter: function(type, id) {
        var persistentStakeholdersFilter = JSON.parse(localStorage.getItem("persistentStakeholdersFilter"));
        persistentStakeholdersFilter[type] =_.filter(persistentStakeholdersFilter[type], function(item){
            return item.id != id;
        });
        localStorage.setItem("persistentStakeholdersFilter", JSON.stringify(persistentStakeholdersFilter));
    },

    updateSelectHtml: function () {
        var self = this;

        if (self.$el.find('select.select2').data('select2')) {
            self.$el.find('select.select2').select2('destroy');
        }
        self.$el.find('select.select2').html('');

        var currList = self.options.type,
            currListArray = self.model.get(currList + "List"),
            dat = [];

        if (!_.isUndefined(currListArray)) {
            dat = _.isArray(currListArray) ? currListArray : currListArray.toJSON()
        }
        
        _.each(dat, function(da) {
            self.$el.find('select.select2').append('<option value="' + da.id + '" selected="selected">' + da.name + '</option>');
        });    

        self.initselect2();      
    },
    formatReturn: function (repo) {
        var response = "";

        if (this.options.type == 'candidate' || this.options.type == 'client') {
            var email = _.isNull(repo.email) || _.isUndefined(repo.email) ? "" : " <code>" + repo.email + "</code> ";
            response = repo.firstName + " " + repo.lastName + email;
        } else if (this.options.type == 'company') {
            var website = _.isNull(repo.website) || _.isUndefined(repo.website) ? "" : " <code>" + repo.website.replace(/^https?\:\/\//i, "") + "</code> ";
            response = repo.name + " " + website;
        } else if (this.options.type == 'job') {
            var company = _.isNull(repo.company) || _.isUndefined(repo.company) ? "" : " <code>" + repo.company + "</code> ";
            response = repo.title + " " + company;
        }

        return "<div class='select2-result-repository clearfix'><div class='select2-result-repository__meta'><div class='select2-result-repository__title' >" + response + "</div></div>";
    },
    formatReturnSelection: function(repo) {
        if (repo.firstName && repo.lastName) {
            return repo.firstName + ' ' + repo.lastName;
        } else if (repo.name) {
            return repo.name;
        } else if (repo.title) {
            return repo.title;
        } else if (repo.text) {
            return repo.text;
        }
    },
    disableThis: function () {
        this.$el.find('select').prop("disabled", true);
    }
});