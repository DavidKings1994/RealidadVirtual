define(['jquery','Backbone'], function($, Backbone) {
    var leaderBoardRow = Backbone.View.extend({
        tagname: "div",
        className: "leaderBoardRow row",
        initialize: function(parameters) {
            this.url = parameters.url;
            this.name = parameters.name;
            this.score = parameters.score;
        },
        render: function() {
            var pictureContainer = $("<div />", {
                class: "col-sm-4"
            });
            var picture = $("<img />", {
                class: "image",
                src: this.url
            });
            var name = $("<p />", {
                class: "text col-sm-4",
                text: this.name
            });
            var score = $("<p />", {
                class: "text col-sm-4",
                text: this.score
            });
            pictureContainer.append(picture);
            this.$el.append(pictureContainer);
            this.$el.append(name);
            this.$el.append(score);
        }
    });
    return leaderBoardRow;
})
