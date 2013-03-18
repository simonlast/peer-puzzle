
var canvas, pjs;

var play = function(pjs) {

	var bkg = pjs.color(89,79,79);
	var mazeCol = pjs.color(250);
	var ballCol = pjs.color(69,173,168);
	var goalCol = pjs.color(157,224,173);
	var ball;
	var ballDimen;
	var maze;
	var start;
	var end;
	var mazeDimen;
	var padding;
	var maxAccel = 20;

	var exits;
	var players;
	var ballHere = false;

	//time between exchanges
	var minTime = 1000;

	var pixelsPerBox = 140;
	var minPixelsPerBox = 50;

	var mazePG;
	var img;
	var mazeRendered = false;

	pjs.setup = function(){
		pjs.size(pjs.screenWidth,pjs.screenHeight);
		pjs.noStroke();
		pjs.smooth();
		pjs.rectMode(pjs.CENTER);
	
		allSetup();

		if(Controller.isMaster){
			masterSetup();
		}else{
			peerSetup();
		}

	};

	pjs.draw = function(){
		pjs.image(img, 0, 0);
		if(ballHere){
			for(var i=0; i<exits.length; i++){
				exits[i].tick();
			}
			ball.render();
		}
	}

	var makeRenderable = function(){
		mazePG = pjs.createGraphics(pjs.width, pjs.height);
		mazePG.noStroke();
		mazePG.smooth();

		//set up maze png
		mazePG.beginDraw();
		start.render();
		for(var i=0; i<exits.length; i++){
			exits[i].block.render();
		}
		mazePG.endDraw();

		pjs.background(bkg);
		pjs.image(mazePG, 0, 0);
		img = pjs.loadImage(canvas.toDataURL());
	};

	var allSetup = function(){

		//have 8 across by default
		pixelsPerBox = pjs.width/8;

		pixelsPerBox -= 10*Controller.wins;
		if(pixelsPerBox < minPixelsPerBox){
			pixelsPerBox = minPixelsPerBox;
		}

		cols = Math.floor(pjs.width/pixelsPerBox);
		rows = Math.floor(pjs.height/pixelsPerBox);
		padding = pjs.width*(pjs.height/pjs.width)/100;

		mazeDimen = new pjs.PVector(pjs.screenWidth/cols, pjs.screenHeight/rows);
		ballDimen = (mazeDimen.x-padding*2)*2/3;
		var startX = 0;
		var startY = Math.floor(rows/2);
		constructMaze(cols, rows, startX, startY);
		ball = new Ball(start);
		//end = maze[0][0];

		exits = [];

		//connect to next player and prev player
		var others = Controller.playerData.others;
		if(others.length > 1){
			for(var i=0; i<others.length; i++){
				var curr = others[i];
				//find curr
				if(curr.id === Comm.id){
					//console.log(Comm.id + ", " + i);
					var prevI = i-1;
					if(prevI >= 0){
						//prevI = others.length-1;
						var prev = randomExit(others[prevI].id)
						console.log(prev);
						exits.push(prev);
					}

					var nextI = i+1;
					if(nextI < others.length){
						var next = randomExit(others[nextI].id);
						console.log(next);
						exits.push(next);
					}

					//set up third exit
					if(others.length > 3){
						if(others.length % 2 == 0){ //even
							var half = others.length/2;
							var num = half + i;
							if(num >= others.length){
								num = num - others.length;
							}
							//console.log('num: ' + num);
							var next = randomExit(others[num].id);
							exits.push(next);
						}else if(i != others.length-1){ //odd, but not last player
							var half = Math.floor(others.length/2);
							var num = half;
							num += i;
							if(num >= others.length-1){
								num = num - (others.length-1);
							}
							//console.log('num: ' + num);
							var next = randomExit(others[num].id);
							exits.push(next);
						}
					}	

					break;

				}
			}
		}


		//if last, make end
		if(Comm.id === others[others.length-1].id){
			var x = Math.floor(pjs.random(1,maze.length-2));
			var y = Math.floor(pjs.random(1,maze[0].length-2));
			end = maze[x][y];
		}

		makeRenderable();
	}

	var masterSetup = function(){
		ballHere = true;
	};

	var peerSetup = function(){
		start = null;
		pjs.noLoop();
	}

	var constructMaze = function(w, h, startX, startY){
		maze = [];
		for(var i=0; i<w; i++){
			var arr = [];
			for(var j=0; j<h; j++){
				arr.push(new MazeBlock(i, j));
			}			
			maze.push(arr);	
		}

		//console.log(maze);
		start = walkMaze(startX,startY);
		//console.log(start);
	};

	//generate maze structure starting at x,y
	var walkMaze = function(x,y){
		var start = maze[x][y];
		start.walk();
		return start;
	};

	pjs.transfer = function(id){
		console.log("transfer");
		for(var i=0; i<exits.length; i++){
			var curr = exits[i];
			if(curr.otherPlayerId === id){
				curr.addBall();
				return;
			}
		}
	}

	var win = function(){
		console.log("win!");
		pjs.noLoop();
		Controller.win();
		Comm.notifyWin();
	}

	var MazeBlock = function(x, y){

		this.x = x;
		this.y = y;

		this.pos = new pjs.PVector(x*mazeDimen.x, y*mazeDimen.y);
		this.center = new pjs.PVector(this.pos.x + mazeDimen.x/2, this.pos.y + mazeDimen.y/2);

		//actually connected in the maze
		this.neighbors = [];

		//used during generation
		this.visited = false;

		this.addNeighbor = function(other){
			other.push(neighbors);
		};

		//adjacent, but not necessarily connected
		this.getAdjacent = function(){
			var blocks = [];
			if(this.x - 1 >= 0){
				blocks.push(maze[this.x-1][this.y]);
			}
			if(this.x + 1 < maze.length){
				blocks.push(maze[this.x+1][this.y]);
			}
			if(this.y - 1 >= 0){
				blocks.push(maze[this.x][this.y-1]);
			}
			if(this.y + 1 < maze[x].length){
				blocks.push(maze[this.x][this.y+1]);
			}
			return blocks;
		};

		//returns a random unvisited adjacent block
		this.randomAdj = function(){
			var adj = this.getAdjacent();

			//filter out visited
			adj = adj.filter(function(el){
				return !el.visited;
			});

			//base case
			if(adj.length == 0){
				//if(!end)
				//	end = this;
				return false;
			}

			//select random element
			var rand = Math.floor(pjs.random(adj.length));
			var other = adj[rand];
			return other;
		};

		this.walk = function(parent){

			//console.log("x: " + this.x + ", y: " + this.y);
			if(parent){
				this.neighbors.push(parent);
			}

			this.visited = true;

			var next = this.randomAdj();

			while(next){
				this.neighbors.push(next);
				next.walk(this);
				next = this.randomAdj();
			}

			return;

		};

		this.draw = function(){
			if((this == start && Controller.isMaster) || this == end){
				mazePG.fill(goalCol);
			}else{
				mazePG.fill(mazeCol);
			}
			mazePG.rect(this.pos.x + padding, this.pos.y + padding, mazeDimen.x-padding*2, mazeDimen.y-padding*2);
		}

		//connect with a segment
		this.drawSegment = function(other){
			var avX = (this.pos.x + other.pos.x)/2;
			var avY = (this.pos.y + other.pos.y)/2;
			
			mazePG.fill(mazeCol);
			if(other.x == this.x){
				mazePG.rect(avX + padding, avY, mazeDimen.x-padding*2, mazeDimen.y);
			}else{
				mazePG.rect(avX, avY + padding, mazeDimen.x, mazeDimen.y-padding*2)
			}
		}

		//recursively render maze
		this.render = function(parent){
			for(var i=0; i<this.neighbors.length; i++){
				if(this.neighbors[i] != parent){
					this.drawSegment(this.neighbors[i]);
					this.neighbors[i].render(this);
				}
			}

			this.draw();
		};
	};

	var randomExit = function(id){
		var x, y, mazeX, mazeY;
		do{
			var side = Math.floor(pjs.random(0, 4));
			if(side == 0){ //left
				x = -1;
				y = Math.floor(pjs.random(maze[0].length));
				mazeX = 0;
				mazeY = y;
			}else if(side == 1){ //top
				x = Math.floor(pjs.random(maze.length));
				y = -1;
				mazeX = x;
				mazeY = 0;
			}else if(side == 2){ //right
				x = maze.length;
				y = Math.floor(pjs.random(maze[0].length));
				mazeX = x-1;
				mazeY = y;
			}else{ //bottom
				x = Math.floor(pjs.random(maze.length));
				y = maze[0].length;
				mazeX = x;
				mazeY = y-1;
				//console.log(x + "," + y);
				//console.log(mazeX + "," + mazeY);
			}
		}while(!isUniqueExit(x, y))// || (maze[mazeX][mazeY].neighbors.length == 0))

		return new Exit(x, y, id)
	};

	var isUniqueExit = function(x, y){
		for(var i=0; i<exits.length; i++){
			if(Math.abs(exits[i].block.x - x) <= 1 || Math.abs(exits[i].block.y - y) <= 1){
				return false;
			}
		}
		return true;
	}

	var Exit = function(x, y, id){
		this.block = new MazeBlock(x, y);
		this.lastTransfered = (new Date()).getTime();
		this.startVMag = padding;
		if(x < 0){
			this.adjacentBlock = maze[x+1][y];
			this.startV = new pjs.PVector(-1*this.startVMag, 0);
		}else if(x >= maze.length){
			this.adjacentBlock = maze[x-1][y];
			this.startV = new pjs.PVector(this.startVMag, 0);
		}else if(y < 0){
			this.adjacentBlock = maze[x][y+1];
			this.startV = new pjs.PVector(0, -1*this.startVMag);
		}else{
			this.adjacentBlock = maze[x][y-1];
			this.startV = new pjs.PVector(0, this.startVMag);
		}
		
		this.adjacentBlock.neighbors.push(this.block);
		this.block.neighbors.push(this.adjacentBlock);

		this.otherPlayerId = id;

		this.tick = function(){
			if(ball.currBlock == this.block){
				//check to see if ball has left screen
				if(ball.pos.x - ball.dimen.x/2 > pjs.width ||
					ball.pos.x + ball.dimen.x/2 < 0 ||
					ball.pos.y + ball.dimen.y/2 < 0 ||
					ball.pos.y - ball.dimen.y/2 > pjs.height){
					this.transfer();
				}
			}
		};

		this.transfer = function(){
			var now = (new Date()).getTime();
			if(now - this.lastTransfered > minTime){
				ballHere = false;
				Comm.transferBall(this.otherPlayerId);
				pjs.noLoop();
			}
		};

		this.addBall = function(){
			this.lastTransfered = (new Date()).getTime();
			console.log('added ball');
			ballHere = true;
			ball.pos = new pjs.PVector(this.block.center.x, this.block.center.y);
			console.log(ball.pos);
			console.log(this.block.center);
			ball.currBlock = this.block;
			ball.pos.add(this.startV);
			ball.v = new pjs.PVector(this.startV.x, this.startV.y);
			pjs.loop();
		};

	};

	var Ball = function(startBlock){

		this.pos = new pjs.PVector(startBlock.pos.x+mazeDimen.x/2,startBlock.pos.y+mazeDimen.y/2);
		this.v = new pjs.PVector();
		this.a = new pjs.PVector();
		this.currBlock = startBlock;
		//this.dimen = new pjs.PVector(mazeDimen.x-padding*3, mazeDimen.y-padding*3);
		this.dimen = new pjs.PVector(ballDimen, ballDimen);

		this.limitVeloc = function(){
			if(this.v.x > maxAccel){
				this.v.x = maxAccel;
			}else if(this.v.x < -1*maxAccel){
				this.v.x = -1*maxAccel;
			}
			if(this.v.y > maxAccel){
				this.v.y = maxAccel;
			}else if(this.v.y < -1*maxAccel){
				this.v.y = -1*maxAccel;
			}
		}

		this.friction = function(){
			this.v.x *= .9;
			this.v.y *= .9;
		};

		this.findBlock = function(){

			var minBlock = this.currBlock;
			var minDist = pjs.PVector.dist(this.currBlock.center, this.pos);
			var neighbors = this.currBlock.neighbors;

			for(var i=0; i<neighbors.length; i++){
				var curr = neighbors[i];
				var dist = pjs.PVector.dist(curr.center, this.pos);
				if(dist < minDist){
					minBlock = curr;
					minDist = dist;
				}
			}

			if(minBlock != this.currBlock){
				//console.log(minBlock);
			}

			this.currBlock = minBlock;

			//WIN
			if(this.currBlock == end){
				win();
			}
		}

		//sets current block and collides with it and neighbors
		this.collideAll = function(){
			var left, top, right, bottom;
			var neighbors = this.currBlock.neighbors;

			left = false;
			top = false;
			right = false;
			bottom = false;


			for(var i=0; i<neighbors.length; i++){
				var curr = neighbors[i];
				if(curr.pos.x < this.currBlock.pos.x){
					left = true;
				}else if(curr.pos.x > this.currBlock.pos.x){
					right = true;
				}else if(curr.pos.y > this.currBlock.pos.y){
					bottom = true;
				}else if(curr.pos.y < this.currBlock.pos.y){
					top = true;
				}
			}

			this.collide(this.currBlock, left, top, right, bottom);
		}

		/* Adapted from: http://stackoverflow.com/questions/3120357/get-closest-point-to-a-line */
		this.closestPoint = function(lineStart, lineEnd, point){
			var pb = pjs.PVector.sub(point,lineEnd);
			var ab = pjs.PVector.sub(lineStart,lineEnd);
			var k_raw = pjs.PVector.dot(pb, ab) / pjs.PVector.dot(ab, ab);

			var k;
			if(k_raw < 0)
    			k= 0;
			else if(k_raw > 1)
				k= 1;
			else
    			k= k_raw;

    		var ret = new pjs.PVector(k*lineStart.x + (1-k)*lineEnd.x, k*lineStart.y + (1-k)*lineEnd.y);
    		return ret;
		};

		this.collideLine = function(lineStart, lineEnd){
			var closest = this.closestPoint(lineStart, lineEnd, this.pos);
			var dist = pjs.PVector.dist(closest, this.pos);
			if(dist < this.dimen.x/2){
				var sub = pjs.PVector.sub(this.pos, closest);
				sub.normalize();
				sub.mult(this.dimen.x/2 - dist);
				this.v.add(sub);
			}
		};

		this.collide = function(other, left, top, right, bottom){
			var x = other.pos.x + padding;
			var y = other.pos.y + padding;
			var w = mazeDimen.x-padding*2;
			var h = mazeDimen.y-padding*2;

			var topLeft = new pjs.PVector(x, y);
			var topRight = new pjs.PVector(x+w, y);
			var bottomLeft = new pjs.PVector(x, y+h);
			var bottomRight = new pjs.PVector(x+w, y+h);

			if(!left){
				this.collideLine(topLeft, bottomLeft);
			}

			if(!right){
				this.collideLine(topRight, bottomRight)
			}

			if(!top){
				this.collideLine(topLeft, topRight);
			}

			if(!bottom){
				this.collideLine(bottomRight, bottomLeft);
			}

			//check for collisions against padding

			if(left){
				var topLeftStart = new pjs.PVector(topLeft.x - padding, topLeft.y);
				this.collideLine(topLeftStart, topLeft);
				var bottomLeftStart = new pjs.PVector(bottomLeft.x - padding, bottomLeft.y);
				this.collideLine(bottomLeftStart, bottomLeft);
			}

			if(right){
				var topRightEnd = new pjs.PVector(topRight.x + padding, topRight.y);
				this.collideLine(topRight, topRightEnd);
				var bottomRightEnd = new pjs.PVector(bottomRight.x + padding, bottomRight.y);
				this.collideLine(bottomRight, bottomRightEnd);
			}

			if(top){
				var topLeftEnd = new pjs.PVector(topLeft.x, topLeft.y - padding);
				this.collideLine(topLeft, topLeftEnd);
				var topRightEnd = new pjs.PVector(topRight.x, topRight.y - padding);
				this.collideLine(topRight, topRightEnd);
			}

			if(bottom){
				var bottomLeftEnd = new pjs.PVector(bottomLeft.x, bottomLeft.y + padding);
				this.collideLine(bottomLeft, bottomLeftEnd);
				var bottomRightEnd = new pjs.PVector(bottomRight.x, bottomRight.y + padding);
				this.collideLine(bottomRight, bottomRightEnd);
			}
		};

		this.boundXLeft = function(x, y, w, h){
			return;
			this.pos.x = x + this.dimen.x/2;
			this.v.x *= -1;
			this.a.x = 0;
			this.friction();
		};

		this.boundXRight = function(x,y,w,h){
			return;
			this.pos.x = x + w - this.dimen.x/2;
			this.v.x *= -1;
			this.a.x = 0;
			this.friction();
		};

		this.boundYTop = function(x, y, w, h){
			return;
			this.pos.y = y + this.dimen.y/2;
			this.v.y *= -1;
			this.a.y = 0;
			this.friction();
		};

		this.boundYBottom = function(x, y, w, h){
			return;
			this.pos.y = y + h - this.dimen.y/2;
			console.log(this.v.y);
			this.v.y *= -1;
			this.a.y = 0;
			this.friction();
		};

		this.render = function(){
			this.a.x = tiltLR/50;
			this.a.y = tiltFB/50;
			
			this.findBlock();
			this.collideAll();

			this.v.add(this.a);
			this.limitVeloc();

			this.pos.add(this.v);

			this.friction();

			pjs.fill(ballCol);
			pjs.ellipse(this.pos.x, this.pos.y, this.dimen.x, this.dimen.y);
		};
	};

};
