/* Modernizr 2.6.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-fontface-canvas-canvastext-audio-localstorage-sessionstorage-teststyles-network_xhr2
 */
window.Modernizr = (function(window, document, undefined) {
    var version = '2.6.2',
    Modernizr = {},
    docElement = document.documentElement,
    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,
    inputElem,
    toString = {}.toString,
    omPrefixes = 'Webkit Moz O ms MS',
    cssomPrefixes = omPrefixes.split(' '),
    domPrefixes = omPrefixes.toLowerCase().split(' '),
    tests = {},
    inputs = {},
    attrs = {},
    classes = [],
    slice = classes.slice,
    featureName,
    injectElementWithStyles = function(rule, callback, nodes, testnames) {
      var style, ret, node, docOverflow,
          div = document.createElement('div'),
          body = document.body,
          fakeBody = body || document.createElement('body');
      if(parseInt(nodes, 10)) {
          while(nodes--) {
              node = document.createElement('div');
              node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
              div.appendChild(node);
          }
      }
      style = ['&#173;','<style id="s', mod, '">', rule, '</style>'].join('');
      div.id = mod;
      (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if(!body) {
          fakeBody.style.background = '';
          fakeBody.style.overflow = 'hidden';
          docOverflow = docElement.style.overflow;
          docElement.style.overflow = 'hidden';
          docElement.appendChild(fakeBody);
      }
      ret = callback(div, rule);
      if(!body) {
          fakeBody.parentNode.removeChild(fakeBody);
          docElement.style.overflow = docOverflow;
      } else {
          div.parentNode.removeChild(div);
      }
      return !!ret;
    },
    _hasOwnProperty = ({}).hasOwnProperty,
    hasOwnProp; // End of var declaration

    if (!is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined')) {
        hasOwnProp = function(object, property) {
            return _hasOwnProperty.call(object, property);
        };
    } else {
        hasOwnProp = function(object, property) { 
            return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
        };
    }
    if(!Function.prototype.bind) {
        Function.prototype.bind = function bind(that) {
            var target = this;
            if(typeof target != "function") {
                throw new TypeError();
            }
            var args = slice.call(arguments, 1),
                bound = function() {
                    if(this instanceof bound) {
                        var F = function(){};
                        F.prototype = target.prototype;
                        var self = new F();
                        var result = target.apply(self, args.concat(slice.call(arguments)));
                        if (Object(result) === result) {
                            return result;
                        }
                        return self;
                    } else {
                        return target.apply(that, args.concat(slice.call(arguments)));
                    }
                };
            return bound;
        };
    }
    function setCss(str) {
        mStyle.cssText = str;
    }
    function setCssAll(str1, str2) {
        return setCss(prefixes.join(str1 + ';') + (str2 || ''));
    }
    function is(obj, type) {
        return typeof obj === type;
    }
    function contains(str, substr) {
        return !!~('' + str).indexOf(substr);
    }
    function testProps(props, prefixed) {
        for(var i in props) {
            var prop = props[i];
            if(!contains(prop, "-") && mStyle[prop] !== undefined) {
                return prefixed == 'pfx' ? prop : true;
            }
        }
        return false;
    }
    function testDOMProps(props, obj, elem) {
        for(var i in props) {
            var item = obj[props[i]];
            if(item !== undefined) {
                if (elem === false) return props[i];
                if (is(item, 'function')){
                    return item.bind(elem || obj);
                }
                return item;
            }
        }
        return false;
    }
    function testPropsAll(prop, prefixed, elem) {
        var ucProp = prop.charAt(0).toUpperCase() + prop.slice(1),
            props = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');
        if(is(prefixed, "string") || is(prefixed, "undefined")) {
            return testProps(props, prefixed);
        } else {
            props = (prop + ' ' + (domPrefixes.concat(cssomPrefixes)).join(ucProp + ' ') + ucProp).split(' ');
            return testDOMProps(props, prefixed, elem);
        }
    }
    function prefixed(prop, obj, elem){
        if(!obj) {
            return testPropsAll(prop, 'pfx');
        } else {
            return testPropsAll(prop, obj, elem);
        }
    };
    // Official tests
    tests['canvas'] = function() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    };
    tests['canvastext'] = function() {
        return !!(Modernizr['canvas'] && is(document.createElement('canvas').getContext('2d').fillText, 'function'));
    };
    tests['fontface'] = function() {
        var bool;
        injectElementWithStyles('@font-face {font-family:"font";src:url("https://")}', function(node, rule) {
            var style = document.getElementById('smodernizr'),
                sheet = style.sheet || style.styleSheet,
                cssText = sheet ? (sheet.cssRules && sheet.cssRules[0] ? sheet.cssRules[0].cssText : sheet.cssText || '') : '';
                bool = /src/i.test(cssText) && cssText.indexOf(rule.split(' ')[0]) === 0;
        });
        return bool;
    };
    tests['audio'] = function() {
        var elem = document.createElement('audio'),
            bool = false;
        try {
            if(bool = !!elem.canPlayType) {
                bool = new Boolean(bool);
                bool.ogg = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,'');
                bool.mp3 = elem.canPlayType('audio/mpeg;').replace(/^no$/,'');
                bool.wav = elem.canPlayType('audio/wav; codecs="1"').replace(/^no$/,'');
                bool.m4a = (elem.canPlayType('audio/x-m4a;') || elem.canPlayType('audio/aac;')).replace(/^no$/,'');
            }
        } catch(e) { }
        return bool;
    };
    tests['localstorage'] = function() {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };
    tests['sessionstorage'] = function() {
        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };
    tests['xhr2'] = function() {
        return 'FormData' in window; // means onprogress should work, not that responseType = blob will
    };
    tests['json'] = function() {
        return !!window.JSON && !!JSON.parse;
    };
    tests['filereader'] = function() {
        return !!(window.File && window.FileList && window.FileReader);
    }
    // Extra tests
    tests['xmlserializer'] = function() {
        return 'XMLSerializer' in window;
    }
    tests['overridemimetype'] = function() {
        return !!((new XMLHttpRequest()).overrideMimeType);
    }
    tests['vbarray'] = function() {
        return 'VBArray' in window;
    }
    tests['blob'] = function () {
        var bool = false;
        try {
            if(bool = 'Blob' in window) { // This is probably the wrong test
                bool = new Boolean(bool);
                bool.slice = !!(prefixed("slice", Blob.prototype, false));
                bool.builder = !!(prefixed("BlobBuilder", window, false));
                bool.url = !!(prefixed("URL", window, false));
                try {
                    var URLCreator = window[prefixed("URL", window, false)];
                    var u = URLCreator.createObjectURL(new Blob([0,0]),{autoRevoke: false});
                    bool.revoke = true;
                    URLCreator.revokeObjectURL(u);
                } catch(e) {
                    bool.revoke = false;
                }
                try {
                    bool.creator = !!new Blob();
                } catch(e) {
                    bool.creator = false;
                }
            }
        } catch(e) {}
        return bool;
    };
    tests['arraybuffer'] = function() {
        var bool = false;
        try {
            if(bool = 'ArrayBuffer' in window) {
                bool = new Boolean(bool);
                bool.dataview = !!(prefixed("Uint8Array",window,false));
            }
        } catch(e) {}
        return bool;
    }
    // Parse tests
    for(var feature in tests) {
        if (hasOwnProp(tests, feature)) {
            featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();
            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }
    Modernizr.addTest = function (feature, test) {
        if(typeof feature == 'object') {
            for(var key in feature) {
                if(hasOwnProp(feature, key)) {
                    Modernizr.addTest(key, feature[key]);
                }
            }
        } else {
            feature = feature.toLowerCase();
            if(Modernizr[feature] !== undefined) {
                return Modernizr;
            }
            test = typeof test == 'function' ? test() : test;
            if(typeof enableClasses !== "undefined" && enableClasses) {
                docElement.className += ' ' + (test ? '' : 'no-') + feature;
            }
            Modernizr[feature] = test;
        }
        return Modernizr; 
    };
    setCss('');
    modElem = inputElem = null;
    Modernizr._version = version;
    Modernizr.testStyles = injectElementWithStyles;
    Modernizr._domPrefixes  = domPrefixes;
    Modernizr._cssomPrefixes  = cssomPrefixes;
    Modernizr.testProp = function(prop){ return testProps([prop]); };
    Modernizr.testAllProps = testPropsAll;
    Modernizr.prefixed = prefixed;
    return Modernizr;
})(this, this.document);

// Async tests
(function(){
    var datauri = new Image();
    datauri.onerror = function() { Modernizr.addTest('datauri', function () { return false; }); };  
    datauri.onload = function() { Modernizr.addTest('datauri', function () { return (datauri.width == 1 && datauri.height == 1); }); };
    datauri.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
})();

