var Sburb = (function(Sburb){




////////////////////////////////////////////
//AssetManager Class
////////////////////////////////////////////

//Constructor
Sburb.AssetManager = function() {
    // Loop tracking
    this.loopID = false;
    this.space = false;
    this.refresh = false;
    // Asset tracking
    this.totalAssets = 0; // Used in calculation of "Are we done yet?"
    this.totalLoaded = 0; // Used in calculation of "Are we done yet?"
    this.totalMeta = 0; // Used in calculation of "Are we done yet?"
    this.totalSize = 0;   // Used in progress bar
    this.loadedSize = 0;  // Used in progress bar
    this.assets = {};
    this.loaded = {};
    this.recurrences = {};
    this.error = [];
    this.failed = [];
    this.maxAjax = 10; // How many concurrent ajax calls we can have
    this.ajaxRunning = 0;
    this.ajaxCache = []; // Store those suckers
    // Cache urls
    this.cache = {}
    this.blobs = {}
    // Descriptors
    this.description = "";
    this.resourcePath = "";
    this.levelPath = "";
    this.mimes = {
        "jpg": "image/jpeg",
        "gif": "image/gif",
        "png": "image/png",
        "svg": "image/svg+xml",
        "mp3": "audio/mpeg",
        "oga": "audio/ogg",
        "ogg": "audio/ogg",
        "ttf": "application/x-font-ttf",
        "woff": "application/x-font-woff",
        "swf": "application/x-shockwave-flash",
        "flv": "application/x-shockwave-flash"
    };
}

Sburb.AssetManager.prototype.start = function() {
    this.stop();
    this.loopID = setInterval(function() { Sburb.assetManager.loop(); }, 33);
}

Sburb.AssetManager.prototype.stop = function() {
    if(this.loopID) {
        clearInterval(this.loopID);
        this.loopID = false;
    }
}

Sburb.AssetManager.prototype.loop = function() {
    if(Sburb.pressed[Sburb.Keys.space] && !this.space) {
        this.space = true;
        this.refresh = true;
    } else {
        this.refresh = false;
    }
    if(!Sburb.pressed[Sburb.Keys.space])
        this.space = false;
    
    Sburb.debugger.handleInputs(Sburb.pressed);
    this.draw();
    Sburb.debugger.draw();
}

Sburb.AssetManager.prototype.resolvePath = function(path){
    if(path.indexOf(this.resourcePath)==-1){
        return this.resourcePath+"/"+path+"?"+Sburb.version;
    }else{
        return path+"?"+Sburb.version; // Only cache resources of the same version
    }
}

//get the remaining assets to be loaded
Sburb.AssetManager.prototype.totalAssetsRemaining = function() {
    return this.totalAssets - this.totalLoaded;
}

//have all the assets been loaded
Sburb.AssetManager.prototype.finishedLoading = function() {
    return (this.totalAssets && (this.totalAssets == this.totalLoaded));
}

Sburb.AssetManager.prototype.draw = function(){
    Sburb.stage.fillStyle = "rgb(0,0,0)";
    Sburb.stage.fillRect(-3,-3,Sburb.Stage.width+6,Sburb.Stage.height+6);
    if(this.loaded["preloaderBG"]){
        var preloaderBG = Sburb.assets["preloaderBG"];
        Sburb.stage.drawImage(preloaderBG,0,0,preloaderBG.width,preloaderBG.height,0,0,preloaderBG.width,preloaderBG.height);
    }
    Sburb.stage.fillStyle = "rgb(255,255,255)"
    Sburb.stage.font="10px Verdana";
    Sburb.stage.textAlign = "center";
  //Sburb.stage.fillText("Loading "+this.description,Stage.width/2,Stage.height-80);
  var percent = 0;
  if(this.totalSize && this.totalMeta >= this.totalAssets){
      percent =Math.floor((this.loadedSize/this.totalSize)*100);
  } else {
      percent = Math.floor((this.totalLoaded/this.totalAssets)*100);
  }
  Sburb.stage.fillText(percent+"%",Sburb.Stage.width/2,Sburb.Stage.height-50);
  if(Sburb.tests.loading == 0) {
      // Warn the user that we have no clue what's going on
      Sburb.stage.fillText("Warning: File loading is unreliable. Use a newer browser, like Chrome.",Sburb.Stage.width/2,Sburb.Stage.height-35);
  }
  if(this.error.length) {
      Sburb.stage.textAlign = "left";
      for(var i = 0; i < this.error.length; i++)
          Sburb.stage.fillText("Error: "+this.error[i],10,20+15*i);
      Sburb.stage.textAlign = "center";
      if(this.failed.length) {
          if(this.refresh) {
              this.error = ["Refreshing..."];
              for(var i=0; i<this.failed.length;i++)
                this.assets[this.failed[i]].reload();
              this.failed = [];
          } else {
              Sburb.stage.font="18px Verdana";
              Sburb.stage.fillText("Press SPACE to reload failed assets",Sburb.Stage.width/2,Sburb.Stage.height-70);
          }
      }
  }
}

//check if a specific asset has been loaded
Sburb.AssetManager.prototype.isLoaded = function(name) {
    // turn undefined into false
    return this.loaded[name] ? true : false;
}

//reset the asset manager to have no assets
Sburb.AssetManager.prototype.purge = function() {
    for(var k in this.recurrences) {
        if(this.recurrences.hasOwnProperty(k))
            clearTimeout(this.recurrences[k]);
    }
    this.totalLoaded = 0;
    this.totalAssets = 0;
    this.totalMeta = 0;
    this.totalSize = 0;
    this.loadedSize = 0;
    this.assets = {}
    this.loaded = {}
    this.recurrences = {};
    this.error = [];
    this.failed = [];
}

//load the given asset
Sburb.AssetManager.prototype.loadAsset = function(assetObj) {
    var name = assetObj.name;
    this.assets[name] = assetObj;
    if(assetObj.instant) {
        this.loaded[name] = true;
        return;
    }

    var oThis = this;
    this.assetAdded(name);
    var loadedAsset = this.assets[name].assetOnLoadFunction(function() { oThis.assetLoaded(name); });
    if(!loadedAsset)
        this.assets[name].assetOnFailFunction(function() { oThis.assetFailed(name); });
}

//log that the asset was added
Sburb.AssetManager.prototype.assetAdded = function(name) {
    this.totalAssets++;
    this.loaded[name] = false;
}

//log that the asset was loaded
Sburb.AssetManager.prototype.assetLoaded = function(name){
    if(this.assets[name]){
        if(!this.loaded[name]){
            this.loaded[name] = true
            this.totalLoaded++;
            
            if(this.finishedLoading() && Sburb._hardcode_load){
                // only really here to work for old hard-loading
                Sburb.finishInit();
                initFinished = true;
                
            }
        }
    }
};

Sburb.AssetManager.prototype.assetFailed = function(name) {
    var msg = name + " failed to load"
    console.log(msg);
    this.error.push(msg);
    this.failed.push(name);
};




////////////////////////////////////////////
//Related Utility functions
////////////////////////////////////////////

// Converts an ArrayBuffer directly to base64, without any intermediate 'convert to string then
// use window.btoa' step. According to my tests, this appears to be a faster approach:
// http://jsperf.com/encoding-xhr-image-data/5
Sburb.base64ArrayBuffer = function(arrayBuffer) {
  var base64    = ''
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  var bytes         = new window[Sburb.prefixed("Uint8Array",window,false)](arrayBuffer)
  var byteLength    = bytes.byteLength
  var byteRemainder = byteLength % 3
  var mainLength    = byteLength - byteRemainder

  var a, b, c, d
  var chunk

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63               // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength]
    
    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2
    
    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4 // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }
  
  return base64
}

Sburb.loadGenericAsset = function(asset, path, id) {
    var assetPath = Sburb.assetManager.resolvePath(path);
    var ext = path.substring(path.indexOf(".")+1,path.length);
    var type = Sburb.assetManager.mimes[ext];
    
    // We've loaded this before, don't bother loading it again
    if(assetPath in Sburb.assetManager.blobs) {
        var URLCreator = window[Sburb.prefixed("URL",window,false)];
        var blob = Sburb.assetManager.blobs[assetPath];
        var url = false;
        if(Sburb.tests.blobrevoke) {
            url = URLCreator.createObjectURL(blob, {autoRevoke: false});
        } else {
            url = URLCreator.createObjectURL(blob); // I hope this doesn't expire...
        }
        setTimeout(function() { asset.success(url, id); }, 0); // Async call success so things don't blow up
        return;
    }
    if(assetPath in Sburb.assetManager.cache) {
        var url = Sburb.assetManager.cache[assetPath];
        setTimeout(function() { asset.success(url, id); }, 0); // Async call success so things don't blow up
        return;
    }
    
    // Hold on, can't load too many at once
    if(Sburb.assetManager.ajaxRunning >= Sburb.assetManager.maxAjax) {
        Sburb.assetManager.ajaxCache.push([asset, path, id]);
        return;
    } else {
        Sburb.assetManager.ajaxRunning += 1;
    }
    
    var cleanup = function() {
        Sburb.assetManager.ajaxRunning -= 1;
        if(Sburb.assetManager.ajaxCache.length) {
            args = Sburb.assetManager.ajaxCache.shift();
            Sburb.loadGenericAsset(args[0], args[1], args[2]);
        }
    };
    
    // Welcome to fallback hell
    // NOTE: We use array.contains because future fallbacks will just get a higher number
    //       Hence inequalities won't work and multiple == would get messy fast
    if([4,5,6,7,8,9,10,11].contains(Sburb.tests.loading)) {
        // XHR2 supported, we're going to have a good day
        var xhr = new XMLHttpRequest();
        xhr.total = 0;
        xhr.loaded = 0;
        xhr.open('GET', assetPath, true);
        if([8,9,10,11].contains(Sburb.tests.loading)) {
            xhr.responseType = 'blob';
        } else {
            xhr.responseType = 'arraybuffer';
        }
        xhr.onprogress = function(e) {
            if(e.lengthComputable) {
                if(!xhr.total) {
                    Sburb.assetManager.totalMeta++;
                    Sburb.assetManager.totalSize += e.total;
                    xhr.total = e.total;
                }
                var diff = e.loaded - xhr.loaded;
                xhr.loaded = e.loaded;
                Sburb.assetManager.loadedSize += diff;
            } else {
                console.log("ERROR: Length not computable for " + path);
            }
        }
        xhr.onload = function() {
            if((this.status == 200 || this.status == 0) && this.response) {
                // First, let the loader know we're done
                var diff = xhr.total - xhr.loaded;
                xhr.loaded = xhr.total;
                Sburb.assetManager.loadedSize += diff;
                // Now make a URL out of the asset
                var url = false;
                if([5,6,7,9,10,11].contains(Sburb.tests.loading)) {
                    var URLCreator = window[Sburb.prefixed("URL",window,false)];
                    var blob = false;
                    if(Sburb.tests.loading == 11) {
                        blob = new Blob([this.response],{type: type});
                    } else if([5,10].contains(Sburb.tests.loading)) {
                        var builder = new window[Sburb.prefixed("BlobBuilder",window,false)]();
                        builder.append(this.response);
                        blob = builder.getBlob(type);
                    } else if(Sburb.tests.loading == 9) {
                        blob = this.response[Sburb.prefixed("slice",Blob.prototype,false)](0,this.response.size,type);
                    } else if(Sburb.tests.loading == 7) {
                        var dataview = new Uint8Array(this.response);
                        blob = new Blob([dataview],{type: type});
                    } else if(Sburb.tests.loading == 6) {
                        blob = new Blob([this.response],{type: type});
                    } // No else, this covers all the methods in this block
                    if(!blob) {
                        asset.failure(id);
                        cleanup();
                        return; // Uh what happened here?
                    }
                    if(Sburb.tests.blobrevoke) {
                        url = URLCreator.createObjectURL(blob, {autoRevoke: false});
                    } else {
                        url = URLCreator.createObjectURL(blob); // I hope this doesn't expire...
                    }
                    Sburb.assetManager.blobs[assetPath] = blob; // Save for later
                } else if(Sburb.tests.loading == 8) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var url = e.target.result;
                        if(!url) {
                            asset.failure(id);
                            cleanup();
                            return;
                        }
                        // TODO: Replace mime-type with actual type
                        // TODO: Verify this is base64 encoded
                        Sburb.assetManager.cache[assetPath] = url;
                        asset.success(url,id);
                        cleanup();
                    }
                    reader.onabort = function() { asset.failure(id); };
                    reader.onerror = function() { asset.failure(id); };
                    reader.readAsDataURL(this.response);
                    return; // Async inception
                } else if(Sburb.tests.loading == 4) {
                    var b64 = Sburb.base64ArrayBuffer(this.response);
                    url = "data:"+type+";base64,"+b64;
                } // No else, this covers all the methods in this block
                if(!url) {
                    asset.failure(id);
                    cleanup();
                    return; // Uh what happened here?
                }
                Sburb.assetManager.cache[assetPath] = url; // Save for later
                asset.success(url,id);
                cleanup();
            } else {
                asset.failure(id);
                cleanup();
            }
        }
        xhr.onabort = function() { asset.failure(id); cleanup(); };
        xhr.onerror = function() { asset.failure(id); cleanup(); };
        xhr.send();
    } else if([1,2,3].contains(Sburb.tests.loading)) {
        // XHR 1, not bad
        var xhr = new XMLHttpRequest();
        xhr.open('GET', assetPath, true);
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
        xhr.onload = function() {
            if((this.status == 200 || this.status == 0) && this.responseText) {
                var url = false;
                if([2,3].contains(Sburb.tests.loading)) {
                    // Convert response to ArrayBuffer (But why though :( )
                    var binstr = this.responseText;
                    var len = binstr.length;
                    var bytes = new Uint8Array(len);
                    for(var i = 0; i < len; i += 1) {
                        bytes[i] = binstr.charCodeAt(i) & 0xFF;
                    }
                    var URLCreator = window[Sburb.prefixed("URL",window,false)];
                    var blob = false;
                    if(Sburb.tests.loading == 3) {
                        blob = new Blob([bytes],{type: type});
                    } else if(Sburb.tests.loading == 2) {
                        var builder = new window[Sburb.prefixed("BlobBuilder",window,false)]();
                        builder.append(bytes.buffer);
                        blob = builder.getBlob(type);
                    } // No else, this covers all the methods in this block
                    if(!blob) {
                        asset.failure(id);
                        cleanup();
                        return; // Uh what happened here?
                    }
                    if(Sburb.tests.blobrevoke) {
                        url = URLCreator.createObjectURL(blob, {autoRevoke: false});
                    } else {
                        url = URLCreator.createObjectURL(blob); // I hope this doesn't expire...
                    }
                    Sburb.assetManager.blobs[assetPath] = blob; // Save for later
                } else if(Sburb.tests.loading == 1) {
                    // Clean the string
                    var binstr = this.responseText;
                    var len = binstr.length;
                    var bytes = new Array(len);
                    for(var i = 0; i < len; i += 1) {
                        bytes[i] = binstr.charCodeAt(i) & 0xFF;
                    }
                    binstr = '';
                    // Don't break the stack - Thanks MDN!
                    var QUANTUM = 65000;
                    for(var i = 0; i < len; i += QUANTUM) {
                        binstr += String.fromCharCode.apply(null, bytes.slice(i, Math.min(i + QUANTUM, len)));
                    }
                    var b64 = window.btoa(binstr);
                    url = "data:"+type+";base64,"+b64;
                } // No else, this covers all the methods in this block
                if(!url) {
                    asset.failure(id);
                    cleanup();
                    return; // Uh what happened here?
                }
                Sburb.assetManager.cache[assetPath] = url; // Save for later
                asset.success(url,id);
                cleanup();
            } else {
                asset.failure(id);
                cleanup();
            }
        }
        xhr.onabort = function() { asset.failure(id); cleanup(); };
        xhr.onerror = function() { asset.failure(id); cleanup(); };
        xhr.send();
    } else if(Sburb.tests.loading == 12) {
        // IE 9 specific BS - May not work but I don't care
        var xhr = new XMLHttpRequest();
        xhr.open('GET', assetPath, true);
        xhr.onload = function() {
            if((this.status == 200 || this.status == 0) && this.responseText) { // Checking responseBody directly doesn't work??
                // Clean the string
                var bytes = new VBArray(this.responseBody).toArray();
                var len = bytes.length;
                var binstr = '';
                // Don't break the stack - Thanks MDN!
                var QUANTUM = 65000;
                for(var i = 0; i < len; i += QUANTUM) {
                    binstr += String.fromCharCode.apply(null, bytes.slice(i, Math.min(i + QUANTUM, len)));
                }
                var b64 = window.btoa(binstr);
                var url = "data:"+type+";base64,"+b64;
                Sburb.assetManager.cache[assetPath] = url; // Save for later
                asset.success(url,id);
                cleanup();
            } else {
                asset.failure(id);
                cleanup();
            }
        }
        xhr.onabort = function() { asset.failure(id); cleanup(); };
        xhr.onerror = function() { asset.failure(id); cleanup(); };
        xhr.send();
    } else if(Sburb.tests.loading == 0) {
        // DANGER DANGER we can't track anything! PANIC!!!
        Sburb.assetManager.cache[assetPath] = assetPath; // Save for later
        asset.success(assetPath,id,true);
        cleanup();
    } else {
        // Somebody added another fallback without editting this function. Yell at them.
        console.error("Invalid Sburb.tests.loading. Value = "+Sburb.tests.loading);
        asset.failure(id);
        cleanup();
    }
};

