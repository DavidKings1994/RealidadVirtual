define(['jquery', "./game/KingsGame"],  function($, KingsGame) {
	$(document).ready(function() {
		window.App = {
			Models: {},
			Collections: {},
			Views: {},
			Router: {}
		};

		App.Router = Backbone.Router.extend({
			routes: {
				'': 'default',
				'usuario/:nombre/:nivel': 'simulador',
				'*default': 'default'
			},

			simulador: function(nombre,nivel) {
				document.title = 'Simulador de Disparo';
				App.usuario = {
					nombre: nombre,
					nivel: parseInt(nivel),
					puntuacion: 0
				};
				$("#gameContainer").initGame({
					pointerLocked: true,
					oculusShader: false,
					colorTracking: false
				});
			},

			default: function() {
				window.location.replace("./../index.html");
			}
		});

		new App.Router;
		Backbone.history.start();
	});
});
