var Spinner = require('spin'),
    Backbone = require('backbone'),
    Marionette = require('backbone.marionette');

module.exports = SpinnerView = Marionette.ItemView.extend({
    template: require('../templates/spinner.hbs'),
    initialize: function (options) {
        this.radius = (options.radius)? options.radius: 12 ;
        this.length = (options.length)? options.length: 12 ;
        this.lines  = (options.lines)? options.lines: 13 ;
        this.area   = options.area;

        this.options = {
            lines: this.lines, // The number of lines to draw
            length: this.length, // The length of each line
            width: 3, // The line thickness
            radius: this.radius, // The radius of the inner circle
            corners: 1, // Corner roundness (0..1)
            rotate: 0, // The rotation offset
            color: "#000", // #rgb or #rrggbb
            speed: 1, // Rounds per second
            trail: 45, // Afterglow percentage
            shadow: false, // Whether to render a shadow
            hwaccel: false, // Whether to use hardware acceleration
            className: "spinner", // The CSS class to assign to the spinner
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            top: "30%", // Top position relative to parent in px
            //position: 'absolute',
            left: "50%" // Left position relative to parent in px
        };
    },
    onRender: function () {
        // $('#'+this.area).block({ message: null,timeout: 1300});
        var spinner = new Spinner(this.options).spin();
        this.el.appendChild(spinner.el);
    }
});