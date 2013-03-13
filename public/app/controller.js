
var Controller = {};

var iOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/i) ? true : false );

Controller.templates = {
    'start': $('#start-template').html(),
    'canvas': $('#canvas-template').html(),
    'lobby': $('#lobby-template').html(),
};

Controller.name = 'default';
Controller.isMaster = false;
Controller.playerData = [];

var bindTouch = function(el, callback){
    if(iOS){
        el.bind('touchstart', function(e){
            e.stopPropagation();
            callback(e);
        });
    }else{
        el.click(function(e){
            callback(e);
        });
    }
    
};

Controller.startCanvas = function(){
    //init
    $('body').append(Controller.templates['canvas']);
    canvas = document.getElementById("playcanvas");
    pjs = new Processing(canvas, play);

};

Controller.startLobby = function(name){
    Controller.name = name;
    Comm.createGame(name);

    var template = Handlebars.compile(Controller.templates['lobby']);
    var context = {'name':name, 'players':1, 'start':'waiting'};
    if(Controller.isMaster){
        context['start'] = 'start';
    }
    var html = template(context);
    $('body').append(html);
    
    if(Controller.isMaster){
         $('.startgame').click(function(){
            $('.start').remove();
            Comm.signalStart();
            Controller.startCanvas();
        });       
    }


};

Controller.init = function(){

    $('.newgame').click(function(e){
        var name = window.prompt("what's your name?");
        if(name){
            $('.start').remove();
            Controller.isMaster = true;
            Controller.startLobby(name);
        }
    });
    $('.joingame').click(function(e){
        var name = window.prompt("what's the name of the game?");
        if(name){
            $('.start').remove();
            Controller.startLobby(name);
        }

    });
};

Controller.init();

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