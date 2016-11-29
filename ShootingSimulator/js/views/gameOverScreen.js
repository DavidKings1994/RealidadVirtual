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
                        '<td>Puntuacion</td>'+
                        '<td><%= puntos %></td>'+
                    '</tr>'+
                '</table>'+
            '</div>'
        ),
        showScreen: function(usuario) {
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
            var messageContainer = $("<div />", {
                class: "messageContainer"
            });
            this.leaderBoardContainer.append(this.templateModal({
                nombre: App.usuario.nombre,
                nivel: App.usuario.nivel,
                puntos: App.usuario.puntuacion,
            }));
            messageContainer.append(this.leaderBoardContainer);
            messageContainer.append(this.salir);
            messageContainer.append(this.continuar);
            this.$el.append(messageContainer);
        }
    });
    return gameOverScreen;
})
