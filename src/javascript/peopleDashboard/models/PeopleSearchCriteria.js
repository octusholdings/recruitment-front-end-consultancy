/*
 * PeopleSearchCriteria
 */
var Backbone = require('backbone'),
    ValidatedModel = require('../../common/models/ValidatedModel');
module.exports = PeopleSearchCriteria = ValidatedModel.extend({
    initialize: function() {

        this.setupValidation();
    },
  validation: {
        criteria: {
            required: true
        }
    }
});