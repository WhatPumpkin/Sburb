var Sburb = (function(Sburb){






/////////////////////////////////////////
//Trigger Class
/////////////////////////////////////////

//constructor
Sburb.Trigger = function(info,action,followUp,restart,detonate,operator){
	//console.log("Trigger constructor with: "+info, info);
	if(typeof info == "string"){
		info = [info];
	}
	
	this.info = info;
	this.followUp = followUp?followUp:null;
	this.action = action?action:null;
	this.restart = restart?restart:false;
	this.detonate = detonate?detonate:false;
	this.operator = operator?operator.toUpperCase():"AND";
	this.waitFor = null;
	
	this.events = [];
	for(var i=0;i<info.length;i++){
		var inf = this.info[i].trim();
		var params = inf.split(",");
		var type = params[0];
		//console.log("parsed trigger args: "+type+"("+inf+")");
		this.events[i] = new Sburb.events[type](inf);
	}
	this.reset();
}

//parse the trigger info into an actual event to watch
Sburb.Trigger.prototype.reset = function(){
	for(var i=0; i<this.events.length; i++){
		this.events[i].reset();
	}
}

Sburb.Trigger.prototype.checkCompletion = function() {
	return this["operator"+this.operator]();
}

//check if the trigger has been satisfied
Sburb.Trigger.prototype.tryToTrigger = function(){
	if(this.waitFor){
		if(this.waitFor.checkCompletion()){
			this.waitFor=null;
		}else{
			return;
		}
	}
	if(this.checkCompletion()){
		if(this.action){
			var result = Sburb.performAction(this.action);
			if(result){
				this.waitFor = new Sburb.Trigger("noActions,"+result.id);
			}else{
				this.waitFor = new Sburb.Trigger("noActions");
			}
		}
		if(this.followUp){
			if(this.followUp.tryToTrigger()){
				this.followUp = null;
			}
		}
		if(this.restart){
			reset();
		}
		return this.detonate;
	}
}

//Serialize the Trigger to XML
Sburb.Trigger.prototype.serialize = function(output){
	output = output.concat("\n<trigger"+
		(this.restart?" restart='true'":"")+
		(this.detonate?" detonate='true'":"")+
		(this.operator?" operator='"+this.operator+"'":"")+
		">");
		for(var i=0;i<this.info.length;i++){
			if(this.events[i].serialize) {
				output = output.concat("<args>"+escape(this.events[i].serialize())+"</args>");
			} else {
				output = output.concat("<args>"+escape(this.info[i])+"</args>");
			}
		}
	if(this.action){
		output = this.action.serialize(output);
	}
	if(this.followUp){
		output = this.followUp.serialize(output);
	}
	output = output.concat("\n</trigger>");
	return output;
}

Sburb.Trigger.prototype.operatorAND = function(){
	var result = true;
	for(var i=0;i<this.events.length;i++){
		result = result && this.events[i].checkCompletion();
	}
	return result;
}

Sburb.Trigger.prototype.operatorOR = function(){
	var result = false;
	for(var i=0;i<this.events.length;i++){
		result = result || this.events[i].checkCompletion();
	}
	return result;
}

Sburb.Trigger.prototype.operatorXOR = function(){
	var result = false;
	for(var i=0;i<this.events.length;i++){
		if(this.events[i].checkCompletion()){
			if(result){
				return false; //*EXCLUSIVE* OR!
			}else{
				result = true;
			}
		}
	}
	return result;
}

Sburb.Trigger.prototype.operatorNAND = Sburb.Trigger.prototype.operatorNOT = function(){
	return !this.operatorAND();
}

Sburb.Trigger.prototype.operatorNOR = function(){
	return !this.operatorOR();
}


////////////////////////////////////////on
//Related Utility Functions
////////////////////////////////////////

//Parse a Trigger from XML
Sburb.parseTrigger = function(triggerNode){
	var firstTrigger = null;
	var oldTrigger = null;
	do{
		var attributes = triggerNode.attributes;
		var info = getNodeText(triggerNode);
		for(var i=0;i<info.length;i++){
			info[i] = unescape(info[i]);
		}
		var actions = triggerNode.getElementsByTagName("action");
		
		var action = null;
		var restart = false;
		var detonate = false;
		var operator = null;
		if(actions.length>0 && actions[0].parentNode==triggerNode){
			action = Sburb.parseAction(actions[0]);
		}
		restart = attributes.getNamedItem("restart")?attributes.getNamedItem("restart").value=="true":restart;
		detonate = attributes.getNamedItem("detonate")?attributes.getNamedItem("detonate").value=="true":detonate;
		operator = attributes.getNamedItem("operator")?attributes.getNamedItem("operator").value:operator;
		
		var trigger = new Sburb.Trigger(info,action,null,restart,detonate,operator);
		
		if(!firstTrigger){
			firstTrigger = trigger;
		}
		if(oldTrigger){
			oldTrigger.followUp = trigger;
		}
		oldTrigger = trigger;
		var found=false;
		for(var i=0;i<triggerNode.childNodes.length;i++){
			var child = triggerNode.childNodes[i];
			if(child.nodeName=="trigger"){
				triggerNode = child;
				found = true;
				break;
			}
		}
		if(!found){
			break;
		}
	}while(triggerNode)
	return firstTrigger;
}



function getNodeText(xmlNode){
  if(!xmlNode) return [];
  var outputs = [];
  for(var i=0;i<xmlNode.childNodes.length;i++){
  	var child = xmlNode.childNodes[i];
  	if(child.tagName=="args"){
  		for(var k=0;k<child.childNodes.length;k++){
				if(child.childNodes[k].firstChild){
					serializer = new XMLSerializer();
					var output = "";
					for(var j=0; j<child.childNodes.length; j++){
						output += serializer.serializeToString(child.childNodes[j]);
					}
					outputs.push(output);
				}
			}
			if(typeof(child.textContent) != "undefined"){
				outputs.push(child.textContent);
			}else{
				outputs.push(child.firstChild.nodeValue);
			}
		}
	}
	if(outputs.length==0){
		outputs.push(xmlNode.firstChild.nodeValue);
	}
	return outputs;
}


return Sburb;
})(Sburb || {});