//Create a graphic Asset
Sburb.createGraphicAsset = function(name, path) {
    // Actual image stuff
    var ret = new Image();
    ret.type = "graphic";
    ret.name = name;
    ret.originalVals = path; // Save for serialization
    // AJAX pre-load shenanigans
    // Load via AJAX, call success or failure
    // If success, set src attribute, call onload or onerror
    ret.success = function(url) {
        var ext = path.substring(path.indexOf(".")+1,path.length);
        var type = Sburb.assetManager.mimes[ext];
        ret.src = url;
        if(type == "image/gif") {
            Sburb.Bins["gif"].appendChild(ret);
        }
    };
    ret.failure = function() { ret.failed = true; };
    ret.onload = function() { ret.loaded = true; }
    ret.onerror = ret.failure;
    ret.assetOnLoadFunction = function(fn) {
        if(ret.loaded) {
            if(fn) { fn(); }
            return true;
        } else {
            ret.onload = function () {
                ret.loaded = true
                if(fn) { fn(); }
            }
            return false;
        }
    };
    ret.assetOnFailFunction = function(fn) {
        if(ret.failed) {
            if(fn) { fn(); }
            return true;
        } else {
            ret.failure = function() {
                if(!ret.failed && fn) { fn(); }
                ret.failed = true;
            }
            return false;
        }
    };
    ret.reload = function() {
        ret.loaded = false;
        ret.failed = false;
        Sburb.loadGenericAsset(ret, path);
    };
    ret.reload();
    return ret;
}

