/*
 * PageControl
 */
var Backbone = require('backbone');
module.exports = PageControl = Backbone.Model.extend({

    UpdatePageControl : function(collection) {

        console.log("Updating page control", collection);
        this.set("page", collection.page);
        this.set("pageSize", collection.pageSize);
        this.set("totalPages", collection.totalPages);
        this.set("totalResults", collection.totalResults);

        var pageList = [];

        if (collection.page < collection.totalPages) {
            this.set('hasNextPage', true);
        } else {
            this.set('hasNextPage', false);
        }

        if (collection.page > 1) {
            this.set('hasPreviousPage', true)
        } else {
            this.set('hasPreviousPage', false);
        }


        if (collection.page <= 5) {
            if (collection.totalPages < 5) {
                for (var i=1; i<=collection.totalPages; i++) {
                    pageList[i-1] = i;
                }
            } else {
                pageList = [1,2,3,4,5];
            }
        } else if (collection.page >= 5) {
            var arrCounter = 0;
            for (var i=collection.page-2; i<=collection.page+2; i++) {
                pageList[arrCounter++] = i;
            }
        }
        this.set("pageList", pageList);
    }
});



