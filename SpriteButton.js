var Sburb = (function(Sburb){




///////////////////////////////////////////
//SpriteButton class
///////////////////////////////////////////

//constructor
Sburb.SpriteButton = function(name,x,y,width,height,sheet,action){
	Sburb.Sprite.call(this,name,x,y,width,height);
	
	this.pressed = false;
	this.mousePressed = false;
	this.clicked = false;
	this.action?action:null;
	
	for(var i=0;i<(sheet.width/this.width)*(sheet.height/this.height);i++){
		this.addAnimation(new Sburb.Animation("state"+i,sheet,0,0,width,height,i,1,1000));
	}
	
	this.startAnimation("state0");
}

Sburb.SpriteButton.prototype = new Sburb.Sprite();

Sburb.SpriteButton.prototype.update = function(){
	Sburb.Sprite.prototype.update.call(this);
	this.updateMouse();
}

//update button in relation to mouse state
Sburb.SpriteButton.prototype.updateMouse = function(){
	var x = Sburb.Mouse.x;
	var y = Sburb.Mouse.y;
	var mouseDown = Sburb.Mouse.down;
	this.clicked = false;
	if(this.hitsPoint(x-this.width/2,y-this.height/2)){
		Sburb.Stage.style.cursor = "pointer";
	}
	if(mouseDown){
		if(!this.mousePressed){
			this.mousePressed = true;
			if(this.hitsPoint(x-this.width/2,y-this.height/2)){
				this.pressed = true;
			}
		}
	}else{
		if(this.pressed){
			if(this.hitsPoint(x-this.width/2,y-this.height/2)){
				this.clicked = true;
				var nextState = "state"+(parseInt(this.animation.name.substring(5,this.animation.name.length))+1);
				if(this.animations[nextState]){
					this.startAnimation(nextState);
				}else{
					this.startAnimation("state0");
				}
			}
		}
		this.pressed = false;
		this.mousePressed = false;
	}
	if(this.clicked && this.action){
		Sburb.performAction(this.action);
	}
}

Sburb.SpriteButton.prototype.setState = function(state){
	this.startAnimation("state"+state);
}

//serialize this SpriteButton to XML
Sburb.SpriteButton.prototype.serialize = function(output){
	output = output.concat("\n<spritebutton name='"+this.name+
		(this.x?"' x='"+this.x:"")+
		(this.y?"' y='"+this.y:"")+
		"' width='"+this.width+
		"' height='"+this.height+
		"' sheet='"+this.animation.sheet.name+
		"' >");
	if(this.action){
		output = this.action.serialize(output);
	}
	output = output.concat("</spritebutton>");
	return output;
}




///////////////////////////////////////////////
//Related Utility Functions
///////////////////////////////////////////////

//Parse a SpriteButton from XML
Sburb.parseSpriteButton = function(button){
	var attributes = button.attributes;
	var sheet = Sburb.assets[attributes.getNamedItem("sheet").value];
	var newButton = new Sburb.SpriteButton(attributes.getNamedItem("name").value,
  									attributes.getNamedItem("x")?parseInt(attributes.getNamedItem("x").value):0,
  									attributes.getNamedItem("y")?parseInt(attributes.getNamedItem("y").value):0,
  									attributes.getNamedItem("width")?parseInt(attributes.getNamedItem("width").value):sheet.width,
  									attributes.getNamedItem("width")?parseInt(attributes.getNamedItem("height").value):sheet.height,
  									sheet);
  	var curAction = button.getElementsByTagName("action");
  	if(curAction.length>0){
  		var newAction = Sburb.parseAction(curAction[0]);
  		newButton.action = newAction;
  	}
  	return newButton;
}




return Sburb;
})(Sburb || {});
