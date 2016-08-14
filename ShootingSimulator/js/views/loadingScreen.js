define(['jquery','Backbone'], function($, Backbone) {
    var loadingScreen = Backbone.View.extend({
        tagname: "div",
        className: "loadingScreen",
        initialize: function() {
            Backbone.on('loading', this.updateLoadingBar, this);
            Backbone.on('done', this.hideLoadingScreen, this);
        },
        updateLoadingBar: function(percentComplete) {
            $(this.barProgress).attr("aria-valuenow", percentComplete);
            $(this.barProgress).css("width", percentComplete + "%");
            $(this.barProgress).html(percentComplete + "%");
        },
        hideLoadingScreen: function() {
            if($(this.barProgress).attr("aria-valuenow") == 100) {
                $(this.$el).css("display", "none");
            }
        },
        render: function() {
            var bar = $("<div />", {
                class: "progress"
            });
            this.barProgress = $("<div />", {
                class: "progress-bar progress-bar-striped active",
                text: "0%",
            });
            $(this.barProgress).attr("role", "progressbar");
            $(this.barProgress).attr("aria-valuemin", "0");
            $(this.barProgress).attr("aria-valuemax", "100");
            $(this.barProgress).attr("aria-valuenow", "0");
            bar.append(this.barProgress);
            this.$el.append(bar);
        }
    });
    return loadingScreen;
})
