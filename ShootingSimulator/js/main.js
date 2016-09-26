define(['jquery', "./game/KingsGame"],  function($, KingsGame) {
	$(document).ready(function() {
		$("#gameContainer").initGame({
			pointerLocked: true,
			oculusShader: false,
			colorTracking: false
		});
    });
});
