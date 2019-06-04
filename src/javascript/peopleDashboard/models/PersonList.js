/*
 * PeopleList
 */
var Backbone = require('backbone'),
    PageControl = require('../../pagination/PageControl'),
    Person = require('./Person');

module.exports = PeopleList = Backbone.Collection.extend({
    model: Person,

    parse: function (response) {
        this.pageControl = new PageControl({
            page: response.page, pageSize: response.pageSize, totalPages: response.totalPages, totalResults: response.totalResults
        });
        this.pageControl.set("page", response.page);
        this.pageControl.set("pageSize", response.pageSize);
        this.pageControl.set("totalPages", response.totalPages);
        this.pageControl.set("totalResults", response.totalResults);
        this.page = response.page;
        this.pageSize = response.pageSize;
        this.totalPages = response.totalPages;
        this.totalResults = response.totalResults;

        return response.results;
    },
    url: function () {

        if (this.criteria != undefined) {
            return RecruiterApp.config.API_ROOT + '/people/' + this.type + '/list/' + this.page + '/' + this.pageSize + "?criteria=" + this.criteria;
        } else {
            return RecruiterApp.config.API_ROOT + '/people/' + this.type + '/list/' + this.page + '/' + this.pageSize;
        }
    }
});


