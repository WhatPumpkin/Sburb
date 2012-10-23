var Sburb = (function(Sburb){

function parseParams(info){
	var params = info.split(",");
	params.map(function(param) { return param.trim(); });
	return params;
}

var events = {};

// Please list all 9f y9ur triggers here so I can handle them c9rrectly.
//...I can't tell if you're trying to use some troll thing or broke your "o" key

// Trigger functions are called with "new"; functions should set
// this.reset (for when the trigger is initialized/reset) and
// this.checkCompletion (which should return true or false based
// on whether the trigger has been completed).

//Check if the given sprite's property satisfies some condition
//syntax: spriteName, query (e.g. x=3)
events.spriteProperty = function(info) {
	var params = parseParams(info);
	var token;
	var query = params[2];
	if((query.indexOf(">")>-1 && (token=">")) ||
	   (query.indexOf("GREATER") > -1 && (token="GREATER"))){
		this.trigger = function(entity,property,target){
			return entity[property]>target;
		};	
	}else if((query.indexOf("<")>-1 && (token="<")) ||
	         (query.indexOf("LESS") > -1 && (token="LESS"))){
		this.trigger = function(entity,property,target){
			return entity[property]<target;
		};
	}else if(query.indexOf("!=")>-1){
		token = "!=";
		this.trigger = function(entity,property,target){
			return entity[property]!=target;
		};				
	}else if(query.indexOf("=")>-1){
		token = "=";
		this.trigger = function(entity,property,target){
			return entity[property]==target;
		};		
	}
	var queryParts = query.split(token);
	var property = queryParts[0].trim();
	var target = queryParts[1].trim();

	this.reset = function() {
		if(params[1]=="char"){
			this.entity = params[1];
		} else{
			this.entity = Sburb.sprites[params[1]];
		}
	}	
	this.checkCompletion = function(){
		var entity = this.entity;
		if(this.entity=="char"){
			entity = Sburb.char;
		}
		return this.trigger(entity,property,target);
	}
};

//Check if the given sprite is inside a box
//syntax: spriteName, x, y, width, height
events.inBox = function(info) {
	var params = parseParams(info);
	var x = parseInt(params[2]);
	var y = parseInt(params[3]);
	var width = parseInt(params[4]);
	var height = parseInt(params[5]);
	this.reset = function() {
		if(params[1]=="char"){
			this.entity = params[1];
		}else{
			this.entity = Sburb.sprites[params[1]];
		}
	}
	this.checkCompletion = function(){
		var entity = this.entity;
		if(this.entity=="char"){
			entity = Sburb.char;
		}
		return entity.x >= x && entity.y >= y && entity.x <= x+width && entity.y <= y+height;
	}
};

events.inBox2 = function(info){
	var params = parseParams(info);
	var x1 = parseInt(params[2]);
	var y1 = parseInt(params[3]);
	var x2 = parseInt(params[4]);
	var y2 = parseInt(params[5]);
	var x = Math.min(x1,x2);
	var y = Math.min(y1,y2);
	var width = Math.abs(x1-x2);
	var height = Math.abs(y1-y2);
	return new events.inBox("inBox,"+params[1]+","+x+","+y+","+width+","+height);
}

//Check if a certain interval of time has elapsed
//syntax: time
events.time = function(info) {
	var params = parseParams(info);
	this.reset = function() {
		this.time = parseInt(params[1]);
	}
	this.checkCompletion = function(){
		this.time--;
		return this.time<=0;
	};
	this.serialize = function(){
		return "time,"+this.time;
	}
};

//Check if the sprite's animation has played
//sytax: spriteName
events.played = function(info) {
	var params = parseParams(info);
	this.reset = function() {
		this.entity = Sburb.sprites[params[1]];
	}
	this.checkCompletion = function(){
		var entity = this.entity;
		if(this.entity=="char"){
			entity = Sburb.char;
		}
		return entity.animation.hasPlayed();
	};
};

//check if the movie has finished playing (iternal utility event)
//syntax: movieName
events.movie = function(info) {
	var params = parseParams(info);
	var threshold = parseInt(params[2]);
	this.reset = function() {
		this.movie = window.document.getElementById("movie"+params[1]);
	}
	this.checkCompletion = function(){
		if(this.movie && (!this.movie.TotalFrames || 
				  (this.movie.TotalFrames()>0 && this.movie.TotalFrames()-1-this.movie.CurrentFrame()<=threshold))){
			Sburb.commands.removeMovie(params[1]);
			return true;
		}
		return false;
	}
};

//check if the game state meets a certain condition
//syntax: condition (e.g. doorOpened=true)
events.gameState = function(info) {
	var params = parseParams(info);
	var token;
	var query = params[1];
	if((query.indexOf(">")>-1 && (token=">")) ||
	   (query.indexOf("GREATER") > -1 && (token="GREATER"))){
		this.trigger = function(property,target){
			return Sburb.gameState[property]>target;
		};
	}else if((query.indexOf("<")>-1 && (token="<")) ||
	         (query.indexOf("LESS") > -1 && (token="LESS"))){
		this.trigger = function(property,target){
			return Sburb.gameState[property]<target;
		};
	}else if(query.indexOf("!=")>-1){
		token = "!=";
		this.trigger = function(property,target){
			return Sburb.gameState[property]!=target;
		};
	}else if(query.indexOf("=")>-1){
 		token = "=";
		this.trigger = function(property,target){
			return Sburb.gameState[property]==target;
		};		
	}
	var queryParts = query.split(token);
	var property = queryParts[0].trim();
	var target = queryParts[1].trim();
	this.reset = function() {
		// pass
	}	
	this.checkCompletion = function(){
		return this.trigger(property,target);
	}
};	

//check if the player is nudging the game forward (space or mouse)
//syntax: none
events.nudge = function(info){
	this.reset = function(){ } //do nothing
	this.checkCompletion = function(){
		return Sburb.Keys.space || Sburb.Mouse.down;
	}
}

//check that there are no pending or active actions on the queue
//syntax: none
events.noActions = function(info){
	var params = parseParams(info);
	this.reset = function(){ } //do nothing
	this.checkCompletion = function(){
		var queue = params.length>0 ? Sburb.getActionQueueById(params[1]) : Sburb;
		return !queue || !queue.curAction;
	}
}

//check if two sprites are near each other
//syntax spriteName1, spriteName2, distance (px)
events.withinRange = function(info){
	var params = parseParams(info);
	var spriteName1 = params[1];
	var spriteName2 = params[2];
	var dist = parseFloat(params[3]);

	this.reset = function(){ } //do nothing
	this.checkCompletion = function(){
			var sprite1 = Sburb.parseCharacterString(spriteName1);
			var sprite2 = Sburb.parseCharacterString(spriteName2);
			var xDist = sprite1.x-sprite2.x;
			var yDist = sprite1.y-sprite2.y;
			return Math.sqrt(xDist*xDist + yDist*yDist) <= dist;
	}
}

Sburb.events = events;
return Sburb;

})(Sburb || {});