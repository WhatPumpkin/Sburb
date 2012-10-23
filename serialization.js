var Sburb = (function(Sburb){

Sburb.loadedFiles = {};

var templateClasses = {};
var loadingDepth = 0;
var loadQueue = [];
var updateLoop = null;
var jsonUpdateLoop = null;

//Save the current state to xml
Sburb.serialize = function(sburbInst) { 
	var assets = sburbInst.assets;
	var effects = sburbInst.effects;
	var rooms = sburbInst.rooms;
	var sprites = sburbInst.sprites;
	var hud = sburbInst.hud;
	var dialoger = sburbInst.dialoger;
	var curRoom = sburbInst.curRoom;
	var gameState = sburbInst.gameState;
	var actionQueues = sburbInst.actionQueues;
	var char = sburbInst.char;

	var loadedFiles = "";
	var loadedFilesExist = false;

	for(var key in Sburb.loadedFiles) // Not sburbInst.loadedFiles ?
	{
	    if(!Sburb.loadedFiles.hasOwnProperty(key)) continue;
	    loadedFiles = loadedFiles + (loadedFilesExist?",":"") + key;
	    loadedFilesExist = true;
	}


	var out = document.getElementById("serialText");
	var output = "<sburb"+
		" char='"+char.name+
		(Sburb.bgm?"' bgm='"+Sburb.bgm.asset.name+(Sburb.bgm.startLoop?","+Sburb.bgm.startLoop:""):"")+
		(Sburb.Stage.scaleX!=1?"' scale='"+Sburb.Stage.scaleX:"")+
		(Sburb.nextQueueId>0?"' nextQueueId='"+Sburb.nextQueueId:"")+
		(Sburb.assetManager.resourcePath?("' resourcePath='"+Sburb.assetManager.resourcePath):"")+
		(Sburb.assetManager.levelPath?("' levelPath='"+Sburb.assetManager.levelPath):"")+
		(loadedFilesExist?("' loadedFiles='"+loadedFiles):"")+
		"'>\n";
	output = serializeAssets(output,assets,effects);
	output = serializeTemplates(output,templateClasses);
	output = serializeHud(output,hud,dialoger);
	output = serializeLooseObjects(output,rooms,sprites);
	output = serializeRooms(output,rooms);
	output = serializeGameState(output,gameState);
	output = serializeActionQueues(output,actionQueues);

	output = output.concat("\n</sburb>");
	if(out){
		out.value = output;
	}
	return output;
}

///
// Saves state to session or local storage if supported by browser
// Paramters:
//   description (String) A descriptive name for the save, i.e. 'Kankri, Second Room'
//   auto (Boolean) If true this save is an auto save, false it is not
//   local (Boolean) If true, use localStorage, if false, use sessionStorage
// Returns:
//   (Boolean) False if storage is not supported by browser, true otherwise 
///
Sburb.saveStateToStorage = function(description, auto, local)
{
	description = typeof description !== 'undefined' ? description : "SaveFile";
	auto = typeof auto !== 'undefined' ? auto : false;
	local = typeof local !== 'undefined' ? local : false;

    var storage;
    if(!Sburb.tests.storage) {
        return false;
    }
    if(Sburb.tests.storage.local && Sburb.tests.storage.session) {
        storage = local ? localStorage : sessionStorage;
    } else if(Sburb.tests.storage.local) {
        storage = localStorage;
    } else if(Sburb.tests.storage.session) {
        storage = sessionStorage;
    } else {
        return false;
    }

	var serialized = Sburb.serialize(Sburb);
	compressed = Iuppiter.Base64.encode(Iuppiter.compress(serialized),true);
	var saveStateName = description + (auto? " (auto)":"") + '_savedState_' + Sburb.name + ":" + Sburb.version;


	Sburb.deleteStateFromStorage(auto);
	storage.setItem(saveStateName, compressed);

	return true;
}

///
// Loads state from session or local storage if supported by browser
// Paramters:
//   auto (Boolean) If true loads the auto save, else it loads the manual save
//   local (Boolean) If true, use localStorage, if false, use sessionStorage
// Returns:
//   (Boolean) False if storage is not supported by browser or save does not exist, true otherwise 
///
Sburb.loadStateFromStorage = function(auto, local)
{
	description = typeof description !== 'undefined' ? description : "SaveFile";
	auto = typeof auto !== 'undefined' ? auto : false;
	local = typeof local !== 'undefined' ? local : false;

    var storage;
    if(!Sburb.tests.storage) {
        return false;
    }
    if(Sburb.tests.storage.local && Sburb.tests.storage.session) {
        storage = local ? localStorage : sessionStorage;
    } else if(Sburb.tests.storage.local) {
        storage = localStorage;
    } else if(Sburb.tests.storage.session) {
        storage = sessionStorage;
    } else {
        return false;
    }

	var saveStateName = "";

	for(var key in storage)
	{
	    if(!storage.hasOwnProperty(key)) continue;
		var savedIndex = key.indexOf('_savedState_');
		if(savedIndex >= 0) // this key is a saved state
		{
			if(auto && key.indexOf("(auto)") >= 0 && key.indexOf(Sburb.name + ":" + Sburb.version) >= savedIndex)
			{
				saveStateName = key;
				break;
			}
			else if(!auto && key.indexOf("(auto)") < 0 &&  key.indexOf(Sburb.name + ":" + Sburb.version) >= savedIndex)
			{
				saveStateName = key;
				break;
			}
		}

	}

	var compressed = storage.getItem(saveStateName);

	if(!compressed)
		return false;
	var decoded = Iuppiter.decompress(Iuppiter.Base64.decode(Iuppiter.toByteArray(compressed),true)).replace(/\0/g,"");
	Sburb.loadSerial(decoded);
	
	return true;
}
///
// Gets the descriptive name of the currently saved state
// Paramters:
//   auto (Boolean) If true returns the description for the auto save, if false the manual save
// Returns:
//   (String) Description of save, returns "" if no description is found or storage is not supported
///
Sburb.getStateDescription = function(auto, local)
{	
	auto = typeof auto !== 'undefined' ? auto : false;
	local = typeof local !== 'undefined' ? local : false;

    var storage;
    if(!Sburb.tests.storage) {
        return null;
    }
    if(Sburb.tests.storage.local && Sburb.tests.storage.session) {
        storage = local ? localStorage : sessionStorage;
    } else if(Sburb.tests.storage.local) {
        storage = localStorage;
    } else if(Sburb.tests.storage.session) {
        storage = sessionStorage;
    } else {
        return null;
    }

	for(var key in storage)
	{
	    if(!storage.hasOwnProperty(key)) continue;
		var savedIndex = key.indexOf('_savedState_');
		if(savedIndex >= 0) // this key is a saved state
		{
			if(auto && key.indexOf("(auto)") >= 0 && key.indexOf(Sburb.name + ":" + Sburb.version) >= savedIndex)
				return key.substring(0, savedIndex);
			else if(!auto && key.indexOf("(auto)") < 0 &&  key.indexOf(Sburb.name + ":" + Sburb.version) >= savedIndex)
				return key.substring(0, savedIndex);
		}

	}

	return null;
}

///
// Deletes state from session or local storage if supported by browser
// Paramters:
//   auto (Boolean) If true, deletes the current auto save, if false deletes the current manual save
//   local (Boolean) If true, use localStorage, if false, use sessionStorage
///
Sburb.deleteStateFromStorage = function(auto, local)
{
	auto = typeof auto !== 'undefined' ? auto : false;
	local = typeof local !== 'undefined' ? local : false;

    var storage;
    if(!Sburb.tests.storage) {
        return;
    }
    if(Sburb.tests.storage.local && Sburb.tests.storage.session) {
        storage = local ? localStorage : sessionStorage;
    } else if(Sburb.tests.storage.local) {
        storage = localStorage;
    } else if(Sburb.tests.storage.session) {
        storage = sessionStorage;
    } else {
        return;
    }

	Sburb.deleteOldVersionStates(local);
	for(var key in storage)
	{
	    if(!storage.hasOwnProperty(key)) continue;
		var savedIndex = key.indexOf('_savedState_');
		if(savedIndex >= 0) // this key is a saved state
		{
			if(auto && key.indexOf("(auto)") >= 0 && key.indexOf(Sburb.name + ":" + Sburb.version) >= savedIndex)
				storage.removeItem(key);
			else if(!auto && key.indexOf("(auto)") < 0 &&  key.indexOf(Sburb.name + ":" + Sburb.version) >= savedIndex)
				storage.removeItem(key);
		}

	}

}
///
// Deletes any old states from previous versions of the game
// Paramters:
//   local (Boolean) If true, use localStorage, if false, use sessionStorage
///
Sburb.deleteOldVersionStates = function(local)
{
	local = typeof local !== 'undefined' ? local : false;

    var storage;
    if(!Sburb.tests.storage) {
        return;
    }
    if(Sburb.tests.storage.local && Sburb.tests.storage.session) {
        storage = local ? localStorage : sessionStorage;
    } else if(Sburb.tests.storage.local) {
        storage = localStorage;
    } else if(Sburb.tests.storage.session) {
        storage = sessionStorage;
    } else {
        return;
    }

	for(var key in storage)
	{
	    if(!storage.hasOwnProperty(key)) continue;
		var savedIndex = key.indexOf('_savedState_');
		if(savedIndex >= 0) // this key is a saved state
		{
			// This is a key for our game, but not of the right version
			if(key.indexOf(Sburb.name + ":") >= savedIndex && key.indexOf(":" + Sburb.version) < 0)
				storage.removeItem(key);
		}

	}
}

///
// Checks if state is in session of local storage
// Paramters:
//   local (Boolean) If true, use localStorage, if false, use sessionStorage
// Returns:
//   (Boolean) True is state is in storage, false if it is not (or storage is not supported)
///
Sburb.isStateInStorage = function(auto, local)
{
	auto = typeof auto !== 'undefined' ? auto : false;
	local = typeof local !== 'undefined' ? local : false;

    var storage;
    if(!Sburb.tests.storage) {
        return false;
    }
    if(Sburb.tests.storage.local && Sburb.tests.storage.session) {
        storage = local ? localStorage : sessionStorage;
    } else if(Sburb.tests.storage.local) {
        storage = localStorage;
    } else if(Sburb.tests.storage.session) {
        storage = sessionStorage;
    } else {
        return false;
    }

	for(var key in storage)
	{
	    if(!storage.hasOwnProperty(key)) continue;
		var savedIndex = key.indexOf('_savedState_');
		if(savedIndex >= 0) // this key is a saved state
		{
			if(auto && key.indexOf("(auto)") >= 0 && key.indexOf(Sburb.name + ":" + Sburb.version) >= savedIndex)
				return true;
			else if(!auto && key.indexOf("(auto)") < 0 &&  key.indexOf(Sburb.name + ":" + Sburb.version) >= savedIndex)
				return true;
		}

	}

	return false;
}

function encodeXML(s) {
	return s.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;');
};

//Serialize things that aren't actually in any room
function serializeLooseObjects(output,rooms,sprites){

	for(var sprite in sprites){
	    if(!sprites.hasOwnProperty(sprite)) continue;
		var theSprite = sprites[sprite];
		var contained = false;
		for(var room in rooms){
	        if(!rooms.hasOwnProperty(room)) continue;
			if(rooms[room].contains(theSprite)){
				contained = true;
				break;
			}
		}
		if(!contained){
			output = theSprite.serialize(output);
		}
	}
	for(var button in Sburb.buttons){
	    if(!Sburb.buttons.hasOwnProperty(button)) continue;
		var theButton = Sburb.buttons[button];
		if(!Sburb.hud[theButton.name]){
			output = theButton.serialize(output);
		}
	}

	return output;
}

//Serializes Rooms
function serializeRooms(output, rooms)
{
	output = output.concat("\n<rooms>\n");
	for(var room in rooms){
	    if(!rooms.hasOwnProperty(room)) continue;
		output = rooms[room].serialize(output);
	}
	output = output.concat("\n</rooms>\n");

	return output;
}
function serializeGameState(output, gameState) 
{
	output = output.concat("\n<gameState>\n");
	for(var key in gameState) {
	    if(!gameState.hasOwnProperty(key)) continue;
		output = output.concat("  <"+key+">"+encodeXML(gameState[key])+"</"+key+">");
	}
	output = output.concat("\n</gameState>\n");

	return output;
}

function serializeActionQueues(output, actionQueues) 
{
	output = output.concat("<actionQueues>");
	for(var i=0;i<actionQueues.length;i++) {
		if(actionQueues[i].curAction) {
			output = actionQueues[i].serialize(output);
		}
	}
	output = output.concat("\n</actionQueues>\n");

	return output;
}

//Serialize assets
function serializeAssets(output,assets,effects){
	output = output.concat("\n<assets>");
	for(var asset in assets){
	    if(!assets.hasOwnProperty(asset)) continue;
		var curAsset = assets[asset];
		var innerHTML = "";

		if(curAsset.type=="graphic"){

			innerHTML += curAsset.originalVals;
		}else if(curAsset.type=="audio"){

			var firstSrc = false;
			for(var i = 0; i < curAsset.originalVals.length; i++)
			{
				var srcVal = curAsset.originalVals[i];
				innerHTML += (firstSrc?";":"")+srcVal;

				firstSrc = true;
			}

		}else if(curAsset.type=="path"){
			for(var i=0;i<curAsset.points.length;i++){
				innerHTML = innerHTML.concat(curAsset.points[i].x+","+curAsset.points[i].y);
				if(i!=curAsset.points.length-1){
					innerHTML = innerHTML.concat(";");
				}
			}
		}else if(curAsset.type=="movie"){
			innerHTML += curAsset.originalVals;
		}else if(curAsset.type=="font"){
			innerHTML += curAsset.originalVals;
		}else if(curAsset.type=="text"){
			innerHTML += escape(curAsset.text.trim());
		}

		output = output.concat("\n<asset name='"+curAsset.name+"' type='"+curAsset.type+"' ");

		output = output.concat(" >");
		output = output.concat(innerHTML);
		output = output.concat("</asset>");
	}
	output = output.concat("\n</assets>\n");
	output = output.concat("\n<effects>");
	for(var effect in effects){
	    if(!effects.hasOwnProperty(effect)) continue;
		var curEffect = effects[effect];
		output = curEffect.serialize(output);
	}
	output = output.concat("\n</effects>\n");
	return output;
}

//Serialize template classes
function serializeTemplates(output,templates){
	output = output.concat("\n<classes>");
	var serialized;
	try {
		// XMLSerializer exists in current Mozilla browsers
		serializer = new XMLSerializer();
		for(var template in templates){
	        if(!templates.hasOwnProperty(template)) continue;
			output = output.concat(serializer.serializeToString(templates[template]));
		}
	}catch (e) {
		// Internet Explorer has a different approach to serializing XML
		for(var template in templates){
	        if(!templates.hasOwnProperty(template)) continue;
			output = output.concat(templates[template].xml);
		}
	}
	output = output.concat("\n</classes>\n");
	return output;
}

//Serialize Hud
function serializeHud(output,hud,dialoger){
	output = output.concat("\n<hud>");
	for(var content in hud){
        if(!hud.hasOwnProperty(content)) continue;
		output = hud[content].serialize(output);
	}
	output = Sburb.dialoger.serialize(output);
	var animations = dialoger.dialogSpriteLeft.animations;
	output = output.concat("\n<dialogsprites>");
	for(var animation in animations){
        if(!animations.hasOwnProperty(animation)) continue;
		output = animations[animation].serialize(output);
	}
	output = output.concat("\n</dialogsprites>");
	output = output.concat("\n</hud>\n");
	return output;
}

//Purge all assets
function purgeAssets() {
    Sburb.assetManager.purge();
    Sburb.assets = Sburb.assetManager.assets;
}

//Purge the game state
function purgeState(){
	if(Sburb.rooms){
		delete Sburb.rooms;
	}
	if(Sburb.sprites){
		delete Sburb.sprites;
	}
	Sburb.rooms = {};
	if(Sburb.bgm){
		Sburb.bgm.stop();
		Sburb.bgm = null;
	}
    for(var bin in Sburb.Bins) {
        if(!Sburb.Bins.hasOwnProperty(bin)) continue;
        Sburb.Bins[bin].innerHTML = "";
    }
	Sburb.gameState = {};
	Sburb.globalVolume = 1;
	Sburb.hud = {};
	Sburb.sprites = {};
	Sburb.buttons = {};
	Sburb.effects = {};
	Sburb.curAction = null;
	Sburb.actionQueues = [];
	Sburb.nextQueueId = 0;
	Sburb.pressed = {};
	Sburb.pressedOrder = [];
	Sburb.chooser = new Sburb.Chooser();
	Sburb.dialoger = null;
	Sburb.curRoom = null;
	Sburb.char = null;
	Sburb.assetManager.resourcePath = "";
	Sburb.assetManager.levelPath = "";
	Sburb.loadedFiles = {};
}

//Load state/assets from file
Sburb.loadSerialFromXML = function(file,keepOld) {
	Sburb.haltUpdateProcess();
	file = Sburb.assetManager.levelPath+file;
	
	if(keepOld && Sburb.loadedFiles[file]){
		Sburb.startUpdateProcess();
		return;
	}else{
		Sburb.loadedFiles[file] = true;
	}
	
	
	var request = new XMLHttpRequest();
    request.open('GET', file, false);
    try {
		request.send(null);
    } catch(err) {
		console.log("Could not load level descriptors.");
		fi = document.getElementById("levelFile");
		return;
    }
    if (request.status === 200 || request.status == 0) { 
        try {
            loadSerial(request.responseText, keepOld);
        } catch(err) {
            if (err instanceof XMLParsingError) {
                if (err.file) {
                    console.error("Loaded from '"+file+"'")
                } else {
                    err.file = file
                    console.error("Error in '"+file+"'")
                }
            }
            throw err;
        }
    }
}

//main serial loading
function loadSerial(serialText, keepOld) {
	Sburb.haltUpdateProcess();

    var inText = serialText; //document.getElementById("serialText");
    var input = Sburb.parseXML(inText);
	
	if(!keepOld) {
    	purgeAssets(); 
    	purgeState();
    }

    var rootAttr = input.attributes;

	var levelPath = rootAttr.getNamedItem("levelPath");

    if(levelPath){
    	Sburb.assetManager.levelPath = levelPath.value.charAt(levelPath.value.length-1)=="/" ?
    		levelPath.value : levelPath.value+"/";
    }
    
    var resourcePath = rootAttr.getNamedItem("resourcePath");
    if(resourcePath){
    	Sburb.assetManager.resourcePath = resourcePath.value;
    }

    var name = rootAttr.getNamedItem("name");
    if(name) {
    	Sburb.name = name.value;
    }

    var version = rootAttr.getNamedItem("version");
    if(version) {
    	Sburb.version = version.value;
    }

    var width = rootAttr.getNamedItem("width");
    if(width) {
    	Sburb.setDimensions(width.value, null);
    }

    var height = rootAttr.getNamedItem("height");
    if(height) {
    	Sburb.setDimensions(null, height.value);
    }

    var loadedFiles = rootAttr.getNamedItem("loadedFiles");
    if(loadedFiles) {
    	var fileNames = loadedFiles.value.split(",");
    	for(var i = 0; i< fileNames.length; i++)
    	{
    		Sburb.loadedFiles[fileNames[i]] = true;
    	}
    }

    loadingDepth++;
    loadDependencies(input);
    loadingDepth--;
    loadSerialAssets(input);
	loadQueue.push(input);
	loadSerialState(input); 
}

Sburb.parseXML = function(inText) {
    var parser=new DOMParser();
    var parsed=parser.parseFromString(inText,"text/xml");
    
    if (parsed.getElementsByTagName("parsererror").length>0) {
        var error = parsed.getElementsByTagName("parsererror")[0];
        throw new XMLParsingError(error, inText);
    }
    
    return parsed.documentElement;
}

function XMLParsingError(error, input) {
    this.name = "XMLParsingError";
    this.message = parseXMLError(error);
    this.input = (input || "");
}
XMLParsingError.prototype = new Error();

function parseXMLError(n) {
    if(n.nodeType == 3) {
        return n.nodeValue;
    }
    if(n.nodeName == "h3") {
        return "";
    }
    var error = ""
    for(var i=0; i<n.childNodes.length; i++) {
        error = error + parseXMLError(n.childNodes[i]);
    }
    return error;
}

function loadDependencies(input){
    
	var dependenciesNode = input.getElementsByTagName("dependencies")[0];
	if(dependenciesNode){
		var dependencies = dependenciesNode.getElementsByTagName("dependency");
		for(var i=0; i<dependencies.length;i++){
			var dependency = dependencies[i].firstChild.nodeValue.trim();
			Sburb.loadSerialFromXML(dependency,true);
		}
	}
}

function loadSerialAssets(input){
	var rootAttr = input.attributes;
    
  var description = rootAttr.getNamedItem("description");
  if(description){
  	Sburb.assetManager.description = description.value;
  }else{
  	Sburb.assetManager.description = "assets"
  }
  
  var newAssets = input.getElementsByTagName("asset");
  for(var i=0;i<newAssets.length;i++){
		var curAsset = newAssets[i];
			var attributes = curAsset.attributes;
		var name = attributes.getNamedItem("name").value;
		if (!Sburb.assetManager.isLoaded(name)) {
			loadSerialAsset(curAsset);
		}
  }
}

function loadSerialAsset(curAsset){
    var newAsset = parseSerialAsset(curAsset);
    Sburb.assetManager.loadAsset(newAsset);
}
function parseSerialAsset(curAsset) {
	var attributes = curAsset.attributes;
	var name = attributes.getNamedItem("name").value;
	var type = attributes.getNamedItem("type").value;
	var value = curAsset.firstChild.nodeValue.trim();

	var blobUrlsAttr = attributes.getNamedItem("blob-urls");
	var blobUrls = [];

	if(blobUrlsAttr)
		blobUrls = blobUrlsAttr.value.split(";");

	if(blobUrls.length === 0) blobUrls = null;

	var newAsset;
	if(type=="graphic"){
		newAsset = Sburb.createGraphicAsset(name, value, blobUrls);
	} else if(type=="audio"){
		var sources = value.split(";");
		newAsset = Sburb.createAudioAsset(name, sources,blobUrls);
	} else if(type=="path"){
		var pts = value.split(";");
		var path = new Sburb.Path();
		for(var j=0;j<pts.length;j++){
			 var point = pts[j].split(",");
			 path.push({x:parseInt(point[0]),y:parseInt(point[1])});
		}
		newAsset = Sburb.createPathAsset(name,path);
	}else if(type=="movie"){
		newAsset = Sburb.createMovieAsset(name, value,blobUrls);
	}else if(type=="font"){
		//var sources = value.split(";");
		newAsset = Sburb.createFontAsset(name,value);
	}else if(type=="text"){
		newAsset = Sburb.createTextAsset(name,value);
	}
    newAsset._raw_xml = curAsset;
	return newAsset;
}



function loadSerialState() {
  // don't load state until assets are all loaded
  if(updateLoop){
  	clearTimeout(updateLoop);
  	updateLoop = null;
  }
  if(!Sburb.assetManager.finishedLoading()) {
		updateLoop=setTimeout(function() { loadSerialState(); } ,500);
		return;
  }
  
  while(loadQueue.length>0){
		var input = loadQueue[0];
		loadQueue.splice(0,1);
		//These two have to be first
	 	parseTemplateClasses(input);
		applyTemplateClasses(input);
		parseButtons(input);
		parseSprites(input);
		parseCharacters(input);
		parseFighters(input);
		parseRooms(input);
		parseGameState(input);	
	
		parseHud(input);
		parseEffects(input);
	
		//should be last
		parseState(input);
		//Relies on Sburb.nextQueueId being set when no Id is provided
		parseActionQueues(input);
  }
  
  if(loadQueue.length==0 && loadingDepth==0){
		Sburb.startUpdateProcess();
	}
}

function parseDialogSprites(input){
	var hud = input.getElementsByTagName("hud");

	if(hud.length>0){
		var dialogSprites = hud[0].getElementsByTagName("dialogsprites");

		if(dialogSprites.length>0){
			serialLoadDialogSprites(dialogSprites[0],Sburb.assets);
		}
	}
}

function parseEffects(input){
	var effects = input.getElementsByTagName("effects");

	if(effects.length>0){
		serialLoadEffects(effects[0],Sburb.assets,Sburb.effects);
	}
}

function parseTemplateClasses(input){
	var classes = input.getElementsByTagName("classes");

	if(classes.length>0){
		var templates = classes[0].childNodes;
		for(var i=0;i<templates.length;i++){
			var templateNode = templates[i];
			
			if(templateNode.nodeName!="#text" && templateNode.nodeName!="#comment"){
				applyTemplateClasses(templateNode);
			 	var tempAttributes = templateNode.attributes;
			 	templateClasses[tempAttributes.getNamedItem("class").value] =
			 		templateNode.cloneNode(true);
			}
		}
		input.removeChild(input.getElementsByTagName("classes")[0]);
	}
}

function applyTemplateClasses(input){
	for(var className in templateClasses){
        if(!templateClasses.hasOwnProperty(className)) continue;
		var templateNode = templateClasses[className];
	 	var candidates = input.getElementsByTagName(templateNode.nodeName);
	 	for(var j=0;j<candidates.length;j++){
	 		var candidate = candidates[j];
	 		tryToApplyTemplate(templateNode,candidate);
	 	}
	}
}

function tryToApplyTemplate(templateNode,candidate){
	var templateClass = templateNode.attributes.getNamedItem("class").value;
	var candClass = candidate.attributes.getNamedItem("class");
	if(candClass && candClass.value==templateClass){
		applyTemplate(templateNode,candidate);
	}
}

function applyTemplate(templateNode,candidate){
	var tempAttributes = templateNode.attributes;
	var tempChildren = templateNode.childNodes;
	var candAttributes = candidate.attributes;
	var candChildren = candidate.childNodes;
	for(var k=0;k<tempAttributes.length;k++){
		var tempAttribute = tempAttributes[k];
		if(!candAttributes.getNamedItem(tempAttribute.name)){
			candidate.setAttribute(tempAttribute.name, tempAttribute.value);
		}
	}
	for(var k=0;k<tempChildren.length;k++){
		candidate.appendChild(tempChildren[k].cloneNode(true));
	}
}

function parseButtons(input){
	var newButtons = input.getElementsByTagName("spritebutton");
	for(var i=0;i<newButtons.length;i++){
		var curButton = newButtons[i];
		var newButton = Sburb.parseSpriteButton(curButton);
  		Sburb.buttons[newButton.name] = newButton;
	}
}

function parseSprites(input){
	
	var newSprites = input.getElementsByTagName("sprite");
	for(var i=0;i<newSprites.length;i++){
		var curSprite = newSprites[i];
		var newSprite = Sburb.parseSprite(curSprite, Sburb.assets);
		Sburb.sprites[newSprite.name] = newSprite;
		parseActions(curSprite,newSprite);
	}
}

function parseActions(spriteNode,sprite){
	var newActions = spriteNode.childNodes;
	for(var k=0;k<newActions.length;k++){
		if(newActions[k].nodeName == "#text") {
			continue;
		}
		if(newActions[k].nodeName == "action"){
			var newAction = Sburb.parseAction(newActions[k]);
			sprite.addAction(newAction);
		}
	}
}

function parseCharacters(input){
	var newChars = input.getElementsByTagName("character");
  	for(var i=0;i<newChars.length;i++){
  		var curChar = newChars[i];
			var newChar = Sburb.parseCharacter(curChar, Sburb.assets);
  		Sburb.sprites[newChar.name] = newChar;
  		parseActions(curChar,newChar);
  	}
}

function parseFighters(input){
	var newFighters = input.getElementsByTagName("fighter");
  	for(var i=0;i<newFighters.length;i++){
  		var curFighter = newFighters[i];
			var newFighter = Sburb.parseFighter(curFighter, Sburb.assets);
  		Sburb.sprites[newFighter.name] = newFighter;
  		parseActions(curFighter,newFighter);
  	}
}

function parseRooms(input){
	var newRooms = input.getElementsByTagName("room");
  	for(var i=0;i<newRooms.length;i++){
  		var currRoom = newRooms[i];
			var newRoom = Sburb.parseRoom(currRoom, Sburb.assets, Sburb.sprites);
  		Sburb.rooms[newRoom.name] = newRoom;
  	}
}

function parseGameState(input) {
	var gameStates = input.getElementsByTagName("gameState");
	for(var i=0; i<gameStates.length; i++) {
		var gameState = gameStates[i];
		var children = gameState.childNodes;
		for(var j=0; j<children.length; j++) {
			var node = children[j];

			if(node.nodeType === 3) //Text node, formatting node
				continue;

			var key = node.tagName;
			var value = node.firstChild.nodeValue;
			Sburb.gameState[key] = value;
		}
	}
}

function parseActionQueues(input){
	var element=input.getElementsByTagName("actionQueues");
	if(element.length==0) {
		return;
	}
	var actionQueues = element[0].childNodes;
	for(var i=0;i<actionQueues.length;i++) {
		if(actionQueues[i].nodeName == "#text") {
			continue;
		}
		var actionQueue = Sburb.parseActionQueue(actionQueues[i]);
		Sburb.actionQueues.push(actionQueue);
	}
}

function parseState(input){
	var rootInfo = input.attributes;
  	
  	var char = rootInfo.getNamedItem("char");
  	if(char){
	  	Sburb.focus = Sburb.char = Sburb.sprites[char.value];
	  	Sburb.char.becomePlayer();
	}
  	
  	var mode = rootInfo.getNamedItem("mode");
  	if(mode){
  		Sburb.engineMode = mode.value;
  	}
  	
  	var scale = rootInfo.getNamedItem("scale");
  	if(scale){
  		Sburb.Stage.scaleX = Sburb.Stage.scaleY = parseInt(scale.value);
  	}
  	
  	var nextQueueId = rootInfo.getNamedItem("nextQueueId");
  	if(nextQueueId){
  		Sburb.nextQueueId = parseInt(nextQueueId.value);
  	}
  	
  	var curRoom = rootInfo.getNamedItem("curRoom");
  	if(curRoom){
  		Sburb.curRoom = Sburb.rooms[curRoom.value];
  		Sburb.curRoom.enter();
  	}else if(Sburb.curRoom==null && Sburb.char!=null){
  		for(var roomName in Sburb.rooms){
            if(!Sburb.rooms.hasOwnProperty(roomName)) continue;
  			var room = Sburb.rooms[roomName];
  			if(room.contains(Sburb.char)){
  				Sburb.curRoom = room;
  				Sburb.curRoom.enter();
  				break;
  			}
  		}
  	}
  	var bgm = rootInfo.getNamedItem("bgm");
  	if(bgm){
  		var params = bgm.value.split(",");
  		Sburb.changeBGM(new Sburb.BGM(Sburb.assets[params[0]],parseFloat(params.length>1?params[1]:"0")));
  	}
  	
  	var initAction;
    var initActionName;
    if(rootInfo.getNamedItem("startAction")){
    	initActionName = rootInfo.getNamedItem("startAction").value;
		for(var i=0; i<input.childNodes.length; i++) {
			var tmp = input.childNodes[i];
			if(tmp.tagName=="action" && tmp.attributes.getNamedItem("name").value == initActionName) {
				initAction = Sburb.parseAction(tmp);
				continue;
			}
		}
		if(initAction) {
			Sburb.performAction(initAction);
		}
    }
}

function parseHud(input){
	var hud = input.getElementsByTagName("hud");
	if(hud.length>0){
		var children = hud[0].childNodes;
		for(var i=0;i<children.length;i++){
			var child = children[i];

			if(child.nodeName == "spritebutton"){
				var name = child.attributes.getNamedItem("name").value;
  				Sburb.hud[name] = Sburb.buttons[name];
			}
		}
	}
	parseDialoger(input);
	parseDialogSprites(input);
}

function parseDialoger(input){
	var dialoger = input.getElementsByTagName("dialoger");
	if(dialoger.length>0){
		var dialogSpriteLeft = null;
		var dialogSpriteRight = null;
		if(Sburb.dialoger){
			dialogSpriteLeft = Sburb.dialoger.dialogSpriteLeft;
			dialogSpriteRight = Sburb.dialoger.dialogSpriteRight;
		}
		Sburb.dialoger = Sburb.parseDialoger(dialoger[0]);
		Sburb.dialoger.dialogSpriteLeft = dialogSpriteLeft;
		Sburb.dialoger.dialogSpriteRight = dialogSpriteRight;
	}
}

function serialLoadDialogSprites(dialogSprites,assetFolder){
	if(!Sburb.dialoger){
		Sburb.dialoger = {};
	}
	if(!Sburb.dialoger.dialogSpriteLeft){
		Sburb.dialoger.dialogSpriteLeft = new Sburb.Sprite("dialogSprite",-1000,Sburb.Stage.height,0,0);
		Sburb.dialoger.dialogSpriteRight = new Sburb.Sprite("dialogSprite",Sburb.Stage.width+1000,Sburb.Stage.height,0,0);
	}
	var animations = dialogSprites.getElementsByTagName("animation");
	for(var i=0;i<animations.length;i++){
		Sburb.dialoger.dialogSpriteLeft.addAnimation(Sburb.parseAnimation(animations[i],assetFolder));
		Sburb.dialoger.dialogSpriteRight.addAnimation(Sburb.parseAnimation(animations[i],assetFolder));
	}

}

function serialLoadEffects(effects,assetFolder,effectsFolder){
	var animations = effects.getElementsByTagName("animation");
	for(var i=0;i<animations.length;i++){
		var newEffect = Sburb.parseAnimation(animations[i],assetFolder);
		effectsFolder[newEffect.name] = newEffect;
	}
}

function serialLoadRoomSprites(newRoom, roomSprites, spriteFolder){
	for(var j=0;j<roomSprites.length;j++){
		var curSprite = roomSprites[j];
		var actualSprite = spriteFolder[curSprite.attributes.getNamedItem("name").value];
		newRoom.addSprite(actualSprite);
	  
	}
}

function serialLoadRoomPaths(newRoom, paths, assetFolder) {
	var walkables = paths[0].getElementsByTagName("walkable");
	for(var j=0;j<walkables.length;j++){
		var node = walkables[j];
		var attributes = node.attributes;
		newRoom.addWalkable(assetFolder[attributes.getNamedItem("path").value]);
	}
	
	var unwalkables = paths[0].getElementsByTagName("unwalkable");
	for(var j=0;j<unwalkables.length;j++){
		var node = unwalkables[j];
		var attributes = node.attributes;
		newRoom.addUnwalkable(assetFolder[attributes.getNamedItem("path").value]);
	}
	
	var motionPaths = paths[0].getElementsByTagName("motionpath");
	for(var j=0;j<motionPaths.length;j++) {
		var node = motionPaths[j];
		var attributes = node.attributes;
		newRoom.addMotionPath(assetFolder[attributes.getNamedItem("path").value], 
				      attributes.getNamedItem("xtox")?parseFloat(attributes.getNamedItem("xtox").value):1, 
				      attributes.getNamedItem("xtoy")?parseFloat(attributes.getNamedItem("xtoy").value):0, 
				      attributes.getNamedItem("ytox")?parseFloat(attributes.getNamedItem("ytox").value):0, 
				      attributes.getNamedItem("ytoy")?parseFloat(attributes.getNamedItem("ytoy").value):1, 
				      attributes.getNamedItem("dx")?parseFloat(attributes.getNamedItem("dx").value):0, 
				      attributes.getNamedItem("dy")?parseFloat(attributes.getNamedItem("dy").value):0);
	}
}

function serialLoadRoomTriggers(newRoom, triggers){
 	var candidates = triggers[0].childNodes;
	for(var i=0;i<candidates.length;i++){
		if(candidates[i].nodeName=="trigger"){
			newRoom.addTrigger(Sburb.parseTrigger(candidates[i]));
		}
	}
}

Sburb.serializeAttribute = function(base,val){
	var sub;
	return base[val]?" "+val+"='"+base[val]+"' ":"";
}

Sburb.serializeAttributes = function(base){
	str = "";
	for(var i=1;i<arguments.length;i++){
		str = str.concat(Sburb.serializeAttribute(base,arguments[i]));
	}
	return str;
}

Sburb.serialLoadRoomSprites = serialLoadRoomSprites;
Sburb.serialLoadRoomPaths = serialLoadRoomPaths;
Sburb.serialLoadRoomTriggers = serialLoadRoomTriggers;
Sburb.loadSerial = loadSerial;

return Sburb;
})(Sburb || {});
