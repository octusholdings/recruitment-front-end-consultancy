/*
 * UserSettingListView
 */
const   Marionette              = require('backbone.marionette'),
        userSetting             = require('../models/UserSetting'),
        BroadbeanUserSetting    = require('../models/BroadbeanUserSetting'),
        stickit                 = require('backbone.stickit'),
        UserPreference          = require('../../admin/user/models/UserPreference'),
        ConfirmDeleteView       = require('../../common/views/ConfirmDeleteView');


module.exports = UserGenericSettingView =  Marionette.ItemView.extend({
    template: require('../templates/userGenericSetting.hbs'),
    bindings: {
        '.only-my-notes' : {
            observe: 'notesShowMine',
            onSet: 'convertToOldModelAndSave'
        },
        '.only-my-tasks' : {
            observe: 'tasksShowMine',
            onSet: 'convertToOldModelAndSave'
        },
        '.only-my-jobs'  : {
            observe: 'jobsShowMine',
            onSet: 'convertToOldModelAndSave'
        },
        '.user-time-zone': {
            observe: 'userTimeZone',
            selectOptions: {
                collection: 'window.Octus.timeZoneList',
                labelPath: 'value',
                valuePath: 'key'
            },
            onSet: 'convertToOldModelAndSave'
        },
        '.broadbean-username': {
            observe: 'broadbeanUsername',
            onSet: 'saveBroadbeanUsername'
        },
        '.reset-user-preference': {
            observe: 'userPreferences',
            selectOptions: {
                defaultOption: { label: function () {return RecruiterApp.polyglot.t('chooseConfigurationToReset'); }, value: null},
                collection: () => {
                    let choices = [
                        { key: 'resetAll', value: RecruiterApp.polyglot.t('resetAll') },
                        { key: 'resetHomeDashboard', value: RecruiterApp.polyglot.t('resetHomeDashboard') },
                        { key: 'resetCandidateGrid', value: RecruiterApp.polyglot.t('resetCandidateGrid') },
                        { key: 'resetCandidateDashboard', value: RecruiterApp.polyglot.t('resetCandidateDashboard') },
                        { key: 'resetClientGrid', value: RecruiterApp.polyglot.t('resetClientGrid') },
                        { key: 'resetClientDashboard', value: RecruiterApp.polyglot.t('resetClientDashboard') },
                        { key: 'resetCompanyGrid', value: RecruiterApp.polyglot.t('resetCompanyGrid') },
                        { key: 'resetCompanyDashboard', value: RecruiterApp.polyglot.t('resetCompanyDashboard') },
                        { key: 'resetJobGrid', value: RecruiterApp.polyglot.t('resetJobGrid') },
                        { key: 'resetJobDashboard', value: RecruiterApp.polyglot.t('resetJobDashboard') },
                        { key: 'resetShortlistGrid', value: RecruiterApp.polyglot.t('resetShortlistGrid') },
                        { key: 'resetActivityGrid', value: RecruiterApp.polyglot.t('resetActivityGrid') }
                    ];
                    return choices;
                },
                labelPath: 'value',
                valuePath: 'key'
            },
            onSet: 'resetUserPreferences'
        }
    },
    initialize(options) {
        this.convertOldModelToNew(options);
    },
    onRender() {
        this.stickit();
    },
    onShow() {
        this.$timeZonePicker = this.$('.user-time-zone');

        this.$timeZonePicker.select2({
            placeholder: RecruiterApp.polyglot.t('chooseOne'),
            closeOnSelect: true
        });
    },
    convertOldModelToNew(options) {
        options.oldSettings.models.forEach(item => {
            switch (item.attributes.key) {
                case 'current.job.flow.showMine': 
                    this.model.set('jobsShowMine', item.attributes.value == 'true' ? true : false);
                    break;
                case 'tasks.showMine': 
                    this.model.set('tasksShowMine', item.attributes.value == 'true' ? true : false);
                    break;
                case 'notes.showMine': 
                    this.model.set('notesShowMine', item.attributes.value == 'true' ? true : false);
                    break;
                case 'broadbean.username':
                    this.model.set('broadbeanUsername', item.attributes.value);
                    break;
                case 'USER_TIMEZONE': 
                    this.model.set('userTimeZone', item.attributes.value);
                    break;
                default: break;
            }
        });
    },
    convertToOldModelAndSave(value, options) {
        var key = options.observe;
        var value;
        switch (key) {
            case 'jobsShowMine':
                key = 'current.job.flow.showMine';
                break;
            case 'tasksShowMine':
                key = 'tasks.showMine';
                break;
            case 'notesShowMine':
                key = 'notes.showMine';
                break;
            case 'userTimeZone':
                key = 'USER_TIMEZONE';
                break;
            default: break;
        }
        var oldModel = new UserSetting({ key: key, value: value });

        if (oldModel.isValid(true)) {
            console.log(oldModel.attributes);
            oldModel.save(null, { 
                success: (model, response) => {
                    RecruiterApp.core.vent.trigger('app:message:info', RecruiterApp.polyglot.t('settingSaved'));
                }, 
                error: (xhr) => {
                    console.error(xhr);
                    RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t('errorSavingSetting'));
                }
            });
        } else if (!oldModel.get('value') && oldModel.get('key')) {
            oldModel.destroy({ 
                success: (model, response) => {
                    RecruiterApp.core.vent.trigger('app:message:info', RecruiterApp.polyglot.t('settingSaved'));
                }, 
                error: (xhr) => {
                    console.error(xhr);
                    RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t('errorSavingSetting'));
                }
            });
        } else {
            RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t('settingNotSaved'));
        }

        return value;
    },
    broadbeanUsernameTimeout: null,
    saveBroadbeanUsername(value, options) {
        clearTimeout(this.broadbeanUsernameTimeout);
        this.broadbeanUsernameTimeout = setTimeout(() => { 
            var userSetting = new BroadbeanUserSetting({ key: 'broadbean.username', value: value });
            userSetting.save(
                null, 
                { 
                    success: (model, response) => {
                        RecruiterApp.core.vent.trigger('app:message:info', RecruiterApp.polyglot.t('settingSaved'));
                    }, 
                    error: (xhr) => {
                        console.error(xhr);
                        RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t('errorSavingSetting'));
                    }
                }
            );

        }, 1000);
        return value;
    },
    resetUserPreferences(value, options) {

        if (value) {

            // Create user confirmation modal 
            var confirmDeleteView = new ConfirmDeleteView({
                message: 'confirmResetUserPreferenceUpdated',
                model: new Backbone.Model({
                      toDelete: value
                  })
            });
            
            confirmDeleteView.on('cancelDelete', () => {
                this.model.set('userPreferences', null);
            });

            confirmDeleteView.on('deleteConfirmed', () => {

                RecruiterApp.core.vent.trigger('app:modal:close');            
                
                RecruiterApp.core.vent.trigger('blockUI', RecruiterApp.polyglot.t('loading'));

                new UserPreference({ key: value }).destroy({ 

                        success: (model, response) => {

                            // reload user preferences to localStorage
                            RecruiterApp.core.resetUserPreferences();
                            RecruiterApp.core.loadUserPreferences();

                            RecruiterApp.core.vent.trigger('unBlockUI');
                            // Close user confirmation modal
                            RecruiterApp.core.vent.trigger('app:message:info', RecruiterApp.polyglot.t('userPreferenceUpdatedSuccessfully') );
                        }, 
                        error: (xhr) => {
                            RecruiterApp.core.vent.trigger('unBlockUI');
                            // Close user confirmation modal
                            RecruiterApp.core.vent.trigger('app:message:error', RecruiterApp.polyglot.t('errorSavingSetting'));
                        }

                    });    

            });

            // Show user confirmation modal
            RecruiterApp.core.vent.trigger('app:modal:show', confirmDeleteView);
        
        }

    }

});
