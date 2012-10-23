var Sburb = (function(Sburb){

/* Talking text markup
@ denotes a new dialogue box, the string following it indicates character animation, 
the first two characters indicating character specific formatting.
Alternatively, you can use an underscore to override the two character identifier
limit.

EX:

@CGIdle wordwordswords
@TTAngry Blahblahblah
@CGBored snoooooze
@Karkat_Stupid blarhagahl

Inserting underscores underlines the text between them, e.g. _blah blah blah_
Inserting /0xff00ff colours all following text with the specificed colour.
Insterting /0x/ ends the previously specified behaviour.
*/







////////////////////////////////////////////////
//FontEngine class
////////////////////////////////////////////////

//constructor
Sburb.FontEngine = function(text){

	//This is intended for monospace fonts
	//this.font-family 
	this.font = "bold 14px SburbFont";
	this.color = "#000000";
	this.text = typeof text == "string"?text:"";
	this.x=0;
	this.y=0;
	this.width=999999;
	this.height=999999;
	this.start=0;
	this.end=999999;
	this.lines = [];
	this.lineHeight = 17;
	this.charWidth = 8;
	this.align = "left";
	
	this.formatted = true;
	
	this.formatQueue = [];
}

Sburb.FontEngine.prototype.prefixColours = {	
	aa : "#a10000",aradia : "#a10000",
	ac : "#416600",nepeta : "#416600",
	ag : "#005682",vriska : "#005682",
	at : "#a15000",tavros : "#a15000",
	ca : "#6a006a",eridan : "#6a006a",
	cc : "#77003c",feferi : "#77003c",
	cg : "#626262",karkat : "#626262",
	ct : "#000056",equius : "#000056",
	ga : "#008141",kanaya : "#008141",
	gc : "#008282",terezi : "#008282",
	ta : "#a1a100",sollux : "#a1a100",
	tc : "#2b0057",gamzee : "#2b0057",
	dave:"#e00707",meenah : "#77003c",
	rose:"#b536da",aranea : "#005682",
	kankri:"#ff0000",porrim: "#008141",
	latula:"#008282"
};

//set the style
Sburb.FontEngine.prototype.setStyle = function(font,color,lineHeight,charWidth){
	this.font = typeof font == "string" ? font:this.font;
	this.color = typeof color == "string" ? color:this.color;
	this.lineHeight = typeof lineHeight == "number" ? lineHeight:this.lineHeight;
	this.charWidth = typeof charWidth == "number" ? charWidth:this.charWidth;
	this.parseText();
}

//set formatted
Sburb.FontEngine.prototype.setFormatted = function(formatted){
	this.formatted = formatted;
}

//set the text
Sburb.FontEngine.prototype.setText = function(text){
	this.text = text;
	this.parseEverything();
}

Sburb.FontEngine.prototype.setAlign = function(align){
	this.align = align;
}

//show a substring of the text
Sburb.FontEngine.prototype.showSubText = function(start,end){
	this.start = typeof start == "number" ? start:this.start;
	this.end = typeof end == "number" ? end:this.end;
}

//set the dimensions
Sburb.FontEngine.prototype.setDimensions = function(x,y,width,height){
	this.x = typeof x == "number" ? x:this.x;
	this.y = typeof y == "number" ? y:this.y;
	this.width = typeof width == "number" ? width:this.width;
	this.height = typeof height == "number" ? height:this.height;
	this.parseText();
}

//parse and format the current text with the current settings
Sburb.FontEngine.prototype.parseEverything = function(){
	this.parseFormatting();
	this.parseText();
}

//parse the text
Sburb.FontEngine.prototype.parseText = function(){ //break it up into lines
	Sburb.stage.font = this.font;
	this.lines = [];
	var i = 0;
	var lastSpace = 0;
	var lineStart = 0;
	for(i=0;i<this.text.length;i++){
		if(this.text.charAt(i)==" "){
			lastSpace = i;
		}else if(this.text.charAt(i)=="\n"){
			this.lines.push(this.text.substring(lineStart,i));
			lineStart = i+1;
			lastSpace = lineStart;
			continue;
		}
		if(Sburb.stage.measureText(this.text.substring(lineStart,i+1)).width>this.width){
			if(lineStart==lastSpace){
				this.lines.push(this.text.substring(lineStart,i));
				lineStart = i;
				lastSpace = i;
			}else{
				this.lines.push(this.text.substring(lineStart,lastSpace));
				lineStart = lastSpace+1;
				lastSpace = lineStart;
			}
		}
	}
	this.lines.push(this.text.substring(lineStart,i));
}

//parse the formatting of the text
Sburb.FontEngine.prototype.parseFormatting = function(){
	this.formatQueue = [];
	if(this.formatted){
		
		this.escaped = {};
		
		this.parsePrefixes();
	
		this.parseEscapes();
	
		
	
		this.parseUnderlines();
	
		this.parseColors();
	}
}

Sburb.FontEngine.prototype.parseEscapes = function(){
	var index;
	var escapeLocation = 0;
	do{
		index = this.text.indexOf("/",escapeLocation);
		
		if(index<this.text.length-1 && index>=0){
			var character = this.text.charAt(index+1);
			if(character=="/"){
				escapeLocation=index+1;
			}else{
				var characterListing = this.escaped[character];
				if(!characterListing){
					characterListing = this.escaped[character] = {};
				}
				var count = 0;
				for(var i=0;i<index;i++){
					if(this.text.charAt(i)==character){
						count++;			
					}
				}
				characterListing[count+1] = true;
			}
		}
		this.text = this.text.substring(0,index)+this.text.substring(index+1,this.text.length);
	}while(index>=0);
}

Sburb.FontEngine.prototype.parsePrefixes = function(){
	var prefix = this.text.split(" ",1)[0];
	var actor;
	if(prefix!="!"){
		if(prefix.indexOf("_")>=0){
			actor = prefix.substring(0,this.text.indexOf("_"));	
		}else{
			actor = prefix.substring(0,2);
		}
		this.parsePrefix(actor);
	}
	this.text = this.text.substring(prefix.length,this.text.length).trim();
}

Sburb.FontEngine.prototype.parseUnderlines = function(){
	var escapePoint = 0;
	var index = 0;
	var count = 0;
	while(true){
		while(true){
			count++;
			index = this.text.indexOf("_",escapePoint);
			if(this.escaped["_"] && this.escaped["_"][count]){
				escapePoint = index+1;
			}else{
				break;
			}
		}
		if(index==-1){
			break;
		}
		var closing = false;
		for(var i=this.formatQueue.length-1;i>=0;i--){
			if(this.formatQueue[i].type=="underline" && this.formatQueue[i].maxIndex==999999){
				this.formatQueue[i].maxIndex=index;
				closing = true;
				break;
			}
		}
		if(!closing){
			this.addToFormatQueue(new Sburb.FormatRange(index,999999,"underline"));
		}
		this.text = this.text.substring(0,index)+this.text.substring(index+1,this.text.length);
		this.realignFormatQueue(index,1);
	}
}

Sburb.FontEngine.prototype.parseColors = function(){
	var escapePoint = 0;
	var index = 0;
	var count = 0;
	while(true){
		while(true){
			count++;
			index = this.text.indexOf("#",escapePoint);
			if(this.escaped["#"] && this.escaped["#"][count]){
				escapePoint = index+1;
			}else{
				break;
			}
		}
		if(index==-1){
			break;
		}
		if(this.text.indexOf("##",escapePoint)==index){
			for(var i=this.formatQueue.length-1;i>=0;i--){
				if(this.formatQueue[i].type=="colour" && this.formatQueue[i].maxIndex==999999){
					this.formatQueue[i].maxIndex=index;
					break;
				}
			}
			count++;
			this.text = this.text.substring(0,index)+this.text.substring(index+2,this.text.length);
			this.realignFormatQueue(index,2);
		}else{
			this.addToFormatQueue(new Sburb.FormatRange(index,999999,"colour","#"+this.text.substring(index+1,index+7)));
			this.text = this.text.substring(0,index)+this.text.substring(index+7,this.text.length);
			this.realignFormatQueue(index,7);
		}
	}
}

//add a format object to the formatQueue
Sburb.FontEngine.prototype.addToFormatQueue = function(format){
	var newPlace = this.formatQueue.length;
	for(var i=0;i<this.formatQueue.length;i++){
		if(this.formatQueue[i].minIndex>format.minIndex){
			newPlace = i;
			break;
		}
	}
	this.formatQueue.splice(newPlace,0,format);
}

//clean up any descrepencies in the formatQueue
Sburb.FontEngine.prototype.realignFormatQueue = function(startPos,shiftSize){
	for(var i=0;i<this.formatQueue.length;i++){
		var curFormat = this.formatQueue[i];
		if(curFormat.maxIndex>startPos && curFormat.maxIndex!=999999){
			curFormat.maxIndex-=shiftSize;
		}
		if(curFormat.minIndex>startPos){
			curFormat.minIndex-=shiftSize;
		}
	}
}

//parse a dialog prefix into formats
Sburb.FontEngine.prototype.parsePrefix = function(prefix){
	this.formatQueue.push(new Sburb.FormatRange(0,this.text.length,"colour",this.prefixColouration(prefix)));
}

//get the colour of a prefix
Sburb.FontEngine.prototype.prefixColouration = function(prefix){
	if(this.prefixColours[prefix.toLowerCase()]){
		return this.prefixColours[prefix.toLowerCase()];
	}else{
		return "#000000";
	}
}

//get the next "box" of lines
Sburb.FontEngine.prototype.nextBatch = function(){
	this.realignFormatQueue(-1,this.batchLength());
	this.lines.splice(0,Math.min(this.lines.length,Math.floor(this.height/this.lineHeight)));
	return this.lines.length;
}

Sburb.FontEngine.prototype.onLastBatch = function(){
	return Math.floor(this.height/this.lineHeight)>=this.lines.length;
}

//draw the FontEngine
Sburb.FontEngine.prototype.draw = function(){

	var i;
	var lenCount;
	var linePos=0;
	var strStart,strEnd;
	var currentFormat = 0;
	var currentFormats = [];
	var nextStop;
	var curLine;
	
	
	i=0;
	lenCount=0;
	var offsetX = 0;
	while(i<Math.floor(this.height/this.lineHeight) && i<this.lines.length){
		Sburb.stage.save();
		//if(Sburb.stage.textBaseline != "top"){
			Sburb.stage.textBaseline = "top";
		//}
		//if(Sburb.stage.textAlign!=this.align){
			Sburb.stage.textAlign = this.align;
		//}
		curLine = this.lines[i];
		var curFont = this.font;
		var curColor = this.color;
		var underlining = false;
		
		nextStop = curLine.length;
		
		if(currentFormat<this.formatQueue.length && this.formatQueue[currentFormat].minIndex<=lenCount+linePos){
			currentFormats.push(this.formatQueue[currentFormat]);
			currentFormat++;
		}
		for(var k=currentFormats.length-1;k>=0;k--){
			if(currentFormats[k].maxIndex<=lenCount+linePos){
				currentFormats.splice(k,1);
			}
		}
		for(var k=0;k<currentFormats.length;k++){
			if(currentFormats[k].type=="colour"){
				curColor = currentFormats[k].extra;
				
			}else if(currentFormats[k].type=="underline"){
				underlining = true;
			}else if(currentFormats[k].type=="italic"){
				curFont = "italic "+this.font;
			}
		}
		if(currentFormat<this.formatQueue.length && this.formatQueue[currentFormat].minIndex<lenCount+curLine.length){
			if(this.formatQueue[currentFormat].minIndex<this.end){
				nextStop = Math.min(nextStop,this.formatQueue[currentFormat].minIndex-lenCount);
			}
		}
		for(var k=0;k<currentFormats.length;k++){
			if(currentFormats[k].maxIndex<this.end){
				nextStop = Math.min(nextStop,currentFormats[k].maxIndex-lenCount);
			}
		}
		if(nextStop!=curLine.length){
			strStart = linePos;
			strEnd = nextStop;
			linePos+=strEnd-strStart;
		}else{
			if(lenCount+curLine.length<=this.end){ //if the line wouldn't take me past the displayed length
				strEnd = curLine.length; //do the whole line
			}else{ //otherwise, if the line would take me past the displayed length
				strEnd = this.end-lenCount; //only show up to the limit
			}
			if(lenCount+linePos>=this.start){ //if the start of the line is within the bounds of the displayed length
				strStart = linePos; //display from the start of the line
			}else if(lenCount+curLine.length>=this.start){ //otherwise, if any part of the line should be displayed
				strStart = this.start-(lenCount)+linePos; //display from where we should start
				offsetX+=Sburb.stage.measureText(curLine.substring(linePos,strStart)).width;
			}else{ //otherwise, don't show this line at all
				strStart = linePos;
				strEnd = linePos;
			}
			linePos = -1;
		}
		var numChars = strEnd-strStart;
		
		if(numChars>0){
			
			var startX = this.x+offsetX;
			var startY = this.y+i*this.lineHeight;
			
			//if(Sburb.stage.font != curFont){
				Sburb.stage.font = curFont;
			//}
			//if(Sburb.stage.fillStyle!=curColor){
				Sburb.stage.strokeStyle = Sburb.stage.fillStyle = curColor;
			//}
			//console.log(Sburb.stage.fillStyle, Sburb.stage.strokeStyle, Sburb.stage.font, Sburb.stage.textBaseline, Sburb.stage.textAlign,curLine.substring(strStart,strEnd));
			//console.log(strStart,strEnd,startX,startY,numChars*this.charWidth,);
			Sburb.stage.fillText(curLine.substring(strStart,strEnd),startX,startY);
			offsetX+=Sburb.stage.measureText(curLine.substring(strStart,strEnd)).width;
			if(underlining && strStart<strEnd){
				if(Sburb.stage.lineWidth!=0.6){
					Sburb.stage.lineWidth = 0.6;
				}
				if(Sburb.stage.lineCap!="square"){
					Sburb.stage.lineCap = "square";
				}
				Sburb.stage.beginPath();
				Sburb.stage.moveTo(startX,startY+this.lineHeight-3);
				Sburb.stage.lineTo(startX+numChars*this.charWidth,startY+this.lineHeight-3);
				Sburb.stage.closePath();
				Sburb.stage.stroke();
			}
		}
		if(linePos==-1){
			lenCount+=this.lines[i].length + 1;
			linePos = 0;
			offsetX = 0;
			i++;
		}
		Sburb.stage.restore();
	}
	
}

//is the contents of the current "box" fully displayed
Sburb.FontEngine.prototype.isShowingAll = function(){
	return this.end>=this.batchLength();
}

//get the length of the current "box"
Sburb.FontEngine.prototype.batchLength = function(){
	var len = 0;
	var i;
	for(i=0;i<Math.floor(this.height/this.lineHeight) && i<this.lines.length;i++){
		len+=this.lines[i].length;
	}
	return len;
}

//show the contents of the current "box"
Sburb.FontEngine.prototype.showAll = function(){
	this.end = this.batchLength()+1;
}






////////////////////////////////////
//FormatRange class
////////////////////////////////////

Sburb.FormatRange = function(minIndex,maxIndex,type,extra){
	this.minIndex = minIndex;
	this.maxIndex = maxIndex;
	this.type = type;
	this.extra = typeof extra == "string"?extra:"";
}





return Sburb;
})(Sburb || {});
