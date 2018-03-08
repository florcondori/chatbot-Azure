var builder = require('botbuilder');
var restify = require('restify');

var server = restify.createServer();

server.listen(3978, function(){
    console.log('puerto 3978', server.url);
});

var connector = new builder.ChatConnector({
    appId: '',
    appPassword: ''
});

var bot = new builder.UniversalBot(connector, [
    function (session) {
         builder.Prompts.text(session, '¡Hola! Bienvenido ¿Cúal es su nombre?')
    },
    function (session, results) {
        store.name = results.response;
        session.send('Hola, %s', store.name)
        builder.Prompts.choice(session, 'Estos son nuestros servivios:', serviceList, { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        var option = results.response.entity;
        store.service = option;
        var order = serviceList[option];
        session.beginDialog( order.dialogId );
    },
    function (session, results) {
        var msg = '';
        var card;
        
        if(store.service.toLowerCase() == 'otros'){
            msg =  `Sr(a):  ${store.name}, su servicio de ${store.style} será entregado el ${store.date} en ${store.where} .`;
            card = facturaOtros(session);
        }else{
            msg =  `Sr(a):  ${store.name}, su pastel de ${store.service} de ${store.level} piso(s) será entregado el ${store.date} en ${store.where} .`;
            card = facturaTorta(session);
        }
        
        session.send(msg);

        var fact = new builder.Message(session).addAttachment(card);
        
        session.send(fact);
        session.endDialog('Gracias por su preferencia');
    }
]);

var store = {
    name : '',
    service : '',
    style: '',
    topic: '',
    level: '',
    where: '',
    date: '',
    schedule: ''
}

var serviceList = {
    'Bodas': {
        dialogId: 'bodas'
    },
    'Cumpleaños': {
        dialogId: 'cumple'
    },
    'Otros':{
        dialogId: 'otros'
    }
};

var options = {
    'tematica': {
        id: 1
    },
    'clasica': {
        id: 2
    }
};

var cumpleOptions = ['infantil', 'quinceañero', 'otros'];
var otrosOptions = ['catering', 'bocaditos'];

bot.dialog('bodas', [
    function(session) {
        builder.Prompts.choice(session, 'Que estilo deseas', options, { listStyle: builder.ListStyle.button });
    },function(session, results) {
        var option = results.response.entity;
        store.style = option;
        session.beginDialog(option);
    }, function (session) {
        session.endDialog('Ok listo.');
    }
]);

bot.dialog('cumple', [
    function(session) {
        builder.Prompts.choice(session, 'Que tipo de cumpleaños realizaras:', cumpleOptions, { listStyle: builder.ListStyle.button });
    },function(session, results) {
        var typeCumple = results.response.entity;
        builder.Prompts.choice(session, `Que estilo deseas para tu fiesta de cumpleaños, ${store.name}`, options, { listStyle: builder.ListStyle.button });
    }, function (session, results) {
        var option = results.response.entity;
        store.style = option;
        session.beginDialog(option);
    },
    function(session){
        session.endDialog('Ok listo.');
    }
])


bot.dialog('otros', [
    function(session) {
        builder.Prompts.choice(session, 'Tambien ofrecemos los servicios de:', otrosOptions, { listStyle: builder.ListStyle.button });
    },function(session, results) {
        var option = results.response.entity;
        store.style = option;

        var card = poster(session);
        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);

        builder.Prompts.attachment(session, '¿suba su pedido?');
    }, function (session, results) {
        session.beginDialog('adicional');

    }
]);

bot.dialog('tematica', [
    function(session) {
        builder.Prompts.text(session, `¿Cuál es el tema para su pastel de ${store.service}`);
    },
    function(session, results) {
        store.topic = results.response;
        builder.Prompts.attachment(session, `Por favor ingresa una foto referencial sobre ${store.topic}`);
    },
    function(session, results){
        var img =  results.response;
        builder.Prompts.number(session, 'Perfecto, ¿De cuántos pisos será su pastel?');
    },
    function (session, results) {
        store.level = results.response;
        session.beginDialog('adicional');
    }
]);

bot.dialog('clasica', [
    function(session){
        var card = poster(session);
        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);

        builder.Prompts.text(session, '¿Ingrese el codigo del pastel?');
    },
    function(session, results){
        var codeCake = results.response;
        builder.Prompts.number(session, 'Perfecto, ¿De cuántos pisos será su pastel?');
    },
    function(session,results){
        store.level = results.response;
        session.beginDialog('adicional');
    }
]);

bot.dialog('adicional', [
    function(session) {
        builder.Prompts.text(session, '¿A qué dirección lo hacemos llegar?');
    },
    function(session, results) {
        store.where = results.response;
        builder.Prompts.text(session, '¿Ingrese la fecha de la entrega?');
    },
    function(session, results){
        store.date = results.response;
        builder.Prompts.text(session, '¿Ingrese el horario de la entrega?');
    },
    function(session, results){
        store.schedule = results.response;
        session.endDialog();
    }
]);


function poster(session) {
    return new builder.HeroCard(session)
        .title('Lista y codigo de pasteles')
        .subtitle('el buen sabor de la excelencia')
        .images([
            builder.CardImage.create(session, 'http://staticcl.lavozdelinterior.com.ar/files/imagecache/ficha_aviso_498_420_sc/avisos/aviso_varios/FOLLETO%20COCCINELLA%20REDU..JPG')
        ])
        .buttons([
            builder.CardAction.openUrl(session, 'http://dulcepaladar.com', 'visitar sitio web')
        ]);
}

function facturaTorta(session) {
    return new builder.ReceiptCard(session)
        .title(store.name)
        .facts([
            builder.Fact.create(session, 'N°582', 'Order Number'),
            builder.Fact.create(session, 'visa253****', 'Payment Method')
        ])
        .items([
            builder.ReceiptItem.create(session, '$ 150.00 ', ` pastel de ${store.level} piso(s) para ${store.service}`)
                .quantity(368)
                .image(builder.CardImage.create(session, 'https://github.com/amido/azure-vector-icons/raw/master/renders/traffic-manager.png')),
        ])
        .tax('$ 7.50')
        .total('$. 150.00');
}

function facturaOtros(session) {
    return new builder.ReceiptCard(session)
        .title(store.name)
        .facts([
            builder.Fact.create(session, 'N°583', 'Order Number'),
            builder.Fact.create(session, 'VISA 5555-****', 'Payment Method')
        ])
        .items([
            builder.ReceiptItem.create(session, '$ 70.80', store.style)
                .quantity(368)
        ])
        .tax('$ 7.50')
        .total('$ 70.80');
}


server.post('/api/messages', connector.listen());