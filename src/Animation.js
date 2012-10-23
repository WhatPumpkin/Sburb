var Sburb = (function(Sburb){




////////////////////////////////////
//Animation Class
////////////////////////////////////


//Constructor
Sburb.Animation = function(name,sheet,x,y,colSize,rowSize,startPos,length,frameInterval,loopNum,followUp,flipX,flipY, sliced, numCols, numRows){
	this.sheet = sheet;
	this.sliced = sliced?true:false;
	this.x = x?x:0;
	this.y = y?y:0;
	this.rowSize = rowSize?rowSize:sheet.height;
	this.colSize = colSize?colSize:sheet.width;
	this.startPos = startPos?startPos:0;
	this.length = length?length:1;
	this.curInterval = 0;
	this.curFrame = 0;
	this.name = name;
	this.loopNum = typeof loopNum == "number"?loopNum:-1;
	this.curLoop = 0;
	this.followUp = followUp;
	this.flipX = flipX?true:false;
	this.flipY = flipY?true:false;
	
	if(sliced){
		this.numRows = numRows;
		this.numCols = numCols;
		this.sheets = {};
		for(var colNum = 0;colNum<this.numCols;colNum++){
			for(var rowNum = 0;rowNum<this.numRows;rowNum++){
				var sheet = Sburb.assets[this.sheet+"_"+colNum+"_"+rowNum];
				if(sheet){
					if(!this.sheets[colNum]){
						this.sheets[colNum] = {};
					}
					this.sheets[colNum][rowNum] = sheet;
				}
			}
		}
		this.draw = this.drawSliced;
	}else{
		this.numRows = sheet.height/this.rowSize;
		this.numCols = sheet.width/this.colSize;
		this.draw = this.drawNormal;
	}
	
	if(typeof frameInterval == "string"){
		if(frameInterval.indexOf(":")==-1){
			this.frameInterval = parseInt(frameInterval);
		}else{
			var intervals = frameInterval.split(",");
			this.frameIntervals = {};
			for(var i=0; i<intervals.length; i++){
				var pair = intervals[i].split(":");
				this.frameIntervals[parseInt(pair[0])] = parseInt(pair[1]);
			}
			if(!this.frameIntervals[0]){
				this.frameIntervals[0] = 1;
			}
			this.frameInterval = this.frameIntervals[this.curFrame];
		}
	}else{
		this.frameInterval = frameInterval?frameInterval:1;
	}
}


//go to the next frame of the animation
Sburb.Animation.prototype.nextFrame = function() {
	this.curFrame++;
	if(this.curFrame>=this.length){
		if(this.curLoop==this.loopNum){
			this.curFrame = this.length-1;
		}else{
			this.curFrame=0;
			if(this.loopNum>=0){
				this.curLoop++;
			}
		}
	}
	if(this.frameIntervals && this.frameIntervals[this.curFrame]){
		this.frameInterval = this.frameIntervals[this.curFrame];
	}
	
}

//update the animation as if a frame of time has elapsed
Sburb.Animation.prototype.update = function(){
	this.curInterval++;
	while(this.curInterval>this.frameInterval){
		this.curInterval-=this.frameInterval;
		this.nextFrame();
	}
}

//draw the animation
Sburb.Animation.prototype.drawNormal = function(x,y){
	var Stage = Sburb.Stage;
	var stage = Sburb.stage;
	var stageX = Stage.offset?Stage.x:0;
	var stageY = Stage.offset?Stage.y:0;
	var stageWidth = Stage.width;
	var stageHeight = Stage.height;
	
	if(this.flipX){
		stageX = -stageX-stageWidth;
		x = -x;
	}
	if(this.flipY){
		stageY = -stageY-stageHeight;
		y = -y;
	}
	
	x= Math.round((this.x+x)/Stage.scaleX)*Stage.scaleX;
	y= Math.round((this.y+y)/Stage.scaleY)*Stage.scaleY;

	var colNum = ((this.startPos+this.curFrame)%this.numCols);
	var rowNum = (Math.floor((this.startPos+this.curFrame-colNum)/this.numCols));
	var frameX = colNum*this.colSize;
	var frameY = rowNum*this.rowSize;
	var drawWidth = this.colSize;
	var drawHeight = this.rowSize;
	
	
	
	var delta = x-stageX;
	if(delta<0){
		frameX-=delta;
		drawWidth+=delta;
		x=stageX;
		if(frameX>=this.sheet.width){
			return;
		}
	}
	
	delta = y-stageY;
	if(delta<0){
		frameY-=delta;
		drawHeight+=delta;
		y=stageY;
		if(frameY>=this.sheet.height){
			return;
		}
	}
	
	
	
	
	delta = drawWidth+x-stageX-stageWidth;
	if(delta>0){
		drawWidth-=delta;
		
	}
	if(drawWidth<=0){
		return;
	}
	
	delta = drawHeight+y-stageY-stageHeight;
	if(delta>0){
		drawHeight-=delta;
	}
	if(drawHeight<=0){
		return;
	}
	
	var scaleX = 1;
	var scaleY = 1;
	
	if(this.flipX){
		scaleX = -1;
	}
	if(this.flipY){
		scaleY = -1;
	}
	if(scaleX!=1 || scaleY!=1){
		stage.scale(scaleX,scaleY);
	}
	stage.drawImage(this.sheet,frameX,frameY,drawWidth,drawHeight,x,y,drawWidth,drawHeight);
	if(scaleX!=1 || scaleY!=1){
		stage.scale(scaleX,scaleY);
	}
	
}

Sburb.Animation.prototype.drawSliced = function(x,y){
	var Stage = Sburb.Stage;
	var stage = Sburb.stage;
	var stageX = Stage.offset?Stage.x:0;
	var stageY = Stage.offset?Stage.y:0;
	var stageWidth = Stage.width;
	var stageHeight = Stage.height;
	
	if(this.flipX){
		stageX = -stageX-stageWidth;
		x = -x;
	}
	if(this.flipY){
		stageY = -stageY-stageHeight;
		y = -y;
	}
	
	
	
	x= Math.round((this.x+x)/Stage.scaleX)*Stage.scaleX;
	y= Math.round((this.y+y)/Stage.scaleY)*Stage.scaleY;
	
	var minCol = Math.floor((stageX-x)/this.colSize);
	var maxCol = Math.floor((stageX+stageWidth-x)/this.colSize);
	var minRow = Math.floor((stageY-y)/this.rowSize);
	var maxRow = Math.floor((stageY+stageHeight-y)/this.colSize);
	
	for(var colNum = minCol; colNum<=maxCol; colNum++){
		for(var rowNum = minRow; rowNum<=maxRow; rowNum++){
			if(this.sheets[colNum] && this.sheets[colNum][rowNum]){
			
				var sheet = this.sheets[colNum][rowNum];
				var frameX = 0;
				var frameY = 0;
				var drawWidth = sheet.width;
				var drawHeight = sheet.height;
				var x = this.x+colNum*this.colSize;
				var y = this.y+rowNum*this.rowSize;
				
				var delta = x-stageX;
				if(delta<0){
					frameX-=delta;
					drawWidth+=delta;
					x=stageX;
					if(frameX>=this.colSize){
						continue;
					}
				}
	
				delta = y-stageY;
				if(delta<0){
					frameY-=delta;
					drawHeight+=delta;
					y=stageY;
					if(frameY>=this.rowSize){
						continue;
					}
				}
	
	
	
	
				delta = drawWidth+x-stageX-stageWidth;
				if(delta>0){
					drawWidth-=delta;
		
				}
				if(drawWidth<=0){
					continue;
				}
	
				delta = drawHeight+y-stageY-stageHeight;
				if(delta>0){
					drawHeight-=delta;
				}
				if(drawHeight<=0){
					continue;
				}
	
				var scaleX = 1;
				var scaleY = 1;
	
				if(this.flipX){
					scaleX = -1;
				}
				if(this.flipY){
					scaleY = -1;
				}
				if(scaleX!=1 || scaleY!=1){
					stage.scale(scaleX,scaleY);
				}

				stage.drawImage(sheet,frameX,frameY,drawWidth,drawHeight,x,y,drawWidth,drawHeight);
				if(scaleX!=1 || scaleY!=1){
					stage.scale(scaleX,scaleY);
				}
			}
		}
	} 
	
	
	
}

//reinitialize the animation to its first frame and loop
Sburb.Animation.prototype.reset = function(){
	this.curFrame = 0;
	this.curInterval = 0;
	this.curLoop = 0;
}

//has the animation stopped playing
Sburb.Animation.prototype.hasPlayed = function(){
	return this.curLoop == this.loopNum && this.curFrame==this.length-1;
}

//set the column size (width)
Sburb.Animation.prototype.setColSize = function(newSize){
	this.colSize = newSize;
	this.numCols = this.sheet.width/this.colSize;
	this.reset();
}

//set the row size (height)
Sburb.Animation.prototype.setRowSize = function(newSize){
	this.rowSize = newSize;
	this.numRows = this.sheet.height/this.rowSize;
	this.reset();
}

//set the sheet
Sburb.Animation.prototype.setSheet = function(newSheet){
	this.sheet = newSheet;
	this.numRows = this.sheet.height/this.rowSize;
	this.numCols = this.sheet.width/this.colSize;
	this.reset();
}

//does the image render in the given pixel
Sburb.Animation.prototype.isVisuallyUnder = function(x,y){
	if(x>=this.x && x<=this.x+this.colSize){
		if(y>=this.y && y<=this.y+this.rowSize){
			return true;
		}
	}
	return false;
}

//make an exact copy of this animation
Sburb.Animation.prototype.clone = function(x,y){
	return new Sburb.Animation(this.name, this.sheet, (x?x:0)+this.x, (y?y:0)+this.y, this.colSize,this.rowSize, this.startPos, this.length, this.frameInterval, this.loopNum, this.followUp, this.flipX, this.flipY, this.sliced, this.numCols, this.numRows);
}

//serialize this Animation to XML
Sburb.Animation.prototype.serialize = function(output){

	var frameInterval = "";
	var firstInterval = true;

	if(this.frameIntervals)
	{
		for(var interval in this.frameIntervals)
		{
		    if(!this.frameIntervals.hasOwnProperty(interval)) continue;
		    frameInterval = frameInterval + (firstInterval?"":",") + interval + ":" + this.frameIntervals[interval];
		    firstInterval = false;
		}
	}
	else if(this.frameInterval !== 1)
	{
		frameInterval = this.frameInterval;
	}

	output = output.concat("\n<animation "+
		("sheet='"+(this.sheet.name?this.sheet.name:this.sheet)+"' ")+
		((this.name!="image")?"name='"+this.name+"' ":"")+
		Sburb.serializeAttributes(this,"x","y")+
		((this.rowSize!=this.sheet.height)?"rowSize='"+this.rowSize+"' ":"")+
		((this.colSize!=this.sheet.width)?"colSize='"+this.colSize+"' ":"")+
		Sburb.serializeAttribute(this,"startPos")+
		((this.length!=1)?"length='"+this.length+"' ":"")+
		((frameInterval!=="")?"frameInterval='"+frameInterval+"' ":"")+
		((this.loopNum!=-1)?"loopNum='"+this.loopNum+"' ":"")+
		Sburb.serializeAttributes(this,"folowUp","flipX","flipY")+
		(this.sliced?("sliced='true' numCols='"+this.numCols+"' numRows='"+this.numRows+"' "):(""))+
		" />");
	return output;
}







///////////////////////////////////////
//Related Utility functions
///////////////////////////////////////

Sburb.parseAnimation = function(animationNode, assetFolder){
	var attributes = animationNode.attributes;

	var name = "image";
	var sheet = null;
	var x = 0;
	var y = 0;
	
	var colSize = null;
	var rowSize = null;
	var numCols = 1;
	var numRows = 1;
	var sliced = false;
	
	var startPos = 0;
	var length = 1;
	var frameInterval = 1;
	var loopNum = -1;
	var followUp = null;
	
	var temp;
	
	sliced = (temp = attributes.getNamedItem("sliced"))?temp.value!="false":sliced;
	
	name = (temp = attributes.getNamedItem("name"))?temp.value:name;
	
	if(!sliced){
		sheet = (temp = attributes.getNamedItem("sheet"))?assetFolder[temp.value]:sheet;
	}else{
		sheet = (temp = attributes.getNamedItem("sheet"))?temp.value:sheet;
	}
	
	x = (temp = attributes.getNamedItem("x"))?parseInt(temp.value):x;
	y = (temp = attributes.getNamedItem("y"))?parseInt(temp.value):y;
	length = (temp = attributes.getNamedItem("length"))?parseInt(temp.value):length;
	
	numCols = (temp = attributes.getNamedItem("numCols"))?parseInt(temp.value):numCols;
	numRows = (temp = attributes.getNamedItem("numRows"))?parseInt(temp.value):numRows;
	
	colSize = (temp = attributes.getNamedItem("colSize"))?parseInt(temp.value):Math.round(sheet.width/length);
	rowSize = (temp = attributes.getNamedItem("rowSize"))?parseInt(temp.value):sheet.height;
	startPos = (temp = attributes.getNamedItem("startPos"))?parseInt(temp.value):startPos;
	
	
	
	
	
	frameInterval = (temp = attributes.getNamedItem("frameInterval"))?temp.value:frameInterval;
	loopNum = (temp = attributes.getNamedItem("loopNum"))?parseInt(temp.value):loopNum;
	followUp = (temp = attributes.getNamedItem("followUp"))?temp.value:followUp;
	var flipX = (temp = attributes.getNamedItem("flipX"))?temp.value!="false":false;
	var flipY = (temp = attributes.getNamedItem("flipY"))?temp.value!="false":false;
	return new Sburb.Animation(name,sheet,x,y,colSize,rowSize,startPos,length,frameInterval,loopNum,followUp,flipX,flipY, sliced,numCols,numRows);
}

return Sburb;
})(Sburb || {});