//create an audio Asset
Sburb.createAudioAsset = function(name,sources) {
    // Return a dummy object if no audio support
    if(!Modernizr.audio) {
        return {
            name: name,
            type: "audio",
            originalVals: sources,
            loaded: true,
            instant: true,
            paused: true,
            ended: true,
            currentTime: 0,
            duration: 0,
            load: function() {},
            play: function() {},
            loop: function() {},
            pause: function() {},
            addEventListener: function() {},
        };
    }
    var ret = new Audio();
    ret.name = name
    ret.type = "audio";
    ret.preload = true;
    ret.originalVals = sources;
    // Ajax Shenanigans
    // Load each source, call success or failure for each
    // On success, add as a source
    // When all sources are added add an event listener and timeout
    // If resource isn't loaded by the timeout, fail
    ret.failure = function() { ret.failed = true; };
    ret.isLoaded = function() { ret.loaded = true; };
    // Check multiple times to speed up loading where the event listener fails
    ret.checkLoaded = function() {
        if(!ret.loaded) {
            ret.check_count -= 1;
            if(ret.readyState == 4) {
                delete Sburb.assetManager.recurrences[name];
                ret.isLoaded();
            } else if(!ret.check_count) {
                delete Sburb.assetManager.recurrences[name];
                ret.failure();
            } else {
                Sburb.assetManager.recurrences[name] = setTimeout(ret.checkLoaded, ret.check_interval);
            }
        } else {
            delete Sburb.assetManager.recurrences[name];
        }
    };
    ret.assetOnLoadFunction = function(fn) {
        if(ret.loaded) {
            if(fn) { fn(); }
            return true;
        } else {
            ret.isLoaded = function () {
                ret.loaded = true
                if(fn) { fn(); }
            }
            return false;
        }
    };
    ret.assetOnFailFunction = function(fn) {
        if(ret.failed) {
            if(fn) { fn(); }
            return true;
        } else {
            ret.failure = function() {
                if(!ret.failed && fn) { fn(); }
                ret.failed = true;
            }
            return false;
        }
    };
    ret.success = function(url,id,notBlob) {
        var tmp = document.createElement("source");
        tmp.src = url;
        ret.appendChild(tmp);
        ret.remaining -= 1;
        if(!ret.remaining) {
	        if(window.chrome) ret.load();
            ret.addEventListener('loadeddata', ret.isLoaded, false);
	        if(!notBlob) {
                Sburb.assetManager.recurrences[name] = setTimeout(ret.checkLoaded, ret.check_interval);
            }
        }
    }
    ret.reload = function() {
        ret.remaining = 0; // How many sources we have left to load
        ret.check_interval = 800; // How long to wait between checks
        ret.check_count = 5; // How many checks to make
        ret.loaded = false;
        ret.failed = false;
        for (var a=0; a < sources.length; a++) {
            var ext = sources[a].substring(sources[a].indexOf(".")+1,sources[a].length);
            var type = Sburb.assetManager.mimes[ext];
            if(type == "audio/mpeg") {
                if(Modernizr.audio.mp3) {
                    ret.remaining++;
                    Sburb.loadGenericAsset(ret, sources[a]);
                }
            } else if(type == "audio/ogg") {
                if(Modernizr.audio.ogg) {
                    ret.remaining++;
                    Sburb.loadGenericAsset(ret, sources[a]);
                }
            } else {
                ret.remaining++;
                Sburb.loadGenericAsset(ret, sources[a]);
            }
        }
    };
    ret.reload();
    return ret;
}

