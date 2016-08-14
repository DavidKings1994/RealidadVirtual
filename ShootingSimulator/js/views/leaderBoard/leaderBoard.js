define(['jquery','Backbone','./leaderBoardRow'], function($, Backbone, LeaderBoardRow) {
    var leaderBoard = Backbone.View.extend({
        tagname: "div",
        className: "leaderBoard",
        initialize: function(parameters) {
            this.data = parameters.data;
        },
        render: function() {
            for (var i = 0; i < this.data.length; i++) {
                var row = new LeaderBoardRow({
                    url: this.data[i].urlFoto,
                    name: this.data[i].usuario,
                    score: this.data[i].puntos
                });
                row.render();
                this.$el.append(row.$el);
            }
        }
    });
    return leaderBoard;
})
