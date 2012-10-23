var Sburb = (function(Sburb){




///////////////////////////////////////
//Chooser Class
///////////////////////////////////////

//constructor
Sburb.Chooser = function(){
	this.choosing = false;
	this.choices = [];
	this.choice = 0;
	this.dialogs = [];
	this.time = 0;
}

Sburb.Chooser.prototype.minWidth = 160;

//go to the next choice
Sburb.Chooser.prototype.nextChoice = function(){
	this.choice = (this.choice+1)%this.choices.length;
}

//go to the previous choice
Sburb.Chooser.prototype.prevChoice = function(){
	this.choice = (this.choice-1+this.choices.length)%this.choices.length;
}

//initialize chooser
Sburb.Chooser.prototype.beginChoosing = function(x,y){
	var width = this.minWidth;
	var height = 0;
	var basis = new Sburb.FontEngine();
	for(i=0;i<this.choices.length;i++){
		width = Math.max(width,(this.choices[i].name.length+3)*basis.charWidth+10);
	}
	height = basis.lineHeight*this.choices.length+10;
	
	if(x<Sburb.Stage.x+10){
		x = Sburb.Stage.x+10;
	}
	if(y<Sburb.Stage.y+10){
		y = Sburb.Stage.y+10;
	}
	if(x+width>Sburb.Stage.x+Sburb.Stage.width-10){
		x = Sburb.Stage.x+Sburb.Stage.width-width-10;
	}
	if(y+height>Sburb.Stage.y+Sburb.Stage.height-10){
		y = Sburb.Stage.y+Sburb.Stage.height-height-10;
	}
	
	
	this.choosing = true;
	this.choice = 0;
	this.dialogs = [];
	for(var i=0;i<this.choices.length;i++){
		var curEngine = new Sburb.FontEngine(" > "+this.choices[i].name);
		curEngine.showSubText(0,1);
		curEngine.setDimensions(x,y+i*curEngine.lineHeight);
		this.dialogs.push(curEngine);
	}
}

//draw the chooser
Sburb.Chooser.prototype.draw = function(){
	if(this.choosing){
		Sburb.stage.save();
		var x,y,width=this.minWidth,height=0,i;
		x = this.dialogs[0].x;
		y = this.dialogs[0].y-1;
		for(i=0;i<this.dialogs.length;i++){
			width = Math.max(width,this.dialogs[i].lines[0].length*this.dialogs[i].charWidth+10);
		}
		height = this.dialogs[0].lineHeight*this.dialogs.length;
		Sburb.stage.fillStyle = "#ff9900";
		Sburb.stage.fillRect(x-6,y-6,width+12,height+13);
		Sburb.stage.fillStyle = "#ffff00";
		Sburb.stage.fillRect(x-2,y-2,width+4,height+5);
		Sburb.stage.fillStyle = "#000000";
		Sburb.stage.fillRect(x,y,width,height);
		for(i=0;i<this.dialogs.length;i++){
			this.dialogs[i].draw();
		}
		Sburb.stage.restore();
	}
}

//update the chooser one frame
Sburb.Chooser.prototype.update = function(){
	if(this.choosing){
		this.time++;
		for(var i=0;i<this.dialogs.length;i++){
			var curDialog = this.dialogs[i];
			curDialog.showSubText(null,curDialog.end+1);
			if(i==this.choice){
				if(this.time%Sburb.Stage.fps<Sburb.Stage.fps/2){
					curDialog.start = 2;
				}else{
					curDialog.start = 0;
				}
				curDialog.color = "#cccccc";	
			}else{
				curDialog.start = 0;
				curDialog.color = "#ffffff";
			}
		}
	}
}



return Sburb;
})(Sburb || {});