//create a flash movie Asset
Sburb.createMovieAsset = function(name,path){
    var ret = {}; //src:Sburb.assetManager.resolvePath(path)};
    ret.name = name;
    ret.type = "movie";
    ret.originalVals = path;
    
    ret.done = function(url) {
        ret.src = url;
        Sburb.Bins["movie"].innerHTML += '<div id="'+name+'"><object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" id="movie" width="'+Sburb.Stage.width+'" height="'+Sburb.Stage.height+'"><param name="allowScriptAccess" value="always" /\><param name="wmode" value="transparent"/\><param name="movie" value="'+ret.src+'" /\><param name="quality" value="high" /\><embed src="'+ret.src+'" quality="high" WMODE="transparent" width="'+Sburb.Stage.width+'" height="'+Sburb.Stage.height+'" swLiveConnect="true" id="movie'+name+'" name="movie'+name+'" allowScriptAccess="always" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" /\></object></div>';
        document.getElementById(name).style.display = "none";
    }
    ret.success = function(url) { ret.done(url); ret.loaded = true; };
    ret.failure = function() { ret.failed = true; };
    ret.assetOnLoadFunction = function(fn) {
        if(ret.loaded) {
            if(fn) { fn(); }
            return true;
        } else {
            ret.success = function (url) {
                ret.done(url);
                ret.loaded = true
                if(fn) { fn(); }
            }
            return false;
        }
    };
    ret.assetOnFailFunction = function(fn) {
        if(ret.failed) {
            if(fn) { fn(); }
            return true;
        } else {
            ret.failure = function() {
                if(!ret.failed && fn) { fn(); }
                ret.failed = true;
            }
            return false;
        }
    };
    ret.reload = function() {
        ret.loaded = false;
        ret.failed = false;
        Sburb.loadGenericAsset(ret, path);
    };
    
    ret.reload();

    return ret;
}

