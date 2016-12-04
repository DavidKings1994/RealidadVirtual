define(['jquery','Backbone','underscore'],  function($, Backbone, _) {
    $(document).ready(function() {
        var PantallaUsuario = Backbone.View.extend({
            tagname: "div",
            className: "PantallaUsuario",
            initialize: function() {
                this.render();
            },
            events: {
                'click #botonComenzar': 'comenzar'
            },
            comenzar: function() {
                var usuario = $('input[name="nombre"]').val().trim();
                var nivel = $('select[name="niveles"]').val();
                if (usuario != '') {
                    window.location.href = "./ShootingSimulator/#usuario/"+usuario+"/"+nivel;
                }
            },
            templateModal: _.template(
                '<div class="datosUsuario">'+
                    '<table>'+
                        '<tr>'+
                            '<td>Nombre</td>'+
                            '<td><input type="text" name="nombre"></td>'+
                        '</tr>'+
                        '<tr>'+
                            '<td>Nivel</td>'+
                            '<td>'+
                                '<select name="niveles">'+
                                    '<option value="1">1.- Dianas</option>'+
                                    '<option value="2">2.- Objetivos en movimiento</option>'+
                                    '<option value="3">3.- Platillos voladores</option>'+
                                '</select>'+
                            '</td>'+
                        '</tr>'+
                    '</table>'+
                    '<input type="button" id="botonComenzar" value="Comenzar">'+
                    '<a href="./ShootingSimulator/php/download.php">Descargar complementos</a>'+
                '</div>'
            ),
            render: function() {
                this.$el.append(this.templateModal({}));
                $('.contenedorGeneral').append(this.$el);
            }
        });
        var pantallaUsuario = new PantallaUsuario();
    });
});
