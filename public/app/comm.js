
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

Comm.notifyWin = function(){
	Comm.socket.emit('notifyWin','');
}

Comm.socket.on('start', function(data){
	if(!Controller.isMaster && !pjs && Controller.playerData){
		$('.start').remove();
		Comm.signalStart();
		Controller.startCanvas();
	}
});

Comm.socket.on('notifyWin', function(data){
	console.log("WIN!!");
	//Controller.isMaster = false;
	if(pjs){
		Controller.win();
	}
});

Comm.socket.on('update_room', function(data){
	$('.lobby_players').html(data.num);
	//$('.lobby_players').addClass('swing');
	Comm.id = Comm.socket.socket.sessionid;
	Controller.playerData = data;
	if(Comm.id === Controller.playerData.others[0].id){
		Controller.isMaster = true;
		$('.startgame').removeClass('inactive');
	}else{
		Controller.isMaster = false;
	}
});

Comm.socket.on('transfer', function(data){
	console.log(data);
	pjs.transfer(data.from);
});