//create a path asset
Sburb.createPathAsset = function(name, path) {
    var ret = path;
    ret.name = name;
    ret.type = "path";
    ret.instant = true;
    ret.assetOnLoadFunction = function(fn) {
        if(fn) { fn(); }
        return;
    }
    ret.assetOnFailFunction = function(fn) { return false; }
    return ret
}

//create a font
Sburb.createFontAsset = function(name, sources){
    var ret = {font:sources[0]};
    ret.name = name;
    ret.originalVals = sources;
    ret.type = "font";
    ret.done = function(url) { ret.loaded = true; };
    ret.failure = function() { ret.failed = true; };
    ret.success = function(url, id) {
        var font = "url('"+url+"') format('"+ret.sources[id]+"')";
        ret.sources[id] = font;
        ret.remaining -= 1;
        if(!ret.remaining) {
            Sburb.Bins["font"].innerHTML += '<style type="text/css">@font-face{ font-family: '+ret.name+'; src: '+ret.sources.join(',')+'; '+ret.extra+'}</style>';
            Sburb.stage.font="10px "+name;
            ret.done();
        }
    };
    ret.assetOnLoadFunction = function(fn) {
        if(ret.loaded) {
            if(fn) { fn(); }
            return true;
        } else {
            ret.done = function (url) {
                ret.loaded = true
                if(fn) { fn(); }
            }
            return false;
        }
    };
    ret.assetOnFailFunction = function(fn) {
        if(ret.failed) {
            if(fn) { fn(); }
            return true;
        } else {
            ret.failure = function() {
                if(!ret.failed && fn) { fn(); }
                ret.failed = true;
            }
            return false;
        }
    };
    ret.reload = function() {
        ret.loaded = false;
        ret.failed = false;
        var sourceList = sources.split(',');
        ret.remaining = 0
        ret.sources = [];
        ret.extra = "";
        for(var i=0;i<sourceList.length;i++){
            var values = sourceList[i].split(':');
            var type = values[0].trim();
            var path = values[1].trim();
            if(type == "url"){
                var extension = path.substring(path.indexOf(".")+1,path.length);
                var format = "";
                if(extension=="ttf"){
                    format = "truetype";
                }else if(extension=="woff"){
                    format = "woff";
                }else if(extension=="svg"){
                    format = "svg";
                }
                ret.remaining += 1;
                Sburb.loadGenericAsset(ret, path, ret.sources.length);
                ret.sources.push(format);
            }else if(type == "local"){
                ret.sources.push("local('"+path+"')");
            }else if(type == "weight"){
                ret.extra+= "font-weight:"+path+"; "
            }
        }
    };
    
    ret.reload();
    
    return ret
}

//create a text asset
Sburb.createTextAsset = function(name, text) {
    var ret = {text: unescape(text).trim()};
    ret.name = name;
    ret.type = "text";
    ret.instant = true;
    ret.assetOnLoadFunction = function(fn) {
        if(fn) { fn(); }
        return;
    }
    ret.assetOnFailFunction = function(fn) { return false; }
    return ret
}

return Sburb;
})(Sburb || {});
