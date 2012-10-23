var Sburb = (function(Sburb){




//////////////////////////////////////////
//Sprite Class
//////////////////////////////////////////

function Sprite(name,x,y,width,height,dx,dy,depthing,collidable){
	this.x = x;
	this.y = y;
	this.dx = typeof dx == "number" ? dx : 0;
	this.dy = typeof dy == "number" ? dy : 0;
	this.width = width;
	this.height = height;
	this.depthing = typeof depthing == "number" ? depthing : this.BG_DEPTHING; //bg, fg, or mg
	this.collidable = typeof collidable == "boolean" ? collidable : false;
	this.animations = {};
	this.animation = null;
	this.state = null;
	this.lastTime = 0;
	this.actions = [];
	this.name = name;
	this.queries = null;
}

Sprite.prototype.BG_DEPTHING = 0;
Sprite.prototype.MG_DEPTHING = 1;
Sprite.prototype.FG_DEPTHING = 2;

Sprite.prototype.addAnimation = function(anim){
	this.animations[anim.name] = anim;
}

Sprite.prototype.startAnimation = function(name){
	if(this.state!=name && this.animations[name]){
		this.animation = this.animations[name];
		this.animation.reset();
		this.state = name;
	}
}

Sprite.prototype.update = function(curRoom){
	if(this.animation){
		if(this.animation.hasPlayed() && this.animation.followUp){
			this.startAnimation(this.animation.followUp);
		}else{
			this.animation.update();
		}
	}
}

Sprite.prototype.draw = function(){
	if(this.animation){
		this.animation.draw(this.x,this.y);
	}
}


Sprite.prototype.isBehind = function(other){
	if(this.depthing == other.depthing){
		return this.y+this.dy<other.y+other.dy;
	}else{
		return this.depthing<other.depthing;
	}
}

Sprite.prototype.collides = function(other,dx,dy){
	var x = this.x+(dx?dx:0);
	var y = this.y+(dy?dy:0);
	if(other.collidable){
		if( (x-this.width/2<other.x+other.width/2) &&
			 (x+this.width/2>other.x-other.width/2) &&
			 (y-this.height/2<other.y+other.height/2) &&
			 (y+this.height/2>other.y-other.height/2) ) {
			 return true;
		}
	}
	return false;
}
Sprite.prototype.hitsPoint = function(x,y){
	if( (this.x-this.width/2 <=x) &&
		(this.x+this.width/2 >=x) &&
		(this.y-this.height/2 <=y) &&
		(this.y+this.height/2 >=y) ) {
		return true;
	}
    return false;
}

Sprite.prototype.isVisuallyUnder = function(x,y){
	return this.animation && this.animation.isVisuallyUnder(x-this.x,y-this.y);
}

Sprite.prototype.addAction = function(action){
	this.actions.push(action);
}

Sprite.prototype.removeAction = function(name){
	for(var i=0;i<this.actions.length;i++){
		if(this.actions[i].name==name){
			this.actions.splice(i,1);
			return;
		}
	}
}

Sprite.prototype.getActions = function(sprite){
	var validActions = [];
	for(var i=0;i<this.actions.length;i++){
		var action = this.actions[i];
		var desired = action.sprite;
		if(!desired || desired==sprite.name
			|| (desired.charAt(0)=="!" && desired.substring(1)!=sprite.name)){
			validActions.push(action);
		}
	}
	return validActions;
}

Sprite.prototype.getBoundaryQueries = function(dx,dy){
	var spriteX = this.x+(dx?dx:0);
	var spriteY = this.y+(dy?dy:0);
	var w = this.width/2;
	var h = this.height/2;
	if(!this.queries){
		this.queries = {upRight:{},upLeft:{},downLeft:{},downRight:{},downMid:{},upMid:{}};
	}
	this.queries.upRight.x=spriteX+w;
	this.queries.upRight.y=spriteY-h;
	this.queries.upLeft.x=spriteX-w;
	this.queries.upLeft.y=spriteY-h;
	this.queries.downLeft.x=spriteX-w;
	this.queries.downLeft.y=spriteY+h;
	this.queries.downRight.x=spriteX+w;
	this.queries.downRight.y=spriteY+h;
	this.queries.downMid.x=spriteX;
	this.queries.downMid.y=spriteY+h;
	this.queries.upMid.x=spriteX;
	this.queries.upMid.y=spriteY-h;
	return this.queries;
}

Sprite.prototype.serialize = function(output){
	var animationCount = 0;
	for(var anim in this.animations){
        if(!this.animations.hasOwnProperty(anim)) continue;
        animationCount++;
	}
	
	output = output.concat("\n<sprite "+
		Sburb.serializeAttributes(this,"name","x","y","dx","dy","width","height","depthing","collidable")+
		(animationCount>1?"state='"+this.state+"' ":"")+
		">");

	for(var anim in this.animations){
        if(!this.animations.hasOwnProperty(anim)) continue;
		output = this.animations[anim].serialize(output);
	}
	for(var i=0; i < this.actions.length; i++){
		output = this.actions[i].serialize(output);
	}
	output = output.concat("\n</sprite>");
	return output;
}

Sprite.prototype.clone = function(newName) {
	var newSprite = new Sburb.Sprite(newName,this.x,this.y,this.width,this.height,this.dx,this.dy,this.depthing,this.collidable);
	for(var anim in this.animations) {
		if(this.animations.hasOwnProperty(anim)) {
			newSprite.addAnimation(this.animations[anim].clone());
		}
	}
	for(var action in this.actions) {
		if(this.actions.hasOwnProperty(action)) {
			newSprite.addAction(this.actions[action].clone());
		}
	}
	if(this.animation) {
		newSprite.startAnimation(this.animation.name);
	}
	Sburb.sprites[newName]=newSprite;
	return newSprite;
}





///////////////////////////////////////////
//Related Utility Functions
///////////////////////////////////////////

Sburb.parseSprite = function(spriteNode, assetFolder) {
	var attributes = spriteNode.attributes;
	
	var newName = null;
	var newX = 0;
	var newY = 0;
	var newWidth = 0;
	var newHeight = 0;
	var newDx = 0;
	var newDy = 0;
	var newDepthing = 0;
	var newCollidable = false;
	var newState = null;
	var newAnimations = {};

	var temp;
	newName = (temp=attributes.getNamedItem("name"))?temp.value:newName;
	newX = (temp=attributes.getNamedItem("x"))?parseInt(temp.value):newX;
	newY = (temp=attributes.getNamedItem("y"))?parseInt(temp.value):newY;
	newWidth = (temp=attributes.getNamedItem("width"))?parseInt(temp.value):newWidth;
	newHeight = (temp=attributes.getNamedItem("height"))?parseInt(temp.value):newHeight;
	newDx = (temp=attributes.getNamedItem("dx"))?parseInt(temp.value):newDx;
	newDy = (temp=attributes.getNamedItem("dy"))?parseInt(temp.value):newDy;
	newDepthing = (temp=attributes.getNamedItem("depthing"))?parseInt(temp.value):newDepthing;
	newCollidable = (temp=attributes.getNamedItem("collidable"))?temp.value!="false":newCollidable;
	newState = (temp=attributes.getNamedItem("state"))?temp.value:newState;
	
 	var newSprite = new Sprite(newName,newX,newY,newWidth,newHeight,newDx,newDy,newDepthing,newCollidable);
	
	
	var anims = spriteNode.getElementsByTagName("animation");
	for(var j=0;j<anims.length;j++){
		var newAnim = Sburb.parseAnimation(anims[j],assetFolder);
		newSprite.addAnimation(newAnim);
		if(newState==null){
			newState = newAnim.name;
		}
	}
	if(anims.length==0) {
		var asset = Sburb.assets[newName];
		if(asset && asset.type == "graphic") {
			newSprite.addAnimation(new Sburb.Animation("image",asset));
			newState = "image";
		}
	}
	newSprite.startAnimation(newState);
	
	return newSprite;
}




Sburb.Sprite = Sprite;

return Sburb;
})(Sburb || {});
