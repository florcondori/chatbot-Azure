var restify = require('restify');
var builder =  require('botbuilder');

var server = restify.createServer();
server.listen(3978, function(){
    console.log('puerto 3978', server.url);
});

var connector = new builder.ChatConnector({
    appId: '',
    appPassword: ''
});
var options = {
    'arroz con pollo': {
        precio: 10.5,
        name: 'Arroz con Pollo'
    },
    'papa rellena': {
        precio: 10.5,
        name: 'Papa Rellena'
    },
    'tallarin rojo': {
        precio: 10.5,
        name: 'Tallarin Rojo'
    }
}
let store = {};
var bot = new builder.UniversalBot(connector, [
    function(session) {
        builder.Prompts.text(session, 'Cual es su nombre?');
    },
    function(session, result) {
        var msg = `hola ${result.response}`;
        store.name = result.response;
        session.send(msg)
        // builder.Prompts.text(session, 'Cual es tu signo?');
        builder.Prompts.choice(session, 'elija una opcion?',options, {listStyle: builder.ListStyle.button});
    },
    function(session, result) {
        store.menu = result.response.entity;
        store.precio = options[result.response.entity].precio;
        var msg = `Su pedido es: ${store.menu}`;
        session.send(msg);
        builder.Prompts.text(session, 'A que direccion se lo enviamos?');
    },
    function(session,  result) {
        store.direccion = result.response;
        var msg = `Usted a elejido ${store.menu} para la direccion ${store.direccion} siendo el costo ${store.precio}`;
        session.endDialog(msg);
    }
]);
server.post('/api/messages', connector.listen());
