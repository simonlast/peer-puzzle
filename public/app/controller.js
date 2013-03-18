
var Controller = {};

Controller.templates = {
    'start': $('#start-template').html(),
    'canvas': $('#canvas-template').html(),
    'lobby': $('#lobby-template').html(),
};

Controller.name = 'default';
Controller.isMaster = false;
Controller.playerData = null;
Controller.wins = 0;

Controller.startCanvas = function(){
    //init
    $('.canv').remove();
    $('.start').remove();
    $('body').append(Controller.templates['canvas']);
    canvas = document.getElementById("playcanvas");
    pjs = new Processing(canvas, play);

};

Controller.win = function(){
    pjs.exit();
    pjs = null;
    Controller.wins++;
    Controller.startLobby(Controller.name, {'name':Controller.name,
        'players':Controller.playerData.length,
        'start':'play again'});
}


Controller.startLobby = function(name, ctx){
    Controller.name = name;
    Comm.createGame(name);

    var template = Handlebars.compile(Controller.templates['lobby']);
    console.log(ctx);
    if(!ctx)
        ctx = {'name':name, 'players':'loading', 'start':'start'};
    
    var html = template(ctx);

    $('body').append(html);
    $('.startgame').click(function(){
        if(Controller.isMaster && Controller.playerData){
            Comm.signalStart();
            Controller.startCanvas();   
        }
    });       
};

Controller.init = function(){

    $('.newgame').click(function(e){
        var name = window.prompt("what's your name?");
        if(name){
            $('.start').remove();
            //Controller.isMaster = true;
            Controller.startLobby(name);
        }
    });
};

Controller.init();

/*window.onerror = function(msg, url, linenumber) {
    alert('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
    return true;
}*/

if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp */)
  {
    "use strict";
 
    if (this == null)
      throw new TypeError();
 
    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();
 
    var res = [];
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in t)
      {
        var val = t[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, t))
          res.push(val);
      }
    }
 
    return res;
  };
}