
var Comm = {};

Comm.socket = io.connect(window.location.href);
Comm.id = '';

Comm.socket.on('data', function(d){
	console.log(d);
});

Comm.createGame = function(name){
	var dimen = {'width':$(window).width(), 'height':$(window).height()};
	Comm.socket.emit('join', {'room': name, 'dimen':dimen});
}

Comm.signalStart = function(){
	Comm.socket.emit('start', '');
}

Comm.transferBall = function(id){
	console.log("transfer to: " + id);
	Comm.socket.emit('transfer', {'id': id});
}

Comm.socket.on('start', function(data){
	if(!Controller.isMaster && !pjs){
		$('.start').remove();
		Comm.signalStart();
		Controller.startCanvas();
	}
	
});

Comm.socket.on('update_room', function(data){
	$('.lobby_players').html(data.num);
	Comm.id = Comm.socket.socket.sessionid;
	Controller.playerData = data;
});

Comm.socket.on('transfer', function(data){
	console.log(data);
	pjs.transfer(data.from);
});

