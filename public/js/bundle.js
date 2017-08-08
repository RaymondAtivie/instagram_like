webpackJsonp([1],[
/* 0 */,
/* 1 */
/***/ (function(module, exports) {

/* globals __VUE_SSR_CONTEXT__ */

// this module is a runtime utility for cleaner component module output and will
// be included in the final webpack user bundle

module.exports = function normalizeComponent (
  rawScriptExports,
  compiledTemplate,
  injectStyles,
  scopeId,
  moduleIdentifier /* server only */
) {
  var esModule
  var scriptExports = rawScriptExports = rawScriptExports || {}

  // ES6 modules interop
  var type = typeof rawScriptExports.default
  if (type === 'object' || type === 'function') {
    esModule = rawScriptExports
    scriptExports = rawScriptExports.default
  }

  // Vue.extend constructor export interop
  var options = typeof scriptExports === 'function'
    ? scriptExports.options
    : scriptExports

  // render functions
  if (compiledTemplate) {
    options.render = compiledTemplate.render
    options.staticRenderFns = compiledTemplate.staticRenderFns
  }

  // scopedId
  if (scopeId) {
    options._scopeId = scopeId
  }

  var hook
  if (moduleIdentifier) { // server build
    hook = function (context) {
      // 2.3 injection
      context =
        context || // cached call
        (this.$vnode && this.$vnode.ssrContext) || // stateful
        (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext) // functional
      // 2.2 with runInNewContext: true
      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__
      }
      // inject component styles
      if (injectStyles) {
        injectStyles.call(this, context)
      }
      // register component module identifier for async chunk inferrence
      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier)
      }
    }
    // used by ssr in case component is cached and beforeCreate
    // never gets called
    options._ssrRegister = hook
  } else if (injectStyles) {
    hook = injectStyles
  }

  if (hook) {
    var functional = options.functional
    var existing = functional
      ? options.render
      : options.beforeCreate
    if (!functional) {
      // inject component registration as beforeCreate hook
      options.beforeCreate = existing
        ? [].concat(existing, hook)
        : [hook]
    } else {
      // register for functioal component in vue file
      options.render = function renderWithStyleInjection (h, context) {
        hook.call(context)
        return existing(h, context)
      }
    }
  }

  return {
    esModule: esModule,
    exports: scriptExports,
    options: options
  }
}


/***/ }),
/* 2 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
  Modified by Evan You @yyx990803
*/

var hasDocument = typeof document !== 'undefined'

if (typeof DEBUG !== 'undefined' && DEBUG) {
  if (!hasDocument) {
    throw new Error(
    'vue-style-loader cannot be used in a non-browser environment. ' +
    "Use { target: 'node' } in your Webpack config to indicate a server-rendering environment."
  ) }
}

var listToStyles = __webpack_require__(174)

/*
type StyleObject = {
  id: number;
  parts: Array<StyleObjectPart>
}

type StyleObjectPart = {
  css: string;
  media: string;
  sourceMap: ?string
}
*/

var stylesInDom = {/*
  [id: number]: {
    id: number,
    refs: number,
    parts: Array<(obj?: StyleObjectPart) => void>
  }
*/}

var head = hasDocument && (document.head || document.getElementsByTagName('head')[0])
var singletonElement = null
var singletonCounter = 0
var isProduction = false
var noop = function () {}

// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
// tags it will allow on a page
var isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\b/.test(navigator.userAgent.toLowerCase())

module.exports = function (parentId, list, _isProduction) {
  isProduction = _isProduction

  var styles = listToStyles(parentId, list)
  addStylesToDom(styles)

  return function update (newList) {
    var mayRemove = []
    for (var i = 0; i < styles.length; i++) {
      var item = styles[i]
      var domStyle = stylesInDom[item.id]
      domStyle.refs--
      mayRemove.push(domStyle)
    }
    if (newList) {
      styles = listToStyles(parentId, newList)
      addStylesToDom(styles)
    } else {
      styles = []
    }
    for (var i = 0; i < mayRemove.length; i++) {
      var domStyle = mayRemove[i]
      if (domStyle.refs === 0) {
        for (var j = 0; j < domStyle.parts.length; j++) {
          domStyle.parts[j]()
        }
        delete stylesInDom[domStyle.id]
      }
    }
  }
}

function addStylesToDom (styles /* Array<StyleObject> */) {
  for (var i = 0; i < styles.length; i++) {
    var item = styles[i]
    var domStyle = stylesInDom[item.id]
    if (domStyle) {
      domStyle.refs++
      for (var j = 0; j < domStyle.parts.length; j++) {
        domStyle.parts[j](item.parts[j])
      }
      for (; j < item.parts.length; j++) {
        domStyle.parts.push(addStyle(item.parts[j]))
      }
      if (domStyle.parts.length > item.parts.length) {
        domStyle.parts.length = item.parts.length
      }
    } else {
      var parts = []
      for (var j = 0; j < item.parts.length; j++) {
        parts.push(addStyle(item.parts[j]))
      }
      stylesInDom[item.id] = { id: item.id, refs: 1, parts: parts }
    }
  }
}

function createStyleElement () {
  var styleElement = document.createElement('style')
  styleElement.type = 'text/css'
  head.appendChild(styleElement)
  return styleElement
}

function addStyle (obj /* StyleObjectPart */) {
  var update, remove
  var styleElement = document.querySelector('style[data-vue-ssr-id~="' + obj.id + '"]')

  if (styleElement) {
    if (isProduction) {
      // has SSR styles and in production mode.
      // simply do nothing.
      return noop
    } else {
      // has SSR styles but in dev mode.
      // for some reason Chrome can't handle source map in server-rendered
      // style tags - source maps in <style> only works if the style tag is
      // created and inserted dynamically. So we remove the server rendered
      // styles and inject new ones.
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  if (isOldIE) {
    // use singleton mode for IE9.
    var styleIndex = singletonCounter++
    styleElement = singletonElement || (singletonElement = createStyleElement())
    update = applyToSingletonTag.bind(null, styleElement, styleIndex, false)
    remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true)
  } else {
    // use multi-style-tag mode in all other cases
    styleElement = createStyleElement()
    update = applyToTag.bind(null, styleElement)
    remove = function () {
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  update(obj)

  return function updateStyle (newObj /* StyleObjectPart */) {
    if (newObj) {
      if (newObj.css === obj.css &&
          newObj.media === obj.media &&
          newObj.sourceMap === obj.sourceMap) {
        return
      }
      update(obj = newObj)
    } else {
      remove()
    }
  }
}

var replaceText = (function () {
  var textStore = []

  return function (index, replacement) {
    textStore[index] = replacement
    return textStore.filter(Boolean).join('\n')
  }
})()

function applyToSingletonTag (styleElement, index, remove, obj) {
  var css = remove ? '' : obj.css

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = replaceText(index, css)
  } else {
    var cssNode = document.createTextNode(css)
    var childNodes = styleElement.childNodes
    if (childNodes[index]) styleElement.removeChild(childNodes[index])
    if (childNodes.length) {
      styleElement.insertBefore(cssNode, childNodes[index])
    } else {
      styleElement.appendChild(cssNode)
    }
  }
}

function applyToTag (styleElement, obj) {
  var css = obj.css
  var media = obj.media
  var sourceMap = obj.sourceMap

  if (media) {
    styleElement.setAttribute('media', media)
  }

  if (sourceMap) {
    // https://developer.chrome.com/devtools/docs/javascript-debugging
    // this makes source maps inside style tags work properly in Chrome
    css += '\n/*# sourceURL=' + sourceMap.sources[0] + ' */'
    // http://stackoverflow.com/a/26603875
    css += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + ' */'
  }

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild)
    }
    styleElement.appendChild(document.createTextNode(css))
  }
}


/***/ }),
/* 4 */,
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__modules_auth_authTypes__ = __webpack_require__(138);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__modules_snackbar_snackbarTypes__ = __webpack_require__(139);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__modules_post_postTypes__ = __webpack_require__(140);
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };





var t = {
    START_LOADING: "START_LOADING",
    STOP_LOADING: "STOP_LOADING",

    // getters
    IS_LOADING: "IS_LOADING",
    IS_FULL_LOADING: "IS_FULL_LOADING"
};

/* harmony default export */ __webpack_exports__["a"] = (_extends({
    auth: __WEBPACK_IMPORTED_MODULE_0__modules_auth_authTypes__,
    snackbar: __WEBPACK_IMPORTED_MODULE_1__modules_snackbar_snackbarTypes__,
    post: __WEBPACK_IMPORTED_MODULE_2__modules_post_postTypes__
}, t));

/***/ }),
/* 6 */,
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vue__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_vuex__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__store_modules_auth_authStore__ = __webpack_require__(167);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__store_modules_snackbar_snackbarStore__ = __webpack_require__(168);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__store_modules_post_postStore__ = __webpack_require__(169);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__types__ = __webpack_require__(5);
var _modules, _mutations, _getters;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }










__WEBPACK_IMPORTED_MODULE_0_vue__["default"].use(__WEBPACK_IMPORTED_MODULE_1_vuex__["default"]);

/* harmony default export */ __webpack_exports__["a"] = (new __WEBPACK_IMPORTED_MODULE_1_vuex__["default"].Store({
    // strict: true,
    modules: (_modules = {}, _defineProperty(_modules, __WEBPACK_IMPORTED_MODULE_2__store_modules_auth_authStore__["a" /* default */].NAME, _extends({
        namespaced: true
    }, __WEBPACK_IMPORTED_MODULE_2__store_modules_auth_authStore__["a" /* default */])), _defineProperty(_modules, __WEBPACK_IMPORTED_MODULE_3__store_modules_snackbar_snackbarStore__["a" /* default */].NAME, _extends({
        namespaced: true
    }, __WEBPACK_IMPORTED_MODULE_3__store_modules_snackbar_snackbarStore__["a" /* default */])), _defineProperty(_modules, __WEBPACK_IMPORTED_MODULE_4__store_modules_post_postStore__["a" /* default */].NAME, _extends({
        namespaced: true
    }, __WEBPACK_IMPORTED_MODULE_4__store_modules_post_postStore__["a" /* default */])), _modules),
    state: {
        isLoading: false,
        isFullLoading: false
    },
    mutations: (_mutations = {}, _defineProperty(_mutations, __WEBPACK_IMPORTED_MODULE_5__types__["a" /* default */].START_LOADING, function (state, payload) {
        if (payload == 'full') {
            state.isFullLoading = true;
        } else {
            state.isLoading = true;
        }
    }), _defineProperty(_mutations, __WEBPACK_IMPORTED_MODULE_5__types__["a" /* default */].STOP_LOADING, function (state) {
        state.isLoading = false;
        state.isFullLoading = false;
    }), _mutations),
    getters: (_getters = {}, _defineProperty(_getters, __WEBPACK_IMPORTED_MODULE_5__types__["a" /* default */].IS_LOADING, function (state) {
        return state.isLoading;
    }), _defineProperty(_getters, __WEBPACK_IMPORTED_MODULE_5__types__["a" /* default */].IS_FULL_LOADING, function (state) {
        return state.isFullLoading;
    }), _getters)
}));

/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__store_store__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__store_types__ = __webpack_require__(5);
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }




var Snackbar = function () {
    function Snackbar() {
        _classCallCheck(this, Snackbar);

        this.config = null;
    }

    _createClass(Snackbar, [{
        key: '_setup',
        value: function _setup(message, time, label, position, close, callback, callback_label) {
            var config = {
                text: message,
                position: {}
            };
            config.time = time || null;
            config.label = label || null;
            config.close = close;
            config.callback = callback || null;
            config.callback_label = callback_label || null;

            if (position.includes('top')) {
                config.position.y = 'top';
            } else if (position.includes('bottom')) {
                config.position.y = 'bottom';
            }

            if (position.includes('right')) {
                config.position.x = 'right';
            } else if (position.includes('left')) {
                config.position.x = 'left';
            }

            return config;
        }
    }, {
        key: 'fire',
        value: function fire(message) {
            var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
            var time = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
            var position = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'top';
            var close = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
            var callback = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
            var callback_label = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : null;

            position = position || 'top';

            this.config = this._setup(message, time, label, position, close, callback, callback_label);
            this.show();
        }
    }, {
        key: 'show',
        value: function show() {
            var _this = this;

            __WEBPACK_IMPORTED_MODULE_0__store_store__["a" /* default */].commit(__WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].snackbar.NAME + '/' + __WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].snackbar.CLEAR_SNACKBAR);
            setTimeout(function () {

                __WEBPACK_IMPORTED_MODULE_0__store_store__["a" /* default */].commit(__WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].snackbar.NAME + '/' + __WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].snackbar.LOAD_SNACKBAR, _this.config);
            }, 500);
        }
    }]);

    return Snackbar;
}();

/* harmony default export */ __webpack_exports__["a"] = (new Snackbar());

/***/ }),
/* 9 */,
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__store_store__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__store_types__ = __webpack_require__(5);
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }




var Loader = function () {
    function Loader() {
        _classCallCheck(this, Loader);
    }

    _createClass(Loader, [{
        key: 'start',
        value: function start() {
            var full = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            __WEBPACK_IMPORTED_MODULE_0__store_store__["a" /* default */].commit(__WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].START_LOADING, full);
        }
    }, {
        key: 'stop',
        value: function stop() {
            __WEBPACK_IMPORTED_MODULE_0__store_store__["a" /* default */].commit(__WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].STOP_LOADING);
        }
    }]);

    return Loader;
}();

/* harmony default export */ __webpack_exports__["a"] = (new Loader());

/***/ }),
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */,
/* 21 */,
/* 22 */,
/* 23 */,
/* 24 */,
/* 25 */,
/* 26 */,
/* 27 */,
/* 28 */,
/* 29 */,
/* 30 */,
/* 31 */,
/* 32 */,
/* 33 */,
/* 34 */,
/* 35 */,
/* 36 */,
/* 37 */,
/* 38 */,
/* 39 */,
/* 40 */,
/* 41 */,
/* 42 */,
/* 43 */,
/* 44 */,
/* 45 */,
/* 46 */,
/* 47 */,
/* 48 */,
/* 49 */,
/* 50 */,
/* 51 */,
/* 52 */,
/* 53 */,
/* 54 */,
/* 55 */,
/* 56 */,
/* 57 */,
/* 58 */,
/* 59 */,
/* 60 */,
/* 61 */,
/* 62 */,
/* 63 */,
/* 64 */,
/* 65 */,
/* 66 */,
/* 67 */,
/* 68 */,
/* 69 */,
/* 70 */,
/* 71 */,
/* 72 */,
/* 73 */,
/* 74 */,
/* 75 */,
/* 76 */,
/* 77 */,
/* 78 */,
/* 79 */,
/* 80 */,
/* 81 */,
/* 82 */,
/* 83 */,
/* 84 */,
/* 85 */,
/* 86 */,
/* 87 */,
/* 88 */,
/* 89 */,
/* 90 */,
/* 91 */,
/* 92 */,
/* 93 */,
/* 94 */,
/* 95 */,
/* 96 */,
/* 97 */,
/* 98 */,
/* 99 */,
/* 100 */,
/* 101 */,
/* 102 */,
/* 103 */,
/* 104 */,
/* 105 */,
/* 106 */,
/* 107 */,
/* 108 */,
/* 109 */,
/* 110 */,
/* 111 */,
/* 112 */,
/* 113 */,
/* 114 */,
/* 115 */,
/* 116 */,
/* 117 */,
/* 118 */,
/* 119 */,
/* 120 */,
/* 121 */,
/* 122 */,
/* 123 */,
/* 124 */,
/* 125 */,
/* 126 */,
/* 127 */,
/* 128 */,
/* 129 */,
/* 130 */,
/* 131 */,
/* 132 */,
/* 133 */,
/* 134 */,
/* 135 */,
/* 136 */,
/* 137 */,
/* 138 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "NAME", function() { return NAME; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "USER_LOGIN", function() { return USER_LOGIN; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "USER_LOGOUT", function() { return USER_LOGOUT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GET_USER", function() { return GET_USER; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "IS_LOGGED_IN", function() { return IS_LOGGED_IN; });
var NAME = 'AUTH';

var USER_LOGIN = 'USER_LOGIN';
var USER_LOGOUT = 'USER_LOGOUT';

var GET_USER = 'GET_USER';
var IS_LOGGED_IN = 'IS_LOGGED_IN';

/***/ }),
/* 139 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "NAME", function() { return NAME; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GET_MESSAGE", function() { return GET_MESSAGE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GET_MESSAGE_VISIBILITY", function() { return GET_MESSAGE_VISIBILITY; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LOAD_SNACKBAR", function() { return LOAD_SNACKBAR; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CLEAR_SNACKBAR", function() { return CLEAR_SNACKBAR; });
var NAME = 'SNACKBAR';

//GETTERS
var GET_MESSAGE = 'GET_MESSAGE';
var GET_MESSAGE_VISIBILITY = 'GET_MESSAGE_VISIBILITY';

var LOAD_SNACKBAR = 'LOAD_SNACKBAR';
var CLEAR_SNACKBAR = 'CLEAR_SNACKBAR';

/***/ }),
/* 140 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "NAME", function() { return NAME; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ADD_NEW_POST", function() { return ADD_NEW_POST; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "REPLACE_POSTS", function() { return REPLACE_POSTS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GET_POSTS", function() { return GET_POSTS; });
var NAME = 'POST';

var ADD_NEW_POST = 'ADD_NEW_POST';
var REPLACE_POSTS = 'REPLACE_POSTS';

var GET_POSTS = 'GET_POSTS';

/***/ }),
/* 141 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(172)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(175),
  /* template */
  __webpack_require__(191),
  /* styles */
  injectStyle,
  /* scopeId */
  "data-v-9c95e3e2",
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/App.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] App.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-9c95e3e2", Component.options)
  } else {
    hotAPI.reload("data-v-9c95e3e2", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 142 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__index__ = __webpack_require__(143);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__helpers_snackbar__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__helpers_loader__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__store_store__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__store_types__ = __webpack_require__(5);
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }







var Post = function () {
    function Post() {
        _classCallCheck(this, Post);

        this.model = 'posts';
        this.posts = [];
        // this.last_fetch = moment();
    }

    _createClass(Post, [{
        key: 'getAll',
        value: function getAll() {
            var _this = this;

            return new Promise(function (resolve, reject) {
                __WEBPACK_IMPORTED_MODULE_2__helpers_loader__["a" /* default */].start();
                __WEBPACK_IMPORTED_MODULE_0__index__["a" /* default */].get(_this.model).then(function (data) {
                    console.log(data);
                    _this.posts = data;
                    __WEBPACK_IMPORTED_MODULE_3__store_store__["a" /* default */].commit(__WEBPACK_IMPORTED_MODULE_4__store_types__["a" /* default */].post.NAME + '/' + __WEBPACK_IMPORTED_MODULE_4__store_types__["a" /* default */].post.REPLACE_POSTS, data);
                    resolve(data);
                    __WEBPACK_IMPORTED_MODULE_2__helpers_loader__["a" /* default */].stop();
                }).catch(function (error) {
                    __WEBPACK_IMPORTED_MODULE_1__helpers_snackbar__["a" /* default */].fire("Something went wrong", 'error');
                    __WEBPACK_IMPORTED_MODULE_2__helpers_loader__["a" /* default */].stop();
                    reject(error);
                });
            });
        }
    }, {
        key: 'addPost',
        value: function addPost(post) {
            var _this2 = this;

            var sendP = {
                user_id: 1,
                text: post.text,
                report: post.report
            };
            if (post.media) {
                sendP.media = post.media.link;
            }

            return new Promise(function (resolve, reject) {
                __WEBPACK_IMPORTED_MODULE_2__helpers_loader__["a" /* default */].start();
                __WEBPACK_IMPORTED_MODULE_0__index__["a" /* default */].post(_this2.model, sendP).then(function (newPost) {
                    __WEBPACK_IMPORTED_MODULE_3__store_store__["a" /* default */].commit(__WEBPACK_IMPORTED_MODULE_4__store_types__["a" /* default */].post.NAME + '/' + __WEBPACK_IMPORTED_MODULE_4__store_types__["a" /* default */].post.ADD_NEW_POST, newPost);
                    __WEBPACK_IMPORTED_MODULE_2__helpers_loader__["a" /* default */].stop();
                    resolve(newPost);
                }).catch(function (error) {
                    __WEBPACK_IMPORTED_MODULE_1__helpers_snackbar__["a" /* default */].fire("Something went wrong", 'error');
                    __WEBPACK_IMPORTED_MODULE_2__helpers_loader__["a" /* default */].stop();
                    reject(error);
                });
            });
        }
    }]);

    return Post;
}();

/* harmony default export */ __webpack_exports__["a"] = (new Post());

/***/ }),
/* 143 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Api = function () {
    function Api() {
        _classCallCheck(this, Api);
    }

    _createClass(Api, [{
        key: "get",
        value: function get(url) {
            return new Promise(function (resolve, reject) {
                axios.get(url).then(function (_ref) {
                    var data = _ref.data;

                    resolve(data);
                }).catch(function (_ref2) {
                    var response = _ref2.response;

                    reject(response);
                });
            });
        }
    }, {
        key: "post",
        value: function post(url, data) {
            return new Promise(function (resolve, reject) {
                axios.post(url, data).then(function (_ref3) {
                    var data = _ref3.data;

                    resolve(data);
                }).catch(function (error) {
                    if (error.response) {
                        reject(error.response);
                    } else if (error.request) {
                        reject(error.response);
                    } else {
                        reject(error.message);
                    }
                });
            });
        }
    }]);

    return Api;
}();

/* harmony default export */ __webpack_exports__["a"] = (new Api());

/***/ }),
/* 144 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(145);
__webpack_require__(281);
__webpack_require__(282);
module.exports = __webpack_require__(283);


/***/ }),
/* 145 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vue__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_vuex__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_vue_router__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_vuetify__ = __webpack_require__(137);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_vuetify___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_vuetify__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__store_store__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__router_router__ = __webpack_require__(170);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__App_vue__ = __webpack_require__(141);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__App_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_6__App_vue__);
__webpack_require__(146);






__WEBPACK_IMPORTED_MODULE_0_vue__["default"].use(__WEBPACK_IMPORTED_MODULE_3_vuetify___default.a);





var app = new __WEBPACK_IMPORTED_MODULE_0_vue__["default"]({
    el: '#app',
    render: function render(h) {
        return h(__WEBPACK_IMPORTED_MODULE_6__App_vue___default.a);
    },
    router: __WEBPACK_IMPORTED_MODULE_5__router_router__["a" /* default */],
    store: __WEBPACK_IMPORTED_MODULE_4__store_store__["a" /* default */]
});

/***/ }),
/* 146 */
/***/ (function(module, exports, __webpack_require__) {

window._ = __webpack_require__(13);

window.moment = __webpack_require__(0);

window.axios = __webpack_require__(131);
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.baseURL = 'http://localhost:8000/api';

var token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

//Load my base styles []
// require('./../sass/app.scss');

/**
 * Echo exposes an expressive API for subscribing to channels and listening
 * for events that are broadcast by Laravel. Echo and event broadcasting
 * allows your team to easily build robust real-time web applications.
 */

// import Echo from 'laravel-echo'

// window.Pusher = require('pusher-js');

// window.Echo = new Echo({
//     broadcaster: 'pusher',
//     key: 'your-pusher-key'
// });

/***/ }),
/* 147 */,
/* 148 */,
/* 149 */,
/* 150 */,
/* 151 */,
/* 152 */,
/* 153 */,
/* 154 */,
/* 155 */,
/* 156 */,
/* 157 */,
/* 158 */,
/* 159 */,
/* 160 */,
/* 161 */,
/* 162 */,
/* 163 */,
/* 164 */,
/* 165 */,
/* 166 */,
/* 167 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__authTypes__ = __webpack_require__(138);
var _mutations, _actions, _getters;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


var NAME = __WEBPACK_IMPORTED_MODULE_0__authTypes__["NAME"];

var state = {
    user: {},
    isLoggedIn: false
};

var mutations = (_mutations = {}, _defineProperty(_mutations, __WEBPACK_IMPORTED_MODULE_0__authTypes__["USER_LOGIN"], function (state, user) {
    if (user) {
        state.user = user;
    }
    state.isLoggedIn = true;
}), _defineProperty(_mutations, __WEBPACK_IMPORTED_MODULE_0__authTypes__["USER_LOGOUT"], function (state) {
    state.user = {};
    state.isLoggedIn = false;
}), _mutations);

var actions = (_actions = {}, _defineProperty(_actions, __WEBPACK_IMPORTED_MODULE_0__authTypes__["USER_LOGIN"], function (_ref, user) {
    var commit = _ref.commit;

    user ? user : {};
    commit(__WEBPACK_IMPORTED_MODULE_0__authTypes__["USER_LOGIN"], user);
}), _defineProperty(_actions, __WEBPACK_IMPORTED_MODULE_0__authTypes__["USER_LOGOUT"], function (_ref2) {
    var commit = _ref2.commit;

    commit(__WEBPACK_IMPORTED_MODULE_0__authTypes__["USER_LOGOUT"]);
}), _actions);

var getters = (_getters = {}, _defineProperty(_getters, __WEBPACK_IMPORTED_MODULE_0__authTypes__["GET_USER"], function (state) {
    return state.user;
}), _defineProperty(_getters, __WEBPACK_IMPORTED_MODULE_0__authTypes__["IS_LOGGED_IN"], function (state) {
    return state.isLoggedIn;
}), _getters);

/* harmony default export */ __webpack_exports__["a"] = ({
    state: state,
    mutations: mutations,
    actions: actions,
    getters: getters,
    NAME: NAME
});

/***/ }),
/* 168 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__snackbarTypes__ = __webpack_require__(139);
var _mutations, _getters;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


var NAME = __WEBPACK_IMPORTED_MODULE_0__snackbarTypes__["NAME"];

var state = {
    message: {
        text: '',
        show: false,
        position: {
            y: 'top',
            x: false
        },
        label: false,
        time: 6000,
        callback: false,
        callback_label: 'CLOSE',
        close: true
    }
};

var mutations = (_mutations = {}, _defineProperty(_mutations, __WEBPACK_IMPORTED_MODULE_0__snackbarTypes__["LOAD_SNACKBAR"], function (state, payload) {
    state.message.show = true;
    state.message.text = payload.text;

    if (payload.label) state.message.label = payload.label;

    if (payload.position.y) state.message.position.y = payload.position.y;

    if (payload.position.x) state.message.position.x = payload.position.x;

    if (payload.time) state.message.time = payload.time;

    if (payload.callback) state.message.callback = payload.callback;

    if (payload.callback_label) state.message.callback_label = payload.callback_label;

    if (payload.hasOwnProperty('close')) {
        if (payload.close !== null) {
            state.message.close = payload.close;
        }
    }
}), _defineProperty(_mutations, __WEBPACK_IMPORTED_MODULE_0__snackbarTypes__["CLEAR_SNACKBAR"], function (state) {
    state.message.show = false;
    state.message.text = '';
    state.message.label = false;
    state.message.time = 6000;
    state.message.callback = false;
    state.message.callback_label = 'CLOSE';
    state.message.close = true;
    setTimeout(function () {
        state.message.position.y = 'top';
        state.message.position.x = false;
    }, 500);
}), _mutations);

var actions = {};

var getters = (_getters = {}, _defineProperty(_getters, __WEBPACK_IMPORTED_MODULE_0__snackbarTypes__["GET_MESSAGE"], function (state) {
    return state.message;
}), _defineProperty(_getters, __WEBPACK_IMPORTED_MODULE_0__snackbarTypes__["GET_MESSAGE_VISIBILITY"], function (state) {
    return state.message.show;
}), _getters);

/* harmony default export */ __webpack_exports__["a"] = ({
    state: state,
    mutations: mutations,
    actions: actions,
    getters: getters,
    NAME: NAME
});

/***/ }),
/* 169 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__postTypes__ = __webpack_require__(140);
var _mutations;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


var NAME = __WEBPACK_IMPORTED_MODULE_0__postTypes__["NAME"];

var state = {
    posts: []
};

var mutations = (_mutations = {}, _defineProperty(_mutations, __WEBPACK_IMPORTED_MODULE_0__postTypes__["ADD_NEW_POST"], function (state, post) {
    state.posts.unshift(post);
}), _defineProperty(_mutations, __WEBPACK_IMPORTED_MODULE_0__postTypes__["REPLACE_POSTS"], function (state, posts) {
    state.posts = posts;
}), _mutations);

var actions = {
    // [types.USER_LOGIN]: ({ commit }, user) => {
    //     user ? user : {};
    //     commit(types.USER_LOGIN, user);
    // },
    // [types.USER_LOGOUT]: ({ commit }) => {
    //     commit(types.USER_LOGIN);
    // }
};

var getters = _defineProperty({}, __WEBPACK_IMPORTED_MODULE_0__postTypes__["GET_POSTS"], function (state) {
    return state.posts;
});

/* harmony default export */ __webpack_exports__["a"] = ({
    state: state,
    mutations: mutations,
    actions: actions,
    getters: getters,
    NAME: NAME
});

/***/ }),
/* 170 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vue__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_vue_router__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__routes__ = __webpack_require__(171);




__WEBPACK_IMPORTED_MODULE_0_vue__["default"].use(__WEBPACK_IMPORTED_MODULE_1_vue_router__["default"]);

var router = new __WEBPACK_IMPORTED_MODULE_1_vue_router__["default"]({
    mode: 'history',
    routes: __WEBPACK_IMPORTED_MODULE_2__routes__["a" /* default */]
});

router.beforeEach(function (to, from, next) {
    next();
});

/* harmony default export */ __webpack_exports__["a"] = (router);

/***/ }),
/* 171 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__App_vue__ = __webpack_require__(141);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__App_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__App_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__pages_indexPage_vue__ = __webpack_require__(192);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__pages_indexPage_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__pages_indexPage_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__pages_auth_authPage_vue__ = __webpack_require__(197);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__pages_auth_authPage_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__pages_auth_authPage_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__pages_dashboard_dashboardPage_vue__ = __webpack_require__(202);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__pages_dashboard_dashboardPage_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__pages_dashboard_dashboardPage_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__store_store__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__helpers_snackbar__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__helpers_loader__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__dashboardRoutes__ = __webpack_require__(222);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__authRoutes__ = __webpack_require__(269);












/* harmony default export */ __webpack_exports__["a"] = ([{
    path: '/',
    name: 'index',
    component: __WEBPACK_IMPORTED_MODULE_1__pages_indexPage_vue___default.a
}, {
    path: '/auth',
    component: __WEBPACK_IMPORTED_MODULE_2__pages_auth_authPage_vue___default.a,
    children: __WEBPACK_IMPORTED_MODULE_8__authRoutes__["a" /* default */],
    beforeEnter: function beforeEnter(to, from, next) {
        next();
    }
}, {
    path: '/dash',
    component: __WEBPACK_IMPORTED_MODULE_3__pages_dashboard_dashboardPage_vue___default.a,
    children: __WEBPACK_IMPORTED_MODULE_7__dashboardRoutes__["a" /* default */],
    beforeEnter: function beforeEnter(to, from, next) {
        __WEBPACK_IMPORTED_MODULE_6__helpers_loader__["a" /* default */].start('full');

        setTimeout(function () {
            if (!__WEBPACK_IMPORTED_MODULE_4__store_store__["a" /* default */].getters['auth/isLoggedIn']) {
                // sb.fire('Hello world this is me', 2000);

                next();
                // next({ name: 'auth.login' });
            } else {
                next();
            }
            __WEBPACK_IMPORTED_MODULE_6__helpers_loader__["a" /* default */].stop();
        }, 1000);
        // next();
    }
}]);

/***/ }),
/* 172 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(173);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("b3f11a4e", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../node_modules/css-loader/index.js?sourceMap!../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-9c95e3e2\",\"scoped\":true,\"hasInlineConfig\":true}!../../../node_modules/stylus-loader/index.js!../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./App.vue", function() {
     var newContent = require("!!../../../node_modules/css-loader/index.js?sourceMap!../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-9c95e3e2\",\"scoped\":true,\"hasInlineConfig\":true}!../../../node_modules/stylus-loader/index.js!../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./App.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 173 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n.swipe-enter[data-v-9c95e3e2] {\n  opacity: 0;\n}\n.swipe-enter-active[data-v-9c95e3e2] {\n  animation: moveFromBottom-data-v-9c95e3e2 0.2s forwards;\n  transition: 0.3s all ease;\n}\n.swipe-leave-active[data-v-9c95e3e2] {\n  animation: scaleDown-data-v-9c95e3e2 0.2s forwards;\n  transition: 0.2s all ease;\n}\n@-moz-keyframes scaleDown {\nto {\n    opacity: 0;\n    transform: scale(0.8);\n}\n}\n@-webkit-keyframes scaleDown {\nto {\n    opacity: 0;\n    transform: scale(0.8);\n}\n}\n@-o-keyframes scaleDown {\nto {\n    opacity: 0;\n    transform: scale(0.8);\n}\n}\n@keyframes scaleDown-data-v-9c95e3e2 {\nto {\n    opacity: 0;\n    transform: scale(0.8);\n}\n}\n@-moz-keyframes scaleIn {\nfrom {\n    opacity: 0;\n    transform: scale(1.2);\n}\n}\n@-webkit-keyframes scaleIn {\nfrom {\n    opacity: 0;\n    transform: scale(1.2);\n}\n}\n@-o-keyframes scaleIn {\nfrom {\n    opacity: 0;\n    transform: scale(1.2);\n}\n}\n@keyframes scaleIn-data-v-9c95e3e2 {\nfrom {\n    opacity: 0;\n    transform: scale(1.2);\n}\n}\n@-moz-keyframes moveFromBottom {\nfrom {\n    transform: translateY(50%);\n}\n}\n@-webkit-keyframes moveFromBottom {\nfrom {\n    transform: translateY(50%);\n}\n}\n@-o-keyframes moveFromBottom {\nfrom {\n    transform: translateY(50%);\n}\n}\n@keyframes moveFromBottom-data-v-9c95e3e2 {\nfrom {\n    transform: translateY(50%);\n}\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/resources/assets/js/App.vue","/Applications/vue/kelly/resources/assets/js/App.vue"],"names":[],"mappings":";AA2BA;EACI,WAAA;CC1BH;AD6BD;EACI,wDAAA;EACA,0BAAA;CC3BH;ADiCD;EACI,mDAAA;EAEA,0BAAA;CChCH;ADmCmB;AAEnB;IAAK,WAAA;IAAY,sBAAA;CChCf;CACF;AD6BmB;AAEnB;IAAK,WAAA;IAAY,sBAAA;CC1Bf;CACF;ADuBmB;AAEnB;IAAK,WAAA;IAAY,sBAAA;CCpBf;CACF;ADiBmB;AAEnB;IAAK,WAAA;IAAY,sBAAA;CCdf;CACF;ADeiB;AACjB;IAAM,WAAA;IAAY,sBAAA;CCXhB;CACF;ADSiB;AACjB;IAAM,WAAA;IAAY,sBAAA;CCLhB;CACF;ADGiB;AACjB;IAAM,WAAA;IAAY,sBAAA;CCChB;CACF;ADHiB;AACjB;IAAM,WAAA;IAAY,sBAAA;CCOhB;CACF;ADLwB;AACxB;IAAO,2BAAA;CCQL;CACF;ADVwB;AACxB;IAAO,2BAAA;CCaL;CACF;ADfwB;AACxB;IAAO,2BAAA;CCkBL;CACF;ADpBwB;AACxB;IAAO,2BAAA;CCuBL;CACF","file":"App.vue","sourcesContent":["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n.swipe-enter {\n    opacity: 0;\n}\n\n.swipe-enter-active {\n    animation: moveFromBottom .2s forwards; \n    transition .3s all ease;\n}\n\n.fade-leave {\n}\n\n.swipe-leave-active {\n    animation: scaleDown .2s forwards;\n    // opacity: 0;\n    transition .2s all ease;    \n}\n\n@keyframes scaleDown {\n\tfrom { }\n\tto { opacity: 0; transform: scale(.8); }\n}\n@keyframes scaleIn {\n\tfrom {opacity: 0; transform: scale(1.2); }\n\tto {  }\n}\n@keyframes moveFromBottom {\n\tfrom { transform: translateY(50%); }\n}\n",".swipe-enter {\n  opacity: 0;\n}\n.swipe-enter-active {\n  animation: moveFromBottom 0.2s forwards;\n  transition: 0.3s all ease;\n}\n.swipe-leave-active {\n  animation: scaleDown 0.2s forwards;\n  transition: 0.2s all ease;\n}\n@-moz-keyframes scaleDown {\n  to {\n    opacity: 0;\n    transform: scale(0.8);\n  }\n}\n@-webkit-keyframes scaleDown {\n  to {\n    opacity: 0;\n    transform: scale(0.8);\n  }\n}\n@-o-keyframes scaleDown {\n  to {\n    opacity: 0;\n    transform: scale(0.8);\n  }\n}\n@keyframes scaleDown {\n  to {\n    opacity: 0;\n    transform: scale(0.8);\n  }\n}\n@-moz-keyframes scaleIn {\n  from {\n    opacity: 0;\n    transform: scale(1.2);\n  }\n}\n@-webkit-keyframes scaleIn {\n  from {\n    opacity: 0;\n    transform: scale(1.2);\n  }\n}\n@-o-keyframes scaleIn {\n  from {\n    opacity: 0;\n    transform: scale(1.2);\n  }\n}\n@keyframes scaleIn {\n  from {\n    opacity: 0;\n    transform: scale(1.2);\n  }\n}\n@-moz-keyframes moveFromBottom {\n  from {\n    transform: translateY(50%);\n  }\n}\n@-webkit-keyframes moveFromBottom {\n  from {\n    transform: translateY(50%);\n  }\n}\n@-o-keyframes moveFromBottom {\n  from {\n    transform: translateY(50%);\n  }\n}\n@keyframes moveFromBottom {\n  from {\n    transform: translateY(50%);\n  }\n}\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 174 */
/***/ (function(module, exports) {

/**
 * Translates the list format produced by css-loader into something
 * easier to manipulate.
 */
module.exports = function listToStyles (parentId, list) {
  var styles = []
  var newStyles = {}
  for (var i = 0; i < list.length; i++) {
    var item = list[i]
    var id = item[0]
    var css = item[1]
    var media = item[2]
    var sourceMap = item[3]
    var part = {
      id: parentId + ':' + i,
      css: css,
      media: media,
      sourceMap: sourceMap
    }
    if (!newStyles[id]) {
      styles.push(newStyles[id] = { id: id, parts: [part] })
    } else {
      newStyles[id].parts.push(part)
    }
  }
  return styles
}


/***/ }),
/* 175 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_utils_topLoader__ = __webpack_require__(176);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_utils_topLoader___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__components_utils_topLoader__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_utils_fullLoader__ = __webpack_require__(181);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_utils_fullLoader___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__components_utils_fullLoader__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__components_utils_snackbar__ = __webpack_require__(186);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__components_utils_snackbar___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__components_utils_snackbar__);
//
//
//
//
//
//
//
//
//
//
//
//





/* harmony default export */ __webpack_exports__["default"] = ({
    components: {
        rTopLoader: __WEBPACK_IMPORTED_MODULE_0__components_utils_topLoader___default.a,
        rFullLoader: __WEBPACK_IMPORTED_MODULE_1__components_utils_fullLoader___default.a,
        rSnackbar: __WEBPACK_IMPORTED_MODULE_2__components_utils_snackbar___default.a
    }
});

/***/ }),
/* 176 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(177)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(179),
  /* template */
  __webpack_require__(180),
  /* styles */
  injectStyle,
  /* scopeId */
  "data-v-f5d9775a",
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/components/utils/topLoader.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] topLoader.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-f5d9775a", Component.options)
  } else {
    hotAPI.reload("data-v-f5d9775a", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 177 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(178);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("14deccd8", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-f5d9775a\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./topLoader.vue", function() {
     var newContent = require("!!../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-f5d9775a\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./topLoader.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 178 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n#top-loader[data-v-f5d9775a]{\n    position: fixed;\n    width: 100%;\n    z-index: 10;\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/components/utils/topLoader.vue?dd574f3a"],"names":[],"mappings":";AA0BA;IACA,gBAAA;IACA,YAAA;IACA,YAAA;CACA","file":"topLoader.vue","sourcesContent":["<template>\n    <div id=\"top-loader\">\n        <v-progress-linear :active=\"isLoading\" height=\"4\" v-model=\"progress\" :indeterminate=\"unknownProgress\" class=\"ma-0\" secondary></v-progress-linear>\n    </div>\n</template>\n\n<script>\nimport {mapGetters} from 'vuex';\nimport storeTypes from './../../store/types';\n\nexport default {\n     data: () => ({\n        // loader: true\n        progress: null\n    }),\n    computed: {\n        unknownProgress(){\n            return !Number.isInteger(this.progress) ? true : false;\n        },\n        ...mapGetters({\n            'isLoading': storeTypes.IS_LOADING\n        })\n    }\n}\n</script>\n<style scoped>\n    #top-loader{\n        position: fixed;\n        width: 100%;\n        z-index: 10;\n    }\n</style>\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 179 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vuex__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__store_types__ = __webpack_require__(5);
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

//
//
//
//
//
//




/* harmony default export */ __webpack_exports__["default"] = ({
    data: function data() {
        return {
            // loader: true
            progress: null
        };
    },
    computed: _extends({
        unknownProgress: function unknownProgress() {
            return !Number.isInteger(this.progress) ? true : false;
        }
    }, Object(__WEBPACK_IMPORTED_MODULE_0_vuex__["mapGetters"])({
        'isLoading': __WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].IS_LOADING
    }))
});

/***/ }),
/* 180 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', {
    attrs: {
      "id": "top-loader"
    }
  }, [_c('v-progress-linear', {
    staticClass: "ma-0",
    attrs: {
      "active": _vm.isLoading,
      "height": "4",
      "indeterminate": _vm.unknownProgress,
      "secondary": ""
    },
    model: {
      value: (_vm.progress),
      callback: function($$v) {
        _vm.progress = $$v
      },
      expression: "progress"
    }
  })], 1)
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-f5d9775a", module.exports)
  }
}

/***/ }),
/* 181 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(182)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(184),
  /* template */
  __webpack_require__(185),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/components/utils/fullLoader.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] fullLoader.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-0eae8b87", Component.options)
  } else {
    hotAPI.reload("data-v-0eae8b87", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 182 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(183);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("17e22fb0", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-0eae8b87\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../node_modules/stylus-loader/index.js!../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./fullLoader.vue", function() {
     var newContent = require("!!../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-0eae8b87\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../node_modules/stylus-loader/index.js!../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./fullLoader.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 183 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n.wholepage {\n  position: fixed;\n  background-color: rgba(255,255,255,0.9);\n  width: 100%;\n  height: 100%;\n  top: 0px;\n  z-index: 90;\n}\n.scalein-leave-active,\n.scalein-enter-active {\n  transition: all 0.2s;\n}\n.scalein-enter {\n  opacity: 0;\n}\n.scalein-leave-to {\n  opacity: 0;\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/components/utils/resources/assets/js/components/utils/fullLoader.vue","/Applications/vue/kelly/resources/assets/js/components/utils/fullLoader.vue"],"names":[],"mappings":";AAmCA;EACI,gBAAA;EACA,wCAAA;EACA,YAAA;EACA,aAAA;EACA,SAAA;EACA,YAAA;CClCH;ADoCD;;EACI,qBAAA;CCjCH;ADmCD;EACI,WAAA;CCjCH;ADoCD;EACI,WAAA;CClCH","file":"fullLoader.vue","sourcesContent":["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n.wholepage{\n    position: fixed;\n    background-color: transparentify(#fff, 0.9);\n    width: 100%;\n    height: 100%;\n    top: 0px;\n    z-index: 90;\n}\n.scalein-leave-active, .scalein-enter-active {\n    transition: all .2s;\n}\n.scalein-enter {\n    opacity: 0;\n    // transform: scale(3);\n}\n.scalein-leave-to {\n    opacity: 0;\n    // transform: scale(2);\n}\n// .scalein-leave-active {\n//     position: absolute;\n// }\n",".wholepage {\n  position: fixed;\n  background-color: rgba(255,255,255,0.9);\n  width: 100%;\n  height: 100%;\n  top: 0px;\n  z-index: 90;\n}\n.scalein-leave-active,\n.scalein-enter-active {\n  transition: all 0.2s;\n}\n.scalein-enter {\n  opacity: 0;\n}\n.scalein-leave-to {\n  opacity: 0;\n}\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 184 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vuex__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__store_types__ = __webpack_require__(5);
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

//
//
//
//
//
//
//
//
//
//




/* harmony default export */ __webpack_exports__["default"] = ({
    data: function data() {
        return {
            size: 70,
            width: 5
        };
    },

    computed: _extends({}, Object(__WEBPACK_IMPORTED_MODULE_0_vuex__["mapGetters"])({
        'isFullLoading': __WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].IS_FULL_LOADING
    })),
    methods: _extends({}, Object(__WEBPACK_IMPORTED_MODULE_0_vuex__["mapMutations"])({
        'stopSiteLoading': __WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].STOP_LOADING
    }))
});

/***/ }),
/* 185 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('transition', {
    attrs: {
      "name": "scalein"
    }
  }, [(_vm.isFullLoading) ? _c('div', {
    staticClass: "wholepage",
    attrs: {
      "fill-height": ""
    }
  }, [_c('v-layout', {
    attrs: {
      "align-center": "",
      "fill-height": "",
      "justify-center": ""
    }
  }, [_c('v-progress-circular', {
    staticClass: "primary--text",
    attrs: {
      "indeterminate": "",
      "size": _vm.size,
      "width": _vm.width,
      "secondary": ""
    },
    on: {
      "click": _vm.stopSiteLoading
    }
  })], 1)], 1) : _vm._e()])
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-0eae8b87", module.exports)
  }
}

/***/ }),
/* 186 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(187)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(189),
  /* template */
  __webpack_require__(190),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/components/utils/snackbar.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] snackbar.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-44bbdaca", Component.options)
  } else {
    hotAPI.reload("data-v-44bbdaca", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 187 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(188);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("ec7b3d82", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-44bbdaca\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./snackbar.vue", function() {
     var newContent = require("!!../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-44bbdaca\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./snackbar.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 188 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", "", {"version":3,"sources":[],"names":[],"mappings":"","file":"snackbar.vue","sourceRoot":""}]);

// exports


/***/ }),
/* 189 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vuex__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__store_types__ = __webpack_require__(5);
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

//
//
//
//
//
//
//
//
//




/* harmony default export */ __webpack_exports__["default"] = ({
    computed: _extends({
        snackbar: {
            get: function get() {
                return this.showMessage;
            },
            set: function set(newValue) {
                this.clearMessage();
            }
        }
    }, Object(__WEBPACK_IMPORTED_MODULE_0_vuex__["mapGetters"])(__WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].snackbar.NAME, {
        showMessage: __WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].snackbar.GET_MESSAGE_VISIBILITY,
        message: __WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].snackbar.GET_MESSAGE
    })),
    methods: _extends({}, Object(__WEBPACK_IMPORTED_MODULE_0_vuex__["mapMutations"])(__WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].snackbar.NAME, {
        clearMessage: __WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].snackbar.CLEAR_SNACKBAR
    }), {
        callbackAndClose: function callbackAndClose() {
            this.message.callback();
            this.snackbar = false;
        },
        determinePositionX: function determinePositionX(pos) {
            return this.message.position.x === pos;
        },
        determinePositionY: function determinePositionY(pos) {
            return this.message.position.y === pos;
        },
        determineLabel: function determineLabel(label) {
            return this.message.label === label;
        }
    })
});

/***/ }),
/* 190 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('v-snackbar', {
    attrs: {
      "timeout": _vm.message.time,
      "top": _vm.determinePositionY('top'),
      "bottom": _vm.determinePositionY('bottom'),
      "right": _vm.determinePositionX('right'),
      "left": _vm.determinePositionX('left'),
      "multi-line": true,
      "info": _vm.determineLabel('info'),
      "success": _vm.determineLabel('success'),
      "warning": _vm.determineLabel('warning'),
      "error": _vm.determineLabel('error'),
      "primary": _vm.determineLabel('primary'),
      "secondary": _vm.determineLabel('secondary')
    },
    model: {
      value: (_vm.snackbar),
      callback: function($$v) {
        _vm.snackbar = $$v
      },
      expression: "snackbar"
    }
  }, [_vm._v("\n    " + _vm._s(_vm.message.text) + "\n    "), (_vm.message.callback) ? _c('v-btn', {
    attrs: {
      "flat": "",
      "dark": ""
    },
    nativeOn: {
      "click": function($event) {
        _vm.callbackAndClose($event)
      }
    }
  }, [_vm._v(_vm._s(_vm.message.callback_label))]) : _vm._e(), _vm._v(" "), (_vm.message.close) ? _c('v-btn', {
    attrs: {
      "flat": "",
      "dark": ""
    },
    nativeOn: {
      "click": function($event) {
        _vm.snackbar = false
      }
    }
  }, [_vm._v("CLOSE")]) : _vm._e()], 1)
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-44bbdaca", module.exports)
  }
}

/***/ }),
/* 191 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('v-app', [_c('r-top-loader'), _vm._v(" "), _c('r-full-loader'), _vm._v(" "), _c('r-snackbar'), _vm._v(" "), _c('transition', {
    attrs: {
      "name": "swipe",
      "mode": "out-in"
    }
  }, [_c('router-view', {
    attrs: {
      "keep-alive": ""
    }
  })], 1)], 1)
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-9c95e3e2", module.exports)
  }
}

/***/ }),
/* 192 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(193)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(195),
  /* template */
  __webpack_require__(196),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/pages/indexPage.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] indexPage.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-45e7de84", Component.options)
  } else {
    hotAPI.reload("data-v-45e7de84", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 193 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(194);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("0f92c2d2", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../node_modules/css-loader/index.js?sourceMap!../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-45e7de84\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../node_modules/stylus-loader/index.js!../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./indexPage.vue", function() {
     var newContent = require("!!../../../../node_modules/css-loader/index.js?sourceMap!../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-45e7de84\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../node_modules/stylus-loader/index.js!../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./indexPage.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 194 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n.index-page {\n  position: absolute;\n  height: 100%;\n}\n.index-page .r-title-box > h1 {\n  font-weight: lighter;\n}\n.index-page .r-image-box img {\n  width: 200px;\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/pages/resources/assets/js/pages/indexPage.vue","/Applications/vue/kelly/resources/assets/js/pages/indexPage.vue"],"names":[],"mappings":";AAwCA;EACI,mBAAA;EACA,aAAA;CCvCH;ADyCG;EACI,qBAAA;CCvCP;AD0CO;EACI,aAAA;CCxCX","file":"indexPage.vue","sourcesContent":["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n@import'~styles/stylus/colors';\n.index-page{\n    position: absolute;\n    height: 100%;\n    // background-color: $grey.lighten-2;\n    .r-title-box > h1{\n        font-weight: lighter;\n    }\n    .r-image-box{\n        img{\n            width: 200px;\n        }\n    }\n}\n",".index-page {\n  position: absolute;\n  height: 100%;\n}\n.index-page .r-title-box > h1 {\n  font-weight: lighter;\n}\n.index-page .r-image-box img {\n  width: 200px;\n}\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 195 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//


/* harmony default export */ __webpack_exports__["default"] = ({});

/***/ }),
/* 196 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('v-app', [_c('main', [_c('v-container', {
    staticClass: "index-page",
    attrs: {
      "fluid": ""
    }
  }, [_c('v-layout', {
    staticClass: "contain",
    attrs: {
      "column": "",
      "align-center": "",
      "fill-height": "",
      "justify-center": ""
    }
  }, [_c('div', {
    staticClass: "r-image-box"
  }, [_c('img', {
    attrs: {
      "src": "/images/logo.jpeg"
    }
  })]), _vm._v(" "), _c('div', {
    staticClass: "r-title-box"
  }, [_c('h1', {
    staticClass: "primary--text"
  }, [_vm._v("Community Watch")])]), _vm._v(" "), _c('div', {
    staticClass: "r-sub-title-box"
  }, [_c('h5', {
    staticClass: "primary--text"
  }, [_vm._v("find and report news and incidents happening around you")])]), _vm._v(" "), _c('div', {
    staticClass: "r-sub-title-box"
  }, [_c('router-link', {
    attrs: {
      "tag": "span",
      "to": {
        name: 'auth.login'
      }
    }
  }, [_c('v-btn', {
    attrs: {
      "primary": "",
      "large": ""
    }
  }, [_vm._v("\n                            Login\n                        ")])], 1), _vm._v(" "), _c('router-link', {
    attrs: {
      "tag": "span",
      "to": {
        name: 'dash.home'
      }
    }
  }, [_c('v-btn', {
    attrs: {
      "primary": "",
      "large": "",
      "outline": ""
    }
  }, [_vm._v("\n                            Dashboard\n                        ")])], 1)], 1)])], 1)], 1)])
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-45e7de84", module.exports)
  }
}

/***/ }),
/* 197 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(198)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(200),
  /* template */
  __webpack_require__(201),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/pages/auth/authPage.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] authPage.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-73cf963e", Component.options)
  } else {
    hotAPI.reload("data-v-73cf963e", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 198 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(199);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("4ec7c8e2", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-73cf963e\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../node_modules/stylus-loader/index.js!../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./authPage.vue", function() {
     var newContent = require("!!../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-73cf963e\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../node_modules/stylus-loader/index.js!../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./authPage.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 199 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n.auth-page {\n  height: 100%;\n  min-height: 100vh;\n}\n.auth-page .r-image-box img {\n  width: 150px;\n}\n.auth-page .auth-screens {\n  padding-top: 40px;\n  min-height: 480px;\n}\n.r-fade-enter {\n  opacity: 0;\n  transform: translateY(-20px);\n}\n.r-fade-enter-active {\n  transition: all 0.2s linear;\n}\n.r-fade-leave-active {\n  transition: all 0.1s linear;\n  opacity: 0;\n  transform: translateY(20px);\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/pages/auth/resources/assets/js/pages/auth/authPage.vue","/Applications/vue/kelly/resources/assets/js/pages/auth/authPage.vue"],"names":[],"mappings":";AA4DA;EAEI,aAAA;EACA,kBAAA;CC5DH;AD+DO;EACI,aAAA;CC7DX;ADgEG;EACI,kBAAA;EACJ,kBAAA;CC9DH;ADkED;EACI,WAAA;EACA,6BAAA;CChEH;ADmED;EACI,4BAAA;CCjEH;ADwED;EACI,4BAAA;EACA,WAAA;EACA,4BAAA;CCtEH","file":"authPage.vue","sourcesContent":["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n@import '~styles/stylus/colors';\n.auth-page{\n    // position: absolute;\n    height: 100%;\n    min-height 100vh;\n    // background-color: $grey.lighten-2;  \n    .r-image-box{\n        img{ \n            width: 150px;\n        }\n    }\n    .auth-screens{\n        padding-top: 40px;\n    min-height 480px;\n    }\n}\n\n.r-fade-enter {\n    opacity: 0;\n    transform: translateY(-20px);\n}\n\n.r-fade-enter-active {\n    transition: all .2s linear;\n}\n\n.r-fade-leave {\n    /* opacity: 0; */\n}\n\n.r-fade-leave-active {\n    transition: all .1s linear;\n    opacity: 0;\n    transform: translateY(20px);\n}\n",".auth-page {\n  height: 100%;\n  min-height: 100vh;\n}\n.auth-page .r-image-box img {\n  width: 150px;\n}\n.auth-page .auth-screens {\n  padding-top: 40px;\n  min-height: 480px;\n}\n.r-fade-enter {\n  opacity: 0;\n  transform: translateY(-20px);\n}\n.r-fade-enter-active {\n  transition: all 0.2s linear;\n}\n.r-fade-leave-active {\n  transition: all 0.1s linear;\n  opacity: 0;\n  transform: translateY(20px);\n}\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 200 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({});

/***/ }),
/* 201 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('v-app', [_c('main', [_c('v-container', {
    staticClass: "auth-page",
    attrs: {
      "fluid": ""
    }
  }, [_c('v-layout', {
    staticClass: "contain mt-3",
    attrs: {
      "justify-center": ""
    }
  }, [_c('div', {
    staticClass: "r-image-box"
  }, [_c('router-link', {
    attrs: {
      "to": {
        name: 'index'
      }
    }
  }, [_c('img', {
    staticClass: "clickable",
    attrs: {
      "src": "/images/logo.jpeg"
    }
  })])], 1)]), _vm._v(" "), _c('v-layout', {
    staticClass: "auth-screens",
    attrs: {
      "justify-center": ""
    }
  }, [_c('v-flex', {
    attrs: {
      "xs12": "",
      "sm8": "",
      "md4": ""
    }
  }, [_c('transition', {
    attrs: {
      "name": "r-fade",
      "mode": "out-in"
    }
  }, [_c('keep-alive', [_c('router-view')], 1)], 1)], 1)], 1), _vm._v(" "), _c('v-layout', {
    staticClass: "contain mt-5",
    attrs: {
      "justify-center": ""
    }
  }, [_c('div', {
    staticClass: "r-sub-title-box"
  }, [_c('router-link', {
    attrs: {
      "tag": "span",
      "to": {
        name: 'index'
      }
    }
  }, [_c('v-btn', {
    attrs: {
      "primary": "",
      "large": "",
      "flat": ""
    }
  }, [_vm._v("\n                            Home\n                        ")])], 1), _vm._v(" "), _c('router-link', {
    attrs: {
      "tag": "span",
      "to": {
        name: 'auth.login'
      }
    }
  }, [_c('v-btn', {
    attrs: {
      "secondary": "",
      "large": "",
      "flat": ""
    }
  }, [_vm._v("\n                            Login\n                        ")])], 1), _vm._v(" "), _c('router-link', {
    attrs: {
      "tag": "span",
      "to": {
        name: 'auth.register'
      }
    }
  }, [_c('v-btn', {
    attrs: {
      "secondary": "",
      "large": "",
      "flat": ""
    }
  }, [_vm._v("\n                            Register\n                        ")])], 1), _vm._v(" "), _c('router-link', {
    attrs: {
      "tag": "span",
      "to": {
        name: 'dash.home'
      }
    }
  }, [_c('v-btn', {
    attrs: {
      "primary": "",
      "large": "",
      "flat": ""
    }
  }, [_vm._v("\n                            Dashboard\n                        ")])], 1)], 1)])], 1)], 1)])
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-73cf963e", module.exports)
  }
}

/***/ }),
/* 202 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(203)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(205),
  /* template */
  __webpack_require__(221),
  /* styles */
  injectStyle,
  /* scopeId */
  "data-v-a8000f6a",
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/pages/dashboard/dashboardPage.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] dashboardPage.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-a8000f6a", Component.options)
  } else {
    hotAPI.reload("data-v-a8000f6a", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 203 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(204);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("30a371e0", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-a8000f6a\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../../node_modules/stylus-loader/index.js!../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./dashboardPage.vue", function() {
     var newContent = require("!!../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-a8000f6a\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../../node_modules/stylus-loader/index.js!../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./dashboardPage.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 204 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n.fixed-top[data-v-a8000f6a] {\n  position: fixed;\n}\nmain#main[data-v-a8000f6a] {\n  padding-top: 64px;\n}\n.fade-enter[data-v-a8000f6a] {\n  opacity: 0;\n  transform: translate(-30px);\n}\n.fade-enter-active[data-v-a8000f6a] {\n  transition: all 0.2s ease;\n}\n.fade-leave-active[data-v-a8000f6a] {\n  transition: all 0.2s ease;\n  opacity: 0;\n  transform: translate(30px);\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/pages/dashboard/resources/assets/js/pages/dashboard/dashboardPage.vue","/Applications/vue/kelly/resources/assets/js/pages/dashboard/dashboardPage.vue"],"names":[],"mappings":";AAqDA;EACI,gBAAA;CCpDH;ADsDD;EACI,kBAAA;CCpDH;ADuDD;EACI,WAAA;EACA,4BAAA;CCrDH;ADwDD;EACI,0BAAA;CCtDH;AD6DD;EACI,0BAAA;EACA,WAAA;EACA,2BAAA;CC3DH","file":"dashboardPage.vue","sourcesContent":["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n.fixed-top{\n    position: fixed;\n}\nmain#main{\n    padding-top: 64px;\n}\n\n.fade-enter {\n    opacity: 0;\n    transform: translate(-30px);\n}\n\n.fade-enter-active {\n    transition: all .2s ease;\n}\n\n.fade-leave {\n    /* opacity: 0; */\n}\n\n.fade-leave-active {\n    transition: all .2s ease;\n    opacity: 0;\n    transform: translate(30px);\n}\n",".fixed-top {\n  position: fixed;\n}\nmain#main {\n  padding-top: 64px;\n}\n.fade-enter {\n  opacity: 0;\n  transform: translate(-30px);\n}\n.fade-enter-active {\n  transition: all 0.2s ease;\n}\n.fade-leave-active {\n  transition: all 0.2s ease;\n  opacity: 0;\n  transform: translate(30px);\n}\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 205 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__layouts_sidebar__ = __webpack_require__(206);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__layouts_sidebar___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__layouts_sidebar__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__layouts_topnav__ = __webpack_require__(211);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__layouts_topnav___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__layouts_topnav__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__layouts_footer__ = __webpack_require__(216);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__layouts_footer___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__layouts_footer__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__store_store__ = __webpack_require__(7);
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//







/* harmony default export */ __webpack_exports__["default"] = ({
    data: function data() {
        return {
            sideBarOpen: true
        };
    },
    methods: {
        sideBarToggle: function sideBarToggle() {
            this.sideBarOpen = !this.sideBarOpen;
        }
    },
    components: {
        rSidebar: __WEBPACK_IMPORTED_MODULE_0__layouts_sidebar___default.a,
        rTopnav: __WEBPACK_IMPORTED_MODULE_1__layouts_topnav___default.a,
        rFooter: __WEBPACK_IMPORTED_MODULE_2__layouts_footer___default.a
    },
    beforeRouteEnter: function beforeRouteEnter(to, from, next) {
        next();
    }
});

/***/ }),
/* 206 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(207)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(209),
  /* template */
  __webpack_require__(210),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/layouts/sidebar.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] sidebar.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-31d3f264", Component.options)
  } else {
    hotAPI.reload("data-v-31d3f264", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 207 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(208);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("2cf8bbad", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../node_modules/css-loader/index.js?sourceMap!../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-31d3f264\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./sidebar.vue", function() {
     var newContent = require("!!../../../../node_modules/css-loader/index.js?sourceMap!../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-31d3f264\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./sidebar.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 208 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", "", {"version":3,"sources":[],"names":[],"mappings":"","file":"sidebar.vue","sourceRoot":""}]);

// exports


/***/ }),
/* 209 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({
    data: function data() {
        return {
            items: [{ title: 'Home', icon: 'home', route: 'dash.home' }, { title: 'Posts', icon: 'dashboard', route: 'dash.posts' }, { title: 'Messages', icon: 'chat', route: 'dash.messages' }]
        };
    },
    methods: {
        gotoPath: function gotoPath(path) {
            this.$router.push({ name: path });
        }
    }
});

/***/ }),
/* 210 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('v-card', {
    staticClass: "ma-3"
  }, [_c('v-list', {
    staticClass: "py-0"
  }, _vm._l((_vm.items), function(item) {
    return _c('v-list-tile', {
      key: item.title,
      on: {
        "click": function($event) {
          _vm.gotoPath(item.route)
        }
      }
    }, [_c('v-list-tile-action', [_c('v-icon', [_vm._v(_vm._s(item.icon))])], 1), _vm._v(" "), _c('v-list-tile-content', [_c('v-list-tile-title', [_vm._v(_vm._s(item.title))])], 1)], 1)
  }))], 1)
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-31d3f264", module.exports)
  }
}

/***/ }),
/* 211 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(212)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(214),
  /* template */
  __webpack_require__(215),
  /* styles */
  injectStyle,
  /* scopeId */
  "data-v-d6547254",
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/layouts/topnav.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] topnav.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-d6547254", Component.options)
  } else {
    hotAPI.reload("data-v-d6547254", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 212 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(213);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("1a027f9c", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../node_modules/css-loader/index.js?sourceMap!../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-d6547254\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./topnav.vue", function() {
     var newContent = require("!!../../../../node_modules/css-loader/index.js?sourceMap!../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-d6547254\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./topnav.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 213 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", "", {"version":3,"sources":[],"names":[],"mappings":"","file":"topnav.vue","sourceRoot":""}]);

// exports


/***/ }),
/* 214 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vuex__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__store_types__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__helpers_loader__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__helpers_snackbar__ = __webpack_require__(8);
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//






/* harmony default export */ __webpack_exports__["default"] = ({
    data: function data() {
        return {
            sideBar: true
        };
    },
    computed: _extends({}, Object(__WEBPACK_IMPORTED_MODULE_0_vuex__["mapGetters"])({
        'isLoading': __WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].IS_LOADING,
        'isFullLoading': __WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].IS_FULL_LOADING
    })),
    methods: _extends({
        gotoHome: function gotoHome() {
            this.$router.push({ name: 'index' });
        },
        sideBarToggle: function sideBarToggle() {
            this.$emit('toggleSidebar');
        },
        logout: function logout() {
            this.dispatchLogout();
            __WEBPACK_IMPORTED_MODULE_3__helpers_snackbar__["a" /* default */].fire("You have successfully logged out");
            this.$router.push({ name: 'index' });
        },
        toggleSiteLoad: function toggleSiteLoad() {
            this.isLoading ? __WEBPACK_IMPORTED_MODULE_2__helpers_loader__["a" /* default */].stop() : __WEBPACK_IMPORTED_MODULE_2__helpers_loader__["a" /* default */].start();
        },
        toggleFullLoad: function toggleFullLoad() {
            this.isFullLoading ? __WEBPACK_IMPORTED_MODULE_2__helpers_loader__["a" /* default */].stop() : __WEBPACK_IMPORTED_MODULE_2__helpers_loader__["a" /* default */].start('full');
        }
    }, Object(__WEBPACK_IMPORTED_MODULE_0_vuex__["mapActions"])(__WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].auth.NAME, {
        dispatchLogout: __WEBPACK_IMPORTED_MODULE_1__store_types__["a" /* default */].auth.USER_LOGOUT
    }))
});

/***/ }),
/* 215 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('v-toolbar', {
    staticClass: "primary",
    attrs: {
      "dark": ""
    }
  }, [_c('v-toolbar-side-icon', {
    nativeOn: {
      "click": function($event) {
        $event.stopPropagation();
        _vm.sideBarToggle($event)
      }
    }
  }), _vm._v(" "), _c('v-toolbar-title', {
    staticClass: "clickable",
    on: {
      "click": _vm.gotoHome
    }
  }, [_vm._v("\n        Community Watch\n    ")]), _vm._v(" "), _c('v-spacer'), _vm._v(" "), _c('v-toolbar-items', [_c('v-btn', {
    attrs: {
      "flat": ""
    },
    on: {
      "click": _vm.toggleFullLoad
    }
  }, [_c('v-icon', [_vm._v("mdi-reload")])], 1), _vm._v(" "), _c('v-btn', {
    attrs: {
      "flat": ""
    },
    on: {
      "click": _vm.toggleSiteLoad
    }
  }, [_c('v-icon', [_vm._v("mdi-loop")])], 1), _vm._v(" "), _c('v-btn', {
    attrs: {
      "flat": ""
    },
    on: {
      "click": _vm.logout
    }
  }, [_c('v-icon', [_vm._v("mdi-logout")])], 1)], 1)], 1)
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-d6547254", module.exports)
  }
}

/***/ }),
/* 216 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(217)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(219),
  /* template */
  __webpack_require__(220),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/layouts/footer.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] footer.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-14f0d243", Component.options)
  } else {
    hotAPI.reload("data-v-14f0d243", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 217 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(218);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("56c3f366", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../node_modules/css-loader/index.js?sourceMap!../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-14f0d243\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./footer.vue", function() {
     var newContent = require("!!../../../../node_modules/css-loader/index.js?sourceMap!../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-14f0d243\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./footer.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 218 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", "", {"version":3,"sources":[],"names":[],"mappings":"","file":"footer.vue","sourceRoot":""}]);

// exports


/***/ }),
/* 219 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({
    data: function data() {
        return {
            sideBar: true
        };
    }
});

/***/ }),
/* 220 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', [_vm._v("\n    2017 Raymond\n")])
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-14f0d243", module.exports)
  }
}

/***/ }),
/* 221 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('v-app', [_c('v-navigation-drawer', {
    staticClass: "secondary darken-3",
    attrs: {
      "persistent": "",
      "floating": ""
    },
    model: {
      value: (_vm.sideBarOpen),
      callback: function($$v) {
        _vm.sideBarOpen = $$v
      },
      expression: "sideBarOpen"
    }
  }, [_c('r-sidebar')], 1), _vm._v(" "), _c('r-topnav', {
    staticClass: "fixed-top",
    on: {
      "toggleSidebar": _vm.sideBarToggle
    }
  }), _vm._v(" "), _c('main', {
    attrs: {
      "id": "main"
    }
  }, [_c('v-container', {
    attrs: {
      "fluid": ""
    }
  }, [_c('transition', {
    attrs: {
      "name": "fade",
      "mode": "out-in"
    }
  }, [_c('keep-alive', [_c('router-view')], 1)], 1)], 1)], 1), _vm._v(" "), _c('v-footer', [_c('r-footer')], 1)], 1)
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-a8000f6a", module.exports)
  }
}

/***/ }),
/* 222 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__pages_dashboard_screens_homeScreen_vue__ = __webpack_require__(223);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__pages_dashboard_screens_homeScreen_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__pages_dashboard_screens_homeScreen_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__pages_dashboard_screens_postsScreen_vue__ = __webpack_require__(228);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__pages_dashboard_screens_postsScreen_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__pages_dashboard_screens_postsScreen_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__pages_dashboard_screens_messagesScreen_vue__ = __webpack_require__(264);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__pages_dashboard_screens_messagesScreen_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__pages_dashboard_screens_messagesScreen_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__api_posts__ = __webpack_require__(142);






/* harmony default export */ __webpack_exports__["a"] = ([{
    path: '',
    name: 'dash.home',
    component: __WEBPACK_IMPORTED_MODULE_0__pages_dashboard_screens_homeScreen_vue___default.a
}, {
    path: 'posts',
    name: 'dash.posts',
    component: __WEBPACK_IMPORTED_MODULE_1__pages_dashboard_screens_postsScreen_vue___default.a,
    beforeEnter: function beforeEnter(to, from, next) {
        __WEBPACK_IMPORTED_MODULE_3__api_posts__["a" /* default */].getAll().then(function (posts) {
            console.log(posts);
            console.log("get posts before dash");
            next();
        }).catch(function (error) {
            console.log("erroring");
            console.log(error);
            next();
        });
    }
}, {
    path: 'messages',
    name: 'dash.messages',
    component: __WEBPACK_IMPORTED_MODULE_2__pages_dashboard_screens_messagesScreen_vue___default.a
}]);

/***/ }),
/* 223 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(224)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(226),
  /* template */
  __webpack_require__(227),
  /* styles */
  injectStyle,
  /* scopeId */
  "data-v-34cab24a",
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/pages/dashboard/screens/homeScreen.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] homeScreen.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-34cab24a", Component.options)
  } else {
    hotAPI.reload("data-v-34cab24a", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 224 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(225);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("0b72884c", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-34cab24a\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./homeScreen.vue", function() {
     var newContent = require("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-34cab24a\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./homeScreen.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 225 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\ndiv[data-v-34cab24a] {\n  text-align: center;\n}\nimg[data-v-34cab24a] {\n  width: 150px;\n}\nh1[data-v-34cab24a] {\n  color: #f00;\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/pages/dashboard/screens/resources/assets/js/pages/dashboard/screens/homeScreen.vue","/Applications/vue/kelly/resources/assets/js/pages/dashboard/screens/homeScreen.vue"],"names":[],"mappings":";AAcA;EACI,mBAAA;CCbH;ADgBD;EACI,aAAA;CCdH;ADiBD;EACI,YAAA;CCfH","file":"homeScreen.vue","sourcesContent":["\n\n\n\n\n\n\n\n\n\n\n\n\n\ndiv {\n    text-align: center\n}\n\nimg {\n    width: 150px\n}\n\nh1 {\n    color: red;\n}\n\n","div {\n  text-align: center;\n}\nimg {\n  width: 150px;\n}\nh1 {\n  color: #f00;\n}\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 226 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({});

/***/ }),
/* 227 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _vm._m(0)
},staticRenderFns: [function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', [_c('img', {
    attrs: {
      "src": "/images/logo.svg",
      "alt": "Vuetify.js"
    }
  }), _vm._v(" "), _c('h1', [_vm._v("Home Screen")])])
}]}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-34cab24a", module.exports)
  }
}

/***/ }),
/* 228 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(229)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(231),
  /* template */
  __webpack_require__(263),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/pages/dashboard/screens/postsScreen.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] postsScreen.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-ecf40ec2", Component.options)
  } else {
    hotAPI.reload("data-v-ecf40ec2", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 229 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(230);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("0b8b4c19", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-ecf40ec2\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./postsScreen.vue", function() {
     var newContent = require("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-ecf40ec2\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./postsScreen.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 230 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n.fab-holder {\n  position: fixed;\n  z-index: 20;\n  bottom: 30px;\n  right: 30px;\n}\n@media only screen and (min-width: 1025px) {\n.fab-holder {\n    right: 150px;\n}\n}\n.comment-box {\n  max-height: 500px;\n  overflow: hidden;\n}\n.fade-enter-active {\n  transition: max-height 0.2s ease-in;\n}\n.fade-leave-active {\n  transition: max-height 0.2s ease-out;\n}\n.fade-enter,\n.fade-leave-active {\n  max-height: 0px;\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/pages/dashboard/screens/resources/assets/js/pages/dashboard/screens/postsScreen.vue","/Applications/vue/kelly/resources/assets/js/pages/dashboard/screens/postsScreen.vue"],"names":[],"mappings":";AAuEA;EACI,gBAAA;EACA,YAAA;EACA,aAAA;EACA,YAAA;CCtEH;ADuE4C;AAAA;IACrC,aAAA;CCpEL;CACF;ADsED;EACI,kBAAA;EACA,iBAAA;CCpEH;ADuED;EACC,oCAAA;CCrEA;ADuED;EACC,qCAAA;CCrEA;ADuED;;EACC,gBAAA;CCpEA","file":"postsScreen.vue","sourcesContent":["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n.fab-holder{\n    position: fixed;\n    z-index: 20;\n    bottom: 30px;\n    right: 30px;\n    @media only screen and (min-width: 1025px){\n        right: 150px;\n    }\n}\n.comment-box{\n    max-height: 500px;\n    overflow: hidden;\n}\n\t\n.fade-enter-active \n\ttransition max-height .2s ease-in\n\n.fade-leave-active\n\ttransition max-height .2s ease-out\n\n.fade-enter, .fade-leave-active\n\tmax-height 0px\n\n",".fab-holder {\n  position: fixed;\n  z-index: 20;\n  bottom: 30px;\n  right: 30px;\n}\n@media only screen and (min-width: 1025px) {\n  .fab-holder {\n    right: 150px;\n  }\n}\n.comment-box {\n  max-height: 500px;\n  overflow: hidden;\n}\n.fade-enter-active {\n  transition: max-height 0.2s ease-in;\n}\n.fade-leave-active {\n  transition: max-height 0.2s ease-out;\n}\n.fade-enter,\n.fade-leave-active {\n  max-height: 0px;\n}\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 231 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_shared_posts_PostList__ = __webpack_require__(232);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_shared_posts_PostList___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__components_shared_posts_PostList__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_shared_posts_AddPost__ = __webpack_require__(258);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_shared_posts_AddPost___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__components_shared_posts_AddPost__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_vuex__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__api_posts__ = __webpack_require__(142);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__store_types__ = __webpack_require__(5);
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//







/* harmony default export */ __webpack_exports__["default"] = ({
    components: {
        rPosts: __WEBPACK_IMPORTED_MODULE_0__components_shared_posts_PostList___default.a,
        rAddPost: __WEBPACK_IMPORTED_MODULE_1__components_shared_posts_AddPost___default.a
    },
    data: function data() {
        return {
            show: false,
            // posts: [],
            newPostModal: false,
            counter: 3
        };
    },

    computed: _extends({
        clearNewPost: function clearNewPost() {
            return this.newPostModal;
        }
    }, Object(__WEBPACK_IMPORTED_MODULE_2_vuex__["mapGetters"])(__WEBPACK_IMPORTED_MODULE_4__store_types__["a" /* default */].post.NAME, {
        posts: __WEBPACK_IMPORTED_MODULE_4__store_types__["a" /* default */].post.GET_POSTS
    })),
    methods: {
        openNewPost: function openNewPost() {
            this.newPostModal = true;
        },
        addPost: function addPost(newPost) {
            var _this = this;

            __WEBPACK_IMPORTED_MODULE_3__api_posts__["a" /* default */].addPost(newPost).then(function (res) {
                _this.newPostModal = false;
                _this.closeAddPost = true;
            });
        }
    }
});

/***/ }),
/* 232 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(233)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(235),
  /* template */
  __webpack_require__(257),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/components/shared/posts/PostList.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] PostList.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-ae9b1866", Component.options)
  } else {
    hotAPI.reload("data-v-ae9b1866", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 233 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(234);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("111e6c7a", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-ae9b1866\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./PostList.vue", function() {
     var newContent = require("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-ae9b1866\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./PostList.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 234 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n.list-enter-active {\n  transition: all 0.3s 0.6s;\n}\n.list-leave-active {\n  transition: all 0.3s;\n}\n.list-enter,\n.list-leave-to {\n  transform: translateX(1300px);\n}\n.list-move {\n  transition: transform 0.3s 0.3s;\n}\n.list-leave-active {\n  position: absolute;\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/components/shared/posts/resources/assets/js/components/shared/posts/PostList.vue","/Applications/vue/kelly/resources/assets/js/components/shared/posts/PostList.vue"],"names":[],"mappings":";AAiCA;EACE,0BAAA;CChCD;ADkCD;EACE,qBAAA;CChCD;ADkCD;;EAEE,8BAAA;CChCD;ADkCD;EACE,gCAAA;CChCD;ADkCD;EACE,mBAAA;CChCD","file":"PostList.vue","sourcesContent":["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n.list-enter-active {\n  transition: all .3s .6s;\n}\n.list-leave-active {\n  transition: all .3s;\n}\n.list-enter, .list-leave-to {\n//   opacity: 0;\n  transform: translateX(1300px);\n}\n.list-move {\n  transition: transform .3s .3s;\n}\n.list-leave-active {\n  position: absolute;\n}\n",".list-enter-active {\n  transition: all 0.3s 0.6s;\n}\n.list-leave-active {\n  transition: all 0.3s;\n}\n.list-enter,\n.list-leave-to {\n  transform: translateX(1300px);\n}\n.list-move {\n  transition: transform 0.3s 0.3s;\n}\n.list-leave-active {\n  position: absolute;\n}\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 235 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Post__ = __webpack_require__(236);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Post___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__Post__);
//
//
//
//
//
//
//
//
//
//
//
//


/* harmony default export */ __webpack_exports__["default"] = ({
    props: ['posts'],
    components: {
        rPost: __WEBPACK_IMPORTED_MODULE_0__Post___default.a
    },
    methods: {
        removePost: function removePost(p) {
            var _this = this;

            this.posts.forEach(function (post, index) {
                if (post.id == p) {
                    _this.posts.splice(index, 1);
                    return;
                }
            });
        }
    }
});

/***/ }),
/* 236 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(237)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(239),
  /* template */
  __webpack_require__(256),
  /* styles */
  injectStyle,
  /* scopeId */
  "data-v-a6bd9ce2",
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/components/shared/posts/Post.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] Post.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-a6bd9ce2", Component.options)
  } else {
    hotAPI.reload("data-v-a6bd9ce2", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 237 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(238);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("04eb3a97", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-a6bd9ce2\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./Post.vue", function() {
     var newContent = require("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-a6bd9ce2\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./Post.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 238 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n.post-card[data-v-a6bd9ce2] {\n  width: 100%;\n  min-width: 400px;\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/components/shared/posts/resources/assets/js/components/shared/posts/Post.vue","/Applications/vue/kelly/resources/assets/js/components/shared/posts/Post.vue"],"names":[],"mappings":";AAqGA;EACI,YAAA;EACA,iBAAA;CCpGH","file":"Post.vue","sourcesContent":["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n.post-card{\n    width: 100%;\n    min-width: 400px;\n}\n",".post-card {\n  width: 100%;\n  min-width: 400px;\n}\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 239 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__users_UserSmallProfile__ = __webpack_require__(240);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__users_UserSmallProfile___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__users_UserSmallProfile__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__comments_CommentList__ = __webpack_require__(245);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__comments_CommentList___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__comments_CommentList__);
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//



/* harmony default export */ __webpack_exports__["default"] = ({
    props: ['post'],
    components: {
        rUserTop: __WEBPACK_IMPORTED_MODULE_0__users_UserSmallProfile___default.a,
        rCommentList: __WEBPACK_IMPORTED_MODULE_1__comments_CommentList___default.a
    },
    data: function data() {
        return {
            isCommentOpen: false
        };
    },

    methods: {
        remove: function remove() {
            this.$emit('remove', this.post.id);
        },
        report: function report() {}
    }
});

/***/ }),
/* 240 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(241)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(243),
  /* template */
  __webpack_require__(244),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/components/shared/users/UserSmallProfile.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] UserSmallProfile.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-2a1d2ee7", Component.options)
  } else {
    hotAPI.reload("data-v-2a1d2ee7", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 241 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(242);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("0cb54b4e", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-2a1d2ee7\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./UserSmallProfile.vue", function() {
     var newContent = require("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-2a1d2ee7\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./UserSmallProfile.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 242 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\nsmall.time{\n    color: silver\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/components/shared/users/UserSmallProfile.vue?47c7b7db"],"names":[],"mappings":";AA4BA;IACA,aAAA;CACA","file":"UserSmallProfile.vue","sourcesContent":["<template>\n    <v-list two-line class=\"py-0\">\n        <v-list-tile avatar>\n            <v-list-tile-avatar>\n                <img :src=\"user.image\">\n            </v-list-tile-avatar>\n            <v-list-tile-content>\n                <v-list-tile-title>{{user.name}}</v-list-tile-title>\n                <v-list-tile-sub-title>{{user.title}}</v-list-tile-sub-title>\n                <small class=\"time\">2 minutes ago</small>\n            </v-list-tile-content>\n        </v-list-tile>\n    </v-list>\n</template>\n\n<script>\nexport default {\n    props: ['user'],\n    data() {\n        return{\n            name\n        }\n    }\n}\n</script>\n\n\n<style>\nsmall.time{\n    color: silver\n}\n</style>\n\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 243 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({
    props: ['user'],
    data: function data() {
        return {
            name: name
        };
    }
});

/***/ }),
/* 244 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('v-list', {
    staticClass: "py-0",
    attrs: {
      "two-line": ""
    }
  }, [_c('v-list-tile', {
    attrs: {
      "avatar": ""
    }
  }, [_c('v-list-tile-avatar', [_c('img', {
    attrs: {
      "src": _vm.user.image
    }
  })]), _vm._v(" "), _c('v-list-tile-content', [_c('v-list-tile-title', [_vm._v(_vm._s(_vm.user.name))]), _vm._v(" "), _c('v-list-tile-sub-title', [_vm._v(_vm._s(_vm.user.title))]), _vm._v(" "), _c('small', {
    staticClass: "time"
  }, [_vm._v("2 minutes ago")])], 1)], 1)], 1)
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-2a1d2ee7", module.exports)
  }
}

/***/ }),
/* 245 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(246)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(248),
  /* template */
  __webpack_require__(255),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/components/shared/comments/CommentList.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] CommentList.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-a5aa7996", Component.options)
  } else {
    hotAPI.reload("data-v-a5aa7996", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 246 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(247);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("2a6c1c84", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-a5aa7996\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./CommentList.vue", function() {
     var newContent = require("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-a5aa7996\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./CommentList.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 247 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "", "", {"version":3,"sources":[],"names":[],"mappings":"","file":"CommentList.vue","sourceRoot":""}]);

// exports


/***/ }),
/* 248 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Comment__ = __webpack_require__(249);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Comment___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__Comment__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__AddComment__ = __webpack_require__(252);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__AddComment___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__AddComment__);
//
//
//
//
//
//
//
//
//
//



/* harmony default export */ __webpack_exports__["default"] = ({
    props: ['comments'],
    components: {
        rComment: __WEBPACK_IMPORTED_MODULE_0__Comment___default.a,
        rAddComment: __WEBPACK_IMPORTED_MODULE_1__AddComment___default.a
    }
});

/***/ }),
/* 249 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(250),
  /* template */
  __webpack_require__(251),
  /* styles */
  null,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/components/shared/comments/Comment.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] Comment.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-073974f7", Component.options)
  } else {
    hotAPI.reload("data-v-073974f7", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 250 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({
    props: ['comment'],
    computed: {}
});

/***/ }),
/* 251 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('v-list-tile', {
    attrs: {
      "ripple": false
    }
  }, [_c('v-list-tile-avatar', {
    staticClass: "hidden-xs-only"
  }, [_c('img', {
    attrs: {
      "src": _vm.comment.user.image
    }
  })]), _vm._v(" "), _c('v-list-tile-content', [_c('v-list-tile-title', {
    staticClass: "primary--text"
  }, [_vm._v(_vm._s(_vm.comment.user.name))]), _vm._v(" "), _c('v-list-tile-sub-title', {
    staticClass: "black--text py-1"
  }, [_vm._t("default")], 2)], 1), _vm._v(" "), _c('v-list-tile-action', [_c('v-list-tile-action-text', [_vm._v(_vm._s(_vm.comment.date))]), _vm._v(" "), _c('v-btn', {
    attrs: {
      "icon": ""
    }
  }, [_c('v-icon', {
    staticClass: "grey--text"
  }, [_vm._v("thumb_up")])], 1)], 1)], 1)
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-073974f7", module.exports)
  }
}

/***/ }),
/* 252 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(253),
  /* template */
  __webpack_require__(254),
  /* styles */
  null,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/components/shared/comments/AddComment.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] AddComment.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-704dbe96", Component.options)
  } else {
    hotAPI.reload("data-v-704dbe96", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 253 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({
    props: ['userImage'],
    data: function data() {
        return {
            commentInput: ''
        };
    }
});

/***/ }),
/* 254 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', {
    staticClass: "grey lighten-2"
  }, [_c('v-layout', {
    attrs: {
      "align-center": ""
    }
  }, [_c('v-flex', {
    staticClass: "hidden-xs-only"
  }, [_c('v-list-tile-avatar', [_c('img', {
    attrs: {
      "src": _vm.userImage
    }
  })])], 1), _vm._v(" "), _c('v-flex', {
    attrs: {
      "xs8": ""
    }
  }, [_c('v-text-field', {
    staticClass: "pb-0",
    attrs: {
      "auto-grow": "",
      "label": "write a comment",
      "full-width": "",
      "multi-line": "",
      "rows": "2"
    },
    model: {
      value: (_vm.commentInput),
      callback: function($$v) {
        _vm.commentInput = $$v
      },
      expression: "commentInput"
    }
  })], 1), _vm._v(" "), _c('v-flex', {
    staticClass: "text-xs-center"
  }, [_c('v-btn', {
    staticClass: "primary",
    attrs: {
      "fab": "",
      "dark": "",
      "small": ""
    }
  }, [_c('v-icon', {
    attrs: {
      "dark": ""
    }
  }, [_vm._v("send")])], 1)], 1)], 1)], 1)
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-704dbe96", module.exports)
  }
}

/***/ }),
/* 255 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('v-list', {
    staticClass: "py-0",
    attrs: {
      "three-line": ""
    }
  }, [_c('r-add-comment', {
    attrs: {
      "user-image": "/images/avatar.jpg"
    }
  }), _vm._v(" "), _vm._l((_vm.comments), function(comment, i) {
    return [_c('r-comment', {
      key: i,
      staticClass: "py-2 px-2 removeListHover",
      attrs: {
        "comment": comment
      }
    }, [_vm._v(_vm._s(comment.comment))]), _vm._v(" "), (i != _vm.comments.length - 1) ? _c('v-divider', {
      key: i
    }) : _vm._e()]
  })], 2)
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-a5aa7996", module.exports)
  }
}

/***/ }),
/* 256 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('v-card', {
    staticClass: "post-card mb-5"
  }, [(_vm.post.report) ? _c('v-system-bar', {
    staticClass: "info",
    attrs: {
      "status": "",
      "dark": ""
    }
  }, [_c('v-icon', [_vm._v("report")]), _vm._v("\n        This has been reported to the police\n        "), _c('v-spacer'), _vm._v(" "), _c('v-icon', [_vm._v("location_on")]), _vm._v(" "), _c('span', [_vm._v("Agege")])], 1) : _vm._e(), _vm._v(" "), _c('v-card-actions', {
    staticClass: "ma-0 pa-0"
  }, [_c('r-user-top', {
    attrs: {
      "user": _vm.post.user
    }
  }), _vm._v(" "), _c('v-spacer'), _vm._v(" "), _c('v-menu', {
    attrs: {
      "bottom": "",
      "right": ""
    }
  }, [_c('v-btn', {
    attrs: {
      "icon": ""
    },
    slot: "activator"
  }, [_c('v-icon', [_vm._v("more_vert")])], 1), _vm._v(" "), _c('v-list', [_c('v-list-tile', {
    nativeOn: {
      "click": function($event) {
        _vm.remove($event)
      }
    }
  }, [_c('v-list-tile-content', [_c('v-list-tile-title', {
    staticClass: "error--text"
  }, [_vm._v("Delete")])], 1), _vm._v(" "), _c('v-list-tile-action', [_c('v-icon', {
    staticClass: "error--text"
  }, [_vm._v("delete")])], 1)], 1), _vm._v(" "), _c('v-list-tile', [_c('v-list-tile-content', [_c('v-list-tile-title', {
    staticClass: "info--text"
  }, [_vm._v("Report")])], 1), _vm._v(" "), _c('v-list-tile-action', [_c('v-icon', {
    staticClass: "info--text"
  }, [_vm._v("report")])], 1)], 1)], 1)], 1)], 1), _vm._v(" "), (_vm.post.media) ? _c('v-card-media', {
    attrs: {
      "src": _vm.post.media,
      "height": "300px"
    }
  }) : _c('v-divider', {
    attrs: {
      "inset": ""
    }
  }), _vm._v(" "), _c('v-card-title', {
    attrs: {
      "primary-title": ""
    }
  }, [_c('div', [_c('span', [_vm._v("\n                " + _vm._s(_vm.post.text) + "\n            ")])])]), _vm._v(" "), _c('v-card-actions', {
    staticClass: "primary"
  }, [_c('v-btn', {
    staticClass: "mx-2",
    attrs: {
      "flat": "",
      "dark": "",
      "icon": ""
    }
  }, [_vm._v("\n            " + _vm._s(_vm.post.likes > 1 ? _vm.post.likes : '') + "\n            "), _c('v-icon', [_vm._v("favorite")])], 1), _vm._v(" "), _c('v-btn', {
    staticClass: "mx-2",
    attrs: {
      "flat": "",
      "dark": "",
      "icon": ""
    }
  }, [_vm._v("\n            " + _vm._s(_vm.post.reposts > 1 ? _vm.post.reposts : '') + "\n            "), _c('v-icon', [_vm._v("repeat")])], 1), _vm._v(" "), _c('v-spacer'), _vm._v(" "), _c('v-btn', {
    staticClass: "mx-3",
    attrs: {
      "dark": "",
      "icon": ""
    },
    nativeOn: {
      "click": function($event) {
        _vm.isCommentOpen = !_vm.isCommentOpen
      }
    }
  }, [_c('v-icon', [_vm._v("comment")])], 1)], 1), _vm._v(" "), _c('transition', {
    attrs: {
      "name": "fade"
    }
  }, [_c('v-card-text', {
    directives: [{
      name: "show",
      rawName: "v-show",
      value: (_vm.isCommentOpen),
      expression: "isCommentOpen"
    }],
    staticClass: "comment-box pa-0"
  }, [_c('r-comment-list', {
    attrs: {
      "comments": _vm.post.comments
    }
  })], 1)], 1)], 1)
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-a6bd9ce2", module.exports)
  }
}

/***/ }),
/* 257 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', [_c('v-layout', {
    staticClass: "py-0",
    attrs: {
      "row": "",
      "wrap": ""
    }
  }, [_c('transition-group', {
    attrs: {
      "name": "list"
    }
  }, _vm._l((_vm.posts), function(post, i) {
    return _c('v-flex', {
      key: post.id,
      attrs: {
        "xs12": "",
        "md12": ""
      }
    }, [_c('r-post', {
      staticClass: "mb-5",
      attrs: {
        "post": post
      },
      on: {
        "remove": _vm.removePost
      }
    })], 1)
  }))], 1)], 1)
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-ae9b1866", module.exports)
  }
}

/***/ }),
/* 258 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(259)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(261),
  /* template */
  __webpack_require__(262),
  /* styles */
  injectStyle,
  /* scopeId */
  "data-v-0187857c",
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/components/shared/posts/AddPost.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] AddPost.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-0187857c", Component.options)
  } else {
    hotAPI.reload("data-v-0187857c", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 259 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(260);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("1bda2041", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-0187857c\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./AddPost.vue", function() {
     var newContent = require("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-0187857c\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./AddPost.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 260 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n#fileImage[data-v-0187857c] {\n  display: none;\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/components/shared/posts/resources/assets/js/components/shared/posts/AddPost.vue","/Applications/vue/kelly/resources/assets/js/components/shared/posts/AddPost.vue"],"names":[],"mappings":";AAqHA;EACI,cAAA;CCpHH","file":"AddPost.vue","sourcesContent":["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n#fileImage{\n    display: none;\n}\n","#fileImage {\n  display: none;\n}\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 261 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({
    props: {
        userImage: {
            default: '/images/unkown.jpg',
            type: String
        },
        clear: {
            type: Boolean,
            default: false
        }
    },
    data: function data() {
        return {
            dialog: true,
            isReport: false,
            post: {
                text: '',
                media: false,
                report: false
            },
            posting: false
        };
    },

    watch: {
        clear: function clear() {
            if (this.clear) {
                this.post = {
                    text: '',
                    media: false,
                    report: false
                }, this.posting = false;
            }
        }
    },
    methods: {
        removePhoto: function removePhoto() {
            this.post.media = null;
        },
        addPhoto: function addPhoto() {
            this.$refs.hiddenFile.click();
        },
        onFileChange: function onFileChange(e) {
            var files = e.target.files || e.dataTransfer.files;
            if (!files.length) return;
            this.createImage(files[0]);
        },
        createImage: function createImage(file) {
            var reader = new FileReader();
            var vm = this;
            reader.onload = function (e) {
                vm.post.media = {
                    link: e.target.result,
                    type: 'image'
                };
            };
            reader.readAsDataURL(file);
        },
        cancelled: function cancelled() {
            this.post = {
                text: '',
                media: false,
                report: false
            }, this.posting = false;
            this.$emit('canceled');
        },
        posted: function posted() {
            this.posting = true;
            this.$emit('posted', this.post);
        }
    }
});

/***/ }),
/* 262 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('v-card', [_c('form', {
    on: {
      "submit": function($event) {
        $event.preventDefault();
        _vm.posted($event)
      }
    }
  }, [_c('v-card-title', {
    staticClass: "headline"
  }, [_vm._v("Add a new post")]), _vm._v(" "), _c('div', {
    staticClass: "grey lighten-2"
  }, [_c('v-layout', {
    attrs: {
      "align-center": ""
    }
  }, [_c('v-flex', {
    staticClass: "hidden-xs-only",
    attrs: {
      "md2": ""
    }
  }, [_c('v-list-tile-avatar', [_c('img', {
    attrs: {
      "src": _vm.userImage
    }
  })])], 1), _vm._v(" "), _c('v-flex', {
    attrs: {
      "xs12": "",
      "sm10": ""
    }
  }, [_c('v-text-field', {
    staticClass: "pb-0",
    attrs: {
      "label": "write a post",
      "full-width": "",
      "multi-line": "",
      "rows": "3"
    },
    model: {
      value: (_vm.post.text),
      callback: function($$v) {
        _vm.post.text = $$v
      },
      expression: "post.text"
    }
  })], 1)], 1)], 1), _vm._v(" "), (_vm.post.media) ? _c('v-card-media', {
    attrs: {
      "src": _vm.post.media.link,
      "height": "300px"
    }
  }) : _vm._e(), _vm._v(" "), _c('v-card-actions', {
    staticClass: "secondary"
  }, [_c('v-switch', {
    staticClass: "ma-0 pa-0 ml-3",
    attrs: {
      "label": 'Report',
      "hide-details": "",
      "color": "primary"
    },
    model: {
      value: (_vm.post.report),
      callback: function($$v) {
        _vm.post.report = $$v
      },
      expression: "post.report"
    }
  }), _vm._v(" "), _c('v-spacer'), _vm._v(" "), (!_vm.post.media) ? _c('v-btn', {
    directives: [{
      name: "tooltip",
      rawName: "v-tooltip:left",
      value: ({
        html: 'Add a photo'
      }),
      expression: "{html: 'Add a photo'}",
      arg: "left"
    }],
    staticClass: "mx-2",
    attrs: {
      "flat": "",
      "icon": ""
    },
    on: {
      "click": _vm.addPhoto
    }
  }, [_c('v-icon', [_vm._v("add_a_photo")])], 1) : _c('v-btn', {
    directives: [{
      name: "tooltip",
      rawName: "v-tooltip:left",
      value: ({
        html: 'Remove photo'
      }),
      expression: "{html: 'Remove photo'}",
      arg: "left"
    }],
    staticClass: "mx-2",
    attrs: {
      "flat": "",
      "icon": ""
    },
    on: {
      "click": _vm.removePhoto
    }
  }, [_c('v-icon', [_vm._v("close")])], 1)], 1), _vm._v(" "), _c('v-card-actions', [_c('v-spacer'), _vm._v(" "), _c('v-btn', {
    staticClass: "primary--text",
    attrs: {
      "type": "button",
      "flat": "flat"
    },
    nativeOn: {
      "click": function($event) {
        _vm.cancelled($event)
      }
    }
  }, [_vm._v("Cancel")]), _vm._v(" "), _c('v-btn', {
    staticClass: "primary",
    attrs: {
      "type": "submit",
      "loading": _vm.posting,
      "disabled": _vm.posting
    }
  }, [_vm._v("Post")])], 1), _vm._v(" "), _c('input', {
    ref: "hiddenFile",
    attrs: {
      "type": "file",
      "name": "fileImage",
      "id": "fileImage"
    },
    on: {
      "change": _vm.onFileChange
    }
  })], 1)])
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-0187857c", module.exports)
  }
}

/***/ }),
/* 263 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', [_c('v-layout', {
    staticClass: "mb-3",
    attrs: {
      "justify-center": ""
    }
  }, [_c('v-flex', {
    attrs: {
      "xs12": "",
      "sm8": "",
      "md6": "",
      "lg5": ""
    }
  }, [_c('div', {
    staticClass: "headline"
  }, [_vm._v("Posts")])])], 1), _vm._v(" "), _c('v-layout', {
    attrs: {
      "wrap": "",
      "justify-center": ""
    }
  }, [_c('v-flex', {
    attrs: {
      "xs12": "",
      "sm8": "",
      "md6": "",
      "lg5": ""
    }
  }, [_c('r-posts', {
    attrs: {
      "posts": _vm.posts
    }
  })], 1)], 1), _vm._v(" "), _c('div', {
    staticClass: "fab-holder"
  }, [_c('v-btn', {
    directives: [{
      name: "tooltip",
      rawName: "v-tooltip:top",
      value: ({
        html: 'new post'
      }),
      expression: "{ html: 'new post' }",
      arg: "top"
    }],
    staticClass: "primary",
    attrs: {
      "dark": "",
      "fab": ""
    },
    nativeOn: {
      "click": function($event) {
        $event.stopPropagation();
        _vm.openNewPost($event)
      }
    }
  }, [_c('v-icon', [_vm._v("add")])], 1)], 1), _vm._v(" "), _c('v-dialog', {
    attrs: {
      "width": "600px"
    },
    model: {
      value: (_vm.newPostModal),
      callback: function($$v) {
        _vm.newPostModal = $$v
      },
      expression: "newPostModal"
    }
  }, [_c('r-add-post', {
    attrs: {
      "clear": _vm.clearNewPost,
      "userImage": "/images/avatar1.jpg"
    },
    on: {
      "canceled": function($event) {
        _vm.newPostModal = false
      },
      "posted": _vm.addPost
    }
  })], 1)], 1)
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-ecf40ec2", module.exports)
  }
}

/***/ }),
/* 264 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(265)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(267),
  /* template */
  __webpack_require__(268),
  /* styles */
  injectStyle,
  /* scopeId */
  "data-v-443779f0",
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/pages/dashboard/screens/messagesScreen.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] messagesScreen.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-443779f0", Component.options)
  } else {
    hotAPI.reload("data-v-443779f0", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 265 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(266);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("3567dce1", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-443779f0\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./messagesScreen.vue", function() {
     var newContent = require("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-443779f0\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./messagesScreen.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 266 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\ndiv[data-v-443779f0] {\n  text-align: center;\n}\nimg[data-v-443779f0] {\n  width: 150px;\n}\nh1[data-v-443779f0] {\n  color: #f00;\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/pages/dashboard/screens/resources/assets/js/pages/dashboard/screens/messagesScreen.vue","/Applications/vue/kelly/resources/assets/js/pages/dashboard/screens/messagesScreen.vue"],"names":[],"mappings":";AAcA;EACI,mBAAA;CCbH;ADgBD;EACI,aAAA;CCdH;ADiBD;EACI,YAAA;CCfH","file":"messagesScreen.vue","sourcesContent":["\n\n\n\n\n\n\n\n\n\n\n\n\n\ndiv {\n    text-align: center\n}\n\nimg {\n    width: 150px\n}\n\nh1 {\n    color: red;\n}\n\n","div {\n  text-align: center;\n}\nimg {\n  width: 150px;\n}\nh1 {\n  color: #f00;\n}\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 267 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({});

/***/ }),
/* 268 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _vm._m(0)
},staticRenderFns: [function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', [_c('img', {
    attrs: {
      "src": "/images/logo.svg",
      "alt": "Vuetify.js"
    }
  }), _vm._v(" "), _c('h1', [_vm._v("Messages Screen")])])
}]}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-443779f0", module.exports)
  }
}

/***/ }),
/* 269 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__pages_auth_screens_loginScreen_vue__ = __webpack_require__(270);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__pages_auth_screens_loginScreen_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__pages_auth_screens_loginScreen_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__pages_auth_screens_registerScreen_vue__ = __webpack_require__(276);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__pages_auth_screens_registerScreen_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__pages_auth_screens_registerScreen_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__store_store__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__store_types__ = __webpack_require__(5);






var confirmAuth = function confirmAuth(to, from, next) {
    if (__WEBPACK_IMPORTED_MODULE_2__store_store__["a" /* default */].getters[__WEBPACK_IMPORTED_MODULE_3__store_types__["a" /* default */].auth.NAME + '/' + __WEBPACK_IMPORTED_MODULE_3__store_types__["a" /* default */].auth.IS_LOGGED_IN]) {
        next({ name: 'dash.home' });
    }
    next();
};

/* harmony default export */ __webpack_exports__["a"] = ([{
    path: '/',
    name: 'auth.login',
    component: __WEBPACK_IMPORTED_MODULE_0__pages_auth_screens_loginScreen_vue___default.a,
    beforeEnter: confirmAuth
}, {
    path: 'register',
    name: 'auth.register',
    component: __WEBPACK_IMPORTED_MODULE_1__pages_auth_screens_registerScreen_vue___default.a,
    beforeEnter: confirmAuth
}]);

/***/ }),
/* 270 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(271)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(273),
  /* template */
  __webpack_require__(275),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/pages/auth/screens/loginScreen.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] loginScreen.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-55ef17da", Component.options)
  } else {
    hotAPI.reload("data-v-55ef17da", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 271 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(272);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("99306852", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-55ef17da\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./loginScreen.vue", function() {
     var newContent = require("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-55ef17da\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./loginScreen.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 272 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n.login-screen {\n  text-align: center;\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/pages/auth/screens/resources/assets/js/pages/auth/screens/loginScreen.vue","/Applications/vue/kelly/resources/assets/js/pages/auth/screens/loginScreen.vue"],"names":[],"mappings":";AAyDA;EACI,mBAAA;CCxDH","file":"loginScreen.vue","sourcesContent":["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n.login-screen {\n    text-align: center;\n    // width: 300px;\n}\n\n",".login-screen {\n  text-align: center;\n}\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 273 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__api_user_js__ = __webpack_require__(274);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__helpers_snackbar_js__ = __webpack_require__(8);
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//




/* harmony default export */ __webpack_exports__["default"] = ({
    data: function data() {
        return {
            e: false,
            user: {
                email: '',
                password: ''
            }
        };
    },

    computed: {
        isPasswordVisible: function isPasswordVisible() {
            return this.e ? 'text' : 'password';
        }
    },
    methods: {
        loginAttempt: function loginAttempt() {
            var _this = this;

            console.log('attempting login');
            console.log(this.user.email);

            __WEBPACK_IMPORTED_MODULE_0__api_user_js__["a" /* default */].attempt(this.user.email, this.user.password).then(function (res) {
                _this.$router.push({ name: 'dash.home' });
            });
        }
    }
});

/***/ }),
/* 274 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__index__ = __webpack_require__(143);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__helpers_snackbar__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__helpers_loader__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__store_store__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__store_types__ = __webpack_require__(5);
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }







var User = function () {
    function User() {
        _classCallCheck(this, User);

        this.model = 'users';
        this.user = null;
        // this.last_fetch = moment();
    }

    _createClass(User, [{
        key: 'attempt',
        value: function attempt(email, password) {
            var _this = this;

            var data = {
                email: email,
                password: password
            };

            return new Promise(function (resolve, reject) {
                __WEBPACK_IMPORTED_MODULE_2__helpers_loader__["a" /* default */].start();

                __WEBPACK_IMPORTED_MODULE_0__index__["a" /* default */].post('login', data).then(function (res) {
                    if (res.status) {
                        __WEBPACK_IMPORTED_MODULE_1__helpers_snackbar__["a" /* default */].fire(res.message);
                        __WEBPACK_IMPORTED_MODULE_3__store_store__["a" /* default */].commit(__WEBPACK_IMPORTED_MODULE_4__store_types__["a" /* default */].auth.NAME + '/' + __WEBPACK_IMPORTED_MODULE_4__store_types__["a" /* default */].auth.USER_LOGIN, res.data);
                        __WEBPACK_IMPORTED_MODULE_2__helpers_loader__["a" /* default */].stop();
                        _this.user = res.data;
                        resolve(res.data);
                    }
                }).catch(function (error) {
                    if (error) {
                        __WEBPACK_IMPORTED_MODULE_1__helpers_snackbar__["a" /* default */].fire(error.data.message, 'warning');
                    } else {
                        __WEBPACK_IMPORTED_MODULE_1__helpers_snackbar__["a" /* default */].fire("something went wrong", 'error');
                    }

                    __WEBPACK_IMPORTED_MODULE_2__helpers_loader__["a" /* default */].stop();
                    reject(error);
                });
            });
        }
    }]);

    return User;
}();

/* harmony default export */ __webpack_exports__["a"] = (new User());

/***/ }),
/* 275 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('v-card', {
    staticClass: "login-screen"
  }, [_c('v-card-text', {
    staticClass: "pa-5 pb-0"
  }, [_c('v-layout', {
    attrs: {
      "column": ""
    }
  }, [_c('form', {
    on: {
      "submit": function($event) {
        $event.preventDefault();
        _vm.loginAttempt($event)
      }
    }
  }, [_c('v-flex', {
    attrs: {
      "xs12": ""
    }
  }, [_c('v-text-field', {
    attrs: {
      "label": "E-Mail",
      "prepend-icon": "email",
      "type": "email"
    },
    model: {
      value: (_vm.user.email),
      callback: function($$v) {
        _vm.user.email = $$v
      },
      expression: "user.email"
    }
  })], 1), _vm._v(" "), _c('v-flex', {
    attrs: {
      "xs12": ""
    }
  }, [_c('v-text-field', {
    attrs: {
      "label": "Password",
      "append-icon": _vm.e ? 'visibility' : 'visibility_off',
      "type": _vm.isPasswordVisible,
      "append-icon-cb": function () { return (_vm.e = !_vm.e); },
      "prepend-icon": "lock"
    },
    model: {
      value: (_vm.user.password),
      callback: function($$v) {
        _vm.user.password = $$v
      },
      expression: "user.password"
    }
  })], 1), _vm._v(" "), _c('v-flex', {
    attrs: {
      "xs12": ""
    }
  }, [_c('v-btn', {
    attrs: {
      "type": "submit",
      "primary": "",
      "large": ""
    }
  }, [_vm._v("Login")])], 1)], 1)])], 1), _vm._v(" "), _c('v-card-text', [_vm._v("\n        Don't have an account? "), _c('router-link', {
    attrs: {
      "to": {
        name: 'auth.register'
      }
    }
  }, [_vm._v("Register")])], 1)], 1)
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-55ef17da", module.exports)
  }
}

/***/ }),
/* 276 */
/***/ (function(module, exports, __webpack_require__) {

var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(277)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(279),
  /* template */
  __webpack_require__(280),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)
Component.options.__file = "/Applications/vue/kelly/resources/assets/js/pages/auth/screens/registerScreen.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] registerScreen.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-18ecbf81", Component.options)
  } else {
    hotAPI.reload("data-v-18ecbf81", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

module.exports = Component.exports


/***/ }),
/* 277 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(278);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("59ecabbb", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-18ecbf81\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./registerScreen.vue", function() {
     var newContent = require("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-18ecbf81\",\"scoped\":false,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./registerScreen.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 278 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n.register-screen {\n  text-align: center;\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/pages/auth/screens/resources/assets/js/pages/auth/screens/registerScreen.vue","/Applications/vue/kelly/resources/assets/js/pages/auth/screens/registerScreen.vue"],"names":[],"mappings":";AA0DA;EACI,mBAAA;CCzDH","file":"registerScreen.vue","sourcesContent":["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n.register-screen {\n    text-align: center\n    // width: 30em\n}\n",".register-screen {\n  text-align: center;\n}\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 279 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({
    data: function data() {
        return {
            e: false,
            user: {
                name: '',
                title: '',
                email: '',
                image: null,
                password: ''
            },
            rules: {
                required: function required(value) {
                    return !!value || 'Required.';
                },
                email: function email(value) {
                    var pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    return pattern.test(value) || 'Invalid e-mail.';
                }
            }
        };
    },

    computed: {
        isPasswordVisible: function isPasswordVisible() {
            return this.e ? 'text' : 'password';
        }
    }

});

/***/ }),
/* 280 */
/***/ (function(module, exports, __webpack_require__) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('v-card', {
    staticClass: "register-screen"
  }, [_c('v-card-text', {
    staticClass: "pa-5"
  }, [_c('v-layout', {
    attrs: {
      "row": "",
      "wrap": ""
    }
  }, [_c('v-flex', {
    attrs: {
      "xs12": ""
    }
  }, [_c('v-text-field', {
    attrs: {
      "label": "Full Name",
      "prepend-icon": "person",
      "required": ""
    },
    model: {
      value: (_vm.user.name),
      callback: function($$v) {
        _vm.user.name = $$v
      },
      expression: "user.name"
    }
  })], 1), _vm._v(" "), _c('v-flex', {
    attrs: {
      "xs12": ""
    }
  }, [_c('v-text-field', {
    attrs: {
      "label": "Short Description",
      "prepend-icon": "speaker_notes",
      "multi-line": "",
      "rows": "2",
      "max": "90",
      "counter": "",
      "required": ""
    },
    model: {
      value: (_vm.user.title),
      callback: function($$v) {
        _vm.user.title = $$v
      },
      expression: "user.title"
    }
  })], 1), _vm._v(" "), _c('v-flex', {
    attrs: {
      "xs12": ""
    }
  }, [_c('v-text-field', {
    attrs: {
      "label": "E-Mail",
      "prepend-icon": "email",
      "required": "",
      "type": "email"
    },
    model: {
      value: (_vm.user.email),
      callback: function($$v) {
        _vm.user.email = $$v
      },
      expression: "user.email"
    }
  })], 1), _vm._v(" "), _c('v-flex', {
    attrs: {
      "xs12": ""
    }
  }, [_c('v-text-field', {
    attrs: {
      "label": "Password",
      "hint": "At least 5 characters",
      "min": 5,
      "append-icon": _vm.e ? 'visibility' : 'visibility_off',
      "type": _vm.isPasswordVisible,
      "append-icon-cb": function () { return (_vm.e = !_vm.e); },
      "prepend-icon": "lock",
      "required": ""
    },
    model: {
      value: (_vm.user.password),
      callback: function($$v) {
        _vm.user.password = $$v
      },
      expression: "user.password"
    }
  })], 1), _vm._v(" "), _c('v-flex', {
    attrs: {
      "xs12": ""
    }
  }, [_c('v-btn', {
    attrs: {
      "primary": "",
      "large": ""
    }
  }, [_vm._v("Register")])], 1)], 1)], 1), _vm._v(" "), _c('v-card-text', [_vm._v("\n        Already have an account? "), _c('router-link', {
    attrs: {
      "to": {
        name: 'auth.login'
      }
    }
  }, [_vm._v("Login")])], 1)], 1)
},staticRenderFns: []}
module.exports.render._withStripped = true
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-18ecbf81", module.exports)
  }
}

/***/ }),
/* 281 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 282 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 283 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ })
],[144]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXIuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXNDbGllbnQuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9zdG9yZS90eXBlcy5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL3N0b3JlLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvaGVscGVycy9zbmFja2Jhci5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2hlbHBlcnMvbG9hZGVyLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvc3RvcmUvbW9kdWxlcy9hdXRoL2F1dGhUeXBlcy5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL21vZHVsZXMvc25hY2tiYXIvc25hY2tiYXJUeXBlcy5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL21vZHVsZXMvcG9zdC9wb3N0VHlwZXMuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9BcHAudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvYXBpL3Bvc3RzLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvYXBpL2luZGV4LmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvYm9vdHN0cmFwLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvc3RvcmUvbW9kdWxlcy9hdXRoL2F1dGhTdG9yZS5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL21vZHVsZXMvc25hY2tiYXIvc25hY2tiYXJTdG9yZS5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL21vZHVsZXMvcG9zdC9wb3N0U3RvcmUuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9yb3V0ZXIvcm91dGVyLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcm91dGVyL3JvdXRlcy5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL0FwcC52dWU/MDFjMCIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL0FwcC52dWU/NjY5ZiIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvbGlzdFRvU3R5bGVzLmpzIiwid2VicGFjazovLy9BcHAudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy90b3BMb2FkZXIudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy90b3BMb2FkZXIudnVlPzExZDkiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL3RvcExvYWRlci52dWU/OTQ3MyIsIndlYnBhY2s6Ly8vdG9wTG9hZGVyLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvdG9wTG9hZGVyLnZ1ZT80MWJhIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy9mdWxsTG9hZGVyLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvZnVsbExvYWRlci52dWU/OGUwYiIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvZnVsbExvYWRlci52dWU/ZmViNCIsIndlYnBhY2s6Ly8vZnVsbExvYWRlci52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL2Z1bGxMb2FkZXIudnVlPzQ5NzYiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL3NuYWNrYmFyLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvc25hY2tiYXIudnVlP2MwODEiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL3NuYWNrYmFyLnZ1ZT8wNTYzIiwid2VicGFjazovLy9zbmFja2Jhci52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL3NuYWNrYmFyLnZ1ZT8xMzY0Iiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvQXBwLnZ1ZT9hMjVkIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvaW5kZXhQYWdlLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2luZGV4UGFnZS52dWU/MzkxZCIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2luZGV4UGFnZS52dWU/MjcyYSIsIndlYnBhY2s6Ly8vaW5kZXhQYWdlLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2luZGV4UGFnZS52dWU/NDc1OCIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvYXV0aFBhZ2UudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9hdXRoUGFnZS52dWU/ZGE1ZiIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvYXV0aFBhZ2UudnVlP2MxODUiLCJ3ZWJwYWNrOi8vL2F1dGhQYWdlLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvYXV0aFBhZ2UudnVlP2E5NzgiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZGFzaGJvYXJkUGFnZS52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZGFzaGJvYXJkUGFnZS52dWU/NWUzYyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9kYXNoYm9hcmRQYWdlLnZ1ZT9jODNiIiwid2VicGFjazovLy9kYXNoYm9hcmRQYWdlLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvc2lkZWJhci52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9sYXlvdXRzL3NpZGViYXIudnVlP2VjNmMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9sYXlvdXRzL3NpZGViYXIudnVlPzRkNDQiLCJ3ZWJwYWNrOi8vL3NpZGViYXIudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy9zaWRlYmFyLnZ1ZT81NzRmIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy90b3BuYXYudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy90b3BuYXYudnVlP2JlNDAiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9sYXlvdXRzL3RvcG5hdi52dWU/YjdhZiIsIndlYnBhY2s6Ly8vdG9wbmF2LnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvdG9wbmF2LnZ1ZT9mNGRkIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy9mb290ZXIudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy9mb290ZXIudnVlPzg4NjkiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9sYXlvdXRzL2Zvb3Rlci52dWU/YjViNiIsIndlYnBhY2s6Ly8vZm9vdGVyLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvZm9vdGVyLnZ1ZT9hZGM2Iiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL2Rhc2hib2FyZFBhZ2UudnVlP2EzMTIiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9yb3V0ZXIvZGFzaGJvYXJkUm91dGVzLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvaG9tZVNjcmVlbi52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9ob21lU2NyZWVuLnZ1ZT82NGNlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvaG9tZVNjcmVlbi52dWU/OTM3MSIsIndlYnBhY2s6Ly8vaG9tZVNjcmVlbi52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9ob21lU2NyZWVuLnZ1ZT8wZTFkIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvcG9zdHNTY3JlZW4udnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvcG9zdHNTY3JlZW4udnVlPzU5ZjgiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9wb3N0c1NjcmVlbi52dWU/OTc0MiIsIndlYnBhY2s6Ly8vcG9zdHNTY3JlZW4udnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdExpc3QudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdExpc3QudnVlP2ZlYWQiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9Qb3N0TGlzdC52dWU/ZDQ2YyIsIndlYnBhY2s6Ly8vUG9zdExpc3QudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdC52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9Qb3N0LnZ1ZT9lMTIzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdC52dWU/OTUxMiIsIndlYnBhY2s6Ly8vUG9zdC52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC91c2Vycy9Vc2VyU21hbGxQcm9maWxlLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3VzZXJzL1VzZXJTbWFsbFByb2ZpbGUudnVlPzEwNjIiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC91c2Vycy9Vc2VyU21hbGxQcm9maWxlLnZ1ZT9mNzAxIiwid2VicGFjazovLy9Vc2VyU21hbGxQcm9maWxlLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3VzZXJzL1VzZXJTbWFsbFByb2ZpbGUudnVlPzNmYzYiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9Db21tZW50TGlzdC52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9Db21tZW50TGlzdC52dWU/YTZiOSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL2NvbW1lbnRzL0NvbW1lbnRMaXN0LnZ1ZT8xZDA0Iiwid2VicGFjazovLy9Db21tZW50TGlzdC52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9Db21tZW50LnZ1ZSIsIndlYnBhY2s6Ly8vQ29tbWVudC52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9Db21tZW50LnZ1ZT85MzY1Iiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvY29tbWVudHMvQWRkQ29tbWVudC52dWUiLCJ3ZWJwYWNrOi8vL0FkZENvbW1lbnQudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvY29tbWVudHMvQWRkQ29tbWVudC52dWU/ZGJkZCIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL2NvbW1lbnRzL0NvbW1lbnRMaXN0LnZ1ZT9hYjU3Iiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdC52dWU/YzgwNCIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL1Bvc3RMaXN0LnZ1ZT9lOGIzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvQWRkUG9zdC52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9BZGRQb3N0LnZ1ZT8wODZlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvQWRkUG9zdC52dWU/NDY3ZSIsIndlYnBhY2s6Ly8vQWRkUG9zdC52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9BZGRQb3N0LnZ1ZT84YjIxIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvcG9zdHNTY3JlZW4udnVlP2UxYWQiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9tZXNzYWdlc1NjcmVlbi52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9tZXNzYWdlc1NjcmVlbi52dWU/NTk3YiIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL21lc3NhZ2VzU2NyZWVuLnZ1ZT8xMjg3Iiwid2VicGFjazovLy9tZXNzYWdlc1NjcmVlbi52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9tZXNzYWdlc1NjcmVlbi52dWU/MWQwNCIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3JvdXRlci9hdXRoUm91dGVzLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9zY3JlZW5zL2xvZ2luU2NyZWVuLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvc2NyZWVucy9sb2dpblNjcmVlbi52dWU/NzcyYyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvc2NyZWVucy9sb2dpblNjcmVlbi52dWU/NjU3NyIsIndlYnBhY2s6Ly8vbG9naW5TY3JlZW4udnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvYXBpL3VzZXIuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvbG9naW5TY3JlZW4udnVlP2JiYjEiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvcmVnaXN0ZXJTY3JlZW4udnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9zY3JlZW5zL3JlZ2lzdGVyU2NyZWVuLnZ1ZT9jOGJjIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9zY3JlZW5zL3JlZ2lzdGVyU2NyZWVuLnZ1ZT84ZWM1Iiwid2VicGFjazovLy9yZWdpc3RlclNjcmVlbi52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvcmVnaXN0ZXJTY3JlZW4udnVlPzRiNDYiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9zdHlsdXMvZW50cnkuc3R5bCIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvbWRpL3Njc3MvbWF0ZXJpYWxkZXNpZ25pY29ucy5zY3NzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvc2Fzcy9hcHAuc2NzcyJdLCJuYW1lcyI6WyJ0IiwiU1RBUlRfTE9BRElORyIsIlNUT1BfTE9BRElORyIsIklTX0xPQURJTkciLCJJU19GVUxMX0xPQURJTkciLCJhdXRoIiwic25hY2tiYXIiLCJwb3N0IiwiVnVlIiwidXNlIiwiVnVleCIsIlN0b3JlIiwibW9kdWxlcyIsIk5BTUUiLCJuYW1lc3BhY2VkIiwic3RhdGUiLCJpc0xvYWRpbmciLCJpc0Z1bGxMb2FkaW5nIiwibXV0YXRpb25zIiwidHlwZXMiLCJwYXlsb2FkIiwiZ2V0dGVycyIsIlNuYWNrYmFyIiwiY29uZmlnIiwibWVzc2FnZSIsInRpbWUiLCJsYWJlbCIsInBvc2l0aW9uIiwiY2xvc2UiLCJjYWxsYmFjayIsImNhbGxiYWNrX2xhYmVsIiwidGV4dCIsImluY2x1ZGVzIiwieSIsIngiLCJfc2V0dXAiLCJzaG93Iiwic3RvcmUiLCJjb21taXQiLCJzdG9yZVR5cGVzIiwiQ0xFQVJfU05BQ0tCQVIiLCJzZXRUaW1lb3V0IiwiTE9BRF9TTkFDS0JBUiIsIkxvYWRlciIsImZ1bGwiLCJVU0VSX0xPR0lOIiwiVVNFUl9MT0dPVVQiLCJHRVRfVVNFUiIsIklTX0xPR0dFRF9JTiIsIkdFVF9NRVNTQUdFIiwiR0VUX01FU1NBR0VfVklTSUJJTElUWSIsIkFERF9ORVdfUE9TVCIsIlJFUExBQ0VfUE9TVFMiLCJHRVRfUE9TVFMiLCJQb3N0IiwibW9kZWwiLCJwb3N0cyIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwibCIsInN0YXJ0IiwiYXBpIiwiZ2V0IiwidGhlbiIsImNvbnNvbGUiLCJsb2ciLCJkYXRhIiwic3RvcCIsImNhdGNoIiwicyIsImZpcmUiLCJlcnJvciIsInNlbmRQIiwidXNlcl9pZCIsInJlcG9ydCIsIm1lZGlhIiwibGluayIsIm5ld1Bvc3QiLCJBcGkiLCJ1cmwiLCJheGlvcyIsInJlc3BvbnNlIiwicmVxdWVzdCIsInJlcXVpcmUiLCJhcHAiLCJlbCIsInJlbmRlciIsImgiLCJyb3V0ZXIiLCJ3aW5kb3ciLCJfIiwibW9tZW50IiwiZGVmYXVsdHMiLCJoZWFkZXJzIiwiY29tbW9uIiwiYmFzZVVSTCIsInRva2VuIiwiZG9jdW1lbnQiLCJoZWFkIiwicXVlcnlTZWxlY3RvciIsImNvbnRlbnQiLCJ1c2VyIiwiaXNMb2dnZWRJbiIsImFjdGlvbnMiLCJoYXNPd25Qcm9wZXJ0eSIsInVuc2hpZnQiLCJtb2RlIiwicm91dGVzIiwiYmVmb3JlRWFjaCIsInRvIiwiZnJvbSIsIm5leHQiLCJwYXRoIiwibmFtZSIsImNvbXBvbmVudCIsIk1haW4iLCJjaGlsZHJlbiIsImJlZm9yZUVudGVyIiwibG9hZGVyIiwiSG9tZSIsInAiLCJnZXRBbGwiLCJNZXNzYWdlcyIsImNvbmZpcm1BdXRoIiwiVXNlciIsImVtYWlsIiwicGFzc3dvcmQiLCJyZXMiLCJzdGF0dXMiXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQyxnQkFBZ0I7QUFDbkQsSUFBSTtBQUNKO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQixpQkFBaUI7QUFD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QUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0gsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEM7Ozs7OztBQy9HQSx5Qzs7Ozs7O0FDQUEseUM7Ozs7OztBQ0FBLHlDIiwiZmlsZSI6Ii9qcy9idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIF9fVlVFX1NTUl9DT05URVhUX18gKi9cblxuLy8gdGhpcyBtb2R1bGUgaXMgYSBydW50aW1lIHV0aWxpdHkgZm9yIGNsZWFuZXIgY29tcG9uZW50IG1vZHVsZSBvdXRwdXQgYW5kIHdpbGxcbi8vIGJlIGluY2x1ZGVkIGluIHRoZSBmaW5hbCB3ZWJwYWNrIHVzZXIgYnVuZGxlXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbm9ybWFsaXplQ29tcG9uZW50IChcbiAgcmF3U2NyaXB0RXhwb3J0cyxcbiAgY29tcGlsZWRUZW1wbGF0ZSxcbiAgaW5qZWN0U3R5bGVzLFxuICBzY29wZUlkLFxuICBtb2R1bGVJZGVudGlmaWVyIC8qIHNlcnZlciBvbmx5ICovXG4pIHtcbiAgdmFyIGVzTW9kdWxlXG4gIHZhciBzY3JpcHRFeHBvcnRzID0gcmF3U2NyaXB0RXhwb3J0cyA9IHJhd1NjcmlwdEV4cG9ydHMgfHwge31cblxuICAvLyBFUzYgbW9kdWxlcyBpbnRlcm9wXG4gIHZhciB0eXBlID0gdHlwZW9mIHJhd1NjcmlwdEV4cG9ydHMuZGVmYXVsdFxuICBpZiAodHlwZSA9PT0gJ29iamVjdCcgfHwgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGVzTW9kdWxlID0gcmF3U2NyaXB0RXhwb3J0c1xuICAgIHNjcmlwdEV4cG9ydHMgPSByYXdTY3JpcHRFeHBvcnRzLmRlZmF1bHRcbiAgfVxuXG4gIC8vIFZ1ZS5leHRlbmQgY29uc3RydWN0b3IgZXhwb3J0IGludGVyb3BcbiAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygc2NyaXB0RXhwb3J0cyA9PT0gJ2Z1bmN0aW9uJ1xuICAgID8gc2NyaXB0RXhwb3J0cy5vcHRpb25zXG4gICAgOiBzY3JpcHRFeHBvcnRzXG5cbiAgLy8gcmVuZGVyIGZ1bmN0aW9uc1xuICBpZiAoY29tcGlsZWRUZW1wbGF0ZSkge1xuICAgIG9wdGlvbnMucmVuZGVyID0gY29tcGlsZWRUZW1wbGF0ZS5yZW5kZXJcbiAgICBvcHRpb25zLnN0YXRpY1JlbmRlckZucyA9IGNvbXBpbGVkVGVtcGxhdGUuc3RhdGljUmVuZGVyRm5zXG4gIH1cblxuICAvLyBzY29wZWRJZFxuICBpZiAoc2NvcGVJZCkge1xuICAgIG9wdGlvbnMuX3Njb3BlSWQgPSBzY29wZUlkXG4gIH1cblxuICB2YXIgaG9va1xuICBpZiAobW9kdWxlSWRlbnRpZmllcikgeyAvLyBzZXJ2ZXIgYnVpbGRcbiAgICBob29rID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICAgIC8vIDIuMyBpbmplY3Rpb25cbiAgICAgIGNvbnRleHQgPVxuICAgICAgICBjb250ZXh0IHx8IC8vIGNhY2hlZCBjYWxsXG4gICAgICAgICh0aGlzLiR2bm9kZSAmJiB0aGlzLiR2bm9kZS5zc3JDb250ZXh0KSB8fCAvLyBzdGF0ZWZ1bFxuICAgICAgICAodGhpcy5wYXJlbnQgJiYgdGhpcy5wYXJlbnQuJHZub2RlICYmIHRoaXMucGFyZW50LiR2bm9kZS5zc3JDb250ZXh0KSAvLyBmdW5jdGlvbmFsXG4gICAgICAvLyAyLjIgd2l0aCBydW5Jbk5ld0NvbnRleHQ6IHRydWVcbiAgICAgIGlmICghY29udGV4dCAmJiB0eXBlb2YgX19WVUVfU1NSX0NPTlRFWFRfXyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgY29udGV4dCA9IF9fVlVFX1NTUl9DT05URVhUX19cbiAgICAgIH1cbiAgICAgIC8vIGluamVjdCBjb21wb25lbnQgc3R5bGVzXG4gICAgICBpZiAoaW5qZWN0U3R5bGVzKSB7XG4gICAgICAgIGluamVjdFN0eWxlcy5jYWxsKHRoaXMsIGNvbnRleHQpXG4gICAgICB9XG4gICAgICAvLyByZWdpc3RlciBjb21wb25lbnQgbW9kdWxlIGlkZW50aWZpZXIgZm9yIGFzeW5jIGNodW5rIGluZmVycmVuY2VcbiAgICAgIGlmIChjb250ZXh0ICYmIGNvbnRleHQuX3JlZ2lzdGVyZWRDb21wb25lbnRzKSB7XG4gICAgICAgIGNvbnRleHQuX3JlZ2lzdGVyZWRDb21wb25lbnRzLmFkZChtb2R1bGVJZGVudGlmaWVyKVxuICAgICAgfVxuICAgIH1cbiAgICAvLyB1c2VkIGJ5IHNzciBpbiBjYXNlIGNvbXBvbmVudCBpcyBjYWNoZWQgYW5kIGJlZm9yZUNyZWF0ZVxuICAgIC8vIG5ldmVyIGdldHMgY2FsbGVkXG4gICAgb3B0aW9ucy5fc3NyUmVnaXN0ZXIgPSBob29rXG4gIH0gZWxzZSBpZiAoaW5qZWN0U3R5bGVzKSB7XG4gICAgaG9vayA9IGluamVjdFN0eWxlc1xuICB9XG5cbiAgaWYgKGhvb2spIHtcbiAgICB2YXIgZnVuY3Rpb25hbCA9IG9wdGlvbnMuZnVuY3Rpb25hbFxuICAgIHZhciBleGlzdGluZyA9IGZ1bmN0aW9uYWxcbiAgICAgID8gb3B0aW9ucy5yZW5kZXJcbiAgICAgIDogb3B0aW9ucy5iZWZvcmVDcmVhdGVcbiAgICBpZiAoIWZ1bmN0aW9uYWwpIHtcbiAgICAgIC8vIGluamVjdCBjb21wb25lbnQgcmVnaXN0cmF0aW9uIGFzIGJlZm9yZUNyZWF0ZSBob29rXG4gICAgICBvcHRpb25zLmJlZm9yZUNyZWF0ZSA9IGV4aXN0aW5nXG4gICAgICAgID8gW10uY29uY2F0KGV4aXN0aW5nLCBob29rKVxuICAgICAgICA6IFtob29rXVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyByZWdpc3RlciBmb3IgZnVuY3Rpb2FsIGNvbXBvbmVudCBpbiB2dWUgZmlsZVxuICAgICAgb3B0aW9ucy5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXJXaXRoU3R5bGVJbmplY3Rpb24gKGgsIGNvbnRleHQpIHtcbiAgICAgICAgaG9vay5jYWxsKGNvbnRleHQpXG4gICAgICAgIHJldHVybiBleGlzdGluZyhoLCBjb250ZXh0KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZXNNb2R1bGU6IGVzTW9kdWxlLFxuICAgIGV4cG9ydHM6IHNjcmlwdEV4cG9ydHMsXG4gICAgb3B0aW9uczogb3B0aW9uc1xuICB9XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplci5qc1xuLy8gbW9kdWxlIGlkID0gMVxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvKlxuXHRNSVQgTGljZW5zZSBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuXHRBdXRob3IgVG9iaWFzIEtvcHBlcnMgQHNva3JhXG4qL1xuLy8gY3NzIGJhc2UgY29kZSwgaW5qZWN0ZWQgYnkgdGhlIGNzcy1sb2FkZXJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odXNlU291cmNlTWFwKSB7XG5cdHZhciBsaXN0ID0gW107XG5cblx0Ly8gcmV0dXJuIHRoZSBsaXN0IG9mIG1vZHVsZXMgYXMgY3NzIHN0cmluZ1xuXHRsaXN0LnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG5cdFx0cmV0dXJuIHRoaXMubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG5cdFx0XHR2YXIgY29udGVudCA9IGNzc1dpdGhNYXBwaW5nVG9TdHJpbmcoaXRlbSwgdXNlU291cmNlTWFwKTtcblx0XHRcdGlmKGl0ZW1bMl0pIHtcblx0XHRcdFx0cmV0dXJuIFwiQG1lZGlhIFwiICsgaXRlbVsyXSArIFwie1wiICsgY29udGVudCArIFwifVwiO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIGNvbnRlbnQ7XG5cdFx0XHR9XG5cdFx0fSkuam9pbihcIlwiKTtcblx0fTtcblxuXHQvLyBpbXBvcnQgYSBsaXN0IG9mIG1vZHVsZXMgaW50byB0aGUgbGlzdFxuXHRsaXN0LmkgPSBmdW5jdGlvbihtb2R1bGVzLCBtZWRpYVF1ZXJ5KSB7XG5cdFx0aWYodHlwZW9mIG1vZHVsZXMgPT09IFwic3RyaW5nXCIpXG5cdFx0XHRtb2R1bGVzID0gW1tudWxsLCBtb2R1bGVzLCBcIlwiXV07XG5cdFx0dmFyIGFscmVhZHlJbXBvcnRlZE1vZHVsZXMgPSB7fTtcblx0XHRmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGlkID0gdGhpc1tpXVswXTtcblx0XHRcdGlmKHR5cGVvZiBpZCA9PT0gXCJudW1iZXJcIilcblx0XHRcdFx0YWxyZWFkeUltcG9ydGVkTW9kdWxlc1tpZF0gPSB0cnVlO1xuXHRcdH1cblx0XHRmb3IoaSA9IDA7IGkgPCBtb2R1bGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgaXRlbSA9IG1vZHVsZXNbaV07XG5cdFx0XHQvLyBza2lwIGFscmVhZHkgaW1wb3J0ZWQgbW9kdWxlXG5cdFx0XHQvLyB0aGlzIGltcGxlbWVudGF0aW9uIGlzIG5vdCAxMDAlIHBlcmZlY3QgZm9yIHdlaXJkIG1lZGlhIHF1ZXJ5IGNvbWJpbmF0aW9uc1xuXHRcdFx0Ly8gIHdoZW4gYSBtb2R1bGUgaXMgaW1wb3J0ZWQgbXVsdGlwbGUgdGltZXMgd2l0aCBkaWZmZXJlbnQgbWVkaWEgcXVlcmllcy5cblx0XHRcdC8vICBJIGhvcGUgdGhpcyB3aWxsIG5ldmVyIG9jY3VyIChIZXkgdGhpcyB3YXkgd2UgaGF2ZSBzbWFsbGVyIGJ1bmRsZXMpXG5cdFx0XHRpZih0eXBlb2YgaXRlbVswXSAhPT0gXCJudW1iZXJcIiB8fCAhYWxyZWFkeUltcG9ydGVkTW9kdWxlc1tpdGVtWzBdXSkge1xuXHRcdFx0XHRpZihtZWRpYVF1ZXJ5ICYmICFpdGVtWzJdKSB7XG5cdFx0XHRcdFx0aXRlbVsyXSA9IG1lZGlhUXVlcnk7XG5cdFx0XHRcdH0gZWxzZSBpZihtZWRpYVF1ZXJ5KSB7XG5cdFx0XHRcdFx0aXRlbVsyXSA9IFwiKFwiICsgaXRlbVsyXSArIFwiKSBhbmQgKFwiICsgbWVkaWFRdWVyeSArIFwiKVwiO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGxpc3QucHVzaChpdGVtKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cdHJldHVybiBsaXN0O1xufTtcblxuZnVuY3Rpb24gY3NzV2l0aE1hcHBpbmdUb1N0cmluZyhpdGVtLCB1c2VTb3VyY2VNYXApIHtcblx0dmFyIGNvbnRlbnQgPSBpdGVtWzFdIHx8ICcnO1xuXHR2YXIgY3NzTWFwcGluZyA9IGl0ZW1bM107XG5cdGlmICghY3NzTWFwcGluZykge1xuXHRcdHJldHVybiBjb250ZW50O1xuXHR9XG5cblx0aWYgKHVzZVNvdXJjZU1hcCAmJiB0eXBlb2YgYnRvYSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHZhciBzb3VyY2VNYXBwaW5nID0gdG9Db21tZW50KGNzc01hcHBpbmcpO1xuXHRcdHZhciBzb3VyY2VVUkxzID0gY3NzTWFwcGluZy5zb3VyY2VzLm1hcChmdW5jdGlvbiAoc291cmNlKSB7XG5cdFx0XHRyZXR1cm4gJy8qIyBzb3VyY2VVUkw9JyArIGNzc01hcHBpbmcuc291cmNlUm9vdCArIHNvdXJjZSArICcgKi8nXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gW2NvbnRlbnRdLmNvbmNhdChzb3VyY2VVUkxzKS5jb25jYXQoW3NvdXJjZU1hcHBpbmddKS5qb2luKCdcXG4nKTtcblx0fVxuXG5cdHJldHVybiBbY29udGVudF0uam9pbignXFxuJyk7XG59XG5cbi8vIEFkYXB0ZWQgZnJvbSBjb252ZXJ0LXNvdXJjZS1tYXAgKE1JVClcbmZ1bmN0aW9uIHRvQ29tbWVudChzb3VyY2VNYXApIHtcblx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG5cdHZhciBiYXNlNjQgPSBidG9hKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShzb3VyY2VNYXApKSkpO1xuXHR2YXIgZGF0YSA9ICdzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04O2Jhc2U2NCwnICsgYmFzZTY0O1xuXG5cdHJldHVybiAnLyojICcgKyBkYXRhICsgJyAqLyc7XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1xuLy8gbW9kdWxlIGlkID0gMlxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvKlxuICBNSVQgTGljZW5zZSBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuICBBdXRob3IgVG9iaWFzIEtvcHBlcnMgQHNva3JhXG4gIE1vZGlmaWVkIGJ5IEV2YW4gWW91IEB5eXg5OTA4MDNcbiovXG5cbnZhciBoYXNEb2N1bWVudCA9IHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCdcblxuaWYgKHR5cGVvZiBERUJVRyAhPT0gJ3VuZGVmaW5lZCcgJiYgREVCVUcpIHtcbiAgaWYgKCFoYXNEb2N1bWVudCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAndnVlLXN0eWxlLWxvYWRlciBjYW5ub3QgYmUgdXNlZCBpbiBhIG5vbi1icm93c2VyIGVudmlyb25tZW50LiAnICtcbiAgICBcIlVzZSB7IHRhcmdldDogJ25vZGUnIH0gaW4geW91ciBXZWJwYWNrIGNvbmZpZyB0byBpbmRpY2F0ZSBhIHNlcnZlci1yZW5kZXJpbmcgZW52aXJvbm1lbnQuXCJcbiAgKSB9XG59XG5cbnZhciBsaXN0VG9TdHlsZXMgPSByZXF1aXJlKCcuL2xpc3RUb1N0eWxlcycpXG5cbi8qXG50eXBlIFN0eWxlT2JqZWN0ID0ge1xuICBpZDogbnVtYmVyO1xuICBwYXJ0czogQXJyYXk8U3R5bGVPYmplY3RQYXJ0PlxufVxuXG50eXBlIFN0eWxlT2JqZWN0UGFydCA9IHtcbiAgY3NzOiBzdHJpbmc7XG4gIG1lZGlhOiBzdHJpbmc7XG4gIHNvdXJjZU1hcDogP3N0cmluZ1xufVxuKi9cblxudmFyIHN0eWxlc0luRG9tID0gey8qXG4gIFtpZDogbnVtYmVyXToge1xuICAgIGlkOiBudW1iZXIsXG4gICAgcmVmczogbnVtYmVyLFxuICAgIHBhcnRzOiBBcnJheTwob2JqPzogU3R5bGVPYmplY3RQYXJ0KSA9PiB2b2lkPlxuICB9XG4qL31cblxudmFyIGhlYWQgPSBoYXNEb2N1bWVudCAmJiAoZG9jdW1lbnQuaGVhZCB8fCBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdKVxudmFyIHNpbmdsZXRvbkVsZW1lbnQgPSBudWxsXG52YXIgc2luZ2xldG9uQ291bnRlciA9IDBcbnZhciBpc1Byb2R1Y3Rpb24gPSBmYWxzZVxudmFyIG5vb3AgPSBmdW5jdGlvbiAoKSB7fVxuXG4vLyBGb3JjZSBzaW5nbGUtdGFnIHNvbHV0aW9uIG9uIElFNi05LCB3aGljaCBoYXMgYSBoYXJkIGxpbWl0IG9uIHRoZSAjIG9mIDxzdHlsZT5cbi8vIHRhZ3MgaXQgd2lsbCBhbGxvdyBvbiBhIHBhZ2VcbnZhciBpc09sZElFID0gdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgL21zaWUgWzYtOV1cXGIvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwYXJlbnRJZCwgbGlzdCwgX2lzUHJvZHVjdGlvbikge1xuICBpc1Byb2R1Y3Rpb24gPSBfaXNQcm9kdWN0aW9uXG5cbiAgdmFyIHN0eWxlcyA9IGxpc3RUb1N0eWxlcyhwYXJlbnRJZCwgbGlzdClcbiAgYWRkU3R5bGVzVG9Eb20oc3R5bGVzKVxuXG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUgKG5ld0xpc3QpIHtcbiAgICB2YXIgbWF5UmVtb3ZlID0gW11cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0eWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGl0ZW0gPSBzdHlsZXNbaV1cbiAgICAgIHZhciBkb21TdHlsZSA9IHN0eWxlc0luRG9tW2l0ZW0uaWRdXG4gICAgICBkb21TdHlsZS5yZWZzLS1cbiAgICAgIG1heVJlbW92ZS5wdXNoKGRvbVN0eWxlKVxuICAgIH1cbiAgICBpZiAobmV3TGlzdCkge1xuICAgICAgc3R5bGVzID0gbGlzdFRvU3R5bGVzKHBhcmVudElkLCBuZXdMaXN0KVxuICAgICAgYWRkU3R5bGVzVG9Eb20oc3R5bGVzKVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZXMgPSBbXVxuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1heVJlbW92ZS5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGRvbVN0eWxlID0gbWF5UmVtb3ZlW2ldXG4gICAgICBpZiAoZG9tU3R5bGUucmVmcyA9PT0gMCkge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRvbVN0eWxlLnBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgZG9tU3R5bGUucGFydHNbal0oKVxuICAgICAgICB9XG4gICAgICAgIGRlbGV0ZSBzdHlsZXNJbkRvbVtkb21TdHlsZS5pZF1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkU3R5bGVzVG9Eb20gKHN0eWxlcyAvKiBBcnJheTxTdHlsZU9iamVjdD4gKi8pIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IHN0eWxlc1tpXVxuICAgIHZhciBkb21TdHlsZSA9IHN0eWxlc0luRG9tW2l0ZW0uaWRdXG4gICAgaWYgKGRvbVN0eWxlKSB7XG4gICAgICBkb21TdHlsZS5yZWZzKytcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZG9tU3R5bGUucGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgZG9tU3R5bGUucGFydHNbal0oaXRlbS5wYXJ0c1tqXSlcbiAgICAgIH1cbiAgICAgIGZvciAoOyBqIDwgaXRlbS5wYXJ0cy5sZW5ndGg7IGorKykge1xuICAgICAgICBkb21TdHlsZS5wYXJ0cy5wdXNoKGFkZFN0eWxlKGl0ZW0ucGFydHNbal0pKVxuICAgICAgfVxuICAgICAgaWYgKGRvbVN0eWxlLnBhcnRzLmxlbmd0aCA+IGl0ZW0ucGFydHMubGVuZ3RoKSB7XG4gICAgICAgIGRvbVN0eWxlLnBhcnRzLmxlbmd0aCA9IGl0ZW0ucGFydHMubGVuZ3RoXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBwYXJ0cyA9IFtdXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGl0ZW0ucGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgcGFydHMucHVzaChhZGRTdHlsZShpdGVtLnBhcnRzW2pdKSlcbiAgICAgIH1cbiAgICAgIHN0eWxlc0luRG9tW2l0ZW0uaWRdID0geyBpZDogaXRlbS5pZCwgcmVmczogMSwgcGFydHM6IHBhcnRzIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlU3R5bGVFbGVtZW50ICgpIHtcbiAgdmFyIHN0eWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbiAgc3R5bGVFbGVtZW50LnR5cGUgPSAndGV4dC9jc3MnXG4gIGhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVFbGVtZW50KVxuICByZXR1cm4gc3R5bGVFbGVtZW50XG59XG5cbmZ1bmN0aW9uIGFkZFN0eWxlIChvYmogLyogU3R5bGVPYmplY3RQYXJ0ICovKSB7XG4gIHZhciB1cGRhdGUsIHJlbW92ZVxuICB2YXIgc3R5bGVFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcignc3R5bGVbZGF0YS12dWUtc3NyLWlkfj1cIicgKyBvYmouaWQgKyAnXCJdJylcblxuICBpZiAoc3R5bGVFbGVtZW50KSB7XG4gICAgaWYgKGlzUHJvZHVjdGlvbikge1xuICAgICAgLy8gaGFzIFNTUiBzdHlsZXMgYW5kIGluIHByb2R1Y3Rpb24gbW9kZS5cbiAgICAgIC8vIHNpbXBseSBkbyBub3RoaW5nLlxuICAgICAgcmV0dXJuIG5vb3BcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaGFzIFNTUiBzdHlsZXMgYnV0IGluIGRldiBtb2RlLlxuICAgICAgLy8gZm9yIHNvbWUgcmVhc29uIENocm9tZSBjYW4ndCBoYW5kbGUgc291cmNlIG1hcCBpbiBzZXJ2ZXItcmVuZGVyZWRcbiAgICAgIC8vIHN0eWxlIHRhZ3MgLSBzb3VyY2UgbWFwcyBpbiA8c3R5bGU+IG9ubHkgd29ya3MgaWYgdGhlIHN0eWxlIHRhZyBpc1xuICAgICAgLy8gY3JlYXRlZCBhbmQgaW5zZXJ0ZWQgZHluYW1pY2FsbHkuIFNvIHdlIHJlbW92ZSB0aGUgc2VydmVyIHJlbmRlcmVkXG4gICAgICAvLyBzdHlsZXMgYW5kIGluamVjdCBuZXcgb25lcy5cbiAgICAgIHN0eWxlRWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHN0eWxlRWxlbWVudClcbiAgICB9XG4gIH1cblxuICBpZiAoaXNPbGRJRSkge1xuICAgIC8vIHVzZSBzaW5nbGV0b24gbW9kZSBmb3IgSUU5LlxuICAgIHZhciBzdHlsZUluZGV4ID0gc2luZ2xldG9uQ291bnRlcisrXG4gICAgc3R5bGVFbGVtZW50ID0gc2luZ2xldG9uRWxlbWVudCB8fCAoc2luZ2xldG9uRWxlbWVudCA9IGNyZWF0ZVN0eWxlRWxlbWVudCgpKVxuICAgIHVwZGF0ZSA9IGFwcGx5VG9TaW5nbGV0b25UYWcuYmluZChudWxsLCBzdHlsZUVsZW1lbnQsIHN0eWxlSW5kZXgsIGZhbHNlKVxuICAgIHJlbW92ZSA9IGFwcGx5VG9TaW5nbGV0b25UYWcuYmluZChudWxsLCBzdHlsZUVsZW1lbnQsIHN0eWxlSW5kZXgsIHRydWUpXG4gIH0gZWxzZSB7XG4gICAgLy8gdXNlIG11bHRpLXN0eWxlLXRhZyBtb2RlIGluIGFsbCBvdGhlciBjYXNlc1xuICAgIHN0eWxlRWxlbWVudCA9IGNyZWF0ZVN0eWxlRWxlbWVudCgpXG4gICAgdXBkYXRlID0gYXBwbHlUb1RhZy5iaW5kKG51bGwsIHN0eWxlRWxlbWVudClcbiAgICByZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBzdHlsZUVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzdHlsZUVsZW1lbnQpXG4gICAgfVxuICB9XG5cbiAgdXBkYXRlKG9iailcblxuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlU3R5bGUgKG5ld09iaiAvKiBTdHlsZU9iamVjdFBhcnQgKi8pIHtcbiAgICBpZiAobmV3T2JqKSB7XG4gICAgICBpZiAobmV3T2JqLmNzcyA9PT0gb2JqLmNzcyAmJlxuICAgICAgICAgIG5ld09iai5tZWRpYSA9PT0gb2JqLm1lZGlhICYmXG4gICAgICAgICAgbmV3T2JqLnNvdXJjZU1hcCA9PT0gb2JqLnNvdXJjZU1hcCkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHVwZGF0ZShvYmogPSBuZXdPYmopXG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZSgpXG4gICAgfVxuICB9XG59XG5cbnZhciByZXBsYWNlVGV4dCA9IChmdW5jdGlvbiAoKSB7XG4gIHZhciB0ZXh0U3RvcmUgPSBbXVxuXG4gIHJldHVybiBmdW5jdGlvbiAoaW5kZXgsIHJlcGxhY2VtZW50KSB7XG4gICAgdGV4dFN0b3JlW2luZGV4XSA9IHJlcGxhY2VtZW50XG4gICAgcmV0dXJuIHRleHRTdG9yZS5maWx0ZXIoQm9vbGVhbikuam9pbignXFxuJylcbiAgfVxufSkoKVxuXG5mdW5jdGlvbiBhcHBseVRvU2luZ2xldG9uVGFnIChzdHlsZUVsZW1lbnQsIGluZGV4LCByZW1vdmUsIG9iaikge1xuICB2YXIgY3NzID0gcmVtb3ZlID8gJycgOiBvYmouY3NzXG5cbiAgaWYgKHN0eWxlRWxlbWVudC5zdHlsZVNoZWV0KSB7XG4gICAgc3R5bGVFbGVtZW50LnN0eWxlU2hlZXQuY3NzVGV4dCA9IHJlcGxhY2VUZXh0KGluZGV4LCBjc3MpXG4gIH0gZWxzZSB7XG4gICAgdmFyIGNzc05vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjc3MpXG4gICAgdmFyIGNoaWxkTm9kZXMgPSBzdHlsZUVsZW1lbnQuY2hpbGROb2Rlc1xuICAgIGlmIChjaGlsZE5vZGVzW2luZGV4XSkgc3R5bGVFbGVtZW50LnJlbW92ZUNoaWxkKGNoaWxkTm9kZXNbaW5kZXhdKVxuICAgIGlmIChjaGlsZE5vZGVzLmxlbmd0aCkge1xuICAgICAgc3R5bGVFbGVtZW50Lmluc2VydEJlZm9yZShjc3NOb2RlLCBjaGlsZE5vZGVzW2luZGV4XSlcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGVFbGVtZW50LmFwcGVuZENoaWxkKGNzc05vZGUpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGFwcGx5VG9UYWcgKHN0eWxlRWxlbWVudCwgb2JqKSB7XG4gIHZhciBjc3MgPSBvYmouY3NzXG4gIHZhciBtZWRpYSA9IG9iai5tZWRpYVxuICB2YXIgc291cmNlTWFwID0gb2JqLnNvdXJjZU1hcFxuXG4gIGlmIChtZWRpYSkge1xuICAgIHN0eWxlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ21lZGlhJywgbWVkaWEpXG4gIH1cblxuICBpZiAoc291cmNlTWFwKSB7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIuY2hyb21lLmNvbS9kZXZ0b29scy9kb2NzL2phdmFzY3JpcHQtZGVidWdnaW5nXG4gICAgLy8gdGhpcyBtYWtlcyBzb3VyY2UgbWFwcyBpbnNpZGUgc3R5bGUgdGFncyB3b3JrIHByb3Blcmx5IGluIENocm9tZVxuICAgIGNzcyArPSAnXFxuLyojIHNvdXJjZVVSTD0nICsgc291cmNlTWFwLnNvdXJjZXNbMF0gKyAnICovJ1xuICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzI2NjAzODc1XG4gICAgY3NzICs9ICdcXG4vKiMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LCcgKyBidG9hKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShzb3VyY2VNYXApKSkpICsgJyAqLydcbiAgfVxuXG4gIGlmIChzdHlsZUVsZW1lbnQuc3R5bGVTaGVldCkge1xuICAgIHN0eWxlRWxlbWVudC5zdHlsZVNoZWV0LmNzc1RleHQgPSBjc3NcbiAgfSBlbHNlIHtcbiAgICB3aGlsZSAoc3R5bGVFbGVtZW50LmZpcnN0Q2hpbGQpIHtcbiAgICAgIHN0eWxlRWxlbWVudC5yZW1vdmVDaGlsZChzdHlsZUVsZW1lbnQuZmlyc3RDaGlsZClcbiAgICB9XG4gICAgc3R5bGVFbGVtZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzcykpXG4gIH1cbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1xuLy8gbW9kdWxlIGlkID0gM1xuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJpbXBvcnQgKiBhcyBhdXRoIGZyb20gJy4vbW9kdWxlcy9hdXRoL2F1dGhUeXBlcyc7XG5pbXBvcnQgKiBhcyBzbmFja2JhciBmcm9tICcuL21vZHVsZXMvc25hY2tiYXIvc25hY2tiYXJUeXBlcyc7XG5pbXBvcnQgKiBhcyBwb3N0IGZyb20gJy4vbW9kdWxlcy9wb3N0L3Bvc3RUeXBlcyc7XG5cbmNvbnN0IHQgPSB7XG4gICAgU1RBUlRfTE9BRElORzogXCJTVEFSVF9MT0FESU5HXCIsXG4gICAgU1RPUF9MT0FESU5HOiBcIlNUT1BfTE9BRElOR1wiLFxuXG4gICAgLy8gZ2V0dGVyc1xuICAgIElTX0xPQURJTkc6IFwiSVNfTE9BRElOR1wiLFxuICAgIElTX0ZVTExfTE9BRElORzogXCJJU19GVUxMX0xPQURJTkdcIlxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgYXV0aCxcbiAgICBzbmFja2JhcixcbiAgICBwb3N0LFxuICAgIC4uLnRcbn1cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL3R5cGVzLmpzIiwiaW1wb3J0IFZ1ZSBmcm9tICd2dWUnO1xuaW1wb3J0IFZ1ZXggZnJvbSAndnVleCc7XG5cbmltcG9ydCBhdXRoIGZyb20gJ0Avc3RvcmUvbW9kdWxlcy9hdXRoL2F1dGhTdG9yZSc7XG5pbXBvcnQgc25hY2tiYXIgZnJvbSAnQC9zdG9yZS9tb2R1bGVzL3NuYWNrYmFyL3NuYWNrYmFyU3RvcmUnO1xuaW1wb3J0IHBvc3QgZnJvbSAnQC9zdG9yZS9tb2R1bGVzL3Bvc3QvcG9zdFN0b3JlJztcblxuaW1wb3J0IHR5cGVzIGZyb20gJy4vdHlwZXMnO1xuXG5WdWUudXNlKFZ1ZXgpO1xuXG5leHBvcnQgZGVmYXVsdCBuZXcgVnVleC5TdG9yZSh7XG4gICAgLy8gc3RyaWN0OiB0cnVlLFxuICAgIG1vZHVsZXM6IHtcbiAgICAgICAgW2F1dGguTkFNRV06IHtcbiAgICAgICAgICAgIG5hbWVzcGFjZWQ6IHRydWUsXG4gICAgICAgICAgICAuLi5hdXRoXG4gICAgICAgIH0sXG4gICAgICAgIFtzbmFja2Jhci5OQU1FXToge1xuICAgICAgICAgICAgbmFtZXNwYWNlZDogdHJ1ZSxcbiAgICAgICAgICAgIC4uLnNuYWNrYmFyXG4gICAgICAgIH0sXG4gICAgICAgIFtwb3N0Lk5BTUVdOiB7XG4gICAgICAgICAgICBuYW1lc3BhY2VkOiB0cnVlLFxuICAgICAgICAgICAgLi4ucG9zdFxuICAgICAgICB9XG4gICAgfSxcbiAgICBzdGF0ZToge1xuICAgICAgICBpc0xvYWRpbmc6IGZhbHNlLFxuICAgICAgICBpc0Z1bGxMb2FkaW5nOiBmYWxzZSxcbiAgICB9LFxuICAgIG11dGF0aW9uczoge1xuICAgICAgICBbdHlwZXMuU1RBUlRfTE9BRElOR106IChzdGF0ZSwgcGF5bG9hZCkgPT4ge1xuICAgICAgICAgICAgaWYgKHBheWxvYWQgPT0gJ2Z1bGwnKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUuaXNGdWxsTG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0YXRlLmlzTG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFt0eXBlcy5TVE9QX0xPQURJTkddOiAoc3RhdGUpID0+IHtcbiAgICAgICAgICAgIHN0YXRlLmlzTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgc3RhdGUuaXNGdWxsTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBnZXR0ZXJzOiB7XG4gICAgICAgIFt0eXBlcy5JU19MT0FESU5HXTogc3RhdGUgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHN0YXRlLmlzTG9hZGluZztcbiAgICAgICAgfSxcbiAgICAgICAgW3R5cGVzLklTX0ZVTExfTE9BRElOR106IHN0YXRlID0+IHtcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZS5pc0Z1bGxMb2FkaW5nO1xuICAgICAgICB9XG4gICAgfVxufSlcblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL3N0b3JlLmpzIiwiaW1wb3J0IHN0b3JlIGZyb20gJy4vLi4vc3RvcmUvc3RvcmUnO1xuaW1wb3J0IHN0b3JlVHlwZXMgZnJvbSAnLi8uLi9zdG9yZS90eXBlcyc7XG5cbmNsYXNzIFNuYWNrYmFyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBudWxsO1xuICAgIH1cblxuICAgIF9zZXR1cChtZXNzYWdlLCB0aW1lLCBsYWJlbCwgcG9zaXRpb24sIGNsb3NlLCBjYWxsYmFjaywgY2FsbGJhY2tfbGFiZWwpIHtcbiAgICAgICAgbGV0IGNvbmZpZyA9IHtcbiAgICAgICAgICAgIHRleHQ6IG1lc3NhZ2UsXG4gICAgICAgICAgICBwb3NpdGlvbjoge31cbiAgICAgICAgfTtcbiAgICAgICAgY29uZmlnLnRpbWUgPSB0aW1lIHx8IG51bGw7XG4gICAgICAgIGNvbmZpZy5sYWJlbCA9IGxhYmVsIHx8IG51bGw7XG4gICAgICAgIGNvbmZpZy5jbG9zZSA9IGNsb3NlO1xuICAgICAgICBjb25maWcuY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBudWxsO1xuICAgICAgICBjb25maWcuY2FsbGJhY2tfbGFiZWwgPSBjYWxsYmFja19sYWJlbCB8fCBudWxsO1xuXG4gICAgICAgIGlmIChwb3NpdGlvbi5pbmNsdWRlcygndG9wJykpIHtcbiAgICAgICAgICAgIGNvbmZpZy5wb3NpdGlvbi55ID0gJ3RvcCc7XG4gICAgICAgIH0gZWxzZSBpZiAocG9zaXRpb24uaW5jbHVkZXMoJ2JvdHRvbScpKSB7XG4gICAgICAgICAgICBjb25maWcucG9zaXRpb24ueSA9ICdib3R0b20nO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uLmluY2x1ZGVzKCdyaWdodCcpKSB7XG4gICAgICAgICAgICBjb25maWcucG9zaXRpb24ueCA9ICdyaWdodCc7XG4gICAgICAgIH0gZWxzZSBpZiAocG9zaXRpb24uaW5jbHVkZXMoJ2xlZnQnKSkge1xuICAgICAgICAgICAgY29uZmlnLnBvc2l0aW9uLnggPSAnbGVmdCc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgIH1cblxuICAgIGZpcmUobWVzc2FnZSwgbGFiZWwgPSBudWxsLCB0aW1lID0gbnVsbCwgcG9zaXRpb24gPSAndG9wJywgY2xvc2UgPSBudWxsLCBjYWxsYmFjayA9IG51bGwsIGNhbGxiYWNrX2xhYmVsID0gbnVsbCkge1xuICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uIHx8ICd0b3AnO1xuXG4gICAgICAgIHRoaXMuY29uZmlnID0gdGhpcy5fc2V0dXAobWVzc2FnZSwgdGltZSwgbGFiZWwsIHBvc2l0aW9uLCBjbG9zZSwgY2FsbGJhY2ssIGNhbGxiYWNrX2xhYmVsKTtcbiAgICAgICAgdGhpcy5zaG93KCk7XG4gICAgfVxuXG4gICAgc2hvdygpIHtcbiAgICAgICAgc3RvcmUuY29tbWl0KHN0b3JlVHlwZXMuc25hY2tiYXIuTkFNRSArICcvJyArIHN0b3JlVHlwZXMuc25hY2tiYXIuQ0xFQVJfU05BQ0tCQVIpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcblxuICAgICAgICAgICAgc3RvcmUuY29tbWl0KFxuICAgICAgICAgICAgICAgIHN0b3JlVHlwZXMuc25hY2tiYXIuTkFNRSArICcvJyArIHN0b3JlVHlwZXMuc25hY2tiYXIuTE9BRF9TTkFDS0JBUixcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfSwgNTAwKVxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IFNuYWNrYmFyKCk7XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9oZWxwZXJzL3NuYWNrYmFyLmpzIiwiaW1wb3J0IHN0b3JlIGZyb20gJy4vLi4vc3RvcmUvc3RvcmUnO1xuaW1wb3J0IHN0b3JlVHlwZXMgZnJvbSAnLi8uLi9zdG9yZS90eXBlcyc7XG5cbmNsYXNzIExvYWRlciB7XG4gICAgc3RhcnQoZnVsbCA9IGZhbHNlKSB7XG4gICAgICAgIHN0b3JlLmNvbW1pdChcbiAgICAgICAgICAgIHN0b3JlVHlwZXMuU1RBUlRfTE9BRElORyxcbiAgICAgICAgICAgIGZ1bGxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBzdG9wKCkge1xuICAgICAgICBzdG9yZS5jb21taXQoc3RvcmVUeXBlcy5TVE9QX0xPQURJTkcpO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IExvYWRlcigpO1xuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvaGVscGVycy9sb2FkZXIuanMiLCJleHBvcnQgY29uc3QgTkFNRSA9ICdBVVRIJztcblxuZXhwb3J0IGNvbnN0IFVTRVJfTE9HSU4gPSAnVVNFUl9MT0dJTic7XG5leHBvcnQgY29uc3QgVVNFUl9MT0dPVVQgPSAnVVNFUl9MT0dPVVQnO1xuXG5leHBvcnQgY29uc3QgR0VUX1VTRVIgPSAnR0VUX1VTRVInO1xuZXhwb3J0IGNvbnN0IElTX0xPR0dFRF9JTiA9ICdJU19MT0dHRURfSU4nO1xuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvc3RvcmUvbW9kdWxlcy9hdXRoL2F1dGhUeXBlcy5qcyIsImV4cG9ydCBjb25zdCBOQU1FID0gJ1NOQUNLQkFSJztcblxuLy9HRVRURVJTXG5leHBvcnQgY29uc3QgR0VUX01FU1NBR0UgPSAnR0VUX01FU1NBR0UnO1xuZXhwb3J0IGNvbnN0IEdFVF9NRVNTQUdFX1ZJU0lCSUxJVFkgPSAnR0VUX01FU1NBR0VfVklTSUJJTElUWSc7XG5cbmV4cG9ydCBjb25zdCBMT0FEX1NOQUNLQkFSID0gJ0xPQURfU05BQ0tCQVInO1xuZXhwb3J0IGNvbnN0IENMRUFSX1NOQUNLQkFSID0gJ0NMRUFSX1NOQUNLQkFSJztcblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL21vZHVsZXMvc25hY2tiYXIvc25hY2tiYXJUeXBlcy5qcyIsImV4cG9ydCBjb25zdCBOQU1FID0gJ1BPU1QnO1xuXG5leHBvcnQgY29uc3QgQUREX05FV19QT1NUID0gJ0FERF9ORVdfUE9TVCc7XG5leHBvcnQgY29uc3QgUkVQTEFDRV9QT1NUUyA9ICdSRVBMQUNFX1BPU1RTJztcblxuZXhwb3J0IGNvbnN0IEdFVF9QT1NUUyA9ICdHRVRfUE9TVFMnO1xuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvc3RvcmUvbW9kdWxlcy9wb3N0L3Bvc3RUeXBlcy5qcyIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG5mdW5jdGlvbiBpbmplY3RTdHlsZSAoc3NyQ29udGV4dCkge1xuICBpZiAoZGlzcG9zZWQpIHJldHVyblxuICByZXF1aXJlKFwiISF2dWUtc3R5bGUtbG9hZGVyIWNzcy1sb2FkZXI/c291cmNlTWFwIS4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleD97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtOWM5NWUzZTJcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hc3R5bHVzLWxvYWRlciEuLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL0FwcC52dWVcIilcbn1cbnZhciBDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplclwiKShcbiAgLyogc2NyaXB0ICovXG4gIHJlcXVpcmUoXCIhIWJhYmVsLWxvYWRlcj97XFxcImNhY2hlRGlyZWN0b3J5XFxcIjp0cnVlLFxcXCJwcmVzZXRzXFxcIjpbW1xcXCJlbnZcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2UsXFxcInRhcmdldHNcXFwiOntcXFwiYnJvd3NlcnNcXFwiOltcXFwiPiAyJVxcXCJdLFxcXCJ1Z2xpZnlcXFwiOnRydWV9fV0sW1xcXCJlczIwMTVcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2V9XSxbXFxcInN0YWdlLTJcXFwiXV19IS4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vQXBwLnZ1ZVwiKSxcbiAgLyogdGVtcGxhdGUgKi9cbiAgcmVxdWlyZShcIiEhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyL2luZGV4P3tcXFwiaWRcXFwiOlxcXCJkYXRhLXYtOWM5NWUzZTJcXFwiLFxcXCJoYXNTY29wZWRcXFwiOnRydWV9IS4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9BcHAudnVlXCIpLFxuICAvKiBzdHlsZXMgKi9cbiAgaW5qZWN0U3R5bGUsXG4gIC8qIHNjb3BlSWQgKi9cbiAgXCJkYXRhLXYtOWM5NWUzZTJcIixcbiAgLyogbW9kdWxlSWRlbnRpZmllciAoc2VydmVyIG9ubHkpICovXG4gIG51bGxcbilcbkNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9BcHAudnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSBBcHAudnVlOiBmdW5jdGlvbmFsIGNvbXBvbmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0ZW1wbGF0ZXMsIHRoZXkgc2hvdWxkIHVzZSByZW5kZXIgZnVuY3Rpb25zLlwiKX1cblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LTljOTVlM2UyXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtOWM5NWUzZTJcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvQXBwLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMTQxXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsImltcG9ydCBhcGkgZnJvbSAnLi9pbmRleCc7XG5pbXBvcnQgcyBmcm9tICcuLy4uL2hlbHBlcnMvc25hY2tiYXInO1xuaW1wb3J0IGwgZnJvbSAnLi8uLi9oZWxwZXJzL2xvYWRlcic7XG5pbXBvcnQgc3RvcmUgZnJvbSAnLi8uLi9zdG9yZS9zdG9yZSc7XG5pbXBvcnQgdHlwZXMgZnJvbSAnLi8uLi9zdG9yZS90eXBlcyc7XG5cbmNsYXNzIFBvc3Qge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubW9kZWwgPSAncG9zdHMnO1xuICAgICAgICB0aGlzLnBvc3RzID0gW107XG4gICAgICAgIC8vIHRoaXMubGFzdF9mZXRjaCA9IG1vbWVudCgpO1xuICAgIH1cblxuICAgIGdldEFsbCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGwuc3RhcnQoKTtcbiAgICAgICAgICAgIGFwaS5nZXQodGhpcy5tb2RlbClcbiAgICAgICAgICAgICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9zdHMgPSBkYXRhO1xuICAgICAgICAgICAgICAgICAgICBzdG9yZS5jb21taXQodHlwZXMucG9zdC5OQU1FICsgJy8nICsgdHlwZXMucG9zdC5SRVBMQUNFX1BPU1RTLCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgbC5zdG9wKCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzLmZpcmUoXCJTb21ldGhpbmcgd2VudCB3cm9uZ1wiLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgbC5zdG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGFkZFBvc3QocG9zdCkge1xuICAgICAgICBsZXQgc2VuZFAgPSB7XG4gICAgICAgICAgICB1c2VyX2lkOiAxLFxuICAgICAgICAgICAgdGV4dDogcG9zdC50ZXh0LFxuICAgICAgICAgICAgcmVwb3J0OiBwb3N0LnJlcG9ydCxcbiAgICAgICAgfVxuICAgICAgICBpZiAocG9zdC5tZWRpYSkge1xuICAgICAgICAgICAgc2VuZFAubWVkaWEgPSBwb3N0Lm1lZGlhLmxpbmtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBsLnN0YXJ0KCk7XG4gICAgICAgICAgICBhcGkucG9zdCh0aGlzLm1vZGVsLCBzZW5kUClcbiAgICAgICAgICAgICAgICAudGhlbihuZXdQb3N0ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmUuY29tbWl0KHR5cGVzLnBvc3QuTkFNRSArICcvJyArIHR5cGVzLnBvc3QuQUREX05FV19QT1NULCBuZXdQb3N0KTtcbiAgICAgICAgICAgICAgICAgICAgbC5zdG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobmV3UG9zdCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzLmZpcmUoXCJTb21ldGhpbmcgd2VudCB3cm9uZ1wiLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgbC5zdG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG5cblxufVxuXG5leHBvcnQgZGVmYXVsdCBuZXcgUG9zdCgpO1xuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvYXBpL3Bvc3RzLmpzIiwiY2xhc3MgQXBpIHtcblxuICAgIGdldCh1cmwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGF4aW9zLmdldCh1cmwpXG4gICAgICAgICAgICAgICAgLnRoZW4oKHsgZGF0YSB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKHsgcmVzcG9uc2UgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgcG9zdCh1cmwsIGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGF4aW9zLnBvc3QodXJsLCBkYXRhKVxuICAgICAgICAgICAgICAgIC50aGVuKCh7IGRhdGEgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yLnJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IucmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVycm9yLnJlcXVlc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvci5yZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IEFwaTtcblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2FwaS9pbmRleC5qcyIsInJlcXVpcmUoJy4vYm9vdHN0cmFwJyk7XG5cbmltcG9ydCBWdWUgZnJvbSAndnVlJztcbmltcG9ydCBWdWV4IGZyb20gJ3Z1ZXgnO1xuaW1wb3J0IFZ1ZVJvdXRlciBmcm9tICd2dWUtcm91dGVyJ1xuaW1wb3J0IFZ1ZXRpZnkgZnJvbSAndnVldGlmeSc7XG5cblZ1ZS51c2UoVnVldGlmeSk7XG5cbmltcG9ydCBzdG9yZSBmcm9tICcuL3N0b3JlL3N0b3JlJztcbmltcG9ydCByb3V0ZXIgZnJvbSAnLi9yb3V0ZXIvcm91dGVyJztcbmltcG9ydCBBcHAgZnJvbSAnLi9BcHAudnVlJztcblxuY29uc3QgYXBwID0gbmV3IFZ1ZSh7XG4gICAgZWw6ICcjYXBwJyxcbiAgICByZW5kZXI6IGggPT4gaChBcHApLFxuICAgIHJvdXRlcixcbiAgICBzdG9yZSxcbn0pO1xuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvYXBwLmpzIiwid2luZG93Ll8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxud2luZG93Lm1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuXG53aW5kb3cuYXhpb3MgPSByZXF1aXJlKCdheGlvcycpO1xud2luZG93LmF4aW9zLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydYLVJlcXVlc3RlZC1XaXRoJ10gPSAnWE1MSHR0cFJlcXVlc3QnO1xud2luZG93LmF4aW9zLmRlZmF1bHRzLmJhc2VVUkwgPSAnaHR0cDovL2xvY2FsaG9zdDo4MDAwL2FwaSc7XG5cbmxldCB0b2tlbiA9IGRvY3VtZW50LmhlYWQucXVlcnlTZWxlY3RvcignbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpO1xuaWYgKHRva2VuKSB7XG4gICAgd2luZG93LmF4aW9zLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydYLUNTUkYtVE9LRU4nXSA9IHRva2VuLmNvbnRlbnQ7XG59IGVsc2Uge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0NTUkYgdG9rZW4gbm90IGZvdW5kOiBodHRwczovL2xhcmF2ZWwuY29tL2RvY3MvY3NyZiNjc3JmLXgtY3NyZi10b2tlbicpO1xufVxuXG4vL0xvYWQgbXkgYmFzZSBzdHlsZXMgW11cbi8vIHJlcXVpcmUoJy4vLi4vc2Fzcy9hcHAuc2NzcycpO1xuXG4vKipcbiAqIEVjaG8gZXhwb3NlcyBhbiBleHByZXNzaXZlIEFQSSBmb3Igc3Vic2NyaWJpbmcgdG8gY2hhbm5lbHMgYW5kIGxpc3RlbmluZ1xuICogZm9yIGV2ZW50cyB0aGF0IGFyZSBicm9hZGNhc3QgYnkgTGFyYXZlbC4gRWNobyBhbmQgZXZlbnQgYnJvYWRjYXN0aW5nXG4gKiBhbGxvd3MgeW91ciB0ZWFtIHRvIGVhc2lseSBidWlsZCByb2J1c3QgcmVhbC10aW1lIHdlYiBhcHBsaWNhdGlvbnMuXG4gKi9cblxuLy8gaW1wb3J0IEVjaG8gZnJvbSAnbGFyYXZlbC1lY2hvJ1xuXG4vLyB3aW5kb3cuUHVzaGVyID0gcmVxdWlyZSgncHVzaGVyLWpzJyk7XG5cbi8vIHdpbmRvdy5FY2hvID0gbmV3IEVjaG8oe1xuLy8gICAgIGJyb2FkY2FzdGVyOiAncHVzaGVyJyxcbi8vICAgICBrZXk6ICd5b3VyLXB1c2hlci1rZXknXG4vLyB9KTtcblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2Jvb3RzdHJhcC5qcyIsImltcG9ydCAqIGFzIHR5cGVzIGZyb20gJy4vYXV0aFR5cGVzJztcbmNvbnN0IE5BTUUgPSB0eXBlcy5OQU1FO1xuXG5jb25zdCBzdGF0ZSA9IHtcbiAgICB1c2VyOiB7fSxcbiAgICBpc0xvZ2dlZEluOiBmYWxzZSxcbn1cblxuY29uc3QgbXV0YXRpb25zID0ge1xuICAgIFt0eXBlcy5VU0VSX0xPR0lOXTogKHN0YXRlLCB1c2VyKSA9PiB7XG4gICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICBzdGF0ZS51c2VyID0gdXNlclxuICAgICAgICB9XG4gICAgICAgIHN0YXRlLmlzTG9nZ2VkSW4gPSB0cnVlO1xuICAgIH0sXG4gICAgW3R5cGVzLlVTRVJfTE9HT1VUXTogKHN0YXRlKSA9PiB7XG4gICAgICAgIHN0YXRlLnVzZXIgPSB7fTtcbiAgICAgICAgc3RhdGUuaXNMb2dnZWRJbiA9IGZhbHNlO1xuICAgIH1cbn1cblxuY29uc3QgYWN0aW9ucyA9IHtcbiAgICBbdHlwZXMuVVNFUl9MT0dJTl06ICh7IGNvbW1pdCB9LCB1c2VyKSA9PiB7XG4gICAgICAgIHVzZXIgPyB1c2VyIDoge307XG4gICAgICAgIGNvbW1pdCh0eXBlcy5VU0VSX0xPR0lOLCB1c2VyKTtcbiAgICB9LFxuICAgIFt0eXBlcy5VU0VSX0xPR09VVF06ICh7IGNvbW1pdCB9KSA9PiB7XG4gICAgICAgIGNvbW1pdCh0eXBlcy5VU0VSX0xPR09VVCk7XG4gICAgfVxufVxuXG5jb25zdCBnZXR0ZXJzID0ge1xuICAgIFt0eXBlcy5HRVRfVVNFUl06IHN0YXRlID0+IHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLnVzZXI7XG4gICAgfSxcbiAgICBbdHlwZXMuSVNfTE9HR0VEX0lOXTogc3RhdGUgPT4ge1xuICAgICAgICByZXR1cm4gc3RhdGUuaXNMb2dnZWRJbjtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBzdGF0ZSxcbiAgICBtdXRhdGlvbnMsXG4gICAgYWN0aW9ucyxcbiAgICBnZXR0ZXJzLFxuICAgIE5BTUVcbn1cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL21vZHVsZXMvYXV0aC9hdXRoU3RvcmUuanMiLCJpbXBvcnQgKiBhcyB0eXBlcyBmcm9tIFwiLi9zbmFja2JhclR5cGVzXCI7XG5jb25zdCBOQU1FID0gdHlwZXMuTkFNRTtcblxuY29uc3Qgc3RhdGUgPSB7XG4gICAgbWVzc2FnZToge1xuICAgICAgICB0ZXh0OiAnJyxcbiAgICAgICAgc2hvdzogZmFsc2UsXG4gICAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgICAgICB5OiAndG9wJyxcbiAgICAgICAgICAgIHg6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICBsYWJlbDogZmFsc2UsXG4gICAgICAgIHRpbWU6IDYwMDAsXG4gICAgICAgIGNhbGxiYWNrOiBmYWxzZSxcbiAgICAgICAgY2FsbGJhY2tfbGFiZWw6ICdDTE9TRScsXG4gICAgICAgIGNsb3NlOiB0cnVlLFxuICAgIH1cbn1cblxuY29uc3QgbXV0YXRpb25zID0ge1xuICAgIFt0eXBlcy5MT0FEX1NOQUNLQkFSXTogKHN0YXRlLCBwYXlsb2FkKSA9PiB7XG4gICAgICAgIHN0YXRlLm1lc3NhZ2Uuc2hvdyA9IHRydWU7XG4gICAgICAgIHN0YXRlLm1lc3NhZ2UudGV4dCA9IHBheWxvYWQudGV4dDtcblxuICAgICAgICBpZiAocGF5bG9hZC5sYWJlbClcbiAgICAgICAgICAgIHN0YXRlLm1lc3NhZ2UubGFiZWwgPSBwYXlsb2FkLmxhYmVsO1xuXG4gICAgICAgIGlmIChwYXlsb2FkLnBvc2l0aW9uLnkpXG4gICAgICAgICAgICBzdGF0ZS5tZXNzYWdlLnBvc2l0aW9uLnkgPSBwYXlsb2FkLnBvc2l0aW9uLnk7XG5cbiAgICAgICAgaWYgKHBheWxvYWQucG9zaXRpb24ueClcbiAgICAgICAgICAgIHN0YXRlLm1lc3NhZ2UucG9zaXRpb24ueCA9IHBheWxvYWQucG9zaXRpb24ueDtcblxuICAgICAgICBpZiAocGF5bG9hZC50aW1lKVxuICAgICAgICAgICAgc3RhdGUubWVzc2FnZS50aW1lID0gcGF5bG9hZC50aW1lO1xuXG4gICAgICAgIGlmIChwYXlsb2FkLmNhbGxiYWNrKVxuICAgICAgICAgICAgc3RhdGUubWVzc2FnZS5jYWxsYmFjayA9IHBheWxvYWQuY2FsbGJhY2s7XG5cbiAgICAgICAgaWYgKHBheWxvYWQuY2FsbGJhY2tfbGFiZWwpXG4gICAgICAgICAgICBzdGF0ZS5tZXNzYWdlLmNhbGxiYWNrX2xhYmVsID0gcGF5bG9hZC5jYWxsYmFja19sYWJlbDtcblxuICAgICAgICBpZiAocGF5bG9hZC5oYXNPd25Qcm9wZXJ0eSgnY2xvc2UnKSkge1xuICAgICAgICAgICAgaWYgKHBheWxvYWQuY2xvc2UgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5tZXNzYWdlLmNsb3NlID0gcGF5bG9hZC5jbG9zZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgW3R5cGVzLkNMRUFSX1NOQUNLQkFSXTogKHN0YXRlKSA9PiB7XG4gICAgICAgIHN0YXRlLm1lc3NhZ2Uuc2hvdyA9IGZhbHNlO1xuICAgICAgICBzdGF0ZS5tZXNzYWdlLnRleHQgPSAnJztcbiAgICAgICAgc3RhdGUubWVzc2FnZS5sYWJlbCA9IGZhbHNlO1xuICAgICAgICBzdGF0ZS5tZXNzYWdlLnRpbWUgPSA2MDAwO1xuICAgICAgICBzdGF0ZS5tZXNzYWdlLmNhbGxiYWNrID0gZmFsc2U7XG4gICAgICAgIHN0YXRlLm1lc3NhZ2UuY2FsbGJhY2tfbGFiZWwgPSAnQ0xPU0UnO1xuICAgICAgICBzdGF0ZS5tZXNzYWdlLmNsb3NlID0gdHJ1ZTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBzdGF0ZS5tZXNzYWdlLnBvc2l0aW9uLnkgPSAndG9wJztcbiAgICAgICAgICAgIHN0YXRlLm1lc3NhZ2UucG9zaXRpb24ueCA9IGZhbHNlO1xuICAgICAgICB9LCA1MDApO1xuICAgIH1cbn1cblxuY29uc3QgYWN0aW9ucyA9IHtcblxufVxuXG5jb25zdCBnZXR0ZXJzID0ge1xuICAgIFt0eXBlcy5HRVRfTUVTU0FHRV06IHN0YXRlID0+IHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLm1lc3NhZ2U7XG4gICAgfSxcbiAgICBbdHlwZXMuR0VUX01FU1NBR0VfVklTSUJJTElUWV06IHN0YXRlID0+IHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLm1lc3NhZ2Uuc2hvdztcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBzdGF0ZSxcbiAgICBtdXRhdGlvbnMsXG4gICAgYWN0aW9ucyxcbiAgICBnZXR0ZXJzLFxuICAgIE5BTUVcbn1cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL21vZHVsZXMvc25hY2tiYXIvc25hY2tiYXJTdG9yZS5qcyIsImltcG9ydCAqIGFzIHR5cGVzIGZyb20gJy4vcG9zdFR5cGVzJztcbmNvbnN0IE5BTUUgPSB0eXBlcy5OQU1FO1xuXG5jb25zdCBzdGF0ZSA9IHtcbiAgICBwb3N0czogW10sXG59XG5cbmNvbnN0IG11dGF0aW9ucyA9IHtcbiAgICBbdHlwZXMuQUREX05FV19QT1NUXTogKHN0YXRlLCBwb3N0KSA9PiB7XG4gICAgICAgIHN0YXRlLnBvc3RzLnVuc2hpZnQocG9zdCk7XG4gICAgfSxcbiAgICBbdHlwZXMuUkVQTEFDRV9QT1NUU106IChzdGF0ZSwgcG9zdHMpID0+IHtcbiAgICAgICAgc3RhdGUucG9zdHMgPSBwb3N0cztcbiAgICB9XG59XG5cbmNvbnN0IGFjdGlvbnMgPSB7XG4gICAgLy8gW3R5cGVzLlVTRVJfTE9HSU5dOiAoeyBjb21taXQgfSwgdXNlcikgPT4ge1xuICAgIC8vICAgICB1c2VyID8gdXNlciA6IHt9O1xuICAgIC8vICAgICBjb21taXQodHlwZXMuVVNFUl9MT0dJTiwgdXNlcik7XG4gICAgLy8gfSxcbiAgICAvLyBbdHlwZXMuVVNFUl9MT0dPVVRdOiAoeyBjb21taXQgfSkgPT4ge1xuICAgIC8vICAgICBjb21taXQodHlwZXMuVVNFUl9MT0dJTik7XG4gICAgLy8gfVxufVxuXG5jb25zdCBnZXR0ZXJzID0ge1xuICAgIFt0eXBlcy5HRVRfUE9TVFNdOiBzdGF0ZSA9PiB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5wb3N0cztcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBzdGF0ZSxcbiAgICBtdXRhdGlvbnMsXG4gICAgYWN0aW9ucyxcbiAgICBnZXR0ZXJzLFxuICAgIE5BTUVcbn1cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL21vZHVsZXMvcG9zdC9wb3N0U3RvcmUuanMiLCJpbXBvcnQgVnVlIGZyb20gJ3Z1ZSc7XG5pbXBvcnQgVnVlUm91dGVyIGZyb20gJ3Z1ZS1yb3V0ZXInO1xuaW1wb3J0IHJvdXRlcyBmcm9tICcuL3JvdXRlcyc7XG5cblZ1ZS51c2UoVnVlUm91dGVyKTtcblxuY29uc3Qgcm91dGVyID0gbmV3IFZ1ZVJvdXRlcih7XG4gICAgbW9kZTogJ2hpc3RvcnknLFxuICAgIHJvdXRlc1xufSk7XG5cbnJvdXRlci5iZWZvcmVFYWNoKCh0bywgZnJvbSwgbmV4dCkgPT4ge1xuICAgIG5leHQoKTtcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCByb3V0ZXI7XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9yb3V0ZXIvcm91dGVyLmpzIiwiaW1wb3J0IEFwcCBmcm9tICdAL0FwcC52dWUnO1xuaW1wb3J0IE1haW4gZnJvbSAnQC9wYWdlcy9pbmRleFBhZ2UudnVlJztcbmltcG9ydCBBdXRoIGZyb20gJ0AvcGFnZXMvYXV0aC9hdXRoUGFnZS52dWUnO1xuaW1wb3J0IERhc2hib2FyZCBmcm9tICdAL3BhZ2VzL2Rhc2hib2FyZC9kYXNoYm9hcmRQYWdlLnZ1ZSc7XG5cbmltcG9ydCBzdG9yZSBmcm9tICdAL3N0b3JlL3N0b3JlJztcbmltcG9ydCBzYiBmcm9tICcuLy4uL2hlbHBlcnMvc25hY2tiYXInO1xuaW1wb3J0IGxvYWRlciBmcm9tICcuLy4uL2hlbHBlcnMvbG9hZGVyJztcblxuaW1wb3J0IGRhc2hib2FkUm91dGVzIGZyb20gJy4vZGFzaGJvYXJkUm91dGVzJztcbmltcG9ydCBhdXRoUm91dGVzIGZyb20gJy4vYXV0aFJvdXRlcyc7XG5cbmV4cG9ydCBkZWZhdWx0IFt7XG4gICAgICAgIHBhdGg6ICcvJyxcbiAgICAgICAgbmFtZTogJ2luZGV4JyxcbiAgICAgICAgY29tcG9uZW50OiBNYWluXG4gICAgfSxcbiAgICB7XG4gICAgICAgIHBhdGg6ICcvYXV0aCcsXG4gICAgICAgIGNvbXBvbmVudDogQXV0aCxcbiAgICAgICAgY2hpbGRyZW46IGF1dGhSb3V0ZXMsXG4gICAgICAgIGJlZm9yZUVudGVyOiAodG8sIGZyb20sIG5leHQpID0+IHtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICBwYXRoOiAnL2Rhc2gnLFxuICAgICAgICBjb21wb25lbnQ6IERhc2hib2FyZCxcbiAgICAgICAgY2hpbGRyZW46IGRhc2hib2FkUm91dGVzLFxuICAgICAgICBiZWZvcmVFbnRlcjogKHRvLCBmcm9tLCBuZXh0KSA9PiB7XG4gICAgICAgICAgICBsb2FkZXIuc3RhcnQoJ2Z1bGwnKTtcblxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFzdG9yZS5nZXR0ZXJzWydhdXRoL2lzTG9nZ2VkSW4nXSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBzYi5maXJlKCdIZWxsbyB3b3JsZCB0aGlzIGlzIG1lJywgMjAwMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAvLyBuZXh0KHsgbmFtZTogJ2F1dGgubG9naW4nIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbG9hZGVyLnN0b3AoKTtcblxuICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgICAgICAvLyBuZXh0KCk7XG5cbiAgICAgICAgfVxuICAgIH0sXG5dXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9yb3V0ZXIvcm91dGVzLmpzIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTljOTVlM2UyXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vQXBwLnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiYjNmMTFhNGVcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtOWM5NWUzZTJcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9BcHAudnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTljOTVlM2UyXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vQXBwLnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi05Yzk1ZTNlMlwiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvQXBwLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMTcyXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodHJ1ZSk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJcXG4uc3dpcGUtZW50ZXJbZGF0YS12LTljOTVlM2UyXSB7XFxuICBvcGFjaXR5OiAwO1xcbn1cXG4uc3dpcGUtZW50ZXItYWN0aXZlW2RhdGEtdi05Yzk1ZTNlMl0ge1xcbiAgYW5pbWF0aW9uOiBtb3ZlRnJvbUJvdHRvbS1kYXRhLXYtOWM5NWUzZTIgMC4ycyBmb3J3YXJkcztcXG4gIHRyYW5zaXRpb246IDAuM3MgYWxsIGVhc2U7XFxufVxcbi5zd2lwZS1sZWF2ZS1hY3RpdmVbZGF0YS12LTljOTVlM2UyXSB7XFxuICBhbmltYXRpb246IHNjYWxlRG93bi1kYXRhLXYtOWM5NWUzZTIgMC4ycyBmb3J3YXJkcztcXG4gIHRyYW5zaXRpb246IDAuMnMgYWxsIGVhc2U7XFxufVxcbkAtbW96LWtleWZyYW1lcyBzY2FsZURvd24ge1xcbnRvIHtcXG4gICAgb3BhY2l0eTogMDtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgwLjgpO1xcbn1cXG59XFxuQC13ZWJraXQta2V5ZnJhbWVzIHNjYWxlRG93biB7XFxudG8ge1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDAuOCk7XFxufVxcbn1cXG5ALW8ta2V5ZnJhbWVzIHNjYWxlRG93biB7XFxudG8ge1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDAuOCk7XFxufVxcbn1cXG5Aa2V5ZnJhbWVzIHNjYWxlRG93bi1kYXRhLXYtOWM5NWUzZTIge1xcbnRvIHtcXG4gICAgb3BhY2l0eTogMDtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgwLjgpO1xcbn1cXG59XFxuQC1tb3ota2V5ZnJhbWVzIHNjYWxlSW4ge1xcbmZyb20ge1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMik7XFxufVxcbn1cXG5ALXdlYmtpdC1rZXlmcmFtZXMgc2NhbGVJbiB7XFxuZnJvbSB7XFxuICAgIG9wYWNpdHk6IDA7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMS4yKTtcXG59XFxufVxcbkAtby1rZXlmcmFtZXMgc2NhbGVJbiB7XFxuZnJvbSB7XFxuICAgIG9wYWNpdHk6IDA7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMS4yKTtcXG59XFxufVxcbkBrZXlmcmFtZXMgc2NhbGVJbi1kYXRhLXYtOWM5NWUzZTIge1xcbmZyb20ge1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMik7XFxufVxcbn1cXG5ALW1vei1rZXlmcmFtZXMgbW92ZUZyb21Cb3R0b20ge1xcbmZyb20ge1xcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoNTAlKTtcXG59XFxufVxcbkAtd2Via2l0LWtleWZyYW1lcyBtb3ZlRnJvbUJvdHRvbSB7XFxuZnJvbSB7XFxuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSg1MCUpO1xcbn1cXG59XFxuQC1vLWtleWZyYW1lcyBtb3ZlRnJvbUJvdHRvbSB7XFxuZnJvbSB7XFxuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSg1MCUpO1xcbn1cXG59XFxuQGtleWZyYW1lcyBtb3ZlRnJvbUJvdHRvbS1kYXRhLXYtOWM5NWUzZTIge1xcbmZyb20ge1xcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoNTAlKTtcXG59XFxufVxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3Jlc291cmNlcy9hc3NldHMvanMvQXBwLnZ1ZVwiLFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9BcHAudnVlXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCI7QUEyQkE7RUFDSSxXQUFBO0NDMUJIO0FENkJEO0VBQ0ksd0RBQUE7RUFDQSwwQkFBQTtDQzNCSDtBRGlDRDtFQUNJLG1EQUFBO0VBRUEsMEJBQUE7Q0NoQ0g7QURtQ21CO0FBRW5CO0lBQUssV0FBQTtJQUFZLHNCQUFBO0NDaENmO0NBQ0Y7QUQ2Qm1CO0FBRW5CO0lBQUssV0FBQTtJQUFZLHNCQUFBO0NDMUJmO0NBQ0Y7QUR1Qm1CO0FBRW5CO0lBQUssV0FBQTtJQUFZLHNCQUFBO0NDcEJmO0NBQ0Y7QURpQm1CO0FBRW5CO0lBQUssV0FBQTtJQUFZLHNCQUFBO0NDZGY7Q0FDRjtBRGVpQjtBQUNqQjtJQUFNLFdBQUE7SUFBWSxzQkFBQTtDQ1hoQjtDQUNGO0FEU2lCO0FBQ2pCO0lBQU0sV0FBQTtJQUFZLHNCQUFBO0NDTGhCO0NBQ0Y7QURHaUI7QUFDakI7SUFBTSxXQUFBO0lBQVksc0JBQUE7Q0NDaEI7Q0FDRjtBREhpQjtBQUNqQjtJQUFNLFdBQUE7SUFBWSxzQkFBQTtDQ09oQjtDQUNGO0FETHdCO0FBQ3hCO0lBQU8sMkJBQUE7Q0NRTDtDQUNGO0FEVndCO0FBQ3hCO0lBQU8sMkJBQUE7Q0NhTDtDQUNGO0FEZndCO0FBQ3hCO0lBQU8sMkJBQUE7Q0NrQkw7Q0FDRjtBRHBCd0I7QUFDeEI7SUFBTywyQkFBQTtDQ3VCTDtDQUNGXCIsXCJmaWxlXCI6XCJBcHAudnVlXCIsXCJzb3VyY2VzQ29udGVudFwiOltcIlxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcbi5zd2lwZS1lbnRlciB7XFxuICAgIG9wYWNpdHk6IDA7XFxufVxcblxcbi5zd2lwZS1lbnRlci1hY3RpdmUge1xcbiAgICBhbmltYXRpb246IG1vdmVGcm9tQm90dG9tIC4ycyBmb3J3YXJkczsgXFxuICAgIHRyYW5zaXRpb24gLjNzIGFsbCBlYXNlO1xcbn1cXG5cXG4uZmFkZS1sZWF2ZSB7XFxufVxcblxcbi5zd2lwZS1sZWF2ZS1hY3RpdmUge1xcbiAgICBhbmltYXRpb246IHNjYWxlRG93biAuMnMgZm9yd2FyZHM7XFxuICAgIC8vIG9wYWNpdHk6IDA7XFxuICAgIHRyYW5zaXRpb24gLjJzIGFsbCBlYXNlOyAgICBcXG59XFxuXFxuQGtleWZyYW1lcyBzY2FsZURvd24ge1xcblxcdGZyb20geyB9XFxuXFx0dG8geyBvcGFjaXR5OiAwOyB0cmFuc2Zvcm06IHNjYWxlKC44KTsgfVxcbn1cXG5Aa2V5ZnJhbWVzIHNjYWxlSW4ge1xcblxcdGZyb20ge29wYWNpdHk6IDA7IHRyYW5zZm9ybTogc2NhbGUoMS4yKTsgfVxcblxcdHRvIHsgIH1cXG59XFxuQGtleWZyYW1lcyBtb3ZlRnJvbUJvdHRvbSB7XFxuXFx0ZnJvbSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSg1MCUpOyB9XFxufVxcblwiLFwiLnN3aXBlLWVudGVyIHtcXG4gIG9wYWNpdHk6IDA7XFxufVxcbi5zd2lwZS1lbnRlci1hY3RpdmUge1xcbiAgYW5pbWF0aW9uOiBtb3ZlRnJvbUJvdHRvbSAwLjJzIGZvcndhcmRzO1xcbiAgdHJhbnNpdGlvbjogMC4zcyBhbGwgZWFzZTtcXG59XFxuLnN3aXBlLWxlYXZlLWFjdGl2ZSB7XFxuICBhbmltYXRpb246IHNjYWxlRG93biAwLjJzIGZvcndhcmRzO1xcbiAgdHJhbnNpdGlvbjogMC4ycyBhbGwgZWFzZTtcXG59XFxuQC1tb3ota2V5ZnJhbWVzIHNjYWxlRG93biB7XFxuICB0byB7XFxuICAgIG9wYWNpdHk6IDA7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMC44KTtcXG4gIH1cXG59XFxuQC13ZWJraXQta2V5ZnJhbWVzIHNjYWxlRG93biB7XFxuICB0byB7XFxuICAgIG9wYWNpdHk6IDA7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMC44KTtcXG4gIH1cXG59XFxuQC1vLWtleWZyYW1lcyBzY2FsZURvd24ge1xcbiAgdG8ge1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDAuOCk7XFxuICB9XFxufVxcbkBrZXlmcmFtZXMgc2NhbGVEb3duIHtcXG4gIHRvIHtcXG4gICAgb3BhY2l0eTogMDtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgwLjgpO1xcbiAgfVxcbn1cXG5ALW1vei1rZXlmcmFtZXMgc2NhbGVJbiB7XFxuICBmcm9tIHtcXG4gICAgb3BhY2l0eTogMDtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgxLjIpO1xcbiAgfVxcbn1cXG5ALXdlYmtpdC1rZXlmcmFtZXMgc2NhbGVJbiB7XFxuICBmcm9tIHtcXG4gICAgb3BhY2l0eTogMDtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgxLjIpO1xcbiAgfVxcbn1cXG5ALW8ta2V5ZnJhbWVzIHNjYWxlSW4ge1xcbiAgZnJvbSB7XFxuICAgIG9wYWNpdHk6IDA7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMS4yKTtcXG4gIH1cXG59XFxuQGtleWZyYW1lcyBzY2FsZUluIHtcXG4gIGZyb20ge1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMik7XFxuICB9XFxufVxcbkAtbW96LWtleWZyYW1lcyBtb3ZlRnJvbUJvdHRvbSB7XFxuICBmcm9tIHtcXG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDUwJSk7XFxuICB9XFxufVxcbkAtd2Via2l0LWtleWZyYW1lcyBtb3ZlRnJvbUJvdHRvbSB7XFxuICBmcm9tIHtcXG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDUwJSk7XFxuICB9XFxufVxcbkAtby1rZXlmcmFtZXMgbW92ZUZyb21Cb3R0b20ge1xcbiAgZnJvbSB7XFxuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSg1MCUpO1xcbiAgfVxcbn1cXG5Aa2V5ZnJhbWVzIG1vdmVGcm9tQm90dG9tIHtcXG4gIGZyb20ge1xcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoNTAlKTtcXG4gIH1cXG59XFxuXCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTljOTVlM2UyXCIsXCJzY29wZWRcIjp0cnVlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9BcHAudnVlXG4vLyBtb2R1bGUgaWQgPSAxNzNcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLyoqXG4gKiBUcmFuc2xhdGVzIHRoZSBsaXN0IGZvcm1hdCBwcm9kdWNlZCBieSBjc3MtbG9hZGVyIGludG8gc29tZXRoaW5nXG4gKiBlYXNpZXIgdG8gbWFuaXB1bGF0ZS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBsaXN0VG9TdHlsZXMgKHBhcmVudElkLCBsaXN0KSB7XG4gIHZhciBzdHlsZXMgPSBbXVxuICB2YXIgbmV3U3R5bGVzID0ge31cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgdmFyIGlkID0gaXRlbVswXVxuICAgIHZhciBjc3MgPSBpdGVtWzFdXG4gICAgdmFyIG1lZGlhID0gaXRlbVsyXVxuICAgIHZhciBzb3VyY2VNYXAgPSBpdGVtWzNdXG4gICAgdmFyIHBhcnQgPSB7XG4gICAgICBpZDogcGFyZW50SWQgKyAnOicgKyBpLFxuICAgICAgY3NzOiBjc3MsXG4gICAgICBtZWRpYTogbWVkaWEsXG4gICAgICBzb3VyY2VNYXA6IHNvdXJjZU1hcFxuICAgIH1cbiAgICBpZiAoIW5ld1N0eWxlc1tpZF0pIHtcbiAgICAgIHN0eWxlcy5wdXNoKG5ld1N0eWxlc1tpZF0gPSB7IGlkOiBpZCwgcGFydHM6IFtwYXJ0XSB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBuZXdTdHlsZXNbaWRdLnBhcnRzLnB1c2gocGFydClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0eWxlc1xufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvbGlzdFRvU3R5bGVzLmpzXG4vLyBtb2R1bGUgaWQgPSAxNzRcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiPHRlbXBsYXRlPlxuICAgIDx2LWFwcD5cbiAgICAgICAgPHItdG9wLWxvYWRlcj48L3ItdG9wLWxvYWRlcj5cbiAgICAgICAgPHItZnVsbC1sb2FkZXI+PC9yLWZ1bGwtbG9hZGVyPlxuICAgICAgICA8ci1zbmFja2Jhcj48L3Itc25hY2tiYXI+XG4gICAgXG4gICAgICAgIDx0cmFuc2l0aW9uIG5hbWU9XCJzd2lwZVwiIG1vZGU9XCJvdXQtaW5cIj5cbiAgICAgICAgICAgIDxyb3V0ZXItdmlldyBrZWVwLWFsaXZlPjwvcm91dGVyLXZpZXc+XG4gICAgICAgIDwvdHJhbnNpdGlvbj5cbiAgICA8L3YtYXBwPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmltcG9ydCB0b3BMb2FkZXIgZnJvbSAnQC9jb21wb25lbnRzL3V0aWxzL3RvcExvYWRlcic7XG5pbXBvcnQgZnVsbExvYWRlciBmcm9tICdAL2NvbXBvbmVudHMvdXRpbHMvZnVsbExvYWRlcic7XG5pbXBvcnQgc25hY2tiYXIgZnJvbSAnQC9jb21wb25lbnRzL3V0aWxzL3NuYWNrYmFyJztcblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgclRvcExvYWRlcjogdG9wTG9hZGVyLFxuICAgICAgICByRnVsbExvYWRlcjogZnVsbExvYWRlcixcbiAgICAgICAgclNuYWNrYmFyOiBzbmFja2JhcixcbiAgICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzdHlsdXNcIiBzY29wZWQ+XG4uc3dpcGUtZW50ZXIge1xuICAgIG9wYWNpdHk6IDA7XG59XG5cbi5zd2lwZS1lbnRlci1hY3RpdmUge1xuICAgIGFuaW1hdGlvbjogbW92ZUZyb21Cb3R0b20gLjJzIGZvcndhcmRzOyBcbiAgICB0cmFuc2l0aW9uIC4zcyBhbGwgZWFzZTtcbn1cblxuLmZhZGUtbGVhdmUge1xufVxuXG4uc3dpcGUtbGVhdmUtYWN0aXZlIHtcbiAgICBhbmltYXRpb246IHNjYWxlRG93biAuMnMgZm9yd2FyZHM7XG4gICAgLy8gb3BhY2l0eTogMDtcbiAgICB0cmFuc2l0aW9uIC4ycyBhbGwgZWFzZTsgICAgXG59XG5cbkBrZXlmcmFtZXMgc2NhbGVEb3duIHtcblx0ZnJvbSB7IH1cblx0dG8geyBvcGFjaXR5OiAwOyB0cmFuc2Zvcm06IHNjYWxlKC44KTsgfVxufVxuQGtleWZyYW1lcyBzY2FsZUluIHtcblx0ZnJvbSB7b3BhY2l0eTogMDsgdHJhbnNmb3JtOiBzY2FsZSgxLjIpOyB9XG5cdHRvIHsgIH1cbn1cbkBrZXlmcmFtZXMgbW92ZUZyb21Cb3R0b20ge1xuXHRmcm9tIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDUwJSk7IH1cbn1cbjwvc3R5bGU+XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gQXBwLnZ1ZT9mOWU2NzA2NiIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG5mdW5jdGlvbiBpbmplY3RTdHlsZSAoc3NyQ29udGV4dCkge1xuICBpZiAoZGlzcG9zZWQpIHJldHVyblxuICByZXF1aXJlKFwiISF2dWUtc3R5bGUtbG9hZGVyIWNzcy1sb2FkZXI/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleD97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtZjVkOTc3NWFcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c3R5bGVzJmluZGV4PTAhLi90b3BMb2FkZXIudnVlXCIpXG59XG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIikoXG4gIC8qIHNjcmlwdCAqL1xuICByZXF1aXJlKFwiISFiYWJlbC1sb2FkZXI/e1xcXCJjYWNoZURpcmVjdG9yeVxcXCI6dHJ1ZSxcXFwicHJlc2V0c1xcXCI6W1tcXFwiZW52XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlLFxcXCJ0YXJnZXRzXFxcIjp7XFxcImJyb3dzZXJzXFxcIjpbXFxcIj4gMiVcXFwiXSxcXFwidWdsaWZ5XFxcIjp0cnVlfX1dLFtcXFwiZXMyMDE1XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlfV0sW1xcXCJzdGFnZS0yXFxcIl1dfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL3RvcExvYWRlci52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LWY1ZDk3NzVhXFxcIixcXFwiaGFzU2NvcGVkXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vdG9wTG9hZGVyLnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIFwiZGF0YS12LWY1ZDk3NzVhXCIsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy90b3BMb2FkZXIudnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSB0b3BMb2FkZXIudnVlOiBmdW5jdGlvbmFsIGNvbXBvbmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0ZW1wbGF0ZXMsIHRoZXkgc2hvdWxkIHVzZSByZW5kZXIgZnVuY3Rpb25zLlwiKX1cblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LWY1ZDk3NzVhXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtZjVkOTc3NWFcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy90b3BMb2FkZXIudnVlXG4vLyBtb2R1bGUgaWQgPSAxNzZcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWY1ZDk3NzVhXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vdG9wTG9hZGVyLnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiMTRkZWNjZDhcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtZjVkOTc3NWFcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi90b3BMb2FkZXIudnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWY1ZDk3NzVhXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vdG9wTG9hZGVyLnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi1mNWQ5Nzc1YVwiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvdG9wTG9hZGVyLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMTc3XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodHJ1ZSk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJcXG4jdG9wLWxvYWRlcltkYXRhLXYtZjVkOTc3NWFde1xcbiAgICBwb3NpdGlvbjogZml4ZWQ7XFxuICAgIHdpZHRoOiAxMDAlO1xcbiAgICB6LWluZGV4OiAxMDtcXG59XFxuXCIsIFwiXCIsIHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy90b3BMb2FkZXIudnVlP2RkNTc0ZjNhXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCI7QUEwQkE7SUFDQSxnQkFBQTtJQUNBLFlBQUE7SUFDQSxZQUFBO0NBQ0FcIixcImZpbGVcIjpcInRvcExvYWRlci52dWVcIixcInNvdXJjZXNDb250ZW50XCI6W1wiPHRlbXBsYXRlPlxcbiAgICA8ZGl2IGlkPVxcXCJ0b3AtbG9hZGVyXFxcIj5cXG4gICAgICAgIDx2LXByb2dyZXNzLWxpbmVhciA6YWN0aXZlPVxcXCJpc0xvYWRpbmdcXFwiIGhlaWdodD1cXFwiNFxcXCIgdi1tb2RlbD1cXFwicHJvZ3Jlc3NcXFwiIDppbmRldGVybWluYXRlPVxcXCJ1bmtub3duUHJvZ3Jlc3NcXFwiIGNsYXNzPVxcXCJtYS0wXFxcIiBzZWNvbmRhcnk+PC92LXByb2dyZXNzLWxpbmVhcj5cXG4gICAgPC9kaXY+XFxuPC90ZW1wbGF0ZT5cXG5cXG48c2NyaXB0PlxcbmltcG9ydCB7bWFwR2V0dGVyc30gZnJvbSAndnVleCc7XFxuaW1wb3J0IHN0b3JlVHlwZXMgZnJvbSAnLi8uLi8uLi9zdG9yZS90eXBlcyc7XFxuXFxuZXhwb3J0IGRlZmF1bHQge1xcbiAgICAgZGF0YTogKCkgPT4gKHtcXG4gICAgICAgIC8vIGxvYWRlcjogdHJ1ZVxcbiAgICAgICAgcHJvZ3Jlc3M6IG51bGxcXG4gICAgfSksXFxuICAgIGNvbXB1dGVkOiB7XFxuICAgICAgICB1bmtub3duUHJvZ3Jlc3MoKXtcXG4gICAgICAgICAgICByZXR1cm4gIU51bWJlci5pc0ludGVnZXIodGhpcy5wcm9ncmVzcykgPyB0cnVlIDogZmFsc2U7XFxuICAgICAgICB9LFxcbiAgICAgICAgLi4ubWFwR2V0dGVycyh7XFxuICAgICAgICAgICAgJ2lzTG9hZGluZyc6IHN0b3JlVHlwZXMuSVNfTE9BRElOR1xcbiAgICAgICAgfSlcXG4gICAgfVxcbn1cXG48L3NjcmlwdD5cXG48c3R5bGUgc2NvcGVkPlxcbiAgICAjdG9wLWxvYWRlcntcXG4gICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcXG4gICAgICAgIHdpZHRoOiAxMDAlO1xcbiAgICAgICAgei1pbmRleDogMTA7XFxuICAgIH1cXG48L3N0eWxlPlxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi1mNWQ5Nzc1YVwiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvdG9wTG9hZGVyLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMTc4XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIjx0ZW1wbGF0ZT5cbiAgICA8ZGl2IGlkPVwidG9wLWxvYWRlclwiPlxuICAgICAgICA8di1wcm9ncmVzcy1saW5lYXIgOmFjdGl2ZT1cImlzTG9hZGluZ1wiIGhlaWdodD1cIjRcIiB2LW1vZGVsPVwicHJvZ3Jlc3NcIiA6aW5kZXRlcm1pbmF0ZT1cInVua25vd25Qcm9ncmVzc1wiIGNsYXNzPVwibWEtMFwiIHNlY29uZGFyeT48L3YtcHJvZ3Jlc3MtbGluZWFyPlxuICAgIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmltcG9ydCB7bWFwR2V0dGVyc30gZnJvbSAndnVleCc7XG5pbXBvcnQgc3RvcmVUeXBlcyBmcm9tICcuLy4uLy4uL3N0b3JlL3R5cGVzJztcblxuZXhwb3J0IGRlZmF1bHQge1xuICAgICBkYXRhOiAoKSA9PiAoe1xuICAgICAgICAvLyBsb2FkZXI6IHRydWVcbiAgICAgICAgcHJvZ3Jlc3M6IG51bGxcbiAgICB9KSxcbiAgICBjb21wdXRlZDoge1xuICAgICAgICB1bmtub3duUHJvZ3Jlc3MoKXtcbiAgICAgICAgICAgIHJldHVybiAhTnVtYmVyLmlzSW50ZWdlcih0aGlzLnByb2dyZXNzKSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgLi4ubWFwR2V0dGVycyh7XG4gICAgICAgICAgICAnaXNMb2FkaW5nJzogc3RvcmVUeXBlcy5JU19MT0FESU5HXG4gICAgICAgIH0pXG4gICAgfVxufVxuPC9zY3JpcHQ+XG48c3R5bGUgc2NvcGVkPlxuICAgICN0b3AtbG9hZGVye1xuICAgICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICB6LWluZGV4OiAxMDtcbiAgICB9XG48L3N0eWxlPlxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHRvcExvYWRlci52dWU/ZGQ1NzRmM2EiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ2RpdicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJpZFwiOiBcInRvcC1sb2FkZXJcIlxuICAgIH1cbiAgfSwgW19jKCd2LXByb2dyZXNzLWxpbmVhcicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJtYS0wXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwiYWN0aXZlXCI6IF92bS5pc0xvYWRpbmcsXG4gICAgICBcImhlaWdodFwiOiBcIjRcIixcbiAgICAgIFwiaW5kZXRlcm1pbmF0ZVwiOiBfdm0udW5rbm93blByb2dyZXNzLFxuICAgICAgXCJzZWNvbmRhcnlcIjogXCJcIlxuICAgIH0sXG4gICAgbW9kZWw6IHtcbiAgICAgIHZhbHVlOiAoX3ZtLnByb2dyZXNzKSxcbiAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigkJHYpIHtcbiAgICAgICAgX3ZtLnByb2dyZXNzID0gJCR2XG4gICAgICB9LFxuICAgICAgZXhwcmVzc2lvbjogXCJwcm9ncmVzc1wiXG4gICAgfVxuICB9KV0sIDEpXG59LHN0YXRpY1JlbmRlckZuczogW119XG5tb2R1bGUuZXhwb3J0cy5yZW5kZXIuX3dpdGhTdHJpcHBlZCA9IHRydWVcbmlmIChtb2R1bGUuaG90KSB7XG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKG1vZHVsZS5ob3QuZGF0YSkge1xuICAgICByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpLnJlcmVuZGVyKFwiZGF0YS12LWY1ZDk3NzVhXCIsIG1vZHVsZS5leHBvcnRzKVxuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXI/e1wiaWRcIjpcImRhdGEtdi1mNWQ5Nzc1YVwiLFwiaGFzU2NvcGVkXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL3RvcExvYWRlci52dWVcbi8vIG1vZHVsZSBpZCA9IDE4MFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJ2YXIgZGlzcG9zZWQgPSBmYWxzZVxuZnVuY3Rpb24gaW5qZWN0U3R5bGUgKHNzckNvbnRleHQpIHtcbiAgaWYgKGRpc3Bvc2VkKSByZXR1cm5cbiAgcmVxdWlyZShcIiEhdnVlLXN0eWxlLWxvYWRlciFjc3MtbG9hZGVyP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXg/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTBlYWU4Yjg3XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSFzdHlsdXMtbG9hZGVyIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXN0eWxlcyZpbmRleD0wIS4vZnVsbExvYWRlci52dWVcIilcbn1cbnZhciBDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplclwiKShcbiAgLyogc2NyaXB0ICovXG4gIHJlcXVpcmUoXCIhIWJhYmVsLWxvYWRlcj97XFxcImNhY2hlRGlyZWN0b3J5XFxcIjp0cnVlLFxcXCJwcmVzZXRzXFxcIjpbW1xcXCJlbnZcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2UsXFxcInRhcmdldHNcXFwiOntcXFwiYnJvd3NlcnNcXFwiOltcXFwiPiAyJVxcXCJdLFxcXCJ1Z2xpZnlcXFwiOnRydWV9fV0sW1xcXCJlczIwMTVcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2V9XSxbXFxcInN0YWdlLTJcXFwiXV19IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vZnVsbExvYWRlci52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LTBlYWU4Yjg3XFxcIixcXFwiaGFzU2NvcGVkXFxcIjpmYWxzZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL2Z1bGxMb2FkZXIudnVlXCIpLFxuICAvKiBzdHlsZXMgKi9cbiAgaW5qZWN0U3R5bGUsXG4gIC8qIHNjb3BlSWQgKi9cbiAgbnVsbCxcbiAgLyogbW9kdWxlSWRlbnRpZmllciAoc2VydmVyIG9ubHkpICovXG4gIG51bGxcbilcbkNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL2Z1bGxMb2FkZXIudnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSBmdWxsTG9hZGVyLnZ1ZTogZnVuY3Rpb25hbCBjb21wb25lbnRzIGFyZSBub3Qgc3VwcG9ydGVkIHdpdGggdGVtcGxhdGVzLCB0aGV5IHNob3VsZCB1c2UgcmVuZGVyIGZ1bmN0aW9ucy5cIil9XG5cbi8qIGhvdCByZWxvYWQgKi9cbmlmIChtb2R1bGUuaG90KSB7KGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhvdEFQSSA9IHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIilcbiAgaG90QVBJLmluc3RhbGwocmVxdWlyZShcInZ1ZVwiKSwgZmFsc2UpXG4gIGlmICghaG90QVBJLmNvbXBhdGlibGUpIHJldHVyblxuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmICghbW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgaG90QVBJLmNyZWF0ZVJlY29yZChcImRhdGEtdi0wZWFlOGI4N1wiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfSBlbHNlIHtcbiAgICBob3RBUEkucmVsb2FkKFwiZGF0YS12LTBlYWU4Yjg3XCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9XG4gIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbiAoZGF0YSkge1xuICAgIGRpc3Bvc2VkID0gdHJ1ZVxuICB9KVxufSkoKX1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQuZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvZnVsbExvYWRlci52dWVcbi8vIG1vZHVsZSBpZCA9IDE4MVxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMGVhZThiODdcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vZnVsbExvYWRlci52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcIjE3ZTIyZmIwXCIsIGNvbnRlbnQsIGZhbHNlKTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTBlYWU4Yjg3XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2Z1bGxMb2FkZXIudnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTBlYWU4Yjg3XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2Z1bGxMb2FkZXIudnVlXCIpO1xuICAgICBpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcbiAgICAgdXBkYXRlKG5ld0NvbnRlbnQpO1xuICAgfSk7XG4gfVxuIC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3NcbiBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTBlYWU4Yjg3XCIsXCJzY29wZWRcIjpmYWxzZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy9mdWxsTG9hZGVyLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMTgyXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodHJ1ZSk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJcXG4ud2hvbGVwYWdlIHtcXG4gIHBvc2l0aW9uOiBmaXhlZDtcXG4gIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMjU1LDI1NSwyNTUsMC45KTtcXG4gIHdpZHRoOiAxMDAlO1xcbiAgaGVpZ2h0OiAxMDAlO1xcbiAgdG9wOiAwcHg7XFxuICB6LWluZGV4OiA5MDtcXG59XFxuLnNjYWxlaW4tbGVhdmUtYWN0aXZlLFxcbi5zY2FsZWluLWVudGVyLWFjdGl2ZSB7XFxuICB0cmFuc2l0aW9uOiBhbGwgMC4ycztcXG59XFxuLnNjYWxlaW4tZW50ZXIge1xcbiAgb3BhY2l0eTogMDtcXG59XFxuLnNjYWxlaW4tbGVhdmUtdG8ge1xcbiAgb3BhY2l0eTogMDtcXG59XFxuXCIsIFwiXCIsIHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvZnVsbExvYWRlci52dWVcIixcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy9mdWxsTG9hZGVyLnZ1ZVwiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiO0FBbUNBO0VBQ0ksZ0JBQUE7RUFDQSx3Q0FBQTtFQUNBLFlBQUE7RUFDQSxhQUFBO0VBQ0EsU0FBQTtFQUNBLFlBQUE7Q0NsQ0g7QURvQ0Q7O0VBQ0kscUJBQUE7Q0NqQ0g7QURtQ0Q7RUFDSSxXQUFBO0NDakNIO0FEb0NEO0VBQ0ksV0FBQTtDQ2xDSFwiLFwiZmlsZVwiOlwiZnVsbExvYWRlci52dWVcIixcInNvdXJjZXNDb250ZW50XCI6W1wiXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuLndob2xlcGFnZXtcXG4gICAgcG9zaXRpb246IGZpeGVkO1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudGlmeSgjZmZmLCAwLjkpO1xcbiAgICB3aWR0aDogMTAwJTtcXG4gICAgaGVpZ2h0OiAxMDAlO1xcbiAgICB0b3A6IDBweDtcXG4gICAgei1pbmRleDogOTA7XFxufVxcbi5zY2FsZWluLWxlYXZlLWFjdGl2ZSwgLnNjYWxlaW4tZW50ZXItYWN0aXZlIHtcXG4gICAgdHJhbnNpdGlvbjogYWxsIC4ycztcXG59XFxuLnNjYWxlaW4tZW50ZXIge1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICAvLyB0cmFuc2Zvcm06IHNjYWxlKDMpO1xcbn1cXG4uc2NhbGVpbi1sZWF2ZS10byB7XFxuICAgIG9wYWNpdHk6IDA7XFxuICAgIC8vIHRyYW5zZm9ybTogc2NhbGUoMik7XFxufVxcbi8vIC5zY2FsZWluLWxlYXZlLWFjdGl2ZSB7XFxuLy8gICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4vLyB9XFxuXCIsXCIud2hvbGVwYWdlIHtcXG4gIHBvc2l0aW9uOiBmaXhlZDtcXG4gIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMjU1LDI1NSwyNTUsMC45KTtcXG4gIHdpZHRoOiAxMDAlO1xcbiAgaGVpZ2h0OiAxMDAlO1xcbiAgdG9wOiAwcHg7XFxuICB6LWluZGV4OiA5MDtcXG59XFxuLnNjYWxlaW4tbGVhdmUtYWN0aXZlLFxcbi5zY2FsZWluLWVudGVyLWFjdGl2ZSB7XFxuICB0cmFuc2l0aW9uOiBhbGwgMC4ycztcXG59XFxuLnNjYWxlaW4tZW50ZXIge1xcbiAgb3BhY2l0eTogMDtcXG59XFxuLnNjYWxlaW4tbGVhdmUtdG8ge1xcbiAgb3BhY2l0eTogMDtcXG59XFxuXCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTBlYWU4Yjg3XCIsXCJzY29wZWRcIjpmYWxzZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy9mdWxsTG9hZGVyLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMTgzXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIjx0ZW1wbGF0ZT5cbiAgICA8dHJhbnNpdGlvbiBuYW1lPVwic2NhbGVpblwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwid2hvbGVwYWdlXCIgdi1pZj1cImlzRnVsbExvYWRpbmdcIiBmaWxsLWhlaWdodD5cbiAgICAgICAgICAgIDx2LWxheW91dCBhbGlnbi1jZW50ZXIgZmlsbC1oZWlnaHQganVzdGlmeS1jZW50ZXI+XG4gICAgICAgICAgICAgICAgPHYtcHJvZ3Jlc3MtY2lyY3VsYXIgaW5kZXRlcm1pbmF0ZSA6c2l6ZT1cInNpemVcIiA6d2lkdGg9J3dpZHRoJyBjbGFzcz1cInByaW1hcnktLXRleHRcIiBAY2xpY2s9XCJzdG9wU2l0ZUxvYWRpbmdcIiBzZWNvbmRhcnk+PC92LXByb2dyZXNzLWNpcmN1bGFyPlxuICAgICAgICAgICAgPC92LWxheW91dD5cbiAgICAgICAgPC9kaXY+XG4gICAgPC90cmFuc2l0aW9uPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmltcG9ydCB7IG1hcEdldHRlcnMsIG1hcE11dGF0aW9ucyB9IGZyb20gJ3Z1ZXgnO1xuaW1wb3J0IHN0b3JlVHlwZXMgZnJvbSAnLi8uLi8uLi9zdG9yZS90eXBlcyc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBkYXRhKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2l6ZTogNzAsXG4gICAgICAgICAgICB3aWR0aDogNVxuICAgICAgICB9XG4gICAgfSxcbiAgICBjb21wdXRlZDoge1xuICAgICAgICAuLi5tYXBHZXR0ZXJzKHtcbiAgICAgICAgICAgICdpc0Z1bGxMb2FkaW5nJyA6IHN0b3JlVHlwZXMuSVNfRlVMTF9MT0FESU5HXG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIC4uLm1hcE11dGF0aW9ucyh7XG4gICAgICAgICAgICAnc3RvcFNpdGVMb2FkaW5nJyA6IHN0b3JlVHlwZXMuU1RPUF9MT0FESU5HXG4gICAgICAgIH0pXG4gICAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic3R5bHVzXCI+XG4gICAgLndob2xlcGFnZXtcbiAgICAgICAgcG9zaXRpb246IGZpeGVkO1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudGlmeSgjZmZmLCAwLjkpO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICB0b3A6IDBweDtcbiAgICAgICAgei1pbmRleDogOTA7XG4gICAgfVxuICAgIC5zY2FsZWluLWxlYXZlLWFjdGl2ZSwgLnNjYWxlaW4tZW50ZXItYWN0aXZlIHtcbiAgICAgICAgdHJhbnNpdGlvbjogYWxsIC4ycztcbiAgICB9XG4gICAgLnNjYWxlaW4tZW50ZXIge1xuICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICAvLyB0cmFuc2Zvcm06IHNjYWxlKDMpO1xuICAgIH1cbiAgICAuc2NhbGVpbi1sZWF2ZS10byB7XG4gICAgICAgIG9wYWNpdHk6IDA7XG4gICAgICAgIC8vIHRyYW5zZm9ybTogc2NhbGUoMik7XG4gICAgfVxuICAgIC8vIC5zY2FsZWluLWxlYXZlLWFjdGl2ZSB7XG4gICAgLy8gICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAvLyB9XG48L3N0eWxlPlxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIGZ1bGxMb2FkZXIudnVlPzU1OTdhYjk4IiwibW9kdWxlLmV4cG9ydHM9e3JlbmRlcjpmdW5jdGlvbiAoKXt2YXIgX3ZtPXRoaXM7dmFyIF9oPV92bS4kY3JlYXRlRWxlbWVudDt2YXIgX2M9X3ZtLl9zZWxmLl9jfHxfaDtcbiAgcmV0dXJuIF9jKCd0cmFuc2l0aW9uJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcIm5hbWVcIjogXCJzY2FsZWluXCJcbiAgICB9XG4gIH0sIFsoX3ZtLmlzRnVsbExvYWRpbmcpID8gX2MoJ2RpdicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJ3aG9sZXBhZ2VcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJmaWxsLWhlaWdodFwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtbGF5b3V0Jywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImFsaWduLWNlbnRlclwiOiBcIlwiLFxuICAgICAgXCJmaWxsLWhlaWdodFwiOiBcIlwiLFxuICAgICAgXCJqdXN0aWZ5LWNlbnRlclwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtcHJvZ3Jlc3MtY2lyY3VsYXInLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwicHJpbWFyeS0tdGV4dFwiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcImluZGV0ZXJtaW5hdGVcIjogXCJcIixcbiAgICAgIFwic2l6ZVwiOiBfdm0uc2l6ZSxcbiAgICAgIFwid2lkdGhcIjogX3ZtLndpZHRoLFxuICAgICAgXCJzZWNvbmRhcnlcIjogXCJcIlxuICAgIH0sXG4gICAgb246IHtcbiAgICAgIFwiY2xpY2tcIjogX3ZtLnN0b3BTaXRlTG9hZGluZ1xuICAgIH1cbiAgfSldLCAxKV0sIDEpIDogX3ZtLl9lKCldKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi0wZWFlOGI4N1wiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtMGVhZThiODdcIixcImhhc1Njb3BlZFwiOmZhbHNlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvZnVsbExvYWRlci52dWVcbi8vIG1vZHVsZSBpZCA9IDE4NVxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJ2YXIgZGlzcG9zZWQgPSBmYWxzZVxuZnVuY3Rpb24gaW5qZWN0U3R5bGUgKHNzckNvbnRleHQpIHtcbiAgaWYgKGRpc3Bvc2VkKSByZXR1cm5cbiAgcmVxdWlyZShcIiEhdnVlLXN0eWxlLWxvYWRlciFjc3MtbG9hZGVyP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXg/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTQ0YmJkYWNhXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3NuYWNrYmFyLnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi9zbmFja2Jhci52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LTQ0YmJkYWNhXFxcIixcXFwiaGFzU2NvcGVkXFxcIjpmYWxzZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3NuYWNrYmFyLnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIG51bGwsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy9zbmFja2Jhci52dWVcIlxuaWYgKENvbXBvbmVudC5lc01vZHVsZSAmJiBPYmplY3Qua2V5cyhDb21wb25lbnQuZXNNb2R1bGUpLnNvbWUoZnVuY3Rpb24gKGtleSkge3JldHVybiBrZXkgIT09IFwiZGVmYXVsdFwiICYmIGtleS5zdWJzdHIoMCwgMikgIT09IFwiX19cIn0pKSB7Y29uc29sZS5lcnJvcihcIm5hbWVkIGV4cG9ydHMgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gKi52dWUgZmlsZXMuXCIpfVxuaWYgKENvbXBvbmVudC5vcHRpb25zLmZ1bmN0aW9uYWwpIHtjb25zb2xlLmVycm9yKFwiW3Z1ZS1sb2FkZXJdIHNuYWNrYmFyLnZ1ZTogZnVuY3Rpb25hbCBjb21wb25lbnRzIGFyZSBub3Qgc3VwcG9ydGVkIHdpdGggdGVtcGxhdGVzLCB0aGV5IHNob3VsZCB1c2UgcmVuZGVyIGZ1bmN0aW9ucy5cIil9XG5cbi8qIGhvdCByZWxvYWQgKi9cbmlmIChtb2R1bGUuaG90KSB7KGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhvdEFQSSA9IHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIilcbiAgaG90QVBJLmluc3RhbGwocmVxdWlyZShcInZ1ZVwiKSwgZmFsc2UpXG4gIGlmICghaG90QVBJLmNvbXBhdGlibGUpIHJldHVyblxuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmICghbW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgaG90QVBJLmNyZWF0ZVJlY29yZChcImRhdGEtdi00NGJiZGFjYVwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfSBlbHNlIHtcbiAgICBob3RBUEkucmVsb2FkKFwiZGF0YS12LTQ0YmJkYWNhXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9XG4gIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbiAoZGF0YSkge1xuICAgIGRpc3Bvc2VkID0gdHJ1ZVxuICB9KVxufSkoKX1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQuZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvc25hY2tiYXIudnVlXG4vLyBtb2R1bGUgaWQgPSAxODZcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTQ0YmJkYWNhXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3NuYWNrYmFyLnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiZWM3YjNkODJcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtNDRiYmRhY2FcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vc25hY2tiYXIudnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTQ0YmJkYWNhXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3NuYWNrYmFyLnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi00NGJiZGFjYVwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL3NuYWNrYmFyLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMTg3XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodHJ1ZSk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJcXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cIiwgXCJcIiwge1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W10sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIlwiLFwiZmlsZVwiOlwic25hY2tiYXIudnVlXCIsXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtNDRiYmRhY2FcIixcInNjb3BlZFwiOmZhbHNlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy9zbmFja2Jhci52dWVcbi8vIG1vZHVsZSBpZCA9IDE4OFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCI8dGVtcGxhdGU+XG4gICAgPHYtc25hY2tiYXIgdi1tb2RlbD1cInNuYWNrYmFyXCIgOnRpbWVvdXQ9XCJtZXNzYWdlLnRpbWVcIiA6dG9wPVwiZGV0ZXJtaW5lUG9zaXRpb25ZKCd0b3AnKVwiIDpib3R0b209XCJkZXRlcm1pbmVQb3NpdGlvblkoJ2JvdHRvbScpXCIgOnJpZ2h0PVwiZGV0ZXJtaW5lUG9zaXRpb25YKCdyaWdodCcpXCIgOmxlZnQ9XCJkZXRlcm1pbmVQb3NpdGlvblgoJ2xlZnQnKVwiIDptdWx0aS1saW5lPVwidHJ1ZVwiIDppbmZvPVwiZGV0ZXJtaW5lTGFiZWwoJ2luZm8nKVwiIDpzdWNjZXNzPVwiZGV0ZXJtaW5lTGFiZWwoJ3N1Y2Nlc3MnKVwiIDp3YXJuaW5nPVwiZGV0ZXJtaW5lTGFiZWwoJ3dhcm5pbmcnKVwiIDplcnJvcj1cImRldGVybWluZUxhYmVsKCdlcnJvcicpXCIgOnByaW1hcnk9XCJkZXRlcm1pbmVMYWJlbCgncHJpbWFyeScpXCIgOnNlY29uZGFyeT1cImRldGVybWluZUxhYmVsKCdzZWNvbmRhcnknKVwiPlxuICAgICAgICB7eyBtZXNzYWdlLnRleHQgfX1cbiAgICAgICAgPHYtYnRuIHYtaWY9XCJtZXNzYWdlLmNhbGxiYWNrXCIgZmxhdCBkYXJrIEBjbGljay5uYXRpdmU9XCJjYWxsYmFja0FuZENsb3NlXCI+e3ttZXNzYWdlLmNhbGxiYWNrX2xhYmVsfX08L3YtYnRuPlxuICAgIFxuICAgICAgICA8di1idG4gdi1pZj1cIm1lc3NhZ2UuY2xvc2VcIiBmbGF0IGRhcmsgQGNsaWNrLm5hdGl2ZT1cInNuYWNrYmFyID0gZmFsc2VcIj5DTE9TRTwvdi1idG4+XG4gICAgPC92LXNuYWNrYmFyPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmltcG9ydCB7IG1hcEdldHRlcnMsIG1hcE11dGF0aW9ucyB9IGZyb20gJ3Z1ZXgnO1xuaW1wb3J0IHN0b3JlVHlwZXMgZnJvbSAnLi8uLi8uLi9zdG9yZS90eXBlcyc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBjb21wdXRlZDoge1xuICAgICAgICBzbmFja2Jhcjoge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2hvd01lc3NhZ2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJNZXNzYWdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC4uLm1hcEdldHRlcnMoc3RvcmVUeXBlcy5zbmFja2Jhci5OQU1FLCB7XG4gICAgICAgICAgICBzaG93TWVzc2FnZTogc3RvcmVUeXBlcy5zbmFja2Jhci5HRVRfTUVTU0FHRV9WSVNJQklMSVRZLFxuICAgICAgICAgICAgbWVzc2FnZTogc3RvcmVUeXBlcy5zbmFja2Jhci5HRVRfTUVTU0FHRSxcbiAgICAgICAgfSlcblxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICAuLi5tYXBNdXRhdGlvbnMoc3RvcmVUeXBlcy5zbmFja2Jhci5OQU1FLCB7XG4gICAgICAgICAgICBjbGVhck1lc3NhZ2U6IHN0b3JlVHlwZXMuc25hY2tiYXIuQ0xFQVJfU05BQ0tCQVJcbiAgICAgICAgfSksXG4gICAgICAgIGNhbGxiYWNrQW5kQ2xvc2UoKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UuY2FsbGJhY2soKTtcbiAgICAgICAgICAgIHRoaXMuc25hY2tiYXIgPSBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZGV0ZXJtaW5lUG9zaXRpb25YKHBvcykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWVzc2FnZS5wb3NpdGlvbi54ID09PSBwb3NcbiAgICAgICAgfSxcbiAgICAgICAgZGV0ZXJtaW5lUG9zaXRpb25ZKHBvcykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWVzc2FnZS5wb3NpdGlvbi55ID09PSBwb3NcbiAgICAgICAgfSxcbiAgICAgICAgZGV0ZXJtaW5lTGFiZWwobGFiZWwpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2UubGFiZWwgPT09IGxhYmVsXG4gICAgICAgIH1cbiAgICB9LFxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cblxuPC9zdHlsZT5cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyBzbmFja2Jhci52dWU/MDY2MDM5YjgiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ3Ytc25hY2tiYXInLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwidGltZW91dFwiOiBfdm0ubWVzc2FnZS50aW1lLFxuICAgICAgXCJ0b3BcIjogX3ZtLmRldGVybWluZVBvc2l0aW9uWSgndG9wJyksXG4gICAgICBcImJvdHRvbVwiOiBfdm0uZGV0ZXJtaW5lUG9zaXRpb25ZKCdib3R0b20nKSxcbiAgICAgIFwicmlnaHRcIjogX3ZtLmRldGVybWluZVBvc2l0aW9uWCgncmlnaHQnKSxcbiAgICAgIFwibGVmdFwiOiBfdm0uZGV0ZXJtaW5lUG9zaXRpb25YKCdsZWZ0JyksXG4gICAgICBcIm11bHRpLWxpbmVcIjogdHJ1ZSxcbiAgICAgIFwiaW5mb1wiOiBfdm0uZGV0ZXJtaW5lTGFiZWwoJ2luZm8nKSxcbiAgICAgIFwic3VjY2Vzc1wiOiBfdm0uZGV0ZXJtaW5lTGFiZWwoJ3N1Y2Nlc3MnKSxcbiAgICAgIFwid2FybmluZ1wiOiBfdm0uZGV0ZXJtaW5lTGFiZWwoJ3dhcm5pbmcnKSxcbiAgICAgIFwiZXJyb3JcIjogX3ZtLmRldGVybWluZUxhYmVsKCdlcnJvcicpLFxuICAgICAgXCJwcmltYXJ5XCI6IF92bS5kZXRlcm1pbmVMYWJlbCgncHJpbWFyeScpLFxuICAgICAgXCJzZWNvbmRhcnlcIjogX3ZtLmRldGVybWluZUxhYmVsKCdzZWNvbmRhcnknKVxuICAgIH0sXG4gICAgbW9kZWw6IHtcbiAgICAgIHZhbHVlOiAoX3ZtLnNuYWNrYmFyKSxcbiAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigkJHYpIHtcbiAgICAgICAgX3ZtLnNuYWNrYmFyID0gJCR2XG4gICAgICB9LFxuICAgICAgZXhwcmVzc2lvbjogXCJzbmFja2JhclwiXG4gICAgfVxuICB9LCBbX3ZtLl92KFwiXFxuICAgIFwiICsgX3ZtLl9zKF92bS5tZXNzYWdlLnRleHQpICsgXCJcXG4gICAgXCIpLCAoX3ZtLm1lc3NhZ2UuY2FsbGJhY2spID8gX2MoJ3YtYnRuJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImZsYXRcIjogXCJcIixcbiAgICAgIFwiZGFya1wiOiBcIlwiXG4gICAgfSxcbiAgICBuYXRpdmVPbjoge1xuICAgICAgXCJjbGlja1wiOiBmdW5jdGlvbigkZXZlbnQpIHtcbiAgICAgICAgX3ZtLmNhbGxiYWNrQW5kQ2xvc2UoJGV2ZW50KVxuICAgICAgfVxuICAgIH1cbiAgfSwgW192bS5fdihfdm0uX3MoX3ZtLm1lc3NhZ2UuY2FsbGJhY2tfbGFiZWwpKV0pIDogX3ZtLl9lKCksIF92bS5fdihcIiBcIiksIChfdm0ubWVzc2FnZS5jbG9zZSkgPyBfYygndi1idG4nLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwiZmxhdFwiOiBcIlwiLFxuICAgICAgXCJkYXJrXCI6IFwiXCJcbiAgICB9LFxuICAgIG5hdGl2ZU9uOiB7XG4gICAgICBcImNsaWNrXCI6IGZ1bmN0aW9uKCRldmVudCkge1xuICAgICAgICBfdm0uc25hY2tiYXIgPSBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgfSwgW192bS5fdihcIkNMT1NFXCIpXSkgOiBfdm0uX2UoKV0sIDEpXG59LHN0YXRpY1JlbmRlckZuczogW119XG5tb2R1bGUuZXhwb3J0cy5yZW5kZXIuX3dpdGhTdHJpcHBlZCA9IHRydWVcbmlmIChtb2R1bGUuaG90KSB7XG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKG1vZHVsZS5ob3QuZGF0YSkge1xuICAgICByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpLnJlcmVuZGVyKFwiZGF0YS12LTQ0YmJkYWNhXCIsIG1vZHVsZS5leHBvcnRzKVxuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXI/e1wiaWRcIjpcImRhdGEtdi00NGJiZGFjYVwiLFwiaGFzU2NvcGVkXCI6ZmFsc2V9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy9zbmFja2Jhci52dWVcbi8vIG1vZHVsZSBpZCA9IDE5MFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ3YtYXBwJywgW19jKCdyLXRvcC1sb2FkZXInKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3ItZnVsbC1sb2FkZXInKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3Itc25hY2tiYXInKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3RyYW5zaXRpb24nLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwibmFtZVwiOiBcInN3aXBlXCIsXG4gICAgICBcIm1vZGVcIjogXCJvdXQtaW5cIlxuICAgIH1cbiAgfSwgW19jKCdyb3V0ZXItdmlldycsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJrZWVwLWFsaXZlXCI6IFwiXCJcbiAgICB9XG4gIH0pXSwgMSldLCAxKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi05Yzk1ZTNlMlwiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtOWM5NWUzZTJcIixcImhhc1Njb3BlZFwiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvQXBwLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMTkxXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG5mdW5jdGlvbiBpbmplY3RTdHlsZSAoc3NyQ29udGV4dCkge1xuICBpZiAoZGlzcG9zZWQpIHJldHVyblxuICByZXF1aXJlKFwiISF2dWUtc3R5bGUtbG9hZGVyIWNzcy1sb2FkZXI/c291cmNlTWFwIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleD97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtNDVlN2RlODRcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IXN0eWx1cy1sb2FkZXIhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9pbmRleFBhZ2UudnVlXCIpXG59XG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIikoXG4gIC8qIHNjcmlwdCAqL1xuICByZXF1aXJlKFwiISFiYWJlbC1sb2FkZXI/e1xcXCJjYWNoZURpcmVjdG9yeVxcXCI6dHJ1ZSxcXFwicHJlc2V0c1xcXCI6W1tcXFwiZW52XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlLFxcXCJ0YXJnZXRzXFxcIjp7XFxcImJyb3dzZXJzXFxcIjpbXFxcIj4gMiVcXFwiXSxcXFwidWdsaWZ5XFxcIjp0cnVlfX1dLFtcXFwiZXMyMDE1XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlfV0sW1xcXCJzdGFnZS0yXFxcIl1dfSEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL2luZGV4UGFnZS52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LTQ1ZTdkZTg0XFxcIixcXFwiaGFzU2NvcGVkXFxcIjpmYWxzZX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL2luZGV4UGFnZS52dWVcIiksXG4gIC8qIHN0eWxlcyAqL1xuICBpbmplY3RTdHlsZSxcbiAgLyogc2NvcGVJZCAqL1xuICBudWxsLFxuICAvKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbiAgbnVsbFxuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2luZGV4UGFnZS52dWVcIlxuaWYgKENvbXBvbmVudC5lc01vZHVsZSAmJiBPYmplY3Qua2V5cyhDb21wb25lbnQuZXNNb2R1bGUpLnNvbWUoZnVuY3Rpb24gKGtleSkge3JldHVybiBrZXkgIT09IFwiZGVmYXVsdFwiICYmIGtleS5zdWJzdHIoMCwgMikgIT09IFwiX19cIn0pKSB7Y29uc29sZS5lcnJvcihcIm5hbWVkIGV4cG9ydHMgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gKi52dWUgZmlsZXMuXCIpfVxuaWYgKENvbXBvbmVudC5vcHRpb25zLmZ1bmN0aW9uYWwpIHtjb25zb2xlLmVycm9yKFwiW3Z1ZS1sb2FkZXJdIGluZGV4UGFnZS52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtNDVlN2RlODRcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi00NWU3ZGU4NFwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9pbmRleFBhZ2UudnVlXG4vLyBtb2R1bGUgaWQgPSAxOTJcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTQ1ZTdkZTg0XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2luZGV4UGFnZS52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcIjBmOTJjMmQyXCIsIGNvbnRlbnQsIGZhbHNlKTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTQ1ZTdkZTg0XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2luZGV4UGFnZS52dWVcIiwgZnVuY3Rpb24oKSB7XG4gICAgIHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtNDVlN2RlODRcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vaW5kZXhQYWdlLnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi00NWU3ZGU4NFwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2luZGV4UGFnZS52dWVcbi8vIG1vZHVsZSBpZCA9IDE5M1xuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHRydWUpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiXFxuLmluZGV4LXBhZ2Uge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgaGVpZ2h0OiAxMDAlO1xcbn1cXG4uaW5kZXgtcGFnZSAuci10aXRsZS1ib3ggPiBoMSB7XFxuICBmb250LXdlaWdodDogbGlnaHRlcjtcXG59XFxuLmluZGV4LXBhZ2UgLnItaW1hZ2UtYm94IGltZyB7XFxuICB3aWR0aDogMjAwcHg7XFxufVxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvaW5kZXhQYWdlLnZ1ZVwiLFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9pbmRleFBhZ2UudnVlXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCI7QUF3Q0E7RUFDSSxtQkFBQTtFQUNBLGFBQUE7Q0N2Q0g7QUR5Q0c7RUFDSSxxQkFBQTtDQ3ZDUDtBRDBDTztFQUNJLGFBQUE7Q0N4Q1hcIixcImZpbGVcIjpcImluZGV4UGFnZS52dWVcIixcInNvdXJjZXNDb250ZW50XCI6W1wiXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuQGltcG9ydCd+c3R5bGVzL3N0eWx1cy9jb2xvcnMnO1xcbi5pbmRleC1wYWdle1xcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICAgIGhlaWdodDogMTAwJTtcXG4gICAgLy8gYmFja2dyb3VuZC1jb2xvcjogJGdyZXkubGlnaHRlbi0yO1xcbiAgICAuci10aXRsZS1ib3ggPiBoMXtcXG4gICAgICAgIGZvbnQtd2VpZ2h0OiBsaWdodGVyO1xcbiAgICB9XFxuICAgIC5yLWltYWdlLWJveHtcXG4gICAgICAgIGltZ3tcXG4gICAgICAgICAgICB3aWR0aDogMjAwcHg7XFxuICAgICAgICB9XFxuICAgIH1cXG59XFxuXCIsXCIuaW5kZXgtcGFnZSB7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICBoZWlnaHQ6IDEwMCU7XFxufVxcbi5pbmRleC1wYWdlIC5yLXRpdGxlLWJveCA+IGgxIHtcXG4gIGZvbnQtd2VpZ2h0OiBsaWdodGVyO1xcbn1cXG4uaW5kZXgtcGFnZSAuci1pbWFnZS1ib3ggaW1nIHtcXG4gIHdpZHRoOiAyMDBweDtcXG59XFxuXCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTQ1ZTdkZTg0XCIsXCJzY29wZWRcIjpmYWxzZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvaW5kZXhQYWdlLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMTk0XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIjx0ZW1wbGF0ZT5cbiAgICA8di1hcHA+XG4gICAgICAgIDxtYWluPlxuICAgICAgICAgICAgPHYtY29udGFpbmVyIGZsdWlkIGNsYXNzPVwiaW5kZXgtcGFnZVwiPlxuICAgICAgICAgICAgICAgIDx2LWxheW91dCBjb2x1bW4gY2xhc3M9XCJjb250YWluXCIgYWxpZ24tY2VudGVyIGZpbGwtaGVpZ2h0IGp1c3RpZnktY2VudGVyPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwici1pbWFnZS1ib3hcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiL2ltYWdlcy9sb2dvLmpwZWdcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInItdGl0bGUtYm94XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDEgY2xhc3M9XCJwcmltYXJ5LS10ZXh0XCI+Q29tbXVuaXR5IFdhdGNoPC9oMT5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyLXN1Yi10aXRsZS1ib3hcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoNSBjbGFzcz1cInByaW1hcnktLXRleHRcIj5maW5kIGFuZCByZXBvcnQgbmV3cyBhbmQgaW5jaWRlbnRzIGhhcHBlbmluZyBhcm91bmQgeW91PC9oNT5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyLXN1Yi10aXRsZS1ib3hcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxyb3V0ZXItbGluayB0YWc9XCJzcGFuXCIgOnRvPVwie25hbWU6ICdhdXRoLmxvZ2luJ31cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8di1idG4gcHJpbWFyeSBsYXJnZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTG9naW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxyb3V0ZXItbGluayB0YWc9XCJzcGFuXCIgOnRvPVwie25hbWU6ICdkYXNoLmhvbWUnfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx2LWJ0biBwcmltYXJ5IGxhcmdlIG91dGxpbmU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhc2hib2FyZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3JvdXRlci1saW5rPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L3YtbGF5b3V0PlxuICAgICAgICAgICAgPC92LWNvbnRhaW5lcj5cbiAgICAgICAgPC9tYWluPlxuICAgIDwvdi1hcHA+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0PlxuXG5leHBvcnQgZGVmYXVsdCB7XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzdHlsdXNcIj5cbiAgICBAaW1wb3J0J35zdHlsZXMvc3R5bHVzL2NvbG9ycyc7XG4gICAgLmluZGV4LXBhZ2V7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAvLyBiYWNrZ3JvdW5kLWNvbG9yOiAkZ3JleS5saWdodGVuLTI7XG4gICAgICAgIC5yLXRpdGxlLWJveCA+IGgxe1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IGxpZ2h0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgLnItaW1hZ2UtYm94e1xuICAgICAgICAgICAgaW1ne1xuICAgICAgICAgICAgICAgIHdpZHRoOiAyMDBweDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbjwvc3R5bGU+XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gaW5kZXhQYWdlLnZ1ZT8yYWYyOGI3YSIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygndi1hcHAnLCBbX2MoJ21haW4nLCBbX2MoJ3YtY29udGFpbmVyJywge1xuICAgIHN0YXRpY0NsYXNzOiBcImluZGV4LXBhZ2VcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJmbHVpZFwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtbGF5b3V0Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcImNvbnRhaW5cIixcbiAgICBhdHRyczoge1xuICAgICAgXCJjb2x1bW5cIjogXCJcIixcbiAgICAgIFwiYWxpZ24tY2VudGVyXCI6IFwiXCIsXG4gICAgICBcImZpbGwtaGVpZ2h0XCI6IFwiXCIsXG4gICAgICBcImp1c3RpZnktY2VudGVyXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygnZGl2Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcInItaW1hZ2UtYm94XCJcbiAgfSwgW19jKCdpbWcnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwic3JjXCI6IFwiL2ltYWdlcy9sb2dvLmpwZWdcIlxuICAgIH1cbiAgfSldKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ2RpdicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJyLXRpdGxlLWJveFwiXG4gIH0sIFtfYygnaDEnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwicHJpbWFyeS0tdGV4dFwiXG4gIH0sIFtfdm0uX3YoXCJDb21tdW5pdHkgV2F0Y2hcIildKV0pLCBfdm0uX3YoXCIgXCIpLCBfYygnZGl2Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcInItc3ViLXRpdGxlLWJveFwiXG4gIH0sIFtfYygnaDUnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwicHJpbWFyeS0tdGV4dFwiXG4gIH0sIFtfdm0uX3YoXCJmaW5kIGFuZCByZXBvcnQgbmV3cyBhbmQgaW5jaWRlbnRzIGhhcHBlbmluZyBhcm91bmQgeW91XCIpXSldKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ2RpdicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJyLXN1Yi10aXRsZS1ib3hcIlxuICB9LCBbX2MoJ3JvdXRlci1saW5rJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInRhZ1wiOiBcInNwYW5cIixcbiAgICAgIFwidG9cIjoge1xuICAgICAgICBuYW1lOiAnYXV0aC5sb2dpbidcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtfYygndi1idG4nLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwicHJpbWFyeVwiOiBcIlwiLFxuICAgICAgXCJsYXJnZVwiOiBcIlwiXG4gICAgfVxuICB9LCBbX3ZtLl92KFwiXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIExvZ2luXFxuICAgICAgICAgICAgICAgICAgICAgICAgXCIpXSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3JvdXRlci1saW5rJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInRhZ1wiOiBcInNwYW5cIixcbiAgICAgIFwidG9cIjoge1xuICAgICAgICBuYW1lOiAnZGFzaC5ob21lJ1xuICAgICAgfVxuICAgIH1cbiAgfSwgW19jKCd2LWJ0bicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJwcmltYXJ5XCI6IFwiXCIsXG4gICAgICBcImxhcmdlXCI6IFwiXCIsXG4gICAgICBcIm91dGxpbmVcIjogXCJcIlxuICAgIH1cbiAgfSwgW192bS5fdihcIlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXNoYm9hcmRcXG4gICAgICAgICAgICAgICAgICAgICAgICBcIildKV0sIDEpXSwgMSldKV0sIDEpXSwgMSldKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi00NWU3ZGU4NFwiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtNDVlN2RlODRcIixcImhhc1Njb3BlZFwiOmZhbHNlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2luZGV4UGFnZS52dWVcbi8vIG1vZHVsZSBpZCA9IDE5NlxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJ2YXIgZGlzcG9zZWQgPSBmYWxzZVxuZnVuY3Rpb24gaW5qZWN0U3R5bGUgKHNzckNvbnRleHQpIHtcbiAgaWYgKGRpc3Bvc2VkKSByZXR1cm5cbiAgcmVxdWlyZShcIiEhdnVlLXN0eWxlLWxvYWRlciFjc3MtbG9hZGVyP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXg/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTczY2Y5NjNlXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSFzdHlsdXMtbG9hZGVyIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXN0eWxlcyZpbmRleD0wIS4vYXV0aFBhZ2UudnVlXCIpXG59XG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIikoXG4gIC8qIHNjcmlwdCAqL1xuICByZXF1aXJlKFwiISFiYWJlbC1sb2FkZXI/e1xcXCJjYWNoZURpcmVjdG9yeVxcXCI6dHJ1ZSxcXFwicHJlc2V0c1xcXCI6W1tcXFwiZW52XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlLFxcXCJ0YXJnZXRzXFxcIjp7XFxcImJyb3dzZXJzXFxcIjpbXFxcIj4gMiVcXFwiXSxcXFwidWdsaWZ5XFxcIjp0cnVlfX1dLFtcXFwiZXMyMDE1XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlfV0sW1xcXCJzdGFnZS0yXFxcIl1dfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL2F1dGhQYWdlLnZ1ZVwiKSxcbiAgLyogdGVtcGxhdGUgKi9cbiAgcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyL2luZGV4P3tcXFwiaWRcXFwiOlxcXCJkYXRhLXYtNzNjZjk2M2VcXFwiLFxcXCJoYXNTY29wZWRcXFwiOmZhbHNlfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vYXV0aFBhZ2UudnVlXCIpLFxuICAvKiBzdHlsZXMgKi9cbiAgaW5qZWN0U3R5bGUsXG4gIC8qIHNjb3BlSWQgKi9cbiAgbnVsbCxcbiAgLyogbW9kdWxlSWRlbnRpZmllciAoc2VydmVyIG9ubHkpICovXG4gIG51bGxcbilcbkNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL2F1dGhQYWdlLnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gYXV0aFBhZ2UudnVlOiBmdW5jdGlvbmFsIGNvbXBvbmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0ZW1wbGF0ZXMsIHRoZXkgc2hvdWxkIHVzZSByZW5kZXIgZnVuY3Rpb25zLlwiKX1cblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LTczY2Y5NjNlXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtNzNjZjk2M2VcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9hdXRoUGFnZS52dWVcbi8vIG1vZHVsZSBpZCA9IDE5N1xuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtNzNjZjk2M2VcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vYXV0aFBhZ2UudnVlXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXNDbGllbnQuanNcIikoXCI0ZWM3YzhlMlwiLCBjb250ZW50LCBmYWxzZSk7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG4gLy8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3NcbiBpZighY29udGVudC5sb2NhbHMpIHtcbiAgIG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi03M2NmOTYzZVxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9hdXRoUGFnZS52dWVcIiwgZnVuY3Rpb24oKSB7XG4gICAgIHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtNzNjZjk2M2VcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vYXV0aFBhZ2UudnVlXCIpO1xuICAgICBpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcbiAgICAgdXBkYXRlKG5ld0NvbnRlbnQpO1xuICAgfSk7XG4gfVxuIC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3NcbiBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTczY2Y5NjNlXCIsXCJzY29wZWRcIjpmYWxzZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9hdXRoUGFnZS52dWVcbi8vIG1vZHVsZSBpZCA9IDE5OFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHRydWUpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiXFxuLmF1dGgtcGFnZSB7XFxuICBoZWlnaHQ6IDEwMCU7XFxuICBtaW4taGVpZ2h0OiAxMDB2aDtcXG59XFxuLmF1dGgtcGFnZSAuci1pbWFnZS1ib3ggaW1nIHtcXG4gIHdpZHRoOiAxNTBweDtcXG59XFxuLmF1dGgtcGFnZSAuYXV0aC1zY3JlZW5zIHtcXG4gIHBhZGRpbmctdG9wOiA0MHB4O1xcbiAgbWluLWhlaWdodDogNDgwcHg7XFxufVxcbi5yLWZhZGUtZW50ZXIge1xcbiAgb3BhY2l0eTogMDtcXG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtMjBweCk7XFxufVxcbi5yLWZhZGUtZW50ZXItYWN0aXZlIHtcXG4gIHRyYW5zaXRpb246IGFsbCAwLjJzIGxpbmVhcjtcXG59XFxuLnItZmFkZS1sZWF2ZS1hY3RpdmUge1xcbiAgdHJhbnNpdGlvbjogYWxsIDAuMXMgbGluZWFyO1xcbiAgb3BhY2l0eTogMDtcXG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgyMHB4KTtcXG59XFxuXCIsIFwiXCIsIHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvYXV0aFBhZ2UudnVlXCIsXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvYXV0aFBhZ2UudnVlXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCI7QUE0REE7RUFFSSxhQUFBO0VBQ0Esa0JBQUE7Q0M1REg7QUQrRE87RUFDSSxhQUFBO0NDN0RYO0FEZ0VHO0VBQ0ksa0JBQUE7RUFDSixrQkFBQTtDQzlESDtBRGtFRDtFQUNJLFdBQUE7RUFDQSw2QkFBQTtDQ2hFSDtBRG1FRDtFQUNJLDRCQUFBO0NDakVIO0FEd0VEO0VBQ0ksNEJBQUE7RUFDQSxXQUFBO0VBQ0EsNEJBQUE7Q0N0RUhcIixcImZpbGVcIjpcImF1dGhQYWdlLnZ1ZVwiLFwic291cmNlc0NvbnRlbnRcIjpbXCJcXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5AaW1wb3J0ICd+c3R5bGVzL3N0eWx1cy9jb2xvcnMnO1xcbi5hdXRoLXBhZ2V7XFxuICAgIC8vIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gICAgaGVpZ2h0OiAxMDAlO1xcbiAgICBtaW4taGVpZ2h0IDEwMHZoO1xcbiAgICAvLyBiYWNrZ3JvdW5kLWNvbG9yOiAkZ3JleS5saWdodGVuLTI7ICBcXG4gICAgLnItaW1hZ2UtYm94e1xcbiAgICAgICAgaW1neyBcXG4gICAgICAgICAgICB3aWR0aDogMTUwcHg7XFxuICAgICAgICB9XFxuICAgIH1cXG4gICAgLmF1dGgtc2NyZWVuc3tcXG4gICAgICAgIHBhZGRpbmctdG9wOiA0MHB4O1xcbiAgICBtaW4taGVpZ2h0IDQ4MHB4O1xcbiAgICB9XFxufVxcblxcbi5yLWZhZGUtZW50ZXIge1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTIwcHgpO1xcbn1cXG5cXG4uci1mYWRlLWVudGVyLWFjdGl2ZSB7XFxuICAgIHRyYW5zaXRpb246IGFsbCAuMnMgbGluZWFyO1xcbn1cXG5cXG4uci1mYWRlLWxlYXZlIHtcXG4gICAgLyogb3BhY2l0eTogMDsgKi9cXG59XFxuXFxuLnItZmFkZS1sZWF2ZS1hY3RpdmUge1xcbiAgICB0cmFuc2l0aW9uOiBhbGwgLjFzIGxpbmVhcjtcXG4gICAgb3BhY2l0eTogMDtcXG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDIwcHgpO1xcbn1cXG5cIixcIi5hdXRoLXBhZ2Uge1xcbiAgaGVpZ2h0OiAxMDAlO1xcbiAgbWluLWhlaWdodDogMTAwdmg7XFxufVxcbi5hdXRoLXBhZ2UgLnItaW1hZ2UtYm94IGltZyB7XFxuICB3aWR0aDogMTUwcHg7XFxufVxcbi5hdXRoLXBhZ2UgLmF1dGgtc2NyZWVucyB7XFxuICBwYWRkaW5nLXRvcDogNDBweDtcXG4gIG1pbi1oZWlnaHQ6IDQ4MHB4O1xcbn1cXG4uci1mYWRlLWVudGVyIHtcXG4gIG9wYWNpdHk6IDA7XFxuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTIwcHgpO1xcbn1cXG4uci1mYWRlLWVudGVyLWFjdGl2ZSB7XFxuICB0cmFuc2l0aW9uOiBhbGwgMC4ycyBsaW5lYXI7XFxufVxcbi5yLWZhZGUtbGVhdmUtYWN0aXZlIHtcXG4gIHRyYW5zaXRpb246IGFsbCAwLjFzIGxpbmVhcjtcXG4gIG9wYWNpdHk6IDA7XFxuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMjBweCk7XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi03M2NmOTYzZVwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvYXV0aFBhZ2UudnVlXG4vLyBtb2R1bGUgaWQgPSAxOTlcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiPHRlbXBsYXRlPlxuICAgIDx2LWFwcD5cbiAgICAgICAgPG1haW4+XG4gICAgICAgICAgICA8di1jb250YWluZXIgZmx1aWQgY2xhc3M9XCJhdXRoLXBhZ2VcIj5cbiAgICAgICAgICAgICAgICA8di1sYXlvdXQgY2xhc3M9XCJjb250YWluIG10LTNcIiBqdXN0aWZ5LWNlbnRlcj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInItaW1hZ2UtYm94XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cm91dGVyLWxpbmsgOnRvPVwie25hbWU6ICdpbmRleCd9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aW1nIGNsYXNzPVwiY2xpY2thYmxlXCIgc3JjPVwiL2ltYWdlcy9sb2dvLmpwZWdcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC92LWxheW91dD5cbiAgICBcbiAgICAgICAgICAgICAgICA8di1sYXlvdXQgY2xhc3M9XCJhdXRoLXNjcmVlbnNcIiBqdXN0aWZ5LWNlbnRlcj5cbiAgICAgICAgICAgICAgICAgICAgPHYtZmxleCB4czEyIHNtOCBtZDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dHJhbnNpdGlvbiBuYW1lPVwici1mYWRlXCIgbW9kZT1cIm91dC1pblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxrZWVwLWFsaXZlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cm91dGVyLXZpZXc+PC9yb3V0ZXItdmlldz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2tlZXAtYWxpdmU+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RyYW5zaXRpb24+XG4gICAgICAgICAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICAgICAgICAgIDwvdi1sYXlvdXQ+XG4gICAgXG4gICAgICAgICAgICAgICAgPHYtbGF5b3V0IGNsYXNzPVwiY29udGFpbiBtdC01XCIganVzdGlmeS1jZW50ZXI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyLXN1Yi10aXRsZS1ib3hcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxyb3V0ZXItbGluayB0YWc9XCJzcGFuXCIgOnRvPVwie25hbWU6ICdpbmRleCd9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHYtYnRuIHByaW1hcnkgbGFyZ2UgZmxhdD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSG9tZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3JvdXRlci1saW5rPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHJvdXRlci1saW5rIHRhZz1cInNwYW5cIiA6dG89XCJ7bmFtZTogJ2F1dGgubG9naW4nfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx2LWJ0biBzZWNvbmRhcnkgbGFyZ2UgZmxhdD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTG9naW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxyb3V0ZXItbGluayB0YWc9XCJzcGFuXCIgOnRvPVwie25hbWU6ICdhdXRoLnJlZ2lzdGVyJ31cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8di1idG4gc2Vjb25kYXJ5IGxhcmdlIGZsYXQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlZ2lzdGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cm91dGVyLWxpbmsgdGFnPVwic3BhblwiIDp0bz1cIntuYW1lOiAnZGFzaC5ob21lJ31cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8di1idG4gcHJpbWFyeSBsYXJnZSBmbGF0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXNoYm9hcmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC92LWxheW91dD5cbiAgICAgICAgICAgIDwvdi1jb250YWluZXI+XG4gICAgICAgIDwvbWFpbj5cbiAgICBcbiAgICAgICAgPCEtLSA8di1mb290ZXI+PC92LWZvb3Rlcj4gLS0+XG4gICAgPC92LWFwcD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5leHBvcnQgZGVmYXVsdCB7XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzdHlsdXNcIj5cbkBpbXBvcnQgJ35zdHlsZXMvc3R5bHVzL2NvbG9ycyc7XG4uYXV0aC1wYWdle1xuICAgIC8vIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICBoZWlnaHQ6IDEwMCU7XG4gICAgbWluLWhlaWdodCAxMDB2aDtcbiAgICAvLyBiYWNrZ3JvdW5kLWNvbG9yOiAkZ3JleS5saWdodGVuLTI7ICBcbiAgICAuci1pbWFnZS1ib3h7XG4gICAgICAgIGltZ3sgXG4gICAgICAgICAgICB3aWR0aDogMTUwcHg7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLmF1dGgtc2NyZWVuc3tcbiAgICAgICAgcGFkZGluZy10b3A6IDQwcHg7XG4gICAgbWluLWhlaWdodCA0ODBweDtcbiAgICB9XG59XG5cbi5yLWZhZGUtZW50ZXIge1xuICAgIG9wYWNpdHk6IDA7XG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC0yMHB4KTtcbn1cblxuLnItZmFkZS1lbnRlci1hY3RpdmUge1xuICAgIHRyYW5zaXRpb246IGFsbCAuMnMgbGluZWFyO1xufVxuXG4uci1mYWRlLWxlYXZlIHtcbiAgICAvKiBvcGFjaXR5OiAwOyAqL1xufVxuXG4uci1mYWRlLWxlYXZlLWFjdGl2ZSB7XG4gICAgdHJhbnNpdGlvbjogYWxsIC4xcyBsaW5lYXI7XG4gICAgb3BhY2l0eTogMDtcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMjBweCk7XG59XG48L3N0eWxlPlxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIGF1dGhQYWdlLnZ1ZT81ZmZiYTNmNiIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygndi1hcHAnLCBbX2MoJ21haW4nLCBbX2MoJ3YtY29udGFpbmVyJywge1xuICAgIHN0YXRpY0NsYXNzOiBcImF1dGgtcGFnZVwiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcImZsdWlkXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi1sYXlvdXQnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwiY29udGFpbiBtdC0zXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwianVzdGlmeS1jZW50ZXJcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCdkaXYnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwici1pbWFnZS1ib3hcIlxuICB9LCBbX2MoJ3JvdXRlci1saW5rJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInRvXCI6IHtcbiAgICAgICAgbmFtZTogJ2luZGV4J1xuICAgICAgfVxuICAgIH1cbiAgfSwgW19jKCdpbWcnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwiY2xpY2thYmxlXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwic3JjXCI6IFwiL2ltYWdlcy9sb2dvLmpwZWdcIlxuICAgIH1cbiAgfSldKV0sIDEpXSksIF92bS5fdihcIiBcIiksIF9jKCd2LWxheW91dCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJhdXRoLXNjcmVlbnNcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJqdXN0aWZ5LWNlbnRlclwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtZmxleCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ4czEyXCI6IFwiXCIsXG4gICAgICBcInNtOFwiOiBcIlwiLFxuICAgICAgXCJtZDRcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd0cmFuc2l0aW9uJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcIm5hbWVcIjogXCJyLWZhZGVcIixcbiAgICAgIFwibW9kZVwiOiBcIm91dC1pblwiXG4gICAgfVxuICB9LCBbX2MoJ2tlZXAtYWxpdmUnLCBbX2MoJ3JvdXRlci12aWV3JyldLCAxKV0sIDEpXSwgMSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtbGF5b3V0Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcImNvbnRhaW4gbXQtNVwiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcImp1c3RpZnktY2VudGVyXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygnZGl2Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcInItc3ViLXRpdGxlLWJveFwiXG4gIH0sIFtfYygncm91dGVyLWxpbmsnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwidGFnXCI6IFwic3BhblwiLFxuICAgICAgXCJ0b1wiOiB7XG4gICAgICAgIG5hbWU6ICdpbmRleCdcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtfYygndi1idG4nLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwicHJpbWFyeVwiOiBcIlwiLFxuICAgICAgXCJsYXJnZVwiOiBcIlwiLFxuICAgICAgXCJmbGF0XCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfdm0uX3YoXCJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgSG9tZVxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiKV0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCdyb3V0ZXItbGluaycsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ0YWdcIjogXCJzcGFuXCIsXG4gICAgICBcInRvXCI6IHtcbiAgICAgICAgbmFtZTogJ2F1dGgubG9naW4nXG4gICAgICB9XG4gICAgfVxuICB9LCBbX2MoJ3YtYnRuJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInNlY29uZGFyeVwiOiBcIlwiLFxuICAgICAgXCJsYXJnZVwiOiBcIlwiLFxuICAgICAgXCJmbGF0XCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfdm0uX3YoXCJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTG9naW5cXG4gICAgICAgICAgICAgICAgICAgICAgICBcIildKV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygncm91dGVyLWxpbmsnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwidGFnXCI6IFwic3BhblwiLFxuICAgICAgXCJ0b1wiOiB7XG4gICAgICAgIG5hbWU6ICdhdXRoLnJlZ2lzdGVyJ1xuICAgICAgfVxuICAgIH1cbiAgfSwgW19jKCd2LWJ0bicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJzZWNvbmRhcnlcIjogXCJcIixcbiAgICAgIFwibGFyZ2VcIjogXCJcIixcbiAgICAgIFwiZmxhdFwiOiBcIlwiXG4gICAgfVxuICB9LCBbX3ZtLl92KFwiXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlZ2lzdGVyXFxuICAgICAgICAgICAgICAgICAgICAgICAgXCIpXSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3JvdXRlci1saW5rJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInRhZ1wiOiBcInNwYW5cIixcbiAgICAgIFwidG9cIjoge1xuICAgICAgICBuYW1lOiAnZGFzaC5ob21lJ1xuICAgICAgfVxuICAgIH1cbiAgfSwgW19jKCd2LWJ0bicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJwcmltYXJ5XCI6IFwiXCIsXG4gICAgICBcImxhcmdlXCI6IFwiXCIsXG4gICAgICBcImZsYXRcIjogXCJcIlxuICAgIH1cbiAgfSwgW192bS5fdihcIlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXNoYm9hcmRcXG4gICAgICAgICAgICAgICAgICAgICAgICBcIildKV0sIDEpXSwgMSldKV0sIDEpXSwgMSldKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi03M2NmOTYzZVwiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtNzNjZjk2M2VcIixcImhhc1Njb3BlZFwiOmZhbHNlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvYXV0aFBhZ2UudnVlXG4vLyBtb2R1bGUgaWQgPSAyMDFcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbmZ1bmN0aW9uIGluamVjdFN0eWxlIChzc3JDb250ZXh0KSB7XG4gIGlmIChkaXNwb3NlZCkgcmV0dXJuXG4gIHJlcXVpcmUoXCIhIXZ1ZS1zdHlsZS1sb2FkZXIhY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi1hODAwMGY2YVxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSFzdHlsdXMtbG9hZGVyIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXN0eWxlcyZpbmRleD0wIS4vZGFzaGJvYXJkUGFnZS52dWVcIilcbn1cbnZhciBDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplclwiKShcbiAgLyogc2NyaXB0ICovXG4gIHJlcXVpcmUoXCIhIWJhYmVsLWxvYWRlcj97XFxcImNhY2hlRGlyZWN0b3J5XFxcIjp0cnVlLFxcXCJwcmVzZXRzXFxcIjpbW1xcXCJlbnZcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2UsXFxcInRhcmdldHNcXFwiOntcXFwiYnJvd3NlcnNcXFwiOltcXFwiPiAyJVxcXCJdLFxcXCJ1Z2xpZnlcXFwiOnRydWV9fV0sW1xcXCJlczIwMTVcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2V9XSxbXFxcInN0YWdlLTJcXFwiXV19IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vZGFzaGJvYXJkUGFnZS52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LWE4MDAwZjZhXFxcIixcXFwiaGFzU2NvcGVkXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vZGFzaGJvYXJkUGFnZS52dWVcIiksXG4gIC8qIHN0eWxlcyAqL1xuICBpbmplY3RTdHlsZSxcbiAgLyogc2NvcGVJZCAqL1xuICBcImRhdGEtdi1hODAwMGY2YVwiLFxuICAvKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbiAgbnVsbFxuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9kYXNoYm9hcmRQYWdlLnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gZGFzaGJvYXJkUGFnZS52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtYTgwMDBmNmFcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi1hODAwMGY2YVwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZGFzaGJvYXJkUGFnZS52dWVcbi8vIG1vZHVsZSBpZCA9IDIwMlxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtYTgwMDBmNmFcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9kYXNoYm9hcmRQYWdlLnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiMzBhMzcxZTBcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtYTgwMDBmNmFcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9kYXNoYm9hcmRQYWdlLnZ1ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgdmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi1hODAwMGY2YVxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2Rhc2hib2FyZFBhZ2UudnVlXCIpO1xuICAgICBpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcbiAgICAgdXBkYXRlKG5ld0NvbnRlbnQpO1xuICAgfSk7XG4gfVxuIC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3NcbiBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LWE4MDAwZjZhXCIsXCJzY29wZWRcIjp0cnVlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZGFzaGJvYXJkUGFnZS52dWVcbi8vIG1vZHVsZSBpZCA9IDIwM1xuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHRydWUpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiXFxuLmZpeGVkLXRvcFtkYXRhLXYtYTgwMDBmNmFdIHtcXG4gIHBvc2l0aW9uOiBmaXhlZDtcXG59XFxubWFpbiNtYWluW2RhdGEtdi1hODAwMGY2YV0ge1xcbiAgcGFkZGluZy10b3A6IDY0cHg7XFxufVxcbi5mYWRlLWVudGVyW2RhdGEtdi1hODAwMGY2YV0ge1xcbiAgb3BhY2l0eTogMDtcXG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKC0zMHB4KTtcXG59XFxuLmZhZGUtZW50ZXItYWN0aXZlW2RhdGEtdi1hODAwMGY2YV0ge1xcbiAgdHJhbnNpdGlvbjogYWxsIDAuMnMgZWFzZTtcXG59XFxuLmZhZGUtbGVhdmUtYWN0aXZlW2RhdGEtdi1hODAwMGY2YV0ge1xcbiAgdHJhbnNpdGlvbjogYWxsIDAuMnMgZWFzZTtcXG4gIG9wYWNpdHk6IDA7XFxuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgzMHB4KTtcXG59XFxuXCIsIFwiXCIsIHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL2Rhc2hib2FyZFBhZ2UudnVlXCIsXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9kYXNoYm9hcmRQYWdlLnZ1ZVwiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiO0FBcURBO0VBQ0ksZ0JBQUE7Q0NwREg7QURzREQ7RUFDSSxrQkFBQTtDQ3BESDtBRHVERDtFQUNJLFdBQUE7RUFDQSw0QkFBQTtDQ3JESDtBRHdERDtFQUNJLDBCQUFBO0NDdERIO0FENkREO0VBQ0ksMEJBQUE7RUFDQSxXQUFBO0VBQ0EsMkJBQUE7Q0MzREhcIixcImZpbGVcIjpcImRhc2hib2FyZFBhZ2UudnVlXCIsXCJzb3VyY2VzQ29udGVudFwiOltcIlxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcbi5maXhlZC10b3B7XFxuICAgIHBvc2l0aW9uOiBmaXhlZDtcXG59XFxubWFpbiNtYWlue1xcbiAgICBwYWRkaW5nLXRvcDogNjRweDtcXG59XFxuXFxuLmZhZGUtZW50ZXIge1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtMzBweCk7XFxufVxcblxcbi5mYWRlLWVudGVyLWFjdGl2ZSB7XFxuICAgIHRyYW5zaXRpb246IGFsbCAuMnMgZWFzZTtcXG59XFxuXFxuLmZhZGUtbGVhdmUge1xcbiAgICAvKiBvcGFjaXR5OiAwOyAqL1xcbn1cXG5cXG4uZmFkZS1sZWF2ZS1hY3RpdmUge1xcbiAgICB0cmFuc2l0aW9uOiBhbGwgLjJzIGVhc2U7XFxuICAgIG9wYWNpdHk6IDA7XFxuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKDMwcHgpO1xcbn1cXG5cIixcIi5maXhlZC10b3Age1xcbiAgcG9zaXRpb246IGZpeGVkO1xcbn1cXG5tYWluI21haW4ge1xcbiAgcGFkZGluZy10b3A6IDY0cHg7XFxufVxcbi5mYWRlLWVudGVyIHtcXG4gIG9wYWNpdHk6IDA7XFxuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtMzBweCk7XFxufVxcbi5mYWRlLWVudGVyLWFjdGl2ZSB7XFxuICB0cmFuc2l0aW9uOiBhbGwgMC4ycyBlYXNlO1xcbn1cXG4uZmFkZS1sZWF2ZS1hY3RpdmUge1xcbiAgdHJhbnNpdGlvbjogYWxsIDAuMnMgZWFzZTtcXG4gIG9wYWNpdHk6IDA7XFxuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgzMHB4KTtcXG59XFxuXCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LWE4MDAwZjZhXCIsXCJzY29wZWRcIjp0cnVlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZGFzaGJvYXJkUGFnZS52dWVcbi8vIG1vZHVsZSBpZCA9IDIwNFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJcbjx0ZW1wbGF0ZT5cbiAgICA8di1hcHA+XG4gICAgICAgIDx2LW5hdmlnYXRpb24tZHJhd2VyIHYtbW9kZWw9XCJzaWRlQmFyT3BlblwiIHBlcnNpc3RlbnQgZmxvYXRpbmcgY2xhc3M9XCJzZWNvbmRhcnkgZGFya2VuLTNcIj5cbiAgICAgICAgICAgIDxyLXNpZGViYXI+PC9yLXNpZGViYXI+XG4gICAgICAgIDwvdi1uYXZpZ2F0aW9uLWRyYXdlcj5cbiAgICBcbiAgICAgICAgPHItdG9wbmF2IGNsYXNzPVwiZml4ZWQtdG9wXCIgQHRvZ2dsZVNpZGViYXI9XCJzaWRlQmFyVG9nZ2xlXCI+PC9yLXRvcG5hdj5cbiAgICBcbiAgICAgICAgPG1haW4gaWQ9XCJtYWluXCI+XG4gICAgICAgICAgICA8di1jb250YWluZXIgZmx1aWQ+XG4gICAgICAgICAgICAgICAgPHRyYW5zaXRpb24gbmFtZT1cImZhZGVcIiBtb2RlPVwib3V0LWluXCI+XG4gICAgICAgICAgICAgICAgICAgIDxrZWVwLWFsaXZlPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHJvdXRlci12aWV3Pjwvcm91dGVyLXZpZXc+XG4gICAgICAgICAgICAgICAgICAgIDwva2VlcC1hbGl2ZT5cbiAgICAgICAgICAgICAgICA8L3RyYW5zaXRpb24+XG4gICAgICAgICAgICA8L3YtY29udGFpbmVyPlxuICAgICAgICA8L21haW4+XG4gICAgICAgIFxuICAgICAgICA8di1mb290ZXI+XG4gICAgICAgICAgICA8ci1mb290ZXI+PC9yLWZvb3Rlcj5cbiAgICAgICAgPC92LWZvb3Rlcj5cbiAgICA8L3YtYXBwPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmltcG9ydCByU2lkZWJhciBmcm9tICdAL2xheW91dHMvc2lkZWJhcic7XG5pbXBvcnQgclRvcG5hdiBmcm9tICdAL2xheW91dHMvdG9wbmF2JztcbmltcG9ydCByRm9vdGVyIGZyb20gJ0AvbGF5b3V0cy9mb290ZXInO1xuXG5pbXBvcnQgc3RvcmUgZnJvbSAnQC9zdG9yZS9zdG9yZSc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBkYXRhOiAoKSA9PiAoe1xuICAgICAgICBzaWRlQmFyT3BlbjogdHJ1ZVxuICAgIH0pLFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgc2lkZUJhclRvZ2dsZSgpIHtcbiAgICAgICAgICAgIHRoaXMuc2lkZUJhck9wZW4gPSAhdGhpcy5zaWRlQmFyT3BlbjtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY29tcG9uZW50czoge1xuICAgICAgICByU2lkZWJhcixcbiAgICAgICAgclRvcG5hdixcbiAgICAgICAgckZvb3RlcixcbiAgICB9LFxuICAgIGJlZm9yZVJvdXRlRW50ZXIodG8sIGZyb20sIG5leHQpIHtcbiAgICAgICAgbmV4dCgpO1xuICAgIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInN0eWx1c1wiIHNjb3BlZD5cbiAgICAuZml4ZWQtdG9we1xuICAgICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgfVxuICAgIG1haW4jbWFpbntcbiAgICAgICAgcGFkZGluZy10b3A6IDY0cHg7XG4gICAgfVxuXG4gICAgLmZhZGUtZW50ZXIge1xuICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtMzBweCk7XG4gICAgfVxuXG4gICAgLmZhZGUtZW50ZXItYWN0aXZlIHtcbiAgICAgICAgdHJhbnNpdGlvbjogYWxsIC4ycyBlYXNlO1xuICAgIH1cblxuICAgIC5mYWRlLWxlYXZlIHtcbiAgICAgICAgLyogb3BhY2l0eTogMDsgKi9cbiAgICB9XG5cbiAgICAuZmFkZS1sZWF2ZS1hY3RpdmUge1xuICAgICAgICB0cmFuc2l0aW9uOiBhbGwgLjJzIGVhc2U7XG4gICAgICAgIG9wYWNpdHk6IDA7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKDMwcHgpO1xuICAgIH1cbjwvc3R5bGU+XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gZGFzaGJvYXJkUGFnZS52dWU/MTkxZmNjMjAiLCJ2YXIgZGlzcG9zZWQgPSBmYWxzZVxuZnVuY3Rpb24gaW5qZWN0U3R5bGUgKHNzckNvbnRleHQpIHtcbiAgaWYgKGRpc3Bvc2VkKSByZXR1cm5cbiAgcmVxdWlyZShcIiEhdnVlLXN0eWxlLWxvYWRlciFjc3MtbG9hZGVyP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXg/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTMxZDNmMjY0XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3NpZGViYXIudnVlXCIpXG59XG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIikoXG4gIC8qIHNjcmlwdCAqL1xuICByZXF1aXJlKFwiISFiYWJlbC1sb2FkZXI/e1xcXCJjYWNoZURpcmVjdG9yeVxcXCI6dHJ1ZSxcXFwicHJlc2V0c1xcXCI6W1tcXFwiZW52XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlLFxcXCJ0YXJnZXRzXFxcIjp7XFxcImJyb3dzZXJzXFxcIjpbXFxcIj4gMiVcXFwiXSxcXFwidWdsaWZ5XFxcIjp0cnVlfX1dLFtcXFwiZXMyMDE1XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlfV0sW1xcXCJzdGFnZS0yXFxcIl1dfSEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL3NpZGViYXIudnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi0zMWQzZjI2NFxcXCIsXFxcImhhc1Njb3BlZFxcXCI6ZmFsc2V9IS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9zaWRlYmFyLnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIG51bGwsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy9zaWRlYmFyLnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gc2lkZWJhci52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtMzFkM2YyNjRcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi0zMWQzZjI2NFwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9sYXlvdXRzL3NpZGViYXIudnVlXG4vLyBtb2R1bGUgaWQgPSAyMDZcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTMxZDNmMjY0XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3NpZGViYXIudnVlXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXNDbGllbnQuanNcIikoXCIyY2Y4YmJhZFwiLCBjb250ZW50LCBmYWxzZSk7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG4gLy8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3NcbiBpZighY29udGVudC5sb2NhbHMpIHtcbiAgIG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0zMWQzZjI2NFxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9zaWRlYmFyLnZ1ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgdmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0zMWQzZjI2NFxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9zaWRlYmFyLnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi0zMWQzZjI2NFwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9sYXlvdXRzL3NpZGViYXIudnVlXG4vLyBtb2R1bGUgaWQgPSAyMDdcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSh0cnVlKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIlxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiXCIsXCJmaWxlXCI6XCJzaWRlYmFyLnZ1ZVwiLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTMxZDNmMjY0XCIsXCJzY29wZWRcIjpmYWxzZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvc2lkZWJhci52dWVcbi8vIG1vZHVsZSBpZCA9IDIwOFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCI8dGVtcGxhdGU+XG4gICAgIDx2LWNhcmQgY2xhc3M9XCJtYS0zXCI+IFxuICAgICAgICA8di1saXN0IGNsYXNzPVwicHktMFwiPlxuICAgICAgICAgICAgPHYtbGlzdC10aWxlIHYtZm9yPVwiaXRlbSBpbiBpdGVtc1wiIDprZXk9XCJpdGVtLnRpdGxlXCIgQGNsaWNrPVwiZ290b1BhdGgoaXRlbS5yb3V0ZSlcIj5cbiAgICAgICAgICAgICAgICA8di1saXN0LXRpbGUtYWN0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8di1pY29uPnt7IGl0ZW0uaWNvbiB9fTwvdi1pY29uPlxuICAgICAgICAgICAgICAgIDwvdi1saXN0LXRpbGUtYWN0aW9uPlxuICAgICAgICAgICAgICAgIDx2LWxpc3QtdGlsZS1jb250ZW50PlxuICAgICAgICAgICAgICAgICAgICA8di1saXN0LXRpbGUtdGl0bGU+e3sgaXRlbS50aXRsZSB9fTwvdi1saXN0LXRpbGUtdGl0bGU+XG4gICAgICAgICAgICAgICAgPC92LWxpc3QtdGlsZS1jb250ZW50PlxuICAgICAgICAgICAgPC92LWxpc3QtdGlsZT5cbiAgICAgICAgPC92LWxpc3Q+XG4gICAgIDwvdi1jYXJkPiBcbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5leHBvcnQgZGVmYXVsdCB7XG4gICAgZGF0YTogKCkgPT4gKHtcbiAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICAgIHsgdGl0bGU6ICdIb21lJywgaWNvbjogJ2hvbWUnLCByb3V0ZTogJ2Rhc2guaG9tZScgfSxcbiAgICAgICAgICAgIHsgdGl0bGU6ICdQb3N0cycsIGljb246ICdkYXNoYm9hcmQnLCByb3V0ZTogJ2Rhc2gucG9zdHMnIH0sXG4gICAgICAgICAgICB7IHRpdGxlOiAnTWVzc2FnZXMnLCBpY29uOiAnY2hhdCcsIHJvdXRlOiAnZGFzaC5tZXNzYWdlcycgfVxuICAgICAgICBdLFxuICAgIH0pLFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgZ290b1BhdGgocGF0aCl7XG4gICAgICAgICAgICB0aGlzLiRyb3V0ZXIucHVzaCh7IG5hbWU6IHBhdGh9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGU+XG5cbjwvc3R5bGU+XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gc2lkZWJhci52dWU/ZDZjM2Q0ZmEiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ3YtY2FyZCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJtYS0zXCJcbiAgfSwgW19jKCd2LWxpc3QnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwicHktMFwiXG4gIH0sIF92bS5fbCgoX3ZtLml0ZW1zKSwgZnVuY3Rpb24oaXRlbSkge1xuICAgIHJldHVybiBfYygndi1saXN0LXRpbGUnLCB7XG4gICAgICBrZXk6IGl0ZW0udGl0bGUsXG4gICAgICBvbjoge1xuICAgICAgICBcImNsaWNrXCI6IGZ1bmN0aW9uKCRldmVudCkge1xuICAgICAgICAgIF92bS5nb3RvUGF0aChpdGVtLnJvdXRlKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwgW19jKCd2LWxpc3QtdGlsZS1hY3Rpb24nLCBbX2MoJ3YtaWNvbicsIFtfdm0uX3YoX3ZtLl9zKGl0ZW0uaWNvbikpXSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtbGlzdC10aWxlLWNvbnRlbnQnLCBbX2MoJ3YtbGlzdC10aWxlLXRpdGxlJywgW192bS5fdihfdm0uX3MoaXRlbS50aXRsZSkpXSldLCAxKV0sIDEpXG4gIH0pKV0sIDEpXG59LHN0YXRpY1JlbmRlckZuczogW119XG5tb2R1bGUuZXhwb3J0cy5yZW5kZXIuX3dpdGhTdHJpcHBlZCA9IHRydWVcbmlmIChtb2R1bGUuaG90KSB7XG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKG1vZHVsZS5ob3QuZGF0YSkge1xuICAgICByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpLnJlcmVuZGVyKFwiZGF0YS12LTMxZDNmMjY0XCIsIG1vZHVsZS5leHBvcnRzKVxuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXI/e1wiaWRcIjpcImRhdGEtdi0zMWQzZjI2NFwiLFwiaGFzU2NvcGVkXCI6ZmFsc2V9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy9zaWRlYmFyLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjEwXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG5mdW5jdGlvbiBpbmplY3RTdHlsZSAoc3NyQ29udGV4dCkge1xuICBpZiAoZGlzcG9zZWQpIHJldHVyblxuICByZXF1aXJlKFwiISF2dWUtc3R5bGUtbG9hZGVyIWNzcy1sb2FkZXI/c291cmNlTWFwIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleD97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtZDY1NDcyNTRcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c3R5bGVzJmluZGV4PTAhLi90b3BuYXYudnVlXCIpXG59XG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIikoXG4gIC8qIHNjcmlwdCAqL1xuICByZXF1aXJlKFwiISFiYWJlbC1sb2FkZXI/e1xcXCJjYWNoZURpcmVjdG9yeVxcXCI6dHJ1ZSxcXFwicHJlc2V0c1xcXCI6W1tcXFwiZW52XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlLFxcXCJ0YXJnZXRzXFxcIjp7XFxcImJyb3dzZXJzXFxcIjpbXFxcIj4gMiVcXFwiXSxcXFwidWdsaWZ5XFxcIjp0cnVlfX1dLFtcXFwiZXMyMDE1XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlfV0sW1xcXCJzdGFnZS0yXFxcIl1dfSEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL3RvcG5hdi52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LWQ2NTQ3MjU0XFxcIixcXFwiaGFzU2NvcGVkXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vdG9wbmF2LnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIFwiZGF0YS12LWQ2NTQ3MjU0XCIsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy90b3BuYXYudnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSB0b3BuYXYudnVlOiBmdW5jdGlvbmFsIGNvbXBvbmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0ZW1wbGF0ZXMsIHRoZXkgc2hvdWxkIHVzZSByZW5kZXIgZnVuY3Rpb25zLlwiKX1cblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LWQ2NTQ3MjU0XCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtZDY1NDcyNTRcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy90b3BuYXYudnVlXG4vLyBtb2R1bGUgaWQgPSAyMTFcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWQ2NTQ3MjU0XFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vdG9wbmF2LnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiMWEwMjdmOWNcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtZDY1NDcyNTRcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi90b3BuYXYudnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWQ2NTQ3MjU0XFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vdG9wbmF2LnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi1kNjU0NzI1NFwiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvdG9wbmF2LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjEyXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodHJ1ZSk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJcXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cIiwgXCJcIiwge1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W10sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIlwiLFwiZmlsZVwiOlwidG9wbmF2LnZ1ZVwiLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LWQ2NTQ3MjU0XCIsXCJzY29wZWRcIjp0cnVlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy90b3BuYXYudnVlXG4vLyBtb2R1bGUgaWQgPSAyMTNcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiPHRlbXBsYXRlPlxuICAgIDx2LXRvb2xiYXIgZGFyayBjbGFzcz1cInByaW1hcnlcIj5cbiAgICAgICAgPHYtdG9vbGJhci1zaWRlLWljb24gQGNsaWNrLm5hdGl2ZS5zdG9wPVwic2lkZUJhclRvZ2dsZVwiPjwvdi10b29sYmFyLXNpZGUtaWNvbj5cbiAgICAgICAgPHYtdG9vbGJhci10aXRsZSBAY2xpY2s9XCJnb3RvSG9tZVwiIGNsYXNzPVwiY2xpY2thYmxlXCI+XG4gICAgICAgICAgICBDb21tdW5pdHkgV2F0Y2hcbiAgICAgICAgPC92LXRvb2xiYXItdGl0bGU+XG4gICAgICAgIDx2LXNwYWNlcj48L3Ytc3BhY2VyPlxuICAgICAgICA8di10b29sYmFyLWl0ZW1zPlxuICAgICAgICAgICAgPHYtYnRuIGZsYXQgQGNsaWNrPVwidG9nZ2xlRnVsbExvYWRcIj5cbiAgICAgICAgICAgICAgICA8di1pY29uPm1kaS1yZWxvYWQ8L3YtaWNvbj5cbiAgICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgICAgICA8di1idG4gZmxhdCBAY2xpY2s9XCJ0b2dnbGVTaXRlTG9hZFwiPlxuICAgICAgICAgICAgICAgIDx2LWljb24+bWRpLWxvb3A8L3YtaWNvbj5cbiAgICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgICAgICA8di1idG4gZmxhdCBAY2xpY2s9XCJsb2dvdXRcIj5cbiAgICAgICAgICAgICAgICA8di1pY29uPm1kaS1sb2dvdXQ8L3YtaWNvbj5cbiAgICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgIDwvdi10b29sYmFyLWl0ZW1zPlxuICAgIDwvdi10b29sYmFyPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmltcG9ydCB7IG1hcEFjdGlvbnMsIG1hcEdldHRlcnMsIG1hcE11dGF0aW9ucyB9IGZyb20gJ3Z1ZXgnO1xuaW1wb3J0IHN0b3JlVHlwZXMgZnJvbSAnLi8uLi9zdG9yZS90eXBlcyc7XG5pbXBvcnQgbG9hZGVyIGZyb20gJy4vLi4vaGVscGVycy9sb2FkZXInO1xuaW1wb3J0IHNuYWNrYmFyIGZyb20gJy4vLi4vaGVscGVycy9zbmFja2Jhcic7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBkYXRhOiAoKSA9PiAoe1xuICAgICAgICBzaWRlQmFyOiB0cnVlLFxuICAgIH0pLFxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIC4uLm1hcEdldHRlcnMoe1xuICAgICAgICAgICAgJ2lzTG9hZGluZyc6IHN0b3JlVHlwZXMuSVNfTE9BRElORyxcbiAgICAgICAgICAgICdpc0Z1bGxMb2FkaW5nJzogc3RvcmVUeXBlcy5JU19GVUxMX0xPQURJTkcsXG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIGdvdG9Ib21lKCkge1xuICAgICAgICAgICAgdGhpcy4kcm91dGVyLnB1c2goeyBuYW1lOiAnaW5kZXgnIH0pO1xuICAgICAgICB9LFxuICAgICAgICBzaWRlQmFyVG9nZ2xlKCkge1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgndG9nZ2xlU2lkZWJhcicpO1xuICAgICAgICB9LFxuICAgICAgICBsb2dvdXQoKSB7XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoTG9nb3V0KCk7XG4gICAgICAgICAgICBzbmFja2Jhci5maXJlKFwiWW91IGhhdmUgc3VjY2Vzc2Z1bGx5IGxvZ2dlZCBvdXRcIik7XG4gICAgICAgICAgICB0aGlzLiRyb3V0ZXIucHVzaCh7IG5hbWU6ICdpbmRleCcgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRvZ2dsZVNpdGVMb2FkKCkge1xuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcgPyBsb2FkZXIuc3RvcCgpIDogbG9hZGVyLnN0YXJ0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIHRvZ2dsZUZ1bGxMb2FkKCkge1xuICAgICAgICAgICAgdGhpcy5pc0Z1bGxMb2FkaW5nID8gbG9hZGVyLnN0b3AoKSA6IGxvYWRlci5zdGFydCgnZnVsbCcpO1xuICAgICAgICB9LFxuICAgICAgICAuLi5tYXBBY3Rpb25zKHN0b3JlVHlwZXMuYXV0aC5OQU1FLCB7XG4gICAgICAgICAgICBkaXNwYXRjaExvZ291dDogc3RvcmVUeXBlcy5hdXRoLlVTRVJfTE9HT1VUXG4gICAgICAgIH0pXG4gICAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBzY29wZWQ+XG5cbjwvc3R5bGU+XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gdG9wbmF2LnZ1ZT9kNTU3ZTliNCIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygndi10b29sYmFyJywge1xuICAgIHN0YXRpY0NsYXNzOiBcInByaW1hcnlcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJkYXJrXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi10b29sYmFyLXNpZGUtaWNvbicsIHtcbiAgICBuYXRpdmVPbjoge1xuICAgICAgXCJjbGlja1wiOiBmdW5jdGlvbigkZXZlbnQpIHtcbiAgICAgICAgJGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBfdm0uc2lkZUJhclRvZ2dsZSgkZXZlbnQpXG4gICAgICB9XG4gICAgfVxuICB9KSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtdG9vbGJhci10aXRsZScsIHtcbiAgICBzdGF0aWNDbGFzczogXCJjbGlja2FibGVcIixcbiAgICBvbjoge1xuICAgICAgXCJjbGlja1wiOiBfdm0uZ290b0hvbWVcbiAgICB9XG4gIH0sIFtfdm0uX3YoXCJcXG4gICAgICAgIENvbW11bml0eSBXYXRjaFxcbiAgICBcIildKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3Ytc3BhY2VyJyksIF92bS5fdihcIiBcIiksIF9jKCd2LXRvb2xiYXItaXRlbXMnLCBbX2MoJ3YtYnRuJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImZsYXRcIjogXCJcIlxuICAgIH0sXG4gICAgb246IHtcbiAgICAgIFwiY2xpY2tcIjogX3ZtLnRvZ2dsZUZ1bGxMb2FkXG4gICAgfVxuICB9LCBbX2MoJ3YtaWNvbicsIFtfdm0uX3YoXCJtZGktcmVsb2FkXCIpXSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtYnRuJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImZsYXRcIjogXCJcIlxuICAgIH0sXG4gICAgb246IHtcbiAgICAgIFwiY2xpY2tcIjogX3ZtLnRvZ2dsZVNpdGVMb2FkXG4gICAgfVxuICB9LCBbX2MoJ3YtaWNvbicsIFtfdm0uX3YoXCJtZGktbG9vcFwiKV0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWJ0bicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJmbGF0XCI6IFwiXCJcbiAgICB9LFxuICAgIG9uOiB7XG4gICAgICBcImNsaWNrXCI6IF92bS5sb2dvdXRcbiAgICB9XG4gIH0sIFtfYygndi1pY29uJywgW192bS5fdihcIm1kaS1sb2dvdXRcIildKV0sIDEpXSwgMSldLCAxKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi1kNjU0NzI1NFwiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtZDY1NDcyNTRcIixcImhhc1Njb3BlZFwiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy90b3BuYXYudnVlXG4vLyBtb2R1bGUgaWQgPSAyMTVcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbmZ1bmN0aW9uIGluamVjdFN0eWxlIChzc3JDb250ZXh0KSB7XG4gIGlmIChkaXNwb3NlZCkgcmV0dXJuXG4gIHJlcXVpcmUoXCIhIXZ1ZS1zdHlsZS1sb2FkZXIhY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0xNGYwZDI0M1xcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9mb290ZXIudnVlXCIpXG59XG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIikoXG4gIC8qIHNjcmlwdCAqL1xuICByZXF1aXJlKFwiISFiYWJlbC1sb2FkZXI/e1xcXCJjYWNoZURpcmVjdG9yeVxcXCI6dHJ1ZSxcXFwicHJlc2V0c1xcXCI6W1tcXFwiZW52XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlLFxcXCJ0YXJnZXRzXFxcIjp7XFxcImJyb3dzZXJzXFxcIjpbXFxcIj4gMiVcXFwiXSxcXFwidWdsaWZ5XFxcIjp0cnVlfX1dLFtcXFwiZXMyMDE1XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlfV0sW1xcXCJzdGFnZS0yXFxcIl1dfSEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL2Zvb3Rlci52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LTE0ZjBkMjQzXFxcIixcXFwiaGFzU2NvcGVkXFxcIjpmYWxzZX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL2Zvb3Rlci52dWVcIiksXG4gIC8qIHN0eWxlcyAqL1xuICBpbmplY3RTdHlsZSxcbiAgLyogc2NvcGVJZCAqL1xuICBudWxsLFxuICAvKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbiAgbnVsbFxuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvZm9vdGVyLnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gZm9vdGVyLnZ1ZTogZnVuY3Rpb25hbCBjb21wb25lbnRzIGFyZSBub3Qgc3VwcG9ydGVkIHdpdGggdGVtcGxhdGVzLCB0aGV5IHNob3VsZCB1c2UgcmVuZGVyIGZ1bmN0aW9ucy5cIil9XG5cbi8qIGhvdCByZWxvYWQgKi9cbmlmIChtb2R1bGUuaG90KSB7KGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhvdEFQSSA9IHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIilcbiAgaG90QVBJLmluc3RhbGwocmVxdWlyZShcInZ1ZVwiKSwgZmFsc2UpXG4gIGlmICghaG90QVBJLmNvbXBhdGlibGUpIHJldHVyblxuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmICghbW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgaG90QVBJLmNyZWF0ZVJlY29yZChcImRhdGEtdi0xNGYwZDI0M1wiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfSBlbHNlIHtcbiAgICBob3RBUEkucmVsb2FkKFwiZGF0YS12LTE0ZjBkMjQzXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9XG4gIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbiAoZGF0YSkge1xuICAgIGRpc3Bvc2VkID0gdHJ1ZVxuICB9KVxufSkoKX1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQuZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvZm9vdGVyLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjE2XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0xNGYwZDI0M1xcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9mb290ZXIudnVlXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXNDbGllbnQuanNcIikoXCI1NmMzZjM2NlwiLCBjb250ZW50LCBmYWxzZSk7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG4gLy8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3NcbiBpZighY29udGVudC5sb2NhbHMpIHtcbiAgIG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0xNGYwZDI0M1xcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9mb290ZXIudnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTE0ZjBkMjQzXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2Zvb3Rlci52dWVcIik7XG4gICAgIGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuICAgICB1cGRhdGUobmV3Q29udGVudCk7XG4gICB9KTtcbiB9XG4gLy8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIhLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtMTRmMGQyNDNcIixcInNjb3BlZFwiOmZhbHNlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy9mb290ZXIudnVlXG4vLyBtb2R1bGUgaWQgPSAyMTdcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSh0cnVlKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIlxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiXCIsXCJmaWxlXCI6XCJmb290ZXIudnVlXCIsXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtMTRmMGQyNDNcIixcInNjb3BlZFwiOmZhbHNlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy9mb290ZXIudnVlXG4vLyBtb2R1bGUgaWQgPSAyMThcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiPHRlbXBsYXRlPlxuICAgIDxkaXY+XG4gICAgICAgIDIwMTcgUmF5bW9uZFxuICAgIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBkYXRhOiAoKSA9PiAoe1xuICAgICAgICBzaWRlQmFyOiB0cnVlLCBcbiAgICB9KSxcbn1cbjwvc2NyaXB0PlxuXG48c3R5bGU+XG5cbjwvc3R5bGU+XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gZm9vdGVyLnZ1ZT81ODQwYWJmNSIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygnZGl2JywgW192bS5fdihcIlxcbiAgICAyMDE3IFJheW1vbmRcXG5cIildKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi0xNGYwZDI0M1wiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtMTRmMGQyNDNcIixcImhhc1Njb3BlZFwiOmZhbHNlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvZm9vdGVyLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjIwXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygndi1hcHAnLCBbX2MoJ3YtbmF2aWdhdGlvbi1kcmF3ZXInLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwic2Vjb25kYXJ5IGRhcmtlbi0zXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwicGVyc2lzdGVudFwiOiBcIlwiLFxuICAgICAgXCJmbG9hdGluZ1wiOiBcIlwiXG4gICAgfSxcbiAgICBtb2RlbDoge1xuICAgICAgdmFsdWU6IChfdm0uc2lkZUJhck9wZW4pLFxuICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCQkdikge1xuICAgICAgICBfdm0uc2lkZUJhck9wZW4gPSAkJHZcbiAgICAgIH0sXG4gICAgICBleHByZXNzaW9uOiBcInNpZGVCYXJPcGVuXCJcbiAgICB9XG4gIH0sIFtfYygnci1zaWRlYmFyJyldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3ItdG9wbmF2Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcImZpeGVkLXRvcFwiLFxuICAgIG9uOiB7XG4gICAgICBcInRvZ2dsZVNpZGViYXJcIjogX3ZtLnNpZGVCYXJUb2dnbGVcbiAgICB9XG4gIH0pLCBfdm0uX3YoXCIgXCIpLCBfYygnbWFpbicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJpZFwiOiBcIm1haW5cIlxuICAgIH1cbiAgfSwgW19jKCd2LWNvbnRhaW5lcicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJmbHVpZFwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3RyYW5zaXRpb24nLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwibmFtZVwiOiBcImZhZGVcIixcbiAgICAgIFwibW9kZVwiOiBcIm91dC1pblwiXG4gICAgfVxuICB9LCBbX2MoJ2tlZXAtYWxpdmUnLCBbX2MoJ3JvdXRlci12aWV3JyldLCAxKV0sIDEpXSwgMSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtZm9vdGVyJywgW19jKCdyLWZvb3RlcicpXSwgMSldLCAxKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi1hODAwMGY2YVwiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtYTgwMDBmNmFcIixcImhhc1Njb3BlZFwiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL2Rhc2hib2FyZFBhZ2UudnVlXG4vLyBtb2R1bGUgaWQgPSAyMjFcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiaW1wb3J0IEhvbWUgZnJvbSAnQC9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9ob21lU2NyZWVuLnZ1ZSc7XG5pbXBvcnQgUG9zdHMgZnJvbSAnQC9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9wb3N0c1NjcmVlbi52dWUnO1xuaW1wb3J0IE1lc3NhZ2VzIGZyb20gJ0AvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvbWVzc2FnZXNTY3JlZW4udnVlJztcblxuaW1wb3J0IHAgZnJvbSAnLi8uLi9hcGkvcG9zdHMnO1xuXG5leHBvcnQgZGVmYXVsdCBbe1xuICAgICAgICBwYXRoOiAnJyxcbiAgICAgICAgbmFtZTogJ2Rhc2guaG9tZScsXG4gICAgICAgIGNvbXBvbmVudDogSG9tZVxuICAgIH0sXG4gICAge1xuICAgICAgICBwYXRoOiAncG9zdHMnLFxuICAgICAgICBuYW1lOiAnZGFzaC5wb3N0cycsXG4gICAgICAgIGNvbXBvbmVudDogUG9zdHMsXG4gICAgICAgIGJlZm9yZUVudGVyOiAodG8sIGZyb20sIG5leHQpID0+IHtcbiAgICAgICAgICAgIHAuZ2V0QWxsKClcbiAgICAgICAgICAgICAgICAudGhlbihwb3N0cyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHBvc3RzKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJnZXQgcG9zdHMgYmVmb3JlIGRhc2hcIik7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3JpbmdcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgcGF0aDogJ21lc3NhZ2VzJyxcbiAgICAgICAgbmFtZTogJ2Rhc2gubWVzc2FnZXMnLFxuICAgICAgICBjb21wb25lbnQ6IE1lc3NhZ2VzXG4gICAgfSxcbl1cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3JvdXRlci9kYXNoYm9hcmRSb3V0ZXMuanMiLCJ2YXIgZGlzcG9zZWQgPSBmYWxzZVxuZnVuY3Rpb24gaW5qZWN0U3R5bGUgKHNzckNvbnRleHQpIHtcbiAgaWYgKGRpc3Bvc2VkKSByZXR1cm5cbiAgcmVxdWlyZShcIiEhdnVlLXN0eWxlLWxvYWRlciFjc3MtbG9hZGVyP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXg/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTM0Y2FiMjRhXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IXN0eWx1cy1sb2FkZXIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9ob21lU2NyZWVuLnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi9ob21lU2NyZWVuLnZ1ZVwiKSxcbiAgLyogdGVtcGxhdGUgKi9cbiAgcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyL2luZGV4P3tcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMzRjYWIyNGFcXFwiLFxcXCJoYXNTY29wZWRcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9ob21lU2NyZWVuLnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIFwiZGF0YS12LTM0Y2FiMjRhXCIsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvaG9tZVNjcmVlbi52dWVcIlxuaWYgKENvbXBvbmVudC5lc01vZHVsZSAmJiBPYmplY3Qua2V5cyhDb21wb25lbnQuZXNNb2R1bGUpLnNvbWUoZnVuY3Rpb24gKGtleSkge3JldHVybiBrZXkgIT09IFwiZGVmYXVsdFwiICYmIGtleS5zdWJzdHIoMCwgMikgIT09IFwiX19cIn0pKSB7Y29uc29sZS5lcnJvcihcIm5hbWVkIGV4cG9ydHMgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gKi52dWUgZmlsZXMuXCIpfVxuaWYgKENvbXBvbmVudC5vcHRpb25zLmZ1bmN0aW9uYWwpIHtjb25zb2xlLmVycm9yKFwiW3Z1ZS1sb2FkZXJdIGhvbWVTY3JlZW4udnVlOiBmdW5jdGlvbmFsIGNvbXBvbmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0ZW1wbGF0ZXMsIHRoZXkgc2hvdWxkIHVzZSByZW5kZXIgZnVuY3Rpb25zLlwiKX1cblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LTM0Y2FiMjRhXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtMzRjYWIyNGFcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvaG9tZVNjcmVlbi52dWVcbi8vIG1vZHVsZSBpZCA9IDIyM1xuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMzRjYWIyNGFcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9ob21lU2NyZWVuLnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiMGI3Mjg4NGNcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMzRjYWIyNGFcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9ob21lU2NyZWVuLnZ1ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgdmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0zNGNhYjI0YVxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2hvbWVTY3JlZW4udnVlXCIpO1xuICAgICBpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcbiAgICAgdXBkYXRlKG5ld0NvbnRlbnQpO1xuICAgfSk7XG4gfVxuIC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3NcbiBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTM0Y2FiMjRhXCIsXCJzY29wZWRcIjp0cnVlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9ob21lU2NyZWVuLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjI0XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodHJ1ZSk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJcXG5kaXZbZGF0YS12LTM0Y2FiMjRhXSB7XFxuICB0ZXh0LWFsaWduOiBjZW50ZXI7XFxufVxcbmltZ1tkYXRhLXYtMzRjYWIyNGFdIHtcXG4gIHdpZHRoOiAxNTBweDtcXG59XFxuaDFbZGF0YS12LTM0Y2FiMjRhXSB7XFxuICBjb2xvcjogI2YwMDtcXG59XFxuXCIsIFwiXCIsIHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9ob21lU2NyZWVuLnZ1ZVwiLFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9ob21lU2NyZWVuLnZ1ZVwiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiO0FBY0E7RUFDSSxtQkFBQTtDQ2JIO0FEZ0JEO0VBQ0ksYUFBQTtDQ2RIO0FEaUJEO0VBQ0ksWUFBQTtDQ2ZIXCIsXCJmaWxlXCI6XCJob21lU2NyZWVuLnZ1ZVwiLFwic291cmNlc0NvbnRlbnRcIjpbXCJcXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5kaXYge1xcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXJcXG59XFxuXFxuaW1nIHtcXG4gICAgd2lkdGg6IDE1MHB4XFxufVxcblxcbmgxIHtcXG4gICAgY29sb3I6IHJlZDtcXG59XFxuXFxuXCIsXCJkaXYge1xcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xcbn1cXG5pbWcge1xcbiAgd2lkdGg6IDE1MHB4O1xcbn1cXG5oMSB7XFxuICBjb2xvcjogI2YwMDtcXG59XFxuXCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTM0Y2FiMjRhXCIsXCJzY29wZWRcIjp0cnVlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9ob21lU2NyZWVuLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjI1XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIjx0ZW1wbGF0ZT5cbiAgICA8ZGl2PlxuICAgICAgICA8aW1nIHNyYz1cIi9pbWFnZXMvbG9nby5zdmdcIiBhbHQ9XCJWdWV0aWZ5LmpzXCI+XG4gICAgICAgIDxoMT5Ib21lIFNjcmVlbjwvaDE+XG4gICAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0PlxuZXhwb3J0IGRlZmF1bHQge1xuXG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzdHlsdXNcIiBzY29wZWQ+XG5kaXYge1xuICAgIHRleHQtYWxpZ246IGNlbnRlclxufVxuXG5pbWcge1xuICAgIHdpZHRoOiAxNTBweFxufVxuXG5oMSB7XG4gICAgY29sb3I6IHJlZDtcbn1cblxuPC9zdHlsZT5cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyBob21lU2NyZWVuLnZ1ZT81NWUzNjc3YSIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfdm0uX20oMClcbn0sc3RhdGljUmVuZGVyRm5zOiBbZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygnZGl2JywgW19jKCdpbWcnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwic3JjXCI6IFwiL2ltYWdlcy9sb2dvLnN2Z1wiLFxuICAgICAgXCJhbHRcIjogXCJWdWV0aWZ5LmpzXCJcbiAgICB9XG4gIH0pLCBfdm0uX3YoXCIgXCIpLCBfYygnaDEnLCBbX3ZtLl92KFwiSG9tZSBTY3JlZW5cIildKV0pXG59XX1cbm1vZHVsZS5leHBvcnRzLnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgIHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIikucmVyZW5kZXIoXCJkYXRhLXYtMzRjYWIyNGFcIiwgbW9kdWxlLmV4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LTM0Y2FiMjRhXCIsXCJoYXNTY29wZWRcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL2hvbWVTY3JlZW4udnVlXG4vLyBtb2R1bGUgaWQgPSAyMjdcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbmZ1bmN0aW9uIGluamVjdFN0eWxlIChzc3JDb250ZXh0KSB7XG4gIGlmIChkaXNwb3NlZCkgcmV0dXJuXG4gIHJlcXVpcmUoXCIhIXZ1ZS1zdHlsZS1sb2FkZXIhY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi1lY2Y0MGVjMlxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hc3R5bHVzLWxvYWRlciEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Bvc3RzU2NyZWVuLnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi9wb3N0c1NjcmVlbi52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LWVjZjQwZWMyXFxcIixcXFwiaGFzU2NvcGVkXFxcIjpmYWxzZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3Bvc3RzU2NyZWVuLnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIG51bGwsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvcG9zdHNTY3JlZW4udnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSBwb3N0c1NjcmVlbi52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtZWNmNDBlYzJcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi1lY2Y0MGVjMlwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9wb3N0c1NjcmVlbi52dWVcbi8vIG1vZHVsZSBpZCA9IDIyOFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtZWNmNDBlYzJcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcG9zdHNTY3JlZW4udnVlXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXNDbGllbnQuanNcIikoXCIwYjhiNGMxOVwiLCBjb250ZW50LCBmYWxzZSk7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG4gLy8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3NcbiBpZighY29udGVudC5sb2NhbHMpIHtcbiAgIG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi1lY2Y0MGVjMlxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9wb3N0c1NjcmVlbi52dWVcIiwgZnVuY3Rpb24oKSB7XG4gICAgIHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtZWNmNDBlYzJcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcG9zdHNTY3JlZW4udnVlXCIpO1xuICAgICBpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcbiAgICAgdXBkYXRlKG5ld0NvbnRlbnQpO1xuICAgfSk7XG4gfVxuIC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3NcbiBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LWVjZjQwZWMyXCIsXCJzY29wZWRcIjpmYWxzZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvcG9zdHNTY3JlZW4udnVlXG4vLyBtb2R1bGUgaWQgPSAyMjlcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSh0cnVlKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIlxcbi5mYWItaG9sZGVyIHtcXG4gIHBvc2l0aW9uOiBmaXhlZDtcXG4gIHotaW5kZXg6IDIwO1xcbiAgYm90dG9tOiAzMHB4O1xcbiAgcmlnaHQ6IDMwcHg7XFxufVxcbkBtZWRpYSBvbmx5IHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAyNXB4KSB7XFxuLmZhYi1ob2xkZXIge1xcbiAgICByaWdodDogMTUwcHg7XFxufVxcbn1cXG4uY29tbWVudC1ib3gge1xcbiAgbWF4LWhlaWdodDogNTAwcHg7XFxuICBvdmVyZmxvdzogaGlkZGVuO1xcbn1cXG4uZmFkZS1lbnRlci1hY3RpdmUge1xcbiAgdHJhbnNpdGlvbjogbWF4LWhlaWdodCAwLjJzIGVhc2UtaW47XFxufVxcbi5mYWRlLWxlYXZlLWFjdGl2ZSB7XFxuICB0cmFuc2l0aW9uOiBtYXgtaGVpZ2h0IDAuMnMgZWFzZS1vdXQ7XFxufVxcbi5mYWRlLWVudGVyLFxcbi5mYWRlLWxlYXZlLWFjdGl2ZSB7XFxuICBtYXgtaGVpZ2h0OiAwcHg7XFxufVxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvcG9zdHNTY3JlZW4udnVlXCIsXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL3Bvc3RzU2NyZWVuLnZ1ZVwiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiO0FBdUVBO0VBQ0ksZ0JBQUE7RUFDQSxZQUFBO0VBQ0EsYUFBQTtFQUNBLFlBQUE7Q0N0RUg7QUR1RTRDO0FBQUE7SUFDckMsYUFBQTtDQ3BFTDtDQUNGO0FEc0VEO0VBQ0ksa0JBQUE7RUFDQSxpQkFBQTtDQ3BFSDtBRHVFRDtFQUNDLG9DQUFBO0NDckVBO0FEdUVEO0VBQ0MscUNBQUE7Q0NyRUE7QUR1RUQ7O0VBQ0MsZ0JBQUE7Q0NwRUFcIixcImZpbGVcIjpcInBvc3RzU2NyZWVuLnZ1ZVwiLFwic291cmNlc0NvbnRlbnRcIjpbXCJcXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG4uZmFiLWhvbGRlcntcXG4gICAgcG9zaXRpb246IGZpeGVkO1xcbiAgICB6LWluZGV4OiAyMDtcXG4gICAgYm90dG9tOiAzMHB4O1xcbiAgICByaWdodDogMzBweDtcXG4gICAgQG1lZGlhIG9ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDI1cHgpe1xcbiAgICAgICAgcmlnaHQ6IDE1MHB4O1xcbiAgICB9XFxufVxcbi5jb21tZW50LWJveHtcXG4gICAgbWF4LWhlaWdodDogNTAwcHg7XFxuICAgIG92ZXJmbG93OiBoaWRkZW47XFxufVxcblxcdFxcbi5mYWRlLWVudGVyLWFjdGl2ZSBcXG5cXHR0cmFuc2l0aW9uIG1heC1oZWlnaHQgLjJzIGVhc2UtaW5cXG5cXG4uZmFkZS1sZWF2ZS1hY3RpdmVcXG5cXHR0cmFuc2l0aW9uIG1heC1oZWlnaHQgLjJzIGVhc2Utb3V0XFxuXFxuLmZhZGUtZW50ZXIsIC5mYWRlLWxlYXZlLWFjdGl2ZVxcblxcdG1heC1oZWlnaHQgMHB4XFxuXFxuXCIsXCIuZmFiLWhvbGRlciB7XFxuICBwb3NpdGlvbjogZml4ZWQ7XFxuICB6LWluZGV4OiAyMDtcXG4gIGJvdHRvbTogMzBweDtcXG4gIHJpZ2h0OiAzMHB4O1xcbn1cXG5AbWVkaWEgb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMjVweCkge1xcbiAgLmZhYi1ob2xkZXIge1xcbiAgICByaWdodDogMTUwcHg7XFxuICB9XFxufVxcbi5jb21tZW50LWJveCB7XFxuICBtYXgtaGVpZ2h0OiA1MDBweDtcXG4gIG92ZXJmbG93OiBoaWRkZW47XFxufVxcbi5mYWRlLWVudGVyLWFjdGl2ZSB7XFxuICB0cmFuc2l0aW9uOiBtYXgtaGVpZ2h0IDAuMnMgZWFzZS1pbjtcXG59XFxuLmZhZGUtbGVhdmUtYWN0aXZlIHtcXG4gIHRyYW5zaXRpb246IG1heC1oZWlnaHQgMC4ycyBlYXNlLW91dDtcXG59XFxuLmZhZGUtZW50ZXIsXFxuLmZhZGUtbGVhdmUtYWN0aXZlIHtcXG4gIG1heC1oZWlnaHQ6IDBweDtcXG59XFxuXCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LWVjZjQwZWMyXCIsXCJzY29wZWRcIjpmYWxzZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvcG9zdHNTY3JlZW4udnVlXG4vLyBtb2R1bGUgaWQgPSAyMzBcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiPHRlbXBsYXRlPlxuICAgIDxkaXY+XG4gICAgICAgIDx2LWxheW91dCBjbGFzcz1cIm1iLTNcIiBqdXN0aWZ5LWNlbnRlcj5cbiAgICAgICAgICAgIDx2LWZsZXggeHMxMiBzbTggbWQ2IGxnNT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGxpbmVcIj5Qb3N0czwvZGl2PlxuICAgICAgICAgICAgPC92LWZsZXg+XG4gICAgICAgIDwvdi1sYXlvdXQ+XG4gICAgXG4gICAgICAgIDx2LWxheW91dCB3cmFwIGp1c3RpZnktY2VudGVyPlxuICAgICAgICAgICAgPHYtZmxleCB4czEyIHNtOCBtZDYgbGc1PlxuICAgICAgICAgICAgICAgIDxyLXBvc3RzIDpwb3N0cz1cInBvc3RzXCI+PC9yLXBvc3RzPlxuICAgICAgICAgICAgPC92LWZsZXg+XG4gICAgICAgIDwvdi1sYXlvdXQ+XG4gICAgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJmYWItaG9sZGVyXCI+XG4gICAgICAgICAgICA8di1idG4gQGNsaWNrLm5hdGl2ZS5zdG9wPVwib3Blbk5ld1Bvc3RcIiBkYXJrIGZhYiBjbGFzcz1cInByaW1hcnlcIiB2LXRvb2x0aXA6dG9wPVwieyBodG1sOiAnbmV3IHBvc3QnIH1cIj5cbiAgICAgICAgICAgICAgICA8di1pY29uPmFkZDwvdi1pY29uPlxuICAgICAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgPC9kaXY+XG4gICAgXG4gICAgICAgIDx2LWRpYWxvZyB2LW1vZGVsPVwibmV3UG9zdE1vZGFsXCIgd2lkdGg9XCI2MDBweFwiPlxuICAgICAgICAgICAgPHItYWRkLXBvc3QgOmNsZWFyPVwiY2xlYXJOZXdQb3N0XCIgdXNlckltYWdlPVwiL2ltYWdlcy9hdmF0YXIxLmpwZ1wiIEBjYW5jZWxlZD1cIm5ld1Bvc3RNb2RhbCA9IGZhbHNlXCIgQHBvc3RlZD1cImFkZFBvc3RcIj48L3ItYWRkLXBvc3Q+XG4gICAgICAgIDwvdi1kaWFsb2c+XG4gICAgXG4gICAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0PlxuaW1wb3J0IFBvc3RzIGZyb20gJ0AvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdExpc3QnXG5pbXBvcnQgQWRkUG9zdCBmcm9tICdAL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL0FkZFBvc3QnXG5pbXBvcnQgeyBtYXBHZXR0ZXJzIH0gZnJvbSAndnVleCc7XG5pbXBvcnQgcEFwaSBmcm9tICcuLy4uLy4uLy4uL2FwaS9wb3N0cyc7XG5pbXBvcnQgdHlwZXMgZnJvbSAnLi8uLi8uLi8uLi9zdG9yZS90eXBlcyc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIHJQb3N0czogUG9zdHMsXG4gICAgICAgIHJBZGRQb3N0OiBBZGRQb3N0LFxuICAgIH0sXG4gICAgZGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNob3c6IGZhbHNlLFxuICAgICAgICAgICAgLy8gcG9zdHM6IFtdLFxuICAgICAgICAgICAgbmV3UG9zdE1vZGFsOiBmYWxzZSxcbiAgICAgICAgICAgIGNvdW50ZXI6IDNcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgY2xlYXJOZXdQb3N0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV3UG9zdE1vZGFsO1xuICAgICAgICB9LFxuICAgICAgICAuLi5tYXBHZXR0ZXJzKHR5cGVzLnBvc3QuTkFNRSwge1xuICAgICAgICAgICAgcG9zdHM6IHR5cGVzLnBvc3QuR0VUX1BPU1RTXG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIG9wZW5OZXdQb3N0KCkge1xuICAgICAgICAgICAgdGhpcy5uZXdQb3N0TW9kYWwgPSB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBhZGRQb3N0KG5ld1Bvc3QpIHtcbiAgICAgICAgICAgIHBBcGkuYWRkUG9zdChuZXdQb3N0KVxuICAgICAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3UG9zdE1vZGFsID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xvc2VBZGRQb3N0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPSdzdHlsdXMnPlxuLmZhYi1ob2xkZXJ7XG4gICAgcG9zaXRpb246IGZpeGVkO1xuICAgIHotaW5kZXg6IDIwO1xuICAgIGJvdHRvbTogMzBweDtcbiAgICByaWdodDogMzBweDtcbiAgICBAbWVkaWEgb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMjVweCl7XG4gICAgICAgIHJpZ2h0OiAxNTBweDtcbiAgICB9XG59XG4uY29tbWVudC1ib3h7XG4gICAgbWF4LWhlaWdodDogNTAwcHg7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbn1cblx0XG4uZmFkZS1lbnRlci1hY3RpdmUgXG5cdHRyYW5zaXRpb24gbWF4LWhlaWdodCAuMnMgZWFzZS1pblxuXG4uZmFkZS1sZWF2ZS1hY3RpdmVcblx0dHJhbnNpdGlvbiBtYXgtaGVpZ2h0IC4ycyBlYXNlLW91dFxuXG4uZmFkZS1lbnRlciwgLmZhZGUtbGVhdmUtYWN0aXZlXG5cdG1heC1oZWlnaHQgMHB4XG5cbjwvc3R5bGU+XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gcG9zdHNTY3JlZW4udnVlPzViM2I3M2E1IiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbmZ1bmN0aW9uIGluamVjdFN0eWxlIChzc3JDb250ZXh0KSB7XG4gIGlmIChkaXNwb3NlZCkgcmV0dXJuXG4gIHJlcXVpcmUoXCIhIXZ1ZS1zdHlsZS1sb2FkZXIhY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi1hZTliMTg2NlxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hc3R5bHVzLWxvYWRlciEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL1Bvc3RMaXN0LnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi9Qb3N0TGlzdC52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LWFlOWIxODY2XFxcIixcXFwiaGFzU2NvcGVkXFxcIjpmYWxzZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL1Bvc3RMaXN0LnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIG51bGwsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdExpc3QudnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSBQb3N0TGlzdC52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtYWU5YjE4NjZcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi1hZTliMTg2NlwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9Qb3N0TGlzdC52dWVcbi8vIG1vZHVsZSBpZCA9IDIzMlxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtYWU5YjE4NjZcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vUG9zdExpc3QudnVlXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXNDbGllbnQuanNcIikoXCIxMTFlNmM3YVwiLCBjb250ZW50LCBmYWxzZSk7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG4gLy8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3NcbiBpZighY29udGVudC5sb2NhbHMpIHtcbiAgIG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi1hZTliMTg2NlxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9Qb3N0TGlzdC52dWVcIiwgZnVuY3Rpb24oKSB7XG4gICAgIHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtYWU5YjE4NjZcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vUG9zdExpc3QudnVlXCIpO1xuICAgICBpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcbiAgICAgdXBkYXRlKG5ld0NvbnRlbnQpO1xuICAgfSk7XG4gfVxuIC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3NcbiBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LWFlOWIxODY2XCIsXCJzY29wZWRcIjpmYWxzZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdExpc3QudnVlXG4vLyBtb2R1bGUgaWQgPSAyMzNcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSh0cnVlKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIlxcbi5saXN0LWVudGVyLWFjdGl2ZSB7XFxuICB0cmFuc2l0aW9uOiBhbGwgMC4zcyAwLjZzO1xcbn1cXG4ubGlzdC1sZWF2ZS1hY3RpdmUge1xcbiAgdHJhbnNpdGlvbjogYWxsIDAuM3M7XFxufVxcbi5saXN0LWVudGVyLFxcbi5saXN0LWxlYXZlLXRvIHtcXG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgxMzAwcHgpO1xcbn1cXG4ubGlzdC1tb3ZlIHtcXG4gIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjNzIDAuM3M7XFxufVxcbi5saXN0LWxlYXZlLWFjdGl2ZSB7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxufVxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdExpc3QudnVlXCIsXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL1Bvc3RMaXN0LnZ1ZVwiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiO0FBaUNBO0VBQ0UsMEJBQUE7Q0NoQ0Q7QURrQ0Q7RUFDRSxxQkFBQTtDQ2hDRDtBRGtDRDs7RUFFRSw4QkFBQTtDQ2hDRDtBRGtDRDtFQUNFLGdDQUFBO0NDaENEO0FEa0NEO0VBQ0UsbUJBQUE7Q0NoQ0RcIixcImZpbGVcIjpcIlBvc3RMaXN0LnZ1ZVwiLFwic291cmNlc0NvbnRlbnRcIjpbXCJcXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG4ubGlzdC1lbnRlci1hY3RpdmUge1xcbiAgdHJhbnNpdGlvbjogYWxsIC4zcyAuNnM7XFxufVxcbi5saXN0LWxlYXZlLWFjdGl2ZSB7XFxuICB0cmFuc2l0aW9uOiBhbGwgLjNzO1xcbn1cXG4ubGlzdC1lbnRlciwgLmxpc3QtbGVhdmUtdG8ge1xcbi8vICAgb3BhY2l0eTogMDtcXG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgxMzAwcHgpO1xcbn1cXG4ubGlzdC1tb3ZlIHtcXG4gIHRyYW5zaXRpb246IHRyYW5zZm9ybSAuM3MgLjNzO1xcbn1cXG4ubGlzdC1sZWF2ZS1hY3RpdmUge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbn1cXG5cIixcIi5saXN0LWVudGVyLWFjdGl2ZSB7XFxuICB0cmFuc2l0aW9uOiBhbGwgMC4zcyAwLjZzO1xcbn1cXG4ubGlzdC1sZWF2ZS1hY3RpdmUge1xcbiAgdHJhbnNpdGlvbjogYWxsIDAuM3M7XFxufVxcbi5saXN0LWVudGVyLFxcbi5saXN0LWxlYXZlLXRvIHtcXG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgxMzAwcHgpO1xcbn1cXG4ubGlzdC1tb3ZlIHtcXG4gIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjNzIDAuM3M7XFxufVxcbi5saXN0LWxlYXZlLWFjdGl2ZSB7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi1hZTliMTg2NlwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL1Bvc3RMaXN0LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjM0XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIjx0ZW1wbGF0ZT5cbiAgICA8ZGl2PlxuICAgICAgICA8di1sYXlvdXQgY2xhc3M9XCJweS0wXCIgcm93IHdyYXA+XG4gICAgICAgICAgICA8dHJhbnNpdGlvbi1ncm91cCBuYW1lPVwibGlzdFwiPlxuICAgICAgICAgICAgICAgIDx2LWZsZXggeHMxMiBtZDEyIHYtZm9yPVwiKHBvc3QsIGkpIGluIHBvc3RzXCIgOmtleT1cInBvc3QuaWRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHItcG9zdCA6cG9zdD1cInBvc3RcIiBjbGFzcz1cIm1iLTVcIiBAcmVtb3ZlPVwicmVtb3ZlUG9zdFwiPjwvci1wb3N0PlxuICAgICAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICAgICAgPC90cmFuc2l0aW9uLWdyb3VwPlxuICAgICAgICA8L3YtbGF5b3V0PlxuICAgIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmltcG9ydCBQb3N0IGZyb20gJy4vUG9zdCc7XG5leHBvcnQgZGVmYXVsdCB7XG4gICAgcHJvcHM6IFsncG9zdHMnXSxcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIHJQb3N0OiBQb3N0XG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIHJlbW92ZVBvc3QocCl7XG4gICAgICAgICAgICB0aGlzLnBvc3RzLmZvckVhY2goKHBvc3QsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYocG9zdC5pZCA9PSBwKXtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3N0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfSAgIFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzdHlsdXNcIj5cbi5saXN0LWVudGVyLWFjdGl2ZSB7XG4gIHRyYW5zaXRpb246IGFsbCAuM3MgLjZzO1xufVxuLmxpc3QtbGVhdmUtYWN0aXZlIHtcbiAgdHJhbnNpdGlvbjogYWxsIC4zcztcbn1cbi5saXN0LWVudGVyLCAubGlzdC1sZWF2ZS10byB7XG4vLyAgIG9wYWNpdHk6IDA7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgxMzAwcHgpO1xufVxuLmxpc3QtbW92ZSB7XG4gIHRyYW5zaXRpb246IHRyYW5zZm9ybSAuM3MgLjNzO1xufVxuLmxpc3QtbGVhdmUtYWN0aXZlIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xufVxuPC9zdHlsZT5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gUG9zdExpc3QudnVlPzZiM2I0MjZjIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbmZ1bmN0aW9uIGluamVjdFN0eWxlIChzc3JDb250ZXh0KSB7XG4gIGlmIChkaXNwb3NlZCkgcmV0dXJuXG4gIHJlcXVpcmUoXCIhIXZ1ZS1zdHlsZS1sb2FkZXIhY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi1hNmJkOWNlMlxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSFzdHlsdXMtbG9hZGVyIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXN0eWxlcyZpbmRleD0wIS4vUG9zdC52dWVcIilcbn1cbnZhciBDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplclwiKShcbiAgLyogc2NyaXB0ICovXG4gIHJlcXVpcmUoXCIhIWJhYmVsLWxvYWRlcj97XFxcImNhY2hlRGlyZWN0b3J5XFxcIjp0cnVlLFxcXCJwcmVzZXRzXFxcIjpbW1xcXCJlbnZcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2UsXFxcInRhcmdldHNcXFwiOntcXFwiYnJvd3NlcnNcXFwiOltcXFwiPiAyJVxcXCJdLFxcXCJ1Z2xpZnlcXFwiOnRydWV9fV0sW1xcXCJlczIwMTVcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2V9XSxbXFxcInN0YWdlLTJcXFwiXV19IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vUG9zdC52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LWE2YmQ5Y2UyXFxcIixcXFwiaGFzU2NvcGVkXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vUG9zdC52dWVcIiksXG4gIC8qIHN0eWxlcyAqL1xuICBpbmplY3RTdHlsZSxcbiAgLyogc2NvcGVJZCAqL1xuICBcImRhdGEtdi1hNmJkOWNlMlwiLFxuICAvKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbiAgbnVsbFxuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL1Bvc3QudnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSBQb3N0LnZ1ZTogZnVuY3Rpb25hbCBjb21wb25lbnRzIGFyZSBub3Qgc3VwcG9ydGVkIHdpdGggdGVtcGxhdGVzLCB0aGV5IHNob3VsZCB1c2UgcmVuZGVyIGZ1bmN0aW9ucy5cIil9XG5cbi8qIGhvdCByZWxvYWQgKi9cbmlmIChtb2R1bGUuaG90KSB7KGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhvdEFQSSA9IHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIilcbiAgaG90QVBJLmluc3RhbGwocmVxdWlyZShcInZ1ZVwiKSwgZmFsc2UpXG4gIGlmICghaG90QVBJLmNvbXBhdGlibGUpIHJldHVyblxuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmICghbW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgaG90QVBJLmNyZWF0ZVJlY29yZChcImRhdGEtdi1hNmJkOWNlMlwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfSBlbHNlIHtcbiAgICBob3RBUEkucmVsb2FkKFwiZGF0YS12LWE2YmQ5Y2UyXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9XG4gIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbiAoZGF0YSkge1xuICAgIGRpc3Bvc2VkID0gdHJ1ZVxuICB9KVxufSkoKX1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQuZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL1Bvc3QudnVlXG4vLyBtb2R1bGUgaWQgPSAyMzZcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWE2YmQ5Y2UyXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vUG9zdC52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcIjA0ZWIzYTk3XCIsIGNvbnRlbnQsIGZhbHNlKTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWE2YmQ5Y2UyXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vUG9zdC52dWVcIiwgZnVuY3Rpb24oKSB7XG4gICAgIHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtYTZiZDljZTJcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9Qb3N0LnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi1hNmJkOWNlMlwiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdC52dWVcbi8vIG1vZHVsZSBpZCA9IDIzN1xuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHRydWUpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiXFxuLnBvc3QtY2FyZFtkYXRhLXYtYTZiZDljZTJdIHtcXG4gIHdpZHRoOiAxMDAlO1xcbiAgbWluLXdpZHRoOiA0MDBweDtcXG59XFxuXCIsIFwiXCIsIHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9Qb3N0LnZ1ZVwiLFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9Qb3N0LnZ1ZVwiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiO0FBcUdBO0VBQ0ksWUFBQTtFQUNBLGlCQUFBO0NDcEdIXCIsXCJmaWxlXCI6XCJQb3N0LnZ1ZVwiLFwic291cmNlc0NvbnRlbnRcIjpbXCJcXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG4ucG9zdC1jYXJke1xcbiAgICB3aWR0aDogMTAwJTtcXG4gICAgbWluLXdpZHRoOiA0MDBweDtcXG59XFxuXCIsXCIucG9zdC1jYXJkIHtcXG4gIHdpZHRoOiAxMDAlO1xcbiAgbWluLXdpZHRoOiA0MDBweDtcXG59XFxuXCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LWE2YmQ5Y2UyXCIsXCJzY29wZWRcIjp0cnVlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9Qb3N0LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjM4XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIjx0ZW1wbGF0ZT5cbiAgICA8di1jYXJkIGNsYXNzPVwicG9zdC1jYXJkIG1iLTVcIj5cbiAgICBcbiAgICAgICAgPHYtc3lzdGVtLWJhciBzdGF0dXMgY2xhc3M9XCJpbmZvXCIgZGFyayB2LWlmPVwicG9zdC5yZXBvcnRcIj5cbiAgICAgICAgICAgIDx2LWljb24+cmVwb3J0PC92LWljb24+XG4gICAgICAgICAgICBUaGlzIGhhcyBiZWVuIHJlcG9ydGVkIHRvIHRoZSBwb2xpY2VcbiAgICAgICAgICAgIDx2LXNwYWNlcj48L3Ytc3BhY2VyPlxuICAgICAgICAgICAgPHYtaWNvbj5sb2NhdGlvbl9vbjwvdi1pY29uPlxuICAgICAgICAgICAgPHNwYW4+QWdlZ2U8L3NwYW4+XG4gICAgICAgIDwvdi1zeXN0ZW0tYmFyPlxuICAgIFxuICAgICAgICA8di1jYXJkLWFjdGlvbnMgY2xhc3M9XCJtYS0wIHBhLTBcIj5cbiAgICAgICAgICAgIDxyLXVzZXItdG9wIDp1c2VyPVwicG9zdC51c2VyXCI+PC9yLXVzZXItdG9wPlxuICAgICAgICAgICAgPHYtc3BhY2VyPjwvdi1zcGFjZXI+XG4gICAgICAgICAgICA8di1tZW51IGJvdHRvbSByaWdodD5cbiAgICAgICAgICAgICAgICA8di1idG4gaWNvbiBzbG90PVwiYWN0aXZhdG9yXCI+XG4gICAgICAgICAgICAgICAgICAgIDx2LWljb24+bW9yZV92ZXJ0PC92LWljb24+XG4gICAgICAgICAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgICAgICAgICA8di1saXN0PlxuICAgICAgICAgICAgICAgICAgICA8di1saXN0LXRpbGUgQGNsaWNrLm5hdGl2ZT1cInJlbW92ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHYtbGlzdC10aWxlLWNvbnRlbnQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHYtbGlzdC10aWxlLXRpdGxlIGNsYXNzPVwiZXJyb3ItLXRleHRcIj5EZWxldGU8L3YtbGlzdC10aWxlLXRpdGxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC92LWxpc3QtdGlsZS1jb250ZW50PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHYtbGlzdC10aWxlLWFjdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8di1pY29uIGNsYXNzPVwiZXJyb3ItLXRleHRcIj5kZWxldGU8L3YtaWNvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdi1saXN0LXRpbGUtYWN0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8L3YtbGlzdC10aWxlPlxuICAgICAgICAgICAgICAgICAgICA8di1saXN0LXRpbGU+XG4gICAgICAgICAgICAgICAgICAgICAgICA8di1saXN0LXRpbGUtY29udGVudD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8di1saXN0LXRpbGUtdGl0bGUgY2xhc3M9XCJpbmZvLS10ZXh0XCI+UmVwb3J0PC92LWxpc3QtdGlsZS10aXRsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdi1saXN0LXRpbGUtY29udGVudD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx2LWxpc3QtdGlsZS1hY3Rpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHYtaWNvbiBjbGFzcz1cImluZm8tLXRleHRcIj5yZXBvcnQ8L3YtaWNvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdi1saXN0LXRpbGUtYWN0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8L3YtbGlzdC10aWxlPlxuICAgICAgICAgICAgICAgIDwvdi1saXN0PlxuICAgICAgICAgICAgPC92LW1lbnU+XG4gICAgICAgIDwvdi1jYXJkLWFjdGlvbnM+XG4gICAgXG4gICAgICAgIDx2LWNhcmQtbWVkaWEgdi1pZj1cInBvc3QubWVkaWFcIiA6c3JjPVwicG9zdC5tZWRpYVwiIGhlaWdodD1cIjMwMHB4XCI+PC92LWNhcmQtbWVkaWE+XG4gICAgICAgIDx2LWRpdmlkZXIgdi1lbHNlIGluc2V0Pjwvdi1kaXZpZGVyPlxuICAgIFxuICAgICAgICA8di1jYXJkLXRpdGxlIHByaW1hcnktdGl0bGU+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgICAgICB7e3Bvc3QudGV4dH19XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvdi1jYXJkLXRpdGxlPlxuICAgIFxuICAgICAgICA8di1jYXJkLWFjdGlvbnMgY2xhc3M9XCJwcmltYXJ5XCI+XG4gICAgICAgICAgICA8di1idG4gZmxhdCBkYXJrIGljb24gY2xhc3M9XCJteC0yXCI+XG4gICAgICAgICAgICAgICAge3sgcG9zdC5saWtlcyA+IDEgPyBwb3N0Lmxpa2VzIDogJycgfX1cbiAgICAgICAgICAgICAgICA8di1pY29uPmZhdm9yaXRlPC92LWljb24+XG4gICAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICAgICAgPHYtYnRuIGZsYXQgZGFyayBpY29uIGNsYXNzPVwibXgtMlwiPlxuICAgICAgICAgICAgICAgIHt7IHBvc3QucmVwb3N0cyA+IDEgPyBwb3N0LnJlcG9zdHMgOiAnJyB9fVxuICAgICAgICAgICAgICAgIDx2LWljb24+cmVwZWF0PC92LWljb24+XG4gICAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICAgICAgPHYtc3BhY2VyPjwvdi1zcGFjZXI+XG4gICAgICAgICAgICA8di1idG4gZGFyayBpY29uIEBjbGljay5uYXRpdmU9XCJpc0NvbW1lbnRPcGVuID0gIWlzQ29tbWVudE9wZW5cIiBjbGFzcz1cIm14LTNcIj5cbiAgICAgICAgICAgICAgICA8IS0tIHt7IHBvc3QuY29tbWVudHMubGVuZ3RoID4gMSA/IHBvc3QuY29tbWVudHMubGVuZ3RoIDogJycgfX0gLS0+XG4gICAgICAgICAgICAgICAgPHYtaWNvbj5jb21tZW50PC92LWljb24+XG4gICAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICA8L3YtY2FyZC1hY3Rpb25zPlxuICAgIFxuICAgICAgICA8dHJhbnNpdGlvbiBuYW1lPVwiZmFkZVwiPlxuICAgICAgICAgICAgPHYtY2FyZC10ZXh0IHYtc2hvdz1cImlzQ29tbWVudE9wZW5cIiBjbGFzcz1cImNvbW1lbnQtYm94IHBhLTBcIj5cbiAgICAgICAgICAgICAgICA8ci1jb21tZW50LWxpc3QgOmNvbW1lbnRzPVwicG9zdC5jb21tZW50c1wiPjwvci1jb21tZW50LWxpc3Q+XG4gICAgICAgICAgICA8L3YtY2FyZC10ZXh0PlxuICAgICAgICA8L3RyYW5zaXRpb24+XG4gICAgXG4gICAgPC92LWNhcmQ+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0PlxuaW1wb3J0IFVzZXJTbWFsbFByb2ZpbGUgZnJvbSAnLi8uLi91c2Vycy9Vc2VyU21hbGxQcm9maWxlJztcbmltcG9ydCBDb21tZW50TGlzdCBmcm9tICcuLy4uL2NvbW1lbnRzL0NvbW1lbnRMaXN0JztcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBwcm9wczogWydwb3N0J10sXG4gICAgY29tcG9uZW50czoge1xuICAgICAgICByVXNlclRvcDogVXNlclNtYWxsUHJvZmlsZSxcbiAgICAgICAgckNvbW1lbnRMaXN0OiBDb21tZW50TGlzdFxuICAgIH0sXG4gICAgZGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlzQ29tbWVudE9wZW46IGZhbHNlXG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgcmVtb3ZlKCl7XG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdyZW1vdmUnLCB0aGlzLnBvc3QuaWQpO1xuICAgICAgICB9LFxuICAgICAgICByZXBvcnQoKXtcblxuICAgICAgICB9XG4gICAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic3R5bHVzXCIgc2NvcGVkPlxuLnBvc3QtY2FyZHtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBtaW4td2lkdGg6IDQwMHB4O1xufVxuPC9zdHlsZT5cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyBQb3N0LnZ1ZT8xOTYxNTdjMiIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG5mdW5jdGlvbiBpbmplY3RTdHlsZSAoc3NyQ29udGV4dCkge1xuICBpZiAoZGlzcG9zZWQpIHJldHVyblxuICByZXF1aXJlKFwiISF2dWUtc3R5bGUtbG9hZGVyIWNzcy1sb2FkZXI/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleD97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMmExZDJlZTdcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXN0eWxlcyZpbmRleD0wIS4vVXNlclNtYWxsUHJvZmlsZS52dWVcIilcbn1cbnZhciBDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplclwiKShcbiAgLyogc2NyaXB0ICovXG4gIHJlcXVpcmUoXCIhIWJhYmVsLWxvYWRlcj97XFxcImNhY2hlRGlyZWN0b3J5XFxcIjp0cnVlLFxcXCJwcmVzZXRzXFxcIjpbW1xcXCJlbnZcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2UsXFxcInRhcmdldHNcXFwiOntcXFwiYnJvd3NlcnNcXFwiOltcXFwiPiAyJVxcXCJdLFxcXCJ1Z2xpZnlcXFwiOnRydWV9fV0sW1xcXCJlczIwMTVcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2V9XSxbXFxcInN0YWdlLTJcXFwiXV19IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vVXNlclNtYWxsUHJvZmlsZS52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LTJhMWQyZWU3XFxcIixcXFwiaGFzU2NvcGVkXFxcIjpmYWxzZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL1VzZXJTbWFsbFByb2ZpbGUudnVlXCIpLFxuICAvKiBzdHlsZXMgKi9cbiAgaW5qZWN0U3R5bGUsXG4gIC8qIHNjb3BlSWQgKi9cbiAgbnVsbCxcbiAgLyogbW9kdWxlSWRlbnRpZmllciAoc2VydmVyIG9ubHkpICovXG4gIG51bGxcbilcbkNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC91c2Vycy9Vc2VyU21hbGxQcm9maWxlLnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gVXNlclNtYWxsUHJvZmlsZS52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtMmExZDJlZTdcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi0yYTFkMmVlN1wiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC91c2Vycy9Vc2VyU21hbGxQcm9maWxlLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjQwXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0yYTFkMmVlN1xcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9Vc2VyU21hbGxQcm9maWxlLnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiMGNiNTRiNGVcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMmExZDJlZTdcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vVXNlclNtYWxsUHJvZmlsZS52dWVcIiwgZnVuY3Rpb24oKSB7XG4gICAgIHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMmExZDJlZTdcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vVXNlclNtYWxsUHJvZmlsZS52dWVcIik7XG4gICAgIGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuICAgICB1cGRhdGUobmV3Q29udGVudCk7XG4gICB9KTtcbiB9XG4gLy8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIhLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtMmExZDJlZTdcIixcInNjb3BlZFwiOmZhbHNlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvdXNlcnMvVXNlclNtYWxsUHJvZmlsZS52dWVcbi8vIG1vZHVsZSBpZCA9IDI0MVxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHRydWUpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiXFxuc21hbGwudGltZXtcXG4gICAgY29sb3I6IHNpbHZlclxcbn1cXG5cIiwgXCJcIiwge1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC91c2Vycy9Vc2VyU21hbGxQcm9maWxlLnZ1ZT80N2M3YjdkYlwiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiO0FBNEJBO0lBQ0EsYUFBQTtDQUNBXCIsXCJmaWxlXCI6XCJVc2VyU21hbGxQcm9maWxlLnZ1ZVwiLFwic291cmNlc0NvbnRlbnRcIjpbXCI8dGVtcGxhdGU+XFxuICAgIDx2LWxpc3QgdHdvLWxpbmUgY2xhc3M9XFxcInB5LTBcXFwiPlxcbiAgICAgICAgPHYtbGlzdC10aWxlIGF2YXRhcj5cXG4gICAgICAgICAgICA8di1saXN0LXRpbGUtYXZhdGFyPlxcbiAgICAgICAgICAgICAgICA8aW1nIDpzcmM9XFxcInVzZXIuaW1hZ2VcXFwiPlxcbiAgICAgICAgICAgIDwvdi1saXN0LXRpbGUtYXZhdGFyPlxcbiAgICAgICAgICAgIDx2LWxpc3QtdGlsZS1jb250ZW50PlxcbiAgICAgICAgICAgICAgICA8di1saXN0LXRpbGUtdGl0bGU+e3t1c2VyLm5hbWV9fTwvdi1saXN0LXRpbGUtdGl0bGU+XFxuICAgICAgICAgICAgICAgIDx2LWxpc3QtdGlsZS1zdWItdGl0bGU+e3t1c2VyLnRpdGxlfX08L3YtbGlzdC10aWxlLXN1Yi10aXRsZT5cXG4gICAgICAgICAgICAgICAgPHNtYWxsIGNsYXNzPVxcXCJ0aW1lXFxcIj4yIG1pbnV0ZXMgYWdvPC9zbWFsbD5cXG4gICAgICAgICAgICA8L3YtbGlzdC10aWxlLWNvbnRlbnQ+XFxuICAgICAgICA8L3YtbGlzdC10aWxlPlxcbiAgICA8L3YtbGlzdD5cXG48L3RlbXBsYXRlPlxcblxcbjxzY3JpcHQ+XFxuZXhwb3J0IGRlZmF1bHQge1xcbiAgICBwcm9wczogWyd1c2VyJ10sXFxuICAgIGRhdGEoKSB7XFxuICAgICAgICByZXR1cm57XFxuICAgICAgICAgICAgbmFtZVxcbiAgICAgICAgfVxcbiAgICB9XFxufVxcbjwvc2NyaXB0PlxcblxcblxcbjxzdHlsZT5cXG5zbWFsbC50aW1le1xcbiAgICBjb2xvcjogc2lsdmVyXFxufVxcbjwvc3R5bGU+XFxuXFxuXCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTJhMWQyZWU3XCIsXCJzY29wZWRcIjpmYWxzZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3VzZXJzL1VzZXJTbWFsbFByb2ZpbGUudnVlXG4vLyBtb2R1bGUgaWQgPSAyNDJcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiPHRlbXBsYXRlPlxuICAgIDx2LWxpc3QgdHdvLWxpbmUgY2xhc3M9XCJweS0wXCI+XG4gICAgICAgIDx2LWxpc3QtdGlsZSBhdmF0YXI+XG4gICAgICAgICAgICA8di1saXN0LXRpbGUtYXZhdGFyPlxuICAgICAgICAgICAgICAgIDxpbWcgOnNyYz1cInVzZXIuaW1hZ2VcIj5cbiAgICAgICAgICAgIDwvdi1saXN0LXRpbGUtYXZhdGFyPlxuICAgICAgICAgICAgPHYtbGlzdC10aWxlLWNvbnRlbnQ+XG4gICAgICAgICAgICAgICAgPHYtbGlzdC10aWxlLXRpdGxlPnt7dXNlci5uYW1lfX08L3YtbGlzdC10aWxlLXRpdGxlPlxuICAgICAgICAgICAgICAgIDx2LWxpc3QtdGlsZS1zdWItdGl0bGU+e3t1c2VyLnRpdGxlfX08L3YtbGlzdC10aWxlLXN1Yi10aXRsZT5cbiAgICAgICAgICAgICAgICA8c21hbGwgY2xhc3M9XCJ0aW1lXCI+MiBtaW51dGVzIGFnbzwvc21hbGw+XG4gICAgICAgICAgICA8L3YtbGlzdC10aWxlLWNvbnRlbnQ+XG4gICAgICAgIDwvdi1saXN0LXRpbGU+XG4gICAgPC92LWxpc3Q+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0PlxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHByb3BzOiBbJ3VzZXInXSxcbiAgICBkYXRhKCkge1xuICAgICAgICByZXR1cm57XG4gICAgICAgICAgICBuYW1lXG4gICAgICAgIH1cbiAgICB9XG59XG48L3NjcmlwdD5cblxuXG48c3R5bGU+XG5zbWFsbC50aW1le1xuICAgIGNvbG9yOiBzaWx2ZXJcbn1cbjwvc3R5bGU+XG5cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyBVc2VyU21hbGxQcm9maWxlLnZ1ZT80N2M3YjdkYiIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygndi1saXN0Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcInB5LTBcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJ0d28tbGluZVwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtbGlzdC10aWxlJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImF2YXRhclwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtbGlzdC10aWxlLWF2YXRhcicsIFtfYygnaW1nJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInNyY1wiOiBfdm0udXNlci5pbWFnZVxuICAgIH1cbiAgfSldKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtbGlzdC10aWxlLWNvbnRlbnQnLCBbX2MoJ3YtbGlzdC10aWxlLXRpdGxlJywgW192bS5fdihfdm0uX3MoX3ZtLnVzZXIubmFtZSkpXSksIF92bS5fdihcIiBcIiksIF9jKCd2LWxpc3QtdGlsZS1zdWItdGl0bGUnLCBbX3ZtLl92KF92bS5fcyhfdm0udXNlci50aXRsZSkpXSksIF92bS5fdihcIiBcIiksIF9jKCdzbWFsbCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJ0aW1lXCJcbiAgfSwgW192bS5fdihcIjIgbWludXRlcyBhZ29cIildKV0sIDEpXSwgMSldLCAxKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi0yYTFkMmVlN1wiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtMmExZDJlZTdcIixcImhhc1Njb3BlZFwiOmZhbHNlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3VzZXJzL1VzZXJTbWFsbFByb2ZpbGUudnVlXG4vLyBtb2R1bGUgaWQgPSAyNDRcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbmZ1bmN0aW9uIGluamVjdFN0eWxlIChzc3JDb250ZXh0KSB7XG4gIGlmIChkaXNwb3NlZCkgcmV0dXJuXG4gIHJlcXVpcmUoXCIhIXZ1ZS1zdHlsZS1sb2FkZXIhY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi1hNWFhNzk5NlxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hc3R5bHVzLWxvYWRlciEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL0NvbW1lbnRMaXN0LnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi9Db21tZW50TGlzdC52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LWE1YWE3OTk2XFxcIixcXFwiaGFzU2NvcGVkXFxcIjpmYWxzZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL0NvbW1lbnRMaXN0LnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIG51bGwsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvY29tbWVudHMvQ29tbWVudExpc3QudnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSBDb21tZW50TGlzdC52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtYTVhYTc5OTZcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi1hNWFhNzk5NlwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9Db21tZW50TGlzdC52dWVcbi8vIG1vZHVsZSBpZCA9IDI0NVxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtYTVhYTc5OTZcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vQ29tbWVudExpc3QudnVlXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXNDbGllbnQuanNcIikoXCIyYTZjMWM4NFwiLCBjb250ZW50LCBmYWxzZSk7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG4gLy8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3NcbiBpZighY29udGVudC5sb2NhbHMpIHtcbiAgIG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi1hNWFhNzk5NlxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9Db21tZW50TGlzdC52dWVcIiwgZnVuY3Rpb24oKSB7XG4gICAgIHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtYTVhYTc5OTZcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vQ29tbWVudExpc3QudnVlXCIpO1xuICAgICBpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcbiAgICAgdXBkYXRlKG5ld0NvbnRlbnQpO1xuICAgfSk7XG4gfVxuIC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3NcbiBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LWE1YWE3OTk2XCIsXCJzY29wZWRcIjpmYWxzZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvY29tbWVudHMvQ29tbWVudExpc3QudnVlXG4vLyBtb2R1bGUgaWQgPSAyNDZcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSh0cnVlKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIlwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiXCIsXCJmaWxlXCI6XCJDb21tZW50TGlzdC52dWVcIixcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi1hNWFhNzk5NlwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL2NvbW1lbnRzL0NvbW1lbnRMaXN0LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjQ3XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIjx0ZW1wbGF0ZT5cbiAgICA8di1saXN0IHRocmVlLWxpbmUgY2xhc3M9XCJweS0wXCI+XG4gICAgICAgIDxyLWFkZC1jb21tZW50IHVzZXItaW1hZ2U9Jy9pbWFnZXMvYXZhdGFyLmpwZyc+PC9yLWFkZC1jb21tZW50PlxuICAgICAgICA8dGVtcGxhdGUgdi1mb3I9XCIoY29tbWVudCwgaSkgaW4gY29tbWVudHNcIj5cbiAgICAgICAgICAgIDxyLWNvbW1lbnQgOmNvbW1lbnQ9XCJjb21tZW50XCIgOmtleT1cImlcIiBjbGFzcz1cInB5LTIgcHgtMiByZW1vdmVMaXN0SG92ZXJcIj57e2NvbW1lbnQuY29tbWVudH19PC9yLWNvbW1lbnQ+XG4gICAgICAgICAgICA8di1kaXZpZGVyIHYtaWY9XCJpICE9IGNvbW1lbnRzLmxlbmd0aC0xXCIgOmtleT1cImlcIj48L3YtZGl2aWRlcj5cbiAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICA8L3YtbGlzdD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5pbXBvcnQgQ29tbWVudCBmcm9tICcuL0NvbW1lbnQnO1xuaW1wb3J0IEFkZENvbW1lbnQgZnJvbSAnLi9BZGRDb21tZW50JztcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBwcm9wczogWydjb21tZW50cyddLFxuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgckNvbW1lbnQ6IENvbW1lbnQsXG4gICAgICAgIHJBZGRDb21tZW50OiBBZGRDb21tZW50LFxuICAgIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInN0eWx1c1wiPlxuPC9zdHlsZT5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gQ29tbWVudExpc3QudnVlPzNkOTljNDNlIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbnZhciBDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplclwiKShcbiAgLyogc2NyaXB0ICovXG4gIHJlcXVpcmUoXCIhIWJhYmVsLWxvYWRlcj97XFxcImNhY2hlRGlyZWN0b3J5XFxcIjp0cnVlLFxcXCJwcmVzZXRzXFxcIjpbW1xcXCJlbnZcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2UsXFxcInRhcmdldHNcXFwiOntcXFwiYnJvd3NlcnNcXFwiOltcXFwiPiAyJVxcXCJdLFxcXCJ1Z2xpZnlcXFwiOnRydWV9fV0sW1xcXCJlczIwMTVcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2V9XSxbXFxcInN0YWdlLTJcXFwiXV19IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vQ29tbWVudC52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LTA3Mzk3NGY3XFxcIixcXFwiaGFzU2NvcGVkXFxcIjpmYWxzZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL0NvbW1lbnQudnVlXCIpLFxuICAvKiBzdHlsZXMgKi9cbiAgbnVsbCxcbiAgLyogc2NvcGVJZCAqL1xuICBudWxsLFxuICAvKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbiAgbnVsbFxuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL2NvbW1lbnRzL0NvbW1lbnQudnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSBDb21tZW50LnZ1ZTogZnVuY3Rpb25hbCBjb21wb25lbnRzIGFyZSBub3Qgc3VwcG9ydGVkIHdpdGggdGVtcGxhdGVzLCB0aGV5IHNob3VsZCB1c2UgcmVuZGVyIGZ1bmN0aW9ucy5cIil9XG5cbi8qIGhvdCByZWxvYWQgKi9cbmlmIChtb2R1bGUuaG90KSB7KGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhvdEFQSSA9IHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIilcbiAgaG90QVBJLmluc3RhbGwocmVxdWlyZShcInZ1ZVwiKSwgZmFsc2UpXG4gIGlmICghaG90QVBJLmNvbXBhdGlibGUpIHJldHVyblxuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmICghbW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgaG90QVBJLmNyZWF0ZVJlY29yZChcImRhdGEtdi0wNzM5NzRmN1wiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfSBlbHNlIHtcbiAgICBob3RBUEkucmVsb2FkKFwiZGF0YS12LTA3Mzk3NGY3XCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9XG4gIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbiAoZGF0YSkge1xuICAgIGRpc3Bvc2VkID0gdHJ1ZVxuICB9KVxufSkoKX1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQuZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL2NvbW1lbnRzL0NvbW1lbnQudnVlXG4vLyBtb2R1bGUgaWQgPSAyNDlcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiXG48dGVtcGxhdGU+XG4gICAgPHYtbGlzdC10aWxlIDpyaXBwbGU9XCJmYWxzZVwiPlxuICAgICAgICA8di1saXN0LXRpbGUtYXZhdGFyIGNsYXNzPVwiaGlkZGVuLXhzLW9ubHlcIj5cbiAgICAgICAgICAgIDxpbWcgOnNyYz1cImNvbW1lbnQudXNlci5pbWFnZVwiPlxuICAgICAgICA8L3YtbGlzdC10aWxlLWF2YXRhcj5cbiAgICAgICAgPHYtbGlzdC10aWxlLWNvbnRlbnQ+XG4gICAgICAgICAgICA8di1saXN0LXRpbGUtdGl0bGUgY2xhc3M9XCJwcmltYXJ5LS10ZXh0XCI+e3tjb21tZW50LnVzZXIubmFtZX19PC92LWxpc3QtdGlsZS10aXRsZT5cbiAgICAgICAgICAgIDx2LWxpc3QtdGlsZS1zdWItdGl0bGUgY2xhc3M9XCJibGFjay0tdGV4dCBweS0xXCI+XG4gICAgICAgICAgICAgICAgPHNsb3Q+PC9zbG90PlxuICAgICAgICAgICAgPC92LWxpc3QtdGlsZS1zdWItdGl0bGU+XG4gICAgICAgIDwvdi1saXN0LXRpbGUtY29udGVudD5cbiAgICAgICAgPHYtbGlzdC10aWxlLWFjdGlvbj5cbiAgICAgICAgICAgIDx2LWxpc3QtdGlsZS1hY3Rpb24tdGV4dD57e2NvbW1lbnQuZGF0ZX19PC92LWxpc3QtdGlsZS1hY3Rpb24tdGV4dD5cbiAgICAgICAgICAgIDx2LWJ0biBpY29uPlxuICAgICAgICAgICAgICAgIDx2LWljb24gY2xhc3M9XCJncmV5LS10ZXh0XCI+dGh1bWJfdXA8L3YtaWNvbj5cbiAgICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgIDwvdi1saXN0LXRpbGUtYWN0aW9uPlxuICAgIDwvdi1saXN0LXRpbGU+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0PlxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHByb3BzOiBbJ2NvbW1lbnQnXSxcbiAgICBjb21wdXRlZDoge31cbn1cbjwvc2NyaXB0PlxuXG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gQ29tbWVudC52dWU/ZDlkMDE5N2EiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ3YtbGlzdC10aWxlJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInJpcHBsZVwiOiBmYWxzZVxuICAgIH1cbiAgfSwgW19jKCd2LWxpc3QtdGlsZS1hdmF0YXInLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwiaGlkZGVuLXhzLW9ubHlcIlxuICB9LCBbX2MoJ2ltZycsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJzcmNcIjogX3ZtLmNvbW1lbnQudXNlci5pbWFnZVxuICAgIH1cbiAgfSldKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtbGlzdC10aWxlLWNvbnRlbnQnLCBbX2MoJ3YtbGlzdC10aWxlLXRpdGxlJywge1xuICAgIHN0YXRpY0NsYXNzOiBcInByaW1hcnktLXRleHRcIlxuICB9LCBbX3ZtLl92KF92bS5fcyhfdm0uY29tbWVudC51c2VyLm5hbWUpKV0pLCBfdm0uX3YoXCIgXCIpLCBfYygndi1saXN0LXRpbGUtc3ViLXRpdGxlJywge1xuICAgIHN0YXRpY0NsYXNzOiBcImJsYWNrLS10ZXh0IHB5LTFcIlxuICB9LCBbX3ZtLl90KFwiZGVmYXVsdFwiKV0sIDIpXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWxpc3QtdGlsZS1hY3Rpb24nLCBbX2MoJ3YtbGlzdC10aWxlLWFjdGlvbi10ZXh0JywgW192bS5fdihfdm0uX3MoX3ZtLmNvbW1lbnQuZGF0ZSkpXSksIF92bS5fdihcIiBcIiksIF9jKCd2LWJ0bicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJpY29uXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi1pY29uJywge1xuICAgIHN0YXRpY0NsYXNzOiBcImdyZXktLXRleHRcIlxuICB9LCBbX3ZtLl92KFwidGh1bWJfdXBcIildKV0sIDEpXSwgMSldLCAxKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi0wNzM5NzRmN1wiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtMDczOTc0ZjdcIixcImhhc1Njb3BlZFwiOmZhbHNlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL2NvbW1lbnRzL0NvbW1lbnQudnVlXG4vLyBtb2R1bGUgaWQgPSAyNTFcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbnZhciBDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplclwiKShcbiAgLyogc2NyaXB0ICovXG4gIHJlcXVpcmUoXCIhIWJhYmVsLWxvYWRlcj97XFxcImNhY2hlRGlyZWN0b3J5XFxcIjp0cnVlLFxcXCJwcmVzZXRzXFxcIjpbW1xcXCJlbnZcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2UsXFxcInRhcmdldHNcXFwiOntcXFwiYnJvd3NlcnNcXFwiOltcXFwiPiAyJVxcXCJdLFxcXCJ1Z2xpZnlcXFwiOnRydWV9fV0sW1xcXCJlczIwMTVcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2V9XSxbXFxcInN0YWdlLTJcXFwiXV19IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vQWRkQ29tbWVudC52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LTcwNGRiZTk2XFxcIixcXFwiaGFzU2NvcGVkXFxcIjpmYWxzZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL0FkZENvbW1lbnQudnVlXCIpLFxuICAvKiBzdHlsZXMgKi9cbiAgbnVsbCxcbiAgLyogc2NvcGVJZCAqL1xuICBudWxsLFxuICAvKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbiAgbnVsbFxuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL2NvbW1lbnRzL0FkZENvbW1lbnQudnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSBBZGRDb21tZW50LnZ1ZTogZnVuY3Rpb25hbCBjb21wb25lbnRzIGFyZSBub3Qgc3VwcG9ydGVkIHdpdGggdGVtcGxhdGVzLCB0aGV5IHNob3VsZCB1c2UgcmVuZGVyIGZ1bmN0aW9ucy5cIil9XG5cbi8qIGhvdCByZWxvYWQgKi9cbmlmIChtb2R1bGUuaG90KSB7KGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhvdEFQSSA9IHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIilcbiAgaG90QVBJLmluc3RhbGwocmVxdWlyZShcInZ1ZVwiKSwgZmFsc2UpXG4gIGlmICghaG90QVBJLmNvbXBhdGlibGUpIHJldHVyblxuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmICghbW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgaG90QVBJLmNyZWF0ZVJlY29yZChcImRhdGEtdi03MDRkYmU5NlwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfSBlbHNlIHtcbiAgICBob3RBUEkucmVsb2FkKFwiZGF0YS12LTcwNGRiZTk2XCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9XG4gIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbiAoZGF0YSkge1xuICAgIGRpc3Bvc2VkID0gdHJ1ZVxuICB9KVxufSkoKX1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQuZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL2NvbW1lbnRzL0FkZENvbW1lbnQudnVlXG4vLyBtb2R1bGUgaWQgPSAyNTJcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiPHRlbXBsYXRlPlxuICAgIDxkaXYgY2xhc3M9XCJncmV5IGxpZ2h0ZW4tMlwiPlxuICAgICAgICA8di1sYXlvdXQgYWxpZ24tY2VudGVyPlxuICAgICAgICAgICAgPHYtZmxleCBjbGFzcz1cImhpZGRlbi14cy1vbmx5XCI+XG4gICAgICAgICAgICAgICAgPHYtbGlzdC10aWxlLWF2YXRhcj5cbiAgICAgICAgICAgICAgICAgICAgPGltZyA6c3JjPVwidXNlckltYWdlXCI+XG4gICAgICAgICAgICAgICAgPC92LWxpc3QtdGlsZS1hdmF0YXI+XG4gICAgICAgICAgICA8L3YtZmxleD5cbiAgICAgICAgICAgIDx2LWZsZXggeHM4PlxuICAgICAgICAgICAgICAgIDx2LXRleHQtZmllbGQgY2xhc3M9XCJwYi0wXCIgdi1tb2RlbD1cImNvbW1lbnRJbnB1dFwiIGF1dG8tZ3JvdyBsYWJlbD1cIndyaXRlIGEgY29tbWVudFwiIGZ1bGwtd2lkdGggbXVsdGktbGluZSByb3dzPVwiMlwiPjwvdi10ZXh0LWZpZWxkPlxuICAgICAgICAgICAgPC92LWZsZXg+XG4gICAgICAgICAgICA8di1mbGV4IGNsYXNzPVwidGV4dC14cy1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICA8di1idG4gZmFiIGRhcmsgc21hbGwgY2xhc3M9XCJwcmltYXJ5XCI+XG4gICAgICAgICAgICAgICAgICAgIDx2LWljb24gZGFyaz5zZW5kPC92LWljb24+XG4gICAgICAgICAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICA8L3YtbGF5b3V0PlxuICAgIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBwcm9wczogWyd1c2VySW1hZ2UnXSxcbiAgICBkYXRhKCl7XG4gICAgICAgIHJldHVybntcbiAgICAgICAgICAgIGNvbW1lbnRJbnB1dDogJydcbiAgICAgICAgfVxuICAgIH1cbn1cbjwvc2NyaXB0PlxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIEFkZENvbW1lbnQudnVlPzEwYTY5YjUwIiwibW9kdWxlLmV4cG9ydHM9e3JlbmRlcjpmdW5jdGlvbiAoKXt2YXIgX3ZtPXRoaXM7dmFyIF9oPV92bS4kY3JlYXRlRWxlbWVudDt2YXIgX2M9X3ZtLl9zZWxmLl9jfHxfaDtcbiAgcmV0dXJuIF9jKCdkaXYnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwiZ3JleSBsaWdodGVuLTJcIlxuICB9LCBbX2MoJ3YtbGF5b3V0Jywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImFsaWduLWNlbnRlclwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtZmxleCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJoaWRkZW4teHMtb25seVwiXG4gIH0sIFtfYygndi1saXN0LXRpbGUtYXZhdGFyJywgW19jKCdpbWcnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwic3JjXCI6IF92bS51c2VySW1hZ2VcbiAgICB9XG4gIH0pXSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtZmxleCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ4czhcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LXRleHQtZmllbGQnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwicGItMFwiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcImF1dG8tZ3Jvd1wiOiBcIlwiLFxuICAgICAgXCJsYWJlbFwiOiBcIndyaXRlIGEgY29tbWVudFwiLFxuICAgICAgXCJmdWxsLXdpZHRoXCI6IFwiXCIsXG4gICAgICBcIm11bHRpLWxpbmVcIjogXCJcIixcbiAgICAgIFwicm93c1wiOiBcIjJcIlxuICAgIH0sXG4gICAgbW9kZWw6IHtcbiAgICAgIHZhbHVlOiAoX3ZtLmNvbW1lbnRJbnB1dCksXG4gICAgICBjYWxsYmFjazogZnVuY3Rpb24oJCR2KSB7XG4gICAgICAgIF92bS5jb21tZW50SW5wdXQgPSAkJHZcbiAgICAgIH0sXG4gICAgICBleHByZXNzaW9uOiBcImNvbW1lbnRJbnB1dFwiXG4gICAgfVxuICB9KV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1mbGV4Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcInRleHQteHMtY2VudGVyXCJcbiAgfSwgW19jKCd2LWJ0bicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJwcmltYXJ5XCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwiZmFiXCI6IFwiXCIsXG4gICAgICBcImRhcmtcIjogXCJcIixcbiAgICAgIFwic21hbGxcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LWljb24nLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwiZGFya1wiOiBcIlwiXG4gICAgfVxuICB9LCBbX3ZtLl92KFwic2VuZFwiKV0pXSwgMSldLCAxKV0sIDEpXSwgMSlcbn0sc3RhdGljUmVuZGVyRm5zOiBbXX1cbm1vZHVsZS5leHBvcnRzLnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgIHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIikucmVyZW5kZXIoXCJkYXRhLXYtNzA0ZGJlOTZcIiwgbW9kdWxlLmV4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LTcwNGRiZTk2XCIsXCJoYXNTY29wZWRcIjpmYWxzZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9BZGRDb21tZW50LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjU0XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygndi1saXN0Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcInB5LTBcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJ0aHJlZS1saW5lXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygnci1hZGQtY29tbWVudCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ1c2VyLWltYWdlXCI6IFwiL2ltYWdlcy9hdmF0YXIuanBnXCJcbiAgICB9XG4gIH0pLCBfdm0uX3YoXCIgXCIpLCBfdm0uX2woKF92bS5jb21tZW50cyksIGZ1bmN0aW9uKGNvbW1lbnQsIGkpIHtcbiAgICByZXR1cm4gW19jKCdyLWNvbW1lbnQnLCB7XG4gICAgICBrZXk6IGksXG4gICAgICBzdGF0aWNDbGFzczogXCJweS0yIHB4LTIgcmVtb3ZlTGlzdEhvdmVyXCIsXG4gICAgICBhdHRyczoge1xuICAgICAgICBcImNvbW1lbnRcIjogY29tbWVudFxuICAgICAgfVxuICAgIH0sIFtfdm0uX3YoX3ZtLl9zKGNvbW1lbnQuY29tbWVudCkpXSksIF92bS5fdihcIiBcIiksIChpICE9IF92bS5jb21tZW50cy5sZW5ndGggLSAxKSA/IF9jKCd2LWRpdmlkZXInLCB7XG4gICAgICBrZXk6IGlcbiAgICB9KSA6IF92bS5fZSgpXVxuICB9KV0sIDIpXG59LHN0YXRpY1JlbmRlckZuczogW119XG5tb2R1bGUuZXhwb3J0cy5yZW5kZXIuX3dpdGhTdHJpcHBlZCA9IHRydWVcbmlmIChtb2R1bGUuaG90KSB7XG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKG1vZHVsZS5ob3QuZGF0YSkge1xuICAgICByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpLnJlcmVuZGVyKFwiZGF0YS12LWE1YWE3OTk2XCIsIG1vZHVsZS5leHBvcnRzKVxuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXI/e1wiaWRcIjpcImRhdGEtdi1hNWFhNzk5NlwiLFwiaGFzU2NvcGVkXCI6ZmFsc2V9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvY29tbWVudHMvQ29tbWVudExpc3QudnVlXG4vLyBtb2R1bGUgaWQgPSAyNTVcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwibW9kdWxlLmV4cG9ydHM9e3JlbmRlcjpmdW5jdGlvbiAoKXt2YXIgX3ZtPXRoaXM7dmFyIF9oPV92bS4kY3JlYXRlRWxlbWVudDt2YXIgX2M9X3ZtLl9zZWxmLl9jfHxfaDtcbiAgcmV0dXJuIF9jKCd2LWNhcmQnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwicG9zdC1jYXJkIG1iLTVcIlxuICB9LCBbKF92bS5wb3N0LnJlcG9ydCkgPyBfYygndi1zeXN0ZW0tYmFyJywge1xuICAgIHN0YXRpY0NsYXNzOiBcImluZm9cIixcbiAgICBhdHRyczoge1xuICAgICAgXCJzdGF0dXNcIjogXCJcIixcbiAgICAgIFwiZGFya1wiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtaWNvbicsIFtfdm0uX3YoXCJyZXBvcnRcIildKSwgX3ZtLl92KFwiXFxuICAgICAgICBUaGlzIGhhcyBiZWVuIHJlcG9ydGVkIHRvIHRoZSBwb2xpY2VcXG4gICAgICAgIFwiKSwgX2MoJ3Ytc3BhY2VyJyksIF92bS5fdihcIiBcIiksIF9jKCd2LWljb24nLCBbX3ZtLl92KFwibG9jYXRpb25fb25cIildKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3NwYW4nLCBbX3ZtLl92KFwiQWdlZ2VcIildKV0sIDEpIDogX3ZtLl9lKCksIF92bS5fdihcIiBcIiksIF9jKCd2LWNhcmQtYWN0aW9ucycsIHtcbiAgICBzdGF0aWNDbGFzczogXCJtYS0wIHBhLTBcIlxuICB9LCBbX2MoJ3ItdXNlci10b3AnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwidXNlclwiOiBfdm0ucG9zdC51c2VyXG4gICAgfVxuICB9KSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3Ytc3BhY2VyJyksIF92bS5fdihcIiBcIiksIF9jKCd2LW1lbnUnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwiYm90dG9tXCI6IFwiXCIsXG4gICAgICBcInJpZ2h0XCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi1idG4nLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwiaWNvblwiOiBcIlwiXG4gICAgfSxcbiAgICBzbG90OiBcImFjdGl2YXRvclwiXG4gIH0sIFtfYygndi1pY29uJywgW192bS5fdihcIm1vcmVfdmVydFwiKV0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWxpc3QnLCBbX2MoJ3YtbGlzdC10aWxlJywge1xuICAgIG5hdGl2ZU9uOiB7XG4gICAgICBcImNsaWNrXCI6IGZ1bmN0aW9uKCRldmVudCkge1xuICAgICAgICBfdm0ucmVtb3ZlKCRldmVudClcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtfYygndi1saXN0LXRpbGUtY29udGVudCcsIFtfYygndi1saXN0LXRpbGUtdGl0bGUnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwiZXJyb3ItLXRleHRcIlxuICB9LCBbX3ZtLl92KFwiRGVsZXRlXCIpXSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtbGlzdC10aWxlLWFjdGlvbicsIFtfYygndi1pY29uJywge1xuICAgIHN0YXRpY0NsYXNzOiBcImVycm9yLS10ZXh0XCJcbiAgfSwgW192bS5fdihcImRlbGV0ZVwiKV0pXSwgMSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtbGlzdC10aWxlJywgW19jKCd2LWxpc3QtdGlsZS1jb250ZW50JywgW19jKCd2LWxpc3QtdGlsZS10aXRsZScsIHtcbiAgICBzdGF0aWNDbGFzczogXCJpbmZvLS10ZXh0XCJcbiAgfSwgW192bS5fdihcIlJlcG9ydFwiKV0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWxpc3QtdGlsZS1hY3Rpb24nLCBbX2MoJ3YtaWNvbicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJpbmZvLS10ZXh0XCJcbiAgfSwgW192bS5fdihcInJlcG9ydFwiKV0pXSwgMSldLCAxKV0sIDEpXSwgMSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgKF92bS5wb3N0Lm1lZGlhKSA/IF9jKCd2LWNhcmQtbWVkaWEnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwic3JjXCI6IF92bS5wb3N0Lm1lZGlhLFxuICAgICAgXCJoZWlnaHRcIjogXCIzMDBweFwiXG4gICAgfVxuICB9KSA6IF9jKCd2LWRpdmlkZXInLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwiaW5zZXRcIjogXCJcIlxuICAgIH1cbiAgfSksIF92bS5fdihcIiBcIiksIF9jKCd2LWNhcmQtdGl0bGUnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwicHJpbWFyeS10aXRsZVwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ2RpdicsIFtfYygnc3BhbicsIFtfdm0uX3YoXCJcXG4gICAgICAgICAgICAgICAgXCIgKyBfdm0uX3MoX3ZtLnBvc3QudGV4dCkgKyBcIlxcbiAgICAgICAgICAgIFwiKV0pXSldKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtY2FyZC1hY3Rpb25zJywge1xuICAgIHN0YXRpY0NsYXNzOiBcInByaW1hcnlcIlxuICB9LCBbX2MoJ3YtYnRuJywge1xuICAgIHN0YXRpY0NsYXNzOiBcIm14LTJcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJmbGF0XCI6IFwiXCIsXG4gICAgICBcImRhcmtcIjogXCJcIixcbiAgICAgIFwiaWNvblwiOiBcIlwiXG4gICAgfVxuICB9LCBbX3ZtLl92KFwiXFxuICAgICAgICAgICAgXCIgKyBfdm0uX3MoX3ZtLnBvc3QubGlrZXMgPiAxID8gX3ZtLnBvc3QubGlrZXMgOiAnJykgKyBcIlxcbiAgICAgICAgICAgIFwiKSwgX2MoJ3YtaWNvbicsIFtfdm0uX3YoXCJmYXZvcml0ZVwiKV0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWJ0bicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJteC0yXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwiZmxhdFwiOiBcIlwiLFxuICAgICAgXCJkYXJrXCI6IFwiXCIsXG4gICAgICBcImljb25cIjogXCJcIlxuICAgIH1cbiAgfSwgW192bS5fdihcIlxcbiAgICAgICAgICAgIFwiICsgX3ZtLl9zKF92bS5wb3N0LnJlcG9zdHMgPiAxID8gX3ZtLnBvc3QucmVwb3N0cyA6ICcnKSArIFwiXFxuICAgICAgICAgICAgXCIpLCBfYygndi1pY29uJywgW192bS5fdihcInJlcGVhdFwiKV0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LXNwYWNlcicpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1idG4nLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwibXgtM1wiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcImRhcmtcIjogXCJcIixcbiAgICAgIFwiaWNvblwiOiBcIlwiXG4gICAgfSxcbiAgICBuYXRpdmVPbjoge1xuICAgICAgXCJjbGlja1wiOiBmdW5jdGlvbigkZXZlbnQpIHtcbiAgICAgICAgX3ZtLmlzQ29tbWVudE9wZW4gPSAhX3ZtLmlzQ29tbWVudE9wZW5cbiAgICAgIH1cbiAgICB9XG4gIH0sIFtfYygndi1pY29uJywgW192bS5fdihcImNvbW1lbnRcIildKV0sIDEpXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd0cmFuc2l0aW9uJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcIm5hbWVcIjogXCJmYWRlXCJcbiAgICB9XG4gIH0sIFtfYygndi1jYXJkLXRleHQnLCB7XG4gICAgZGlyZWN0aXZlczogW3tcbiAgICAgIG5hbWU6IFwic2hvd1wiLFxuICAgICAgcmF3TmFtZTogXCJ2LXNob3dcIixcbiAgICAgIHZhbHVlOiAoX3ZtLmlzQ29tbWVudE9wZW4pLFxuICAgICAgZXhwcmVzc2lvbjogXCJpc0NvbW1lbnRPcGVuXCJcbiAgICB9XSxcbiAgICBzdGF0aWNDbGFzczogXCJjb21tZW50LWJveCBwYS0wXCJcbiAgfSwgW19jKCdyLWNvbW1lbnQtbGlzdCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJjb21tZW50c1wiOiBfdm0ucG9zdC5jb21tZW50c1xuICAgIH1cbiAgfSldLCAxKV0sIDEpXSwgMSlcbn0sc3RhdGljUmVuZGVyRm5zOiBbXX1cbm1vZHVsZS5leHBvcnRzLnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgIHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIikucmVyZW5kZXIoXCJkYXRhLXYtYTZiZDljZTJcIiwgbW9kdWxlLmV4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LWE2YmQ5Y2UyXCIsXCJoYXNTY29wZWRcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL1Bvc3QudnVlXG4vLyBtb2R1bGUgaWQgPSAyNTZcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwibW9kdWxlLmV4cG9ydHM9e3JlbmRlcjpmdW5jdGlvbiAoKXt2YXIgX3ZtPXRoaXM7dmFyIF9oPV92bS4kY3JlYXRlRWxlbWVudDt2YXIgX2M9X3ZtLl9zZWxmLl9jfHxfaDtcbiAgcmV0dXJuIF9jKCdkaXYnLCBbX2MoJ3YtbGF5b3V0Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcInB5LTBcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJyb3dcIjogXCJcIixcbiAgICAgIFwid3JhcFwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3RyYW5zaXRpb24tZ3JvdXAnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwibmFtZVwiOiBcImxpc3RcIlxuICAgIH1cbiAgfSwgX3ZtLl9sKChfdm0ucG9zdHMpLCBmdW5jdGlvbihwb3N0LCBpKSB7XG4gICAgcmV0dXJuIF9jKCd2LWZsZXgnLCB7XG4gICAgICBrZXk6IHBvc3QuaWQsXG4gICAgICBhdHRyczoge1xuICAgICAgICBcInhzMTJcIjogXCJcIixcbiAgICAgICAgXCJtZDEyXCI6IFwiXCJcbiAgICAgIH1cbiAgICB9LCBbX2MoJ3ItcG9zdCcsIHtcbiAgICAgIHN0YXRpY0NsYXNzOiBcIm1iLTVcIixcbiAgICAgIGF0dHJzOiB7XG4gICAgICAgIFwicG9zdFwiOiBwb3N0XG4gICAgICB9LFxuICAgICAgb246IHtcbiAgICAgICAgXCJyZW1vdmVcIjogX3ZtLnJlbW92ZVBvc3RcbiAgICAgIH1cbiAgICB9KV0sIDEpXG4gIH0pKV0sIDEpXSwgMSlcbn0sc3RhdGljUmVuZGVyRm5zOiBbXX1cbm1vZHVsZS5leHBvcnRzLnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgIHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIikucmVyZW5kZXIoXCJkYXRhLXYtYWU5YjE4NjZcIiwgbW9kdWxlLmV4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LWFlOWIxODY2XCIsXCJoYXNTY29wZWRcIjpmYWxzZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9Qb3N0TGlzdC52dWVcbi8vIG1vZHVsZSBpZCA9IDI1N1xuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJ2YXIgZGlzcG9zZWQgPSBmYWxzZVxuZnVuY3Rpb24gaW5qZWN0U3R5bGUgKHNzckNvbnRleHQpIHtcbiAgaWYgKGRpc3Bvc2VkKSByZXR1cm5cbiAgcmVxdWlyZShcIiEhdnVlLXN0eWxlLWxvYWRlciFjc3MtbG9hZGVyP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXg/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTAxODc4NTdjXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IXN0eWx1cy1sb2FkZXIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9BZGRQb3N0LnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi9BZGRQb3N0LnZ1ZVwiKSxcbiAgLyogdGVtcGxhdGUgKi9cbiAgcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyL2luZGV4P3tcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMDE4Nzg1N2NcXFwiLFxcXCJoYXNTY29wZWRcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9BZGRQb3N0LnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIFwiZGF0YS12LTAxODc4NTdjXCIsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvQWRkUG9zdC52dWVcIlxuaWYgKENvbXBvbmVudC5lc01vZHVsZSAmJiBPYmplY3Qua2V5cyhDb21wb25lbnQuZXNNb2R1bGUpLnNvbWUoZnVuY3Rpb24gKGtleSkge3JldHVybiBrZXkgIT09IFwiZGVmYXVsdFwiICYmIGtleS5zdWJzdHIoMCwgMikgIT09IFwiX19cIn0pKSB7Y29uc29sZS5lcnJvcihcIm5hbWVkIGV4cG9ydHMgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gKi52dWUgZmlsZXMuXCIpfVxuaWYgKENvbXBvbmVudC5vcHRpb25zLmZ1bmN0aW9uYWwpIHtjb25zb2xlLmVycm9yKFwiW3Z1ZS1sb2FkZXJdIEFkZFBvc3QudnVlOiBmdW5jdGlvbmFsIGNvbXBvbmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0ZW1wbGF0ZXMsIHRoZXkgc2hvdWxkIHVzZSByZW5kZXIgZnVuY3Rpb25zLlwiKX1cblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LTAxODc4NTdjXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtMDE4Nzg1N2NcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvQWRkUG9zdC52dWVcbi8vIG1vZHVsZSBpZCA9IDI1OFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMDE4Nzg1N2NcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9BZGRQb3N0LnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiMWJkYTIwNDFcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMDE4Nzg1N2NcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9BZGRQb3N0LnZ1ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgdmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0wMTg3ODU3Y1xcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL0FkZFBvc3QudnVlXCIpO1xuICAgICBpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcbiAgICAgdXBkYXRlKG5ld0NvbnRlbnQpO1xuICAgfSk7XG4gfVxuIC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3NcbiBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTAxODc4NTdjXCIsXCJzY29wZWRcIjp0cnVlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9BZGRQb3N0LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjU5XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodHJ1ZSk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJcXG4jZmlsZUltYWdlW2RhdGEtdi0wMTg3ODU3Y10ge1xcbiAgZGlzcGxheTogbm9uZTtcXG59XFxuXCIsIFwiXCIsIHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9BZGRQb3N0LnZ1ZVwiLFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9BZGRQb3N0LnZ1ZVwiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiO0FBcUhBO0VBQ0ksY0FBQTtDQ3BISFwiLFwiZmlsZVwiOlwiQWRkUG9zdC52dWVcIixcInNvdXJjZXNDb250ZW50XCI6W1wiXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuI2ZpbGVJbWFnZXtcXG4gICAgZGlzcGxheTogbm9uZTtcXG59XFxuXCIsXCIjZmlsZUltYWdlIHtcXG4gIGRpc3BsYXk6IG5vbmU7XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi0wMTg3ODU3Y1wiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvQWRkUG9zdC52dWVcbi8vIG1vZHVsZSBpZCA9IDI2MFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCI8dGVtcGxhdGU+XG4gICAgPHYtY2FyZD5cbiAgICAgICAgPGZvcm0gQHN1Ym1pdC5wcmV2ZW50PVwicG9zdGVkXCI+XG4gICAgICAgICAgICA8di1jYXJkLXRpdGxlIGNsYXNzPVwiaGVhZGxpbmVcIj5BZGQgYSBuZXcgcG9zdDwvdi1jYXJkLXRpdGxlPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImdyZXkgbGlnaHRlbi0yXCI+XG4gICAgICAgICAgICAgICAgPHYtbGF5b3V0IGFsaWduLWNlbnRlcj5cbiAgICAgICAgICAgICAgICAgICAgPHYtZmxleCBtZDIgY2xhc3M9XCJoaWRkZW4teHMtb25seVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHYtbGlzdC10aWxlLWF2YXRhcj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW1nIDpzcmM9XCJ1c2VySW1hZ2VcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC92LWxpc3QtdGlsZS1hdmF0YXI+XG4gICAgICAgICAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICAgICAgICAgICAgICA8di1mbGV4IHhzMTIgc20xMD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx2LXRleHQtZmllbGQgY2xhc3M9XCJwYi0wXCIgdi1tb2RlbD1cInBvc3QudGV4dFwiIGxhYmVsPVwid3JpdGUgYSBwb3N0XCIgZnVsbC13aWR0aCBtdWx0aS1saW5lIHJvd3M9XCIzXCI+PC92LXRleHQtZmllbGQ+XG4gICAgICAgICAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICAgICAgICAgIDwvdi1sYXlvdXQ+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgPHYtY2FyZC1tZWRpYSB2LWlmPVwicG9zdC5tZWRpYVwiIDpzcmM9XCJwb3N0Lm1lZGlhLmxpbmtcIiBoZWlnaHQ9XCIzMDBweFwiPjwvdi1jYXJkLW1lZGlhPlxuXG4gICAgICAgICAgICA8di1jYXJkLWFjdGlvbnMgY2xhc3M9XCJzZWNvbmRhcnlcIj5cbiAgICAgICAgICAgICAgICA8di1zd2l0Y2ggdi1iaW5kOmxhYmVsPVwiJ1JlcG9ydCdcIiB2LW1vZGVsPVwicG9zdC5yZXBvcnRcIiBjbGFzcz1cIm1hLTAgcGEtMCBtbC0zXCIgaGlkZS1kZXRhaWxzIGNvbG9yPVwicHJpbWFyeVwiPjwvdi1zd2l0Y2g+XG4gICAgICAgICAgICAgICAgPHYtc3BhY2VyPjwvdi1zcGFjZXI+XG4gICAgICAgICAgICAgICAgPHYtYnRuIGZsYXQgaWNvbiBjbGFzcz1cIm14LTJcIiB2LXRvb2x0aXA6bGVmdD1cIntodG1sOiAnQWRkIGEgcGhvdG8nfVwiIEBjbGljaz1cImFkZFBob3RvXCIgdi1pZj1cIiFwb3N0Lm1lZGlhXCI+XG4gICAgICAgICAgICAgICAgICAgIDx2LWljb24+YWRkX2FfcGhvdG88L3YtaWNvbj5cbiAgICAgICAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICAgICAgICAgIDx2LWJ0biBmbGF0IGljb24gY2xhc3M9XCJteC0yXCIgdi10b29sdGlwOmxlZnQ9XCJ7aHRtbDogJ1JlbW92ZSBwaG90byd9XCIgQGNsaWNrPVwicmVtb3ZlUGhvdG9cIiB2LWVsc2U+XG4gICAgICAgICAgICAgICAgICAgIDx2LWljb24+Y2xvc2U8L3YtaWNvbj5cbiAgICAgICAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICAgICAgPC92LWNhcmQtYWN0aW9ucz5cbiAgICAgICAgICAgIDx2LWNhcmQtYWN0aW9ucz5cbiAgICAgICAgICAgICAgICA8di1zcGFjZXI+PC92LXNwYWNlcj5cbiAgICAgICAgICAgICAgICA8di1idG4gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwicHJpbWFyeS0tdGV4dFwiIGZsYXQ9XCJmbGF0XCIgQGNsaWNrLm5hdGl2ZT1cImNhbmNlbGxlZFwiPkNhbmNlbDwvdi1idG4+XG4gICAgICAgICAgICAgICAgPHYtYnRuIHR5cGU9XCJzdWJtaXRcIiBjbGFzcz1cInByaW1hcnlcIiA6bG9hZGluZz1cInBvc3RpbmdcIiA6ZGlzYWJsZWQ9XCJwb3N0aW5nXCI+UG9zdDwvdi1idG4+XG4gICAgICAgICAgICA8L3YtY2FyZC1hY3Rpb25zPlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJmaWxlXCIgQGNoYW5nZT1cIm9uRmlsZUNoYW5nZVwiIHJlZj1cImhpZGRlbkZpbGVcIiBuYW1lPVwiZmlsZUltYWdlXCIgaWQ9XCJmaWxlSW1hZ2VcIiAvPlxuICAgICAgICA8L2Zvcm0+XG4gICAgPC92LWNhcmQ+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0PlxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHByb3BzOiB7XG4gICAgICAgIHVzZXJJbWFnZToge1xuICAgICAgICAgICAgZGVmYXVsdDogJy9pbWFnZXMvdW5rb3duLmpwZycsXG4gICAgICAgICAgICB0eXBlOiBTdHJpbmdcbiAgICAgICAgfSxcbiAgICAgICAgY2xlYXI6IHtcbiAgICAgICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICB9XG4gICAgfSxcbiAgICBkYXRhKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZGlhbG9nOiB0cnVlLFxuICAgICAgICAgICAgaXNSZXBvcnQ6IGZhbHNlLFxuICAgICAgICAgICAgcG9zdDoge1xuICAgICAgICAgICAgICAgIHRleHQ6ICcnLFxuICAgICAgICAgICAgICAgIG1lZGlhOiBmYWxzZSxcbiAgICAgICAgICAgICAgICByZXBvcnQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9zdGluZzogZmFsc2VcbiAgICAgICAgfVxuICAgIH0sXG4gICAgd2F0Y2g6IHtcbiAgICAgICAgY2xlYXIoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jbGVhcikge1xuICAgICAgICAgICAgICAgIHRoaXMucG9zdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJycsXG4gICAgICAgICAgICAgICAgICAgIG1lZGlhOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0OiBmYWxzZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9zdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIHJlbW92ZVBob3RvKCkge1xuICAgICAgICAgICAgdGhpcy5wb3N0Lm1lZGlhID0gbnVsbDtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkUGhvdG8oKSB7XG4gICAgICAgICAgICB0aGlzLiRyZWZzLmhpZGRlbkZpbGUuY2xpY2soKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25GaWxlQ2hhbmdlKGUpIHtcbiAgICAgICAgICAgIGxldCBmaWxlcyA9IGUudGFyZ2V0LmZpbGVzIHx8IGUuZGF0YVRyYW5zZmVyLmZpbGVzO1xuICAgICAgICAgICAgaWYgKCFmaWxlcy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVJbWFnZShmaWxlc1swXSk7XG4gICAgICAgIH0sXG4gICAgICAgIGNyZWF0ZUltYWdlKGZpbGUpIHtcbiAgICAgICAgICAgIGxldCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgbGV0IHZtID0gdGhpcztcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIHZtLnBvc3QubWVkaWEgPSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbms6IGUudGFyZ2V0LnJlc3VsdCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2FuY2VsbGVkKCkge1xuICAgICAgICAgICAgdGhpcy5wb3N0ID0ge1xuICAgICAgICAgICAgICAgIHRleHQ6ICcnLFxuICAgICAgICAgICAgICAgIG1lZGlhOiBmYWxzZSxcbiAgICAgICAgICAgICAgICByZXBvcnQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGhpcy5wb3N0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdjYW5jZWxlZCcpO1xuICAgICAgICB9LFxuICAgICAgICBwb3N0ZWQoKSB7XG4gICAgICAgICAgICB0aGlzLnBvc3RpbmcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgncG9zdGVkJywgdGhpcy5wb3N0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInN0eWx1c1wiIHNjb3BlZD5cbiAgICAjZmlsZUltYWdle1xuICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgIH1cbjwvc3R5bGU+XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIEFkZFBvc3QudnVlPzk1YmZkOTM0IiwibW9kdWxlLmV4cG9ydHM9e3JlbmRlcjpmdW5jdGlvbiAoKXt2YXIgX3ZtPXRoaXM7dmFyIF9oPV92bS4kY3JlYXRlRWxlbWVudDt2YXIgX2M9X3ZtLl9zZWxmLl9jfHxfaDtcbiAgcmV0dXJuIF9jKCd2LWNhcmQnLCBbX2MoJ2Zvcm0nLCB7XG4gICAgb246IHtcbiAgICAgIFwic3VibWl0XCI6IGZ1bmN0aW9uKCRldmVudCkge1xuICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgX3ZtLnBvc3RlZCgkZXZlbnQpXG4gICAgICB9XG4gICAgfVxuICB9LCBbX2MoJ3YtY2FyZC10aXRsZScsIHtcbiAgICBzdGF0aWNDbGFzczogXCJoZWFkbGluZVwiXG4gIH0sIFtfdm0uX3YoXCJBZGQgYSBuZXcgcG9zdFwiKV0pLCBfdm0uX3YoXCIgXCIpLCBfYygnZGl2Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcImdyZXkgbGlnaHRlbi0yXCJcbiAgfSwgW19jKCd2LWxheW91dCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJhbGlnbi1jZW50ZXJcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LWZsZXgnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwiaGlkZGVuLXhzLW9ubHlcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJtZDJcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LWxpc3QtdGlsZS1hdmF0YXInLCBbX2MoJ2ltZycsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJzcmNcIjogX3ZtLnVzZXJJbWFnZVxuICAgIH1cbiAgfSldKV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1mbGV4Jywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInhzMTJcIjogXCJcIixcbiAgICAgIFwic20xMFwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtdGV4dC1maWVsZCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJwYi0wXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwibGFiZWxcIjogXCJ3cml0ZSBhIHBvc3RcIixcbiAgICAgIFwiZnVsbC13aWR0aFwiOiBcIlwiLFxuICAgICAgXCJtdWx0aS1saW5lXCI6IFwiXCIsXG4gICAgICBcInJvd3NcIjogXCIzXCJcbiAgICB9LFxuICAgIG1vZGVsOiB7XG4gICAgICB2YWx1ZTogKF92bS5wb3N0LnRleHQpLFxuICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCQkdikge1xuICAgICAgICBfdm0ucG9zdC50ZXh0ID0gJCR2XG4gICAgICB9LFxuICAgICAgZXhwcmVzc2lvbjogXCJwb3N0LnRleHRcIlxuICAgIH1cbiAgfSldLCAxKV0sIDEpXSwgMSksIF92bS5fdihcIiBcIiksIChfdm0ucG9zdC5tZWRpYSkgPyBfYygndi1jYXJkLW1lZGlhJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInNyY1wiOiBfdm0ucG9zdC5tZWRpYS5saW5rLFxuICAgICAgXCJoZWlnaHRcIjogXCIzMDBweFwiXG4gICAgfVxuICB9KSA6IF92bS5fZSgpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1jYXJkLWFjdGlvbnMnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwic2Vjb25kYXJ5XCJcbiAgfSwgW19jKCd2LXN3aXRjaCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJtYS0wIHBhLTAgbWwtM1wiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcImxhYmVsXCI6ICdSZXBvcnQnLFxuICAgICAgXCJoaWRlLWRldGFpbHNcIjogXCJcIixcbiAgICAgIFwiY29sb3JcIjogXCJwcmltYXJ5XCJcbiAgICB9LFxuICAgIG1vZGVsOiB7XG4gICAgICB2YWx1ZTogKF92bS5wb3N0LnJlcG9ydCksXG4gICAgICBjYWxsYmFjazogZnVuY3Rpb24oJCR2KSB7XG4gICAgICAgIF92bS5wb3N0LnJlcG9ydCA9ICQkdlxuICAgICAgfSxcbiAgICAgIGV4cHJlc3Npb246IFwicG9zdC5yZXBvcnRcIlxuICAgIH1cbiAgfSksIF92bS5fdihcIiBcIiksIF9jKCd2LXNwYWNlcicpLCBfdm0uX3YoXCIgXCIpLCAoIV92bS5wb3N0Lm1lZGlhKSA/IF9jKCd2LWJ0bicsIHtcbiAgICBkaXJlY3RpdmVzOiBbe1xuICAgICAgbmFtZTogXCJ0b29sdGlwXCIsXG4gICAgICByYXdOYW1lOiBcInYtdG9vbHRpcDpsZWZ0XCIsXG4gICAgICB2YWx1ZTogKHtcbiAgICAgICAgaHRtbDogJ0FkZCBhIHBob3RvJ1xuICAgICAgfSksXG4gICAgICBleHByZXNzaW9uOiBcIntodG1sOiAnQWRkIGEgcGhvdG8nfVwiLFxuICAgICAgYXJnOiBcImxlZnRcIlxuICAgIH1dLFxuICAgIHN0YXRpY0NsYXNzOiBcIm14LTJcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJmbGF0XCI6IFwiXCIsXG4gICAgICBcImljb25cIjogXCJcIlxuICAgIH0sXG4gICAgb246IHtcbiAgICAgIFwiY2xpY2tcIjogX3ZtLmFkZFBob3RvXG4gICAgfVxuICB9LCBbX2MoJ3YtaWNvbicsIFtfdm0uX3YoXCJhZGRfYV9waG90b1wiKV0pXSwgMSkgOiBfYygndi1idG4nLCB7XG4gICAgZGlyZWN0aXZlczogW3tcbiAgICAgIG5hbWU6IFwidG9vbHRpcFwiLFxuICAgICAgcmF3TmFtZTogXCJ2LXRvb2x0aXA6bGVmdFwiLFxuICAgICAgdmFsdWU6ICh7XG4gICAgICAgIGh0bWw6ICdSZW1vdmUgcGhvdG8nXG4gICAgICB9KSxcbiAgICAgIGV4cHJlc3Npb246IFwie2h0bWw6ICdSZW1vdmUgcGhvdG8nfVwiLFxuICAgICAgYXJnOiBcImxlZnRcIlxuICAgIH1dLFxuICAgIHN0YXRpY0NsYXNzOiBcIm14LTJcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJmbGF0XCI6IFwiXCIsXG4gICAgICBcImljb25cIjogXCJcIlxuICAgIH0sXG4gICAgb246IHtcbiAgICAgIFwiY2xpY2tcIjogX3ZtLnJlbW92ZVBob3RvXG4gICAgfVxuICB9LCBbX2MoJ3YtaWNvbicsIFtfdm0uX3YoXCJjbG9zZVwiKV0pXSwgMSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtY2FyZC1hY3Rpb25zJywgW19jKCd2LXNwYWNlcicpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1idG4nLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwicHJpbWFyeS0tdGV4dFwiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcInR5cGVcIjogXCJidXR0b25cIixcbiAgICAgIFwiZmxhdFwiOiBcImZsYXRcIlxuICAgIH0sXG4gICAgbmF0aXZlT246IHtcbiAgICAgIFwiY2xpY2tcIjogZnVuY3Rpb24oJGV2ZW50KSB7XG4gICAgICAgIF92bS5jYW5jZWxsZWQoJGV2ZW50KVxuICAgICAgfVxuICAgIH1cbiAgfSwgW192bS5fdihcIkNhbmNlbFwiKV0pLCBfdm0uX3YoXCIgXCIpLCBfYygndi1idG4nLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwicHJpbWFyeVwiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcInR5cGVcIjogXCJzdWJtaXRcIixcbiAgICAgIFwibG9hZGluZ1wiOiBfdm0ucG9zdGluZyxcbiAgICAgIFwiZGlzYWJsZWRcIjogX3ZtLnBvc3RpbmdcbiAgICB9XG4gIH0sIFtfdm0uX3YoXCJQb3N0XCIpXSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ2lucHV0Jywge1xuICAgIHJlZjogXCJoaWRkZW5GaWxlXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwidHlwZVwiOiBcImZpbGVcIixcbiAgICAgIFwibmFtZVwiOiBcImZpbGVJbWFnZVwiLFxuICAgICAgXCJpZFwiOiBcImZpbGVJbWFnZVwiXG4gICAgfSxcbiAgICBvbjoge1xuICAgICAgXCJjaGFuZ2VcIjogX3ZtLm9uRmlsZUNoYW5nZVxuICAgIH1cbiAgfSldLCAxKV0pXG59LHN0YXRpY1JlbmRlckZuczogW119XG5tb2R1bGUuZXhwb3J0cy5yZW5kZXIuX3dpdGhTdHJpcHBlZCA9IHRydWVcbmlmIChtb2R1bGUuaG90KSB7XG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKG1vZHVsZS5ob3QuZGF0YSkge1xuICAgICByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpLnJlcmVuZGVyKFwiZGF0YS12LTAxODc4NTdjXCIsIG1vZHVsZS5leHBvcnRzKVxuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXI/e1wiaWRcIjpcImRhdGEtdi0wMTg3ODU3Y1wiLFwiaGFzU2NvcGVkXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9BZGRQb3N0LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjYyXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygnZGl2JywgW19jKCd2LWxheW91dCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJtYi0zXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwianVzdGlmeS1jZW50ZXJcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LWZsZXgnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwieHMxMlwiOiBcIlwiLFxuICAgICAgXCJzbThcIjogXCJcIixcbiAgICAgIFwibWQ2XCI6IFwiXCIsXG4gICAgICBcImxnNVwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ2RpdicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJoZWFkbGluZVwiXG4gIH0sIFtfdm0uX3YoXCJQb3N0c1wiKV0pXSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtbGF5b3V0Jywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcIndyYXBcIjogXCJcIixcbiAgICAgIFwianVzdGlmeS1jZW50ZXJcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LWZsZXgnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwieHMxMlwiOiBcIlwiLFxuICAgICAgXCJzbThcIjogXCJcIixcbiAgICAgIFwibWQ2XCI6IFwiXCIsXG4gICAgICBcImxnNVwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3ItcG9zdHMnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwicG9zdHNcIjogX3ZtLnBvc3RzXG4gICAgfVxuICB9KV0sIDEpXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCdkaXYnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwiZmFiLWhvbGRlclwiXG4gIH0sIFtfYygndi1idG4nLCB7XG4gICAgZGlyZWN0aXZlczogW3tcbiAgICAgIG5hbWU6IFwidG9vbHRpcFwiLFxuICAgICAgcmF3TmFtZTogXCJ2LXRvb2x0aXA6dG9wXCIsXG4gICAgICB2YWx1ZTogKHtcbiAgICAgICAgaHRtbDogJ25ldyBwb3N0J1xuICAgICAgfSksXG4gICAgICBleHByZXNzaW9uOiBcInsgaHRtbDogJ25ldyBwb3N0JyB9XCIsXG4gICAgICBhcmc6IFwidG9wXCJcbiAgICB9XSxcbiAgICBzdGF0aWNDbGFzczogXCJwcmltYXJ5XCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwiZGFya1wiOiBcIlwiLFxuICAgICAgXCJmYWJcIjogXCJcIlxuICAgIH0sXG4gICAgbmF0aXZlT246IHtcbiAgICAgIFwiY2xpY2tcIjogZnVuY3Rpb24oJGV2ZW50KSB7XG4gICAgICAgICRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgX3ZtLm9wZW5OZXdQb3N0KCRldmVudClcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtfYygndi1pY29uJywgW192bS5fdihcImFkZFwiKV0pXSwgMSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtZGlhbG9nJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcIndpZHRoXCI6IFwiNjAwcHhcIlxuICAgIH0sXG4gICAgbW9kZWw6IHtcbiAgICAgIHZhbHVlOiAoX3ZtLm5ld1Bvc3RNb2RhbCksXG4gICAgICBjYWxsYmFjazogZnVuY3Rpb24oJCR2KSB7XG4gICAgICAgIF92bS5uZXdQb3N0TW9kYWwgPSAkJHZcbiAgICAgIH0sXG4gICAgICBleHByZXNzaW9uOiBcIm5ld1Bvc3RNb2RhbFwiXG4gICAgfVxuICB9LCBbX2MoJ3ItYWRkLXBvc3QnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwiY2xlYXJcIjogX3ZtLmNsZWFyTmV3UG9zdCxcbiAgICAgIFwidXNlckltYWdlXCI6IFwiL2ltYWdlcy9hdmF0YXIxLmpwZ1wiXG4gICAgfSxcbiAgICBvbjoge1xuICAgICAgXCJjYW5jZWxlZFwiOiBmdW5jdGlvbigkZXZlbnQpIHtcbiAgICAgICAgX3ZtLm5ld1Bvc3RNb2RhbCA9IGZhbHNlXG4gICAgICB9LFxuICAgICAgXCJwb3N0ZWRcIjogX3ZtLmFkZFBvc3RcbiAgICB9XG4gIH0pXSwgMSldLCAxKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi1lY2Y0MGVjMlwiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtZWNmNDBlYzJcIixcImhhc1Njb3BlZFwiOmZhbHNlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL3Bvc3RzU2NyZWVuLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjYzXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG5mdW5jdGlvbiBpbmplY3RTdHlsZSAoc3NyQ29udGV4dCkge1xuICBpZiAoZGlzcG9zZWQpIHJldHVyblxuICByZXF1aXJlKFwiISF2dWUtc3R5bGUtbG9hZGVyIWNzcy1sb2FkZXI/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleD97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtNDQzNzc5ZjBcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hc3R5bHVzLWxvYWRlciEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL21lc3NhZ2VzU2NyZWVuLnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi9tZXNzYWdlc1NjcmVlbi52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LTQ0Mzc3OWYwXFxcIixcXFwiaGFzU2NvcGVkXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vbWVzc2FnZXNTY3JlZW4udnVlXCIpLFxuICAvKiBzdHlsZXMgKi9cbiAgaW5qZWN0U3R5bGUsXG4gIC8qIHNjb3BlSWQgKi9cbiAgXCJkYXRhLXYtNDQzNzc5ZjBcIixcbiAgLyogbW9kdWxlSWRlbnRpZmllciAoc2VydmVyIG9ubHkpICovXG4gIG51bGxcbilcbkNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9tZXNzYWdlc1NjcmVlbi52dWVcIlxuaWYgKENvbXBvbmVudC5lc01vZHVsZSAmJiBPYmplY3Qua2V5cyhDb21wb25lbnQuZXNNb2R1bGUpLnNvbWUoZnVuY3Rpb24gKGtleSkge3JldHVybiBrZXkgIT09IFwiZGVmYXVsdFwiICYmIGtleS5zdWJzdHIoMCwgMikgIT09IFwiX19cIn0pKSB7Y29uc29sZS5lcnJvcihcIm5hbWVkIGV4cG9ydHMgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gKi52dWUgZmlsZXMuXCIpfVxuaWYgKENvbXBvbmVudC5vcHRpb25zLmZ1bmN0aW9uYWwpIHtjb25zb2xlLmVycm9yKFwiW3Z1ZS1sb2FkZXJdIG1lc3NhZ2VzU2NyZWVuLnZ1ZTogZnVuY3Rpb25hbCBjb21wb25lbnRzIGFyZSBub3Qgc3VwcG9ydGVkIHdpdGggdGVtcGxhdGVzLCB0aGV5IHNob3VsZCB1c2UgcmVuZGVyIGZ1bmN0aW9ucy5cIil9XG5cbi8qIGhvdCByZWxvYWQgKi9cbmlmIChtb2R1bGUuaG90KSB7KGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhvdEFQSSA9IHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIilcbiAgaG90QVBJLmluc3RhbGwocmVxdWlyZShcInZ1ZVwiKSwgZmFsc2UpXG4gIGlmICghaG90QVBJLmNvbXBhdGlibGUpIHJldHVyblxuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmICghbW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgaG90QVBJLmNyZWF0ZVJlY29yZChcImRhdGEtdi00NDM3NzlmMFwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfSBlbHNlIHtcbiAgICBob3RBUEkucmVsb2FkKFwiZGF0YS12LTQ0Mzc3OWYwXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9XG4gIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbiAoZGF0YSkge1xuICAgIGRpc3Bvc2VkID0gdHJ1ZVxuICB9KVxufSkoKX1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQuZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL21lc3NhZ2VzU2NyZWVuLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjY0XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi00NDM3NzlmMFxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL21lc3NhZ2VzU2NyZWVuLnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiMzU2N2RjZTFcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtNDQzNzc5ZjBcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9tZXNzYWdlc1NjcmVlbi52dWVcIiwgZnVuY3Rpb24oKSB7XG4gICAgIHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtNDQzNzc5ZjBcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9tZXNzYWdlc1NjcmVlbi52dWVcIik7XG4gICAgIGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuICAgICB1cGRhdGUobmV3Q29udGVudCk7XG4gICB9KTtcbiB9XG4gLy8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIhLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtNDQzNzc5ZjBcIixcInNjb3BlZFwiOnRydWUsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL21lc3NhZ2VzU2NyZWVuLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjY1XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodHJ1ZSk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJcXG5kaXZbZGF0YS12LTQ0Mzc3OWYwXSB7XFxuICB0ZXh0LWFsaWduOiBjZW50ZXI7XFxufVxcbmltZ1tkYXRhLXYtNDQzNzc5ZjBdIHtcXG4gIHdpZHRoOiAxNTBweDtcXG59XFxuaDFbZGF0YS12LTQ0Mzc3OWYwXSB7XFxuICBjb2xvcjogI2YwMDtcXG59XFxuXCIsIFwiXCIsIHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9tZXNzYWdlc1NjcmVlbi52dWVcIixcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvbWVzc2FnZXNTY3JlZW4udnVlXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCI7QUFjQTtFQUNJLG1CQUFBO0NDYkg7QURnQkQ7RUFDSSxhQUFBO0NDZEg7QURpQkQ7RUFDSSxZQUFBO0NDZkhcIixcImZpbGVcIjpcIm1lc3NhZ2VzU2NyZWVuLnZ1ZVwiLFwic291cmNlc0NvbnRlbnRcIjpbXCJcXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5kaXYge1xcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXJcXG59XFxuXFxuaW1nIHtcXG4gICAgd2lkdGg6IDE1MHB4XFxufVxcblxcbmgxIHtcXG4gICAgY29sb3I6IHJlZDtcXG59XFxuXFxuXCIsXCJkaXYge1xcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xcbn1cXG5pbWcge1xcbiAgd2lkdGg6IDE1MHB4O1xcbn1cXG5oMSB7XFxuICBjb2xvcjogI2YwMDtcXG59XFxuXCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTQ0Mzc3OWYwXCIsXCJzY29wZWRcIjp0cnVlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9tZXNzYWdlc1NjcmVlbi52dWVcbi8vIG1vZHVsZSBpZCA9IDI2NlxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCI8dGVtcGxhdGU+XG4gICAgPGRpdj5cbiAgICAgICAgPGltZyBzcmM9XCIvaW1hZ2VzL2xvZ28uc3ZnXCIgYWx0PVwiVnVldGlmeS5qc1wiPlxuICAgICAgICA8aDE+TWVzc2FnZXMgU2NyZWVuPC9oMT5cbiAgICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5leHBvcnQgZGVmYXVsdCB7XG5cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInN0eWx1c1wiIHNjb3BlZD5cbmRpdiB7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyXG59XG5cbmltZyB7XG4gICAgd2lkdGg6IDE1MHB4XG59XG5cbmgxIHtcbiAgICBjb2xvcjogcmVkO1xufVxuXG48L3N0eWxlPlxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIG1lc3NhZ2VzU2NyZWVuLnZ1ZT80NjU0MGYyMyIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfdm0uX20oMClcbn0sc3RhdGljUmVuZGVyRm5zOiBbZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygnZGl2JywgW19jKCdpbWcnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwic3JjXCI6IFwiL2ltYWdlcy9sb2dvLnN2Z1wiLFxuICAgICAgXCJhbHRcIjogXCJWdWV0aWZ5LmpzXCJcbiAgICB9XG4gIH0pLCBfdm0uX3YoXCIgXCIpLCBfYygnaDEnLCBbX3ZtLl92KFwiTWVzc2FnZXMgU2NyZWVuXCIpXSldKVxufV19XG5tb2R1bGUuZXhwb3J0cy5yZW5kZXIuX3dpdGhTdHJpcHBlZCA9IHRydWVcbmlmIChtb2R1bGUuaG90KSB7XG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKG1vZHVsZS5ob3QuZGF0YSkge1xuICAgICByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpLnJlcmVuZGVyKFwiZGF0YS12LTQ0Mzc3OWYwXCIsIG1vZHVsZS5leHBvcnRzKVxuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXI/e1wiaWRcIjpcImRhdGEtdi00NDM3NzlmMFwiLFwiaGFzU2NvcGVkXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9tZXNzYWdlc1NjcmVlbi52dWVcbi8vIG1vZHVsZSBpZCA9IDI2OFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJpbXBvcnQgTG9naW4gZnJvbSAnQC9wYWdlcy9hdXRoL3NjcmVlbnMvbG9naW5TY3JlZW4udnVlJztcbmltcG9ydCBSZWdpc3RlciBmcm9tICdAL3BhZ2VzL2F1dGgvc2NyZWVucy9yZWdpc3RlclNjcmVlbi52dWUnO1xuXG5pbXBvcnQgc3RvcmUgZnJvbSAnLi8uLi9zdG9yZS9zdG9yZSdcbmltcG9ydCB0eXBlcyBmcm9tICcuLy4uL3N0b3JlL3R5cGVzJ1xuXG5sZXQgY29uZmlybUF1dGggPSAodG8sIGZyb20sIG5leHQpID0+IHtcbiAgICBpZiAoc3RvcmUuZ2V0dGVyc1t0eXBlcy5hdXRoLk5BTUUgKyAnLycgKyB0eXBlcy5hdXRoLklTX0xPR0dFRF9JTl0pIHtcbiAgICAgICAgbmV4dCh7IG5hbWU6ICdkYXNoLmhvbWUnIH0pO1xuICAgIH1cbiAgICBuZXh0KCk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IFt7XG4gICAgICAgIHBhdGg6ICcvJyxcbiAgICAgICAgbmFtZTogJ2F1dGgubG9naW4nLFxuICAgICAgICBjb21wb25lbnQ6IExvZ2luLFxuICAgICAgICBiZWZvcmVFbnRlcjogY29uZmlybUF1dGhcbiAgICB9LFxuICAgIHtcbiAgICAgICAgcGF0aDogJ3JlZ2lzdGVyJyxcbiAgICAgICAgbmFtZTogJ2F1dGgucmVnaXN0ZXInLFxuICAgICAgICBjb21wb25lbnQ6IFJlZ2lzdGVyLFxuICAgICAgICBiZWZvcmVFbnRlcjogY29uZmlybUF1dGhcbiAgICB9LFxuXVxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcm91dGVyL2F1dGhSb3V0ZXMuanMiLCJ2YXIgZGlzcG9zZWQgPSBmYWxzZVxuZnVuY3Rpb24gaW5qZWN0U3R5bGUgKHNzckNvbnRleHQpIHtcbiAgaWYgKGRpc3Bvc2VkKSByZXR1cm5cbiAgcmVxdWlyZShcIiEhdnVlLXN0eWxlLWxvYWRlciFjc3MtbG9hZGVyP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXg/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTU1ZWYxN2RhXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSFzdHlsdXMtbG9hZGVyIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXN0eWxlcyZpbmRleD0wIS4vbG9naW5TY3JlZW4udnVlXCIpXG59XG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIikoXG4gIC8qIHNjcmlwdCAqL1xuICByZXF1aXJlKFwiISFiYWJlbC1sb2FkZXI/e1xcXCJjYWNoZURpcmVjdG9yeVxcXCI6dHJ1ZSxcXFwicHJlc2V0c1xcXCI6W1tcXFwiZW52XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlLFxcXCJ0YXJnZXRzXFxcIjp7XFxcImJyb3dzZXJzXFxcIjpbXFxcIj4gMiVcXFwiXSxcXFwidWdsaWZ5XFxcIjp0cnVlfX1dLFtcXFwiZXMyMDE1XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlfV0sW1xcXCJzdGFnZS0yXFxcIl1dfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL2xvZ2luU2NyZWVuLnZ1ZVwiKSxcbiAgLyogdGVtcGxhdGUgKi9cbiAgcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyL2luZGV4P3tcXFwiaWRcXFwiOlxcXCJkYXRhLXYtNTVlZjE3ZGFcXFwiLFxcXCJoYXNTY29wZWRcXFwiOmZhbHNlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vbG9naW5TY3JlZW4udnVlXCIpLFxuICAvKiBzdHlsZXMgKi9cbiAgaW5qZWN0U3R5bGUsXG4gIC8qIHNjb3BlSWQgKi9cbiAgbnVsbCxcbiAgLyogbW9kdWxlSWRlbnRpZmllciAoc2VydmVyIG9ubHkpICovXG4gIG51bGxcbilcbkNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvbG9naW5TY3JlZW4udnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSBsb2dpblNjcmVlbi52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtNTVlZjE3ZGFcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi01NWVmMTdkYVwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvbG9naW5TY3JlZW4udnVlXG4vLyBtb2R1bGUgaWQgPSAyNzBcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTU1ZWYxN2RhXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2xvZ2luU2NyZWVuLnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiOTkzMDY4NTJcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtNTVlZjE3ZGFcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vbG9naW5TY3JlZW4udnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTU1ZWYxN2RhXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2xvZ2luU2NyZWVuLnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi01NWVmMTdkYVwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvc2NyZWVucy9sb2dpblNjcmVlbi52dWVcbi8vIG1vZHVsZSBpZCA9IDI3MVxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHRydWUpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiXFxuLmxvZ2luLXNjcmVlbiB7XFxuICB0ZXh0LWFsaWduOiBjZW50ZXI7XFxufVxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvc2NyZWVucy9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvc2NyZWVucy9sb2dpblNjcmVlbi52dWVcIixcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9zY3JlZW5zL2xvZ2luU2NyZWVuLnZ1ZVwiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiO0FBeURBO0VBQ0ksbUJBQUE7Q0N4REhcIixcImZpbGVcIjpcImxvZ2luU2NyZWVuLnZ1ZVwiLFwic291cmNlc0NvbnRlbnRcIjpbXCJcXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG4ubG9naW4tc2NyZWVuIHtcXG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xcbiAgICAvLyB3aWR0aDogMzAwcHg7XFxufVxcblxcblwiLFwiLmxvZ2luLXNjcmVlbiB7XFxuICB0ZXh0LWFsaWduOiBjZW50ZXI7XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi01NWVmMTdkYVwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvc2NyZWVucy9sb2dpblNjcmVlbi52dWVcbi8vIG1vZHVsZSBpZCA9IDI3MlxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCI8dGVtcGxhdGU+XG4gICAgPHYtY2FyZCBjbGFzcz1cImxvZ2luLXNjcmVlblwiPlxuICAgICAgICA8di1jYXJkLXRleHQgY2xhc3M9XCJwYS01IHBiLTBcIj5cbiAgICAgICAgICAgIDx2LWxheW91dCBjb2x1bW4+XG4gICAgICAgICAgICAgICAgPGZvcm0gQHN1Ym1pdC5wcmV2ZW50PVwibG9naW5BdHRlbXB0XCI+XG4gICAgICAgICAgICAgICAgPHYtZmxleCB4czEyPlxuICAgICAgICAgICAgICAgICAgICA8di10ZXh0LWZpZWxkIGxhYmVsPVwiRS1NYWlsXCIgcHJlcGVuZC1pY29uPVwiZW1haWxcIiB2LW1vZGVsPVwidXNlci5lbWFpbFwiIHR5cGU9J2VtYWlsJz48L3YtdGV4dC1maWVsZD5cbiAgICAgICAgICAgICAgICA8L3YtZmxleD5cbiAgICAgICAgICAgICAgICA8di1mbGV4IHhzMTI+XG4gICAgICAgICAgICAgICAgICAgIDx2LXRleHQtZmllbGQgbGFiZWw9XCJQYXNzd29yZFwiIDphcHBlbmQtaWNvbj1cImUgPyAndmlzaWJpbGl0eScgOiAndmlzaWJpbGl0eV9vZmYnXCIgOnR5cGU9XCJpc1Bhc3N3b3JkVmlzaWJsZVwiIDphcHBlbmQtaWNvbi1jYj1cIigpID0+IChlID0gIWUpXCIgcHJlcGVuZC1pY29uPVwibG9ja1wiIHYtbW9kZWw9XCJ1c2VyLnBhc3N3b3JkXCI+PC92LXRleHQtZmllbGQ+XG4gICAgICAgICAgICAgICAgPC92LWZsZXg+XG4gICAgICAgICAgICAgICAgPHYtZmxleCB4czEyPlxuICAgICAgICAgICAgICAgICAgICA8di1idG4gdHlwZT1cInN1Ym1pdFwiIHByaW1hcnkgbGFyZ2U+TG9naW48L3YtYnRuPlxuICAgICAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgIDwvdi1sYXlvdXQ+XG4gICAgICAgIDwvdi1jYXJkLXRleHQ+XG4gICAgICAgIDx2LWNhcmQtdGV4dD5cbiAgICAgICAgICAgIERvbid0IGhhdmUgYW4gYWNjb3VudD8gPHJvdXRlci1saW5rIDp0bz1cIntuYW1lOiAnYXV0aC5yZWdpc3Rlcid9XCI+UmVnaXN0ZXI8L3JvdXRlci1saW5rPlxuICAgICAgICA8L3YtY2FyZC10ZXh0PlxuICAgIDwvdi1jYXJkPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmltcG9ydCB1c2VyIGZyb20gJy4vLi4vLi4vLi4vYXBpL3VzZXIuanMnO1xuaW1wb3J0IHMgZnJvbSAnLi8uLi8uLi8uLi9oZWxwZXJzL3NuYWNrYmFyLmpzJztcblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIGRhdGEoKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGU6IGZhbHNlLFxuICAgICAgICAgICAgdXNlcjoge1xuICAgICAgICAgICAgICAgIGVtYWlsOiAnJyxcbiAgICAgICAgICAgICAgICBwYXNzd29yZDogJycsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfSxcbiAgICBjb21wdXRlZDoge1xuICAgICAgICBpc1Bhc3N3b3JkVmlzaWJsZSgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmUgPyAndGV4dCcgOiAncGFzc3dvcmQnO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIGxvZ2luQXR0ZW1wdCgpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2F0dGVtcHRpbmcgbG9naW4nKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMudXNlci5lbWFpbCk7XG5cbiAgICAgICAgICAgIHVzZXIuYXR0ZW1wdCh0aGlzLnVzZXIuZW1haWwsIHRoaXMudXNlci5wYXNzd29yZClcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy4kcm91dGVyLnB1c2goe25hbWU6ICdkYXNoLmhvbWUnfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic3R5bHVzXCI+XG4ubG9naW4tc2NyZWVuIHtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgLy8gd2lkdGg6IDMwMHB4O1xufVxuXG48L3N0eWxlPlxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIGxvZ2luU2NyZWVuLnZ1ZT8xYWNmNTFjNiIsImltcG9ydCBhcGkgZnJvbSAnLi9pbmRleCc7XG5pbXBvcnQgcyBmcm9tICcuLy4uL2hlbHBlcnMvc25hY2tiYXInO1xuaW1wb3J0IGwgZnJvbSAnLi8uLi9oZWxwZXJzL2xvYWRlcic7XG5pbXBvcnQgc3RvcmUgZnJvbSAnLi8uLi9zdG9yZS9zdG9yZSc7XG5pbXBvcnQgdHlwZXMgZnJvbSAnLi8uLi9zdG9yZS90eXBlcyc7XG5cbmNsYXNzIFVzZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubW9kZWwgPSAndXNlcnMnO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICAvLyB0aGlzLmxhc3RfZmV0Y2ggPSBtb21lbnQoKTtcbiAgICB9XG5cbiAgICBhdHRlbXB0KGVtYWlsLCBwYXNzd29yZCkge1xuICAgICAgICBsZXQgZGF0YSA9IHtcbiAgICAgICAgICAgIGVtYWlsLFxuICAgICAgICAgICAgcGFzc3dvcmRcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBsLnN0YXJ0KCk7XG5cbiAgICAgICAgICAgIGFwaS5wb3N0KCdsb2dpbicsIGRhdGEpXG4gICAgICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlcy5zdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMuZmlyZShyZXMubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9yZS5jb21taXQodHlwZXMuYXV0aC5OQU1FICsgJy8nICsgdHlwZXMuYXV0aC5VU0VSX0xPR0lOLCByZXMuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXNlciA9IHJlcy5kYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXMuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzLmZpcmUoZXJyb3IuZGF0YS5tZXNzYWdlLCAnd2FybmluZycpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcy5maXJlKFwic29tZXRoaW5nIHdlbnQgd3JvbmdcIiwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBuZXcgVXNlcigpO1xuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvYXBpL3VzZXIuanMiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ3YtY2FyZCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJsb2dpbi1zY3JlZW5cIlxuICB9LCBbX2MoJ3YtY2FyZC10ZXh0Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcInBhLTUgcGItMFwiXG4gIH0sIFtfYygndi1sYXlvdXQnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwiY29sdW1uXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygnZm9ybScsIHtcbiAgICBvbjoge1xuICAgICAgXCJzdWJtaXRcIjogZnVuY3Rpb24oJGV2ZW50KSB7XG4gICAgICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBfdm0ubG9naW5BdHRlbXB0KCRldmVudClcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtfYygndi1mbGV4Jywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInhzMTJcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LXRleHQtZmllbGQnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwibGFiZWxcIjogXCJFLU1haWxcIixcbiAgICAgIFwicHJlcGVuZC1pY29uXCI6IFwiZW1haWxcIixcbiAgICAgIFwidHlwZVwiOiBcImVtYWlsXCJcbiAgICB9LFxuICAgIG1vZGVsOiB7XG4gICAgICB2YWx1ZTogKF92bS51c2VyLmVtYWlsKSxcbiAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigkJHYpIHtcbiAgICAgICAgX3ZtLnVzZXIuZW1haWwgPSAkJHZcbiAgICAgIH0sXG4gICAgICBleHByZXNzaW9uOiBcInVzZXIuZW1haWxcIlxuICAgIH1cbiAgfSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtZmxleCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ4czEyXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi10ZXh0LWZpZWxkJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImxhYmVsXCI6IFwiUGFzc3dvcmRcIixcbiAgICAgIFwiYXBwZW5kLWljb25cIjogX3ZtLmUgPyAndmlzaWJpbGl0eScgOiAndmlzaWJpbGl0eV9vZmYnLFxuICAgICAgXCJ0eXBlXCI6IF92bS5pc1Bhc3N3b3JkVmlzaWJsZSxcbiAgICAgIFwiYXBwZW5kLWljb24tY2JcIjogZnVuY3Rpb24gKCkgeyByZXR1cm4gKF92bS5lID0gIV92bS5lKTsgfSxcbiAgICAgIFwicHJlcGVuZC1pY29uXCI6IFwibG9ja1wiXG4gICAgfSxcbiAgICBtb2RlbDoge1xuICAgICAgdmFsdWU6IChfdm0udXNlci5wYXNzd29yZCksXG4gICAgICBjYWxsYmFjazogZnVuY3Rpb24oJCR2KSB7XG4gICAgICAgIF92bS51c2VyLnBhc3N3b3JkID0gJCR2XG4gICAgICB9LFxuICAgICAgZXhwcmVzc2lvbjogXCJ1c2VyLnBhc3N3b3JkXCJcbiAgICB9XG4gIH0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWZsZXgnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwieHMxMlwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtYnRuJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInR5cGVcIjogXCJzdWJtaXRcIixcbiAgICAgIFwicHJpbWFyeVwiOiBcIlwiLFxuICAgICAgXCJsYXJnZVwiOiBcIlwiXG4gICAgfVxuICB9LCBbX3ZtLl92KFwiTG9naW5cIildKV0sIDEpXSwgMSldKV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1jYXJkLXRleHQnLCBbX3ZtLl92KFwiXFxuICAgICAgICBEb24ndCBoYXZlIGFuIGFjY291bnQ/IFwiKSwgX2MoJ3JvdXRlci1saW5rJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInRvXCI6IHtcbiAgICAgICAgbmFtZTogJ2F1dGgucmVnaXN0ZXInXG4gICAgICB9XG4gICAgfVxuICB9LCBbX3ZtLl92KFwiUmVnaXN0ZXJcIildKV0sIDEpXSwgMSlcbn0sc3RhdGljUmVuZGVyRm5zOiBbXX1cbm1vZHVsZS5leHBvcnRzLnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgIHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIikucmVyZW5kZXIoXCJkYXRhLXYtNTVlZjE3ZGFcIiwgbW9kdWxlLmV4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LTU1ZWYxN2RhXCIsXCJoYXNTY29wZWRcIjpmYWxzZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvbG9naW5TY3JlZW4udnVlXG4vLyBtb2R1bGUgaWQgPSAyNzVcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbmZ1bmN0aW9uIGluamVjdFN0eWxlIChzc3JDb250ZXh0KSB7XG4gIGlmIChkaXNwb3NlZCkgcmV0dXJuXG4gIHJlcXVpcmUoXCIhIXZ1ZS1zdHlsZS1sb2FkZXIhY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0xOGVjYmY4MVxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hc3R5bHVzLWxvYWRlciEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3JlZ2lzdGVyU2NyZWVuLnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi9yZWdpc3RlclNjcmVlbi52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LTE4ZWNiZjgxXFxcIixcXFwiaGFzU2NvcGVkXFxcIjpmYWxzZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3JlZ2lzdGVyU2NyZWVuLnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIG51bGwsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9zY3JlZW5zL3JlZ2lzdGVyU2NyZWVuLnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gcmVnaXN0ZXJTY3JlZW4udnVlOiBmdW5jdGlvbmFsIGNvbXBvbmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0ZW1wbGF0ZXMsIHRoZXkgc2hvdWxkIHVzZSByZW5kZXIgZnVuY3Rpb25zLlwiKX1cblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LTE4ZWNiZjgxXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtMThlY2JmODFcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9zY3JlZW5zL3JlZ2lzdGVyU2NyZWVuLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjc2XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0xOGVjYmY4MVxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZWdpc3RlclNjcmVlbi52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcIjU5ZWNhYmJiXCIsIGNvbnRlbnQsIGZhbHNlKTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTE4ZWNiZjgxXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3JlZ2lzdGVyU2NyZWVuLnZ1ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgdmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0xOGVjYmY4MVxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZWdpc3RlclNjcmVlbi52dWVcIik7XG4gICAgIGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuICAgICB1cGRhdGUobmV3Q29udGVudCk7XG4gICB9KTtcbiB9XG4gLy8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIhLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtMThlY2JmODFcIixcInNjb3BlZFwiOmZhbHNlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvcmVnaXN0ZXJTY3JlZW4udnVlXG4vLyBtb2R1bGUgaWQgPSAyNzdcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSh0cnVlKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIlxcbi5yZWdpc3Rlci1zY3JlZW4ge1xcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xcbn1cXG5cIiwgXCJcIiwge1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvcmVnaXN0ZXJTY3JlZW4udnVlXCIsXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvc2NyZWVucy9yZWdpc3RlclNjcmVlbi52dWVcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIjtBQTBEQTtFQUNJLG1CQUFBO0NDekRIXCIsXCJmaWxlXCI6XCJyZWdpc3RlclNjcmVlbi52dWVcIixcInNvdXJjZXNDb250ZW50XCI6W1wiXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuLnJlZ2lzdGVyLXNjcmVlbiB7XFxuICAgIHRleHQtYWxpZ246IGNlbnRlclxcbiAgICAvLyB3aWR0aDogMzBlbVxcbn1cXG5cIixcIi5yZWdpc3Rlci1zY3JlZW4ge1xcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xcbn1cXG5cIl0sXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtMThlY2JmODFcIixcInNjb3BlZFwiOmZhbHNlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvcmVnaXN0ZXJTY3JlZW4udnVlXG4vLyBtb2R1bGUgaWQgPSAyNzhcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiPHRlbXBsYXRlPlxuICAgIDx2LWNhcmQgY2xhc3M9XCJyZWdpc3Rlci1zY3JlZW5cIj5cbiAgICAgICAgPHYtY2FyZC10ZXh0IGNsYXNzPVwicGEtNVwiPlxuICAgICAgICAgICAgPHYtbGF5b3V0IHJvdyB3cmFwPlxuICAgICAgICAgICAgICAgIDx2LWZsZXggeHMxMj5cbiAgICAgICAgICAgICAgICAgICAgPHYtdGV4dC1maWVsZCB2LW1vZGVsPVwidXNlci5uYW1lXCIgbGFiZWw9XCJGdWxsIE5hbWVcIiBwcmVwZW5kLWljb249XCJwZXJzb25cIiByZXF1aXJlZD48L3YtdGV4dC1maWVsZD5cbiAgICAgICAgICAgICAgICA8L3YtZmxleD5cbiAgICAgICAgICAgICAgICA8di1mbGV4IHhzMTI+XG4gICAgICAgICAgICAgICAgICAgIDx2LXRleHQtZmllbGQgbGFiZWw9XCJTaG9ydCBEZXNjcmlwdGlvblwiIHByZXBlbmQtaWNvbj1cInNwZWFrZXJfbm90ZXNcIiBtdWx0aS1saW5lIHJvd3M9JzInIG1heD1cIjkwXCIgY291bnRlciB2LW1vZGVsPVwidXNlci50aXRsZVwiIHJlcXVpcmVkPjwvdi10ZXh0LWZpZWxkPlxuICAgICAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICAgICAgICAgIDx2LWZsZXggeHMxMj5cbiAgICAgICAgICAgICAgICAgICAgPHYtdGV4dC1maWVsZCBsYWJlbD1cIkUtTWFpbFwiIHByZXBlbmQtaWNvbj1cImVtYWlsXCIgdi1tb2RlbD1cInVzZXIuZW1haWxcIiByZXF1aXJlZCB0eXBlPSdlbWFpbCc+PC92LXRleHQtZmllbGQ+XG4gICAgICAgICAgICAgICAgPC92LWZsZXg+XG4gICAgICAgICAgICAgICAgPHYtZmxleCB4czEyPlxuICAgICAgICAgICAgICAgICAgICA8di10ZXh0LWZpZWxkIGxhYmVsPVwiUGFzc3dvcmRcIiBoaW50PVwiQXQgbGVhc3QgNSBjaGFyYWN0ZXJzXCIgOm1pbj1cIjVcIiA6YXBwZW5kLWljb249XCJlID8gJ3Zpc2liaWxpdHknIDogJ3Zpc2liaWxpdHlfb2ZmJ1wiIDp0eXBlPVwiaXNQYXNzd29yZFZpc2libGVcIiA6YXBwZW5kLWljb24tY2I9XCIoKSA9PiAoZSA9ICFlKVwiIHByZXBlbmQtaWNvbj1cImxvY2tcIiB2LW1vZGVsPVwidXNlci5wYXNzd29yZFwiIHJlcXVpcmVkPjwvdi10ZXh0LWZpZWxkPlxuICAgICAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICAgICAgICAgIDx2LWZsZXggeHMxMj5cbiAgICAgICAgICAgICAgICAgICAgPHYtYnRuIHByaW1hcnkgbGFyZ2U+UmVnaXN0ZXI8L3YtYnRuPlxuICAgICAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICAgICAgPC92LWxheW91dD5cbiAgICAgICAgPC92LWNhcmQtdGV4dD5cbiAgICAgICAgPHYtY2FyZC10ZXh0PlxuICAgICAgICAgICAgQWxyZWFkeSBoYXZlIGFuIGFjY291bnQ/IDxyb3V0ZXItbGluayA6dG89XCJ7bmFtZTogJ2F1dGgubG9naW4nfVwiPkxvZ2luPC9yb3V0ZXItbGluaz5cbiAgICAgICAgPC92LWNhcmQtdGV4dD5cbiAgICA8L3YtY2FyZD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5leHBvcnQgZGVmYXVsdCB7XG4gICAgZGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGU6IGZhbHNlLFxuICAgICAgICAgICAgdXNlcjoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnJyxcbiAgICAgICAgICAgICAgICBlbWFpbDogJycsXG4gICAgICAgICAgICAgICAgaW1hZ2U6IG51bGwsXG4gICAgICAgICAgICAgICAgcGFzc3dvcmQ6ICcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJ1bGVzOiB7XG4gICAgICAgICAgICAgICAgcmVxdWlyZWQ6ICh2YWx1ZSkgPT4gISF2YWx1ZSB8fCAnUmVxdWlyZWQuJyxcbiAgICAgICAgICAgICAgICBlbWFpbDogKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhdHRlcm4gPSAvXigoW148PigpXFxbXFxdXFxcXC4sOzpcXHNAXCJdKyhcXC5bXjw+KClcXFtcXF1cXFxcLiw7Olxcc0BcIl0rKSopfChcIi4rXCIpKUAoKFxcW1swLTldezEsM31cXC5bMC05XXsxLDN9XFwuWzAtOV17MSwzfVxcLlswLTldezEsM31dKXwoKFthLXpBLVpcXC0wLTldK1xcLikrW2EtekEtWl17Mix9KSkkL1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0dGVybi50ZXN0KHZhbHVlKSB8fCAnSW52YWxpZCBlLW1haWwuJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgaXNQYXNzd29yZFZpc2libGUoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lID8gJ3RleHQnIDogJ3Bhc3N3b3JkJztcbiAgICAgICAgfVxuICAgIH1cblxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic3R5bHVzXCI+XG4ucmVnaXN0ZXItc2NyZWVuIHtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXJcbiAgICAvLyB3aWR0aDogMzBlbVxufVxuPC9zdHlsZT5cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyByZWdpc3RlclNjcmVlbi52dWU/ZDZjZTdkNGEiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ3YtY2FyZCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJyZWdpc3Rlci1zY3JlZW5cIlxuICB9LCBbX2MoJ3YtY2FyZC10ZXh0Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcInBhLTVcIlxuICB9LCBbX2MoJ3YtbGF5b3V0Jywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInJvd1wiOiBcIlwiLFxuICAgICAgXCJ3cmFwXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi1mbGV4Jywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInhzMTJcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LXRleHQtZmllbGQnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwibGFiZWxcIjogXCJGdWxsIE5hbWVcIixcbiAgICAgIFwicHJlcGVuZC1pY29uXCI6IFwicGVyc29uXCIsXG4gICAgICBcInJlcXVpcmVkXCI6IFwiXCJcbiAgICB9LFxuICAgIG1vZGVsOiB7XG4gICAgICB2YWx1ZTogKF92bS51c2VyLm5hbWUpLFxuICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCQkdikge1xuICAgICAgICBfdm0udXNlci5uYW1lID0gJCR2XG4gICAgICB9LFxuICAgICAgZXhwcmVzc2lvbjogXCJ1c2VyLm5hbWVcIlxuICAgIH1cbiAgfSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtZmxleCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ4czEyXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi10ZXh0LWZpZWxkJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImxhYmVsXCI6IFwiU2hvcnQgRGVzY3JpcHRpb25cIixcbiAgICAgIFwicHJlcGVuZC1pY29uXCI6IFwic3BlYWtlcl9ub3Rlc1wiLFxuICAgICAgXCJtdWx0aS1saW5lXCI6IFwiXCIsXG4gICAgICBcInJvd3NcIjogXCIyXCIsXG4gICAgICBcIm1heFwiOiBcIjkwXCIsXG4gICAgICBcImNvdW50ZXJcIjogXCJcIixcbiAgICAgIFwicmVxdWlyZWRcIjogXCJcIlxuICAgIH0sXG4gICAgbW9kZWw6IHtcbiAgICAgIHZhbHVlOiAoX3ZtLnVzZXIudGl0bGUpLFxuICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCQkdikge1xuICAgICAgICBfdm0udXNlci50aXRsZSA9ICQkdlxuICAgICAgfSxcbiAgICAgIGV4cHJlc3Npb246IFwidXNlci50aXRsZVwiXG4gICAgfVxuICB9KV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1mbGV4Jywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInhzMTJcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LXRleHQtZmllbGQnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwibGFiZWxcIjogXCJFLU1haWxcIixcbiAgICAgIFwicHJlcGVuZC1pY29uXCI6IFwiZW1haWxcIixcbiAgICAgIFwicmVxdWlyZWRcIjogXCJcIixcbiAgICAgIFwidHlwZVwiOiBcImVtYWlsXCJcbiAgICB9LFxuICAgIG1vZGVsOiB7XG4gICAgICB2YWx1ZTogKF92bS51c2VyLmVtYWlsKSxcbiAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigkJHYpIHtcbiAgICAgICAgX3ZtLnVzZXIuZW1haWwgPSAkJHZcbiAgICAgIH0sXG4gICAgICBleHByZXNzaW9uOiBcInVzZXIuZW1haWxcIlxuICAgIH1cbiAgfSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtZmxleCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ4czEyXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi10ZXh0LWZpZWxkJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImxhYmVsXCI6IFwiUGFzc3dvcmRcIixcbiAgICAgIFwiaGludFwiOiBcIkF0IGxlYXN0IDUgY2hhcmFjdGVyc1wiLFxuICAgICAgXCJtaW5cIjogNSxcbiAgICAgIFwiYXBwZW5kLWljb25cIjogX3ZtLmUgPyAndmlzaWJpbGl0eScgOiAndmlzaWJpbGl0eV9vZmYnLFxuICAgICAgXCJ0eXBlXCI6IF92bS5pc1Bhc3N3b3JkVmlzaWJsZSxcbiAgICAgIFwiYXBwZW5kLWljb24tY2JcIjogZnVuY3Rpb24gKCkgeyByZXR1cm4gKF92bS5lID0gIV92bS5lKTsgfSxcbiAgICAgIFwicHJlcGVuZC1pY29uXCI6IFwibG9ja1wiLFxuICAgICAgXCJyZXF1aXJlZFwiOiBcIlwiXG4gICAgfSxcbiAgICBtb2RlbDoge1xuICAgICAgdmFsdWU6IChfdm0udXNlci5wYXNzd29yZCksXG4gICAgICBjYWxsYmFjazogZnVuY3Rpb24oJCR2KSB7XG4gICAgICAgIF92bS51c2VyLnBhc3N3b3JkID0gJCR2XG4gICAgICB9LFxuICAgICAgZXhwcmVzc2lvbjogXCJ1c2VyLnBhc3N3b3JkXCJcbiAgICB9XG4gIH0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWZsZXgnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwieHMxMlwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtYnRuJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInByaW1hcnlcIjogXCJcIixcbiAgICAgIFwibGFyZ2VcIjogXCJcIlxuICAgIH1cbiAgfSwgW192bS5fdihcIlJlZ2lzdGVyXCIpXSldLCAxKV0sIDEpXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWNhcmQtdGV4dCcsIFtfdm0uX3YoXCJcXG4gICAgICAgIEFscmVhZHkgaGF2ZSBhbiBhY2NvdW50PyBcIiksIF9jKCdyb3V0ZXItbGluaycsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ0b1wiOiB7XG4gICAgICAgIG5hbWU6ICdhdXRoLmxvZ2luJ1xuICAgICAgfVxuICAgIH1cbiAgfSwgW192bS5fdihcIkxvZ2luXCIpXSldLCAxKV0sIDEpXG59LHN0YXRpY1JlbmRlckZuczogW119XG5tb2R1bGUuZXhwb3J0cy5yZW5kZXIuX3dpdGhTdHJpcHBlZCA9IHRydWVcbmlmIChtb2R1bGUuaG90KSB7XG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKG1vZHVsZS5ob3QuZGF0YSkge1xuICAgICByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpLnJlcmVuZGVyKFwiZGF0YS12LTE4ZWNiZjgxXCIsIG1vZHVsZS5leHBvcnRzKVxuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXI/e1wiaWRcIjpcImRhdGEtdi0xOGVjYmY4MVwiLFwiaGFzU2NvcGVkXCI6ZmFsc2V9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9zY3JlZW5zL3JlZ2lzdGVyU2NyZWVuLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjgwXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8vIHJlbW92ZWQgYnkgZXh0cmFjdC10ZXh0LXdlYnBhY2stcGx1Z2luXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL3N0eWx1cy9lbnRyeS5zdHlsXG4vLyBtb2R1bGUgaWQgPSAyODFcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gcmVtb3ZlZCBieSBleHRyYWN0LXRleHQtd2VicGFjay1wbHVnaW5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9tZGkvc2Nzcy9tYXRlcmlhbGRlc2lnbmljb25zLnNjc3Ncbi8vIG1vZHVsZSBpZCA9IDI4MlxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvLyByZW1vdmVkIGJ5IGV4dHJhY3QtdGV4dC13ZWJwYWNrLXBsdWdpblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9zYXNzL2FwcC5zY3NzXG4vLyBtb2R1bGUgaWQgPSAyODNcbi8vIG1vZHVsZSBjaHVua3MgPSAxIl0sInNvdXJjZVJvb3QiOiIifQ==