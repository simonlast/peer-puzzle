
var storage = require('./persist');

var io;
var sockets = [];

storage.init();

var updateSockets = function(room){
	var arr = io.sockets.clients(room);
	var dataArr = [];
	for(var i=0; i<arr.length; i++){
		dataArr.push(arr[i].customData);
	}
	var num = arr.length;
	console.log(num + " in " + room);
	io.sockets.in(room).emit('update_room', {'num': num, 'others':dataArr});
}

var connect = function(socket){

	socket.customData = {};

	socket.on('join', function(data){
		var room = data.room;
		socket.join(room);
		socket.customData.dimen = data.dimen;
		socket.customData.id = socket.id;
		updateSockets(room);
	});

	socket.on('request', function(data){

	});

	socket.on('start', function(data){
		io.sockets.in(socket.room).emit('start', '');
	});

	socket.on('notifyWin', function(data){
		console.log("win");
		io.sockets.in(socket.room).emit('notifyWin', '');
	});

	socket.on('transfer', function(data){
		var other = io.sockets.sockets[data.id];
		console.log(other.id);
		other.emit('transfer', {from: socket.id});
	});

	/*socket.on('disconnect', function(){
		updateSockets(socket.room);
	});*/
}


exports.init = function(cio){
	io = cio;
	io.sockets.on('connection', connect);
}