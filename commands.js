var Sburb = (function(Sburb){

function parseParams(info){
	var params = info.split(",");
	for(var i=0; i<params.length; i++){
		params[i] = params[i].trim();
	}
	return params;
}

var commands = {};


//Create a Dialog
//syntax: dialog syntax
commands.talk = function(info){
	Sburb.dialoger.startDialog(info);
}

//Pick a random line of dialog
//syntax: dialog syntax
commands.randomTalk = function(info){
	Sburb.dialoger.startDialog(info);
	var randomNum = Math.floor(Math.random()*(Sburb.dialoger.queue.length+1));
	if(randomNum){
		Sburb.dialoger.queue = [Sburb.dialoger.queue[randomNum-1]];
		Sburb.dialoger.nextDialog();
	}else{
		Sburb.dialoger.queue = [];
	}
}

//Change the room and move the character to a new location in that room
//syntax: roomName, newCharacterX, newCharacterY
commands.changeRoom = function(info){
	var params = parseParams(info);
	Sburb.changeRoom(Sburb.rooms[params[0]],parseInt(params[1]),parseInt(params[2]));
    Sburb.loadingRoom = false; // We did it!
}

//Change the focus of the camera
//syntax: spriteName
commands.changeFocus = function(info){
	var params = parseParams(info);
	if(params[0]=="null"){
		Sburb.focus = Sburb.destFocus = null;
	}else{
		var sprite = parseCharacterString(params[0]);
		Sburb.destFocus = sprite;
	}
}

//Perform changeRoom, and also add teleport effects
//syntax: see changeRoom
commands.teleport = function(info){
	commands.changeRoom(info);
	Sburb.playEffect(Sburb.effects["teleportEffect"],Sburb.char.x,Sburb.char.y);
	var params = parseParams(info);
	Sburb.curAction.followUp = new Sburb.Action("playEffect","teleportEffect,"+params[1]+","+params[2],null,null,Sburb.curAction.followUp);
	//playSound(new BGM(assets["teleportSound"],0));
}

//Set a different Character as the player
//syntax: newPlayerName
commands.changeChar = function(info){
	Sburb.char.becomeNPC();
	Sburb.char.moveNone();
	Sburb.char.walk();
	Sburb.destFocus = Sburb.char = Sburb.sprites[info];
	Sburb.char.becomePlayer();
	Sburb.setCurRoomOf(Sburb.char);
}

//Set the given song as the new background music
//syntax: songName, loopingStartPoint (seconds)
commands.playSong = function(info){
	var params = parseParams(info);
	
	Sburb.changeBGM(new Sburb.BGM(Sburb.assets[params[0]],parseFloat(params[1])));
}

commands.becomeNPC = function(info){
	Sburb.char.becomeNPC();
}

commands.becomePlayer = function(info){
	Sburb.char.becomePlayer();
}

//Play the given sound
//syntax: soundName
commands.playSound = function(info){
	Sburb.playSound(new Sburb.Sound(Sburb.assets[info.trim()]));
}

//Play the given effect and the given location
//syntax: effectName, x, y
commands.playEffect = function(info){
	var params = parseParams(info);
	Sburb.playEffect(Sburb.effects[params[0]],parseInt(params[1]),parseInt(params[2]));
}

//Have the specified sprite play the specified animation
//syntax: spriteName, animationName
commands.playAnimation = commands.startAnimation = function(info){
	var params = parseParams(info);
	var sprite = parseCharacterString(params[0]);
	
	sprite.startAnimation(params[1]);
}

//Add actions to a sprite
//Syntax: spriteName, SBURBML action tags
commands.addAction = commands.addActions = function(info){
	var params = parseParams(info);
	var firstComma = info.indexOf(",");
	var sprite = parseCharacterString(params[0]);
	var actionString = info.substring(firstComma+1,info.length);

	var actions = parseActionString(actionString);

	for(var i=0;i<actions.length;i++){
		var action = actions[i];
		sprite.addAction(action);
	}
}

//Remove an action from a sprite
//Syntax: spriteName, actionName
commands.removeAction = commands.removeActions = function(info){
	var params = parseParams(info);
	var sprite = parseCharacterString(params[0]);
	for(var i=1;i<params.length;i++){
		sprite.removeAction(params[i]);
	}
}

//Present player with following actions to choose from
//Sytax: SBURBML action tags
commands.presentAction = commands.presentActions = function(info){
	var actions = parseActionString(info);
	Sburb.chooser.choices = actions;
	Sburb.chooser.beginChoosing(Sburb.Stage.x+20,Sburb.Stage.y+50);
	//Sburb.Stage is the true position of the view. Sburb.cam is simply the desired position
}


//Open the specified chest, revealing the specified item, and with the specified text
//Syntax: chestName, itemName, message
commands.openChest = function(info){
	var params = info.split(",",2);
	var chest = Sburb.sprites[params[0].trim()];
	var item = Sburb.sprites[params[1].trim()];
	if(chest.animations["open"]){
		chest.startAnimation("open");
		if(Sburb.assets["openSound"]){
			commands.playSound("openSound");
		}
	}
	
	chest.removeAction(Sburb.curAction.name);
	var offset = params[0].length+params[1].length+2;
	var speech = info.substring(offset,info.length).trim();
	speech = speech.charAt(0)=="@" ? speech : "@! "+speech;
	var lastAction;
	var newAction = lastAction = new Sburb.Action("waitFor","played,"+chest.name,null,null);
	lastAction = lastAction.followUp = new Sburb.Action("waitFor","time,13");
	lastAction = lastAction.followUp = new Sburb.Action("addSprite",item.name+","+Sburb.curRoom.name,null,null,null,true);
	lastAction = lastAction.followUp = new Sburb.Action("moveSprite",item.name+","+chest.x+","+(chest.y-60),null,null,null,true,true);
	lastAction = lastAction.followUp = new Sburb.Action("deltaSprite",item.name+",0,-3",null,null,null,true,null,10);
	if(Sburb.assets["itemGetSound"]){
		lastAction = lastAction.followUp = new Sburb.Action("playSound","itemGetSound",null,null,null,true,null);
	}
	lastAction = lastAction.followUp = new Sburb.Action("waitFor","time,30");
	lastAction = lastAction.followUp = new Sburb.Action("talk",speech);
	
	lastAction = lastAction.followUp = new Sburb.Action("removeSprite",item.name+","+Sburb.curRoom.name);
	lastAction.followUp = Sburb.curAction.followUp;
	Sburb.performAction(newAction);
}

//Move the specified sprite by the specified amount
//syntax: spriteName, dx, dy
commands.deltaSprite = function(info){
	var params = parseParams(info);
	var sprite = null;
	if(params[0]=="char"){
		sprite = Sburb.char;
	}else{
		sprite = Sburb.sprites[params[0]];
	}
	var dx = parseInt(params[1]);
	var dy = parseInt(params[2]);
	sprite.x+=dx;
	sprite.y+=dy;
}

//Move the specified sprite to the specified location
//syntax: spriteName, x, y
commands.moveSprite = function(info){
	var params = parseParams(info);
	var sprite = parseCharacterString(params[0]);
	var newX = parseInt(params[1]);
	var newY = parseInt(params[2]);
	sprite.x = newX;
	sprite.y = newY;
}

//Move the specified sprite to the specified depth
//syntax: spriteName, depth
commands.depthSprite = function(info){
	var params = parseParams(info);
	var sprite = parseCharacterString(params[0]);
	var depth = parseInt(params[1]);
	sprite.depthing = depth;
}


//Play the specified flash movie
//syntax: movieName
commands.playMovie = function(info){
	var params = parseParams(info);
	Sburb.playMovie(Sburb.assets[params[0]]);
	if(params.length>0){
		var interval = setInterval(function(){
			var movie = window.document.getElementById("movie"+params[0]);
			if(movie && (!movie.CurrentFrame || movie.CurrentFrame()>=4)){
				clearInterval(interval);
				commands.playSong(info.substring(info.indexOf(",")+1,info.length));
			}
		},10);
	}
}

//Remove the specified flash movie
//syntax: movieName
commands.removeMovie = function(info){
	Sburb.playingMovie = false;
	Sburb.draw();
	document.getElementById(info).style.display = "none";
	//document.getElementById("gameDiv").style.display = "block";
	
}

//Prevents user from providing input to the character
//syntax: none
commands.disableControl = function(info){
	Sburb.inputDisabled = info.trim().length>0 ? new Sburb.Trigger(info) : true;
}

//Undoes disableControl
//syntax: none
commands.enableControl = function(info){
	Sburb.inputDisabled = false;
}

//DEPRECATED; DO NOT USE
//Block user input and main-queue progression until the specified Event
//syntax: Event syntax
commands.waitFor = function(info){
	commands.disableControl(info);
	return commands.sleep(info);
}

//Execute an action and wait for all followUps to finish
//syntax: SBURBML action tag
commands.macro = function(info){
	var actions = parseActionString(info);
	var action = actions[0];
	if(!action.silent) {
		action.silent = true;
	}
	var newQueue = Sburb.performAction(action);
	if(newQueue) {
		return new Sburb.Trigger("noActions,"+newQueue.id);
	}
}

//Wait for the specified event before continuing the current queue
//syntax: Event syntax
commands.sleep = function(info){
	return new Sburb.Trigger(info);
}

//Pauses an actionQueue, it can be resumed with resumeActionQueue
//syntax: Id of actionQueue or list of Ids
commands.pauseActionQueue = commands.pauseActionQueues = function(info){
	var params = parseParams(info);
	for(var i=0;i<params.length;i++) {
		var queue=Sburb.getActionQueueById(params[i]);
		if(queue) {
			queue.paused = true;
		}
	}
}

//Resumes an previously paused actionQueue
//syntax: Id of actionQueue or list of Ids
commands.resumeActionQueue = commands.resumeActionQueues = function(info){
	var params = parseParams(info);
	for(var i=0;i<params.length;i++) {
		var queue=Sburb.getActionQueueById(params[i]);
		if(queue) {
			queue.paused = false;
		}
	}
}

//Cancels an actionQueue
//syntax: Id of actionQueue or list of Ids
commands.cancelActionQueue = commands.cancelActionQueues = function(info){
	var params = parseParams(info);
	for(var i=0;i<params.length;i++) {
		Sburb.removeActionQueueById(params[i]);
	}
}

//Pauses a group of actionQueues, they can be resumed with resumeActionQueueGroup
//syntax: group name or list of group names
commands.pauseActionQueueGroup = commands.pauseActionQueueGroups = function(info){
	var params = parseParams(info);
	for(var i=0;i<params.length;i++) {
		Sburb.forEachActionQueueInGroup(params[i], function(queue) {
			queue.paused = true;
		});
	}
}

//Resumes a previously paused group of actionQueues
//syntax: group name or list of group names
commands.resumeActionQueueGroup = commands.resumeActionQueueGroups = function(info){
	var params = parseParams(info);
	for(var i=0;i<params.length;i++) {
		Sburb.forEachActionQueueInGroup(params[i], function(queue) {
			queue.paused = false;
		});
	}
}

//Cancels a group of actionQueues
//syntax: group name or list of group names
commands.cancelActionQueueGroup = commands.cancelActionQueueGroups = function(info){
	var params = parseParams(info);
	for(var i=0;i<params.length;i++) {
		Sburb.removeActionQueuesByGroup(params[i]);
	}
}

//Add the specified sprite to the specified room
//syntax: spriteName, roomName
commands.addSprite = function(info){
	var params = parseParams(info);
	var sprite = Sburb.sprites[params[0]];
	var room = Sburb.rooms[params[1]];
	
	room.addSprite(sprite);
}

//Remove the specified sprite from the specified room
//syntax: spriteName, roomName
commands.removeSprite = function(info){
	var params = parseParams(info);
	var sprite = Sburb.sprites[params[0]];
	var room = Sburb.rooms[params[1]];
	room.removeSprite(sprite);
}

//Clone the specified sprite with a new name
//syntax: spriteName, newName
commands.cloneSprite = function(info){
	var params = parseParams(info);
	var sprite = parseCharacterString(params[0]);
	var newName = params[1];
	sprite.clone(newName);
}

//Add the specified path as a walkable to the specified room
//syntax: pathName, roomName
commands.addWalkable = function(info){
	var params = parseParams(info);
	var path = Sburb.assets[params[0]];
	var room = Sburb.rooms[params[1]];
	room.addWalkable(path);
}

//Add the specified path as an unwalkable to the specified room
//syntax: pathName, roomName
commands.addUnwalkable = function(info){
	var params = parseParams(info);
	var path = Sburb.assets[params[0]];
	var room = Sburb.rooms[params[1]];
	room.addUnwalkable(path);
}

//Add the specified path as a motionpath to the specified room
//syntax: pathName, xtox, xtoy, ytox, ytoy, dx, dy, roomName
commands.addMotionPath = function(info){
	var params = parseParams(info);
	var path = Sburb.assets[params[0]];
	var room = Sburb.rooms[params[7]];
	room.addMotionPath(path,
		parseFloat(params[1]),parseFloat(params[2]),
		parseFloat(params[3]),parseFloat(params[4]),
		parseFloat(params[5]),parseFloat(params[6]));
}

//Remove the specified walkable from the specified room
//syntax: pathName, roomName
commands.removeWalkable = function(info){
	var params = parseParams(info);
	var path = Sburb.assets[params[0]];
	var room = Sburb.rooms[params[1]];
	room.removeWalkable(path);
}

//Remove the specified unwalkable from the specified room
//syntax: pathName, roomName
commands.removeUnwalkable = function(info){
	var params = parseParams(info);
	var path = Sburb.assets[params[0]];
	var room = Sburb.rooms[params[1]];
	room.removeUnwalkable(path);
}


//Toggle the volume
//syntax: none
commands.toggleVolume = function(){
	if(Sburb.globalVolume>=1){
		Sburb.globalVolume=0;
	}else if(Sburb.globalVolume>=0.6){
		Sburb.globalVolume = 1;
	}else if(Sburb.globalVolume>=0.3){
		Sburb.globalVolume = 0.66;
	}else {
		Sburb.globalVolume = 0.33;
	}
	if(Sburb.bgm){
		Sburb.bgm.fixVolume();
	}
}

//change the engine mode
//syntax: modeName
commands.changeMode = function(info){
	Sburb.engineMode = info.trim();
}

//load in an additional SBURBML file
//syntax: path, keepOld
commands.loadStateFile = function(info){
	var params = parseParams(info);
	var path = params[0];
	var keepOld = params[1]=="true";
	Sburb.loadSerialFromXML(path,keepOld);
}

//fade out to black
//syntax: none
commands.fadeOut = function(info){
	Sburb.fading = true;
}

//go to a room that may not have been loaded yet
//syntax: filepath, roomName, newCharacterX, newCharacterY
commands.changeRoomRemote = function(info){
    if(Sburb.loadingRoom) return; Sburb.loadingRoom = true; //Only load one room at a time
	var params = parseParams(info);
	var lastAction;
	var newAction = lastAction = new Sburb.Action("fadeOut");
	lastAction = lastAction.followUp = new Sburb.Action("loadStateFile",params[0]+","+true);
	lastAction = lastAction.followUp = new Sburb.Action("changeRoom",params[1]+","+params[2]+","+params[3]);
	lastAction.followUp = Sburb.curAction.followUp;
	Sburb.performAction(newAction);
}

//Teleport to a room which may not have been loaded yet
//syntax: filepath, roomName, newCharacterX, newCharacterY
commands.teleportRemote = function(info){
    if(Sburb.loadingRoom) return; Sburb.loadingRoom = true; //Only load one room at a time
	commands.changeRoomRemote(info);
	
	Sburb.playEffect(Sburb.effects["teleportEffect"],Sburb.char.x,Sburb.char.y);
	
	var params = parseParams(info);
	Sburb.curAction.followUp.followUp.followUp = new Sburb.Action("playEffect","teleportEffect,"+params[2]+","+params[3],null,null,Sburb.curAction.followUp.followUp.followUp);
}


//Change the state of the specified button
//syntax: buttonName, state
commands.setButtonState = function(info){
	var params = parseParams(info);
	Sburb.buttons[params[0]].setState(params[1]);
}

//Skip the current conversation
//syntax: none
commands.skipDialog = function(info){
	Sburb.dialoger.skipAll();
}

//Set a character to follow another sprite
//syntax: followerName, leaderName
commands.follow = function(info){
	var params = parseParams(info);
	var follower = parseCharacterString(params[0]);
	var leader = parseCharacterString(params[1]);
	follower.follow(leader);
}

//Set a character to stop following another sprite
//syntax: followerName
commands.unfollow = function(info){
	var params = parseParams(info);
	var follower = parseCharacterString(params[0]);
	follower.unfollow();
}

//Overlay a sprite over the game area (below the HUD)
//syntax: spriteName
commands.addOverlay = function(info){
	var params = parseParams(info);
	var sprite = Sburb.sprites[params[0]];
	sprite.x = Sburb.Stage.x;
	sprite.y = Sburb.Stage.y;
	Sburb.curRoom.addSprite(sprite);
}

//Remove an overlay
//syntax: spriteName
commands.removeOverlay = function(info){
	var params = parseParams(info);
	var sprite = Sburb.sprites[params[0]];
	Sburb.curRoom.removeSprite(sprite);
}

//Save state to client storage
//syntax: isAuto, useLocal
commands.save = function(info){
	var params = parseParams(info);
	var auto = params.length>0 && params[0]=="true";
	var local = params.length>1 && params[1]=="true";
	Sburb.saveStateToStorage(Sburb.char.name+", "+Sburb.curRoom.name,auto,local);
}

//Load state from client storage
//syntax: isAuto, useLocal
commands.load = function(info){
	var params = parseParams(info);
	var auto = params.length>0 && params[0]=="true";
	var local = params.length>1 && params[1]=="true";
	Sburb.loadStateFromStorage(auto, local);
//	Sburb.saveStateToStorage(Sburb.char.name+", "+Sburb.curRoom.name,auto,local);
}

//Display save/load options
//syntax: useLocal
commands.saveOrLoad = function(info){
	var params = parseParams(info);
	var local = params.length>0 && params[0]=="true";
	var actions = [];
	if(Sburb.isStateInStorage(false,local)){
		actions.push(new Sburb.Action("load","false, "+local,"Load "+Sburb.getStateDescription(false)));
	}
	if(Sburb.isStateInStorage(true,local)){
		actions.push(new Sburb.Action("load","true, "+local,"Load "+Sburb.getStateDescription(true)));
	}
	if(Sburb.tests.storage) {
	    actions.push(new Sburb.Action("save","false,"+local,"Save"));
    }
	actions.push(new Sburb.Action("cancel",null,"Cancel"));
	Sburb.chooser.choices = actions;
	Sburb.chooser.beginChoosing(Sburb.Stage.x+20,Sburb.Stage.y+50);
}

//Change global game state
//syntax: gameState, value
commands.setGameState = function(info) {
	var params = parseParams(info);
	// TODO: there should be a check to make sure the gameState key
	// doesn't contain &, <, or >
	Sburb.gameState[params[0]] = params[1];
}

//Move the character backwards
//syntax: charName
commands.goBack = function(info){
	var params = parseParams(info);
	var character = parseCharacterString(params[0]);
	character.x = character.oldX;
	character.y = character.oldY;
}
//tryToTrigger the given triggers in order, if one succeeds, don't do the rest (they are like an else-if chain)
//syntax: Sburbml trigger syntax
commands.try = function(info){
	var triggers = parseTriggerString(info);
	for(var i=0; i<triggers.length; i++){
		var trigger = triggers[i];
		trigger.detonate = true;
		if(trigger.tryToTrigger()){
			return;
		}
	}
}


//make the character walk in the specified direction (Up, Down, Left, Right, None)
//syntax: charName, direction
commands.walk = function(info){
	var params = parseParams(info);
	var character = parseCharacterString(params[0]);
	var dir = params[1];
	if(typeof character["move"+dir] == "function"){
		character["move"+dir]();
	}
}

//opens an external link in a new tab
//syntax url, displayText
commands.openLink = function(info){
     var params = parseParams(info);
	 var url = params[0];
	 var text;
	 if(params[1] && params[1] != ""){
	     text = params[1];
	 }else{
	     text = url;
	 }
	 
     var actions = [];
	 
	 actions.push(new Sburb.Action("openDirect", url + "," + text, "Go To "+text));
	 actions.push(new Sburb.Action("cancel",null,"Cancel"));
	 Sburb.chooser.choices = actions;
	 Sburb.chooser.beginChoosing(Sburb.Stage.x+200,Sburb.Stage.y+250);
}

commands.openDirect = function(info){
    var params = parseParams(info);
    var url = parseURLstring(params[0]);
    var text = params[1];
	
    window.open(url, text, "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes");
}


//blank utlity function
//syntax: none
commands.cancel = function(){
	//do nothing
}




var parseCharacterString = Sburb.parseCharacterString = function(string){
	if(string=="char"){
		return Sburb.char;
	}else{
		return Sburb.sprites[string];
	}
}


function parseActionString(string){
	var actions = [];
	string = "<sburb>"+string+"</sburb>";
    
	var input = Sburb.parseXML(string);
	for(var i=0; i<input.childNodes.length; i++) {
		var tmp = input.childNodes[i];
		if(tmp.tagName=="action") {
			actions.push(Sburb.parseAction(tmp));
		}
	}
	return actions;
}

function parseTriggerString(string){
	var triggers = [];
	string = "<triggers>"+string+"</triggers>";
	
	var input = Sburb.parseXML(string);
	for(var i=0; i<input.childNodes.length; i++) {
		var tmp = input.childNodes[i];
		if(tmp.tagName=="trigger") {
			triggers.push(Sburb.parseTrigger(tmp));
		}
	}
	return triggers;
}

function parseURLstring(string){
    if(string.indexOf("/") == 0){
	   return string.substr(1);
    } else if (string.indexOf("://") == -1){
	   return "http://" + string;
    }
    return string;
}


Sburb.commands = commands;
return Sburb;

})(Sburb || {});
