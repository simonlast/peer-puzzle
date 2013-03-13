
var bkgCanvas, bkgPjs, mazePG;

var bkgPlay = function(bpjs) {

	bpjs.setup = function(){
		bpjs.size(bpjs.screenWidth,bpjs.screenHeight);
		bpjs.noStroke();
		bpjs.smooth();
		//bpjs.noLoop();
	};

	bpjs.draw = function(){
		//bpjs.background(255,0,0);
		if(mazePG)
			bpjs.image(mazePG, 0, 0);
	};

};
