var Sburb = (function(Sburb){


/////////////////////////////////////
//Path class
/////////////////////////////////////

//constructor
Sburb.Path = function(){
	this.points = [];
}

//add a point to the path
Sburb.Path.prototype.push = function(point){
	this.points.push(point);
}

//Check if the given points are in the path, favouring positively
Sburb.Path.prototype.queryBatchPos = function(queries,results){
	for(var query in queries){
	    if(!queries.hasOwnProperty(query)) continue;
	    results[query] = results[query] || this.query(queries[query]);
	}
}

//Check if the given points are in the path, favouring negatively
Sburb.Path.prototype.queryBatchNeg = function(queries,results){
	for(var query in queries){
	    if(!queries.hasOwnProperty(query)) continue;
	    results[query] = results[query] && !this.query(queries[query]);
	}
}

//Check if the given point is in the path
Sburb.Path.prototype.query = function(pt){
	for(var c = false, i = -1, l = this.points.length, j = l-1; ++i < l;j=i){
		var ptA = this.points[i];
		var ptB = this.points[j];
		((ptA.y <= pt.y && pt.y < ptB.y) || (ptB.y <= pt.y && pt.y < ptA.y))
		&& (pt.x < (ptB.x - ptA.x) * (pt.y - ptA.y) / (ptB.y - ptA.y) + ptA.x)
		&& (c = !c);
	}
	return c;
}






return Sburb;
})(Sburb || {});
