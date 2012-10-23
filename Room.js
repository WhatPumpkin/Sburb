var Sburb = (function(Sburb){





///////////////////////////////////
//Room Class
///////////////////////////////////

//constructor
Sburb.Room = function(name,width,height){
	this.name = name;
	this.width = width;
	this.height = height;
	this.sprites = [];
	this.effects = [];
	this.walkables = [];
	this.unwalkables = [];
	this.motionPaths = [];
	this.triggers = [];
	this.walkableMap = null;
	this.mapScale = 4;
}

Sburb.Room.prototype.mapData = null;
Sburb.Room.prototype.blockSize = 500;

//add an Effect to the room
Sburb.Room.prototype.addEffect = function(effect){
	this.effects.push(effect);
}

//add a Trigger to the room
Sburb.Room.prototype.addTrigger = function(trigger){
	this.triggers.push(trigger);
}

//add a Sprite to the room
Sburb.Room.prototype.addSprite = function(sprite){
	if(!this.contains(sprite)){
		this.sprites.push(sprite);
	}
}

//remove a Sprite from the room
Sburb.Room.prototype.removeSprite = function(sprite){
	var i;
	for(i=0;i<this.sprites.length;i++){
		if(this.sprites[i]==sprite){
			this.sprites.splice(i,1);
			return true;
		}
	}
	return false;
}

//add a walkable to the room
Sburb.Room.prototype.addWalkable = function(path){
	this.walkables.push(path);
}

//add an unwalkable to the room
Sburb.Room.prototype.addUnwalkable = function(path){
	this.unwalkables.push(path);
}

//add a motionPath to the room
Sburb.Room.prototype.addMotionPath = function(path,xtox,xtoy,ytox,ytoy,dx,dy) {
	var motionPath = new function (){
		this.path = path;
		this.xtox = xtox; this.xtoy = xtoy;
		this.ytox = ytox; this.ytoy = ytoy;
		this.dx = dx; this.dy = dy;
	};
	this.motionPaths.push(motionPath);
}

//remove a walkable from the room
Sburb.Room.prototype.removeWalkable = function(path){
	this.walkables.splice(this.walkables.indexOf(path),1);
}

//remove an unwalkable to the room
Sburb.Room.prototype.removeUnwalkable = function(path){
	this.unwalkables.splice(this.unwalkables.indexOf(path),1);
}

//remove a motionPath from the room
Sburb.Room.prototype.removeMotionPath = function(path) {
	for(var i=0;i<this.motionPaths.length;i++){
		var mpath = this.motionPaths[i];
		if(mpath.name == path.name){
			this.motionPaths.splice(i,1);
			return;
		}
	}
}

//perform any intialization
Sburb.Room.prototype.enter = function(){
	
	if(this.walkableMap){
		var mapCanvas = Sburb.Map;
		
		var drawWidth = mapCanvas.width = this.walkableMap.width;
		var drawHeight = mapCanvas.height = this.walkableMap.height;
		var ctx = mapCanvas.getContext("2d");
		ctx.drawImage(this.walkableMap,0,0,drawWidth,drawHeight, 0,0,drawWidth,drawHeight);
		
		this.mapData = ctx.getImageData(0,0,drawWidth,drawHeight).data;
		/*this.mapData = new Uint8Array(drawWidth*drawHeight);
		for(var x=0;x<drawWidth;x+=this.blockSize){
			var width = Math.min(this.blockSize,drawWidth-x);
			for(var y=0;y<drawHeight;y+=this.blockSize){
				var height = Math.min(this.blockSize,drawHeight-y);
				var data = ctx.getImageData(x,y,width,height).data;
				for(var j=0;j<height;j++){
					for(var i=0;i<width;i++){
						
						this.mapData[x+i+(y+j)*drawWidth] = data[(i+j*width)*4];
					}
				}
			}
		}*/
	}
}

//perform any exit activities necessary
Sburb.Room.prototype.exit = function(){
	this.effects = [];
	this.mapData = null;
}

//check if the room contains the sprite
Sburb.Room.prototype.contains = function(sprite){
	for(var i=0;i<this.sprites.length;i++){
		if(this.sprites[i]==sprite){
			return true;
		}
	}
	return false;
}

//update the room one frame
Sburb.Room.prototype.update = function(){
	var i;
	for(i=0;i<this.sprites.length;i++){
		this.sprites[i].update(this);
	}
	for(i=this.effects.length-1;i>=0;i--){
		if(this.effects[i].hasPlayed()){
			this.effects.splice(i,1);
		}else{
			this.effects[i].update();
		}
	}
	for(i=this.triggers.length-1;i>=0;i--){
		if(this.triggers[i].tryToTrigger()){
			this.triggers.splice(i,1);
		}
	}
}

//draw the room
Sburb.Room.prototype.draw = function(){
	this.sortDepths();
	
	for(var i=0;i<this.sprites.length;i++){
		this.sprites[i].draw();
	}
	for(i=0;i<this.effects.length;i++){
		this.effects[i].draw(0,0);
	}
}

//sort the sprites by depth
Sburb.Room.prototype.sortDepths = function(){
	//insertion sort?!?
	var i,j;
	for(i=1,j=1;i<this.sprites.length;i++,j=i){
		var temp = this.sprites[j];
		while(j>0 && temp.isBehind(this.sprites[j-1])){
			this.sprites[j] = this.sprites[j-1]
			j--;
		}
		this.sprites[j] = temp;
	}
}

//query the room for an action based on actual collisions
Sburb.Room.prototype.queryActions = function(query,x,y){
	var validActions = [];
	for(var i=0;i<this.sprites.length;i++){
		var sprite = this.sprites[i];
		if(sprite!=query && sprite.hitsPoint(x,y)){
			validActions = validActions.concat(sprite.getActions(query));
		}
	}
	return validActions;
}

//query the room for an action based on visual collisions
Sburb.Room.prototype.queryActionsVisual = function(query,x,y){
	var validActions = [];
	for(var i=0;i<this.sprites.length;i++){
		var sprite = this.sprites[i];
		if(sprite.isVisuallyUnder(x,y)){
			validActions = validActions.concat(sprite.getActions(query));
		}
	}
	return validActions;
}

//check if the sprite is in bounds
Sburb.Room.prototype.isInBounds = function(sprite,dx,dy){
	
	var queries = sprite.getBoundaryQueries(dx,dy);
	var result = this.isInBoundsBatch(queries);
	for(var point in result){
		if(!result[point]){ // I'll let this lack of hasOwnProperty slide
			return false;
		}
	}
	return true;
}

//check if a series of points are in bounds
Sburb.Room.prototype.isInBoundsBatch = function(queries,results){
	if(typeof results != "object"){
		results = {};
		for(var queryName in queries){
		    if(!queries.hasOwnProperty(queryName)) continue;
		    results[queryName] = false;
		}
	}
	if(this.walkableMap){
		for(var query in queries){
		    if(!queries.hasOwnProperty(query)) continue;
			var pt = queries[query];
			var data = this.mapData;
			var width = this.walkableMap.width;
			var height = this.walkableMap.height;
			if(pt.x<0 || pt.x>width*this.mapScale || pt.y<0 || pt.y>height*this.mapScale){
				results[query] = false;
			}else{
				var imgPt = (Math.round(pt.x/this.mapScale)+Math.round(pt.y/this.mapScale)*width)*4;
				results[query] = !!data[imgPt];
			}
		}
	}
	for(var i=0;i<this.walkables.length;i++){
		this.walkables[i].queryBatchPos(queries,results);
	}
	for(var i=0;i<this.unwalkables.length;i++){
		this.unwalkables[i].queryBatchNeg(queries,results);
	}
	
	return results;
}

//get the move function
Sburb.Room.prototype.getMoveFunction = function(sprite) {
	var motionPath = this.getMotionPath(sprite);
    if(motionPath){
		return function(ax, ay) {
			var fx,fy;
			fx = (ax*motionPath.xtox + ay*motionPath.ytox + motionPath.dx);
			fy = (ax*motionPath.xtoy + ay*motionPath.ytoy + motionPath.dy);
			return {x:fx,y:fy};
		};
    }
}

Sburb.Room.prototype.getInverseMoveFunction = function(sprite){
   var motionPath = this.getMotionPath(sprite);
    if(motionPath){
        return function(ax, ay) {
            ax -= motionPath.dx;
            ay -= motionPath.dy;
            var fx,fy;
            var det =  motionPath.xtox*motionPath.ytoy - motionPath.xtoy*motionPath.ytox;
            if(det){
                fx = (ax*motionPath.ytoy - ay*motionPath.ytox)/det;
                fy = (-ax*motionPath.xtoy + ay*motionPath.xtox)/det;
                return {x:fx,y:fy};
            }else{
                //there is no inverse
                return {x:0, y:0};
            }
        };
    } 
}

Sburb.Room.prototype.getMotionPath = function(sprite){
    for(i=0; i<this.motionPaths.length; i++) {
        var motionPath = this.motionPaths[i];
        if( motionPath.path.query(sprite)) {
            return motionPath;
        }
    }
    return null;
}

//check if a sprite collides with anything
Sburb.Room.prototype.collides = function(sprite,dx,dy){
	for(var i=0;i<this.sprites.length;i++){
		var theSprite = this.sprites[i];
		if(theSprite.collidable && sprite!=theSprite){
			if( sprite.collides(theSprite,dx,dy)){
				return theSprite;
			}
		}
	}
	return null;
}

//serialize the room to XML
Sburb.Room.prototype.serialize = function(output){
	output = output.concat("\n<room name='"+this.name+
	"' width='"+this.width+
	"' height='"+this.height+
	(this.walkableMap?("' walkableMap='"+this.walkableMap.name):"")+
	(this.mapScale!=4?("' mapScale='"+this.mapScale):"")+
	"' >");
	output = output.concat("\n<paths>");
	for(var i=0;i<this.walkables.length;i++){
		var walkable = this.walkables[i];
		output = output.concat("\n<walkable path='"+walkable.name+"'/>");
	}
	for(var i=0;i<this.unwalkables.length;i++){
		var unwalkable = this.unwalkables[i];
		output = output.concat("\n<unwalkable path='"+unwalkable.name+"'/>");
	}
	for(var i=0;i<this.motionPaths.length;i++){
		var motionPath = this.motionPaths[i];
		 output = output.concat("\n<motionpath path='"+motionPath.path.name+"' xtox='"+motionPath.xtox+"' xtoy='"+motionPath.xtoy+
		 "' ytox='"+motionPath.ytox+"' ytoy='"+motionPath.ytoy+"' dx='"+motionPath.dx+"' dy='"+motionPath.dy+"'/>");
	}
	output = output.concat("\n</paths>");
	output = output.concat("\n<triggers>");

	for(var i=0;i<this.triggers.length;i++){
		output = this.triggers[i].serialize(output);
	}
	output = output.concat("\n</triggers>");
	for(var i=0; i < this.sprites.length; i++){
	    output = this.sprites[i].serialize(output);
	}
	
	output = output.concat("\n</room>");
	return output;
}






///////////////////////////////////////////////
//Related Utility Functions
///////////////////////////////////////////////

//parse a room from XML
Sburb.parseRoom = function(roomNode, assetFolder, spriteFolder) {
  	var attributes = roomNode.attributes;
  	var newRoom = new Sburb.Room(attributes.getNamedItem("name").value,
  			       attributes.getNamedItem("width")?parseInt(attributes.getNamedItem("width").value):0,
  			       attributes.getNamedItem("height")?parseInt(attributes.getNamedItem("height").value):0);
  	
  	var mapScale = attributes.getNamedItem("mapScale");
  	if(mapScale){
  		newRoom.mapScale = parseInt(mapScale.value);
  	}
  	
  	var walkableMap = attributes.getNamedItem("walkableMap");
  	if(walkableMap){
  		newRoom.walkableMap = assetFolder[walkableMap.value];
  		if(!newRoom.width){
  			newRoom.width = newRoom.walkableMap.width*newRoom.mapScale;
  		}
  		
  		if(!newRoom.height){
  			newRoom.height = newRoom.walkableMap.height*newRoom.mapScale;
  		}
  	}
  	
  	Sburb.serialLoadRoomSprites(newRoom,roomNode.getElementsByTagName("sprite"), spriteFolder);
  	Sburb.serialLoadRoomSprites(newRoom,roomNode.getElementsByTagName("character"), spriteFolder);
  	Sburb.serialLoadRoomSprites(newRoom,roomNode.getElementsByTagName("fighter"), spriteFolder);
  	var paths = roomNode.getElementsByTagName("paths");
  	if(paths.length>0){
		Sburb.serialLoadRoomPaths(newRoom, paths, assetFolder);
	}
	var triggers = roomNode.getElementsByTagName("triggers")
	if(triggers.length>0){
		Sburb.serialLoadRoomTriggers(newRoom,triggers,spriteFolder);
	}
	return newRoom;
}




return Sburb;
})(Sburb || {});

(function() {
  try {
    var a = new Uint8Array(1);
    return; //no need
  } catch(e) { }

  function subarray(start, end) {
    return this.slice(start, end);
  }

  function set_(array, offset) {
    if (arguments.length < 2) offset = 0;
    for (var i = 0, n = array.length; i < n; ++i, ++offset)
      this[offset] = array[i] & 0xFF;
  }

  // we need typed arrays
  function TypedArray(arg1) {
    var result;
    if (typeof arg1 === "number") {
       result = new Array(arg1);
       for (var i = 0; i < arg1; ++i)
         result[i] = 0;
    } else
       result = arg1.slice(0);
    result.subarray = subarray;
    result.buffer = result;
    result.byteLength = result.length;
    result.set = set_;
    if (typeof arg1 === "object" && arg1.buffer)
      result.buffer = arg1.buffer;

    return result;
  }

  window.Uint8Array = TypedArray;
  window.Uint32Array = TypedArray;
  window.Int32Array = TypedArray;
})();
