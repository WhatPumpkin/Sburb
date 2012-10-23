var Sburb = (function(Sburb){




///////////////////////////////////////
//ActionQueue Class
///////////////////////////////////////

//constructor
Sburb.ActionQueue = function(action, id, groups, noWait, paused, trigger) {
	this.curAction = action;
	this.id = (id && (id.length>0)) ? id : Sburb.nextQueueId++;
	this.groups = groups ? groups : [];
	this.noWait = noWait ? noWait : false;
	this.paused = paused ? true : false;
	this.trigger = trigger;
}

Sburb.ActionQueue.prototype.hasGroup = function(group) {
	for(var i=0;i<this.groups.length;i++) {
		if(this.groups[i]==group) {
			return true;
		}
	}
	return false;
}

Sburb.ActionQueue.prototype.serialize = function(output) {
	if(!this.curAction) {
		return "";
	}
	var groupString="";
	for(var i=0;i<this.groups.length;i++) {
		groupString+=((i>0)?":":"")+this.groups[i];
	}
	output = output.concat("\n<actionQueue "+Sburb.serializeAttributes(this,"id","noWait","paused")
		+(groupString.length==0?"":" groups='"+groupString+"'")+">");

	output = this.curAction.serialize(output);
	if(this.trigger) {
		output = this.trigger.serialize(output);
	}

	output = output.concat("</actionQueue>");
	return output;
}





//////////////////////////////////////////////////
//Related utility functions
//////////////////////////////////////////////////

Sburb.getActionQueueById = function(id) {
	for(var i=0;i<this.actionQueues.length;i++) {
		var queue=this.actionQueues[i];
		if(queue.id==id) {
			return queue;
		}
	}
}

Sburb.removeActionQueueById = function(id) {
	for(var i=0;i<this.actionQueues.length;i++) {
		var queue=this.actionQueues[i];
		if(queue.id==id) {
			this.actionQueues.remove(i);
			return;
		}
	}
}

Sburb.forEachActionQueueInGroup = function(group, callback) {
	for(var i=0;i<this.actionQueues.length;i++) {
		var queue=this.actionQueues[i];
		if(queue.hasGroup(group)) {
			callback(queue);
		}
	}
}

Sburb.removeActionQueuesByGroup = function(group) {
	for(var i=0;i<this.actionQueues.length;i++) {
		var queue=this.actionQueues[i];
		if(queue.hasGroup(group)) {
			this.actionQueues.remove(i);
			i--;
		}
	}
}

Sburb.parseActionQueue = function(node) {
	var attributes = node.attributes;

	var newAction = null;
	var newId = 0;
	var newGroups = null;
	var newNoWait = false;
	var newPaused = false;
	var newTrigger = null;

	var childNodes = node.childNodes;
	for(var i=0;i<childNodes.length;i++) {
		if(childNodes[i].nodeName == "#text") {
			continue;
		}
		if(childNodes[i].nodeName == "action") {
			newAction = Sburb.parseAction(childNodes[i]);
		} else {
			newTrigger = Sburb.parseTrigger(childNodes[i]);
		}
	}

	var temp;
	newId = (temp=attributes.getNamedItem("id"))?temp.value:(Sburb.nextQueueId++);
	newGroups = (temp=attributes.getNamedItem("groups"))?temp.value.split(":"):newGroups;
	newNoWait = (temp=attributes.getNamedItem("noWait"))?temp.value=="true":newNoWait;
	newPaused = (temp=attributes.getNamedItem("paused"))?temp.value=="true":newPaused;

	return new Sburb.ActionQueue(newAction,newId,newGroups,newNoWait,newPaused,newTrigger);
}

return Sburb;
})(Sburb || {});
