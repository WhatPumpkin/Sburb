// String trim polyfill
if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, ''); 
  }
}
// Array Remove - By John Resig (MIT Licensed)
if(typeof Array.prototype.remove !== 'function') {
    Array.prototype.remove = function(from, to) {
      var rest = this.slice((to || from) + 1 || this.length);
      this.length = from < 0 ? this.length + from : from;
      return this.push.apply(this, rest);
    };
}
// Array contains polyfill
if(typeof Array.prototype.contains !== 'function') {
    Array.prototype.contains = function(obj) {
        return this.indexOf(obj) > -1;
    };
}
// Not a polyfill but lets add it anyway
Array.prototype.destroy = function(obj) {
    var i = this.indexOf(obj);
    if(i >= 0)
        this.remove(i);
};
// window.atob and window.btoa polyfill
(function(){var a=typeof window!="undefined"?window:exports,b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",c=function(){try{document.createElement("$")}catch(a){return a}}();a.btoa||(a.btoa=function(a){for(var d,e,f=0,g=b,h="";a.charAt(f|0)||(g="=",f%1);h+=g.charAt(63&d>>8-f%1*8)){e=a.charCodeAt(f+=.75);if(e>255)throw c;d=d<<8|e}return h}),a.atob||(a.atob=function(a){a=a.replace(/=+$/,"");if(a.length%4==1)throw c;for(var d=0,e,f,g=0,h="";f=a.charAt(g++);~f&&(e=d%4?e*64+f:f,d++%4)?h+=String.fromCharCode(255&e>>(-2*d&6)):0)f=b.indexOf(f);return h})})();

var Sburb = (function(Sburb){
//650x450 screen
Sburb.Keys = {backspace:8,tab:9,enter:13,shift:16,ctrl:17,alt:18,escape:27,space:32,left:37,up:38,right:39,down:40,w:87,a:65,s:83,d:68,tilde:192};

Sburb.name = 'Jterniabound';
Sburb.version = '1.0';
Sburb.Container = null; //"deploy" div
Sburb.Game = null; //the game div
Sburb.Map = null; //the map div
Sburb.Stage = null; //the canvas, we're gonna load it up with a bunch of flash-like game data like fps and scale factors
Sburb.Bins = {}; //the various bin divs
Sburb.cam = {x:0,y:0}
Sburb.crashed = false; // In case of catastrophic failure
Sburb.stage = null; //its context
Sburb.gameState = {};
Sburb.pressed = null; //the pressed keys
Sburb.pressedOrder = null; //reverse stack of keypress order. Higher index = pushed later
Sburb.debugger = null;
Sburb.assetManager = null; //the asset loader
Sburb.assets = null; //all images, sounds, paths
Sburb.sprites = null; //all sprites that were Serial loaded
Sburb.effects = null; //all effects that were Serial loaded
Sburb.buttons = null; //all buttons that were Serial loaded
Sburb.rooms = null; //all rooms 
Sburb.char = null; //the player
Sburb.curRoom = null;
Sburb.destRoom = null; //current room, the room we are transitioning to, if it exists.
Sburb.destX = null;
Sburb.destY = null; //the desired location in the room we are transitioning to, if it exists.
Sburb.focus = null; //the focus of the camera (a sprite), usually just the char
Sburb.destFocus = null;
Sburb.chooser = null; //the option chooser
Sburb.inputDisabled = false; //disables player-control
Sburb.curAction = null; //the current action being performed
Sburb.actionQueues = [] //additional queues for parallel actions
Sburb.nextQueueId = 0; //the next created actionQueue, specified without a id, will get this number and increment it
Sburb.bgm = null; //the current background music
Sburb.hud = null; //the hud; help and sound buttons
Sburb.Mouse = {down:false,x:0,y:0}; //current recorded properties of the mouse
Sburb.waitFor = null;
Sburb.engineMode = "wander";
Sburb.fading = false;
Sburb.lastMusicTime = -1;
Sburb.musicStoppedFor = 0;
Sburb.loadingRoom = false; // Only load one room at a time
Sburb.tests = null;
Sburb.prefixed = null;
Sburb.firedAsync = false;

Sburb.updateLoop = null; //the main updateLoop, used to interrupt updating
Sburb.initFinished = null; //only used when _hardcode_load is true
Sburb._hardcode_load = null; //set to 1 when we don't want to load from XML: see initialize()
Sburb._include_dev = false;
var lastDrawTime = 0;

Sburb.testCompatibility = function(div, levelName, includeDevTools) {
    if(Modernizr.xhr2 && !Sburb.firedAsync) {
      try {  
        // Test blob response
        var xhr = new XMLHttpRequest();
        xhr.open("GET",levelName,true);
        xhr.responseType = "blob";
        xhr.onload = function() {
            if((this.status == 200 || this.status == 0) && this.response) {
                Modernizr.addTest('xhrblob', function () { return true; }); // TODO: Test if this.response is actually a blob?
            } else {
                Modernizr.addTest('xhrblob', function () { return false; });
            }
        }
        xhr.onabort = function() { Modernizr.addTest('xhrblob', function () { return false; }); };
        xhr.onerror = function() { Modernizr.addTest('xhrblob', function () { return false; }); };
        xhr.send();
        
        // Test Arraybuffer response
        xhr = new XMLHttpRequest();
        xhr.open("GET",levelName,true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function() {
            if((this.status == 200 || this.status == 0) && this.response) {
                var arr = this.response;
                Modernizr.addTest('xhrarraybuffer', function () { return true; }); // TODO: test if this.response is actually an arraybuffer?
            } else {
                Modernizr.addTest('xhrarraybuffer', function () { return false; });
            }
        }
        xhr.onabort = function() { Modernizr.addTest('xhrarraybuffer', function () { return false; }); };
        xhr.onerror = function() { Modernizr.addTest('xhrarraybuffer', function () { return false; }); };
        xhr.send();
      } catch (e) {
        alert(e.message + "\n\nIf you are running Google Chrome, you need to run it with the -allow-file-access-from-files switch to load this.")
      }
        
        Sburb.firedAsync = true;
    } else {
        Modernizr.addTest('xhrblob', function () { return false; });
        Modernizr.addTest('xhrarraybuffer', function () { return false; });
    }
    
    // Make sure Modernizr finished loading async tests
    if(!('xhrblob' in Modernizr && 'xhrarraybuffer' in Modernizr && 'datauri' in Modernizr)) {
        setTimeout(function() { Sburb.initialize(div, levelName, includeDevTools); }, 200);
        Sburb.crashed = true;
        return;
    }
    
    // Use Modernizr to test compatibility
    var errors = [];
    if(!Modernizr.fontface)                                     errors.push("- Lack of CSS @font-face support.");
    if(!Modernizr.canvas)                                       errors.push("- Lack of canvas support.");
    if(!Modernizr.canvastext)                                   errors.push("- Lack of canvas text support.");
    if(!Modernizr.json)                                         errors.push("- Lack of JSON support.");
    if(!Modernizr.xmlserializer)                                errors.push("- Lack of XMLSerializer support.");
    
    if(errors.length) {
        // Display what failed
        var deploy = '<div style="padding-left: 0; padding-right: 0; margin-left: auto; margin-right: auto; display: block; width:650px; height:450px; overflow: auto;">';
        deploy += '<p style="font-weight: bold;">Your browser is too old. Here are the problems we found:</p>';
        for(var i=0; i < errors.length; i++)
            deploy += '<p>'+errors[i]+'</p>';
        deploy += '<p>Maybe try Chrome instead?</p>';
        deploy += '</div>';
        document.getElementById(div).innerHTML = deploy;
        Sburb.crashed = true; // Stop initialization
    } else {
        Sburb.prefixed = Modernizr.prefixed;
        Sburb.tests = {};
        Sburb.tests['blobrevoke'] = Modernizr.blob && Modernizr.blob.revoke;
        if(Modernizr.audio && (Modernizr.audio.mp3 || Modernizr.audio.ogg)) {
            Sburb.tests['audio'] = new Boolean(true);
            Sburb.tests.audio.mp3 = Modernizr.audio.mp3;
            Sburb.tests.audio.ogg = Modernizr.audio.ogg;
        } else {
            Sburb.tests['audio'] = false;
        }
        if(Modernizr.localstorage || Modernizr.sessionstorage) {
            Sburb.tests['storage'] = new Boolean(true);
            Sburb.tests.storage.local = Modernizr.localstorage;
            Sburb.tests.storage.session = Modernizr.sessionstorage;
        } else {
            Sburb.tests['storage'] = false;
        }
        
        // Caution, weirdness ahead. Tests in order of preference, future tests should use increasing numbers. Do not change existing constants.
        // To deprecate a test, move it to the bottom of the list. To make it obsolete, comment it out.
        // Assets.js and Debugger.js are the only files to reference these constants
        Sburb.tests['loading'] = 0; // Just pass raw URL to elements
        if(Modernizr.xhrblob && Modernizr.blob && Modernizr.blob.url && Modernizr.blob.creator) {
            Sburb.tests.loading = 11; // Load as blob, pass to blob constructor and generate Blob URI
        } else if(Modernizr.xhrblob && Modernizr.blob && Modernizr.blob.url && Modernizr.blob.builder) {
            Sburb.tests.loading = 10; // Load as blob, pass to blob builder and generate Blob URI
        } else if(Modernizr.xhrblob && Modernizr.blob && Modernizr.blob.url && Modernizr.blob.slice) {
            Sburb.tests.loading = 9; // Load as blob, pass to blob.slice and generate Blob URI
        } else if(Modernizr.xhrblob && Modernizr.datauri && Modernizr.filereader) {
            Sburb.tests.loading = 8; // Load as blob, pass to file reader and generate Data URI
        } else if(Modernizr.xhrarraybuffer && Modernizr.arraybuffer && Modernizr.arraybuffer.dataview && Modernizr.blob && Modernizr.blob.url && Modernizr.blob.creator) {
            Sburb.tests.loading = 7; // Load as arraybuffer, convert to data view, pass to blob constructor and generate Blob URI
        } else if(Modernizr.xhrarraybuffer && Modernizr.arraybuffer && Modernizr.blob && Modernizr.blob.url && Modernizr.blob.creator) {
            Sburb.tests.loading = 6; // Load as arraybuffer, use hacks to pass to blob constructor and generate Blob URI
        } else if(Modernizr.xhrarraybuffer && Modernizr.arraybuffer && Modernizr.blob && Modernizr.blob.url && Modernizr.blob.builder) {
            Sburb.tests.loading = 5; // Load as arraybuffer, pass to blob builder and generate Blob URI
        } else if(Modernizr.xhrarraybuffer && Modernizr.arraybuffer && Modernizr.arraybuffer.dataview && Modernizr.datauri) {
            Sburb.tests.loading = 4; // Load as arraybuffer, convert to base 64 and generate Data URI
        } else if(Modernizr.overridemimetype && Modernizr.blob && Modernizr.blob.url && Modernizr.blob.creator && Modernizr.arraybuffer && Modernizr.arraybuffer.dataview) {
            Sburb.tests.loading = 3; // Load as string, convert to arraybuffer, pass to blob constructor and generate Blob URI
        } else if(Modernizr.overridemimetype && Modernizr.blob && Modernizr.blob.url && Modernizr.blob.builder && Modernizr.arraybuffer && Modernizr.arraybuffer.dataview) {
            Sburb.tests.loading = 2; // Load as string, convert to arraybuffer, pass to blob builder and generate Blob URI
        } else if(Modernizr.overridemimetype && Modernizr.datauri) {
            Sburb.tests.loading = 1; // Load as string, clean it up, convert to base 64 and generate Data URI
        } else if(Modernizr.vbarray && Modernizr.datauri) {
            Sburb.tests.loading = 12; // Load as god knows what, use IE hacks, convert to base 64 and generate Data URI
        }
    }
}

Sburb.initialize = function(div,levelName,includeDevTools){
    Sburb.crashed = false;
    Sburb.testCompatibility(div, levelName, includeDevTools);
    if(Sburb.crashed)
        return; // Hard crash if the browser is too old. testCompatibility() will handle the error message
	Sburb.debugger = new Sburb.Debugger(); // Load debugger first! -- But not quite
    
    var deploy = document.createElement('div');
    deploy.style.position = "relative";
    deploy.style.padding = "0";
    deploy.style.margin = "auto";
    
	var gameDiv = document.createElement('div');
    gameDiv.id = "SBURBgameDiv";
	gameDiv.onkeydown = _onkeydown;
	gameDiv.onkeyup = _onkeyup;
    gameDiv.style.position = "absolute";
    gameDiv.style.zIndex = "100";
    deploy.appendChild(gameDiv);
	
	var movieDiv = document.createElement('div');
    movieDiv.id = "SBURBmovieBin";
    movieDiv.style.position = "absolute";
    movieDiv.style.zIndex = "200";
    deploy.appendChild(movieDiv);
    
	var fontDiv = document.createElement('div');
    fontDiv.id = "SBURBfontBin";
    deploy.appendChild(fontDiv);
    
	var gifDiv = document.createElement('div');
    gifDiv.id = "SBURBgifBin";
    gifDiv.style.width = "0";
    gifDiv.style.height = "0";
    gifDiv.style.overflow = "hidden";
    deploy.appendChild(gifDiv);
    
	var gameCanvas = document.createElement("canvas");
    gameCanvas.id = "SBURBStage";
    gameCanvas.onmousedown = function(e) { Sburb.onMouseDown(e,this); };
    gameCanvas.onmouseup = function(e) { Sburb.onMouseUp(e,this); };
    gameCanvas.onmousemove = function(e) { Sburb.onMouseMove(e,this); };
    gameCanvas.tabIndex = 0;
	gameCanvas.scaleX = gameCanvas.scaleY = 3;
	gameCanvas.x = gameCanvas.y = 0;
	gameCanvas.fps = 30;
	gameCanvas.fade = 0;
	gameCanvas.fadeRate = 0.1;
    gameCanvas.innerText = "ERROR: Your browser is too old to display this content!";
    gameDiv.appendChild(gameCanvas);
    
	var mapCanvas = document.createElement("canvas");
    mapCanvas.id = "SBURBMapCanvas";
    mapCanvas.width = 1;
    mapCanvas.height = 1;
    mapCanvas.style.display = "none";
    gameDiv.appendChild(mapCanvas);
	
	document.getElementById(div).appendChild(deploy);
    
    // Copy local variables into Sburb
    Sburb.Container = deploy;
    Sburb.Game = gameDiv;
    Sburb.Map = mapCanvas;
    Sburb.Stage = gameCanvas;
    Sburb.Bins["movie"] = movieDiv;
    Sburb.Bins["font"] = fontDiv;
    Sburb.Bins["gif"] = gifDiv;
    
    // Set default dimensions
    Sburb.setDimensions(650,450);
    
	Sburb.stage = Sburb.Stage.getContext("2d");
	Sburb.Stage.onblur = _onblur;
	Sburb.chooser = new Sburb.Chooser();
	Sburb.dialoger = null;
    Sburb.assetManager = new Sburb.AssetManager();
	Sburb.assets = Sburb.assetManager.assets; // shortcut for raw asset access
	Sburb.rooms = {};
	Sburb.sprites = {};
	Sburb.effects = {};
	Sburb.buttons = {};
	Sburb.hud = {};
	Sburb.gameState = {};
	Sburb.pressed = {};
	Sburb.pressedOrder = [];
    
    Sburb.loadSerialFromXML(levelName); // comment out this line and
    //loadAssets();                        // uncomment these two lines, to do a standard hardcode load
    //_hardcode_load = 1;
}

Sburb.setDimensions = function(width, height) {
    if(width) {
        Sburb.Container.style.width = width+"px";
        Sburb.Stage.width = width;
    }
    if(height) {
        Sburb.Container.style.height = height+"px";
        Sburb.Stage.height = height;
    }
}

function startUpdateProcess(){
	haltUpdateProcess();
	Sburb.assetManager.stop();
	Sburb.updateLoop=setInterval(update,1000/Sburb.Stage.fps);
	Sburb.drawLoop=setInterval(draw,1000/Sburb.Stage.fps);
}

function haltUpdateProcess(){
	if(Sburb.updateLoop){
		clearInterval(Sburb.updateLoop);
		clearInterval(Sburb.drawLoop);
		Sburb.updateLoop = Sburb.drawLoop = null;
	}
	Sburb.assetManager.start();
}

function update(){
	//update stuff
	handleAudio();
	handleInputs();
	handleHud();
	
	if(!Sburb.loadingRoom)
	    Sburb.curRoom.update();
	
	focusCamera();
	handleRoomChange();
	Sburb.chooser.update();
	Sburb.dialoger.update();
	chainAction();
	updateWait();
}

function draw(){
	//stage.clearRect(0,0,Stage.width,Stage.height);
	if(!Sburb.playingMovie){
		Sburb.stage.save();
		Sburb.Stage.offset = true;
		Sburb.stage.translate(-Sburb.Stage.x,-Sburb.Stage.y);
	
		Sburb.curRoom.draw();
	
		Sburb.stage.restore();
		Sburb.Stage.offset = false;
	
		if(Sburb.Stage.fade>0.1){
			Sburb.stage.fillStyle = "rgba(0,0,0,"+Sburb.Stage.fade+")";
			Sburb.stage.fillRect(0,0,Sburb.Stage.width,Sburb.Stage.height);
		}
	
		Sburb.dialoger.draw();
		drawHud();
	
		Sburb.stage.save();
		Sburb.Stage.offset = true;
		Sburb.stage.translate(-Sburb.Stage.x,-Sburb.Stage.y);
	
		Sburb.chooser.draw();
	
		Sburb.stage.restore();
		Sburb.Stage.offset = false;
		
	    Sburb.debugger.draw();
	}
}

var _onkeydown = function(e){
    if(Sburb.updateLoop && !Sburb.inputDisabled) { // Make sure we are loaded before trying to do things
	    if(Sburb.chooser.choosing){
		    if(e.keyCode == Sburb.Keys.down || e.keyCode==Sburb.Keys.s){
			    Sburb.chooser.nextChoice();
		    }
		    if(e.keyCode == Sburb.Keys.up || e.keyCode==Sburb.Keys.w){
			    Sburb.chooser.prevChoice();
		    }
		    if(e.keyCode == Sburb.Keys.space && !Sburb.pressed[Sburb.Keys.space]){
			    Sburb.performAction(Sburb.chooser.choices[Sburb.chooser.choice]);
			    Sburb.chooser.choosing = false;
		    }
	    }else if(Sburb.dialoger.talking){
		    if(e.keyCode == Sburb.Keys.space && !Sburb.pressed[Sburb.Keys.space]){
			    Sburb.dialoger.nudge();
		    }
	    }else if(hasControl()){
		    if(e.keyCode == Sburb.Keys.space && !Sburb.pressed[Sburb.Keys.space] && Sburb.engineMode=="wander"){
			    Sburb.chooser.choices = [];
			    var queries = Sburb.char.getActionQueries();
			    for(var i=0;i<queries.length;i++){
				    Sburb.chooser.choices = Sburb.curRoom.queryActions(Sburb.char,queries[i].x,queries[i].y);
				    if(Sburb.chooser.choices.length>0){
					    break;
				    }
			    }
			    if(Sburb.chooser.choices.length>0){
				    Sburb.chooser.choices.push(new Sburb.Action("cancel","cancel","Cancel."));
				    beginChoosing();
			    }
		    }
	    }
	}
    /* There is a theoretical race condition here
       in which pressing a key within the milliseconds
       between injecting the canvas into the dom
       and initializing Sburb.pressed and Sburb.pressedOrder
       could throw an exception.
       
       I'm not too worried about it. -Fugi */
	if(!Sburb.pressed[e.keyCode])
	    Sburb.pressedOrder.push(e.keyCode);
	Sburb.pressed[e.keyCode] = true;
    // return true if we want to pass keys along to the browser, i.e. Ctrl-N for a new window
    if(e.altKey || e.ctrlKey || e.metaKey) {
		// don't muck with system stuff
		return true;
    }
    return false;
}

var _onkeyup = function(e){
    // See _onkeydown for race condition warning
    if(Sburb.pressed[e.keyCode])
    	Sburb.pressedOrder.destroy(e.keyCode);
	Sburb.pressed[e.keyCode] = false;
}

function purgeKeys(){
    // See _onkeydown for race condition warning
	Sburb.pressed = {};
	Sburb.pressedOrder = [];
}

var _onblur = function(e){
    // See _onkeydown for race condition warning
	purgeKeys();
}

Sburb.onMouseMove = function(e,canvas){
    // See _onkeydown for race condition warning
	var point = relMouseCoords(e,canvas);
	Sburb.Mouse.x = point.x;
	Sburb.Mouse.y = point.y;
}

Sburb.onMouseDown = function(e,canvas){
    if(!Sburb.updateLoop) return; // Make sure we are loaded before trying to do things
	if(Sburb.engineMode=="strife" && hasControl()){
		Sburb.chooser.choices = Sburb.curRoom.queryActionsVisual(Sburb.char,Sburb.Stage.x+Sburb.Mouse.x,Sburb.Stage.y+Sburb.Mouse.y);
		if(Sburb.chooser.choices.length>0){
			Sburb.chooser.choices.push(new Sburb.Action("cancel","cancel","cancel"));
			beginChoosing();
		}
	}
	Sburb.Mouse.down = true;
	
}

Sburb.onMouseUp = function(e,canvas){
	Sburb.Mouse.down = false;
    if(!Sburb.updateLoop) return; // Make sure we are loaded before trying to do things
	if(Sburb.dialoger && Sburb.dialoger.box && Sburb.dialoger.box.isVisuallyUnder(Sburb.Mouse.x,Sburb.Mouse.y)){
		Sburb.dialoger.nudge();
	}
}

function relMouseCoords(event,canvas){
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = canvas;

    do{
        totalOffsetX += currentElement.offsetLeft;
        totalOffsetY += currentElement.offsetTop;
    }
    while(currentElement = currentElement.offsetParent)
    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;
    return {x:canvasX,y:canvasY};
}

function handleAudio(){
	if(Sburb.bgm && Sburb.bgm.asset){
		if(Sburb.bgm.asset.ended || Sburb.bgm.asset.currentTime>=Sburb.bgm.asset.duration ){
			Sburb.bgm.loop();
		}
		if (Sburb.lastMusicTime == Sburb.bgm.asset.currentTime){
			Sburb.musicStoppedFor++;
			if(Sburb.musicStoppedFor>4){
		    Sburb.bgm.asset.pause(); 
		    Sburb.bgm.asset.play(); // asset.play() because sometimes this condition is true on startup
		  }
    }else{
    	Sburb.musicStoppedFor = 0;
    }
		if(Sburb.bgm.asset.paused){
		//	console.log("The sound is paused??? THIS SHOULD NOT BE.");
			Sburb.bgm.play();
		}
		Sburb.lastMusicTime = Sburb.bgm.asset.currentTime;
	}else{
		//console.log("The music doesn't exist!");
	}
}

function handleInputs(){
	if(Sburb.Stage){
		Sburb.Stage.style.cursor = "default";
	}
	if(hasControl() && !Sburb.inputDisabled){
		Sburb.char.handleInputs(Sburb.pressed, Sburb.pressedOrder);
	}else{
		Sburb.char.moveNone();
	}
	Sburb.debugger.handleInputs(Sburb.pressed);
}

function handleHud(){
	for(var content in Sburb.hud){
	    if(!Sburb.hud.hasOwnProperty(content)) continue;
	    var obj = Sburb.hud[content];
	    obj.update();
	}
}

function drawHud(){
	for(var content in Sburb.hud){
	    if(!Sburb.hud.hasOwnProperty(content)) continue;
	    Sburb.hud[content].draw();
	}
}

function hasControl(){
	return !Sburb.dialoger.talking 
		&& !Sburb.chooser.choosing 
		&& !Sburb.destRoom  
		&& !Sburb.fading 
		&& !Sburb.destFocus;
}

function focusCamera(){
	//need to divide these by scaleX and scaleY if repurposed
	if(!Sburb.destFocus){
		if(Sburb.focus){
			Sburb.cam.x = Sburb.focus.x-Sburb.Stage.width/2;
			Sburb.cam.y = Sburb.focus.y-Sburb.Stage.height/2;
		}
	}else if(Math.abs(Sburb.destFocus.x-Sburb.cam.x-Sburb.Stage.width/2)>4 || Math.abs(Sburb.destFocus.y-Sburb.cam.y-Sburb.Stage.height/2)>4){
		Sburb.cam.x += (Sburb.destFocus.x-Sburb.Stage.width/2-Sburb.cam.x)/5;
		Sburb.cam.y += (Sburb.destFocus.y-Sburb.Stage.height/2-Sburb.cam.y)/5;
	}else{
		Sburb.focus = Sburb.destFocus;
		Sburb.destFocus = null;
	}
	Sburb.Stage.x = Math.max(0,Math.min(Math.round(Sburb.cam.x/Sburb.Stage.scaleX)*Sburb.Stage.scaleX,Sburb.curRoom.width-Sburb.Stage.width));
	Sburb.Stage.y = Math.max(0,Math.min(Math.round(Sburb.cam.y/Sburb.Stage.scaleX)*Sburb.Stage.scaleX,Sburb.curRoom.height-Sburb.Stage.height));
}

function handleRoomChange(){
	if(Sburb.destRoom || Sburb.fading){
		if(Sburb.Stage.fade<1.1){
			Sburb.Stage.fade=Math.min(1.1,Sburb.Stage.fade+Sburb.Stage.fadeRate);
		}else if(Sburb.destRoom){
			var deltaX = Sburb.destX-Sburb.char.x; 
			var deltaY = Sburb.destY-Sburb.char.y; 
			var curSprite = Sburb.char;
			while(curSprite){
				curSprite.x+=deltaX;
				curSprite.y+=deltaY;
				curSprite.followBuffer = [];
				curSprite = curSprite.follower;
			}
			Sburb.moveSprite(Sburb.char,Sburb.curRoom,Sburb.destRoom);
			Sburb.curRoom.exit();
			Sburb.curRoom = Sburb.destRoom;
			Sburb.curRoom.enter();
			Sburb.destRoom = null;
		}else{
			Sburb.fading = false;
		}
	}else if(hasControl() && Sburb.Stage.fade>0.01){
		Sburb.Stage.fade=Math.max(0.01,Sburb.Stage.fade-Sburb.Stage.fadeRate);
		//apparently alpha 0 is buggy?
	}
}

function beginChoosing(){
	Sburb.char.idle();
	Sburb.chooser.beginChoosing(Sburb.char.x,Sburb.char.y);
}

function chainAction(){
	if(Sburb.curAction) {
		chainActionInQueue(Sburb);
	}
	for(var i=0;i<Sburb.actionQueues.length;i++) {
		var queue=Sburb.actionQueues[i];
		if(!queue.curAction) {
			Sburb.actionQueues.remove(i);
			i--;
			continue;
		}
		if(queue.paused || queue.waitFor) {
			if((queue.trigger && queue.trigger.checkCompletion()) 
                || queue.waitFor) {
				queue.paused = false;
				queue.trigger = null;
			} else {
				continue;
			}
		}
        chainActionInQueue(queue);
	}
}    

function chainActionInQueue(queue) {
	if(queue.curAction.times<=0){
		if(queue.curAction.followUp){
			if(hasControl() || queue.curAction.followUp.noWait || queue.noWait){
				Sburb.performAction(queue.curAction.followUp,queue);
			}
		}else{
			queue.curAction = null;
		}
	}else if(hasControl() || queue.curAction.noWait || queue.noWait){
		Sburb.performAction(queue.curAction,queue);
	}
}

function updateWait(){
	if(Sburb.waitFor){
		if(Sburb.waitFor.checkCompletion()){
			Sburb.waitFor = null;
		}
	}
    if(Sburb.inputDisabled && Sburb.inputDisabled.checkCompletion){
        if(Sburb.inputDisabled.checkCompletion()){
            Sburb.inputDisabled = false;
        }
    }
}

Sburb.performAction = function(action, queue){
	if(action.silent){
		if((action.times==1)&&(!action.followUp)) {
			Sburb.performActionSilent(action);
			return null;
		}
		if((!queue)||(queue==Sburb)) {
			if(action.silent===true) {
				queue=new Sburb.ActionQueue(action);
			} else {
				var options=action.silent.split(":");
				var noWait=(options[0]=="full")?true:false;
				var id=null;
				if(noWait) {
					options.shift();
				}
				if(options.length>0) {
					id=options.shift();
				}
				queue=new Sburb.ActionQueue(action,id,options,noWait);
			}
			Sburb.actionQueues.push(queue);
		}
	}
	if(queue&&(queue!=Sburb)) {
		performActionInQueue(action, queue);
		return queue;
	}
	if(((Sburb.curAction && Sburb.curAction.followUp!=action && Sburb.curAction!=action) || !hasControl()) && action.soft){
		return null;
	}
	performActionInQueue(action, Sburb);
	return null;
}

function performActionInQueue(action, queue) {
	var looped = false;
	queue.curAction = action.clone();
	do{
		if(looped){
			queue.curAction = queue.curAction.followUp.clone();
		}
       	var result = Sburb.performActionSilent(queue.curAction);
        handleCommandResult(queue,result);
       	looped = true;
	}while(queue.curAction && queue.curAction.times<=0 && queue.curAction.followUp && queue.curAction.followUp.noDelay);
}

Sburb.performActionSilent = function(action){
	action.times--;
	var info = action.info();
	if(info){
		info = info.trim();
	}
	return Sburb.commands[action.command.trim()](info);
}

function handleCommandResult(queue,result){
    if(result){
        if(queue.hasOwnProperty("trigger")){
            queue.paused = true;
            queue.trigger = result;
        }else{
            queue.waitFor = result;
        }
    }
}



Sburb.changeRoom = function(newRoom,newX,newY){
	Sburb.destRoom = newRoom;
	Sburb.destX = newX;
	Sburb.destY = newY;
}



Sburb.moveSprite = function(sprite,oldRoom,newRoom){
	var curSprite = sprite;
	while(curSprite){
		oldRoom.removeSprite(curSprite);
		newRoom.addSprite(curSprite);
		curSprite = curSprite.follower;
	}
}



Sburb.setCurRoomOf = function(sprite){
	if(!Sburb.curRoom.contains(sprite)){
		for(var room in Sburb.rooms){
		    if(!Sburb.rooms.hasOwnProperty(room)) continue;
		    if(Sburb.rooms[room].contains(sprite)){
			    Sburb.changeRoom(Sburb.rooms[room],Sburb.char.x,Sburb.char.y);
			    return;
		    }
		}
	}
}

Sburb.changeBGM = function(newSong) {
    if(newSong){
		if(Sburb.bgm) {
			if (Sburb.bgm.asset == newSong.asset && Sburb.bgm.startLoop == newSong.startLoop) {
				// maybe check for some kind of restart value
				return;
			}
			Sburb.bgm.stop();
		}
		Sburb.bgm = newSong;
		Sburb.bgm.stop();
		Sburb.bgm.play();
    }
}

Sburb.playEffect = function(effect,x,y){
	Sburb.curRoom.addEffect(effect.clone(x,y));
}

Sburb.playSound = function(sound){
	sound.stop();
	sound.play();
}

Sburb.playMovie = function(movie){
	var name = movie.name;
	document.getElementById(name).style.display = "block";
	Sburb.waitFor = new Sburb.Trigger("movie,"+name+",5");
	Sburb.playingMovie = true;
}

Sburb.startUpdateProcess = startUpdateProcess;
Sburb.haltUpdateProcess = haltUpdateProcess;
Sburb.draw = draw;
return Sburb;
})(Sburb || {});

    
