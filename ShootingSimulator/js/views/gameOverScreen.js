define(['jquery','Backbone','./leaderBoard/leaderBoard'], function($, Backbone, LeaderBoard) {
    var gameOverScreen = Backbone.View.extend({
        tagname: "div",
        className: "gameOverScreen",
        initialize: function() {
            Backbone.on("gameOver", this.showScreen, this);
            Backbone.on("gameOver", this.checkLoginState, this);
            Backbone.on("restart", this.hideScreen, this);
            var self = this;
            window.fbAsyncInit = function() {
                FB.init({
                    appId      : '1652597161732445',
                    cookie     : true,
                    xfbml      : true,
                    version    : 'v2.2'
                });

                FB.Event.subscribe('auth.login', function(response) {
                    self.checkLoginState();
                });

                FB.Event.subscribe('auth.logout', function(response) {
                    self.checkLoginState();
                });

                FB.getLoginStatus(function(response) {
                    self.statusChangeCallback(response);
                });

            };

            (function(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                js = d.createElement(s); js.id = id;
                js.src = "//connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
        },
        uploadInformation: function(parameters) {
            var self = this;
            $.post("./../../php/registro.php",
            {
                nombre: parameters.name,
                puntos: parseInt(parameters.score.toString()),
                idPuntuacion: parameters.id.toString(),
                urlFoto: parameters.url
            },
            function(data, status){
                self.downloadInformation();
            });
        },
        downloadInformation: function() {
            $.post("./../../php/consulta.php",{},
            function(json, status){
                var query = $.parseJSON(json);
                var leaderBoard = new LeaderBoard({ data: query });
                leaderBoard.render();
                $(".leaderBoardContainer").empty();
                $(".leaderBoardContainer").append(leaderBoard.$el);
            });
        },
        checkLoginState: function() {
            var self = this;
            FB.getLoginStatus(function(response) {
                self.statusChangeCallback(response);
            });
        },
        testAPI: function() {
            var self = this;
            FB.api('/me', function(response) {
                var _id = response.id;
                var _name = response.name;
                FB.api("/"+response.id+"/picture?redirect=0", function (response) {
                    if (response && !response.error) {
                        self.uploadInformation({
                            name: _name,
                            score: puntuacion.innerHTML,
                            id: _id,
                            url: response.data.url
                        });
                    }
                });
            });
        },
        statusChangeCallback: function(response) {
            if (response.status === 'connected') {
                this.testAPI();
            } else if (response.status === 'not_authorized') {

            } else {

            }
        },
        showScreen: function() {
            $(".gameOverScreen").css("display", "block");
        },
        hideScreen: function() {
            $(".gameOverScreen").css("display", "none");
        },
        render: function() {
            this.leaderBoardContainer = $("<div />", {
                class: "leaderBoardContainer"
            });
            this.button = $("<input />", {
                type: "button",
                id: "restartButton",
                value: "Try again!"
            });
            var messageContainer = $("<div />", {
                class: "messageContainer"
            });
            var likeButton = $("<div />", {
                class: "fb-like",
                css: {
                    "display": "block"
                }
            });
            $(likeButton).attr("data-layout","button_count");
            //$(likeButton).attr("data-href","multimediainteractiva.ga");
            $(likeButton).attr("data-share","true");
            $(likeButton).attr("data-width","450");
            $(likeButton).attr("data-show-faces","true");
            var loginButton = $("<fb:login-button />", {});
            $(loginButton).on("login", this.checkLoginState);
            $(loginButton).attr("data-scope", "public_profile,email");
            $(loginButton).attr("auto_logout_link","true");
            $(loginButton).attr("enable_profile_selector","true");
            $(loginButton).attr("return_scopes","true");
            messageContainer.append(loginButton);
            messageContainer.append(this.leaderBoardContainer);
            messageContainer.append(this.button);
            messageContainer.append(likeButton);
            this.$el.append(messageContainer);
        }
    });
    return gameOverScreen;
})
