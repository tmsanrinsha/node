
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');
var nib = require('nib'); // 追加
var stylus = require('stylus')

var app = module.exports = express.createServer();
var io  = require('socket.io').listen(app); //追加

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  //app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

  // 追加
  function compile (str, path) {
    return stylus(str)
      .set('filename', path)
      .use(nib());
  };
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

/**
 * App listen.
 */

app.listen(3000, function () {
  var addr = app.address();
  //console.log('   app listening on http://' + addr.address + ':' + addr.port);
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

// 追加↓
//app.listen(3000);
//io.sockets.on('connection', function (socket) {
//    socket.emit('news', { hello: 'world' });
//    socket.on('my other event', function (data) {
//        console.log(data);
//    });
//});
// 追加↑

//console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

/**
 * Socket.IO server (single process only)
 */

var nicknames = {};

io.sockets.on('connection', function (socket) {
  socket.on('user message', function (msg) {
    socket.broadcast.emit('user message', socket.nickname, msg);
  });

  socket.on('nickname', function (nick, fn) {
    if (nicknames[nick]) {
      fn(true);
    } else {
      fn(false);
      nicknames[nick] = socket.nickname = nick;
      socket.broadcast.emit('announcement', nick + ' connected');
      io.sockets.emit('nicknames', nicknames);
    }
  });

  socket.on('disconnect', function () {
    if (!socket.nickname) return;

    delete nicknames[socket.nickname];
    socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
    socket.broadcast.emit('nicknames', nicknames);
  });
});
