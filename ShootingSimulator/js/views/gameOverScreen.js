define(['jquery','Backbone','underscore','./leaderBoard/leaderBoard'], function($, Backbone, _, LeaderBoard) {
    var gameOverScreen = Backbone.View.extend({
        tagname: "div",
        className: "gameOverScreen",
        initialize: function() {
            Backbone.on("ShowScore", this.showScreen, this);
            Backbone.on("HideScore", this.hideScreen, this);
        },
        templateModal: _.template(
            '<div class="datosUsuario">'+
                '<table>'+
                    '<tr>'+
                        '<td>Nombre</td>'+
                        '<td><%= nombre %></td>'+
                    '</tr>'+
                    '<tr>'+
                        '<td>Nivel</td>'+
                        '<td><%= nivel %></td>'+
                    '</tr>'+
                    '<tr>'+
                        '<td>Punteria</td>'+
                        '<td><%= puntos %>%</td>'+
                    '</tr>'+
                '</table>'+
            '</div>'
        ),
        showScreen: function(usuario) {
            this.leaderBoardContainer.empty();
            this.leaderBoardContainer.append(this.templateModal({
                nombre: App.usuario.nombre,
                nivel: App.usuario.nivel,
                puntos: parseInt(App.usuario.puntuacion),
            }));
            $(".gameOverScreen").css("display", "block");
        },
        hideScreen: function() {
            $(".gameOverScreen").css("display", "none");
        },
        render: function() {
            this.leaderBoardContainer = $("<div />", {
                class: "leaderBoardContainer"
            });
            this.salir = $("<input />", {
                type: "button",
                class: "restartButton",
                value: "Salir"
            });
            this.continuar = $("<input />", {
                type: "button",
                class: "restartButton",
                id: 'continuar',
                value: "Continuar"
            });
            this.messageContainer = $("<div />", {
                class: "messageContainer"
            });
            this.leaderBoardContainer.append(this.templateModal({
                nombre: App.usuario.nombre,
                nivel: App.usuario.nivel,
                puntos: App.usuario.puntuacion,
            }));
            this.messageContainer.append(this.leaderBoardContainer);
            this.messageContainer.append(this.salir);
            this.messageContainer.append(this.continuar);
            this.$el.append(this.messageContainer);
        }
    });
    return gameOverScreen;
})
