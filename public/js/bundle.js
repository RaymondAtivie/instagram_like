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
  __webpack_require__(295)
}
var Component = __webpack_require__(1)(
  /* script */
  __webpack_require__(279),
  /* template */
  __webpack_require__(297),
  /* styles */
  injectStyle,
  /* scopeId */
  "data-v-18ecbf81",
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
/* 277 */,
/* 278 */,
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
/* 280 */,
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

/***/ }),
/* 284 */,
/* 285 */,
/* 286 */,
/* 287 */,
/* 288 */,
/* 289 */,
/* 290 */,
/* 291 */,
/* 292 */,
/* 293 */,
/* 294 */,
/* 295 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(296);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(3)("4a85849c", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-18ecbf81\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./registerScreen.vue", function() {
     var newContent = require("!!../../../../../../node_modules/css-loader/index.js?sourceMap!../../../../../../node_modules/vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-18ecbf81\",\"scoped\":true,\"hasInlineConfig\":true}!../../../../../../node_modules/stylus-loader/index.js!../../../../../../node_modules/vue-loader/lib/selector.js?type=styles&index=0!./registerScreen.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 296 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(2)(true);
// imports


// module
exports.push([module.i, "\n.register-screen[data-v-18ecbf81] {\n  text-align: center;\n}\n", "", {"version":3,"sources":["/Applications/vue/kelly/resources/assets/js/pages/auth/screens/resources/assets/js/pages/auth/screens/registerScreen.vue","/Applications/vue/kelly/resources/assets/js/pages/auth/screens/registerScreen.vue"],"names":[],"mappings":";AA6DA;EACI,mBAAA;CC5DH","file":"registerScreen.vue","sourcesContent":["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n.register-screen {\n    text-align: center\n    // width: 30em\n}\n",".register-screen {\n  text-align: center;\n}\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 297 */
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
  }, [_c('img', {
    attrs: {
      "src": ""
    }
  })]), _vm._v(" "), _c('v-flex', {
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

/***/ })
],[144]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXIuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXNDbGllbnQuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9zdG9yZS90eXBlcy5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL3N0b3JlLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvaGVscGVycy9zbmFja2Jhci5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2hlbHBlcnMvbG9hZGVyLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvc3RvcmUvbW9kdWxlcy9hdXRoL2F1dGhUeXBlcy5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL21vZHVsZXMvc25hY2tiYXIvc25hY2tiYXJUeXBlcy5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL21vZHVsZXMvcG9zdC9wb3N0VHlwZXMuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9BcHAudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvYXBpL3Bvc3RzLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvYXBpL2luZGV4LmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvYXBwLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvYm9vdHN0cmFwLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvc3RvcmUvbW9kdWxlcy9hdXRoL2F1dGhTdG9yZS5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL21vZHVsZXMvc25hY2tiYXIvc25hY2tiYXJTdG9yZS5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL21vZHVsZXMvcG9zdC9wb3N0U3RvcmUuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9yb3V0ZXIvcm91dGVyLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcm91dGVyL3JvdXRlcy5qcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL0FwcC52dWU/MDFjMCIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL0FwcC52dWU/NjY5ZiIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvbGlzdFRvU3R5bGVzLmpzIiwid2VicGFjazovLy9BcHAudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy90b3BMb2FkZXIudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy90b3BMb2FkZXIudnVlPzExZDkiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL3RvcExvYWRlci52dWU/OTQ3MyIsIndlYnBhY2s6Ly8vdG9wTG9hZGVyLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvdG9wTG9hZGVyLnZ1ZT80MWJhIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy9mdWxsTG9hZGVyLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvZnVsbExvYWRlci52dWU/OGUwYiIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvZnVsbExvYWRlci52dWU/ZmViNCIsIndlYnBhY2s6Ly8vZnVsbExvYWRlci52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL2Z1bGxMb2FkZXIudnVlPzQ5NzYiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL3NuYWNrYmFyLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvc25hY2tiYXIudnVlP2MwODEiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL3NuYWNrYmFyLnZ1ZT8wNTYzIiwid2VicGFjazovLy9zbmFja2Jhci52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL3NuYWNrYmFyLnZ1ZT8xMzY0Iiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvQXBwLnZ1ZT9hMjVkIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvaW5kZXhQYWdlLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2luZGV4UGFnZS52dWU/MzkxZCIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2luZGV4UGFnZS52dWU/MjcyYSIsIndlYnBhY2s6Ly8vaW5kZXhQYWdlLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2luZGV4UGFnZS52dWU/NDc1OCIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvYXV0aFBhZ2UudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9hdXRoUGFnZS52dWU/ZGE1ZiIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvYXV0aFBhZ2UudnVlP2MxODUiLCJ3ZWJwYWNrOi8vL2F1dGhQYWdlLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvYXV0aFBhZ2UudnVlP2E5NzgiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZGFzaGJvYXJkUGFnZS52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZGFzaGJvYXJkUGFnZS52dWU/NWUzYyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9kYXNoYm9hcmRQYWdlLnZ1ZT9jODNiIiwid2VicGFjazovLy9kYXNoYm9hcmRQYWdlLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvc2lkZWJhci52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9sYXlvdXRzL3NpZGViYXIudnVlP2VjNmMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9sYXlvdXRzL3NpZGViYXIudnVlPzRkNDQiLCJ3ZWJwYWNrOi8vL3NpZGViYXIudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy9zaWRlYmFyLnZ1ZT81NzRmIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy90b3BuYXYudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy90b3BuYXYudnVlP2JlNDAiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9sYXlvdXRzL3RvcG5hdi52dWU/YjdhZiIsIndlYnBhY2s6Ly8vdG9wbmF2LnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvdG9wbmF2LnZ1ZT9mNGRkIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy9mb290ZXIudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy9mb290ZXIudnVlPzg4NjkiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9sYXlvdXRzL2Zvb3Rlci52dWU/YjViNiIsIndlYnBhY2s6Ly8vZm9vdGVyLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvZm9vdGVyLnZ1ZT9hZGM2Iiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL2Rhc2hib2FyZFBhZ2UudnVlP2EzMTIiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9yb3V0ZXIvZGFzaGJvYXJkUm91dGVzLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvaG9tZVNjcmVlbi52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9ob21lU2NyZWVuLnZ1ZT82NGNlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvaG9tZVNjcmVlbi52dWU/OTM3MSIsIndlYnBhY2s6Ly8vaG9tZVNjcmVlbi52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9ob21lU2NyZWVuLnZ1ZT8wZTFkIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvcG9zdHNTY3JlZW4udnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvcG9zdHNTY3JlZW4udnVlPzU5ZjgiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9wb3N0c1NjcmVlbi52dWU/OTc0MiIsIndlYnBhY2s6Ly8vcG9zdHNTY3JlZW4udnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdExpc3QudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdExpc3QudnVlP2ZlYWQiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9Qb3N0TGlzdC52dWU/ZDQ2YyIsIndlYnBhY2s6Ly8vUG9zdExpc3QudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdC52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9Qb3N0LnZ1ZT9lMTIzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdC52dWU/OTUxMiIsIndlYnBhY2s6Ly8vUG9zdC52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC91c2Vycy9Vc2VyU21hbGxQcm9maWxlLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3VzZXJzL1VzZXJTbWFsbFByb2ZpbGUudnVlPzEwNjIiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC91c2Vycy9Vc2VyU21hbGxQcm9maWxlLnZ1ZT9mNzAxIiwid2VicGFjazovLy9Vc2VyU21hbGxQcm9maWxlLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3VzZXJzL1VzZXJTbWFsbFByb2ZpbGUudnVlPzNmYzYiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9Db21tZW50TGlzdC52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9Db21tZW50TGlzdC52dWU/YTZiOSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL2NvbW1lbnRzL0NvbW1lbnRMaXN0LnZ1ZT8xZDA0Iiwid2VicGFjazovLy9Db21tZW50TGlzdC52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9Db21tZW50LnZ1ZSIsIndlYnBhY2s6Ly8vQ29tbWVudC52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9Db21tZW50LnZ1ZT85MzY1Iiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvY29tbWVudHMvQWRkQ29tbWVudC52dWUiLCJ3ZWJwYWNrOi8vL0FkZENvbW1lbnQudnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvY29tbWVudHMvQWRkQ29tbWVudC52dWU/ZGJkZCIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL2NvbW1lbnRzL0NvbW1lbnRMaXN0LnZ1ZT9hYjU3Iiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdC52dWU/YzgwNCIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL1Bvc3RMaXN0LnZ1ZT9lOGIzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvQWRkUG9zdC52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9BZGRQb3N0LnZ1ZT8wODZlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvQWRkUG9zdC52dWU/NDY3ZSIsIndlYnBhY2s6Ly8vQWRkUG9zdC52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9BZGRQb3N0LnZ1ZT84YjIxIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvcG9zdHNTY3JlZW4udnVlP2UxYWQiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9tZXNzYWdlc1NjcmVlbi52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9tZXNzYWdlc1NjcmVlbi52dWU/NTk3YiIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL21lc3NhZ2VzU2NyZWVuLnZ1ZT8xMjg3Iiwid2VicGFjazovLy9tZXNzYWdlc1NjcmVlbi52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9tZXNzYWdlc1NjcmVlbi52dWU/MWQwNCIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3JvdXRlci9hdXRoUm91dGVzLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9zY3JlZW5zL2xvZ2luU2NyZWVuLnZ1ZSIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvc2NyZWVucy9sb2dpblNjcmVlbi52dWU/NzcyYyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvc2NyZWVucy9sb2dpblNjcmVlbi52dWU/NjU3NyIsIndlYnBhY2s6Ly8vbG9naW5TY3JlZW4udnVlIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvanMvYXBpL3VzZXIuanMiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvbG9naW5TY3JlZW4udnVlP2JiYjEiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvcmVnaXN0ZXJTY3JlZW4udnVlIiwid2VicGFjazovLy9yZWdpc3RlclNjcmVlbi52dWUiLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL2Fzc2V0cy9zdHlsdXMvZW50cnkuc3R5bCIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvbWRpL3Njc3MvbWF0ZXJpYWxkZXNpZ25pY29ucy5zY3NzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9hc3NldHMvc2Fzcy9hcHAuc2NzcyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvc2NyZWVucy9yZWdpc3RlclNjcmVlbi52dWU/ZTM1MyIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvc2NyZWVucy9yZWdpc3RlclNjcmVlbi52dWU/MGMzMCIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvc2NyZWVucy9yZWdpc3RlclNjcmVlbi52dWU/MjUxYiJdLCJuYW1lcyI6WyJ0IiwiU1RBUlRfTE9BRElORyIsIlNUT1BfTE9BRElORyIsIklTX0xPQURJTkciLCJJU19GVUxMX0xPQURJTkciLCJhdXRoIiwic25hY2tiYXIiLCJwb3N0IiwiVnVlIiwidXNlIiwiVnVleCIsIlN0b3JlIiwibW9kdWxlcyIsIk5BTUUiLCJuYW1lc3BhY2VkIiwic3RhdGUiLCJpc0xvYWRpbmciLCJpc0Z1bGxMb2FkaW5nIiwibXV0YXRpb25zIiwidHlwZXMiLCJwYXlsb2FkIiwiZ2V0dGVycyIsIlNuYWNrYmFyIiwiY29uZmlnIiwibWVzc2FnZSIsInRpbWUiLCJsYWJlbCIsInBvc2l0aW9uIiwiY2xvc2UiLCJjYWxsYmFjayIsImNhbGxiYWNrX2xhYmVsIiwidGV4dCIsImluY2x1ZGVzIiwieSIsIngiLCJfc2V0dXAiLCJzaG93Iiwic3RvcmUiLCJjb21taXQiLCJzdG9yZVR5cGVzIiwiQ0xFQVJfU05BQ0tCQVIiLCJzZXRUaW1lb3V0IiwiTE9BRF9TTkFDS0JBUiIsIkxvYWRlciIsImZ1bGwiLCJVU0VSX0xPR0lOIiwiVVNFUl9MT0dPVVQiLCJHRVRfVVNFUiIsIklTX0xPR0dFRF9JTiIsIkdFVF9NRVNTQUdFIiwiR0VUX01FU1NBR0VfVklTSUJJTElUWSIsIkFERF9ORVdfUE9TVCIsIlJFUExBQ0VfUE9TVFMiLCJHRVRfUE9TVFMiLCJQb3N0IiwibW9kZWwiLCJwb3N0cyIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwibCIsInN0YXJ0IiwiYXBpIiwiZ2V0IiwidGhlbiIsImNvbnNvbGUiLCJsb2ciLCJkYXRhIiwic3RvcCIsImNhdGNoIiwicyIsImZpcmUiLCJlcnJvciIsInNlbmRQIiwidXNlcl9pZCIsInJlcG9ydCIsIm1lZGlhIiwibGluayIsIm5ld1Bvc3QiLCJBcGkiLCJ1cmwiLCJheGlvcyIsInJlc3BvbnNlIiwicmVxdWVzdCIsInJlcXVpcmUiLCJhcHAiLCJlbCIsInJlbmRlciIsImgiLCJyb3V0ZXIiLCJ3aW5kb3ciLCJfIiwibW9tZW50IiwiZGVmYXVsdHMiLCJoZWFkZXJzIiwiY29tbW9uIiwiYmFzZVVSTCIsInRva2VuIiwiZG9jdW1lbnQiLCJoZWFkIiwicXVlcnlTZWxlY3RvciIsImNvbnRlbnQiLCJ1c2VyIiwiaXNMb2dnZWRJbiIsImFjdGlvbnMiLCJoYXNPd25Qcm9wZXJ0eSIsInVuc2hpZnQiLCJtb2RlIiwicm91dGVzIiwiYmVmb3JlRWFjaCIsInRvIiwiZnJvbSIsIm5leHQiLCJwYXRoIiwibmFtZSIsImNvbXBvbmVudCIsIk1haW4iLCJjaGlsZHJlbiIsImJlZm9yZUVudGVyIiwibG9hZGVyIiwiSG9tZSIsInAiLCJnZXRBbGwiLCJNZXNzYWdlcyIsImNvbmZpcm1BdXRoIiwiVXNlciIsImVtYWlsIiwicGFzc3dvcmQiLCJyZXMiLCJzdGF0dXMiXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQyxnQkFBZ0I7QUFDbkQsSUFBSTtBQUNKO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQixpQkFBaUI7QUFD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Q1A7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUNBQXFDLHlCQUF5QixFQUFFO0FBQ2hFO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQyIsImZpbGUiOiIvanMvYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBfX1ZVRV9TU1JfQ09OVEVYVF9fICovXG5cbi8vIHRoaXMgbW9kdWxlIGlzIGEgcnVudGltZSB1dGlsaXR5IGZvciBjbGVhbmVyIGNvbXBvbmVudCBtb2R1bGUgb3V0cHV0IGFuZCB3aWxsXG4vLyBiZSBpbmNsdWRlZCBpbiB0aGUgZmluYWwgd2VicGFjayB1c2VyIGJ1bmRsZVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG5vcm1hbGl6ZUNvbXBvbmVudCAoXG4gIHJhd1NjcmlwdEV4cG9ydHMsXG4gIGNvbXBpbGVkVGVtcGxhdGUsXG4gIGluamVjdFN0eWxlcyxcbiAgc2NvcGVJZCxcbiAgbW9kdWxlSWRlbnRpZmllciAvKiBzZXJ2ZXIgb25seSAqL1xuKSB7XG4gIHZhciBlc01vZHVsZVxuICB2YXIgc2NyaXB0RXhwb3J0cyA9IHJhd1NjcmlwdEV4cG9ydHMgPSByYXdTY3JpcHRFeHBvcnRzIHx8IHt9XG5cbiAgLy8gRVM2IG1vZHVsZXMgaW50ZXJvcFxuICB2YXIgdHlwZSA9IHR5cGVvZiByYXdTY3JpcHRFeHBvcnRzLmRlZmF1bHRcbiAgaWYgKHR5cGUgPT09ICdvYmplY3QnIHx8IHR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICBlc01vZHVsZSA9IHJhd1NjcmlwdEV4cG9ydHNcbiAgICBzY3JpcHRFeHBvcnRzID0gcmF3U2NyaXB0RXhwb3J0cy5kZWZhdWx0XG4gIH1cblxuICAvLyBWdWUuZXh0ZW5kIGNvbnN0cnVjdG9yIGV4cG9ydCBpbnRlcm9wXG4gIHZhciBvcHRpb25zID0gdHlwZW9mIHNjcmlwdEV4cG9ydHMgPT09ICdmdW5jdGlvbidcbiAgICA/IHNjcmlwdEV4cG9ydHMub3B0aW9uc1xuICAgIDogc2NyaXB0RXhwb3J0c1xuXG4gIC8vIHJlbmRlciBmdW5jdGlvbnNcbiAgaWYgKGNvbXBpbGVkVGVtcGxhdGUpIHtcbiAgICBvcHRpb25zLnJlbmRlciA9IGNvbXBpbGVkVGVtcGxhdGUucmVuZGVyXG4gICAgb3B0aW9ucy5zdGF0aWNSZW5kZXJGbnMgPSBjb21waWxlZFRlbXBsYXRlLnN0YXRpY1JlbmRlckZuc1xuICB9XG5cbiAgLy8gc2NvcGVkSWRcbiAgaWYgKHNjb3BlSWQpIHtcbiAgICBvcHRpb25zLl9zY29wZUlkID0gc2NvcGVJZFxuICB9XG5cbiAgdmFyIGhvb2tcbiAgaWYgKG1vZHVsZUlkZW50aWZpZXIpIHsgLy8gc2VydmVyIGJ1aWxkXG4gICAgaG9vayA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgICAvLyAyLjMgaW5qZWN0aW9uXG4gICAgICBjb250ZXh0ID1cbiAgICAgICAgY29udGV4dCB8fCAvLyBjYWNoZWQgY2FsbFxuICAgICAgICAodGhpcy4kdm5vZGUgJiYgdGhpcy4kdm5vZGUuc3NyQ29udGV4dCkgfHwgLy8gc3RhdGVmdWxcbiAgICAgICAgKHRoaXMucGFyZW50ICYmIHRoaXMucGFyZW50LiR2bm9kZSAmJiB0aGlzLnBhcmVudC4kdm5vZGUuc3NyQ29udGV4dCkgLy8gZnVuY3Rpb25hbFxuICAgICAgLy8gMi4yIHdpdGggcnVuSW5OZXdDb250ZXh0OiB0cnVlXG4gICAgICBpZiAoIWNvbnRleHQgJiYgdHlwZW9mIF9fVlVFX1NTUl9DT05URVhUX18gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGNvbnRleHQgPSBfX1ZVRV9TU1JfQ09OVEVYVF9fXG4gICAgICB9XG4gICAgICAvLyBpbmplY3QgY29tcG9uZW50IHN0eWxlc1xuICAgICAgaWYgKGluamVjdFN0eWxlcykge1xuICAgICAgICBpbmplY3RTdHlsZXMuY2FsbCh0aGlzLCBjb250ZXh0KVxuICAgICAgfVxuICAgICAgLy8gcmVnaXN0ZXIgY29tcG9uZW50IG1vZHVsZSBpZGVudGlmaWVyIGZvciBhc3luYyBjaHVuayBpbmZlcnJlbmNlXG4gICAgICBpZiAoY29udGV4dCAmJiBjb250ZXh0Ll9yZWdpc3RlcmVkQ29tcG9uZW50cykge1xuICAgICAgICBjb250ZXh0Ll9yZWdpc3RlcmVkQ29tcG9uZW50cy5hZGQobW9kdWxlSWRlbnRpZmllcilcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gdXNlZCBieSBzc3IgaW4gY2FzZSBjb21wb25lbnQgaXMgY2FjaGVkIGFuZCBiZWZvcmVDcmVhdGVcbiAgICAvLyBuZXZlciBnZXRzIGNhbGxlZFxuICAgIG9wdGlvbnMuX3NzclJlZ2lzdGVyID0gaG9va1xuICB9IGVsc2UgaWYgKGluamVjdFN0eWxlcykge1xuICAgIGhvb2sgPSBpbmplY3RTdHlsZXNcbiAgfVxuXG4gIGlmIChob29rKSB7XG4gICAgdmFyIGZ1bmN0aW9uYWwgPSBvcHRpb25zLmZ1bmN0aW9uYWxcbiAgICB2YXIgZXhpc3RpbmcgPSBmdW5jdGlvbmFsXG4gICAgICA/IG9wdGlvbnMucmVuZGVyXG4gICAgICA6IG9wdGlvbnMuYmVmb3JlQ3JlYXRlXG4gICAgaWYgKCFmdW5jdGlvbmFsKSB7XG4gICAgICAvLyBpbmplY3QgY29tcG9uZW50IHJlZ2lzdHJhdGlvbiBhcyBiZWZvcmVDcmVhdGUgaG9va1xuICAgICAgb3B0aW9ucy5iZWZvcmVDcmVhdGUgPSBleGlzdGluZ1xuICAgICAgICA/IFtdLmNvbmNhdChleGlzdGluZywgaG9vaylcbiAgICAgICAgOiBbaG9va11cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gcmVnaXN0ZXIgZm9yIGZ1bmN0aW9hbCBjb21wb25lbnQgaW4gdnVlIGZpbGVcbiAgICAgIG9wdGlvbnMucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyV2l0aFN0eWxlSW5qZWN0aW9uIChoLCBjb250ZXh0KSB7XG4gICAgICAgIGhvb2suY2FsbChjb250ZXh0KVxuICAgICAgICByZXR1cm4gZXhpc3RpbmcoaCwgY29udGV4dClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGVzTW9kdWxlOiBlc01vZHVsZSxcbiAgICBleHBvcnRzOiBzY3JpcHRFeHBvcnRzLFxuICAgIG9wdGlvbnM6IG9wdGlvbnNcbiAgfVxufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXIuanNcbi8vIG1vZHVsZSBpZCA9IDFcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLypcblx0TUlUIExpY2Vuc2UgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcblx0QXV0aG9yIFRvYmlhcyBLb3BwZXJzIEBzb2tyYVxuKi9cbi8vIGNzcyBiYXNlIGNvZGUsIGluamVjdGVkIGJ5IHRoZSBjc3MtbG9hZGVyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHVzZVNvdXJjZU1hcCkge1xuXHR2YXIgbGlzdCA9IFtdO1xuXG5cdC8vIHJldHVybiB0aGUgbGlzdCBvZiBtb2R1bGVzIGFzIGNzcyBzdHJpbmdcblx0bGlzdC50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuXHRcdHJldHVybiB0aGlzLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuXHRcdFx0dmFyIGNvbnRlbnQgPSBjc3NXaXRoTWFwcGluZ1RvU3RyaW5nKGl0ZW0sIHVzZVNvdXJjZU1hcCk7XG5cdFx0XHRpZihpdGVtWzJdKSB7XG5cdFx0XHRcdHJldHVybiBcIkBtZWRpYSBcIiArIGl0ZW1bMl0gKyBcIntcIiArIGNvbnRlbnQgKyBcIn1cIjtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBjb250ZW50O1xuXHRcdFx0fVxuXHRcdH0pLmpvaW4oXCJcIik7XG5cdH07XG5cblx0Ly8gaW1wb3J0IGEgbGlzdCBvZiBtb2R1bGVzIGludG8gdGhlIGxpc3Rcblx0bGlzdC5pID0gZnVuY3Rpb24obW9kdWxlcywgbWVkaWFRdWVyeSkge1xuXHRcdGlmKHR5cGVvZiBtb2R1bGVzID09PSBcInN0cmluZ1wiKVxuXHRcdFx0bW9kdWxlcyA9IFtbbnVsbCwgbW9kdWxlcywgXCJcIl1dO1xuXHRcdHZhciBhbHJlYWR5SW1wb3J0ZWRNb2R1bGVzID0ge307XG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBpZCA9IHRoaXNbaV1bMF07XG5cdFx0XHRpZih0eXBlb2YgaWQgPT09IFwibnVtYmVyXCIpXG5cdFx0XHRcdGFscmVhZHlJbXBvcnRlZE1vZHVsZXNbaWRdID0gdHJ1ZTtcblx0XHR9XG5cdFx0Zm9yKGkgPSAwOyBpIDwgbW9kdWxlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGl0ZW0gPSBtb2R1bGVzW2ldO1xuXHRcdFx0Ly8gc2tpcCBhbHJlYWR5IGltcG9ydGVkIG1vZHVsZVxuXHRcdFx0Ly8gdGhpcyBpbXBsZW1lbnRhdGlvbiBpcyBub3QgMTAwJSBwZXJmZWN0IGZvciB3ZWlyZCBtZWRpYSBxdWVyeSBjb21iaW5hdGlvbnNcblx0XHRcdC8vICB3aGVuIGEgbW9kdWxlIGlzIGltcG9ydGVkIG11bHRpcGxlIHRpbWVzIHdpdGggZGlmZmVyZW50IG1lZGlhIHF1ZXJpZXMuXG5cdFx0XHQvLyAgSSBob3BlIHRoaXMgd2lsbCBuZXZlciBvY2N1ciAoSGV5IHRoaXMgd2F5IHdlIGhhdmUgc21hbGxlciBidW5kbGVzKVxuXHRcdFx0aWYodHlwZW9mIGl0ZW1bMF0gIT09IFwibnVtYmVyXCIgfHwgIWFscmVhZHlJbXBvcnRlZE1vZHVsZXNbaXRlbVswXV0pIHtcblx0XHRcdFx0aWYobWVkaWFRdWVyeSAmJiAhaXRlbVsyXSkge1xuXHRcdFx0XHRcdGl0ZW1bMl0gPSBtZWRpYVF1ZXJ5O1xuXHRcdFx0XHR9IGVsc2UgaWYobWVkaWFRdWVyeSkge1xuXHRcdFx0XHRcdGl0ZW1bMl0gPSBcIihcIiArIGl0ZW1bMl0gKyBcIikgYW5kIChcIiArIG1lZGlhUXVlcnkgKyBcIilcIjtcblx0XHRcdFx0fVxuXHRcdFx0XHRsaXN0LnB1c2goaXRlbSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXHRyZXR1cm4gbGlzdDtcbn07XG5cbmZ1bmN0aW9uIGNzc1dpdGhNYXBwaW5nVG9TdHJpbmcoaXRlbSwgdXNlU291cmNlTWFwKSB7XG5cdHZhciBjb250ZW50ID0gaXRlbVsxXSB8fCAnJztcblx0dmFyIGNzc01hcHBpbmcgPSBpdGVtWzNdO1xuXHRpZiAoIWNzc01hcHBpbmcpIHtcblx0XHRyZXR1cm4gY29udGVudDtcblx0fVxuXG5cdGlmICh1c2VTb3VyY2VNYXAgJiYgdHlwZW9mIGJ0b2EgPT09ICdmdW5jdGlvbicpIHtcblx0XHR2YXIgc291cmNlTWFwcGluZyA9IHRvQ29tbWVudChjc3NNYXBwaW5nKTtcblx0XHR2YXIgc291cmNlVVJMcyA9IGNzc01hcHBpbmcuc291cmNlcy5tYXAoZnVuY3Rpb24gKHNvdXJjZSkge1xuXHRcdFx0cmV0dXJuICcvKiMgc291cmNlVVJMPScgKyBjc3NNYXBwaW5nLnNvdXJjZVJvb3QgKyBzb3VyY2UgKyAnICovJ1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFtjb250ZW50XS5jb25jYXQoc291cmNlVVJMcykuY29uY2F0KFtzb3VyY2VNYXBwaW5nXSkuam9pbignXFxuJyk7XG5cdH1cblxuXHRyZXR1cm4gW2NvbnRlbnRdLmpvaW4oJ1xcbicpO1xufVxuXG4vLyBBZGFwdGVkIGZyb20gY29udmVydC1zb3VyY2UtbWFwIChNSVQpXG5mdW5jdGlvbiB0b0NvbW1lbnQoc291cmNlTWFwKSB7XG5cdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxuXHR2YXIgYmFzZTY0ID0gYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoc291cmNlTWFwKSkpKTtcblx0dmFyIGRhdGEgPSAnc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD11dGYtODtiYXNlNjQsJyArIGJhc2U2NDtcblxuXHRyZXR1cm4gJy8qIyAnICsgZGF0YSArICcgKi8nO1xufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcbi8vIG1vZHVsZSBpZCA9IDJcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLypcbiAgTUlUIExpY2Vuc2UgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcbiAgQXV0aG9yIFRvYmlhcyBLb3BwZXJzIEBzb2tyYVxuICBNb2RpZmllZCBieSBFdmFuIFlvdSBAeXl4OTkwODAzXG4qL1xuXG52YXIgaGFzRG9jdW1lbnQgPSB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnXG5cbmlmICh0eXBlb2YgREVCVUcgIT09ICd1bmRlZmluZWQnICYmIERFQlVHKSB7XG4gIGlmICghaGFzRG9jdW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgJ3Z1ZS1zdHlsZS1sb2FkZXIgY2Fubm90IGJlIHVzZWQgaW4gYSBub24tYnJvd3NlciBlbnZpcm9ubWVudC4gJyArXG4gICAgXCJVc2UgeyB0YXJnZXQ6ICdub2RlJyB9IGluIHlvdXIgV2VicGFjayBjb25maWcgdG8gaW5kaWNhdGUgYSBzZXJ2ZXItcmVuZGVyaW5nIGVudmlyb25tZW50LlwiXG4gICkgfVxufVxuXG52YXIgbGlzdFRvU3R5bGVzID0gcmVxdWlyZSgnLi9saXN0VG9TdHlsZXMnKVxuXG4vKlxudHlwZSBTdHlsZU9iamVjdCA9IHtcbiAgaWQ6IG51bWJlcjtcbiAgcGFydHM6IEFycmF5PFN0eWxlT2JqZWN0UGFydD5cbn1cblxudHlwZSBTdHlsZU9iamVjdFBhcnQgPSB7XG4gIGNzczogc3RyaW5nO1xuICBtZWRpYTogc3RyaW5nO1xuICBzb3VyY2VNYXA6ID9zdHJpbmdcbn1cbiovXG5cbnZhciBzdHlsZXNJbkRvbSA9IHsvKlxuICBbaWQ6IG51bWJlcl06IHtcbiAgICBpZDogbnVtYmVyLFxuICAgIHJlZnM6IG51bWJlcixcbiAgICBwYXJ0czogQXJyYXk8KG9iaj86IFN0eWxlT2JqZWN0UGFydCkgPT4gdm9pZD5cbiAgfVxuKi99XG5cbnZhciBoZWFkID0gaGFzRG9jdW1lbnQgJiYgKGRvY3VtZW50LmhlYWQgfHwgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSlcbnZhciBzaW5nbGV0b25FbGVtZW50ID0gbnVsbFxudmFyIHNpbmdsZXRvbkNvdW50ZXIgPSAwXG52YXIgaXNQcm9kdWN0aW9uID0gZmFsc2VcbnZhciBub29wID0gZnVuY3Rpb24gKCkge31cblxuLy8gRm9yY2Ugc2luZ2xlLXRhZyBzb2x1dGlvbiBvbiBJRTYtOSwgd2hpY2ggaGFzIGEgaGFyZCBsaW1pdCBvbiB0aGUgIyBvZiA8c3R5bGU+XG4vLyB0YWdzIGl0IHdpbGwgYWxsb3cgb24gYSBwYWdlXG52YXIgaXNPbGRJRSA9IHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIC9tc2llIFs2LTldXFxiLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKSlcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocGFyZW50SWQsIGxpc3QsIF9pc1Byb2R1Y3Rpb24pIHtcbiAgaXNQcm9kdWN0aW9uID0gX2lzUHJvZHVjdGlvblxuXG4gIHZhciBzdHlsZXMgPSBsaXN0VG9TdHlsZXMocGFyZW50SWQsIGxpc3QpXG4gIGFkZFN0eWxlc1RvRG9tKHN0eWxlcylcblxuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlIChuZXdMaXN0KSB7XG4gICAgdmFyIG1heVJlbW92ZSA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBpdGVtID0gc3R5bGVzW2ldXG4gICAgICB2YXIgZG9tU3R5bGUgPSBzdHlsZXNJbkRvbVtpdGVtLmlkXVxuICAgICAgZG9tU3R5bGUucmVmcy0tXG4gICAgICBtYXlSZW1vdmUucHVzaChkb21TdHlsZSlcbiAgICB9XG4gICAgaWYgKG5ld0xpc3QpIHtcbiAgICAgIHN0eWxlcyA9IGxpc3RUb1N0eWxlcyhwYXJlbnRJZCwgbmV3TGlzdClcbiAgICAgIGFkZFN0eWxlc1RvRG9tKHN0eWxlcylcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGVzID0gW11cbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXlSZW1vdmUubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBkb21TdHlsZSA9IG1heVJlbW92ZVtpXVxuICAgICAgaWYgKGRvbVN0eWxlLnJlZnMgPT09IDApIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBkb21TdHlsZS5wYXJ0cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGRvbVN0eWxlLnBhcnRzW2pdKClcbiAgICAgICAgfVxuICAgICAgICBkZWxldGUgc3R5bGVzSW5Eb21bZG9tU3R5bGUuaWRdXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGFkZFN0eWxlc1RvRG9tIChzdHlsZXMgLyogQXJyYXk8U3R5bGVPYmplY3Q+ICovKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3R5bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBzdHlsZXNbaV1cbiAgICB2YXIgZG9tU3R5bGUgPSBzdHlsZXNJbkRvbVtpdGVtLmlkXVxuICAgIGlmIChkb21TdHlsZSkge1xuICAgICAgZG9tU3R5bGUucmVmcysrXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRvbVN0eWxlLnBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGRvbVN0eWxlLnBhcnRzW2pdKGl0ZW0ucGFydHNbal0pXG4gICAgICB9XG4gICAgICBmb3IgKDsgaiA8IGl0ZW0ucGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgZG9tU3R5bGUucGFydHMucHVzaChhZGRTdHlsZShpdGVtLnBhcnRzW2pdKSlcbiAgICAgIH1cbiAgICAgIGlmIChkb21TdHlsZS5wYXJ0cy5sZW5ndGggPiBpdGVtLnBhcnRzLmxlbmd0aCkge1xuICAgICAgICBkb21TdHlsZS5wYXJ0cy5sZW5ndGggPSBpdGVtLnBhcnRzLmxlbmd0aFxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcGFydHMgPSBbXVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBpdGVtLnBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHBhcnRzLnB1c2goYWRkU3R5bGUoaXRlbS5wYXJ0c1tqXSkpXG4gICAgICB9XG4gICAgICBzdHlsZXNJbkRvbVtpdGVtLmlkXSA9IHsgaWQ6IGl0ZW0uaWQsIHJlZnM6IDEsIHBhcnRzOiBwYXJ0cyB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVN0eWxlRWxlbWVudCAoKSB7XG4gIHZhciBzdHlsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXG4gIHN0eWxlRWxlbWVudC50eXBlID0gJ3RleHQvY3NzJ1xuICBoZWFkLmFwcGVuZENoaWxkKHN0eWxlRWxlbWVudClcbiAgcmV0dXJuIHN0eWxlRWxlbWVudFxufVxuXG5mdW5jdGlvbiBhZGRTdHlsZSAob2JqIC8qIFN0eWxlT2JqZWN0UGFydCAqLykge1xuICB2YXIgdXBkYXRlLCByZW1vdmVcbiAgdmFyIHN0eWxlRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3N0eWxlW2RhdGEtdnVlLXNzci1pZH49XCInICsgb2JqLmlkICsgJ1wiXScpXG5cbiAgaWYgKHN0eWxlRWxlbWVudCkge1xuICAgIGlmIChpc1Byb2R1Y3Rpb24pIHtcbiAgICAgIC8vIGhhcyBTU1Igc3R5bGVzIGFuZCBpbiBwcm9kdWN0aW9uIG1vZGUuXG4gICAgICAvLyBzaW1wbHkgZG8gbm90aGluZy5cbiAgICAgIHJldHVybiBub29wXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGhhcyBTU1Igc3R5bGVzIGJ1dCBpbiBkZXYgbW9kZS5cbiAgICAgIC8vIGZvciBzb21lIHJlYXNvbiBDaHJvbWUgY2FuJ3QgaGFuZGxlIHNvdXJjZSBtYXAgaW4gc2VydmVyLXJlbmRlcmVkXG4gICAgICAvLyBzdHlsZSB0YWdzIC0gc291cmNlIG1hcHMgaW4gPHN0eWxlPiBvbmx5IHdvcmtzIGlmIHRoZSBzdHlsZSB0YWcgaXNcbiAgICAgIC8vIGNyZWF0ZWQgYW5kIGluc2VydGVkIGR5bmFtaWNhbGx5LiBTbyB3ZSByZW1vdmUgdGhlIHNlcnZlciByZW5kZXJlZFxuICAgICAgLy8gc3R5bGVzIGFuZCBpbmplY3QgbmV3IG9uZXMuXG4gICAgICBzdHlsZUVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzdHlsZUVsZW1lbnQpXG4gICAgfVxuICB9XG5cbiAgaWYgKGlzT2xkSUUpIHtcbiAgICAvLyB1c2Ugc2luZ2xldG9uIG1vZGUgZm9yIElFOS5cbiAgICB2YXIgc3R5bGVJbmRleCA9IHNpbmdsZXRvbkNvdW50ZXIrK1xuICAgIHN0eWxlRWxlbWVudCA9IHNpbmdsZXRvbkVsZW1lbnQgfHwgKHNpbmdsZXRvbkVsZW1lbnQgPSBjcmVhdGVTdHlsZUVsZW1lbnQoKSlcbiAgICB1cGRhdGUgPSBhcHBseVRvU2luZ2xldG9uVGFnLmJpbmQobnVsbCwgc3R5bGVFbGVtZW50LCBzdHlsZUluZGV4LCBmYWxzZSlcbiAgICByZW1vdmUgPSBhcHBseVRvU2luZ2xldG9uVGFnLmJpbmQobnVsbCwgc3R5bGVFbGVtZW50LCBzdHlsZUluZGV4LCB0cnVlKVxuICB9IGVsc2Uge1xuICAgIC8vIHVzZSBtdWx0aS1zdHlsZS10YWcgbW9kZSBpbiBhbGwgb3RoZXIgY2FzZXNcbiAgICBzdHlsZUVsZW1lbnQgPSBjcmVhdGVTdHlsZUVsZW1lbnQoKVxuICAgIHVwZGF0ZSA9IGFwcGx5VG9UYWcuYmluZChudWxsLCBzdHlsZUVsZW1lbnQpXG4gICAgcmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgc3R5bGVFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc3R5bGVFbGVtZW50KVxuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZShvYmopXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZVN0eWxlIChuZXdPYmogLyogU3R5bGVPYmplY3RQYXJ0ICovKSB7XG4gICAgaWYgKG5ld09iaikge1xuICAgICAgaWYgKG5ld09iai5jc3MgPT09IG9iai5jc3MgJiZcbiAgICAgICAgICBuZXdPYmoubWVkaWEgPT09IG9iai5tZWRpYSAmJlxuICAgICAgICAgIG5ld09iai5zb3VyY2VNYXAgPT09IG9iai5zb3VyY2VNYXApIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB1cGRhdGUob2JqID0gbmV3T2JqKVxuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmUoKVxuICAgIH1cbiAgfVxufVxuXG52YXIgcmVwbGFjZVRleHQgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgdGV4dFN0b3JlID0gW11cblxuICByZXR1cm4gZnVuY3Rpb24gKGluZGV4LCByZXBsYWNlbWVudCkge1xuICAgIHRleHRTdG9yZVtpbmRleF0gPSByZXBsYWNlbWVudFxuICAgIHJldHVybiB0ZXh0U3RvcmUuZmlsdGVyKEJvb2xlYW4pLmpvaW4oJ1xcbicpXG4gIH1cbn0pKClcblxuZnVuY3Rpb24gYXBwbHlUb1NpbmdsZXRvblRhZyAoc3R5bGVFbGVtZW50LCBpbmRleCwgcmVtb3ZlLCBvYmopIHtcbiAgdmFyIGNzcyA9IHJlbW92ZSA/ICcnIDogb2JqLmNzc1xuXG4gIGlmIChzdHlsZUVsZW1lbnQuc3R5bGVTaGVldCkge1xuICAgIHN0eWxlRWxlbWVudC5zdHlsZVNoZWV0LmNzc1RleHQgPSByZXBsYWNlVGV4dChpbmRleCwgY3NzKVxuICB9IGVsc2Uge1xuICAgIHZhciBjc3NOb2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzKVxuICAgIHZhciBjaGlsZE5vZGVzID0gc3R5bGVFbGVtZW50LmNoaWxkTm9kZXNcbiAgICBpZiAoY2hpbGROb2Rlc1tpbmRleF0pIHN0eWxlRWxlbWVudC5yZW1vdmVDaGlsZChjaGlsZE5vZGVzW2luZGV4XSlcbiAgICBpZiAoY2hpbGROb2Rlcy5sZW5ndGgpIHtcbiAgICAgIHN0eWxlRWxlbWVudC5pbnNlcnRCZWZvcmUoY3NzTm9kZSwgY2hpbGROb2Rlc1tpbmRleF0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlRWxlbWVudC5hcHBlbmRDaGlsZChjc3NOb2RlKVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhcHBseVRvVGFnIChzdHlsZUVsZW1lbnQsIG9iaikge1xuICB2YXIgY3NzID0gb2JqLmNzc1xuICB2YXIgbWVkaWEgPSBvYmoubWVkaWFcbiAgdmFyIHNvdXJjZU1hcCA9IG9iai5zb3VyY2VNYXBcblxuICBpZiAobWVkaWEpIHtcbiAgICBzdHlsZUVsZW1lbnQuc2V0QXR0cmlidXRlKCdtZWRpYScsIG1lZGlhKVxuICB9XG5cbiAgaWYgKHNvdXJjZU1hcCkge1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLmNocm9tZS5jb20vZGV2dG9vbHMvZG9jcy9qYXZhc2NyaXB0LWRlYnVnZ2luZ1xuICAgIC8vIHRoaXMgbWFrZXMgc291cmNlIG1hcHMgaW5zaWRlIHN0eWxlIHRhZ3Mgd29yayBwcm9wZXJseSBpbiBDaHJvbWVcbiAgICBjc3MgKz0gJ1xcbi8qIyBzb3VyY2VVUkw9JyArIHNvdXJjZU1hcC5zb3VyY2VzWzBdICsgJyAqLydcbiAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yNjYwMzg3NVxuICAgIGNzcyArPSAnXFxuLyojIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCwnICsgYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoc291cmNlTWFwKSkpKSArICcgKi8nXG4gIH1cblxuICBpZiAoc3R5bGVFbGVtZW50LnN0eWxlU2hlZXQpIHtcbiAgICBzdHlsZUVsZW1lbnQuc3R5bGVTaGVldC5jc3NUZXh0ID0gY3NzXG4gIH0gZWxzZSB7XG4gICAgd2hpbGUgKHN0eWxlRWxlbWVudC5maXJzdENoaWxkKSB7XG4gICAgICBzdHlsZUVsZW1lbnQucmVtb3ZlQ2hpbGQoc3R5bGVFbGVtZW50LmZpcnN0Q2hpbGQpXG4gICAgfVxuICAgIHN0eWxlRWxlbWVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjc3MpKVxuICB9XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXNDbGllbnQuanNcbi8vIG1vZHVsZSBpZCA9IDNcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiaW1wb3J0ICogYXMgYXV0aCBmcm9tICcuL21vZHVsZXMvYXV0aC9hdXRoVHlwZXMnO1xuaW1wb3J0ICogYXMgc25hY2tiYXIgZnJvbSAnLi9tb2R1bGVzL3NuYWNrYmFyL3NuYWNrYmFyVHlwZXMnO1xuaW1wb3J0ICogYXMgcG9zdCBmcm9tICcuL21vZHVsZXMvcG9zdC9wb3N0VHlwZXMnO1xuXG5jb25zdCB0ID0ge1xuICAgIFNUQVJUX0xPQURJTkc6IFwiU1RBUlRfTE9BRElOR1wiLFxuICAgIFNUT1BfTE9BRElORzogXCJTVE9QX0xPQURJTkdcIixcblxuICAgIC8vIGdldHRlcnNcbiAgICBJU19MT0FESU5HOiBcIklTX0xPQURJTkdcIixcbiAgICBJU19GVUxMX0xPQURJTkc6IFwiSVNfRlVMTF9MT0FESU5HXCJcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIGF1dGgsXG4gICAgc25hY2tiYXIsXG4gICAgcG9zdCxcbiAgICAuLi50XG59XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9zdG9yZS90eXBlcy5qcyIsImltcG9ydCBWdWUgZnJvbSAndnVlJztcbmltcG9ydCBWdWV4IGZyb20gJ3Z1ZXgnO1xuXG5pbXBvcnQgYXV0aCBmcm9tICdAL3N0b3JlL21vZHVsZXMvYXV0aC9hdXRoU3RvcmUnO1xuaW1wb3J0IHNuYWNrYmFyIGZyb20gJ0Avc3RvcmUvbW9kdWxlcy9zbmFja2Jhci9zbmFja2JhclN0b3JlJztcbmltcG9ydCBwb3N0IGZyb20gJ0Avc3RvcmUvbW9kdWxlcy9wb3N0L3Bvc3RTdG9yZSc7XG5cbmltcG9ydCB0eXBlcyBmcm9tICcuL3R5cGVzJztcblxuVnVlLnVzZShWdWV4KTtcblxuZXhwb3J0IGRlZmF1bHQgbmV3IFZ1ZXguU3RvcmUoe1xuICAgIC8vIHN0cmljdDogdHJ1ZSxcbiAgICBtb2R1bGVzOiB7XG4gICAgICAgIFthdXRoLk5BTUVdOiB7XG4gICAgICAgICAgICBuYW1lc3BhY2VkOiB0cnVlLFxuICAgICAgICAgICAgLi4uYXV0aFxuICAgICAgICB9LFxuICAgICAgICBbc25hY2tiYXIuTkFNRV06IHtcbiAgICAgICAgICAgIG5hbWVzcGFjZWQ6IHRydWUsXG4gICAgICAgICAgICAuLi5zbmFja2JhclxuICAgICAgICB9LFxuICAgICAgICBbcG9zdC5OQU1FXToge1xuICAgICAgICAgICAgbmFtZXNwYWNlZDogdHJ1ZSxcbiAgICAgICAgICAgIC4uLnBvc3RcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc3RhdGU6IHtcbiAgICAgICAgaXNMb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgaXNGdWxsTG9hZGluZzogZmFsc2UsXG4gICAgfSxcbiAgICBtdXRhdGlvbnM6IHtcbiAgICAgICAgW3R5cGVzLlNUQVJUX0xPQURJTkddOiAoc3RhdGUsIHBheWxvYWQpID0+IHtcbiAgICAgICAgICAgIGlmIChwYXlsb2FkID09ICdmdWxsJykge1xuICAgICAgICAgICAgICAgIHN0YXRlLmlzRnVsbExvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5pc0xvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBbdHlwZXMuU1RPUF9MT0FESU5HXTogKHN0YXRlKSA9PiB7XG4gICAgICAgICAgICBzdGF0ZS5pc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHN0YXRlLmlzRnVsbExvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZ2V0dGVyczoge1xuICAgICAgICBbdHlwZXMuSVNfTE9BRElOR106IHN0YXRlID0+IHtcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZS5pc0xvYWRpbmc7XG4gICAgICAgIH0sXG4gICAgICAgIFt0eXBlcy5JU19GVUxMX0xPQURJTkddOiBzdGF0ZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gc3RhdGUuaXNGdWxsTG9hZGluZztcbiAgICAgICAgfVxuICAgIH1cbn0pXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9zdG9yZS9zdG9yZS5qcyIsImltcG9ydCBzdG9yZSBmcm9tICcuLy4uL3N0b3JlL3N0b3JlJztcbmltcG9ydCBzdG9yZVR5cGVzIGZyb20gJy4vLi4vc3RvcmUvdHlwZXMnO1xuXG5jbGFzcyBTbmFja2JhciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gbnVsbDtcbiAgICB9XG5cbiAgICBfc2V0dXAobWVzc2FnZSwgdGltZSwgbGFiZWwsIHBvc2l0aW9uLCBjbG9zZSwgY2FsbGJhY2ssIGNhbGxiYWNrX2xhYmVsKSB7XG4gICAgICAgIGxldCBjb25maWcgPSB7XG4gICAgICAgICAgICB0ZXh0OiBtZXNzYWdlLFxuICAgICAgICAgICAgcG9zaXRpb246IHt9XG4gICAgICAgIH07XG4gICAgICAgIGNvbmZpZy50aW1lID0gdGltZSB8fCBudWxsO1xuICAgICAgICBjb25maWcubGFiZWwgPSBsYWJlbCB8fCBudWxsO1xuICAgICAgICBjb25maWcuY2xvc2UgPSBjbG9zZTtcbiAgICAgICAgY29uZmlnLmNhbGxiYWNrID0gY2FsbGJhY2sgfHwgbnVsbDtcbiAgICAgICAgY29uZmlnLmNhbGxiYWNrX2xhYmVsID0gY2FsbGJhY2tfbGFiZWwgfHwgbnVsbDtcblxuICAgICAgICBpZiAocG9zaXRpb24uaW5jbHVkZXMoJ3RvcCcpKSB7XG4gICAgICAgICAgICBjb25maWcucG9zaXRpb24ueSA9ICd0b3AnO1xuICAgICAgICB9IGVsc2UgaWYgKHBvc2l0aW9uLmluY2x1ZGVzKCdib3R0b20nKSkge1xuICAgICAgICAgICAgY29uZmlnLnBvc2l0aW9uLnkgPSAnYm90dG9tJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwb3NpdGlvbi5pbmNsdWRlcygncmlnaHQnKSkge1xuICAgICAgICAgICAgY29uZmlnLnBvc2l0aW9uLnggPSAncmlnaHQnO1xuICAgICAgICB9IGVsc2UgaWYgKHBvc2l0aW9uLmluY2x1ZGVzKCdsZWZ0JykpIHtcbiAgICAgICAgICAgIGNvbmZpZy5wb3NpdGlvbi54ID0gJ2xlZnQnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICB9XG5cbiAgICBmaXJlKG1lc3NhZ2UsIGxhYmVsID0gbnVsbCwgdGltZSA9IG51bGwsIHBvc2l0aW9uID0gJ3RvcCcsIGNsb3NlID0gbnVsbCwgY2FsbGJhY2sgPSBudWxsLCBjYWxsYmFja19sYWJlbCA9IG51bGwpIHtcbiAgICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbiB8fCAndG9wJztcblxuICAgICAgICB0aGlzLmNvbmZpZyA9IHRoaXMuX3NldHVwKG1lc3NhZ2UsIHRpbWUsIGxhYmVsLCBwb3NpdGlvbiwgY2xvc2UsIGNhbGxiYWNrLCBjYWxsYmFja19sYWJlbCk7XG4gICAgICAgIHRoaXMuc2hvdygpO1xuICAgIH1cblxuICAgIHNob3coKSB7XG4gICAgICAgIHN0b3JlLmNvbW1pdChzdG9yZVR5cGVzLnNuYWNrYmFyLk5BTUUgKyAnLycgKyBzdG9yZVR5cGVzLnNuYWNrYmFyLkNMRUFSX1NOQUNLQkFSKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG5cbiAgICAgICAgICAgIHN0b3JlLmNvbW1pdChcbiAgICAgICAgICAgICAgICBzdG9yZVR5cGVzLnNuYWNrYmFyLk5BTUUgKyAnLycgKyBzdG9yZVR5cGVzLnNuYWNrYmFyLkxPQURfU05BQ0tCQVIsXG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWdcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0sIDUwMClcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBTbmFja2JhcigpO1xuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvaGVscGVycy9zbmFja2Jhci5qcyIsImltcG9ydCBzdG9yZSBmcm9tICcuLy4uL3N0b3JlL3N0b3JlJztcbmltcG9ydCBzdG9yZVR5cGVzIGZyb20gJy4vLi4vc3RvcmUvdHlwZXMnO1xuXG5jbGFzcyBMb2FkZXIge1xuICAgIHN0YXJ0KGZ1bGwgPSBmYWxzZSkge1xuICAgICAgICBzdG9yZS5jb21taXQoXG4gICAgICAgICAgICBzdG9yZVR5cGVzLlNUQVJUX0xPQURJTkcsXG4gICAgICAgICAgICBmdWxsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgc3RvcCgpIHtcbiAgICAgICAgc3RvcmUuY29tbWl0KHN0b3JlVHlwZXMuU1RPUF9MT0FESU5HKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBMb2FkZXIoKTtcblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2hlbHBlcnMvbG9hZGVyLmpzIiwiZXhwb3J0IGNvbnN0IE5BTUUgPSAnQVVUSCc7XG5cbmV4cG9ydCBjb25zdCBVU0VSX0xPR0lOID0gJ1VTRVJfTE9HSU4nO1xuZXhwb3J0IGNvbnN0IFVTRVJfTE9HT1VUID0gJ1VTRVJfTE9HT1VUJztcblxuZXhwb3J0IGNvbnN0IEdFVF9VU0VSID0gJ0dFVF9VU0VSJztcbmV4cG9ydCBjb25zdCBJU19MT0dHRURfSU4gPSAnSVNfTE9HR0VEX0lOJztcblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL21vZHVsZXMvYXV0aC9hdXRoVHlwZXMuanMiLCJleHBvcnQgY29uc3QgTkFNRSA9ICdTTkFDS0JBUic7XG5cbi8vR0VUVEVSU1xuZXhwb3J0IGNvbnN0IEdFVF9NRVNTQUdFID0gJ0dFVF9NRVNTQUdFJztcbmV4cG9ydCBjb25zdCBHRVRfTUVTU0FHRV9WSVNJQklMSVRZID0gJ0dFVF9NRVNTQUdFX1ZJU0lCSUxJVFknO1xuXG5leHBvcnQgY29uc3QgTE9BRF9TTkFDS0JBUiA9ICdMT0FEX1NOQUNLQkFSJztcbmV4cG9ydCBjb25zdCBDTEVBUl9TTkFDS0JBUiA9ICdDTEVBUl9TTkFDS0JBUic7XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9zdG9yZS9tb2R1bGVzL3NuYWNrYmFyL3NuYWNrYmFyVHlwZXMuanMiLCJleHBvcnQgY29uc3QgTkFNRSA9ICdQT1NUJztcblxuZXhwb3J0IGNvbnN0IEFERF9ORVdfUE9TVCA9ICdBRERfTkVXX1BPU1QnO1xuZXhwb3J0IGNvbnN0IFJFUExBQ0VfUE9TVFMgPSAnUkVQTEFDRV9QT1NUUyc7XG5cbmV4cG9ydCBjb25zdCBHRVRfUE9TVFMgPSAnR0VUX1BPU1RTJztcblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3N0b3JlL21vZHVsZXMvcG9zdC9wb3N0VHlwZXMuanMiLCJ2YXIgZGlzcG9zZWQgPSBmYWxzZVxuZnVuY3Rpb24gaW5qZWN0U3R5bGUgKHNzckNvbnRleHQpIHtcbiAgaWYgKGRpc3Bvc2VkKSByZXR1cm5cbiAgcmVxdWlyZShcIiEhdnVlLXN0eWxlLWxvYWRlciFjc3MtbG9hZGVyP3NvdXJjZU1hcCEuLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXg/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTljOTVlM2UyXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IXN0eWx1cy1sb2FkZXIhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9BcHAudnVlXCIpXG59XG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIiEuLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIikoXG4gIC8qIHNjcmlwdCAqL1xuICByZXF1aXJlKFwiISFiYWJlbC1sb2FkZXI/e1xcXCJjYWNoZURpcmVjdG9yeVxcXCI6dHJ1ZSxcXFwicHJlc2V0c1xcXCI6W1tcXFwiZW52XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlLFxcXCJ0YXJnZXRzXFxcIjp7XFxcImJyb3dzZXJzXFxcIjpbXFxcIj4gMiVcXFwiXSxcXFwidWdsaWZ5XFxcIjp0cnVlfX1dLFtcXFwiZXMyMDE1XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlfV0sW1xcXCJzdGFnZS0yXFxcIl1dfSEuLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL0FwcC52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LTljOTVlM2UyXFxcIixcXFwiaGFzU2NvcGVkXFxcIjp0cnVlfSEuLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vQXBwLnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIFwiZGF0YS12LTljOTVlM2UyXCIsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvQXBwLnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gQXBwLnZ1ZTogZnVuY3Rpb25hbCBjb21wb25lbnRzIGFyZSBub3Qgc3VwcG9ydGVkIHdpdGggdGVtcGxhdGVzLCB0aGV5IHNob3VsZCB1c2UgcmVuZGVyIGZ1bmN0aW9ucy5cIil9XG5cbi8qIGhvdCByZWxvYWQgKi9cbmlmIChtb2R1bGUuaG90KSB7KGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhvdEFQSSA9IHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIilcbiAgaG90QVBJLmluc3RhbGwocmVxdWlyZShcInZ1ZVwiKSwgZmFsc2UpXG4gIGlmICghaG90QVBJLmNvbXBhdGlibGUpIHJldHVyblxuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmICghbW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgaG90QVBJLmNyZWF0ZVJlY29yZChcImRhdGEtdi05Yzk1ZTNlMlwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfSBlbHNlIHtcbiAgICBob3RBUEkucmVsb2FkKFwiZGF0YS12LTljOTVlM2UyXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9XG4gIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbiAoZGF0YSkge1xuICAgIGRpc3Bvc2VkID0gdHJ1ZVxuICB9KVxufSkoKX1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQuZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL0FwcC52dWVcbi8vIG1vZHVsZSBpZCA9IDE0MVxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJpbXBvcnQgYXBpIGZyb20gJy4vaW5kZXgnO1xuaW1wb3J0IHMgZnJvbSAnLi8uLi9oZWxwZXJzL3NuYWNrYmFyJztcbmltcG9ydCBsIGZyb20gJy4vLi4vaGVscGVycy9sb2FkZXInO1xuaW1wb3J0IHN0b3JlIGZyb20gJy4vLi4vc3RvcmUvc3RvcmUnO1xuaW1wb3J0IHR5cGVzIGZyb20gJy4vLi4vc3RvcmUvdHlwZXMnO1xuXG5jbGFzcyBQb3N0IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLm1vZGVsID0gJ3Bvc3RzJztcbiAgICAgICAgdGhpcy5wb3N0cyA9IFtdO1xuICAgICAgICAvLyB0aGlzLmxhc3RfZmV0Y2ggPSBtb21lbnQoKTtcbiAgICB9XG5cbiAgICBnZXRBbGwoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBsLnN0YXJ0KCk7XG4gICAgICAgICAgICBhcGkuZ2V0KHRoaXMubW9kZWwpXG4gICAgICAgICAgICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvc3RzID0gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmUuY29tbWl0KHR5cGVzLnBvc3QuTkFNRSArICcvJyArIHR5cGVzLnBvc3QuUkVQTEFDRV9QT1NUUywgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIGwuc3RvcCgpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcy5maXJlKFwiU29tZXRoaW5nIHdlbnQgd3JvbmdcIiwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgIGwuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBhZGRQb3N0KHBvc3QpIHtcbiAgICAgICAgbGV0IHNlbmRQID0ge1xuICAgICAgICAgICAgdXNlcl9pZDogMSxcbiAgICAgICAgICAgIHRleHQ6IHBvc3QudGV4dCxcbiAgICAgICAgICAgIHJlcG9ydDogcG9zdC5yZXBvcnQsXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBvc3QubWVkaWEpIHtcbiAgICAgICAgICAgIHNlbmRQLm1lZGlhID0gcG9zdC5tZWRpYS5saW5rXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgbC5zdGFydCgpO1xuICAgICAgICAgICAgYXBpLnBvc3QodGhpcy5tb2RlbCwgc2VuZFApXG4gICAgICAgICAgICAgICAgLnRoZW4obmV3UG9zdCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlLmNvbW1pdCh0eXBlcy5wb3N0Lk5BTUUgKyAnLycgKyB0eXBlcy5wb3N0LkFERF9ORVdfUE9TVCwgbmV3UG9zdCk7XG4gICAgICAgICAgICAgICAgICAgIGwuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG5ld1Bvc3QpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcy5maXJlKFwiU29tZXRoaW5nIHdlbnQgd3JvbmdcIiwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgIGwuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxuXG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IFBvc3QoKTtcblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2FwaS9wb3N0cy5qcyIsImNsYXNzIEFwaSB7XG5cbiAgICBnZXQodXJsKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBheGlvcy5nZXQodXJsKVxuICAgICAgICAgICAgICAgIC50aGVuKCh7IGRhdGEgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKCh7IHJlc3BvbnNlIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIHBvc3QodXJsLCBkYXRhKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBheGlvcy5wb3N0KHVybCwgZGF0YSlcbiAgICAgICAgICAgICAgICAudGhlbigoeyBkYXRhIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5yZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yLnJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5yZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IucmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBBcGk7XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9hcGkvaW5kZXguanMiLCJyZXF1aXJlKCcuL2Jvb3RzdHJhcCcpO1xuXG5pbXBvcnQgVnVlIGZyb20gJ3Z1ZSc7XG5pbXBvcnQgVnVleCBmcm9tICd2dWV4JztcbmltcG9ydCBWdWVSb3V0ZXIgZnJvbSAndnVlLXJvdXRlcidcbmltcG9ydCBWdWV0aWZ5IGZyb20gJ3Z1ZXRpZnknO1xuXG5WdWUudXNlKFZ1ZXRpZnkpO1xuXG5pbXBvcnQgc3RvcmUgZnJvbSAnLi9zdG9yZS9zdG9yZSc7XG5pbXBvcnQgcm91dGVyIGZyb20gJy4vcm91dGVyL3JvdXRlcic7XG5pbXBvcnQgQXBwIGZyb20gJy4vQXBwLnZ1ZSc7XG5cbmNvbnN0IGFwcCA9IG5ldyBWdWUoe1xuICAgIGVsOiAnI2FwcCcsXG4gICAgcmVuZGVyOiBoID0+IGgoQXBwKSxcbiAgICByb3V0ZXIsXG4gICAgc3RvcmUsXG59KTtcblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2FwcC5qcyIsIndpbmRvdy5fID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbndpbmRvdy5tb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcblxud2luZG93LmF4aW9zID0gcmVxdWlyZSgnYXhpb3MnKTtcbndpbmRvdy5heGlvcy5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnWC1SZXF1ZXN0ZWQtV2l0aCddID0gJ1hNTEh0dHBSZXF1ZXN0JztcbndpbmRvdy5heGlvcy5kZWZhdWx0cy5iYXNlVVJMID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9hcGknO1xuXG5sZXQgdG9rZW4gPSBkb2N1bWVudC5oZWFkLnF1ZXJ5U2VsZWN0b3IoJ21ldGFbbmFtZT1cImNzcmYtdG9rZW5cIl0nKTtcbmlmICh0b2tlbikge1xuICAgIHdpbmRvdy5heGlvcy5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnWC1DU1JGLVRPS0VOJ10gPSB0b2tlbi5jb250ZW50O1xufSBlbHNlIHtcbiAgICBjb25zb2xlLmVycm9yKCdDU1JGIHRva2VuIG5vdCBmb3VuZDogaHR0cHM6Ly9sYXJhdmVsLmNvbS9kb2NzL2NzcmYjY3NyZi14LWNzcmYtdG9rZW4nKTtcbn1cblxuLy9Mb2FkIG15IGJhc2Ugc3R5bGVzIFtdXG4vLyByZXF1aXJlKCcuLy4uL3Nhc3MvYXBwLnNjc3MnKTtcblxuLyoqXG4gKiBFY2hvIGV4cG9zZXMgYW4gZXhwcmVzc2l2ZSBBUEkgZm9yIHN1YnNjcmliaW5nIHRvIGNoYW5uZWxzIGFuZCBsaXN0ZW5pbmdcbiAqIGZvciBldmVudHMgdGhhdCBhcmUgYnJvYWRjYXN0IGJ5IExhcmF2ZWwuIEVjaG8gYW5kIGV2ZW50IGJyb2FkY2FzdGluZ1xuICogYWxsb3dzIHlvdXIgdGVhbSB0byBlYXNpbHkgYnVpbGQgcm9idXN0IHJlYWwtdGltZSB3ZWIgYXBwbGljYXRpb25zLlxuICovXG5cbi8vIGltcG9ydCBFY2hvIGZyb20gJ2xhcmF2ZWwtZWNobydcblxuLy8gd2luZG93LlB1c2hlciA9IHJlcXVpcmUoJ3B1c2hlci1qcycpO1xuXG4vLyB3aW5kb3cuRWNobyA9IG5ldyBFY2hvKHtcbi8vICAgICBicm9hZGNhc3RlcjogJ3B1c2hlcicsXG4vLyAgICAga2V5OiAneW91ci1wdXNoZXIta2V5J1xuLy8gfSk7XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9ib290c3RyYXAuanMiLCJpbXBvcnQgKiBhcyB0eXBlcyBmcm9tICcuL2F1dGhUeXBlcyc7XG5jb25zdCBOQU1FID0gdHlwZXMuTkFNRTtcblxuY29uc3Qgc3RhdGUgPSB7XG4gICAgdXNlcjoge30sXG4gICAgaXNMb2dnZWRJbjogZmFsc2UsXG59XG5cbmNvbnN0IG11dGF0aW9ucyA9IHtcbiAgICBbdHlwZXMuVVNFUl9MT0dJTl06IChzdGF0ZSwgdXNlcikgPT4ge1xuICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgc3RhdGUudXNlciA9IHVzZXJcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5pc0xvZ2dlZEluID0gdHJ1ZTtcbiAgICB9LFxuICAgIFt0eXBlcy5VU0VSX0xPR09VVF06IChzdGF0ZSkgPT4ge1xuICAgICAgICBzdGF0ZS51c2VyID0ge307XG4gICAgICAgIHN0YXRlLmlzTG9nZ2VkSW4gPSBmYWxzZTtcbiAgICB9XG59XG5cbmNvbnN0IGFjdGlvbnMgPSB7XG4gICAgW3R5cGVzLlVTRVJfTE9HSU5dOiAoeyBjb21taXQgfSwgdXNlcikgPT4ge1xuICAgICAgICB1c2VyID8gdXNlciA6IHt9O1xuICAgICAgICBjb21taXQodHlwZXMuVVNFUl9MT0dJTiwgdXNlcik7XG4gICAgfSxcbiAgICBbdHlwZXMuVVNFUl9MT0dPVVRdOiAoeyBjb21taXQgfSkgPT4ge1xuICAgICAgICBjb21taXQodHlwZXMuVVNFUl9MT0dPVVQpO1xuICAgIH1cbn1cblxuY29uc3QgZ2V0dGVycyA9IHtcbiAgICBbdHlwZXMuR0VUX1VTRVJdOiBzdGF0ZSA9PiB7XG4gICAgICAgIHJldHVybiBzdGF0ZS51c2VyO1xuICAgIH0sXG4gICAgW3R5cGVzLklTX0xPR0dFRF9JTl06IHN0YXRlID0+IHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmlzTG9nZ2VkSW47XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgc3RhdGUsXG4gICAgbXV0YXRpb25zLFxuICAgIGFjdGlvbnMsXG4gICAgZ2V0dGVycyxcbiAgICBOQU1FXG59XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9zdG9yZS9tb2R1bGVzL2F1dGgvYXV0aFN0b3JlLmpzIiwiaW1wb3J0ICogYXMgdHlwZXMgZnJvbSBcIi4vc25hY2tiYXJUeXBlc1wiO1xuY29uc3QgTkFNRSA9IHR5cGVzLk5BTUU7XG5cbmNvbnN0IHN0YXRlID0ge1xuICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgdGV4dDogJycsXG4gICAgICAgIHNob3c6IGZhbHNlLFxuICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgeTogJ3RvcCcsXG4gICAgICAgICAgICB4OiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgbGFiZWw6IGZhbHNlLFxuICAgICAgICB0aW1lOiA2MDAwLFxuICAgICAgICBjYWxsYmFjazogZmFsc2UsXG4gICAgICAgIGNhbGxiYWNrX2xhYmVsOiAnQ0xPU0UnLFxuICAgICAgICBjbG9zZTogdHJ1ZSxcbiAgICB9XG59XG5cbmNvbnN0IG11dGF0aW9ucyA9IHtcbiAgICBbdHlwZXMuTE9BRF9TTkFDS0JBUl06IChzdGF0ZSwgcGF5bG9hZCkgPT4ge1xuICAgICAgICBzdGF0ZS5tZXNzYWdlLnNob3cgPSB0cnVlO1xuICAgICAgICBzdGF0ZS5tZXNzYWdlLnRleHQgPSBwYXlsb2FkLnRleHQ7XG5cbiAgICAgICAgaWYgKHBheWxvYWQubGFiZWwpXG4gICAgICAgICAgICBzdGF0ZS5tZXNzYWdlLmxhYmVsID0gcGF5bG9hZC5sYWJlbDtcblxuICAgICAgICBpZiAocGF5bG9hZC5wb3NpdGlvbi55KVxuICAgICAgICAgICAgc3RhdGUubWVzc2FnZS5wb3NpdGlvbi55ID0gcGF5bG9hZC5wb3NpdGlvbi55O1xuXG4gICAgICAgIGlmIChwYXlsb2FkLnBvc2l0aW9uLngpXG4gICAgICAgICAgICBzdGF0ZS5tZXNzYWdlLnBvc2l0aW9uLnggPSBwYXlsb2FkLnBvc2l0aW9uLng7XG5cbiAgICAgICAgaWYgKHBheWxvYWQudGltZSlcbiAgICAgICAgICAgIHN0YXRlLm1lc3NhZ2UudGltZSA9IHBheWxvYWQudGltZTtcblxuICAgICAgICBpZiAocGF5bG9hZC5jYWxsYmFjaylcbiAgICAgICAgICAgIHN0YXRlLm1lc3NhZ2UuY2FsbGJhY2sgPSBwYXlsb2FkLmNhbGxiYWNrO1xuXG4gICAgICAgIGlmIChwYXlsb2FkLmNhbGxiYWNrX2xhYmVsKVxuICAgICAgICAgICAgc3RhdGUubWVzc2FnZS5jYWxsYmFja19sYWJlbCA9IHBheWxvYWQuY2FsbGJhY2tfbGFiZWw7XG5cbiAgICAgICAgaWYgKHBheWxvYWQuaGFzT3duUHJvcGVydHkoJ2Nsb3NlJykpIHtcbiAgICAgICAgICAgIGlmIChwYXlsb2FkLmNsb3NlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUubWVzc2FnZS5jbG9zZSA9IHBheWxvYWQuY2xvc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFt0eXBlcy5DTEVBUl9TTkFDS0JBUl06IChzdGF0ZSkgPT4ge1xuICAgICAgICBzdGF0ZS5tZXNzYWdlLnNob3cgPSBmYWxzZTtcbiAgICAgICAgc3RhdGUubWVzc2FnZS50ZXh0ID0gJyc7XG4gICAgICAgIHN0YXRlLm1lc3NhZ2UubGFiZWwgPSBmYWxzZTtcbiAgICAgICAgc3RhdGUubWVzc2FnZS50aW1lID0gNjAwMDtcbiAgICAgICAgc3RhdGUubWVzc2FnZS5jYWxsYmFjayA9IGZhbHNlO1xuICAgICAgICBzdGF0ZS5tZXNzYWdlLmNhbGxiYWNrX2xhYmVsID0gJ0NMT1NFJztcbiAgICAgICAgc3RhdGUubWVzc2FnZS5jbG9zZSA9IHRydWU7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgc3RhdGUubWVzc2FnZS5wb3NpdGlvbi55ID0gJ3RvcCc7XG4gICAgICAgICAgICBzdGF0ZS5tZXNzYWdlLnBvc2l0aW9uLnggPSBmYWxzZTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9XG59XG5cbmNvbnN0IGFjdGlvbnMgPSB7XG5cbn1cblxuY29uc3QgZ2V0dGVycyA9IHtcbiAgICBbdHlwZXMuR0VUX01FU1NBR0VdOiBzdGF0ZSA9PiB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5tZXNzYWdlO1xuICAgIH0sXG4gICAgW3R5cGVzLkdFVF9NRVNTQUdFX1ZJU0lCSUxJVFldOiBzdGF0ZSA9PiB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5tZXNzYWdlLnNob3c7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgc3RhdGUsXG4gICAgbXV0YXRpb25zLFxuICAgIGFjdGlvbnMsXG4gICAgZ2V0dGVycyxcbiAgICBOQU1FXG59XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9zdG9yZS9tb2R1bGVzL3NuYWNrYmFyL3NuYWNrYmFyU3RvcmUuanMiLCJpbXBvcnQgKiBhcyB0eXBlcyBmcm9tICcuL3Bvc3RUeXBlcyc7XG5jb25zdCBOQU1FID0gdHlwZXMuTkFNRTtcblxuY29uc3Qgc3RhdGUgPSB7XG4gICAgcG9zdHM6IFtdLFxufVxuXG5jb25zdCBtdXRhdGlvbnMgPSB7XG4gICAgW3R5cGVzLkFERF9ORVdfUE9TVF06IChzdGF0ZSwgcG9zdCkgPT4ge1xuICAgICAgICBzdGF0ZS5wb3N0cy51bnNoaWZ0KHBvc3QpO1xuICAgIH0sXG4gICAgW3R5cGVzLlJFUExBQ0VfUE9TVFNdOiAoc3RhdGUsIHBvc3RzKSA9PiB7XG4gICAgICAgIHN0YXRlLnBvc3RzID0gcG9zdHM7XG4gICAgfVxufVxuXG5jb25zdCBhY3Rpb25zID0ge1xuICAgIC8vIFt0eXBlcy5VU0VSX0xPR0lOXTogKHsgY29tbWl0IH0sIHVzZXIpID0+IHtcbiAgICAvLyAgICAgdXNlciA/IHVzZXIgOiB7fTtcbiAgICAvLyAgICAgY29tbWl0KHR5cGVzLlVTRVJfTE9HSU4sIHVzZXIpO1xuICAgIC8vIH0sXG4gICAgLy8gW3R5cGVzLlVTRVJfTE9HT1VUXTogKHsgY29tbWl0IH0pID0+IHtcbiAgICAvLyAgICAgY29tbWl0KHR5cGVzLlVTRVJfTE9HSU4pO1xuICAgIC8vIH1cbn1cblxuY29uc3QgZ2V0dGVycyA9IHtcbiAgICBbdHlwZXMuR0VUX1BPU1RTXTogc3RhdGUgPT4ge1xuICAgICAgICByZXR1cm4gc3RhdGUucG9zdHM7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgc3RhdGUsXG4gICAgbXV0YXRpb25zLFxuICAgIGFjdGlvbnMsXG4gICAgZ2V0dGVycyxcbiAgICBOQU1FXG59XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9zdG9yZS9tb2R1bGVzL3Bvc3QvcG9zdFN0b3JlLmpzIiwiaW1wb3J0IFZ1ZSBmcm9tICd2dWUnO1xuaW1wb3J0IFZ1ZVJvdXRlciBmcm9tICd2dWUtcm91dGVyJztcbmltcG9ydCByb3V0ZXMgZnJvbSAnLi9yb3V0ZXMnO1xuXG5WdWUudXNlKFZ1ZVJvdXRlcik7XG5cbmNvbnN0IHJvdXRlciA9IG5ldyBWdWVSb3V0ZXIoe1xuICAgIG1vZGU6ICdoaXN0b3J5JyxcbiAgICByb3V0ZXNcbn0pO1xuXG5yb3V0ZXIuYmVmb3JlRWFjaCgodG8sIGZyb20sIG5leHQpID0+IHtcbiAgICBuZXh0KCk7XG59KTtcblxuZXhwb3J0IGRlZmF1bHQgcm91dGVyO1xuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcm91dGVyL3JvdXRlci5qcyIsImltcG9ydCBBcHAgZnJvbSAnQC9BcHAudnVlJztcbmltcG9ydCBNYWluIGZyb20gJ0AvcGFnZXMvaW5kZXhQYWdlLnZ1ZSc7XG5pbXBvcnQgQXV0aCBmcm9tICdAL3BhZ2VzL2F1dGgvYXV0aFBhZ2UudnVlJztcbmltcG9ydCBEYXNoYm9hcmQgZnJvbSAnQC9wYWdlcy9kYXNoYm9hcmQvZGFzaGJvYXJkUGFnZS52dWUnO1xuXG5pbXBvcnQgc3RvcmUgZnJvbSAnQC9zdG9yZS9zdG9yZSc7XG5pbXBvcnQgc2IgZnJvbSAnLi8uLi9oZWxwZXJzL3NuYWNrYmFyJztcbmltcG9ydCBsb2FkZXIgZnJvbSAnLi8uLi9oZWxwZXJzL2xvYWRlcic7XG5cbmltcG9ydCBkYXNoYm9hZFJvdXRlcyBmcm9tICcuL2Rhc2hib2FyZFJvdXRlcyc7XG5pbXBvcnQgYXV0aFJvdXRlcyBmcm9tICcuL2F1dGhSb3V0ZXMnO1xuXG5leHBvcnQgZGVmYXVsdCBbe1xuICAgICAgICBwYXRoOiAnLycsXG4gICAgICAgIG5hbWU6ICdpbmRleCcsXG4gICAgICAgIGNvbXBvbmVudDogTWFpblxuICAgIH0sXG4gICAge1xuICAgICAgICBwYXRoOiAnL2F1dGgnLFxuICAgICAgICBjb21wb25lbnQ6IEF1dGgsXG4gICAgICAgIGNoaWxkcmVuOiBhdXRoUm91dGVzLFxuICAgICAgICBiZWZvcmVFbnRlcjogKHRvLCBmcm9tLCBuZXh0KSA9PiB7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgcGF0aDogJy9kYXNoJyxcbiAgICAgICAgY29tcG9uZW50OiBEYXNoYm9hcmQsXG4gICAgICAgIGNoaWxkcmVuOiBkYXNoYm9hZFJvdXRlcyxcbiAgICAgICAgYmVmb3JlRW50ZXI6ICh0bywgZnJvbSwgbmV4dCkgPT4ge1xuICAgICAgICAgICAgbG9hZGVyLnN0YXJ0KCdmdWxsJyk7XG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghc3RvcmUuZ2V0dGVyc1snYXV0aC9pc0xvZ2dlZEluJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2IuZmlyZSgnSGVsbG8gd29ybGQgdGhpcyBpcyBtZScsIDIwMDApO1xuXG4gICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gbmV4dCh7IG5hbWU6ICdhdXRoLmxvZ2luJyB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxvYWRlci5zdG9wKCk7XG5cbiAgICAgICAgICAgIH0sIDEwMDApO1xuICAgICAgICAgICAgLy8gbmV4dCgpO1xuXG4gICAgICAgIH1cbiAgICB9LFxuXVxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcm91dGVyL3JvdXRlcy5qcyIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi05Yzk1ZTNlMlxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL0FwcC52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcImIzZjExYTRlXCIsIGNvbnRlbnQsIGZhbHNlKTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTljOTVlM2UyXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vQXBwLnZ1ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgdmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi05Yzk1ZTNlMlxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL0FwcC52dWVcIik7XG4gICAgIGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuICAgICB1cGRhdGUobmV3Q29udGVudCk7XG4gICB9KTtcbiB9XG4gLy8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIhLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtOWM5NWUzZTJcIixcInNjb3BlZFwiOnRydWUsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL0FwcC52dWVcbi8vIG1vZHVsZSBpZCA9IDE3MlxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHRydWUpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiXFxuLnN3aXBlLWVudGVyW2RhdGEtdi05Yzk1ZTNlMl0ge1xcbiAgb3BhY2l0eTogMDtcXG59XFxuLnN3aXBlLWVudGVyLWFjdGl2ZVtkYXRhLXYtOWM5NWUzZTJdIHtcXG4gIGFuaW1hdGlvbjogbW92ZUZyb21Cb3R0b20tZGF0YS12LTljOTVlM2UyIDAuMnMgZm9yd2FyZHM7XFxuICB0cmFuc2l0aW9uOiAwLjNzIGFsbCBlYXNlO1xcbn1cXG4uc3dpcGUtbGVhdmUtYWN0aXZlW2RhdGEtdi05Yzk1ZTNlMl0ge1xcbiAgYW5pbWF0aW9uOiBzY2FsZURvd24tZGF0YS12LTljOTVlM2UyIDAuMnMgZm9yd2FyZHM7XFxuICB0cmFuc2l0aW9uOiAwLjJzIGFsbCBlYXNlO1xcbn1cXG5ALW1vei1rZXlmcmFtZXMgc2NhbGVEb3duIHtcXG50byB7XFxuICAgIG9wYWNpdHk6IDA7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMC44KTtcXG59XFxufVxcbkAtd2Via2l0LWtleWZyYW1lcyBzY2FsZURvd24ge1xcbnRvIHtcXG4gICAgb3BhY2l0eTogMDtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgwLjgpO1xcbn1cXG59XFxuQC1vLWtleWZyYW1lcyBzY2FsZURvd24ge1xcbnRvIHtcXG4gICAgb3BhY2l0eTogMDtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgwLjgpO1xcbn1cXG59XFxuQGtleWZyYW1lcyBzY2FsZURvd24tZGF0YS12LTljOTVlM2UyIHtcXG50byB7XFxuICAgIG9wYWNpdHk6IDA7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMC44KTtcXG59XFxufVxcbkAtbW96LWtleWZyYW1lcyBzY2FsZUluIHtcXG5mcm9tIHtcXG4gICAgb3BhY2l0eTogMDtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgxLjIpO1xcbn1cXG59XFxuQC13ZWJraXQta2V5ZnJhbWVzIHNjYWxlSW4ge1xcbmZyb20ge1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMik7XFxufVxcbn1cXG5ALW8ta2V5ZnJhbWVzIHNjYWxlSW4ge1xcbmZyb20ge1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMik7XFxufVxcbn1cXG5Aa2V5ZnJhbWVzIHNjYWxlSW4tZGF0YS12LTljOTVlM2UyIHtcXG5mcm9tIHtcXG4gICAgb3BhY2l0eTogMDtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgxLjIpO1xcbn1cXG59XFxuQC1tb3ota2V5ZnJhbWVzIG1vdmVGcm9tQm90dG9tIHtcXG5mcm9tIHtcXG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDUwJSk7XFxufVxcbn1cXG5ALXdlYmtpdC1rZXlmcmFtZXMgbW92ZUZyb21Cb3R0b20ge1xcbmZyb20ge1xcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoNTAlKTtcXG59XFxufVxcbkAtby1rZXlmcmFtZXMgbW92ZUZyb21Cb3R0b20ge1xcbmZyb20ge1xcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoNTAlKTtcXG59XFxufVxcbkBrZXlmcmFtZXMgbW92ZUZyb21Cb3R0b20tZGF0YS12LTljOTVlM2UyIHtcXG5mcm9tIHtcXG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDUwJSk7XFxufVxcbn1cXG5cIiwgXCJcIiwge1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9yZXNvdXJjZXMvYXNzZXRzL2pzL0FwcC52dWVcIixcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvQXBwLnZ1ZVwiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiO0FBMkJBO0VBQ0ksV0FBQTtDQzFCSDtBRDZCRDtFQUNJLHdEQUFBO0VBQ0EsMEJBQUE7Q0MzQkg7QURpQ0Q7RUFDSSxtREFBQTtFQUVBLDBCQUFBO0NDaENIO0FEbUNtQjtBQUVuQjtJQUFLLFdBQUE7SUFBWSxzQkFBQTtDQ2hDZjtDQUNGO0FENkJtQjtBQUVuQjtJQUFLLFdBQUE7SUFBWSxzQkFBQTtDQzFCZjtDQUNGO0FEdUJtQjtBQUVuQjtJQUFLLFdBQUE7SUFBWSxzQkFBQTtDQ3BCZjtDQUNGO0FEaUJtQjtBQUVuQjtJQUFLLFdBQUE7SUFBWSxzQkFBQTtDQ2RmO0NBQ0Y7QURlaUI7QUFDakI7SUFBTSxXQUFBO0lBQVksc0JBQUE7Q0NYaEI7Q0FDRjtBRFNpQjtBQUNqQjtJQUFNLFdBQUE7SUFBWSxzQkFBQTtDQ0xoQjtDQUNGO0FER2lCO0FBQ2pCO0lBQU0sV0FBQTtJQUFZLHNCQUFBO0NDQ2hCO0NBQ0Y7QURIaUI7QUFDakI7SUFBTSxXQUFBO0lBQVksc0JBQUE7Q0NPaEI7Q0FDRjtBREx3QjtBQUN4QjtJQUFPLDJCQUFBO0NDUUw7Q0FDRjtBRFZ3QjtBQUN4QjtJQUFPLDJCQUFBO0NDYUw7Q0FDRjtBRGZ3QjtBQUN4QjtJQUFPLDJCQUFBO0NDa0JMO0NBQ0Y7QURwQndCO0FBQ3hCO0lBQU8sMkJBQUE7Q0N1Qkw7Q0FDRlwiLFwiZmlsZVwiOlwiQXBwLnZ1ZVwiLFwic291cmNlc0NvbnRlbnRcIjpbXCJcXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG4uc3dpcGUtZW50ZXIge1xcbiAgICBvcGFjaXR5OiAwO1xcbn1cXG5cXG4uc3dpcGUtZW50ZXItYWN0aXZlIHtcXG4gICAgYW5pbWF0aW9uOiBtb3ZlRnJvbUJvdHRvbSAuMnMgZm9yd2FyZHM7IFxcbiAgICB0cmFuc2l0aW9uIC4zcyBhbGwgZWFzZTtcXG59XFxuXFxuLmZhZGUtbGVhdmUge1xcbn1cXG5cXG4uc3dpcGUtbGVhdmUtYWN0aXZlIHtcXG4gICAgYW5pbWF0aW9uOiBzY2FsZURvd24gLjJzIGZvcndhcmRzO1xcbiAgICAvLyBvcGFjaXR5OiAwO1xcbiAgICB0cmFuc2l0aW9uIC4ycyBhbGwgZWFzZTsgICAgXFxufVxcblxcbkBrZXlmcmFtZXMgc2NhbGVEb3duIHtcXG5cXHRmcm9tIHsgfVxcblxcdHRvIHsgb3BhY2l0eTogMDsgdHJhbnNmb3JtOiBzY2FsZSguOCk7IH1cXG59XFxuQGtleWZyYW1lcyBzY2FsZUluIHtcXG5cXHRmcm9tIHtvcGFjaXR5OiAwOyB0cmFuc2Zvcm06IHNjYWxlKDEuMik7IH1cXG5cXHR0byB7ICB9XFxufVxcbkBrZXlmcmFtZXMgbW92ZUZyb21Cb3R0b20ge1xcblxcdGZyb20geyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoNTAlKTsgfVxcbn1cXG5cIixcIi5zd2lwZS1lbnRlciB7XFxuICBvcGFjaXR5OiAwO1xcbn1cXG4uc3dpcGUtZW50ZXItYWN0aXZlIHtcXG4gIGFuaW1hdGlvbjogbW92ZUZyb21Cb3R0b20gMC4ycyBmb3J3YXJkcztcXG4gIHRyYW5zaXRpb246IDAuM3MgYWxsIGVhc2U7XFxufVxcbi5zd2lwZS1sZWF2ZS1hY3RpdmUge1xcbiAgYW5pbWF0aW9uOiBzY2FsZURvd24gMC4ycyBmb3J3YXJkcztcXG4gIHRyYW5zaXRpb246IDAuMnMgYWxsIGVhc2U7XFxufVxcbkAtbW96LWtleWZyYW1lcyBzY2FsZURvd24ge1xcbiAgdG8ge1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDAuOCk7XFxuICB9XFxufVxcbkAtd2Via2l0LWtleWZyYW1lcyBzY2FsZURvd24ge1xcbiAgdG8ge1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDAuOCk7XFxuICB9XFxufVxcbkAtby1rZXlmcmFtZXMgc2NhbGVEb3duIHtcXG4gIHRvIHtcXG4gICAgb3BhY2l0eTogMDtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgwLjgpO1xcbiAgfVxcbn1cXG5Aa2V5ZnJhbWVzIHNjYWxlRG93biB7XFxuICB0byB7XFxuICAgIG9wYWNpdHk6IDA7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMC44KTtcXG4gIH1cXG59XFxuQC1tb3ota2V5ZnJhbWVzIHNjYWxlSW4ge1xcbiAgZnJvbSB7XFxuICAgIG9wYWNpdHk6IDA7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMS4yKTtcXG4gIH1cXG59XFxuQC13ZWJraXQta2V5ZnJhbWVzIHNjYWxlSW4ge1xcbiAgZnJvbSB7XFxuICAgIG9wYWNpdHk6IDA7XFxuICAgIHRyYW5zZm9ybTogc2NhbGUoMS4yKTtcXG4gIH1cXG59XFxuQC1vLWtleWZyYW1lcyBzY2FsZUluIHtcXG4gIGZyb20ge1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMik7XFxuICB9XFxufVxcbkBrZXlmcmFtZXMgc2NhbGVJbiB7XFxuICBmcm9tIHtcXG4gICAgb3BhY2l0eTogMDtcXG4gICAgdHJhbnNmb3JtOiBzY2FsZSgxLjIpO1xcbiAgfVxcbn1cXG5ALW1vei1rZXlmcmFtZXMgbW92ZUZyb21Cb3R0b20ge1xcbiAgZnJvbSB7XFxuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSg1MCUpO1xcbiAgfVxcbn1cXG5ALXdlYmtpdC1rZXlmcmFtZXMgbW92ZUZyb21Cb3R0b20ge1xcbiAgZnJvbSB7XFxuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSg1MCUpO1xcbiAgfVxcbn1cXG5ALW8ta2V5ZnJhbWVzIG1vdmVGcm9tQm90dG9tIHtcXG4gIGZyb20ge1xcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoNTAlKTtcXG4gIH1cXG59XFxuQGtleWZyYW1lcyBtb3ZlRnJvbUJvdHRvbSB7XFxuICBmcm9tIHtcXG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDUwJSk7XFxuICB9XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi05Yzk1ZTNlMlwiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvQXBwLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMTczXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8qKlxuICogVHJhbnNsYXRlcyB0aGUgbGlzdCBmb3JtYXQgcHJvZHVjZWQgYnkgY3NzLWxvYWRlciBpbnRvIHNvbWV0aGluZ1xuICogZWFzaWVyIHRvIG1hbmlwdWxhdGUuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbGlzdFRvU3R5bGVzIChwYXJlbnRJZCwgbGlzdCkge1xuICB2YXIgc3R5bGVzID0gW11cbiAgdmFyIG5ld1N0eWxlcyA9IHt9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gbGlzdFtpXVxuICAgIHZhciBpZCA9IGl0ZW1bMF1cbiAgICB2YXIgY3NzID0gaXRlbVsxXVxuICAgIHZhciBtZWRpYSA9IGl0ZW1bMl1cbiAgICB2YXIgc291cmNlTWFwID0gaXRlbVszXVxuICAgIHZhciBwYXJ0ID0ge1xuICAgICAgaWQ6IHBhcmVudElkICsgJzonICsgaSxcbiAgICAgIGNzczogY3NzLFxuICAgICAgbWVkaWE6IG1lZGlhLFxuICAgICAgc291cmNlTWFwOiBzb3VyY2VNYXBcbiAgICB9XG4gICAgaWYgKCFuZXdTdHlsZXNbaWRdKSB7XG4gICAgICBzdHlsZXMucHVzaChuZXdTdHlsZXNbaWRdID0geyBpZDogaWQsIHBhcnRzOiBbcGFydF0gfSlcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3U3R5bGVzW2lkXS5wYXJ0cy5wdXNoKHBhcnQpXG4gICAgfVxuICB9XG4gIHJldHVybiBzdHlsZXNcbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2xpc3RUb1N0eWxlcy5qc1xuLy8gbW9kdWxlIGlkID0gMTc0XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIjx0ZW1wbGF0ZT5cbiAgICA8di1hcHA+XG4gICAgICAgIDxyLXRvcC1sb2FkZXI+PC9yLXRvcC1sb2FkZXI+XG4gICAgICAgIDxyLWZ1bGwtbG9hZGVyPjwvci1mdWxsLWxvYWRlcj5cbiAgICAgICAgPHItc25hY2tiYXI+PC9yLXNuYWNrYmFyPlxuICAgIFxuICAgICAgICA8dHJhbnNpdGlvbiBuYW1lPVwic3dpcGVcIiBtb2RlPVwib3V0LWluXCI+XG4gICAgICAgICAgICA8cm91dGVyLXZpZXcga2VlcC1hbGl2ZT48L3JvdXRlci12aWV3PlxuICAgICAgICA8L3RyYW5zaXRpb24+XG4gICAgPC92LWFwcD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5pbXBvcnQgdG9wTG9hZGVyIGZyb20gJ0AvY29tcG9uZW50cy91dGlscy90b3BMb2FkZXInO1xuaW1wb3J0IGZ1bGxMb2FkZXIgZnJvbSAnQC9jb21wb25lbnRzL3V0aWxzL2Z1bGxMb2FkZXInO1xuaW1wb3J0IHNuYWNrYmFyIGZyb20gJ0AvY29tcG9uZW50cy91dGlscy9zbmFja2Jhcic7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIHJUb3BMb2FkZXI6IHRvcExvYWRlcixcbiAgICAgICAgckZ1bGxMb2FkZXI6IGZ1bGxMb2FkZXIsXG4gICAgICAgIHJTbmFja2Jhcjogc25hY2tiYXIsXG4gICAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic3R5bHVzXCIgc2NvcGVkPlxuLnN3aXBlLWVudGVyIHtcbiAgICBvcGFjaXR5OiAwO1xufVxuXG4uc3dpcGUtZW50ZXItYWN0aXZlIHtcbiAgICBhbmltYXRpb246IG1vdmVGcm9tQm90dG9tIC4ycyBmb3J3YXJkczsgXG4gICAgdHJhbnNpdGlvbiAuM3MgYWxsIGVhc2U7XG59XG5cbi5mYWRlLWxlYXZlIHtcbn1cblxuLnN3aXBlLWxlYXZlLWFjdGl2ZSB7XG4gICAgYW5pbWF0aW9uOiBzY2FsZURvd24gLjJzIGZvcndhcmRzO1xuICAgIC8vIG9wYWNpdHk6IDA7XG4gICAgdHJhbnNpdGlvbiAuMnMgYWxsIGVhc2U7ICAgIFxufVxuXG5Aa2V5ZnJhbWVzIHNjYWxlRG93biB7XG5cdGZyb20geyB9XG5cdHRvIHsgb3BhY2l0eTogMDsgdHJhbnNmb3JtOiBzY2FsZSguOCk7IH1cbn1cbkBrZXlmcmFtZXMgc2NhbGVJbiB7XG5cdGZyb20ge29wYWNpdHk6IDA7IHRyYW5zZm9ybTogc2NhbGUoMS4yKTsgfVxuXHR0byB7ICB9XG59XG5Aa2V5ZnJhbWVzIG1vdmVGcm9tQm90dG9tIHtcblx0ZnJvbSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSg1MCUpOyB9XG59XG48L3N0eWxlPlxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIEFwcC52dWU/ZjllNjcwNjYiLCJ2YXIgZGlzcG9zZWQgPSBmYWxzZVxuZnVuY3Rpb24gaW5qZWN0U3R5bGUgKHNzckNvbnRleHQpIHtcbiAgaWYgKGRpc3Bvc2VkKSByZXR1cm5cbiAgcmVxdWlyZShcIiEhdnVlLXN0eWxlLWxvYWRlciFjc3MtbG9hZGVyP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXg/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWY1ZDk3NzVhXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXN0eWxlcyZpbmRleD0wIS4vdG9wTG9hZGVyLnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi90b3BMb2FkZXIudnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi1mNWQ5Nzc1YVxcXCIsXFxcImhhc1Njb3BlZFxcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3RvcExvYWRlci52dWVcIiksXG4gIC8qIHN0eWxlcyAqL1xuICBpbmplY3RTdHlsZSxcbiAgLyogc2NvcGVJZCAqL1xuICBcImRhdGEtdi1mNWQ5Nzc1YVwiLFxuICAvKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbiAgbnVsbFxuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvdG9wTG9hZGVyLnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gdG9wTG9hZGVyLnZ1ZTogZnVuY3Rpb25hbCBjb21wb25lbnRzIGFyZSBub3Qgc3VwcG9ydGVkIHdpdGggdGVtcGxhdGVzLCB0aGV5IHNob3VsZCB1c2UgcmVuZGVyIGZ1bmN0aW9ucy5cIil9XG5cbi8qIGhvdCByZWxvYWQgKi9cbmlmIChtb2R1bGUuaG90KSB7KGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhvdEFQSSA9IHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIilcbiAgaG90QVBJLmluc3RhbGwocmVxdWlyZShcInZ1ZVwiKSwgZmFsc2UpXG4gIGlmICghaG90QVBJLmNvbXBhdGlibGUpIHJldHVyblxuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmICghbW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgaG90QVBJLmNyZWF0ZVJlY29yZChcImRhdGEtdi1mNWQ5Nzc1YVwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfSBlbHNlIHtcbiAgICBob3RBUEkucmVsb2FkKFwiZGF0YS12LWY1ZDk3NzVhXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9XG4gIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbiAoZGF0YSkge1xuICAgIGRpc3Bvc2VkID0gdHJ1ZVxuICB9KVxufSkoKX1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQuZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvdG9wTG9hZGVyLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMTc2XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi1mNWQ5Nzc1YVxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3RvcExvYWRlci52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcIjE0ZGVjY2Q4XCIsIGNvbnRlbnQsIGZhbHNlKTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWY1ZDk3NzVhXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vdG9wTG9hZGVyLnZ1ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgdmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi1mNWQ5Nzc1YVxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3RvcExvYWRlci52dWVcIik7XG4gICAgIGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuICAgICB1cGRhdGUobmV3Q29udGVudCk7XG4gICB9KTtcbiB9XG4gLy8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIhLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtZjVkOTc3NWFcIixcInNjb3BlZFwiOnRydWUsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL3RvcExvYWRlci52dWVcbi8vIG1vZHVsZSBpZCA9IDE3N1xuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHRydWUpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiXFxuI3RvcC1sb2FkZXJbZGF0YS12LWY1ZDk3NzVhXXtcXG4gICAgcG9zaXRpb246IGZpeGVkO1xcbiAgICB3aWR0aDogMTAwJTtcXG4gICAgei1pbmRleDogMTA7XFxufVxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvdG9wTG9hZGVyLnZ1ZT9kZDU3NGYzYVwiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiO0FBMEJBO0lBQ0EsZ0JBQUE7SUFDQSxZQUFBO0lBQ0EsWUFBQTtDQUNBXCIsXCJmaWxlXCI6XCJ0b3BMb2FkZXIudnVlXCIsXCJzb3VyY2VzQ29udGVudFwiOltcIjx0ZW1wbGF0ZT5cXG4gICAgPGRpdiBpZD1cXFwidG9wLWxvYWRlclxcXCI+XFxuICAgICAgICA8di1wcm9ncmVzcy1saW5lYXIgOmFjdGl2ZT1cXFwiaXNMb2FkaW5nXFxcIiBoZWlnaHQ9XFxcIjRcXFwiIHYtbW9kZWw9XFxcInByb2dyZXNzXFxcIiA6aW5kZXRlcm1pbmF0ZT1cXFwidW5rbm93blByb2dyZXNzXFxcIiBjbGFzcz1cXFwibWEtMFxcXCIgc2Vjb25kYXJ5Pjwvdi1wcm9ncmVzcy1saW5lYXI+XFxuICAgIDwvZGl2PlxcbjwvdGVtcGxhdGU+XFxuXFxuPHNjcmlwdD5cXG5pbXBvcnQge21hcEdldHRlcnN9IGZyb20gJ3Z1ZXgnO1xcbmltcG9ydCBzdG9yZVR5cGVzIGZyb20gJy4vLi4vLi4vc3RvcmUvdHlwZXMnO1xcblxcbmV4cG9ydCBkZWZhdWx0IHtcXG4gICAgIGRhdGE6ICgpID0+ICh7XFxuICAgICAgICAvLyBsb2FkZXI6IHRydWVcXG4gICAgICAgIHByb2dyZXNzOiBudWxsXFxuICAgIH0pLFxcbiAgICBjb21wdXRlZDoge1xcbiAgICAgICAgdW5rbm93blByb2dyZXNzKCl7XFxuICAgICAgICAgICAgcmV0dXJuICFOdW1iZXIuaXNJbnRlZ2VyKHRoaXMucHJvZ3Jlc3MpID8gdHJ1ZSA6IGZhbHNlO1xcbiAgICAgICAgfSxcXG4gICAgICAgIC4uLm1hcEdldHRlcnMoe1xcbiAgICAgICAgICAgICdpc0xvYWRpbmcnOiBzdG9yZVR5cGVzLklTX0xPQURJTkdcXG4gICAgICAgIH0pXFxuICAgIH1cXG59XFxuPC9zY3JpcHQ+XFxuPHN0eWxlIHNjb3BlZD5cXG4gICAgI3RvcC1sb2FkZXJ7XFxuICAgICAgICBwb3NpdGlvbjogZml4ZWQ7XFxuICAgICAgICB3aWR0aDogMTAwJTtcXG4gICAgICAgIHotaW5kZXg6IDEwO1xcbiAgICB9XFxuPC9zdHlsZT5cXG5cIl0sXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtZjVkOTc3NWFcIixcInNjb3BlZFwiOnRydWUsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL3RvcExvYWRlci52dWVcbi8vIG1vZHVsZSBpZCA9IDE3OFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCI8dGVtcGxhdGU+XG4gICAgPGRpdiBpZD1cInRvcC1sb2FkZXJcIj5cbiAgICAgICAgPHYtcHJvZ3Jlc3MtbGluZWFyIDphY3RpdmU9XCJpc0xvYWRpbmdcIiBoZWlnaHQ9XCI0XCIgdi1tb2RlbD1cInByb2dyZXNzXCIgOmluZGV0ZXJtaW5hdGU9XCJ1bmtub3duUHJvZ3Jlc3NcIiBjbGFzcz1cIm1hLTBcIiBzZWNvbmRhcnk+PC92LXByb2dyZXNzLWxpbmVhcj5cbiAgICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5pbXBvcnQge21hcEdldHRlcnN9IGZyb20gJ3Z1ZXgnO1xuaW1wb3J0IHN0b3JlVHlwZXMgZnJvbSAnLi8uLi8uLi9zdG9yZS90eXBlcyc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICAgZGF0YTogKCkgPT4gKHtcbiAgICAgICAgLy8gbG9hZGVyOiB0cnVlXG4gICAgICAgIHByb2dyZXNzOiBudWxsXG4gICAgfSksXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgdW5rbm93blByb2dyZXNzKCl7XG4gICAgICAgICAgICByZXR1cm4gIU51bWJlci5pc0ludGVnZXIodGhpcy5wcm9ncmVzcykgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIC4uLm1hcEdldHRlcnMoe1xuICAgICAgICAgICAgJ2lzTG9hZGluZyc6IHN0b3JlVHlwZXMuSVNfTE9BRElOR1xuICAgICAgICB9KVxuICAgIH1cbn1cbjwvc2NyaXB0PlxuPHN0eWxlIHNjb3BlZD5cbiAgICAjdG9wLWxvYWRlcntcbiAgICAgICAgcG9zaXRpb246IGZpeGVkO1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgei1pbmRleDogMTA7XG4gICAgfVxuPC9zdHlsZT5cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyB0b3BMb2FkZXIudnVlP2RkNTc0ZjNhIiwibW9kdWxlLmV4cG9ydHM9e3JlbmRlcjpmdW5jdGlvbiAoKXt2YXIgX3ZtPXRoaXM7dmFyIF9oPV92bS4kY3JlYXRlRWxlbWVudDt2YXIgX2M9X3ZtLl9zZWxmLl9jfHxfaDtcbiAgcmV0dXJuIF9jKCdkaXYnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwiaWRcIjogXCJ0b3AtbG9hZGVyXCJcbiAgICB9XG4gIH0sIFtfYygndi1wcm9ncmVzcy1saW5lYXInLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwibWEtMFwiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcImFjdGl2ZVwiOiBfdm0uaXNMb2FkaW5nLFxuICAgICAgXCJoZWlnaHRcIjogXCI0XCIsXG4gICAgICBcImluZGV0ZXJtaW5hdGVcIjogX3ZtLnVua25vd25Qcm9ncmVzcyxcbiAgICAgIFwic2Vjb25kYXJ5XCI6IFwiXCJcbiAgICB9LFxuICAgIG1vZGVsOiB7XG4gICAgICB2YWx1ZTogKF92bS5wcm9ncmVzcyksXG4gICAgICBjYWxsYmFjazogZnVuY3Rpb24oJCR2KSB7XG4gICAgICAgIF92bS5wcm9ncmVzcyA9ICQkdlxuICAgICAgfSxcbiAgICAgIGV4cHJlc3Npb246IFwicHJvZ3Jlc3NcIlxuICAgIH1cbiAgfSldLCAxKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi1mNWQ5Nzc1YVwiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtZjVkOTc3NWFcIixcImhhc1Njb3BlZFwiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy90b3BMb2FkZXIudnVlXG4vLyBtb2R1bGUgaWQgPSAxODBcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbmZ1bmN0aW9uIGluamVjdFN0eWxlIChzc3JDb250ZXh0KSB7XG4gIGlmIChkaXNwb3NlZCkgcmV0dXJuXG4gIHJlcXVpcmUoXCIhIXZ1ZS1zdHlsZS1sb2FkZXIhY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0wZWFlOGI4N1xcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hc3R5bHVzLWxvYWRlciEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2Z1bGxMb2FkZXIudnVlXCIpXG59XG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIikoXG4gIC8qIHNjcmlwdCAqL1xuICByZXF1aXJlKFwiISFiYWJlbC1sb2FkZXI/e1xcXCJjYWNoZURpcmVjdG9yeVxcXCI6dHJ1ZSxcXFwicHJlc2V0c1xcXCI6W1tcXFwiZW52XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlLFxcXCJ0YXJnZXRzXFxcIjp7XFxcImJyb3dzZXJzXFxcIjpbXFxcIj4gMiVcXFwiXSxcXFwidWdsaWZ5XFxcIjp0cnVlfX1dLFtcXFwiZXMyMDE1XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlfV0sW1xcXCJzdGFnZS0yXFxcIl1dfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL2Z1bGxMb2FkZXIudnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi0wZWFlOGI4N1xcXCIsXFxcImhhc1Njb3BlZFxcXCI6ZmFsc2V9IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9mdWxsTG9hZGVyLnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIG51bGwsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy9mdWxsTG9hZGVyLnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gZnVsbExvYWRlci52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtMGVhZThiODdcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi0wZWFlOGI4N1wiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL2Z1bGxMb2FkZXIudnVlXG4vLyBtb2R1bGUgaWQgPSAxODFcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTBlYWU4Yjg3XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2Z1bGxMb2FkZXIudnVlXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXNDbGllbnQuanNcIikoXCIxN2UyMmZiMFwiLCBjb250ZW50LCBmYWxzZSk7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG4gLy8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3NcbiBpZighY29udGVudC5sb2NhbHMpIHtcbiAgIG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0wZWFlOGI4N1xcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9mdWxsTG9hZGVyLnZ1ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgdmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0wZWFlOGI4N1xcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9mdWxsTG9hZGVyLnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi0wZWFlOGI4N1wiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvZnVsbExvYWRlci52dWVcbi8vIG1vZHVsZSBpZCA9IDE4MlxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHRydWUpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiXFxuLndob2xlcGFnZSB7XFxuICBwb3NpdGlvbjogZml4ZWQ7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDI1NSwyNTUsMjU1LDAuOSk7XFxuICB3aWR0aDogMTAwJTtcXG4gIGhlaWdodDogMTAwJTtcXG4gIHRvcDogMHB4O1xcbiAgei1pbmRleDogOTA7XFxufVxcbi5zY2FsZWluLWxlYXZlLWFjdGl2ZSxcXG4uc2NhbGVpbi1lbnRlci1hY3RpdmUge1xcbiAgdHJhbnNpdGlvbjogYWxsIDAuMnM7XFxufVxcbi5zY2FsZWluLWVudGVyIHtcXG4gIG9wYWNpdHk6IDA7XFxufVxcbi5zY2FsZWluLWxlYXZlLXRvIHtcXG4gIG9wYWNpdHk6IDA7XFxufVxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL2Z1bGxMb2FkZXIudnVlXCIsXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvZnVsbExvYWRlci52dWVcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIjtBQW1DQTtFQUNJLGdCQUFBO0VBQ0Esd0NBQUE7RUFDQSxZQUFBO0VBQ0EsYUFBQTtFQUNBLFNBQUE7RUFDQSxZQUFBO0NDbENIO0FEb0NEOztFQUNJLHFCQUFBO0NDakNIO0FEbUNEO0VBQ0ksV0FBQTtDQ2pDSDtBRG9DRDtFQUNJLFdBQUE7Q0NsQ0hcIixcImZpbGVcIjpcImZ1bGxMb2FkZXIudnVlXCIsXCJzb3VyY2VzQ29udGVudFwiOltcIlxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcbi53aG9sZXBhZ2V7XFxuICAgIHBvc2l0aW9uOiBmaXhlZDtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnRpZnkoI2ZmZiwgMC45KTtcXG4gICAgd2lkdGg6IDEwMCU7XFxuICAgIGhlaWdodDogMTAwJTtcXG4gICAgdG9wOiAwcHg7XFxuICAgIHotaW5kZXg6IDkwO1xcbn1cXG4uc2NhbGVpbi1sZWF2ZS1hY3RpdmUsIC5zY2FsZWluLWVudGVyLWFjdGl2ZSB7XFxuICAgIHRyYW5zaXRpb246IGFsbCAuMnM7XFxufVxcbi5zY2FsZWluLWVudGVyIHtcXG4gICAgb3BhY2l0eTogMDtcXG4gICAgLy8gdHJhbnNmb3JtOiBzY2FsZSgzKTtcXG59XFxuLnNjYWxlaW4tbGVhdmUtdG8ge1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICAvLyB0cmFuc2Zvcm06IHNjYWxlKDIpO1xcbn1cXG4vLyAuc2NhbGVpbi1sZWF2ZS1hY3RpdmUge1xcbi8vICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuLy8gfVxcblwiLFwiLndob2xlcGFnZSB7XFxuICBwb3NpdGlvbjogZml4ZWQ7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDI1NSwyNTUsMjU1LDAuOSk7XFxuICB3aWR0aDogMTAwJTtcXG4gIGhlaWdodDogMTAwJTtcXG4gIHRvcDogMHB4O1xcbiAgei1pbmRleDogOTA7XFxufVxcbi5zY2FsZWluLWxlYXZlLWFjdGl2ZSxcXG4uc2NhbGVpbi1lbnRlci1hY3RpdmUge1xcbiAgdHJhbnNpdGlvbjogYWxsIDAuMnM7XFxufVxcbi5zY2FsZWluLWVudGVyIHtcXG4gIG9wYWNpdHk6IDA7XFxufVxcbi5zY2FsZWluLWxlYXZlLXRvIHtcXG4gIG9wYWNpdHk6IDA7XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi0wZWFlOGI4N1wiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvZnVsbExvYWRlci52dWVcbi8vIG1vZHVsZSBpZCA9IDE4M1xuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCI8dGVtcGxhdGU+XG4gICAgPHRyYW5zaXRpb24gbmFtZT1cInNjYWxlaW5cIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIndob2xlcGFnZVwiIHYtaWY9XCJpc0Z1bGxMb2FkaW5nXCIgZmlsbC1oZWlnaHQ+XG4gICAgICAgICAgICA8di1sYXlvdXQgYWxpZ24tY2VudGVyIGZpbGwtaGVpZ2h0IGp1c3RpZnktY2VudGVyPlxuICAgICAgICAgICAgICAgIDx2LXByb2dyZXNzLWNpcmN1bGFyIGluZGV0ZXJtaW5hdGUgOnNpemU9XCJzaXplXCIgOndpZHRoPSd3aWR0aCcgY2xhc3M9XCJwcmltYXJ5LS10ZXh0XCIgQGNsaWNrPVwic3RvcFNpdGVMb2FkaW5nXCIgc2Vjb25kYXJ5Pjwvdi1wcm9ncmVzcy1jaXJjdWxhcj5cbiAgICAgICAgICAgIDwvdi1sYXlvdXQ+XG4gICAgICAgIDwvZGl2PlxuICAgIDwvdHJhbnNpdGlvbj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5pbXBvcnQgeyBtYXBHZXR0ZXJzLCBtYXBNdXRhdGlvbnMgfSBmcm9tICd2dWV4JztcbmltcG9ydCBzdG9yZVR5cGVzIGZyb20gJy4vLi4vLi4vc3RvcmUvdHlwZXMnO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgZGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNpemU6IDcwLFxuICAgICAgICAgICAgd2lkdGg6IDVcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgLi4ubWFwR2V0dGVycyh7XG4gICAgICAgICAgICAnaXNGdWxsTG9hZGluZycgOiBzdG9yZVR5cGVzLklTX0ZVTExfTE9BRElOR1xuICAgICAgICB9KVxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICAuLi5tYXBNdXRhdGlvbnMoe1xuICAgICAgICAgICAgJ3N0b3BTaXRlTG9hZGluZycgOiBzdG9yZVR5cGVzLlNUT1BfTE9BRElOR1xuICAgICAgICB9KVxuICAgIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInN0eWx1c1wiPlxuICAgIC53aG9sZXBhZ2V7XG4gICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnRpZnkoI2ZmZiwgMC45KTtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgdG9wOiAwcHg7XG4gICAgICAgIHotaW5kZXg6IDkwO1xuICAgIH1cbiAgICAuc2NhbGVpbi1sZWF2ZS1hY3RpdmUsIC5zY2FsZWluLWVudGVyLWFjdGl2ZSB7XG4gICAgICAgIHRyYW5zaXRpb246IGFsbCAuMnM7XG4gICAgfVxuICAgIC5zY2FsZWluLWVudGVyIHtcbiAgICAgICAgb3BhY2l0eTogMDtcbiAgICAgICAgLy8gdHJhbnNmb3JtOiBzY2FsZSgzKTtcbiAgICB9XG4gICAgLnNjYWxlaW4tbGVhdmUtdG8ge1xuICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICAvLyB0cmFuc2Zvcm06IHNjYWxlKDIpO1xuICAgIH1cbiAgICAvLyAuc2NhbGVpbi1sZWF2ZS1hY3RpdmUge1xuICAgIC8vICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgLy8gfVxuPC9zdHlsZT5cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyBmdWxsTG9hZGVyLnZ1ZT81NTk3YWI5OCIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygndHJhbnNpdGlvbicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJuYW1lXCI6IFwic2NhbGVpblwiXG4gICAgfVxuICB9LCBbKF92bS5pc0Z1bGxMb2FkaW5nKSA/IF9jKCdkaXYnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwid2hvbGVwYWdlXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwiZmlsbC1oZWlnaHRcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LWxheW91dCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJhbGlnbi1jZW50ZXJcIjogXCJcIixcbiAgICAgIFwiZmlsbC1oZWlnaHRcIjogXCJcIixcbiAgICAgIFwianVzdGlmeS1jZW50ZXJcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LXByb2dyZXNzLWNpcmN1bGFyJywge1xuICAgIHN0YXRpY0NsYXNzOiBcInByaW1hcnktLXRleHRcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJpbmRldGVybWluYXRlXCI6IFwiXCIsXG4gICAgICBcInNpemVcIjogX3ZtLnNpemUsXG4gICAgICBcIndpZHRoXCI6IF92bS53aWR0aCxcbiAgICAgIFwic2Vjb25kYXJ5XCI6IFwiXCJcbiAgICB9LFxuICAgIG9uOiB7XG4gICAgICBcImNsaWNrXCI6IF92bS5zdG9wU2l0ZUxvYWRpbmdcbiAgICB9XG4gIH0pXSwgMSldLCAxKSA6IF92bS5fZSgpXSlcbn0sc3RhdGljUmVuZGVyRm5zOiBbXX1cbm1vZHVsZS5leHBvcnRzLnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgIHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIikucmVyZW5kZXIoXCJkYXRhLXYtMGVhZThiODdcIiwgbW9kdWxlLmV4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LTBlYWU4Yjg3XCIsXCJoYXNTY29wZWRcIjpmYWxzZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL2Z1bGxMb2FkZXIudnVlXG4vLyBtb2R1bGUgaWQgPSAxODVcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbmZ1bmN0aW9uIGluamVjdFN0eWxlIChzc3JDb250ZXh0KSB7XG4gIGlmIChkaXNwb3NlZCkgcmV0dXJuXG4gIHJlcXVpcmUoXCIhIXZ1ZS1zdHlsZS1sb2FkZXIhY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi00NGJiZGFjYVxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9zbmFja2Jhci52dWVcIilcbn1cbnZhciBDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplclwiKShcbiAgLyogc2NyaXB0ICovXG4gIHJlcXVpcmUoXCIhIWJhYmVsLWxvYWRlcj97XFxcImNhY2hlRGlyZWN0b3J5XFxcIjp0cnVlLFxcXCJwcmVzZXRzXFxcIjpbW1xcXCJlbnZcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2UsXFxcInRhcmdldHNcXFwiOntcXFwiYnJvd3NlcnNcXFwiOltcXFwiPiAyJVxcXCJdLFxcXCJ1Z2xpZnlcXFwiOnRydWV9fV0sW1xcXCJlczIwMTVcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2V9XSxbXFxcInN0YWdlLTJcXFwiXV19IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vc25hY2tiYXIudnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi00NGJiZGFjYVxcXCIsXFxcImhhc1Njb3BlZFxcXCI6ZmFsc2V9IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9zbmFja2Jhci52dWVcIiksXG4gIC8qIHN0eWxlcyAqL1xuICBpbmplY3RTdHlsZSxcbiAgLyogc2NvcGVJZCAqL1xuICBudWxsLFxuICAvKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbiAgbnVsbFxuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvc25hY2tiYXIudnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSBzbmFja2Jhci52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtNDRiYmRhY2FcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi00NGJiZGFjYVwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3V0aWxzL3NuYWNrYmFyLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMTg2XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi00NGJiZGFjYVxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9zbmFja2Jhci52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcImVjN2IzZDgyXCIsIGNvbnRlbnQsIGZhbHNlKTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTQ0YmJkYWNhXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3NuYWNrYmFyLnZ1ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgdmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi00NGJiZGFjYVxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9zbmFja2Jhci52dWVcIik7XG4gICAgIGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuICAgICB1cGRhdGUobmV3Q29udGVudCk7XG4gICB9KTtcbiB9XG4gLy8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIhLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtNDRiYmRhY2FcIixcInNjb3BlZFwiOmZhbHNlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy91dGlscy9zbmFja2Jhci52dWVcbi8vIG1vZHVsZSBpZCA9IDE4N1xuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHRydWUpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXCIsIFwiXCIsIHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJcIixcImZpbGVcIjpcInNuYWNrYmFyLnZ1ZVwiLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTQ0YmJkYWNhXCIsXCJzY29wZWRcIjpmYWxzZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvc25hY2tiYXIudnVlXG4vLyBtb2R1bGUgaWQgPSAxODhcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiPHRlbXBsYXRlPlxuICAgIDx2LXNuYWNrYmFyIHYtbW9kZWw9XCJzbmFja2JhclwiIDp0aW1lb3V0PVwibWVzc2FnZS50aW1lXCIgOnRvcD1cImRldGVybWluZVBvc2l0aW9uWSgndG9wJylcIiA6Ym90dG9tPVwiZGV0ZXJtaW5lUG9zaXRpb25ZKCdib3R0b20nKVwiIDpyaWdodD1cImRldGVybWluZVBvc2l0aW9uWCgncmlnaHQnKVwiIDpsZWZ0PVwiZGV0ZXJtaW5lUG9zaXRpb25YKCdsZWZ0JylcIiA6bXVsdGktbGluZT1cInRydWVcIiA6aW5mbz1cImRldGVybWluZUxhYmVsKCdpbmZvJylcIiA6c3VjY2Vzcz1cImRldGVybWluZUxhYmVsKCdzdWNjZXNzJylcIiA6d2FybmluZz1cImRldGVybWluZUxhYmVsKCd3YXJuaW5nJylcIiA6ZXJyb3I9XCJkZXRlcm1pbmVMYWJlbCgnZXJyb3InKVwiIDpwcmltYXJ5PVwiZGV0ZXJtaW5lTGFiZWwoJ3ByaW1hcnknKVwiIDpzZWNvbmRhcnk9XCJkZXRlcm1pbmVMYWJlbCgnc2Vjb25kYXJ5JylcIj5cbiAgICAgICAge3sgbWVzc2FnZS50ZXh0IH19XG4gICAgICAgIDx2LWJ0biB2LWlmPVwibWVzc2FnZS5jYWxsYmFja1wiIGZsYXQgZGFyayBAY2xpY2submF0aXZlPVwiY2FsbGJhY2tBbmRDbG9zZVwiPnt7bWVzc2FnZS5jYWxsYmFja19sYWJlbH19PC92LWJ0bj5cbiAgICBcbiAgICAgICAgPHYtYnRuIHYtaWY9XCJtZXNzYWdlLmNsb3NlXCIgZmxhdCBkYXJrIEBjbGljay5uYXRpdmU9XCJzbmFja2JhciA9IGZhbHNlXCI+Q0xPU0U8L3YtYnRuPlxuICAgIDwvdi1zbmFja2Jhcj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5pbXBvcnQgeyBtYXBHZXR0ZXJzLCBtYXBNdXRhdGlvbnMgfSBmcm9tICd2dWV4JztcbmltcG9ydCBzdG9yZVR5cGVzIGZyb20gJy4vLi4vLi4vc3RvcmUvdHlwZXMnO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgc25hY2tiYXI6IHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNob3dNZXNzYWdlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTWVzc2FnZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAuLi5tYXBHZXR0ZXJzKHN0b3JlVHlwZXMuc25hY2tiYXIuTkFNRSwge1xuICAgICAgICAgICAgc2hvd01lc3NhZ2U6IHN0b3JlVHlwZXMuc25hY2tiYXIuR0VUX01FU1NBR0VfVklTSUJJTElUWSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IHN0b3JlVHlwZXMuc25hY2tiYXIuR0VUX01FU1NBR0UsXG4gICAgICAgIH0pXG5cbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgLi4ubWFwTXV0YXRpb25zKHN0b3JlVHlwZXMuc25hY2tiYXIuTkFNRSwge1xuICAgICAgICAgICAgY2xlYXJNZXNzYWdlOiBzdG9yZVR5cGVzLnNuYWNrYmFyLkNMRUFSX1NOQUNLQkFSXG4gICAgICAgIH0pLFxuICAgICAgICBjYWxsYmFja0FuZENsb3NlKCkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlLmNhbGxiYWNrKCk7XG4gICAgICAgICAgICB0aGlzLnNuYWNrYmFyID0gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGRldGVybWluZVBvc2l0aW9uWChwb3MpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2UucG9zaXRpb24ueCA9PT0gcG9zXG4gICAgICAgIH0sXG4gICAgICAgIGRldGVybWluZVBvc2l0aW9uWShwb3MpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2UucG9zaXRpb24ueSA9PT0gcG9zXG4gICAgICAgIH0sXG4gICAgICAgIGRldGVybWluZUxhYmVsKGxhYmVsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tZXNzYWdlLmxhYmVsID09PSBsYWJlbFxuICAgICAgICB9XG4gICAgfSxcbn1cbjwvc2NyaXB0PlxuXG48c3R5bGU+XG5cbjwvc3R5bGU+XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gc25hY2tiYXIudnVlPzA2NjAzOWI4IiwibW9kdWxlLmV4cG9ydHM9e3JlbmRlcjpmdW5jdGlvbiAoKXt2YXIgX3ZtPXRoaXM7dmFyIF9oPV92bS4kY3JlYXRlRWxlbWVudDt2YXIgX2M9X3ZtLl9zZWxmLl9jfHxfaDtcbiAgcmV0dXJuIF9jKCd2LXNuYWNrYmFyJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInRpbWVvdXRcIjogX3ZtLm1lc3NhZ2UudGltZSxcbiAgICAgIFwidG9wXCI6IF92bS5kZXRlcm1pbmVQb3NpdGlvblkoJ3RvcCcpLFxuICAgICAgXCJib3R0b21cIjogX3ZtLmRldGVybWluZVBvc2l0aW9uWSgnYm90dG9tJyksXG4gICAgICBcInJpZ2h0XCI6IF92bS5kZXRlcm1pbmVQb3NpdGlvblgoJ3JpZ2h0JyksXG4gICAgICBcImxlZnRcIjogX3ZtLmRldGVybWluZVBvc2l0aW9uWCgnbGVmdCcpLFxuICAgICAgXCJtdWx0aS1saW5lXCI6IHRydWUsXG4gICAgICBcImluZm9cIjogX3ZtLmRldGVybWluZUxhYmVsKCdpbmZvJyksXG4gICAgICBcInN1Y2Nlc3NcIjogX3ZtLmRldGVybWluZUxhYmVsKCdzdWNjZXNzJyksXG4gICAgICBcIndhcm5pbmdcIjogX3ZtLmRldGVybWluZUxhYmVsKCd3YXJuaW5nJyksXG4gICAgICBcImVycm9yXCI6IF92bS5kZXRlcm1pbmVMYWJlbCgnZXJyb3InKSxcbiAgICAgIFwicHJpbWFyeVwiOiBfdm0uZGV0ZXJtaW5lTGFiZWwoJ3ByaW1hcnknKSxcbiAgICAgIFwic2Vjb25kYXJ5XCI6IF92bS5kZXRlcm1pbmVMYWJlbCgnc2Vjb25kYXJ5JylcbiAgICB9LFxuICAgIG1vZGVsOiB7XG4gICAgICB2YWx1ZTogKF92bS5zbmFja2JhciksXG4gICAgICBjYWxsYmFjazogZnVuY3Rpb24oJCR2KSB7XG4gICAgICAgIF92bS5zbmFja2JhciA9ICQkdlxuICAgICAgfSxcbiAgICAgIGV4cHJlc3Npb246IFwic25hY2tiYXJcIlxuICAgIH1cbiAgfSwgW192bS5fdihcIlxcbiAgICBcIiArIF92bS5fcyhfdm0ubWVzc2FnZS50ZXh0KSArIFwiXFxuICAgIFwiKSwgKF92bS5tZXNzYWdlLmNhbGxiYWNrKSA/IF9jKCd2LWJ0bicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJmbGF0XCI6IFwiXCIsXG4gICAgICBcImRhcmtcIjogXCJcIlxuICAgIH0sXG4gICAgbmF0aXZlT246IHtcbiAgICAgIFwiY2xpY2tcIjogZnVuY3Rpb24oJGV2ZW50KSB7XG4gICAgICAgIF92bS5jYWxsYmFja0FuZENsb3NlKCRldmVudClcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtfdm0uX3YoX3ZtLl9zKF92bS5tZXNzYWdlLmNhbGxiYWNrX2xhYmVsKSldKSA6IF92bS5fZSgpLCBfdm0uX3YoXCIgXCIpLCAoX3ZtLm1lc3NhZ2UuY2xvc2UpID8gX2MoJ3YtYnRuJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImZsYXRcIjogXCJcIixcbiAgICAgIFwiZGFya1wiOiBcIlwiXG4gICAgfSxcbiAgICBuYXRpdmVPbjoge1xuICAgICAgXCJjbGlja1wiOiBmdW5jdGlvbigkZXZlbnQpIHtcbiAgICAgICAgX3ZtLnNuYWNrYmFyID0gZmFsc2VcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtfdm0uX3YoXCJDTE9TRVwiKV0pIDogX3ZtLl9lKCldLCAxKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi00NGJiZGFjYVwiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtNDRiYmRhY2FcIixcImhhc1Njb3BlZFwiOmZhbHNlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvdXRpbHMvc25hY2tiYXIudnVlXG4vLyBtb2R1bGUgaWQgPSAxOTBcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwibW9kdWxlLmV4cG9ydHM9e3JlbmRlcjpmdW5jdGlvbiAoKXt2YXIgX3ZtPXRoaXM7dmFyIF9oPV92bS4kY3JlYXRlRWxlbWVudDt2YXIgX2M9X3ZtLl9zZWxmLl9jfHxfaDtcbiAgcmV0dXJuIF9jKCd2LWFwcCcsIFtfYygnci10b3AtbG9hZGVyJyksIF92bS5fdihcIiBcIiksIF9jKCdyLWZ1bGwtbG9hZGVyJyksIF92bS5fdihcIiBcIiksIF9jKCdyLXNuYWNrYmFyJyksIF92bS5fdihcIiBcIiksIF9jKCd0cmFuc2l0aW9uJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcIm5hbWVcIjogXCJzd2lwZVwiLFxuICAgICAgXCJtb2RlXCI6IFwib3V0LWluXCJcbiAgICB9XG4gIH0sIFtfYygncm91dGVyLXZpZXcnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwia2VlcC1hbGl2ZVwiOiBcIlwiXG4gICAgfVxuICB9KV0sIDEpXSwgMSlcbn0sc3RhdGljUmVuZGVyRm5zOiBbXX1cbm1vZHVsZS5leHBvcnRzLnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgIHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIikucmVyZW5kZXIoXCJkYXRhLXYtOWM5NWUzZTJcIiwgbW9kdWxlLmV4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LTljOTVlM2UyXCIsXCJoYXNTY29wZWRcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL0FwcC52dWVcbi8vIG1vZHVsZSBpZCA9IDE5MVxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJ2YXIgZGlzcG9zZWQgPSBmYWxzZVxuZnVuY3Rpb24gaW5qZWN0U3R5bGUgKHNzckNvbnRleHQpIHtcbiAgaWYgKGRpc3Bvc2VkKSByZXR1cm5cbiAgcmVxdWlyZShcIiEhdnVlLXN0eWxlLWxvYWRlciFjc3MtbG9hZGVyP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXg/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTQ1ZTdkZTg0XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSFzdHlsdXMtbG9hZGVyIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXN0eWxlcyZpbmRleD0wIS4vaW5kZXhQYWdlLnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi9pbmRleFBhZ2UudnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi00NWU3ZGU4NFxcXCIsXFxcImhhc1Njb3BlZFxcXCI6ZmFsc2V9IS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9pbmRleFBhZ2UudnVlXCIpLFxuICAvKiBzdHlsZXMgKi9cbiAgaW5qZWN0U3R5bGUsXG4gIC8qIHNjb3BlSWQgKi9cbiAgbnVsbCxcbiAgLyogbW9kdWxlSWRlbnRpZmllciAoc2VydmVyIG9ubHkpICovXG4gIG51bGxcbilcbkNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9pbmRleFBhZ2UudnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSBpbmRleFBhZ2UudnVlOiBmdW5jdGlvbmFsIGNvbXBvbmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0ZW1wbGF0ZXMsIHRoZXkgc2hvdWxkIHVzZSByZW5kZXIgZnVuY3Rpb25zLlwiKX1cblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LTQ1ZTdkZTg0XCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtNDVlN2RlODRcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvaW5kZXhQYWdlLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMTkyXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi00NWU3ZGU4NFxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9pbmRleFBhZ2UudnVlXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXNDbGllbnQuanNcIikoXCIwZjkyYzJkMlwiLCBjb250ZW50LCBmYWxzZSk7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG4gLy8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3NcbiBpZighY29udGVudC5sb2NhbHMpIHtcbiAgIG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi00NWU3ZGU4NFxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9pbmRleFBhZ2UudnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTQ1ZTdkZTg0XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2luZGV4UGFnZS52dWVcIik7XG4gICAgIGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuICAgICB1cGRhdGUobmV3Q29udGVudCk7XG4gICB9KTtcbiB9XG4gLy8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIhLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtNDVlN2RlODRcIixcInNjb3BlZFwiOmZhbHNlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9pbmRleFBhZ2UudnVlXG4vLyBtb2R1bGUgaWQgPSAxOTNcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSh0cnVlKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIlxcbi5pbmRleC1wYWdlIHtcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIGhlaWdodDogMTAwJTtcXG59XFxuLmluZGV4LXBhZ2UgLnItdGl0bGUtYm94ID4gaDEge1xcbiAgZm9udC13ZWlnaHQ6IGxpZ2h0ZXI7XFxufVxcbi5pbmRleC1wYWdlIC5yLWltYWdlLWJveCBpbWcge1xcbiAgd2lkdGg6IDIwMHB4O1xcbn1cXG5cIiwgXCJcIiwge1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2luZGV4UGFnZS52dWVcIixcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvaW5kZXhQYWdlLnZ1ZVwiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiO0FBd0NBO0VBQ0ksbUJBQUE7RUFDQSxhQUFBO0NDdkNIO0FEeUNHO0VBQ0kscUJBQUE7Q0N2Q1A7QUQwQ087RUFDSSxhQUFBO0NDeENYXCIsXCJmaWxlXCI6XCJpbmRleFBhZ2UudnVlXCIsXCJzb3VyY2VzQ29udGVudFwiOltcIlxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcbkBpbXBvcnQnfnN0eWxlcy9zdHlsdXMvY29sb3JzJztcXG4uaW5kZXgtcGFnZXtcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgICBoZWlnaHQ6IDEwMCU7XFxuICAgIC8vIGJhY2tncm91bmQtY29sb3I6ICRncmV5LmxpZ2h0ZW4tMjtcXG4gICAgLnItdGl0bGUtYm94ID4gaDF7XFxuICAgICAgICBmb250LXdlaWdodDogbGlnaHRlcjtcXG4gICAgfVxcbiAgICAuci1pbWFnZS1ib3h7XFxuICAgICAgICBpbWd7XFxuICAgICAgICAgICAgd2lkdGg6IDIwMHB4O1xcbiAgICAgICAgfVxcbiAgICB9XFxufVxcblwiLFwiLmluZGV4LXBhZ2Uge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgaGVpZ2h0OiAxMDAlO1xcbn1cXG4uaW5kZXgtcGFnZSAuci10aXRsZS1ib3ggPiBoMSB7XFxuICBmb250LXdlaWdodDogbGlnaHRlcjtcXG59XFxuLmluZGV4LXBhZ2UgLnItaW1hZ2UtYm94IGltZyB7XFxuICB3aWR0aDogMjAwcHg7XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi00NWU3ZGU4NFwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2luZGV4UGFnZS52dWVcbi8vIG1vZHVsZSBpZCA9IDE5NFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCI8dGVtcGxhdGU+XG4gICAgPHYtYXBwPlxuICAgICAgICA8bWFpbj5cbiAgICAgICAgICAgIDx2LWNvbnRhaW5lciBmbHVpZCBjbGFzcz1cImluZGV4LXBhZ2VcIj5cbiAgICAgICAgICAgICAgICA8di1sYXlvdXQgY29sdW1uIGNsYXNzPVwiY29udGFpblwiIGFsaWduLWNlbnRlciBmaWxsLWhlaWdodCBqdXN0aWZ5LWNlbnRlcj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInItaW1hZ2UtYm94XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz1cIi9pbWFnZXMvbG9nby5qcGVnXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyLXRpdGxlLWJveFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGgxIGNsYXNzPVwicHJpbWFyeS0tdGV4dFwiPkNvbW11bml0eSBXYXRjaDwvaDE+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwici1zdWItdGl0bGUtYm94XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDUgY2xhc3M9XCJwcmltYXJ5LS10ZXh0XCI+ZmluZCBhbmQgcmVwb3J0IG5ld3MgYW5kIGluY2lkZW50cyBoYXBwZW5pbmcgYXJvdW5kIHlvdTwvaDU+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwici1zdWItdGl0bGUtYm94XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cm91dGVyLWxpbmsgdGFnPVwic3BhblwiIDp0bz1cIntuYW1lOiAnYXV0aC5sb2dpbid9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHYtYnRuIHByaW1hcnkgbGFyZ2U+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExvZ2luXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cm91dGVyLWxpbmsgdGFnPVwic3BhblwiIDp0bz1cIntuYW1lOiAnZGFzaC5ob21lJ31cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8di1idG4gcHJpbWFyeSBsYXJnZSBvdXRsaW5lPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXNoYm9hcmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC92LWxheW91dD5cbiAgICAgICAgICAgIDwvdi1jb250YWluZXI+XG4gICAgICAgIDwvbWFpbj5cbiAgICA8L3YtYXBwPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cblxuZXhwb3J0IGRlZmF1bHQge1xufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic3R5bHVzXCI+XG4gICAgQGltcG9ydCd+c3R5bGVzL3N0eWx1cy9jb2xvcnMnO1xuICAgIC5pbmRleC1wYWdle1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgLy8gYmFja2dyb3VuZC1jb2xvcjogJGdyZXkubGlnaHRlbi0yO1xuICAgICAgICAuci10aXRsZS1ib3ggPiBoMXtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiBsaWdodGVyO1xuICAgICAgICB9XG4gICAgICAgIC5yLWltYWdlLWJveHtcbiAgICAgICAgICAgIGltZ3tcbiAgICAgICAgICAgICAgICB3aWR0aDogMjAwcHg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG48L3N0eWxlPlxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIGluZGV4UGFnZS52dWU/MmFmMjhiN2EiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ3YtYXBwJywgW19jKCdtYWluJywgW19jKCd2LWNvbnRhaW5lcicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJpbmRleC1wYWdlXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwiZmx1aWRcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LWxheW91dCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJjb250YWluXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwiY29sdW1uXCI6IFwiXCIsXG4gICAgICBcImFsaWduLWNlbnRlclwiOiBcIlwiLFxuICAgICAgXCJmaWxsLWhlaWdodFwiOiBcIlwiLFxuICAgICAgXCJqdXN0aWZ5LWNlbnRlclwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ2RpdicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJyLWltYWdlLWJveFwiXG4gIH0sIFtfYygnaW1nJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInNyY1wiOiBcIi9pbWFnZXMvbG9nby5qcGVnXCJcbiAgICB9XG4gIH0pXSksIF92bS5fdihcIiBcIiksIF9jKCdkaXYnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwici10aXRsZS1ib3hcIlxuICB9LCBbX2MoJ2gxJywge1xuICAgIHN0YXRpY0NsYXNzOiBcInByaW1hcnktLXRleHRcIlxuICB9LCBbX3ZtLl92KFwiQ29tbXVuaXR5IFdhdGNoXCIpXSldKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ2RpdicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJyLXN1Yi10aXRsZS1ib3hcIlxuICB9LCBbX2MoJ2g1Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcInByaW1hcnktLXRleHRcIlxuICB9LCBbX3ZtLl92KFwiZmluZCBhbmQgcmVwb3J0IG5ld3MgYW5kIGluY2lkZW50cyBoYXBwZW5pbmcgYXJvdW5kIHlvdVwiKV0pXSksIF92bS5fdihcIiBcIiksIF9jKCdkaXYnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwici1zdWItdGl0bGUtYm94XCJcbiAgfSwgW19jKCdyb3V0ZXItbGluaycsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ0YWdcIjogXCJzcGFuXCIsXG4gICAgICBcInRvXCI6IHtcbiAgICAgICAgbmFtZTogJ2F1dGgubG9naW4nXG4gICAgICB9XG4gICAgfVxuICB9LCBbX2MoJ3YtYnRuJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInByaW1hcnlcIjogXCJcIixcbiAgICAgIFwibGFyZ2VcIjogXCJcIlxuICAgIH1cbiAgfSwgW192bS5fdihcIlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBMb2dpblxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiKV0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCdyb3V0ZXItbGluaycsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ0YWdcIjogXCJzcGFuXCIsXG4gICAgICBcInRvXCI6IHtcbiAgICAgICAgbmFtZTogJ2Rhc2guaG9tZSdcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtfYygndi1idG4nLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwicHJpbWFyeVwiOiBcIlwiLFxuICAgICAgXCJsYXJnZVwiOiBcIlwiLFxuICAgICAgXCJvdXRsaW5lXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfdm0uX3YoXCJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRGFzaGJvYXJkXFxuICAgICAgICAgICAgICAgICAgICAgICAgXCIpXSldLCAxKV0sIDEpXSldLCAxKV0sIDEpXSlcbn0sc3RhdGljUmVuZGVyRm5zOiBbXX1cbm1vZHVsZS5leHBvcnRzLnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgIHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIikucmVyZW5kZXIoXCJkYXRhLXYtNDVlN2RlODRcIiwgbW9kdWxlLmV4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LTQ1ZTdkZTg0XCIsXCJoYXNTY29wZWRcIjpmYWxzZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9pbmRleFBhZ2UudnVlXG4vLyBtb2R1bGUgaWQgPSAxOTZcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbmZ1bmN0aW9uIGluamVjdFN0eWxlIChzc3JDb250ZXh0KSB7XG4gIGlmIChkaXNwb3NlZCkgcmV0dXJuXG4gIHJlcXVpcmUoXCIhIXZ1ZS1zdHlsZS1sb2FkZXIhY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi03M2NmOTYzZVxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hc3R5bHVzLWxvYWRlciEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2F1dGhQYWdlLnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi9hdXRoUGFnZS52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LTczY2Y5NjNlXFxcIixcXFwiaGFzU2NvcGVkXFxcIjpmYWxzZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL2F1dGhQYWdlLnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIG51bGwsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9hdXRoUGFnZS52dWVcIlxuaWYgKENvbXBvbmVudC5lc01vZHVsZSAmJiBPYmplY3Qua2V5cyhDb21wb25lbnQuZXNNb2R1bGUpLnNvbWUoZnVuY3Rpb24gKGtleSkge3JldHVybiBrZXkgIT09IFwiZGVmYXVsdFwiICYmIGtleS5zdWJzdHIoMCwgMikgIT09IFwiX19cIn0pKSB7Y29uc29sZS5lcnJvcihcIm5hbWVkIGV4cG9ydHMgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gKi52dWUgZmlsZXMuXCIpfVxuaWYgKENvbXBvbmVudC5vcHRpb25zLmZ1bmN0aW9uYWwpIHtjb25zb2xlLmVycm9yKFwiW3Z1ZS1sb2FkZXJdIGF1dGhQYWdlLnZ1ZTogZnVuY3Rpb25hbCBjb21wb25lbnRzIGFyZSBub3Qgc3VwcG9ydGVkIHdpdGggdGVtcGxhdGVzLCB0aGV5IHNob3VsZCB1c2UgcmVuZGVyIGZ1bmN0aW9ucy5cIil9XG5cbi8qIGhvdCByZWxvYWQgKi9cbmlmIChtb2R1bGUuaG90KSB7KGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhvdEFQSSA9IHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIilcbiAgaG90QVBJLmluc3RhbGwocmVxdWlyZShcInZ1ZVwiKSwgZmFsc2UpXG4gIGlmICghaG90QVBJLmNvbXBhdGlibGUpIHJldHVyblxuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmICghbW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgaG90QVBJLmNyZWF0ZVJlY29yZChcImRhdGEtdi03M2NmOTYzZVwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfSBlbHNlIHtcbiAgICBob3RBUEkucmVsb2FkKFwiZGF0YS12LTczY2Y5NjNlXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9XG4gIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbiAoZGF0YSkge1xuICAgIGRpc3Bvc2VkID0gdHJ1ZVxuICB9KVxufSkoKX1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQuZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvYXV0aFBhZ2UudnVlXG4vLyBtb2R1bGUgaWQgPSAxOTdcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTczY2Y5NjNlXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2F1dGhQYWdlLnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiNGVjN2M4ZTJcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtNzNjZjk2M2VcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vYXV0aFBhZ2UudnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTczY2Y5NjNlXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2F1dGhQYWdlLnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi03M2NmOTYzZVwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvYXV0aFBhZ2UudnVlXG4vLyBtb2R1bGUgaWQgPSAxOThcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSh0cnVlKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIlxcbi5hdXRoLXBhZ2Uge1xcbiAgaGVpZ2h0OiAxMDAlO1xcbiAgbWluLWhlaWdodDogMTAwdmg7XFxufVxcbi5hdXRoLXBhZ2UgLnItaW1hZ2UtYm94IGltZyB7XFxuICB3aWR0aDogMTUwcHg7XFxufVxcbi5hdXRoLXBhZ2UgLmF1dGgtc2NyZWVucyB7XFxuICBwYWRkaW5nLXRvcDogNDBweDtcXG4gIG1pbi1oZWlnaHQ6IDQ4MHB4O1xcbn1cXG4uci1mYWRlLWVudGVyIHtcXG4gIG9wYWNpdHk6IDA7XFxuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTIwcHgpO1xcbn1cXG4uci1mYWRlLWVudGVyLWFjdGl2ZSB7XFxuICB0cmFuc2l0aW9uOiBhbGwgMC4ycyBsaW5lYXI7XFxufVxcbi5yLWZhZGUtbGVhdmUtYWN0aXZlIHtcXG4gIHRyYW5zaXRpb246IGFsbCAwLjFzIGxpbmVhcjtcXG4gIG9wYWNpdHk6IDA7XFxuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMjBweCk7XFxufVxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL2F1dGhQYWdlLnZ1ZVwiLFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL2F1dGhQYWdlLnZ1ZVwiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiO0FBNERBO0VBRUksYUFBQTtFQUNBLGtCQUFBO0NDNURIO0FEK0RPO0VBQ0ksYUFBQTtDQzdEWDtBRGdFRztFQUNJLGtCQUFBO0VBQ0osa0JBQUE7Q0M5REg7QURrRUQ7RUFDSSxXQUFBO0VBQ0EsNkJBQUE7Q0NoRUg7QURtRUQ7RUFDSSw0QkFBQTtDQ2pFSDtBRHdFRDtFQUNJLDRCQUFBO0VBQ0EsV0FBQTtFQUNBLDRCQUFBO0NDdEVIXCIsXCJmaWxlXCI6XCJhdXRoUGFnZS52dWVcIixcInNvdXJjZXNDb250ZW50XCI6W1wiXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuQGltcG9ydCAnfnN0eWxlcy9zdHlsdXMvY29sb3JzJztcXG4uYXV0aC1wYWdle1xcbiAgICAvLyBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICAgIGhlaWdodDogMTAwJTtcXG4gICAgbWluLWhlaWdodCAxMDB2aDtcXG4gICAgLy8gYmFja2dyb3VuZC1jb2xvcjogJGdyZXkubGlnaHRlbi0yOyAgXFxuICAgIC5yLWltYWdlLWJveHtcXG4gICAgICAgIGltZ3sgXFxuICAgICAgICAgICAgd2lkdGg6IDE1MHB4O1xcbiAgICAgICAgfVxcbiAgICB9XFxuICAgIC5hdXRoLXNjcmVlbnN7XFxuICAgICAgICBwYWRkaW5nLXRvcDogNDBweDtcXG4gICAgbWluLWhlaWdodCA0ODBweDtcXG4gICAgfVxcbn1cXG5cXG4uci1mYWRlLWVudGVyIHtcXG4gICAgb3BhY2l0eTogMDtcXG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC0yMHB4KTtcXG59XFxuXFxuLnItZmFkZS1lbnRlci1hY3RpdmUge1xcbiAgICB0cmFuc2l0aW9uOiBhbGwgLjJzIGxpbmVhcjtcXG59XFxuXFxuLnItZmFkZS1sZWF2ZSB7XFxuICAgIC8qIG9wYWNpdHk6IDA7ICovXFxufVxcblxcbi5yLWZhZGUtbGVhdmUtYWN0aXZlIHtcXG4gICAgdHJhbnNpdGlvbjogYWxsIC4xcyBsaW5lYXI7XFxuICAgIG9wYWNpdHk6IDA7XFxuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgyMHB4KTtcXG59XFxuXCIsXCIuYXV0aC1wYWdlIHtcXG4gIGhlaWdodDogMTAwJTtcXG4gIG1pbi1oZWlnaHQ6IDEwMHZoO1xcbn1cXG4uYXV0aC1wYWdlIC5yLWltYWdlLWJveCBpbWcge1xcbiAgd2lkdGg6IDE1MHB4O1xcbn1cXG4uYXV0aC1wYWdlIC5hdXRoLXNjcmVlbnMge1xcbiAgcGFkZGluZy10b3A6IDQwcHg7XFxuICBtaW4taGVpZ2h0OiA0ODBweDtcXG59XFxuLnItZmFkZS1lbnRlciB7XFxuICBvcGFjaXR5OiAwO1xcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC0yMHB4KTtcXG59XFxuLnItZmFkZS1lbnRlci1hY3RpdmUge1xcbiAgdHJhbnNpdGlvbjogYWxsIDAuMnMgbGluZWFyO1xcbn1cXG4uci1mYWRlLWxlYXZlLWFjdGl2ZSB7XFxuICB0cmFuc2l0aW9uOiBhbGwgMC4xcyBsaW5lYXI7XFxuICBvcGFjaXR5OiAwO1xcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDIwcHgpO1xcbn1cXG5cIl0sXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtNzNjZjk2M2VcIixcInNjb3BlZFwiOmZhbHNlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL2F1dGhQYWdlLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMTk5XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIjx0ZW1wbGF0ZT5cbiAgICA8di1hcHA+XG4gICAgICAgIDxtYWluPlxuICAgICAgICAgICAgPHYtY29udGFpbmVyIGZsdWlkIGNsYXNzPVwiYXV0aC1wYWdlXCI+XG4gICAgICAgICAgICAgICAgPHYtbGF5b3V0IGNsYXNzPVwiY29udGFpbiBtdC0zXCIganVzdGlmeS1jZW50ZXI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyLWltYWdlLWJveFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHJvdXRlci1saW5rIDp0bz1cIntuYW1lOiAnaW5kZXgnfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBjbGFzcz1cImNsaWNrYWJsZVwiIHNyYz1cIi9pbWFnZXMvbG9nby5qcGVnXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvdi1sYXlvdXQ+XG4gICAgXG4gICAgICAgICAgICAgICAgPHYtbGF5b3V0IGNsYXNzPVwiYXV0aC1zY3JlZW5zXCIganVzdGlmeS1jZW50ZXI+XG4gICAgICAgICAgICAgICAgICAgIDx2LWZsZXggeHMxMiBzbTggbWQ0PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyYW5zaXRpb24gbmFtZT1cInItZmFkZVwiIG1vZGU9XCJvdXQtaW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8a2VlcC1hbGl2ZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHJvdXRlci12aWV3Pjwvcm91dGVyLXZpZXc+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9rZWVwLWFsaXZlPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90cmFuc2l0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8L3YtZmxleD5cbiAgICAgICAgICAgICAgICA8L3YtbGF5b3V0PlxuICAgIFxuICAgICAgICAgICAgICAgIDx2LWxheW91dCBjbGFzcz1cImNvbnRhaW4gbXQtNVwiIGp1c3RpZnktY2VudGVyPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwici1zdWItdGl0bGUtYm94XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cm91dGVyLWxpbmsgdGFnPVwic3BhblwiIDp0bz1cIntuYW1lOiAnaW5kZXgnfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx2LWJ0biBwcmltYXJ5IGxhcmdlIGZsYXQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEhvbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9yb3V0ZXItbGluaz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxyb3V0ZXItbGluayB0YWc9XCJzcGFuXCIgOnRvPVwie25hbWU6ICdhdXRoLmxvZ2luJ31cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8di1idG4gc2Vjb25kYXJ5IGxhcmdlIGZsYXQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExvZ2luXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cm91dGVyLWxpbmsgdGFnPVwic3BhblwiIDp0bz1cIntuYW1lOiAnYXV0aC5yZWdpc3Rlcid9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHYtYnRuIHNlY29uZGFyeSBsYXJnZSBmbGF0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWdpc3RlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3JvdXRlci1saW5rPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHJvdXRlci1saW5rIHRhZz1cInNwYW5cIiA6dG89XCJ7bmFtZTogJ2Rhc2guaG9tZSd9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHYtYnRuIHByaW1hcnkgbGFyZ2UgZmxhdD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGFzaGJvYXJkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvcm91dGVyLWxpbms+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvdi1sYXlvdXQ+XG4gICAgICAgICAgICA8L3YtY29udGFpbmVyPlxuICAgICAgICA8L21haW4+XG4gICAgXG4gICAgICAgIDwhLS0gPHYtZm9vdGVyPjwvdi1mb290ZXI+IC0tPlxuICAgIDwvdi1hcHA+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0PlxuZXhwb3J0IGRlZmF1bHQge1xufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic3R5bHVzXCI+XG5AaW1wb3J0ICd+c3R5bGVzL3N0eWx1cy9jb2xvcnMnO1xuLmF1dGgtcGFnZXtcbiAgICAvLyBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgaGVpZ2h0OiAxMDAlO1xuICAgIG1pbi1oZWlnaHQgMTAwdmg7XG4gICAgLy8gYmFja2dyb3VuZC1jb2xvcjogJGdyZXkubGlnaHRlbi0yOyAgXG4gICAgLnItaW1hZ2UtYm94e1xuICAgICAgICBpbWd7IFxuICAgICAgICAgICAgd2lkdGg6IDE1MHB4O1xuICAgICAgICB9XG4gICAgfVxuICAgIC5hdXRoLXNjcmVlbnN7XG4gICAgICAgIHBhZGRpbmctdG9wOiA0MHB4O1xuICAgIG1pbi1oZWlnaHQgNDgwcHg7XG4gICAgfVxufVxuXG4uci1mYWRlLWVudGVyIHtcbiAgICBvcGFjaXR5OiAwO1xuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtMjBweCk7XG59XG5cbi5yLWZhZGUtZW50ZXItYWN0aXZlIHtcbiAgICB0cmFuc2l0aW9uOiBhbGwgLjJzIGxpbmVhcjtcbn1cblxuLnItZmFkZS1sZWF2ZSB7XG4gICAgLyogb3BhY2l0eTogMDsgKi9cbn1cblxuLnItZmFkZS1sZWF2ZS1hY3RpdmUge1xuICAgIHRyYW5zaXRpb246IGFsbCAuMXMgbGluZWFyO1xuICAgIG9wYWNpdHk6IDA7XG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDIwcHgpO1xufVxuPC9zdHlsZT5cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyBhdXRoUGFnZS52dWU/NWZmYmEzZjYiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ3YtYXBwJywgW19jKCdtYWluJywgW19jKCd2LWNvbnRhaW5lcicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJhdXRoLXBhZ2VcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJmbHVpZFwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtbGF5b3V0Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcImNvbnRhaW4gbXQtM1wiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcImp1c3RpZnktY2VudGVyXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygnZGl2Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcInItaW1hZ2UtYm94XCJcbiAgfSwgW19jKCdyb3V0ZXItbGluaycsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ0b1wiOiB7XG4gICAgICAgIG5hbWU6ICdpbmRleCdcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtfYygnaW1nJywge1xuICAgIHN0YXRpY0NsYXNzOiBcImNsaWNrYWJsZVwiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcInNyY1wiOiBcIi9pbWFnZXMvbG9nby5qcGVnXCJcbiAgICB9XG4gIH0pXSldLCAxKV0pLCBfdm0uX3YoXCIgXCIpLCBfYygndi1sYXlvdXQnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwiYXV0aC1zY3JlZW5zXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwianVzdGlmeS1jZW50ZXJcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LWZsZXgnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwieHMxMlwiOiBcIlwiLFxuICAgICAgXCJzbThcIjogXCJcIixcbiAgICAgIFwibWQ0XCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndHJhbnNpdGlvbicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJuYW1lXCI6IFwici1mYWRlXCIsXG4gICAgICBcIm1vZGVcIjogXCJvdXQtaW5cIlxuICAgIH1cbiAgfSwgW19jKCdrZWVwLWFsaXZlJywgW19jKCdyb3V0ZXItdmlldycpXSwgMSldLCAxKV0sIDEpXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWxheW91dCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJjb250YWluIG10LTVcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJqdXN0aWZ5LWNlbnRlclwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ2RpdicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJyLXN1Yi10aXRsZS1ib3hcIlxuICB9LCBbX2MoJ3JvdXRlci1saW5rJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInRhZ1wiOiBcInNwYW5cIixcbiAgICAgIFwidG9cIjoge1xuICAgICAgICBuYW1lOiAnaW5kZXgnXG4gICAgICB9XG4gICAgfVxuICB9LCBbX2MoJ3YtYnRuJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInByaW1hcnlcIjogXCJcIixcbiAgICAgIFwibGFyZ2VcIjogXCJcIixcbiAgICAgIFwiZmxhdFwiOiBcIlwiXG4gICAgfVxuICB9LCBbX3ZtLl92KFwiXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEhvbWVcXG4gICAgICAgICAgICAgICAgICAgICAgICBcIildKV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygncm91dGVyLWxpbmsnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwidGFnXCI6IFwic3BhblwiLFxuICAgICAgXCJ0b1wiOiB7XG4gICAgICAgIG5hbWU6ICdhdXRoLmxvZ2luJ1xuICAgICAgfVxuICAgIH1cbiAgfSwgW19jKCd2LWJ0bicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJzZWNvbmRhcnlcIjogXCJcIixcbiAgICAgIFwibGFyZ2VcIjogXCJcIixcbiAgICAgIFwiZmxhdFwiOiBcIlwiXG4gICAgfVxuICB9LCBbX3ZtLl92KFwiXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIExvZ2luXFxuICAgICAgICAgICAgICAgICAgICAgICAgXCIpXSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3JvdXRlci1saW5rJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInRhZ1wiOiBcInNwYW5cIixcbiAgICAgIFwidG9cIjoge1xuICAgICAgICBuYW1lOiAnYXV0aC5yZWdpc3RlcidcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtfYygndi1idG4nLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwic2Vjb25kYXJ5XCI6IFwiXCIsXG4gICAgICBcImxhcmdlXCI6IFwiXCIsXG4gICAgICBcImZsYXRcIjogXCJcIlxuICAgIH1cbiAgfSwgW192bS5fdihcIlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWdpc3RlclxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiKV0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCdyb3V0ZXItbGluaycsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ0YWdcIjogXCJzcGFuXCIsXG4gICAgICBcInRvXCI6IHtcbiAgICAgICAgbmFtZTogJ2Rhc2guaG9tZSdcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtfYygndi1idG4nLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwicHJpbWFyeVwiOiBcIlwiLFxuICAgICAgXCJsYXJnZVwiOiBcIlwiLFxuICAgICAgXCJmbGF0XCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfdm0uX3YoXCJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRGFzaGJvYXJkXFxuICAgICAgICAgICAgICAgICAgICAgICAgXCIpXSldLCAxKV0sIDEpXSldLCAxKV0sIDEpXSlcbn0sc3RhdGljUmVuZGVyRm5zOiBbXX1cbm1vZHVsZS5leHBvcnRzLnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgIHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIikucmVyZW5kZXIoXCJkYXRhLXYtNzNjZjk2M2VcIiwgbW9kdWxlLmV4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LTczY2Y5NjNlXCIsXCJoYXNTY29wZWRcIjpmYWxzZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL2F1dGhQYWdlLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjAxXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG5mdW5jdGlvbiBpbmplY3RTdHlsZSAoc3NyQ29udGV4dCkge1xuICBpZiAoZGlzcG9zZWQpIHJldHVyblxuICByZXF1aXJlKFwiISF2dWUtc3R5bGUtbG9hZGVyIWNzcy1sb2FkZXI/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleD97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtYTgwMDBmNmFcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hc3R5bHVzLWxvYWRlciEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2Rhc2hib2FyZFBhZ2UudnVlXCIpXG59XG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIikoXG4gIC8qIHNjcmlwdCAqL1xuICByZXF1aXJlKFwiISFiYWJlbC1sb2FkZXI/e1xcXCJjYWNoZURpcmVjdG9yeVxcXCI6dHJ1ZSxcXFwicHJlc2V0c1xcXCI6W1tcXFwiZW52XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlLFxcXCJ0YXJnZXRzXFxcIjp7XFxcImJyb3dzZXJzXFxcIjpbXFxcIj4gMiVcXFwiXSxcXFwidWdsaWZ5XFxcIjp0cnVlfX1dLFtcXFwiZXMyMDE1XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlfV0sW1xcXCJzdGFnZS0yXFxcIl1dfSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL2Rhc2hib2FyZFBhZ2UudnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi1hODAwMGY2YVxcXCIsXFxcImhhc1Njb3BlZFxcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL2Rhc2hib2FyZFBhZ2UudnVlXCIpLFxuICAvKiBzdHlsZXMgKi9cbiAgaW5qZWN0U3R5bGUsXG4gIC8qIHNjb3BlSWQgKi9cbiAgXCJkYXRhLXYtYTgwMDBmNmFcIixcbiAgLyogbW9kdWxlSWRlbnRpZmllciAoc2VydmVyIG9ubHkpICovXG4gIG51bGxcbilcbkNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZGFzaGJvYXJkUGFnZS52dWVcIlxuaWYgKENvbXBvbmVudC5lc01vZHVsZSAmJiBPYmplY3Qua2V5cyhDb21wb25lbnQuZXNNb2R1bGUpLnNvbWUoZnVuY3Rpb24gKGtleSkge3JldHVybiBrZXkgIT09IFwiZGVmYXVsdFwiICYmIGtleS5zdWJzdHIoMCwgMikgIT09IFwiX19cIn0pKSB7Y29uc29sZS5lcnJvcihcIm5hbWVkIGV4cG9ydHMgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gKi52dWUgZmlsZXMuXCIpfVxuaWYgKENvbXBvbmVudC5vcHRpb25zLmZ1bmN0aW9uYWwpIHtjb25zb2xlLmVycm9yKFwiW3Z1ZS1sb2FkZXJdIGRhc2hib2FyZFBhZ2UudnVlOiBmdW5jdGlvbmFsIGNvbXBvbmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0ZW1wbGF0ZXMsIHRoZXkgc2hvdWxkIHVzZSByZW5kZXIgZnVuY3Rpb25zLlwiKX1cblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LWE4MDAwZjZhXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtYTgwMDBmNmFcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL2Rhc2hib2FyZFBhZ2UudnVlXG4vLyBtb2R1bGUgaWQgPSAyMDJcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWE4MDAwZjZhXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vZGFzaGJvYXJkUGFnZS52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcIjMwYTM3MWUwXCIsIGNvbnRlbnQsIGZhbHNlKTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWE4MDAwZjZhXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vZGFzaGJvYXJkUGFnZS52dWVcIiwgZnVuY3Rpb24oKSB7XG4gICAgIHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtYTgwMDBmNmFcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9kYXNoYm9hcmRQYWdlLnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi1hODAwMGY2YVwiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL2Rhc2hib2FyZFBhZ2UudnVlXG4vLyBtb2R1bGUgaWQgPSAyMDNcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSh0cnVlKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIlxcbi5maXhlZC10b3BbZGF0YS12LWE4MDAwZjZhXSB7XFxuICBwb3NpdGlvbjogZml4ZWQ7XFxufVxcbm1haW4jbWFpbltkYXRhLXYtYTgwMDBmNmFdIHtcXG4gIHBhZGRpbmctdG9wOiA2NHB4O1xcbn1cXG4uZmFkZS1lbnRlcltkYXRhLXYtYTgwMDBmNmFdIHtcXG4gIG9wYWNpdHk6IDA7XFxuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtMzBweCk7XFxufVxcbi5mYWRlLWVudGVyLWFjdGl2ZVtkYXRhLXYtYTgwMDBmNmFdIHtcXG4gIHRyYW5zaXRpb246IGFsbCAwLjJzIGVhc2U7XFxufVxcbi5mYWRlLWxlYXZlLWFjdGl2ZVtkYXRhLXYtYTgwMDBmNmFdIHtcXG4gIHRyYW5zaXRpb246IGFsbCAwLjJzIGVhc2U7XFxuICBvcGFjaXR5OiAwO1xcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMzBweCk7XFxufVxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9kYXNoYm9hcmRQYWdlLnZ1ZVwiLFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvZGFzaGJvYXJkUGFnZS52dWVcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIjtBQXFEQTtFQUNJLGdCQUFBO0NDcERIO0FEc0REO0VBQ0ksa0JBQUE7Q0NwREg7QUR1REQ7RUFDSSxXQUFBO0VBQ0EsNEJBQUE7Q0NyREg7QUR3REQ7RUFDSSwwQkFBQTtDQ3RESDtBRDZERDtFQUNJLDBCQUFBO0VBQ0EsV0FBQTtFQUNBLDJCQUFBO0NDM0RIXCIsXCJmaWxlXCI6XCJkYXNoYm9hcmRQYWdlLnZ1ZVwiLFwic291cmNlc0NvbnRlbnRcIjpbXCJcXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG4uZml4ZWQtdG9we1xcbiAgICBwb3NpdGlvbjogZml4ZWQ7XFxufVxcbm1haW4jbWFpbntcXG4gICAgcGFkZGluZy10b3A6IDY0cHg7XFxufVxcblxcbi5mYWRlLWVudGVyIHtcXG4gICAgb3BhY2l0eTogMDtcXG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTMwcHgpO1xcbn1cXG5cXG4uZmFkZS1lbnRlci1hY3RpdmUge1xcbiAgICB0cmFuc2l0aW9uOiBhbGwgLjJzIGVhc2U7XFxufVxcblxcbi5mYWRlLWxlYXZlIHtcXG4gICAgLyogb3BhY2l0eTogMDsgKi9cXG59XFxuXFxuLmZhZGUtbGVhdmUtYWN0aXZlIHtcXG4gICAgdHJhbnNpdGlvbjogYWxsIC4ycyBlYXNlO1xcbiAgICBvcGFjaXR5OiAwO1xcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgzMHB4KTtcXG59XFxuXCIsXCIuZml4ZWQtdG9wIHtcXG4gIHBvc2l0aW9uOiBmaXhlZDtcXG59XFxubWFpbiNtYWluIHtcXG4gIHBhZGRpbmctdG9wOiA2NHB4O1xcbn1cXG4uZmFkZS1lbnRlciB7XFxuICBvcGFjaXR5OiAwO1xcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTMwcHgpO1xcbn1cXG4uZmFkZS1lbnRlci1hY3RpdmUge1xcbiAgdHJhbnNpdGlvbjogYWxsIDAuMnMgZWFzZTtcXG59XFxuLmZhZGUtbGVhdmUtYWN0aXZlIHtcXG4gIHRyYW5zaXRpb246IGFsbCAwLjJzIGVhc2U7XFxuICBvcGFjaXR5OiAwO1xcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMzBweCk7XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi1hODAwMGY2YVwiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL2Rhc2hib2FyZFBhZ2UudnVlXG4vLyBtb2R1bGUgaWQgPSAyMDRcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiXG48dGVtcGxhdGU+XG4gICAgPHYtYXBwPlxuICAgICAgICA8di1uYXZpZ2F0aW9uLWRyYXdlciB2LW1vZGVsPVwic2lkZUJhck9wZW5cIiBwZXJzaXN0ZW50IGZsb2F0aW5nIGNsYXNzPVwic2Vjb25kYXJ5IGRhcmtlbi0zXCI+XG4gICAgICAgICAgICA8ci1zaWRlYmFyPjwvci1zaWRlYmFyPlxuICAgICAgICA8L3YtbmF2aWdhdGlvbi1kcmF3ZXI+XG4gICAgXG4gICAgICAgIDxyLXRvcG5hdiBjbGFzcz1cImZpeGVkLXRvcFwiIEB0b2dnbGVTaWRlYmFyPVwic2lkZUJhclRvZ2dsZVwiPjwvci10b3BuYXY+XG4gICAgXG4gICAgICAgIDxtYWluIGlkPVwibWFpblwiPlxuICAgICAgICAgICAgPHYtY29udGFpbmVyIGZsdWlkPlxuICAgICAgICAgICAgICAgIDx0cmFuc2l0aW9uIG5hbWU9XCJmYWRlXCIgbW9kZT1cIm91dC1pblwiPlxuICAgICAgICAgICAgICAgICAgICA8a2VlcC1hbGl2ZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxyb3V0ZXItdmlldz48L3JvdXRlci12aWV3PlxuICAgICAgICAgICAgICAgICAgICA8L2tlZXAtYWxpdmU+XG4gICAgICAgICAgICAgICAgPC90cmFuc2l0aW9uPlxuICAgICAgICAgICAgPC92LWNvbnRhaW5lcj5cbiAgICAgICAgPC9tYWluPlxuICAgICAgICBcbiAgICAgICAgPHYtZm9vdGVyPlxuICAgICAgICAgICAgPHItZm9vdGVyPjwvci1mb290ZXI+XG4gICAgICAgIDwvdi1mb290ZXI+XG4gICAgPC92LWFwcD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5pbXBvcnQgclNpZGViYXIgZnJvbSAnQC9sYXlvdXRzL3NpZGViYXInO1xuaW1wb3J0IHJUb3BuYXYgZnJvbSAnQC9sYXlvdXRzL3RvcG5hdic7XG5pbXBvcnQgckZvb3RlciBmcm9tICdAL2xheW91dHMvZm9vdGVyJztcblxuaW1wb3J0IHN0b3JlIGZyb20gJ0Avc3RvcmUvc3RvcmUnO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgZGF0YTogKCkgPT4gKHtcbiAgICAgICAgc2lkZUJhck9wZW46IHRydWVcbiAgICB9KSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIHNpZGVCYXJUb2dnbGUoKSB7XG4gICAgICAgICAgICB0aGlzLnNpZGVCYXJPcGVuID0gIXRoaXMuc2lkZUJhck9wZW47XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgclNpZGViYXIsXG4gICAgICAgIHJUb3BuYXYsXG4gICAgICAgIHJGb290ZXIsXG4gICAgfSxcbiAgICBiZWZvcmVSb3V0ZUVudGVyKHRvLCBmcm9tLCBuZXh0KSB7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzdHlsdXNcIiBzY29wZWQ+XG4gICAgLmZpeGVkLXRvcHtcbiAgICAgICAgcG9zaXRpb246IGZpeGVkO1xuICAgIH1cbiAgICBtYWluI21haW57XG4gICAgICAgIHBhZGRpbmctdG9wOiA2NHB4O1xuICAgIH1cblxuICAgIC5mYWRlLWVudGVyIHtcbiAgICAgICAgb3BhY2l0eTogMDtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTMwcHgpO1xuICAgIH1cblxuICAgIC5mYWRlLWVudGVyLWFjdGl2ZSB7XG4gICAgICAgIHRyYW5zaXRpb246IGFsbCAuMnMgZWFzZTtcbiAgICB9XG5cbiAgICAuZmFkZS1sZWF2ZSB7XG4gICAgICAgIC8qIG9wYWNpdHk6IDA7ICovXG4gICAgfVxuXG4gICAgLmZhZGUtbGVhdmUtYWN0aXZlIHtcbiAgICAgICAgdHJhbnNpdGlvbjogYWxsIC4ycyBlYXNlO1xuICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgzMHB4KTtcbiAgICB9XG48L3N0eWxlPlxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIGRhc2hib2FyZFBhZ2UudnVlPzE5MWZjYzIwIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbmZ1bmN0aW9uIGluamVjdFN0eWxlIChzc3JDb250ZXh0KSB7XG4gIGlmIChkaXNwb3NlZCkgcmV0dXJuXG4gIHJlcXVpcmUoXCIhIXZ1ZS1zdHlsZS1sb2FkZXIhY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0zMWQzZjI2NFxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9zaWRlYmFyLnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi9zaWRlYmFyLnZ1ZVwiKSxcbiAgLyogdGVtcGxhdGUgKi9cbiAgcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyL2luZGV4P3tcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMzFkM2YyNjRcXFwiLFxcXCJoYXNTY29wZWRcXFwiOmZhbHNlfSEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vc2lkZWJhci52dWVcIiksXG4gIC8qIHN0eWxlcyAqL1xuICBpbmplY3RTdHlsZSxcbiAgLyogc2NvcGVJZCAqL1xuICBudWxsLFxuICAvKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbiAgbnVsbFxuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvc2lkZWJhci52dWVcIlxuaWYgKENvbXBvbmVudC5lc01vZHVsZSAmJiBPYmplY3Qua2V5cyhDb21wb25lbnQuZXNNb2R1bGUpLnNvbWUoZnVuY3Rpb24gKGtleSkge3JldHVybiBrZXkgIT09IFwiZGVmYXVsdFwiICYmIGtleS5zdWJzdHIoMCwgMikgIT09IFwiX19cIn0pKSB7Y29uc29sZS5lcnJvcihcIm5hbWVkIGV4cG9ydHMgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gKi52dWUgZmlsZXMuXCIpfVxuaWYgKENvbXBvbmVudC5vcHRpb25zLmZ1bmN0aW9uYWwpIHtjb25zb2xlLmVycm9yKFwiW3Z1ZS1sb2FkZXJdIHNpZGViYXIudnVlOiBmdW5jdGlvbmFsIGNvbXBvbmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0ZW1wbGF0ZXMsIHRoZXkgc2hvdWxkIHVzZSByZW5kZXIgZnVuY3Rpb25zLlwiKX1cblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LTMxZDNmMjY0XCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtMzFkM2YyNjRcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy9zaWRlYmFyLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjA2XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0zMWQzZjI2NFxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9zaWRlYmFyLnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiMmNmOGJiYWRcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMzFkM2YyNjRcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vc2lkZWJhci52dWVcIiwgZnVuY3Rpb24oKSB7XG4gICAgIHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMzFkM2YyNjRcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vc2lkZWJhci52dWVcIik7XG4gICAgIGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuICAgICB1cGRhdGUobmV3Q29udGVudCk7XG4gICB9KTtcbiB9XG4gLy8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIhLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtMzFkM2YyNjRcIixcInNjb3BlZFwiOmZhbHNlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvbGF5b3V0cy9zaWRlYmFyLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjA3XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodHJ1ZSk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJcXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cIiwgXCJcIiwge1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W10sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIlwiLFwiZmlsZVwiOlwic2lkZWJhci52dWVcIixcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi0zMWQzZjI2NFwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9sYXlvdXRzL3NpZGViYXIudnVlXG4vLyBtb2R1bGUgaWQgPSAyMDhcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiPHRlbXBsYXRlPlxuICAgICA8di1jYXJkIGNsYXNzPVwibWEtM1wiPiBcbiAgICAgICAgPHYtbGlzdCBjbGFzcz1cInB5LTBcIj5cbiAgICAgICAgICAgIDx2LWxpc3QtdGlsZSB2LWZvcj1cIml0ZW0gaW4gaXRlbXNcIiA6a2V5PVwiaXRlbS50aXRsZVwiIEBjbGljaz1cImdvdG9QYXRoKGl0ZW0ucm91dGUpXCI+XG4gICAgICAgICAgICAgICAgPHYtbGlzdC10aWxlLWFjdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPHYtaWNvbj57eyBpdGVtLmljb24gfX08L3YtaWNvbj5cbiAgICAgICAgICAgICAgICA8L3YtbGlzdC10aWxlLWFjdGlvbj5cbiAgICAgICAgICAgICAgICA8di1saXN0LXRpbGUtY29udGVudD5cbiAgICAgICAgICAgICAgICAgICAgPHYtbGlzdC10aWxlLXRpdGxlPnt7IGl0ZW0udGl0bGUgfX08L3YtbGlzdC10aWxlLXRpdGxlPlxuICAgICAgICAgICAgICAgIDwvdi1saXN0LXRpbGUtY29udGVudD5cbiAgICAgICAgICAgIDwvdi1saXN0LXRpbGU+XG4gICAgICAgIDwvdi1saXN0PlxuICAgICA8L3YtY2FyZD4gXG48L3RlbXBsYXRlPlxuXG48c2NyaXB0PlxuZXhwb3J0IGRlZmF1bHQge1xuICAgIGRhdGE6ICgpID0+ICh7XG4gICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICB7IHRpdGxlOiAnSG9tZScsIGljb246ICdob21lJywgcm91dGU6ICdkYXNoLmhvbWUnIH0sXG4gICAgICAgICAgICB7IHRpdGxlOiAnUG9zdHMnLCBpY29uOiAnZGFzaGJvYXJkJywgcm91dGU6ICdkYXNoLnBvc3RzJyB9LFxuICAgICAgICAgICAgeyB0aXRsZTogJ01lc3NhZ2VzJywgaWNvbjogJ2NoYXQnLCByb3V0ZTogJ2Rhc2gubWVzc2FnZXMnIH1cbiAgICAgICAgXSxcbiAgICB9KSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIGdvdG9QYXRoKHBhdGgpe1xuICAgICAgICAgICAgdGhpcy4kcm91dGVyLnB1c2goeyBuYW1lOiBwYXRofSk7XG4gICAgICAgIH1cbiAgICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuXG48L3N0eWxlPlxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHNpZGViYXIudnVlP2Q2YzNkNGZhIiwibW9kdWxlLmV4cG9ydHM9e3JlbmRlcjpmdW5jdGlvbiAoKXt2YXIgX3ZtPXRoaXM7dmFyIF9oPV92bS4kY3JlYXRlRWxlbWVudDt2YXIgX2M9X3ZtLl9zZWxmLl9jfHxfaDtcbiAgcmV0dXJuIF9jKCd2LWNhcmQnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwibWEtM1wiXG4gIH0sIFtfYygndi1saXN0Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcInB5LTBcIlxuICB9LCBfdm0uX2woKF92bS5pdGVtcyksIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICByZXR1cm4gX2MoJ3YtbGlzdC10aWxlJywge1xuICAgICAga2V5OiBpdGVtLnRpdGxlLFxuICAgICAgb246IHtcbiAgICAgICAgXCJjbGlja1wiOiBmdW5jdGlvbigkZXZlbnQpIHtcbiAgICAgICAgICBfdm0uZ290b1BhdGgoaXRlbS5yb3V0ZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIFtfYygndi1saXN0LXRpbGUtYWN0aW9uJywgW19jKCd2LWljb24nLCBbX3ZtLl92KF92bS5fcyhpdGVtLmljb24pKV0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWxpc3QtdGlsZS1jb250ZW50JywgW19jKCd2LWxpc3QtdGlsZS10aXRsZScsIFtfdm0uX3YoX3ZtLl9zKGl0ZW0udGl0bGUpKV0pXSwgMSldLCAxKVxuICB9KSldLCAxKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi0zMWQzZjI2NFwiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtMzFkM2YyNjRcIixcImhhc1Njb3BlZFwiOmZhbHNlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvc2lkZWJhci52dWVcbi8vIG1vZHVsZSBpZCA9IDIxMFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJ2YXIgZGlzcG9zZWQgPSBmYWxzZVxuZnVuY3Rpb24gaW5qZWN0U3R5bGUgKHNzckNvbnRleHQpIHtcbiAgaWYgKGRpc3Bvc2VkKSByZXR1cm5cbiAgcmVxdWlyZShcIiEhdnVlLXN0eWxlLWxvYWRlciFjc3MtbG9hZGVyP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXg/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWQ2NTQ3MjU0XFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXN0eWxlcyZpbmRleD0wIS4vdG9wbmF2LnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi90b3BuYXYudnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi1kNjU0NzI1NFxcXCIsXFxcImhhc1Njb3BlZFxcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3RvcG5hdi52dWVcIiksXG4gIC8qIHN0eWxlcyAqL1xuICBpbmplY3RTdHlsZSxcbiAgLyogc2NvcGVJZCAqL1xuICBcImRhdGEtdi1kNjU0NzI1NFwiLFxuICAvKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbiAgbnVsbFxuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvdG9wbmF2LnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gdG9wbmF2LnZ1ZTogZnVuY3Rpb25hbCBjb21wb25lbnRzIGFyZSBub3Qgc3VwcG9ydGVkIHdpdGggdGVtcGxhdGVzLCB0aGV5IHNob3VsZCB1c2UgcmVuZGVyIGZ1bmN0aW9ucy5cIil9XG5cbi8qIGhvdCByZWxvYWQgKi9cbmlmIChtb2R1bGUuaG90KSB7KGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhvdEFQSSA9IHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIilcbiAgaG90QVBJLmluc3RhbGwocmVxdWlyZShcInZ1ZVwiKSwgZmFsc2UpXG4gIGlmICghaG90QVBJLmNvbXBhdGlibGUpIHJldHVyblxuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmICghbW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgaG90QVBJLmNyZWF0ZVJlY29yZChcImRhdGEtdi1kNjU0NzI1NFwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfSBlbHNlIHtcbiAgICBob3RBUEkucmVsb2FkKFwiZGF0YS12LWQ2NTQ3MjU0XCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9XG4gIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbiAoZGF0YSkge1xuICAgIGRpc3Bvc2VkID0gdHJ1ZVxuICB9KVxufSkoKX1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQuZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvdG9wbmF2LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjExXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi1kNjU0NzI1NFxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3RvcG5hdi52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcIjFhMDI3ZjljXCIsIGNvbnRlbnQsIGZhbHNlKTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWQ2NTQ3MjU0XFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vdG9wbmF2LnZ1ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgdmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi1kNjU0NzI1NFxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3RvcG5hdi52dWVcIik7XG4gICAgIGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuICAgICB1cGRhdGUobmV3Q29udGVudCk7XG4gICB9KTtcbiB9XG4gLy8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIhLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtZDY1NDcyNTRcIixcInNjb3BlZFwiOnRydWUsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9sYXlvdXRzL3RvcG5hdi52dWVcbi8vIG1vZHVsZSBpZCA9IDIxMlxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHRydWUpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXCIsIFwiXCIsIHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJcIixcImZpbGVcIjpcInRvcG5hdi52dWVcIixcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi1kNjU0NzI1NFwiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvdG9wbmF2LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjEzXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIjx0ZW1wbGF0ZT5cbiAgICA8di10b29sYmFyIGRhcmsgY2xhc3M9XCJwcmltYXJ5XCI+XG4gICAgICAgIDx2LXRvb2xiYXItc2lkZS1pY29uIEBjbGljay5uYXRpdmUuc3RvcD1cInNpZGVCYXJUb2dnbGVcIj48L3YtdG9vbGJhci1zaWRlLWljb24+XG4gICAgICAgIDx2LXRvb2xiYXItdGl0bGUgQGNsaWNrPVwiZ290b0hvbWVcIiBjbGFzcz1cImNsaWNrYWJsZVwiPlxuICAgICAgICAgICAgQ29tbXVuaXR5IFdhdGNoXG4gICAgICAgIDwvdi10b29sYmFyLXRpdGxlPlxuICAgICAgICA8di1zcGFjZXI+PC92LXNwYWNlcj5cbiAgICAgICAgPHYtdG9vbGJhci1pdGVtcz5cbiAgICAgICAgICAgIDx2LWJ0biBmbGF0IEBjbGljaz1cInRvZ2dsZUZ1bGxMb2FkXCI+XG4gICAgICAgICAgICAgICAgPHYtaWNvbj5tZGktcmVsb2FkPC92LWljb24+XG4gICAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICAgICAgPHYtYnRuIGZsYXQgQGNsaWNrPVwidG9nZ2xlU2l0ZUxvYWRcIj5cbiAgICAgICAgICAgICAgICA8di1pY29uPm1kaS1sb29wPC92LWljb24+XG4gICAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICAgICAgPHYtYnRuIGZsYXQgQGNsaWNrPVwibG9nb3V0XCI+XG4gICAgICAgICAgICAgICAgPHYtaWNvbj5tZGktbG9nb3V0PC92LWljb24+XG4gICAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICA8L3YtdG9vbGJhci1pdGVtcz5cbiAgICA8L3YtdG9vbGJhcj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5pbXBvcnQgeyBtYXBBY3Rpb25zLCBtYXBHZXR0ZXJzLCBtYXBNdXRhdGlvbnMgfSBmcm9tICd2dWV4JztcbmltcG9ydCBzdG9yZVR5cGVzIGZyb20gJy4vLi4vc3RvcmUvdHlwZXMnO1xuaW1wb3J0IGxvYWRlciBmcm9tICcuLy4uL2hlbHBlcnMvbG9hZGVyJztcbmltcG9ydCBzbmFja2JhciBmcm9tICcuLy4uL2hlbHBlcnMvc25hY2tiYXInO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgZGF0YTogKCkgPT4gKHtcbiAgICAgICAgc2lkZUJhcjogdHJ1ZSxcbiAgICB9KSxcbiAgICBjb21wdXRlZDoge1xuICAgICAgICAuLi5tYXBHZXR0ZXJzKHtcbiAgICAgICAgICAgICdpc0xvYWRpbmcnOiBzdG9yZVR5cGVzLklTX0xPQURJTkcsXG4gICAgICAgICAgICAnaXNGdWxsTG9hZGluZyc6IHN0b3JlVHlwZXMuSVNfRlVMTF9MT0FESU5HLFxuICAgICAgICB9KVxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICBnb3RvSG9tZSgpIHtcbiAgICAgICAgICAgIHRoaXMuJHJvdXRlci5wdXNoKHsgbmFtZTogJ2luZGV4JyB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgc2lkZUJhclRvZ2dsZSgpIHtcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ3RvZ2dsZVNpZGViYXInKTtcbiAgICAgICAgfSxcbiAgICAgICAgbG9nb3V0KCkge1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaExvZ291dCgpO1xuICAgICAgICAgICAgc25hY2tiYXIuZmlyZShcIllvdSBoYXZlIHN1Y2Nlc3NmdWxseSBsb2dnZWQgb3V0XCIpO1xuICAgICAgICAgICAgdGhpcy4kcm91dGVyLnB1c2goeyBuYW1lOiAnaW5kZXgnIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0b2dnbGVTaXRlTG9hZCgpIHtcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nID8gbG9hZGVyLnN0b3AoKSA6IGxvYWRlci5zdGFydCgpO1xuICAgICAgICB9LFxuICAgICAgICB0b2dnbGVGdWxsTG9hZCgpIHtcbiAgICAgICAgICAgIHRoaXMuaXNGdWxsTG9hZGluZyA/IGxvYWRlci5zdG9wKCkgOiBsb2FkZXIuc3RhcnQoJ2Z1bGwnKTtcbiAgICAgICAgfSxcbiAgICAgICAgLi4ubWFwQWN0aW9ucyhzdG9yZVR5cGVzLmF1dGguTkFNRSwge1xuICAgICAgICAgICAgZGlzcGF0Y2hMb2dvdXQ6IHN0b3JlVHlwZXMuYXV0aC5VU0VSX0xPR09VVFxuICAgICAgICB9KVxuICAgIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgc2NvcGVkPlxuXG48L3N0eWxlPlxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHRvcG5hdi52dWU/ZDU1N2U5YjQiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ3YtdG9vbGJhcicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJwcmltYXJ5XCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwiZGFya1wiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtdG9vbGJhci1zaWRlLWljb24nLCB7XG4gICAgbmF0aXZlT246IHtcbiAgICAgIFwiY2xpY2tcIjogZnVuY3Rpb24oJGV2ZW50KSB7XG4gICAgICAgICRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgX3ZtLnNpZGVCYXJUb2dnbGUoJGV2ZW50KVxuICAgICAgfVxuICAgIH1cbiAgfSksIF92bS5fdihcIiBcIiksIF9jKCd2LXRvb2xiYXItdGl0bGUnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwiY2xpY2thYmxlXCIsXG4gICAgb246IHtcbiAgICAgIFwiY2xpY2tcIjogX3ZtLmdvdG9Ib21lXG4gICAgfVxuICB9LCBbX3ZtLl92KFwiXFxuICAgICAgICBDb21tdW5pdHkgV2F0Y2hcXG4gICAgXCIpXSksIF92bS5fdihcIiBcIiksIF9jKCd2LXNwYWNlcicpLCBfdm0uX3YoXCIgXCIpLCBfYygndi10b29sYmFyLWl0ZW1zJywgW19jKCd2LWJ0bicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJmbGF0XCI6IFwiXCJcbiAgICB9LFxuICAgIG9uOiB7XG4gICAgICBcImNsaWNrXCI6IF92bS50b2dnbGVGdWxsTG9hZFxuICAgIH1cbiAgfSwgW19jKCd2LWljb24nLCBbX3ZtLl92KFwibWRpLXJlbG9hZFwiKV0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWJ0bicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJmbGF0XCI6IFwiXCJcbiAgICB9LFxuICAgIG9uOiB7XG4gICAgICBcImNsaWNrXCI6IF92bS50b2dnbGVTaXRlTG9hZFxuICAgIH1cbiAgfSwgW19jKCd2LWljb24nLCBbX3ZtLl92KFwibWRpLWxvb3BcIildKV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1idG4nLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwiZmxhdFwiOiBcIlwiXG4gICAgfSxcbiAgICBvbjoge1xuICAgICAgXCJjbGlja1wiOiBfdm0ubG9nb3V0XG4gICAgfVxuICB9LCBbX2MoJ3YtaWNvbicsIFtfdm0uX3YoXCJtZGktbG9nb3V0XCIpXSldLCAxKV0sIDEpXSwgMSlcbn0sc3RhdGljUmVuZGVyRm5zOiBbXX1cbm1vZHVsZS5leHBvcnRzLnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgIHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIikucmVyZW5kZXIoXCJkYXRhLXYtZDY1NDcyNTRcIiwgbW9kdWxlLmV4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LWQ2NTQ3MjU0XCIsXCJoYXNTY29wZWRcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvdG9wbmF2LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjE1XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG5mdW5jdGlvbiBpbmplY3RTdHlsZSAoc3NyQ29udGV4dCkge1xuICBpZiAoZGlzcG9zZWQpIHJldHVyblxuICByZXF1aXJlKFwiISF2dWUtc3R5bGUtbG9hZGVyIWNzcy1sb2FkZXI/c291cmNlTWFwIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleD97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMTRmMGQyNDNcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXN0eWxlcyZpbmRleD0wIS4vZm9vdGVyLnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi9mb290ZXIudnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi0xNGYwZDI0M1xcXCIsXFxcImhhc1Njb3BlZFxcXCI6ZmFsc2V9IS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9mb290ZXIudnVlXCIpLFxuICAvKiBzdHlsZXMgKi9cbiAgaW5qZWN0U3R5bGUsXG4gIC8qIHNjb3BlSWQgKi9cbiAgbnVsbCxcbiAgLyogbW9kdWxlSWRlbnRpZmllciAoc2VydmVyIG9ubHkpICovXG4gIG51bGxcbilcbkNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9sYXlvdXRzL2Zvb3Rlci52dWVcIlxuaWYgKENvbXBvbmVudC5lc01vZHVsZSAmJiBPYmplY3Qua2V5cyhDb21wb25lbnQuZXNNb2R1bGUpLnNvbWUoZnVuY3Rpb24gKGtleSkge3JldHVybiBrZXkgIT09IFwiZGVmYXVsdFwiICYmIGtleS5zdWJzdHIoMCwgMikgIT09IFwiX19cIn0pKSB7Y29uc29sZS5lcnJvcihcIm5hbWVkIGV4cG9ydHMgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gKi52dWUgZmlsZXMuXCIpfVxuaWYgKENvbXBvbmVudC5vcHRpb25zLmZ1bmN0aW9uYWwpIHtjb25zb2xlLmVycm9yKFwiW3Z1ZS1sb2FkZXJdIGZvb3Rlci52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtMTRmMGQyNDNcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi0xNGYwZDI0M1wiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9sYXlvdXRzL2Zvb3Rlci52dWVcbi8vIG1vZHVsZSBpZCA9IDIxNlxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMTRmMGQyNDNcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vZm9vdGVyLnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiNTZjM2YzNjZcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMTRmMGQyNDNcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vZm9vdGVyLnZ1ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgdmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0xNGYwZDI0M1xcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9mb290ZXIudnVlXCIpO1xuICAgICBpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcbiAgICAgdXBkYXRlKG5ld0NvbnRlbnQpO1xuICAgfSk7XG4gfVxuIC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3NcbiBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTE0ZjBkMjQzXCIsXCJzY29wZWRcIjpmYWxzZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvZm9vdGVyLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjE3XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodHJ1ZSk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJcXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cIiwgXCJcIiwge1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W10sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIlwiLFwiZmlsZVwiOlwiZm9vdGVyLnZ1ZVwiLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG5cbi8vIGV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTE0ZjBkMjQzXCIsXCJzY29wZWRcIjpmYWxzZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2xheW91dHMvZm9vdGVyLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjE4XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIjx0ZW1wbGF0ZT5cbiAgICA8ZGl2PlxuICAgICAgICAyMDE3IFJheW1vbmRcbiAgICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5leHBvcnQgZGVmYXVsdCB7XG4gICAgZGF0YTogKCkgPT4gKHtcbiAgICAgICAgc2lkZUJhcjogdHJ1ZSwgXG4gICAgfSksXG59XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuXG48L3N0eWxlPlxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIGZvb3Rlci52dWU/NTg0MGFiZjUiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ2RpdicsIFtfdm0uX3YoXCJcXG4gICAgMjAxNyBSYXltb25kXFxuXCIpXSlcbn0sc3RhdGljUmVuZGVyRm5zOiBbXX1cbm1vZHVsZS5leHBvcnRzLnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgIHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIikucmVyZW5kZXIoXCJkYXRhLXYtMTRmMGQyNDNcIiwgbW9kdWxlLmV4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LTE0ZjBkMjQzXCIsXCJoYXNTY29wZWRcIjpmYWxzZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9sYXlvdXRzL2Zvb3Rlci52dWVcbi8vIG1vZHVsZSBpZCA9IDIyMFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ3YtYXBwJywgW19jKCd2LW5hdmlnYXRpb24tZHJhd2VyJywge1xuICAgIHN0YXRpY0NsYXNzOiBcInNlY29uZGFyeSBkYXJrZW4tM1wiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcInBlcnNpc3RlbnRcIjogXCJcIixcbiAgICAgIFwiZmxvYXRpbmdcIjogXCJcIlxuICAgIH0sXG4gICAgbW9kZWw6IHtcbiAgICAgIHZhbHVlOiAoX3ZtLnNpZGVCYXJPcGVuKSxcbiAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigkJHYpIHtcbiAgICAgICAgX3ZtLnNpZGVCYXJPcGVuID0gJCR2XG4gICAgICB9LFxuICAgICAgZXhwcmVzc2lvbjogXCJzaWRlQmFyT3BlblwiXG4gICAgfVxuICB9LCBbX2MoJ3Itc2lkZWJhcicpXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCdyLXRvcG5hdicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJmaXhlZC10b3BcIixcbiAgICBvbjoge1xuICAgICAgXCJ0b2dnbGVTaWRlYmFyXCI6IF92bS5zaWRlQmFyVG9nZ2xlXG4gICAgfVxuICB9KSwgX3ZtLl92KFwiIFwiKSwgX2MoJ21haW4nLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwiaWRcIjogXCJtYWluXCJcbiAgICB9XG4gIH0sIFtfYygndi1jb250YWluZXInLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwiZmx1aWRcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd0cmFuc2l0aW9uJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcIm5hbWVcIjogXCJmYWRlXCIsXG4gICAgICBcIm1vZGVcIjogXCJvdXQtaW5cIlxuICAgIH1cbiAgfSwgW19jKCdrZWVwLWFsaXZlJywgW19jKCdyb3V0ZXItdmlldycpXSwgMSldLCAxKV0sIDEpXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWZvb3RlcicsIFtfYygnci1mb290ZXInKV0sIDEpXSwgMSlcbn0sc3RhdGljUmVuZGVyRm5zOiBbXX1cbm1vZHVsZS5leHBvcnRzLnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgIHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIikucmVyZW5kZXIoXCJkYXRhLXYtYTgwMDBmNmFcIiwgbW9kdWxlLmV4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LWE4MDAwZjZhXCIsXCJoYXNTY29wZWRcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9kYXNoYm9hcmRQYWdlLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjIxXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsImltcG9ydCBIb21lIGZyb20gJ0AvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvaG9tZVNjcmVlbi52dWUnO1xuaW1wb3J0IFBvc3RzIGZyb20gJ0AvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvcG9zdHNTY3JlZW4udnVlJztcbmltcG9ydCBNZXNzYWdlcyBmcm9tICdAL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL21lc3NhZ2VzU2NyZWVuLnZ1ZSc7XG5cbmltcG9ydCBwIGZyb20gJy4vLi4vYXBpL3Bvc3RzJztcblxuZXhwb3J0IGRlZmF1bHQgW3tcbiAgICAgICAgcGF0aDogJycsXG4gICAgICAgIG5hbWU6ICdkYXNoLmhvbWUnLFxuICAgICAgICBjb21wb25lbnQ6IEhvbWVcbiAgICB9LFxuICAgIHtcbiAgICAgICAgcGF0aDogJ3Bvc3RzJyxcbiAgICAgICAgbmFtZTogJ2Rhc2gucG9zdHMnLFxuICAgICAgICBjb21wb25lbnQ6IFBvc3RzLFxuICAgICAgICBiZWZvcmVFbnRlcjogKHRvLCBmcm9tLCBuZXh0KSA9PiB7XG4gICAgICAgICAgICBwLmdldEFsbCgpXG4gICAgICAgICAgICAgICAgLnRoZW4ocG9zdHMgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhwb3N0cyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZ2V0IHBvc3RzIGJlZm9yZSBkYXNoXCIpO1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yaW5nXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIHBhdGg6ICdtZXNzYWdlcycsXG4gICAgICAgIG5hbWU6ICdkYXNoLm1lc3NhZ2VzJyxcbiAgICAgICAgY29tcG9uZW50OiBNZXNzYWdlc1xuICAgIH0sXG5dXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9yb3V0ZXIvZGFzaGJvYXJkUm91dGVzLmpzIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbmZ1bmN0aW9uIGluamVjdFN0eWxlIChzc3JDb250ZXh0KSB7XG4gIGlmIChkaXNwb3NlZCkgcmV0dXJuXG4gIHJlcXVpcmUoXCIhIXZ1ZS1zdHlsZS1sb2FkZXIhY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0zNGNhYjI0YVxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSFzdHlsdXMtbG9hZGVyIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXN0eWxlcyZpbmRleD0wIS4vaG9tZVNjcmVlbi52dWVcIilcbn1cbnZhciBDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplclwiKShcbiAgLyogc2NyaXB0ICovXG4gIHJlcXVpcmUoXCIhIWJhYmVsLWxvYWRlcj97XFxcImNhY2hlRGlyZWN0b3J5XFxcIjp0cnVlLFxcXCJwcmVzZXRzXFxcIjpbW1xcXCJlbnZcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2UsXFxcInRhcmdldHNcXFwiOntcXFwiYnJvd3NlcnNcXFwiOltcXFwiPiAyJVxcXCJdLFxcXCJ1Z2xpZnlcXFwiOnRydWV9fV0sW1xcXCJlczIwMTVcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2V9XSxbXFxcInN0YWdlLTJcXFwiXV19IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vaG9tZVNjcmVlbi52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LTM0Y2FiMjRhXFxcIixcXFwiaGFzU2NvcGVkXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vaG9tZVNjcmVlbi52dWVcIiksXG4gIC8qIHN0eWxlcyAqL1xuICBpbmplY3RTdHlsZSxcbiAgLyogc2NvcGVJZCAqL1xuICBcImRhdGEtdi0zNGNhYjI0YVwiLFxuICAvKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbiAgbnVsbFxuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL2hvbWVTY3JlZW4udnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSBob21lU2NyZWVuLnZ1ZTogZnVuY3Rpb25hbCBjb21wb25lbnRzIGFyZSBub3Qgc3VwcG9ydGVkIHdpdGggdGVtcGxhdGVzLCB0aGV5IHNob3VsZCB1c2UgcmVuZGVyIGZ1bmN0aW9ucy5cIil9XG5cbi8qIGhvdCByZWxvYWQgKi9cbmlmIChtb2R1bGUuaG90KSB7KGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhvdEFQSSA9IHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIilcbiAgaG90QVBJLmluc3RhbGwocmVxdWlyZShcInZ1ZVwiKSwgZmFsc2UpXG4gIGlmICghaG90QVBJLmNvbXBhdGlibGUpIHJldHVyblxuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmICghbW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgaG90QVBJLmNyZWF0ZVJlY29yZChcImRhdGEtdi0zNGNhYjI0YVwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfSBlbHNlIHtcbiAgICBob3RBUEkucmVsb2FkKFwiZGF0YS12LTM0Y2FiMjRhXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9XG4gIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbiAoZGF0YSkge1xuICAgIGRpc3Bvc2VkID0gdHJ1ZVxuICB9KVxufSkoKX1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQuZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL2hvbWVTY3JlZW4udnVlXG4vLyBtb2R1bGUgaWQgPSAyMjNcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTM0Y2FiMjRhXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vaG9tZVNjcmVlbi52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcIjBiNzI4ODRjXCIsIGNvbnRlbnQsIGZhbHNlKTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTM0Y2FiMjRhXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vaG9tZVNjcmVlbi52dWVcIiwgZnVuY3Rpb24oKSB7XG4gICAgIHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMzRjYWIyNGFcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9ob21lU2NyZWVuLnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi0zNGNhYjI0YVwiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvaG9tZVNjcmVlbi52dWVcbi8vIG1vZHVsZSBpZCA9IDIyNFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHRydWUpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiXFxuZGl2W2RhdGEtdi0zNGNhYjI0YV0ge1xcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xcbn1cXG5pbWdbZGF0YS12LTM0Y2FiMjRhXSB7XFxuICB3aWR0aDogMTUwcHg7XFxufVxcbmgxW2RhdGEtdi0zNGNhYjI0YV0ge1xcbiAgY29sb3I6ICNmMDA7XFxufVxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvaG9tZVNjcmVlbi52dWVcIixcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvaG9tZVNjcmVlbi52dWVcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIjtBQWNBO0VBQ0ksbUJBQUE7Q0NiSDtBRGdCRDtFQUNJLGFBQUE7Q0NkSDtBRGlCRDtFQUNJLFlBQUE7Q0NmSFwiLFwiZmlsZVwiOlwiaG9tZVNjcmVlbi52dWVcIixcInNvdXJjZXNDb250ZW50XCI6W1wiXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuZGl2IHtcXG4gICAgdGV4dC1hbGlnbjogY2VudGVyXFxufVxcblxcbmltZyB7XFxuICAgIHdpZHRoOiAxNTBweFxcbn1cXG5cXG5oMSB7XFxuICAgIGNvbG9yOiByZWQ7XFxufVxcblxcblwiLFwiZGl2IHtcXG4gIHRleHQtYWxpZ246IGNlbnRlcjtcXG59XFxuaW1nIHtcXG4gIHdpZHRoOiAxNTBweDtcXG59XFxuaDEge1xcbiAgY29sb3I6ICNmMDA7XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi0zNGNhYjI0YVwiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvaG9tZVNjcmVlbi52dWVcbi8vIG1vZHVsZSBpZCA9IDIyNVxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCI8dGVtcGxhdGU+XG4gICAgPGRpdj5cbiAgICAgICAgPGltZyBzcmM9XCIvaW1hZ2VzL2xvZ28uc3ZnXCIgYWx0PVwiVnVldGlmeS5qc1wiPlxuICAgICAgICA8aDE+SG9tZSBTY3JlZW48L2gxPlxuICAgIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmV4cG9ydCBkZWZhdWx0IHtcblxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic3R5bHVzXCIgc2NvcGVkPlxuZGl2IHtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXJcbn1cblxuaW1nIHtcbiAgICB3aWR0aDogMTUwcHhcbn1cblxuaDEge1xuICAgIGNvbG9yOiByZWQ7XG59XG5cbjwvc3R5bGU+XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gaG9tZVNjcmVlbi52dWU/NTVlMzY3N2EiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX3ZtLl9tKDApXG59LHN0YXRpY1JlbmRlckZuczogW2Z1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ2RpdicsIFtfYygnaW1nJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInNyY1wiOiBcIi9pbWFnZXMvbG9nby5zdmdcIixcbiAgICAgIFwiYWx0XCI6IFwiVnVldGlmeS5qc1wiXG4gICAgfVxuICB9KSwgX3ZtLl92KFwiIFwiKSwgX2MoJ2gxJywgW192bS5fdihcIkhvbWUgU2NyZWVuXCIpXSldKVxufV19XG5tb2R1bGUuZXhwb3J0cy5yZW5kZXIuX3dpdGhTdHJpcHBlZCA9IHRydWVcbmlmIChtb2R1bGUuaG90KSB7XG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKG1vZHVsZS5ob3QuZGF0YSkge1xuICAgICByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpLnJlcmVuZGVyKFwiZGF0YS12LTM0Y2FiMjRhXCIsIG1vZHVsZS5leHBvcnRzKVxuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXI/e1wiaWRcIjpcImRhdGEtdi0zNGNhYjI0YVwiLFwiaGFzU2NvcGVkXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9ob21lU2NyZWVuLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjI3XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG5mdW5jdGlvbiBpbmplY3RTdHlsZSAoc3NyQ29udGV4dCkge1xuICBpZiAoZGlzcG9zZWQpIHJldHVyblxuICByZXF1aXJlKFwiISF2dWUtc3R5bGUtbG9hZGVyIWNzcy1sb2FkZXI/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleD97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtZWNmNDBlYzJcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IXN0eWx1cy1sb2FkZXIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9wb3N0c1NjcmVlbi52dWVcIilcbn1cbnZhciBDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplclwiKShcbiAgLyogc2NyaXB0ICovXG4gIHJlcXVpcmUoXCIhIWJhYmVsLWxvYWRlcj97XFxcImNhY2hlRGlyZWN0b3J5XFxcIjp0cnVlLFxcXCJwcmVzZXRzXFxcIjpbW1xcXCJlbnZcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2UsXFxcInRhcmdldHNcXFwiOntcXFwiYnJvd3NlcnNcXFwiOltcXFwiPiAyJVxcXCJdLFxcXCJ1Z2xpZnlcXFwiOnRydWV9fV0sW1xcXCJlczIwMTVcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2V9XSxbXFxcInN0YWdlLTJcXFwiXV19IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vcG9zdHNTY3JlZW4udnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi1lY2Y0MGVjMlxcXCIsXFxcImhhc1Njb3BlZFxcXCI6ZmFsc2V9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9wb3N0c1NjcmVlbi52dWVcIiksXG4gIC8qIHN0eWxlcyAqL1xuICBpbmplY3RTdHlsZSxcbiAgLyogc2NvcGVJZCAqL1xuICBudWxsLFxuICAvKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbiAgbnVsbFxuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL3Bvc3RzU2NyZWVuLnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gcG9zdHNTY3JlZW4udnVlOiBmdW5jdGlvbmFsIGNvbXBvbmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0ZW1wbGF0ZXMsIHRoZXkgc2hvdWxkIHVzZSByZW5kZXIgZnVuY3Rpb25zLlwiKX1cblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LWVjZjQwZWMyXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtZWNmNDBlYzJcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvcG9zdHNTY3JlZW4udnVlXG4vLyBtb2R1bGUgaWQgPSAyMjhcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWVjZjQwZWMyXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Bvc3RzU2NyZWVuLnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiMGI4YjRjMTlcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtZWNmNDBlYzJcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcG9zdHNTY3JlZW4udnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWVjZjQwZWMyXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Bvc3RzU2NyZWVuLnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi1lY2Y0MGVjMlwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL3Bvc3RzU2NyZWVuLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjI5XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodHJ1ZSk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJcXG4uZmFiLWhvbGRlciB7XFxuICBwb3NpdGlvbjogZml4ZWQ7XFxuICB6LWluZGV4OiAyMDtcXG4gIGJvdHRvbTogMzBweDtcXG4gIHJpZ2h0OiAzMHB4O1xcbn1cXG5AbWVkaWEgb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMjVweCkge1xcbi5mYWItaG9sZGVyIHtcXG4gICAgcmlnaHQ6IDE1MHB4O1xcbn1cXG59XFxuLmNvbW1lbnQtYm94IHtcXG4gIG1heC1oZWlnaHQ6IDUwMHB4O1xcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcXG59XFxuLmZhZGUtZW50ZXItYWN0aXZlIHtcXG4gIHRyYW5zaXRpb246IG1heC1oZWlnaHQgMC4ycyBlYXNlLWluO1xcbn1cXG4uZmFkZS1sZWF2ZS1hY3RpdmUge1xcbiAgdHJhbnNpdGlvbjogbWF4LWhlaWdodCAwLjJzIGVhc2Utb3V0O1xcbn1cXG4uZmFkZS1lbnRlcixcXG4uZmFkZS1sZWF2ZS1hY3RpdmUge1xcbiAgbWF4LWhlaWdodDogMHB4O1xcbn1cXG5cIiwgXCJcIiwge1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL3Bvc3RzU2NyZWVuLnZ1ZVwiLFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9wb3N0c1NjcmVlbi52dWVcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIjtBQXVFQTtFQUNJLGdCQUFBO0VBQ0EsWUFBQTtFQUNBLGFBQUE7RUFDQSxZQUFBO0NDdEVIO0FEdUU0QztBQUFBO0lBQ3JDLGFBQUE7Q0NwRUw7Q0FDRjtBRHNFRDtFQUNJLGtCQUFBO0VBQ0EsaUJBQUE7Q0NwRUg7QUR1RUQ7RUFDQyxvQ0FBQTtDQ3JFQTtBRHVFRDtFQUNDLHFDQUFBO0NDckVBO0FEdUVEOztFQUNDLGdCQUFBO0NDcEVBXCIsXCJmaWxlXCI6XCJwb3N0c1NjcmVlbi52dWVcIixcInNvdXJjZXNDb250ZW50XCI6W1wiXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuLmZhYi1ob2xkZXJ7XFxuICAgIHBvc2l0aW9uOiBmaXhlZDtcXG4gICAgei1pbmRleDogMjA7XFxuICAgIGJvdHRvbTogMzBweDtcXG4gICAgcmlnaHQ6IDMwcHg7XFxuICAgIEBtZWRpYSBvbmx5IHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAyNXB4KXtcXG4gICAgICAgIHJpZ2h0OiAxNTBweDtcXG4gICAgfVxcbn1cXG4uY29tbWVudC1ib3h7XFxuICAgIG1heC1oZWlnaHQ6IDUwMHB4O1xcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xcbn1cXG5cXHRcXG4uZmFkZS1lbnRlci1hY3RpdmUgXFxuXFx0dHJhbnNpdGlvbiBtYXgtaGVpZ2h0IC4ycyBlYXNlLWluXFxuXFxuLmZhZGUtbGVhdmUtYWN0aXZlXFxuXFx0dHJhbnNpdGlvbiBtYXgtaGVpZ2h0IC4ycyBlYXNlLW91dFxcblxcbi5mYWRlLWVudGVyLCAuZmFkZS1sZWF2ZS1hY3RpdmVcXG5cXHRtYXgtaGVpZ2h0IDBweFxcblxcblwiLFwiLmZhYi1ob2xkZXIge1xcbiAgcG9zaXRpb246IGZpeGVkO1xcbiAgei1pbmRleDogMjA7XFxuICBib3R0b206IDMwcHg7XFxuICByaWdodDogMzBweDtcXG59XFxuQG1lZGlhIG9ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDI1cHgpIHtcXG4gIC5mYWItaG9sZGVyIHtcXG4gICAgcmlnaHQ6IDE1MHB4O1xcbiAgfVxcbn1cXG4uY29tbWVudC1ib3gge1xcbiAgbWF4LWhlaWdodDogNTAwcHg7XFxuICBvdmVyZmxvdzogaGlkZGVuO1xcbn1cXG4uZmFkZS1lbnRlci1hY3RpdmUge1xcbiAgdHJhbnNpdGlvbjogbWF4LWhlaWdodCAwLjJzIGVhc2UtaW47XFxufVxcbi5mYWRlLWxlYXZlLWFjdGl2ZSB7XFxuICB0cmFuc2l0aW9uOiBtYXgtaGVpZ2h0IDAuMnMgZWFzZS1vdXQ7XFxufVxcbi5mYWRlLWVudGVyLFxcbi5mYWRlLWxlYXZlLWFjdGl2ZSB7XFxuICBtYXgtaGVpZ2h0OiAwcHg7XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi1lY2Y0MGVjMlwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL3Bvc3RzU2NyZWVuLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjMwXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIjx0ZW1wbGF0ZT5cbiAgICA8ZGl2PlxuICAgICAgICA8di1sYXlvdXQgY2xhc3M9XCJtYi0zXCIganVzdGlmeS1jZW50ZXI+XG4gICAgICAgICAgICA8di1mbGV4IHhzMTIgc204IG1kNiBsZzU+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRsaW5lXCI+UG9zdHM8L2Rpdj5cbiAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICA8L3YtbGF5b3V0PlxuICAgIFxuICAgICAgICA8di1sYXlvdXQgd3JhcCBqdXN0aWZ5LWNlbnRlcj5cbiAgICAgICAgICAgIDx2LWZsZXggeHMxMiBzbTggbWQ2IGxnNT5cbiAgICAgICAgICAgICAgICA8ci1wb3N0cyA6cG9zdHM9XCJwb3N0c1wiPjwvci1wb3N0cz5cbiAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICA8L3YtbGF5b3V0PlxuICAgIFxuICAgICAgICA8ZGl2IGNsYXNzPVwiZmFiLWhvbGRlclwiPlxuICAgICAgICAgICAgPHYtYnRuIEBjbGljay5uYXRpdmUuc3RvcD1cIm9wZW5OZXdQb3N0XCIgZGFyayBmYWIgY2xhc3M9XCJwcmltYXJ5XCIgdi10b29sdGlwOnRvcD1cInsgaHRtbDogJ25ldyBwb3N0JyB9XCI+XG4gICAgICAgICAgICAgICAgPHYtaWNvbj5hZGQ8L3YtaWNvbj5cbiAgICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgIDwvZGl2PlxuICAgIFxuICAgICAgICA8di1kaWFsb2cgdi1tb2RlbD1cIm5ld1Bvc3RNb2RhbFwiIHdpZHRoPVwiNjAwcHhcIj5cbiAgICAgICAgICAgIDxyLWFkZC1wb3N0IDpjbGVhcj1cImNsZWFyTmV3UG9zdFwiIHVzZXJJbWFnZT1cIi9pbWFnZXMvYXZhdGFyMS5qcGdcIiBAY2FuY2VsZWQ9XCJuZXdQb3N0TW9kYWwgPSBmYWxzZVwiIEBwb3N0ZWQ9XCJhZGRQb3N0XCI+PC9yLWFkZC1wb3N0PlxuICAgICAgICA8L3YtZGlhbG9nPlxuICAgIFxuICAgIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmltcG9ydCBQb3N0cyBmcm9tICdAL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL1Bvc3RMaXN0J1xuaW1wb3J0IEFkZFBvc3QgZnJvbSAnQC9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9BZGRQb3N0J1xuaW1wb3J0IHsgbWFwR2V0dGVycyB9IGZyb20gJ3Z1ZXgnO1xuaW1wb3J0IHBBcGkgZnJvbSAnLi8uLi8uLi8uLi9hcGkvcG9zdHMnO1xuaW1wb3J0IHR5cGVzIGZyb20gJy4vLi4vLi4vLi4vc3RvcmUvdHlwZXMnO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgY29tcG9uZW50czoge1xuICAgICAgICByUG9zdHM6IFBvc3RzLFxuICAgICAgICByQWRkUG9zdDogQWRkUG9zdCxcbiAgICB9LFxuICAgIGRhdGEoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzaG93OiBmYWxzZSxcbiAgICAgICAgICAgIC8vIHBvc3RzOiBbXSxcbiAgICAgICAgICAgIG5ld1Bvc3RNb2RhbDogZmFsc2UsXG4gICAgICAgICAgICBjb3VudGVyOiAzXG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIGNsZWFyTmV3UG9zdCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5ld1Bvc3RNb2RhbDtcbiAgICAgICAgfSxcbiAgICAgICAgLi4ubWFwR2V0dGVycyh0eXBlcy5wb3N0Lk5BTUUsIHtcbiAgICAgICAgICAgIHBvc3RzOiB0eXBlcy5wb3N0LkdFVF9QT1NUU1xuICAgICAgICB9KVxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICBvcGVuTmV3UG9zdCgpIHtcbiAgICAgICAgICAgIHRoaXMubmV3UG9zdE1vZGFsID0gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkUG9zdChuZXdQb3N0KSB7XG4gICAgICAgICAgICBwQXBpLmFkZFBvc3QobmV3UG9zdClcbiAgICAgICAgICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1Bvc3RNb2RhbCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsb3NlQWRkUG9zdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz0nc3R5bHVzJz5cbi5mYWItaG9sZGVye1xuICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICB6LWluZGV4OiAyMDtcbiAgICBib3R0b206IDMwcHg7XG4gICAgcmlnaHQ6IDMwcHg7XG4gICAgQG1lZGlhIG9ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDI1cHgpe1xuICAgICAgICByaWdodDogMTUwcHg7XG4gICAgfVxufVxuLmNvbW1lbnQtYm94e1xuICAgIG1heC1oZWlnaHQ6IDUwMHB4O1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG59XG5cdFxuLmZhZGUtZW50ZXItYWN0aXZlIFxuXHR0cmFuc2l0aW9uIG1heC1oZWlnaHQgLjJzIGVhc2UtaW5cblxuLmZhZGUtbGVhdmUtYWN0aXZlXG5cdHRyYW5zaXRpb24gbWF4LWhlaWdodCAuMnMgZWFzZS1vdXRcblxuLmZhZGUtZW50ZXIsIC5mYWRlLWxlYXZlLWFjdGl2ZVxuXHRtYXgtaGVpZ2h0IDBweFxuXG48L3N0eWxlPlxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHBvc3RzU2NyZWVuLnZ1ZT81YjNiNzNhNSIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG5mdW5jdGlvbiBpbmplY3RTdHlsZSAoc3NyQ29udGV4dCkge1xuICBpZiAoZGlzcG9zZWQpIHJldHVyblxuICByZXF1aXJlKFwiISF2dWUtc3R5bGUtbG9hZGVyIWNzcy1sb2FkZXI/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleD97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtYWU5YjE4NjZcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IXN0eWx1cy1sb2FkZXIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9Qb3N0TGlzdC52dWVcIilcbn1cbnZhciBDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplclwiKShcbiAgLyogc2NyaXB0ICovXG4gIHJlcXVpcmUoXCIhIWJhYmVsLWxvYWRlcj97XFxcImNhY2hlRGlyZWN0b3J5XFxcIjp0cnVlLFxcXCJwcmVzZXRzXFxcIjpbW1xcXCJlbnZcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2UsXFxcInRhcmdldHNcXFwiOntcXFwiYnJvd3NlcnNcXFwiOltcXFwiPiAyJVxcXCJdLFxcXCJ1Z2xpZnlcXFwiOnRydWV9fV0sW1xcXCJlczIwMTVcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2V9XSxbXFxcInN0YWdlLTJcXFwiXV19IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vUG9zdExpc3QudnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi1hZTliMTg2NlxcXCIsXFxcImhhc1Njb3BlZFxcXCI6ZmFsc2V9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9Qb3N0TGlzdC52dWVcIiksXG4gIC8qIHN0eWxlcyAqL1xuICBpbmplY3RTdHlsZSxcbiAgLyogc2NvcGVJZCAqL1xuICBudWxsLFxuICAvKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbiAgbnVsbFxuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL1Bvc3RMaXN0LnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gUG9zdExpc3QudnVlOiBmdW5jdGlvbmFsIGNvbXBvbmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0ZW1wbGF0ZXMsIHRoZXkgc2hvdWxkIHVzZSByZW5kZXIgZnVuY3Rpb25zLlwiKX1cblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LWFlOWIxODY2XCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtYWU5YjE4NjZcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdExpc3QudnVlXG4vLyBtb2R1bGUgaWQgPSAyMzJcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWFlOWIxODY2XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL1Bvc3RMaXN0LnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiMTExZTZjN2FcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtYWU5YjE4NjZcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vUG9zdExpc3QudnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWFlOWIxODY2XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL1Bvc3RMaXN0LnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi1hZTliMTg2NlwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL1Bvc3RMaXN0LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjMzXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodHJ1ZSk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJcXG4ubGlzdC1lbnRlci1hY3RpdmUge1xcbiAgdHJhbnNpdGlvbjogYWxsIDAuM3MgMC42cztcXG59XFxuLmxpc3QtbGVhdmUtYWN0aXZlIHtcXG4gIHRyYW5zaXRpb246IGFsbCAwLjNzO1xcbn1cXG4ubGlzdC1lbnRlcixcXG4ubGlzdC1sZWF2ZS10byB7XFxuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMTMwMHB4KTtcXG59XFxuLmxpc3QtbW92ZSB7XFxuICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMC4zcyAwLjNzO1xcbn1cXG4ubGlzdC1sZWF2ZS1hY3RpdmUge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbn1cXG5cIiwgXCJcIiwge1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL1Bvc3RMaXN0LnZ1ZVwiLFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9Qb3N0TGlzdC52dWVcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIjtBQWlDQTtFQUNFLDBCQUFBO0NDaENEO0FEa0NEO0VBQ0UscUJBQUE7Q0NoQ0Q7QURrQ0Q7O0VBRUUsOEJBQUE7Q0NoQ0Q7QURrQ0Q7RUFDRSxnQ0FBQTtDQ2hDRDtBRGtDRDtFQUNFLG1CQUFBO0NDaENEXCIsXCJmaWxlXCI6XCJQb3N0TGlzdC52dWVcIixcInNvdXJjZXNDb250ZW50XCI6W1wiXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuLmxpc3QtZW50ZXItYWN0aXZlIHtcXG4gIHRyYW5zaXRpb246IGFsbCAuM3MgLjZzO1xcbn1cXG4ubGlzdC1sZWF2ZS1hY3RpdmUge1xcbiAgdHJhbnNpdGlvbjogYWxsIC4zcztcXG59XFxuLmxpc3QtZW50ZXIsIC5saXN0LWxlYXZlLXRvIHtcXG4vLyAgIG9wYWNpdHk6IDA7XFxuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMTMwMHB4KTtcXG59XFxuLmxpc3QtbW92ZSB7XFxuICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gLjNzIC4zcztcXG59XFxuLmxpc3QtbGVhdmUtYWN0aXZlIHtcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG59XFxuXCIsXCIubGlzdC1lbnRlci1hY3RpdmUge1xcbiAgdHJhbnNpdGlvbjogYWxsIDAuM3MgMC42cztcXG59XFxuLmxpc3QtbGVhdmUtYWN0aXZlIHtcXG4gIHRyYW5zaXRpb246IGFsbCAwLjNzO1xcbn1cXG4ubGlzdC1lbnRlcixcXG4ubGlzdC1sZWF2ZS10byB7XFxuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMTMwMHB4KTtcXG59XFxuLmxpc3QtbW92ZSB7XFxuICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMC4zcyAwLjNzO1xcbn1cXG4ubGlzdC1sZWF2ZS1hY3RpdmUge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbn1cXG5cIl0sXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtYWU5YjE4NjZcIixcInNjb3BlZFwiOmZhbHNlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9Qb3N0TGlzdC52dWVcbi8vIG1vZHVsZSBpZCA9IDIzNFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCI8dGVtcGxhdGU+XG4gICAgPGRpdj5cbiAgICAgICAgPHYtbGF5b3V0IGNsYXNzPVwicHktMFwiIHJvdyB3cmFwPlxuICAgICAgICAgICAgPHRyYW5zaXRpb24tZ3JvdXAgbmFtZT1cImxpc3RcIj5cbiAgICAgICAgICAgICAgICA8di1mbGV4IHhzMTIgbWQxMiB2LWZvcj1cIihwb3N0LCBpKSBpbiBwb3N0c1wiIDprZXk9XCJwb3N0LmlkXCI+XG4gICAgICAgICAgICAgICAgICAgIDxyLXBvc3QgOnBvc3Q9XCJwb3N0XCIgY2xhc3M9XCJtYi01XCIgQHJlbW92ZT1cInJlbW92ZVBvc3RcIj48L3ItcG9zdD5cbiAgICAgICAgICAgICAgICA8L3YtZmxleD5cbiAgICAgICAgICAgIDwvdHJhbnNpdGlvbi1ncm91cD5cbiAgICAgICAgPC92LWxheW91dD5cbiAgICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5pbXBvcnQgUG9zdCBmcm9tICcuL1Bvc3QnO1xuZXhwb3J0IGRlZmF1bHQge1xuICAgIHByb3BzOiBbJ3Bvc3RzJ10sXG4gICAgY29tcG9uZW50czoge1xuICAgICAgICByUG9zdDogUG9zdFxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICByZW1vdmVQb3N0KHApe1xuICAgICAgICAgICAgdGhpcy5wb3N0cy5mb3JFYWNoKChwb3N0LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHBvc3QuaWQgPT0gcCl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9zdHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH0gICBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic3R5bHVzXCI+XG4ubGlzdC1lbnRlci1hY3RpdmUge1xuICB0cmFuc2l0aW9uOiBhbGwgLjNzIC42cztcbn1cbi5saXN0LWxlYXZlLWFjdGl2ZSB7XG4gIHRyYW5zaXRpb246IGFsbCAuM3M7XG59XG4ubGlzdC1lbnRlciwgLmxpc3QtbGVhdmUtdG8ge1xuLy8gICBvcGFjaXR5OiAwO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMTMwMHB4KTtcbn1cbi5saXN0LW1vdmUge1xuICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gLjNzIC4zcztcbn1cbi5saXN0LWxlYXZlLWFjdGl2ZSB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbn1cbjwvc3R5bGU+XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIFBvc3RMaXN0LnZ1ZT82YjNiNDI2YyIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG5mdW5jdGlvbiBpbmplY3RTdHlsZSAoc3NyQ29udGV4dCkge1xuICBpZiAoZGlzcG9zZWQpIHJldHVyblxuICByZXF1aXJlKFwiISF2dWUtc3R5bGUtbG9hZGVyIWNzcy1sb2FkZXI/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleD97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtYTZiZDljZTJcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hc3R5bHVzLWxvYWRlciEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL1Bvc3QudnVlXCIpXG59XG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIikoXG4gIC8qIHNjcmlwdCAqL1xuICByZXF1aXJlKFwiISFiYWJlbC1sb2FkZXI/e1xcXCJjYWNoZURpcmVjdG9yeVxcXCI6dHJ1ZSxcXFwicHJlc2V0c1xcXCI6W1tcXFwiZW52XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlLFxcXCJ0YXJnZXRzXFxcIjp7XFxcImJyb3dzZXJzXFxcIjpbXFxcIj4gMiVcXFwiXSxcXFwidWdsaWZ5XFxcIjp0cnVlfX1dLFtcXFwiZXMyMDE1XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlfV0sW1xcXCJzdGFnZS0yXFxcIl1dfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL1Bvc3QudnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi1hNmJkOWNlMlxcXCIsXFxcImhhc1Njb3BlZFxcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL1Bvc3QudnVlXCIpLFxuICAvKiBzdHlsZXMgKi9cbiAgaW5qZWN0U3R5bGUsXG4gIC8qIHNjb3BlSWQgKi9cbiAgXCJkYXRhLXYtYTZiZDljZTJcIixcbiAgLyogbW9kdWxlSWRlbnRpZmllciAoc2VydmVyIG9ubHkpICovXG4gIG51bGxcbilcbkNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9Qb3N0LnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gUG9zdC52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtYTZiZDljZTJcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi1hNmJkOWNlMlwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9Qb3N0LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjM2XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi1hNmJkOWNlMlxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL1Bvc3QudnVlXCIpO1xuaWYodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSBjb250ZW50ID0gW1ttb2R1bGUuaWQsIGNvbnRlbnQsICcnXV07XG5pZihjb250ZW50LmxvY2FscykgbW9kdWxlLmV4cG9ydHMgPSBjb250ZW50LmxvY2Fscztcbi8vIGFkZCB0aGUgc3R5bGVzIHRvIHRoZSBET01cbnZhciB1cGRhdGUgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXNDbGllbnQuanNcIikoXCIwNGViM2E5N1wiLCBjb250ZW50LCBmYWxzZSk7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG4gLy8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3NcbiBpZighY29udGVudC5sb2NhbHMpIHtcbiAgIG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi1hNmJkOWNlMlxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL1Bvc3QudnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWE2YmQ5Y2UyXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vUG9zdC52dWVcIik7XG4gICAgIGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuICAgICB1cGRhdGUobmV3Q29udGVudCk7XG4gICB9KTtcbiB9XG4gLy8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIhLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtYTZiZDljZTJcIixcInNjb3BlZFwiOnRydWUsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL1Bvc3QudnVlXG4vLyBtb2R1bGUgaWQgPSAyMzdcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSh0cnVlKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIlxcbi5wb3N0LWNhcmRbZGF0YS12LWE2YmQ5Y2UyXSB7XFxuICB3aWR0aDogMTAwJTtcXG4gIG1pbi13aWR0aDogNDAwcHg7XFxufVxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdC52dWVcIixcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdC52dWVcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIjtBQXFHQTtFQUNJLFlBQUE7RUFDQSxpQkFBQTtDQ3BHSFwiLFwiZmlsZVwiOlwiUG9zdC52dWVcIixcInNvdXJjZXNDb250ZW50XCI6W1wiXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuLnBvc3QtY2FyZHtcXG4gICAgd2lkdGg6IDEwMCU7XFxuICAgIG1pbi13aWR0aDogNDAwcHg7XFxufVxcblwiLFwiLnBvc3QtY2FyZCB7XFxuICB3aWR0aDogMTAwJTtcXG4gIG1pbi13aWR0aDogNDAwcHg7XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi1hNmJkOWNlMlwiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdC52dWVcbi8vIG1vZHVsZSBpZCA9IDIzOFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCI8dGVtcGxhdGU+XG4gICAgPHYtY2FyZCBjbGFzcz1cInBvc3QtY2FyZCBtYi01XCI+XG4gICAgXG4gICAgICAgIDx2LXN5c3RlbS1iYXIgc3RhdHVzIGNsYXNzPVwiaW5mb1wiIGRhcmsgdi1pZj1cInBvc3QucmVwb3J0XCI+XG4gICAgICAgICAgICA8di1pY29uPnJlcG9ydDwvdi1pY29uPlxuICAgICAgICAgICAgVGhpcyBoYXMgYmVlbiByZXBvcnRlZCB0byB0aGUgcG9saWNlXG4gICAgICAgICAgICA8di1zcGFjZXI+PC92LXNwYWNlcj5cbiAgICAgICAgICAgIDx2LWljb24+bG9jYXRpb25fb248L3YtaWNvbj5cbiAgICAgICAgICAgIDxzcGFuPkFnZWdlPC9zcGFuPlxuICAgICAgICA8L3Ytc3lzdGVtLWJhcj5cbiAgICBcbiAgICAgICAgPHYtY2FyZC1hY3Rpb25zIGNsYXNzPVwibWEtMCBwYS0wXCI+XG4gICAgICAgICAgICA8ci11c2VyLXRvcCA6dXNlcj1cInBvc3QudXNlclwiPjwvci11c2VyLXRvcD5cbiAgICAgICAgICAgIDx2LXNwYWNlcj48L3Ytc3BhY2VyPlxuICAgICAgICAgICAgPHYtbWVudSBib3R0b20gcmlnaHQ+XG4gICAgICAgICAgICAgICAgPHYtYnRuIGljb24gc2xvdD1cImFjdGl2YXRvclwiPlxuICAgICAgICAgICAgICAgICAgICA8di1pY29uPm1vcmVfdmVydDwvdi1pY29uPlxuICAgICAgICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgICAgICAgICAgPHYtbGlzdD5cbiAgICAgICAgICAgICAgICAgICAgPHYtbGlzdC10aWxlIEBjbGljay5uYXRpdmU9XCJyZW1vdmVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx2LWxpc3QtdGlsZS1jb250ZW50PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx2LWxpc3QtdGlsZS10aXRsZSBjbGFzcz1cImVycm9yLS10ZXh0XCI+RGVsZXRlPC92LWxpc3QtdGlsZS10aXRsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdi1saXN0LXRpbGUtY29udGVudD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx2LWxpc3QtdGlsZS1hY3Rpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHYtaWNvbiBjbGFzcz1cImVycm9yLS10ZXh0XCI+ZGVsZXRlPC92LWljb24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3YtbGlzdC10aWxlLWFjdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPC92LWxpc3QtdGlsZT5cbiAgICAgICAgICAgICAgICAgICAgPHYtbGlzdC10aWxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHYtbGlzdC10aWxlLWNvbnRlbnQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHYtbGlzdC10aWxlLXRpdGxlIGNsYXNzPVwiaW5mby0tdGV4dFwiPlJlcG9ydDwvdi1saXN0LXRpbGUtdGl0bGU+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3YtbGlzdC10aWxlLWNvbnRlbnQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8di1saXN0LXRpbGUtYWN0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx2LWljb24gY2xhc3M9XCJpbmZvLS10ZXh0XCI+cmVwb3J0PC92LWljb24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3YtbGlzdC10aWxlLWFjdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPC92LWxpc3QtdGlsZT5cbiAgICAgICAgICAgICAgICA8L3YtbGlzdD5cbiAgICAgICAgICAgIDwvdi1tZW51PlxuICAgICAgICA8L3YtY2FyZC1hY3Rpb25zPlxuICAgIFxuICAgICAgICA8di1jYXJkLW1lZGlhIHYtaWY9XCJwb3N0Lm1lZGlhXCIgOnNyYz1cInBvc3QubWVkaWFcIiBoZWlnaHQ9XCIzMDBweFwiPjwvdi1jYXJkLW1lZGlhPlxuICAgICAgICA8di1kaXZpZGVyIHYtZWxzZSBpbnNldD48L3YtZGl2aWRlcj5cbiAgICBcbiAgICAgICAgPHYtY2FyZC10aXRsZSBwcmltYXJ5LXRpdGxlPlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICAgICAge3twb3N0LnRleHR9fVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L3YtY2FyZC10aXRsZT5cbiAgICBcbiAgICAgICAgPHYtY2FyZC1hY3Rpb25zIGNsYXNzPVwicHJpbWFyeVwiPlxuICAgICAgICAgICAgPHYtYnRuIGZsYXQgZGFyayBpY29uIGNsYXNzPVwibXgtMlwiPlxuICAgICAgICAgICAgICAgIHt7IHBvc3QubGlrZXMgPiAxID8gcG9zdC5saWtlcyA6ICcnIH19XG4gICAgICAgICAgICAgICAgPHYtaWNvbj5mYXZvcml0ZTwvdi1pY29uPlxuICAgICAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgICAgIDx2LWJ0biBmbGF0IGRhcmsgaWNvbiBjbGFzcz1cIm14LTJcIj5cbiAgICAgICAgICAgICAgICB7eyBwb3N0LnJlcG9zdHMgPiAxID8gcG9zdC5yZXBvc3RzIDogJycgfX1cbiAgICAgICAgICAgICAgICA8di1pY29uPnJlcGVhdDwvdi1pY29uPlxuICAgICAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgICAgIDx2LXNwYWNlcj48L3Ytc3BhY2VyPlxuICAgICAgICAgICAgPHYtYnRuIGRhcmsgaWNvbiBAY2xpY2submF0aXZlPVwiaXNDb21tZW50T3BlbiA9ICFpc0NvbW1lbnRPcGVuXCIgY2xhc3M9XCJteC0zXCI+XG4gICAgICAgICAgICAgICAgPCEtLSB7eyBwb3N0LmNvbW1lbnRzLmxlbmd0aCA+IDEgPyBwb3N0LmNvbW1lbnRzLmxlbmd0aCA6ICcnIH19IC0tPlxuICAgICAgICAgICAgICAgIDx2LWljb24+Y29tbWVudDwvdi1pY29uPlxuICAgICAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgPC92LWNhcmQtYWN0aW9ucz5cbiAgICBcbiAgICAgICAgPHRyYW5zaXRpb24gbmFtZT1cImZhZGVcIj5cbiAgICAgICAgICAgIDx2LWNhcmQtdGV4dCB2LXNob3c9XCJpc0NvbW1lbnRPcGVuXCIgY2xhc3M9XCJjb21tZW50LWJveCBwYS0wXCI+XG4gICAgICAgICAgICAgICAgPHItY29tbWVudC1saXN0IDpjb21tZW50cz1cInBvc3QuY29tbWVudHNcIj48L3ItY29tbWVudC1saXN0PlxuICAgICAgICAgICAgPC92LWNhcmQtdGV4dD5cbiAgICAgICAgPC90cmFuc2l0aW9uPlxuICAgIFxuICAgIDwvdi1jYXJkPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmltcG9ydCBVc2VyU21hbGxQcm9maWxlIGZyb20gJy4vLi4vdXNlcnMvVXNlclNtYWxsUHJvZmlsZSc7XG5pbXBvcnQgQ29tbWVudExpc3QgZnJvbSAnLi8uLi9jb21tZW50cy9Db21tZW50TGlzdCc7XG5leHBvcnQgZGVmYXVsdCB7XG4gICAgcHJvcHM6IFsncG9zdCddLFxuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgclVzZXJUb3A6IFVzZXJTbWFsbFByb2ZpbGUsXG4gICAgICAgIHJDb21tZW50TGlzdDogQ29tbWVudExpc3RcbiAgICB9LFxuICAgIGRhdGEoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpc0NvbW1lbnRPcGVuOiBmYWxzZVxuICAgICAgICB9XG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIHJlbW92ZSgpe1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgncmVtb3ZlJywgdGhpcy5wb3N0LmlkKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVwb3J0KCl7XG5cbiAgICAgICAgfVxuICAgIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInN0eWx1c1wiIHNjb3BlZD5cbi5wb3N0LWNhcmR7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgbWluLXdpZHRoOiA0MDBweDtcbn1cbjwvc3R5bGU+XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gUG9zdC52dWU/MTk2MTU3YzIiLCJ2YXIgZGlzcG9zZWQgPSBmYWxzZVxuZnVuY3Rpb24gaW5qZWN0U3R5bGUgKHNzckNvbnRleHQpIHtcbiAgaWYgKGRpc3Bvc2VkKSByZXR1cm5cbiAgcmVxdWlyZShcIiEhdnVlLXN0eWxlLWxvYWRlciFjc3MtbG9hZGVyP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXg/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTJhMWQyZWU3XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL1VzZXJTbWFsbFByb2ZpbGUudnVlXCIpXG59XG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIikoXG4gIC8qIHNjcmlwdCAqL1xuICByZXF1aXJlKFwiISFiYWJlbC1sb2FkZXI/e1xcXCJjYWNoZURpcmVjdG9yeVxcXCI6dHJ1ZSxcXFwicHJlc2V0c1xcXCI6W1tcXFwiZW52XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlLFxcXCJ0YXJnZXRzXFxcIjp7XFxcImJyb3dzZXJzXFxcIjpbXFxcIj4gMiVcXFwiXSxcXFwidWdsaWZ5XFxcIjp0cnVlfX1dLFtcXFwiZXMyMDE1XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlfV0sW1xcXCJzdGFnZS0yXFxcIl1dfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL1VzZXJTbWFsbFByb2ZpbGUudnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi0yYTFkMmVlN1xcXCIsXFxcImhhc1Njb3BlZFxcXCI6ZmFsc2V9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9Vc2VyU21hbGxQcm9maWxlLnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIG51bGwsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvdXNlcnMvVXNlclNtYWxsUHJvZmlsZS52dWVcIlxuaWYgKENvbXBvbmVudC5lc01vZHVsZSAmJiBPYmplY3Qua2V5cyhDb21wb25lbnQuZXNNb2R1bGUpLnNvbWUoZnVuY3Rpb24gKGtleSkge3JldHVybiBrZXkgIT09IFwiZGVmYXVsdFwiICYmIGtleS5zdWJzdHIoMCwgMikgIT09IFwiX19cIn0pKSB7Y29uc29sZS5lcnJvcihcIm5hbWVkIGV4cG9ydHMgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gKi52dWUgZmlsZXMuXCIpfVxuaWYgKENvbXBvbmVudC5vcHRpb25zLmZ1bmN0aW9uYWwpIHtjb25zb2xlLmVycm9yKFwiW3Z1ZS1sb2FkZXJdIFVzZXJTbWFsbFByb2ZpbGUudnVlOiBmdW5jdGlvbmFsIGNvbXBvbmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0ZW1wbGF0ZXMsIHRoZXkgc2hvdWxkIHVzZSByZW5kZXIgZnVuY3Rpb25zLlwiKX1cblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LTJhMWQyZWU3XCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtMmExZDJlZTdcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvdXNlcnMvVXNlclNtYWxsUHJvZmlsZS52dWVcbi8vIG1vZHVsZSBpZCA9IDI0MFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMmExZDJlZTdcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vVXNlclNtYWxsUHJvZmlsZS52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcIjBjYjU0YjRlXCIsIGNvbnRlbnQsIGZhbHNlKTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTJhMWQyZWU3XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL1VzZXJTbWFsbFByb2ZpbGUudnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTJhMWQyZWU3XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL1VzZXJTbWFsbFByb2ZpbGUudnVlXCIpO1xuICAgICBpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcbiAgICAgdXBkYXRlKG5ld0NvbnRlbnQpO1xuICAgfSk7XG4gfVxuIC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3NcbiBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTJhMWQyZWU3XCIsXCJzY29wZWRcIjpmYWxzZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3VzZXJzL1VzZXJTbWFsbFByb2ZpbGUudnVlXG4vLyBtb2R1bGUgaWQgPSAyNDFcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSh0cnVlKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIlxcbnNtYWxsLnRpbWV7XFxuICAgIGNvbG9yOiBzaWx2ZXJcXG59XFxuXCIsIFwiXCIsIHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvdXNlcnMvVXNlclNtYWxsUHJvZmlsZS52dWU/NDdjN2I3ZGJcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIjtBQTRCQTtJQUNBLGFBQUE7Q0FDQVwiLFwiZmlsZVwiOlwiVXNlclNtYWxsUHJvZmlsZS52dWVcIixcInNvdXJjZXNDb250ZW50XCI6W1wiPHRlbXBsYXRlPlxcbiAgICA8di1saXN0IHR3by1saW5lIGNsYXNzPVxcXCJweS0wXFxcIj5cXG4gICAgICAgIDx2LWxpc3QtdGlsZSBhdmF0YXI+XFxuICAgICAgICAgICAgPHYtbGlzdC10aWxlLWF2YXRhcj5cXG4gICAgICAgICAgICAgICAgPGltZyA6c3JjPVxcXCJ1c2VyLmltYWdlXFxcIj5cXG4gICAgICAgICAgICA8L3YtbGlzdC10aWxlLWF2YXRhcj5cXG4gICAgICAgICAgICA8di1saXN0LXRpbGUtY29udGVudD5cXG4gICAgICAgICAgICAgICAgPHYtbGlzdC10aWxlLXRpdGxlPnt7dXNlci5uYW1lfX08L3YtbGlzdC10aWxlLXRpdGxlPlxcbiAgICAgICAgICAgICAgICA8di1saXN0LXRpbGUtc3ViLXRpdGxlPnt7dXNlci50aXRsZX19PC92LWxpc3QtdGlsZS1zdWItdGl0bGU+XFxuICAgICAgICAgICAgICAgIDxzbWFsbCBjbGFzcz1cXFwidGltZVxcXCI+MiBtaW51dGVzIGFnbzwvc21hbGw+XFxuICAgICAgICAgICAgPC92LWxpc3QtdGlsZS1jb250ZW50PlxcbiAgICAgICAgPC92LWxpc3QtdGlsZT5cXG4gICAgPC92LWxpc3Q+XFxuPC90ZW1wbGF0ZT5cXG5cXG48c2NyaXB0PlxcbmV4cG9ydCBkZWZhdWx0IHtcXG4gICAgcHJvcHM6IFsndXNlciddLFxcbiAgICBkYXRhKCkge1xcbiAgICAgICAgcmV0dXJue1xcbiAgICAgICAgICAgIG5hbWVcXG4gICAgICAgIH1cXG4gICAgfVxcbn1cXG48L3NjcmlwdD5cXG5cXG5cXG48c3R5bGU+XFxuc21hbGwudGltZXtcXG4gICAgY29sb3I6IHNpbHZlclxcbn1cXG48L3N0eWxlPlxcblxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi0yYTFkMmVlN1wiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC91c2Vycy9Vc2VyU21hbGxQcm9maWxlLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjQyXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIjx0ZW1wbGF0ZT5cbiAgICA8di1saXN0IHR3by1saW5lIGNsYXNzPVwicHktMFwiPlxuICAgICAgICA8di1saXN0LXRpbGUgYXZhdGFyPlxuICAgICAgICAgICAgPHYtbGlzdC10aWxlLWF2YXRhcj5cbiAgICAgICAgICAgICAgICA8aW1nIDpzcmM9XCJ1c2VyLmltYWdlXCI+XG4gICAgICAgICAgICA8L3YtbGlzdC10aWxlLWF2YXRhcj5cbiAgICAgICAgICAgIDx2LWxpc3QtdGlsZS1jb250ZW50PlxuICAgICAgICAgICAgICAgIDx2LWxpc3QtdGlsZS10aXRsZT57e3VzZXIubmFtZX19PC92LWxpc3QtdGlsZS10aXRsZT5cbiAgICAgICAgICAgICAgICA8di1saXN0LXRpbGUtc3ViLXRpdGxlPnt7dXNlci50aXRsZX19PC92LWxpc3QtdGlsZS1zdWItdGl0bGU+XG4gICAgICAgICAgICAgICAgPHNtYWxsIGNsYXNzPVwidGltZVwiPjIgbWludXRlcyBhZ288L3NtYWxsPlxuICAgICAgICAgICAgPC92LWxpc3QtdGlsZS1jb250ZW50PlxuICAgICAgICA8L3YtbGlzdC10aWxlPlxuICAgIDwvdi1saXN0PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBwcm9wczogWyd1c2VyJ10sXG4gICAgZGF0YSgpIHtcbiAgICAgICAgcmV0dXJue1xuICAgICAgICAgICAgbmFtZVxuICAgICAgICB9XG4gICAgfVxufVxuPC9zY3JpcHQ+XG5cblxuPHN0eWxlPlxuc21hbGwudGltZXtcbiAgICBjb2xvcjogc2lsdmVyXG59XG48L3N0eWxlPlxuXG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gVXNlclNtYWxsUHJvZmlsZS52dWU/NDdjN2I3ZGIiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ3YtbGlzdCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJweS0wXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwidHdvLWxpbmVcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LWxpc3QtdGlsZScsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJhdmF0YXJcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LWxpc3QtdGlsZS1hdmF0YXInLCBbX2MoJ2ltZycsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJzcmNcIjogX3ZtLnVzZXIuaW1hZ2VcbiAgICB9XG4gIH0pXSksIF92bS5fdihcIiBcIiksIF9jKCd2LWxpc3QtdGlsZS1jb250ZW50JywgW19jKCd2LWxpc3QtdGlsZS10aXRsZScsIFtfdm0uX3YoX3ZtLl9zKF92bS51c2VyLm5hbWUpKV0pLCBfdm0uX3YoXCIgXCIpLCBfYygndi1saXN0LXRpbGUtc3ViLXRpdGxlJywgW192bS5fdihfdm0uX3MoX3ZtLnVzZXIudGl0bGUpKV0pLCBfdm0uX3YoXCIgXCIpLCBfYygnc21hbGwnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwidGltZVwiXG4gIH0sIFtfdm0uX3YoXCIyIG1pbnV0ZXMgYWdvXCIpXSldLCAxKV0sIDEpXSwgMSlcbn0sc3RhdGljUmVuZGVyRm5zOiBbXX1cbm1vZHVsZS5leHBvcnRzLnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgIHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIikucmVyZW5kZXIoXCJkYXRhLXYtMmExZDJlZTdcIiwgbW9kdWxlLmV4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LTJhMWQyZWU3XCIsXCJoYXNTY29wZWRcIjpmYWxzZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC91c2Vycy9Vc2VyU21hbGxQcm9maWxlLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjQ0XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG5mdW5jdGlvbiBpbmplY3RTdHlsZSAoc3NyQ29udGV4dCkge1xuICBpZiAoZGlzcG9zZWQpIHJldHVyblxuICByZXF1aXJlKFwiISF2dWUtc3R5bGUtbG9hZGVyIWNzcy1sb2FkZXI/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleD97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtYTVhYTc5OTZcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IXN0eWx1cy1sb2FkZXIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9Db21tZW50TGlzdC52dWVcIilcbn1cbnZhciBDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplclwiKShcbiAgLyogc2NyaXB0ICovXG4gIHJlcXVpcmUoXCIhIWJhYmVsLWxvYWRlcj97XFxcImNhY2hlRGlyZWN0b3J5XFxcIjp0cnVlLFxcXCJwcmVzZXRzXFxcIjpbW1xcXCJlbnZcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2UsXFxcInRhcmdldHNcXFwiOntcXFwiYnJvd3NlcnNcXFwiOltcXFwiPiAyJVxcXCJdLFxcXCJ1Z2xpZnlcXFwiOnRydWV9fV0sW1xcXCJlczIwMTVcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2V9XSxbXFxcInN0YWdlLTJcXFwiXV19IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vQ29tbWVudExpc3QudnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi1hNWFhNzk5NlxcXCIsXFxcImhhc1Njb3BlZFxcXCI6ZmFsc2V9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9Db21tZW50TGlzdC52dWVcIiksXG4gIC8qIHN0eWxlcyAqL1xuICBpbmplY3RTdHlsZSxcbiAgLyogc2NvcGVJZCAqL1xuICBudWxsLFxuICAvKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbiAgbnVsbFxuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL2NvbW1lbnRzL0NvbW1lbnRMaXN0LnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gQ29tbWVudExpc3QudnVlOiBmdW5jdGlvbmFsIGNvbXBvbmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0ZW1wbGF0ZXMsIHRoZXkgc2hvdWxkIHVzZSByZW5kZXIgZnVuY3Rpb25zLlwiKX1cblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LWE1YWE3OTk2XCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtYTVhYTc5OTZcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvY29tbWVudHMvQ29tbWVudExpc3QudnVlXG4vLyBtb2R1bGUgaWQgPSAyNDVcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWE1YWE3OTk2XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL0NvbW1lbnRMaXN0LnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiMmE2YzFjODRcIiwgY29udGVudCwgZmFsc2UpO1xuLy8gSG90IE1vZHVsZSBSZXBsYWNlbWVudFxuaWYobW9kdWxlLmhvdCkge1xuIC8vIFdoZW4gdGhlIHN0eWxlcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgPHN0eWxlPiB0YWdzXG4gaWYoIWNvbnRlbnQubG9jYWxzKSB7XG4gICBtb2R1bGUuaG90LmFjY2VwdChcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtYTVhYTc5OTZcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vQ29tbWVudExpc3QudnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LWE1YWE3OTk2XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL0NvbW1lbnRMaXN0LnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi1hNWFhNzk5NlwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL2NvbW1lbnRzL0NvbW1lbnRMaXN0LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjQ2XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodHJ1ZSk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJcIiwgXCJcIiwge1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W10sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIlwiLFwiZmlsZVwiOlwiQ29tbWVudExpc3QudnVlXCIsXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtYTVhYTc5OTZcIixcInNjb3BlZFwiOmZhbHNlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9Db21tZW50TGlzdC52dWVcbi8vIG1vZHVsZSBpZCA9IDI0N1xuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCI8dGVtcGxhdGU+XG4gICAgPHYtbGlzdCB0aHJlZS1saW5lIGNsYXNzPVwicHktMFwiPlxuICAgICAgICA8ci1hZGQtY29tbWVudCB1c2VyLWltYWdlPScvaW1hZ2VzL2F2YXRhci5qcGcnPjwvci1hZGQtY29tbWVudD5cbiAgICAgICAgPHRlbXBsYXRlIHYtZm9yPVwiKGNvbW1lbnQsIGkpIGluIGNvbW1lbnRzXCI+XG4gICAgICAgICAgICA8ci1jb21tZW50IDpjb21tZW50PVwiY29tbWVudFwiIDprZXk9XCJpXCIgY2xhc3M9XCJweS0yIHB4LTIgcmVtb3ZlTGlzdEhvdmVyXCI+e3tjb21tZW50LmNvbW1lbnR9fTwvci1jb21tZW50PlxuICAgICAgICAgICAgPHYtZGl2aWRlciB2LWlmPVwiaSAhPSBjb21tZW50cy5sZW5ndGgtMVwiIDprZXk9XCJpXCI+PC92LWRpdmlkZXI+XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgPC92LWxpc3Q+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0PlxuaW1wb3J0IENvbW1lbnQgZnJvbSAnLi9Db21tZW50JztcbmltcG9ydCBBZGRDb21tZW50IGZyb20gJy4vQWRkQ29tbWVudCc7XG5leHBvcnQgZGVmYXVsdCB7XG4gICAgcHJvcHM6IFsnY29tbWVudHMnXSxcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIHJDb21tZW50OiBDb21tZW50LFxuICAgICAgICByQWRkQ29tbWVudDogQWRkQ29tbWVudCxcbiAgICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzdHlsdXNcIj5cbjwvc3R5bGU+XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIENvbW1lbnRMaXN0LnZ1ZT8zZDk5YzQzZSIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIikoXG4gIC8qIHNjcmlwdCAqL1xuICByZXF1aXJlKFwiISFiYWJlbC1sb2FkZXI/e1xcXCJjYWNoZURpcmVjdG9yeVxcXCI6dHJ1ZSxcXFwicHJlc2V0c1xcXCI6W1tcXFwiZW52XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlLFxcXCJ0YXJnZXRzXFxcIjp7XFxcImJyb3dzZXJzXFxcIjpbXFxcIj4gMiVcXFwiXSxcXFwidWdsaWZ5XFxcIjp0cnVlfX1dLFtcXFwiZXMyMDE1XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlfV0sW1xcXCJzdGFnZS0yXFxcIl1dfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL0NvbW1lbnQudnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi0wNzM5NzRmN1xcXCIsXFxcImhhc1Njb3BlZFxcXCI6ZmFsc2V9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9Db21tZW50LnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIG51bGwsXG4gIC8qIHNjb3BlSWQgKi9cbiAgbnVsbCxcbiAgLyogbW9kdWxlSWRlbnRpZmllciAoc2VydmVyIG9ubHkpICovXG4gIG51bGxcbilcbkNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9Db21tZW50LnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gQ29tbWVudC52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtMDczOTc0ZjdcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi0wNzM5NzRmN1wiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9Db21tZW50LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjQ5XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIlxuPHRlbXBsYXRlPlxuICAgIDx2LWxpc3QtdGlsZSA6cmlwcGxlPVwiZmFsc2VcIj5cbiAgICAgICAgPHYtbGlzdC10aWxlLWF2YXRhciBjbGFzcz1cImhpZGRlbi14cy1vbmx5XCI+XG4gICAgICAgICAgICA8aW1nIDpzcmM9XCJjb21tZW50LnVzZXIuaW1hZ2VcIj5cbiAgICAgICAgPC92LWxpc3QtdGlsZS1hdmF0YXI+XG4gICAgICAgIDx2LWxpc3QtdGlsZS1jb250ZW50PlxuICAgICAgICAgICAgPHYtbGlzdC10aWxlLXRpdGxlIGNsYXNzPVwicHJpbWFyeS0tdGV4dFwiPnt7Y29tbWVudC51c2VyLm5hbWV9fTwvdi1saXN0LXRpbGUtdGl0bGU+XG4gICAgICAgICAgICA8di1saXN0LXRpbGUtc3ViLXRpdGxlIGNsYXNzPVwiYmxhY2stLXRleHQgcHktMVwiPlxuICAgICAgICAgICAgICAgIDxzbG90Pjwvc2xvdD5cbiAgICAgICAgICAgIDwvdi1saXN0LXRpbGUtc3ViLXRpdGxlPlxuICAgICAgICA8L3YtbGlzdC10aWxlLWNvbnRlbnQ+XG4gICAgICAgIDx2LWxpc3QtdGlsZS1hY3Rpb24+XG4gICAgICAgICAgICA8di1saXN0LXRpbGUtYWN0aW9uLXRleHQ+e3tjb21tZW50LmRhdGV9fTwvdi1saXN0LXRpbGUtYWN0aW9uLXRleHQ+XG4gICAgICAgICAgICA8di1idG4gaWNvbj5cbiAgICAgICAgICAgICAgICA8di1pY29uIGNsYXNzPVwiZ3JleS0tdGV4dFwiPnRodW1iX3VwPC92LWljb24+XG4gICAgICAgICAgICA8L3YtYnRuPlxuICAgICAgICA8L3YtbGlzdC10aWxlLWFjdGlvbj5cbiAgICA8L3YtbGlzdC10aWxlPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBwcm9wczogWydjb21tZW50J10sXG4gICAgY29tcHV0ZWQ6IHt9XG59XG48L3NjcmlwdD5cblxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIENvbW1lbnQudnVlP2Q5ZDAxOTdhIiwibW9kdWxlLmV4cG9ydHM9e3JlbmRlcjpmdW5jdGlvbiAoKXt2YXIgX3ZtPXRoaXM7dmFyIF9oPV92bS4kY3JlYXRlRWxlbWVudDt2YXIgX2M9X3ZtLl9zZWxmLl9jfHxfaDtcbiAgcmV0dXJuIF9jKCd2LWxpc3QtdGlsZScsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJyaXBwbGVcIjogZmFsc2VcbiAgICB9XG4gIH0sIFtfYygndi1saXN0LXRpbGUtYXZhdGFyJywge1xuICAgIHN0YXRpY0NsYXNzOiBcImhpZGRlbi14cy1vbmx5XCJcbiAgfSwgW19jKCdpbWcnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwic3JjXCI6IF92bS5jb21tZW50LnVzZXIuaW1hZ2VcbiAgICB9XG4gIH0pXSksIF92bS5fdihcIiBcIiksIF9jKCd2LWxpc3QtdGlsZS1jb250ZW50JywgW19jKCd2LWxpc3QtdGlsZS10aXRsZScsIHtcbiAgICBzdGF0aWNDbGFzczogXCJwcmltYXJ5LS10ZXh0XCJcbiAgfSwgW192bS5fdihfdm0uX3MoX3ZtLmNvbW1lbnQudXNlci5uYW1lKSldKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtbGlzdC10aWxlLXN1Yi10aXRsZScsIHtcbiAgICBzdGF0aWNDbGFzczogXCJibGFjay0tdGV4dCBweS0xXCJcbiAgfSwgW192bS5fdChcImRlZmF1bHRcIildLCAyKV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1saXN0LXRpbGUtYWN0aW9uJywgW19jKCd2LWxpc3QtdGlsZS1hY3Rpb24tdGV4dCcsIFtfdm0uX3YoX3ZtLl9zKF92bS5jb21tZW50LmRhdGUpKV0pLCBfdm0uX3YoXCIgXCIpLCBfYygndi1idG4nLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwiaWNvblwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtaWNvbicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJncmV5LS10ZXh0XCJcbiAgfSwgW192bS5fdihcInRodW1iX3VwXCIpXSldLCAxKV0sIDEpXSwgMSlcbn0sc3RhdGljUmVuZGVyRm5zOiBbXX1cbm1vZHVsZS5leHBvcnRzLnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgIHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIikucmVyZW5kZXIoXCJkYXRhLXYtMDczOTc0ZjdcIiwgbW9kdWxlLmV4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LTA3Mzk3NGY3XCIsXCJoYXNTY29wZWRcIjpmYWxzZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9Db21tZW50LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjUxXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIiEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIikoXG4gIC8qIHNjcmlwdCAqL1xuICByZXF1aXJlKFwiISFiYWJlbC1sb2FkZXI/e1xcXCJjYWNoZURpcmVjdG9yeVxcXCI6dHJ1ZSxcXFwicHJlc2V0c1xcXCI6W1tcXFwiZW52XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlLFxcXCJ0YXJnZXRzXFxcIjp7XFxcImJyb3dzZXJzXFxcIjpbXFxcIj4gMiVcXFwiXSxcXFwidWdsaWZ5XFxcIjp0cnVlfX1dLFtcXFwiZXMyMDE1XFxcIix7XFxcIm1vZHVsZXNcXFwiOmZhbHNlfV0sW1xcXCJzdGFnZS0yXFxcIl1dfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL0FkZENvbW1lbnQudnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi03MDRkYmU5NlxcXCIsXFxcImhhc1Njb3BlZFxcXCI6ZmFsc2V9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9BZGRDb21tZW50LnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIG51bGwsXG4gIC8qIHNjb3BlSWQgKi9cbiAgbnVsbCxcbiAgLyogbW9kdWxlSWRlbnRpZmllciAoc2VydmVyIG9ubHkpICovXG4gIG51bGxcbilcbkNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9BZGRDb21tZW50LnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gQWRkQ29tbWVudC52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtNzA0ZGJlOTZcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi03MDRkYmU5NlwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9jb21tZW50cy9BZGRDb21tZW50LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjUyXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIjx0ZW1wbGF0ZT5cbiAgICA8ZGl2IGNsYXNzPVwiZ3JleSBsaWdodGVuLTJcIj5cbiAgICAgICAgPHYtbGF5b3V0IGFsaWduLWNlbnRlcj5cbiAgICAgICAgICAgIDx2LWZsZXggY2xhc3M9XCJoaWRkZW4teHMtb25seVwiPlxuICAgICAgICAgICAgICAgIDx2LWxpc3QtdGlsZS1hdmF0YXI+XG4gICAgICAgICAgICAgICAgICAgIDxpbWcgOnNyYz1cInVzZXJJbWFnZVwiPlxuICAgICAgICAgICAgICAgIDwvdi1saXN0LXRpbGUtYXZhdGFyPlxuICAgICAgICAgICAgPC92LWZsZXg+XG4gICAgICAgICAgICA8di1mbGV4IHhzOD5cbiAgICAgICAgICAgICAgICA8di10ZXh0LWZpZWxkIGNsYXNzPVwicGItMFwiIHYtbW9kZWw9XCJjb21tZW50SW5wdXRcIiBhdXRvLWdyb3cgbGFiZWw9XCJ3cml0ZSBhIGNvbW1lbnRcIiBmdWxsLXdpZHRoIG11bHRpLWxpbmUgcm93cz1cIjJcIj48L3YtdGV4dC1maWVsZD5cbiAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICAgICAgPHYtZmxleCBjbGFzcz1cInRleHQteHMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPHYtYnRuIGZhYiBkYXJrIHNtYWxsIGNsYXNzPVwicHJpbWFyeVwiPlxuICAgICAgICAgICAgICAgICAgICA8di1pY29uIGRhcms+c2VuZDwvdi1pY29uPlxuICAgICAgICAgICAgICAgIDwvdi1idG4+XG4gICAgICAgICAgICA8L3YtZmxleD5cbiAgICAgICAgPC92LWxheW91dD5cbiAgICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5leHBvcnQgZGVmYXVsdCB7XG4gICAgcHJvcHM6IFsndXNlckltYWdlJ10sXG4gICAgZGF0YSgpe1xuICAgICAgICByZXR1cm57XG4gICAgICAgICAgICBjb21tZW50SW5wdXQ6ICcnXG4gICAgICAgIH1cbiAgICB9XG59XG48L3NjcmlwdD5cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyBBZGRDb21tZW50LnZ1ZT8xMGE2OWI1MCIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygnZGl2Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcImdyZXkgbGlnaHRlbi0yXCJcbiAgfSwgW19jKCd2LWxheW91dCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJhbGlnbi1jZW50ZXJcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LWZsZXgnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwiaGlkZGVuLXhzLW9ubHlcIlxuICB9LCBbX2MoJ3YtbGlzdC10aWxlLWF2YXRhcicsIFtfYygnaW1nJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInNyY1wiOiBfdm0udXNlckltYWdlXG4gICAgfVxuICB9KV0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWZsZXgnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwieHM4XCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi10ZXh0LWZpZWxkJywge1xuICAgIHN0YXRpY0NsYXNzOiBcInBiLTBcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJhdXRvLWdyb3dcIjogXCJcIixcbiAgICAgIFwibGFiZWxcIjogXCJ3cml0ZSBhIGNvbW1lbnRcIixcbiAgICAgIFwiZnVsbC13aWR0aFwiOiBcIlwiLFxuICAgICAgXCJtdWx0aS1saW5lXCI6IFwiXCIsXG4gICAgICBcInJvd3NcIjogXCIyXCJcbiAgICB9LFxuICAgIG1vZGVsOiB7XG4gICAgICB2YWx1ZTogKF92bS5jb21tZW50SW5wdXQpLFxuICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCQkdikge1xuICAgICAgICBfdm0uY29tbWVudElucHV0ID0gJCR2XG4gICAgICB9LFxuICAgICAgZXhwcmVzc2lvbjogXCJjb21tZW50SW5wdXRcIlxuICAgIH1cbiAgfSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtZmxleCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJ0ZXh0LXhzLWNlbnRlclwiXG4gIH0sIFtfYygndi1idG4nLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwicHJpbWFyeVwiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcImZhYlwiOiBcIlwiLFxuICAgICAgXCJkYXJrXCI6IFwiXCIsXG4gICAgICBcInNtYWxsXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi1pY29uJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImRhcmtcIjogXCJcIlxuICAgIH1cbiAgfSwgW192bS5fdihcInNlbmRcIildKV0sIDEpXSwgMSldLCAxKV0sIDEpXG59LHN0YXRpY1JlbmRlckZuczogW119XG5tb2R1bGUuZXhwb3J0cy5yZW5kZXIuX3dpdGhTdHJpcHBlZCA9IHRydWVcbmlmIChtb2R1bGUuaG90KSB7XG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKG1vZHVsZS5ob3QuZGF0YSkge1xuICAgICByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpLnJlcmVuZGVyKFwiZGF0YS12LTcwNGRiZTk2XCIsIG1vZHVsZS5leHBvcnRzKVxuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXI/e1wiaWRcIjpcImRhdGEtdi03MDRkYmU5NlwiLFwiaGFzU2NvcGVkXCI6ZmFsc2V9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvY29tbWVudHMvQWRkQ29tbWVudC52dWVcbi8vIG1vZHVsZSBpZCA9IDI1NFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ3YtbGlzdCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJweS0wXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwidGhyZWUtbGluZVwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3ItYWRkLWNvbW1lbnQnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwidXNlci1pbWFnZVwiOiBcIi9pbWFnZXMvYXZhdGFyLmpwZ1wiXG4gICAgfVxuICB9KSwgX3ZtLl92KFwiIFwiKSwgX3ZtLl9sKChfdm0uY29tbWVudHMpLCBmdW5jdGlvbihjb21tZW50LCBpKSB7XG4gICAgcmV0dXJuIFtfYygnci1jb21tZW50Jywge1xuICAgICAga2V5OiBpLFxuICAgICAgc3RhdGljQ2xhc3M6IFwicHktMiBweC0yIHJlbW92ZUxpc3RIb3ZlclwiLFxuICAgICAgYXR0cnM6IHtcbiAgICAgICAgXCJjb21tZW50XCI6IGNvbW1lbnRcbiAgICAgIH1cbiAgICB9LCBbX3ZtLl92KF92bS5fcyhjb21tZW50LmNvbW1lbnQpKV0pLCBfdm0uX3YoXCIgXCIpLCAoaSAhPSBfdm0uY29tbWVudHMubGVuZ3RoIC0gMSkgPyBfYygndi1kaXZpZGVyJywge1xuICAgICAga2V5OiBpXG4gICAgfSkgOiBfdm0uX2UoKV1cbiAgfSldLCAyKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi1hNWFhNzk5NlwiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtYTVhYTc5OTZcIixcImhhc1Njb3BlZFwiOmZhbHNlfSEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL2NvbW1lbnRzL0NvbW1lbnRMaXN0LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjU1XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygndi1jYXJkJywge1xuICAgIHN0YXRpY0NsYXNzOiBcInBvc3QtY2FyZCBtYi01XCJcbiAgfSwgWyhfdm0ucG9zdC5yZXBvcnQpID8gX2MoJ3Ytc3lzdGVtLWJhcicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJpbmZvXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwic3RhdHVzXCI6IFwiXCIsXG4gICAgICBcImRhcmtcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LWljb24nLCBbX3ZtLl92KFwicmVwb3J0XCIpXSksIF92bS5fdihcIlxcbiAgICAgICAgVGhpcyBoYXMgYmVlbiByZXBvcnRlZCB0byB0aGUgcG9saWNlXFxuICAgICAgICBcIiksIF9jKCd2LXNwYWNlcicpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1pY29uJywgW192bS5fdihcImxvY2F0aW9uX29uXCIpXSksIF92bS5fdihcIiBcIiksIF9jKCdzcGFuJywgW192bS5fdihcIkFnZWdlXCIpXSldLCAxKSA6IF92bS5fZSgpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1jYXJkLWFjdGlvbnMnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwibWEtMCBwYS0wXCJcbiAgfSwgW19jKCdyLXVzZXItdG9wJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInVzZXJcIjogX3ZtLnBvc3QudXNlclxuICAgIH1cbiAgfSksIF92bS5fdihcIiBcIiksIF9jKCd2LXNwYWNlcicpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1tZW51Jywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImJvdHRvbVwiOiBcIlwiLFxuICAgICAgXCJyaWdodFwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtYnRuJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImljb25cIjogXCJcIlxuICAgIH0sXG4gICAgc2xvdDogXCJhY3RpdmF0b3JcIlxuICB9LCBbX2MoJ3YtaWNvbicsIFtfdm0uX3YoXCJtb3JlX3ZlcnRcIildKV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1saXN0JywgW19jKCd2LWxpc3QtdGlsZScsIHtcbiAgICBuYXRpdmVPbjoge1xuICAgICAgXCJjbGlja1wiOiBmdW5jdGlvbigkZXZlbnQpIHtcbiAgICAgICAgX3ZtLnJlbW92ZSgkZXZlbnQpXG4gICAgICB9XG4gICAgfVxuICB9LCBbX2MoJ3YtbGlzdC10aWxlLWNvbnRlbnQnLCBbX2MoJ3YtbGlzdC10aWxlLXRpdGxlJywge1xuICAgIHN0YXRpY0NsYXNzOiBcImVycm9yLS10ZXh0XCJcbiAgfSwgW192bS5fdihcIkRlbGV0ZVwiKV0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWxpc3QtdGlsZS1hY3Rpb24nLCBbX2MoJ3YtaWNvbicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJlcnJvci0tdGV4dFwiXG4gIH0sIFtfdm0uX3YoXCJkZWxldGVcIildKV0sIDEpXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWxpc3QtdGlsZScsIFtfYygndi1saXN0LXRpbGUtY29udGVudCcsIFtfYygndi1saXN0LXRpbGUtdGl0bGUnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwiaW5mby0tdGV4dFwiXG4gIH0sIFtfdm0uX3YoXCJSZXBvcnRcIildKV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1saXN0LXRpbGUtYWN0aW9uJywgW19jKCd2LWljb24nLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwiaW5mby0tdGV4dFwiXG4gIH0sIFtfdm0uX3YoXCJyZXBvcnRcIildKV0sIDEpXSwgMSldLCAxKV0sIDEpXSwgMSksIF92bS5fdihcIiBcIiksIChfdm0ucG9zdC5tZWRpYSkgPyBfYygndi1jYXJkLW1lZGlhJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInNyY1wiOiBfdm0ucG9zdC5tZWRpYSxcbiAgICAgIFwiaGVpZ2h0XCI6IFwiMzAwcHhcIlxuICAgIH1cbiAgfSkgOiBfYygndi1kaXZpZGVyJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImluc2V0XCI6IFwiXCJcbiAgICB9XG4gIH0pLCBfdm0uX3YoXCIgXCIpLCBfYygndi1jYXJkLXRpdGxlJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInByaW1hcnktdGl0bGVcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCdkaXYnLCBbX2MoJ3NwYW4nLCBbX3ZtLl92KFwiXFxuICAgICAgICAgICAgICAgIFwiICsgX3ZtLl9zKF92bS5wb3N0LnRleHQpICsgXCJcXG4gICAgICAgICAgICBcIildKV0pXSksIF92bS5fdihcIiBcIiksIF9jKCd2LWNhcmQtYWN0aW9ucycsIHtcbiAgICBzdGF0aWNDbGFzczogXCJwcmltYXJ5XCJcbiAgfSwgW19jKCd2LWJ0bicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJteC0yXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwiZmxhdFwiOiBcIlwiLFxuICAgICAgXCJkYXJrXCI6IFwiXCIsXG4gICAgICBcImljb25cIjogXCJcIlxuICAgIH1cbiAgfSwgW192bS5fdihcIlxcbiAgICAgICAgICAgIFwiICsgX3ZtLl9zKF92bS5wb3N0Lmxpa2VzID4gMSA/IF92bS5wb3N0Lmxpa2VzIDogJycpICsgXCJcXG4gICAgICAgICAgICBcIiksIF9jKCd2LWljb24nLCBbX3ZtLl92KFwiZmF2b3JpdGVcIildKV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1idG4nLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwibXgtMlwiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcImZsYXRcIjogXCJcIixcbiAgICAgIFwiZGFya1wiOiBcIlwiLFxuICAgICAgXCJpY29uXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfdm0uX3YoXCJcXG4gICAgICAgICAgICBcIiArIF92bS5fcyhfdm0ucG9zdC5yZXBvc3RzID4gMSA/IF92bS5wb3N0LnJlcG9zdHMgOiAnJykgKyBcIlxcbiAgICAgICAgICAgIFwiKSwgX2MoJ3YtaWNvbicsIFtfdm0uX3YoXCJyZXBlYXRcIildKV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1zcGFjZXInKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtYnRuJywge1xuICAgIHN0YXRpY0NsYXNzOiBcIm14LTNcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJkYXJrXCI6IFwiXCIsXG4gICAgICBcImljb25cIjogXCJcIlxuICAgIH0sXG4gICAgbmF0aXZlT246IHtcbiAgICAgIFwiY2xpY2tcIjogZnVuY3Rpb24oJGV2ZW50KSB7XG4gICAgICAgIF92bS5pc0NvbW1lbnRPcGVuID0gIV92bS5pc0NvbW1lbnRPcGVuXG4gICAgICB9XG4gICAgfVxuICB9LCBbX2MoJ3YtaWNvbicsIFtfdm0uX3YoXCJjb21tZW50XCIpXSldLCAxKV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygndHJhbnNpdGlvbicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJuYW1lXCI6IFwiZmFkZVwiXG4gICAgfVxuICB9LCBbX2MoJ3YtY2FyZC10ZXh0Jywge1xuICAgIGRpcmVjdGl2ZXM6IFt7XG4gICAgICBuYW1lOiBcInNob3dcIixcbiAgICAgIHJhd05hbWU6IFwidi1zaG93XCIsXG4gICAgICB2YWx1ZTogKF92bS5pc0NvbW1lbnRPcGVuKSxcbiAgICAgIGV4cHJlc3Npb246IFwiaXNDb21tZW50T3BlblwiXG4gICAgfV0sXG4gICAgc3RhdGljQ2xhc3M6IFwiY29tbWVudC1ib3ggcGEtMFwiXG4gIH0sIFtfYygnci1jb21tZW50LWxpc3QnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwiY29tbWVudHNcIjogX3ZtLnBvc3QuY29tbWVudHNcbiAgICB9XG4gIH0pXSwgMSldLCAxKV0sIDEpXG59LHN0YXRpY1JlbmRlckZuczogW119XG5tb2R1bGUuZXhwb3J0cy5yZW5kZXIuX3dpdGhTdHJpcHBlZCA9IHRydWVcbmlmIChtb2R1bGUuaG90KSB7XG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKG1vZHVsZS5ob3QuZGF0YSkge1xuICAgICByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpLnJlcmVuZGVyKFwiZGF0YS12LWE2YmQ5Y2UyXCIsIG1vZHVsZS5leHBvcnRzKVxuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXI/e1wiaWRcIjpcImRhdGEtdi1hNmJkOWNlMlwiLFwiaGFzU2NvcGVkXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9jb21wb25lbnRzL3NoYXJlZC9wb3N0cy9Qb3N0LnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjU2XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygnZGl2JywgW19jKCd2LWxheW91dCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJweS0wXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwicm93XCI6IFwiXCIsXG4gICAgICBcIndyYXBcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd0cmFuc2l0aW9uLWdyb3VwJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcIm5hbWVcIjogXCJsaXN0XCJcbiAgICB9XG4gIH0sIF92bS5fbCgoX3ZtLnBvc3RzKSwgZnVuY3Rpb24ocG9zdCwgaSkge1xuICAgIHJldHVybiBfYygndi1mbGV4Jywge1xuICAgICAga2V5OiBwb3N0LmlkLFxuICAgICAgYXR0cnM6IHtcbiAgICAgICAgXCJ4czEyXCI6IFwiXCIsXG4gICAgICAgIFwibWQxMlwiOiBcIlwiXG4gICAgICB9XG4gICAgfSwgW19jKCdyLXBvc3QnLCB7XG4gICAgICBzdGF0aWNDbGFzczogXCJtYi01XCIsXG4gICAgICBhdHRyczoge1xuICAgICAgICBcInBvc3RcIjogcG9zdFxuICAgICAgfSxcbiAgICAgIG9uOiB7XG4gICAgICAgIFwicmVtb3ZlXCI6IF92bS5yZW1vdmVQb3N0XG4gICAgICB9XG4gICAgfSldLCAxKVxuICB9KSldLCAxKV0sIDEpXG59LHN0YXRpY1JlbmRlckZuczogW119XG5tb2R1bGUuZXhwb3J0cy5yZW5kZXIuX3dpdGhTdHJpcHBlZCA9IHRydWVcbmlmIChtb2R1bGUuaG90KSB7XG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKG1vZHVsZS5ob3QuZGF0YSkge1xuICAgICByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpLnJlcmVuZGVyKFwiZGF0YS12LWFlOWIxODY2XCIsIG1vZHVsZS5leHBvcnRzKVxuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXI/e1wiaWRcIjpcImRhdGEtdi1hZTliMTg2NlwiLFwiaGFzU2NvcGVkXCI6ZmFsc2V9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvUG9zdExpc3QudnVlXG4vLyBtb2R1bGUgaWQgPSAyNTdcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbmZ1bmN0aW9uIGluamVjdFN0eWxlIChzc3JDb250ZXh0KSB7XG4gIGlmIChkaXNwb3NlZCkgcmV0dXJuXG4gIHJlcXVpcmUoXCIhIXZ1ZS1zdHlsZS1sb2FkZXIhY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0wMTg3ODU3Y1xcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSFzdHlsdXMtbG9hZGVyIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXN0eWxlcyZpbmRleD0wIS4vQWRkUG9zdC52dWVcIilcbn1cbnZhciBDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplclwiKShcbiAgLyogc2NyaXB0ICovXG4gIHJlcXVpcmUoXCIhIWJhYmVsLWxvYWRlcj97XFxcImNhY2hlRGlyZWN0b3J5XFxcIjp0cnVlLFxcXCJwcmVzZXRzXFxcIjpbW1xcXCJlbnZcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2UsXFxcInRhcmdldHNcXFwiOntcXFwiYnJvd3NlcnNcXFwiOltcXFwiPiAyJVxcXCJdLFxcXCJ1Z2xpZnlcXFwiOnRydWV9fV0sW1xcXCJlczIwMTVcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2V9XSxbXFxcInN0YWdlLTJcXFwiXV19IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vQWRkUG9zdC52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LTAxODc4NTdjXFxcIixcXFwiaGFzU2NvcGVkXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vQWRkUG9zdC52dWVcIiksXG4gIC8qIHN0eWxlcyAqL1xuICBpbmplY3RTdHlsZSxcbiAgLyogc2NvcGVJZCAqL1xuICBcImRhdGEtdi0wMTg3ODU3Y1wiLFxuICAvKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbiAgbnVsbFxuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL0FkZFBvc3QudnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSBBZGRQb3N0LnZ1ZTogZnVuY3Rpb25hbCBjb21wb25lbnRzIGFyZSBub3Qgc3VwcG9ydGVkIHdpdGggdGVtcGxhdGVzLCB0aGV5IHNob3VsZCB1c2UgcmVuZGVyIGZ1bmN0aW9ucy5cIil9XG5cbi8qIGhvdCByZWxvYWQgKi9cbmlmIChtb2R1bGUuaG90KSB7KGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhvdEFQSSA9IHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIilcbiAgaG90QVBJLmluc3RhbGwocmVxdWlyZShcInZ1ZVwiKSwgZmFsc2UpXG4gIGlmICghaG90QVBJLmNvbXBhdGlibGUpIHJldHVyblxuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmICghbW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgaG90QVBJLmNyZWF0ZVJlY29yZChcImRhdGEtdi0wMTg3ODU3Y1wiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfSBlbHNlIHtcbiAgICBob3RBUEkucmVsb2FkKFwiZGF0YS12LTAxODc4NTdjXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9XG4gIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbiAoZGF0YSkge1xuICAgIGRpc3Bvc2VkID0gdHJ1ZVxuICB9KVxufSkoKX1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQuZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL0FkZFBvc3QudnVlXG4vLyBtb2R1bGUgaWQgPSAyNThcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTAxODc4NTdjXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vQWRkUG9zdC52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcIjFiZGEyMDQxXCIsIGNvbnRlbnQsIGZhbHNlKTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTAxODc4NTdjXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vQWRkUG9zdC52dWVcIiwgZnVuY3Rpb24oKSB7XG4gICAgIHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMDE4Nzg1N2NcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9BZGRQb3N0LnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi0wMTg3ODU3Y1wiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvQWRkUG9zdC52dWVcbi8vIG1vZHVsZSBpZCA9IDI1OVxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHRydWUpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiXFxuI2ZpbGVJbWFnZVtkYXRhLXYtMDE4Nzg1N2NdIHtcXG4gIGRpc3BsYXk6IG5vbmU7XFxufVxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvQWRkUG9zdC52dWVcIixcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvQWRkUG9zdC52dWVcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIjtBQXFIQTtFQUNJLGNBQUE7Q0NwSEhcIixcImZpbGVcIjpcIkFkZFBvc3QudnVlXCIsXCJzb3VyY2VzQ29udGVudFwiOltcIlxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcblxcbiNmaWxlSW1hZ2V7XFxuICAgIGRpc3BsYXk6IG5vbmU7XFxufVxcblwiLFwiI2ZpbGVJbWFnZSB7XFxuICBkaXNwbGF5OiBub25lO1xcbn1cXG5cIl0sXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtMDE4Nzg1N2NcIixcInNjb3BlZFwiOnRydWUsXCJoYXNJbmxpbmVDb25maWdcIjp0cnVlfSEuL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2NvbXBvbmVudHMvc2hhcmVkL3Bvc3RzL0FkZFBvc3QudnVlXG4vLyBtb2R1bGUgaWQgPSAyNjBcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiPHRlbXBsYXRlPlxuICAgIDx2LWNhcmQ+XG4gICAgICAgIDxmb3JtIEBzdWJtaXQucHJldmVudD1cInBvc3RlZFwiPlxuICAgICAgICAgICAgPHYtY2FyZC10aXRsZSBjbGFzcz1cImhlYWRsaW5lXCI+QWRkIGEgbmV3IHBvc3Q8L3YtY2FyZC10aXRsZT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJncmV5IGxpZ2h0ZW4tMlwiPlxuICAgICAgICAgICAgICAgIDx2LWxheW91dCBhbGlnbi1jZW50ZXI+XG4gICAgICAgICAgICAgICAgICAgIDx2LWZsZXggbWQyIGNsYXNzPVwiaGlkZGVuLXhzLW9ubHlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx2LWxpc3QtdGlsZS1hdmF0YXI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGltZyA6c3JjPVwidXNlckltYWdlXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdi1saXN0LXRpbGUtYXZhdGFyPlxuICAgICAgICAgICAgICAgICAgICA8L3YtZmxleD5cbiAgICAgICAgICAgICAgICAgICAgPHYtZmxleCB4czEyIHNtMTA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8di10ZXh0LWZpZWxkIGNsYXNzPVwicGItMFwiIHYtbW9kZWw9XCJwb3N0LnRleHRcIiBsYWJlbD1cIndyaXRlIGEgcG9zdFwiIGZ1bGwtd2lkdGggbXVsdGktbGluZSByb3dzPVwiM1wiPjwvdi10ZXh0LWZpZWxkPlxuICAgICAgICAgICAgICAgICAgICA8L3YtZmxleD5cbiAgICAgICAgICAgICAgICA8L3YtbGF5b3V0PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIDx2LWNhcmQtbWVkaWEgdi1pZj1cInBvc3QubWVkaWFcIiA6c3JjPVwicG9zdC5tZWRpYS5saW5rXCIgaGVpZ2h0PVwiMzAwcHhcIj48L3YtY2FyZC1tZWRpYT5cblxuICAgICAgICAgICAgPHYtY2FyZC1hY3Rpb25zIGNsYXNzPVwic2Vjb25kYXJ5XCI+XG4gICAgICAgICAgICAgICAgPHYtc3dpdGNoIHYtYmluZDpsYWJlbD1cIidSZXBvcnQnXCIgdi1tb2RlbD1cInBvc3QucmVwb3J0XCIgY2xhc3M9XCJtYS0wIHBhLTAgbWwtM1wiIGhpZGUtZGV0YWlscyBjb2xvcj1cInByaW1hcnlcIj48L3Ytc3dpdGNoPlxuICAgICAgICAgICAgICAgIDx2LXNwYWNlcj48L3Ytc3BhY2VyPlxuICAgICAgICAgICAgICAgIDx2LWJ0biBmbGF0IGljb24gY2xhc3M9XCJteC0yXCIgdi10b29sdGlwOmxlZnQ9XCJ7aHRtbDogJ0FkZCBhIHBob3RvJ31cIiBAY2xpY2s9XCJhZGRQaG90b1wiIHYtaWY9XCIhcG9zdC5tZWRpYVwiPlxuICAgICAgICAgICAgICAgICAgICA8di1pY29uPmFkZF9hX3Bob3RvPC92LWljb24+XG4gICAgICAgICAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgICAgICAgICA8di1idG4gZmxhdCBpY29uIGNsYXNzPVwibXgtMlwiIHYtdG9vbHRpcDpsZWZ0PVwie2h0bWw6ICdSZW1vdmUgcGhvdG8nfVwiIEBjbGljaz1cInJlbW92ZVBob3RvXCIgdi1lbHNlPlxuICAgICAgICAgICAgICAgICAgICA8di1pY29uPmNsb3NlPC92LWljb24+XG4gICAgICAgICAgICAgICAgPC92LWJ0bj5cbiAgICAgICAgICAgIDwvdi1jYXJkLWFjdGlvbnM+XG4gICAgICAgICAgICA8di1jYXJkLWFjdGlvbnM+XG4gICAgICAgICAgICAgICAgPHYtc3BhY2VyPjwvdi1zcGFjZXI+XG4gICAgICAgICAgICAgICAgPHYtYnRuIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInByaW1hcnktLXRleHRcIiBmbGF0PVwiZmxhdFwiIEBjbGljay5uYXRpdmU9XCJjYW5jZWxsZWRcIj5DYW5jZWw8L3YtYnRuPlxuICAgICAgICAgICAgICAgIDx2LWJ0biB0eXBlPVwic3VibWl0XCIgY2xhc3M9XCJwcmltYXJ5XCIgOmxvYWRpbmc9XCJwb3N0aW5nXCIgOmRpc2FibGVkPVwicG9zdGluZ1wiPlBvc3Q8L3YtYnRuPlxuICAgICAgICAgICAgPC92LWNhcmQtYWN0aW9ucz5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiZmlsZVwiIEBjaGFuZ2U9XCJvbkZpbGVDaGFuZ2VcIiByZWY9XCJoaWRkZW5GaWxlXCIgbmFtZT1cImZpbGVJbWFnZVwiIGlkPVwiZmlsZUltYWdlXCIgLz5cbiAgICAgICAgPC9mb3JtPlxuICAgIDwvdi1jYXJkPlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBwcm9wczoge1xuICAgICAgICB1c2VySW1hZ2U6IHtcbiAgICAgICAgICAgIGRlZmF1bHQ6ICcvaW1hZ2VzL3Vua293bi5qcGcnLFxuICAgICAgICAgICAgdHlwZTogU3RyaW5nXG4gICAgICAgIH0sXG4gICAgICAgIGNsZWFyOiB7XG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRpYWxvZzogdHJ1ZSxcbiAgICAgICAgICAgIGlzUmVwb3J0OiBmYWxzZSxcbiAgICAgICAgICAgIHBvc3Q6IHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnJyxcbiAgICAgICAgICAgICAgICBtZWRpYTogZmFsc2UsXG4gICAgICAgICAgICAgICAgcmVwb3J0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvc3Rpbmc6IGZhbHNlXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHdhdGNoOiB7XG4gICAgICAgIGNsZWFyKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2xlYXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBvc3QgPSB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICcnLFxuICAgICAgICAgICAgICAgICAgICBtZWRpYTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydDogZmFsc2VcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICByZW1vdmVQaG90bygpIHtcbiAgICAgICAgICAgIHRoaXMucG9zdC5tZWRpYSA9IG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIGFkZFBob3RvKCkge1xuICAgICAgICAgICAgdGhpcy4kcmVmcy5oaWRkZW5GaWxlLmNsaWNrKCk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uRmlsZUNoYW5nZShlKSB7XG4gICAgICAgICAgICBsZXQgZmlsZXMgPSBlLnRhcmdldC5maWxlcyB8fCBlLmRhdGFUcmFuc2Zlci5maWxlcztcbiAgICAgICAgICAgIGlmICghZmlsZXMubGVuZ3RoKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlSW1hZ2UoZmlsZXNbMF0pO1xuICAgICAgICB9LFxuICAgICAgICBjcmVhdGVJbWFnZShmaWxlKSB7XG4gICAgICAgICAgICBsZXQgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgIGxldCB2bSA9IHRoaXM7XG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gKGUpID0+IHtcbiAgICAgICAgICAgICAgICB2bS5wb3N0Lm1lZGlhID0ge1xuICAgICAgICAgICAgICAgICAgICBsaW5rOiBlLnRhcmdldC5yZXN1bHQsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdpbWFnZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgICAgIH0sXG4gICAgICAgIGNhbmNlbGxlZCgpIHtcbiAgICAgICAgICAgIHRoaXMucG9zdCA9IHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnJyxcbiAgICAgICAgICAgICAgICBtZWRpYTogZmFsc2UsXG4gICAgICAgICAgICAgICAgcmVwb3J0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRoaXMucG9zdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnY2FuY2VsZWQnKTtcbiAgICAgICAgfSxcbiAgICAgICAgcG9zdGVkKCkge1xuICAgICAgICAgICAgdGhpcy5wb3N0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ3Bvc3RlZCcsIHRoaXMucG9zdCk7XG4gICAgICAgIH1cbiAgICB9XG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzdHlsdXNcIiBzY29wZWQ+XG4gICAgI2ZpbGVJbWFnZXtcbiAgICAgICAgZGlzcGxheTogbm9uZTtcbiAgICB9XG48L3N0eWxlPlxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyBBZGRQb3N0LnZ1ZT85NWJmZDkzNCIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygndi1jYXJkJywgW19jKCdmb3JtJywge1xuICAgIG9uOiB7XG4gICAgICBcInN1Ym1pdFwiOiBmdW5jdGlvbigkZXZlbnQpIHtcbiAgICAgICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIF92bS5wb3N0ZWQoJGV2ZW50KVxuICAgICAgfVxuICAgIH1cbiAgfSwgW19jKCd2LWNhcmQtdGl0bGUnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwiaGVhZGxpbmVcIlxuICB9LCBbX3ZtLl92KFwiQWRkIGEgbmV3IHBvc3RcIildKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ2RpdicsIHtcbiAgICBzdGF0aWNDbGFzczogXCJncmV5IGxpZ2h0ZW4tMlwiXG4gIH0sIFtfYygndi1sYXlvdXQnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwiYWxpZ24tY2VudGVyXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi1mbGV4Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcImhpZGRlbi14cy1vbmx5XCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwibWQyXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi1saXN0LXRpbGUtYXZhdGFyJywgW19jKCdpbWcnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwic3JjXCI6IF92bS51c2VySW1hZ2VcbiAgICB9XG4gIH0pXSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtZmxleCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ4czEyXCI6IFwiXCIsXG4gICAgICBcInNtMTBcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LXRleHQtZmllbGQnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwicGItMFwiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcImxhYmVsXCI6IFwid3JpdGUgYSBwb3N0XCIsXG4gICAgICBcImZ1bGwtd2lkdGhcIjogXCJcIixcbiAgICAgIFwibXVsdGktbGluZVwiOiBcIlwiLFxuICAgICAgXCJyb3dzXCI6IFwiM1wiXG4gICAgfSxcbiAgICBtb2RlbDoge1xuICAgICAgdmFsdWU6IChfdm0ucG9zdC50ZXh0KSxcbiAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigkJHYpIHtcbiAgICAgICAgX3ZtLnBvc3QudGV4dCA9ICQkdlxuICAgICAgfSxcbiAgICAgIGV4cHJlc3Npb246IFwicG9zdC50ZXh0XCJcbiAgICB9XG4gIH0pXSwgMSldLCAxKV0sIDEpLCBfdm0uX3YoXCIgXCIpLCAoX3ZtLnBvc3QubWVkaWEpID8gX2MoJ3YtY2FyZC1tZWRpYScsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJzcmNcIjogX3ZtLnBvc3QubWVkaWEubGluayxcbiAgICAgIFwiaGVpZ2h0XCI6IFwiMzAwcHhcIlxuICAgIH1cbiAgfSkgOiBfdm0uX2UoKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtY2FyZC1hY3Rpb25zJywge1xuICAgIHN0YXRpY0NsYXNzOiBcInNlY29uZGFyeVwiXG4gIH0sIFtfYygndi1zd2l0Y2gnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwibWEtMCBwYS0wIG1sLTNcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJsYWJlbFwiOiAnUmVwb3J0JyxcbiAgICAgIFwiaGlkZS1kZXRhaWxzXCI6IFwiXCIsXG4gICAgICBcImNvbG9yXCI6IFwicHJpbWFyeVwiXG4gICAgfSxcbiAgICBtb2RlbDoge1xuICAgICAgdmFsdWU6IChfdm0ucG9zdC5yZXBvcnQpLFxuICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCQkdikge1xuICAgICAgICBfdm0ucG9zdC5yZXBvcnQgPSAkJHZcbiAgICAgIH0sXG4gICAgICBleHByZXNzaW9uOiBcInBvc3QucmVwb3J0XCJcbiAgICB9XG4gIH0pLCBfdm0uX3YoXCIgXCIpLCBfYygndi1zcGFjZXInKSwgX3ZtLl92KFwiIFwiKSwgKCFfdm0ucG9zdC5tZWRpYSkgPyBfYygndi1idG4nLCB7XG4gICAgZGlyZWN0aXZlczogW3tcbiAgICAgIG5hbWU6IFwidG9vbHRpcFwiLFxuICAgICAgcmF3TmFtZTogXCJ2LXRvb2x0aXA6bGVmdFwiLFxuICAgICAgdmFsdWU6ICh7XG4gICAgICAgIGh0bWw6ICdBZGQgYSBwaG90bydcbiAgICAgIH0pLFxuICAgICAgZXhwcmVzc2lvbjogXCJ7aHRtbDogJ0FkZCBhIHBob3RvJ31cIixcbiAgICAgIGFyZzogXCJsZWZ0XCJcbiAgICB9XSxcbiAgICBzdGF0aWNDbGFzczogXCJteC0yXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwiZmxhdFwiOiBcIlwiLFxuICAgICAgXCJpY29uXCI6IFwiXCJcbiAgICB9LFxuICAgIG9uOiB7XG4gICAgICBcImNsaWNrXCI6IF92bS5hZGRQaG90b1xuICAgIH1cbiAgfSwgW19jKCd2LWljb24nLCBbX3ZtLl92KFwiYWRkX2FfcGhvdG9cIildKV0sIDEpIDogX2MoJ3YtYnRuJywge1xuICAgIGRpcmVjdGl2ZXM6IFt7XG4gICAgICBuYW1lOiBcInRvb2x0aXBcIixcbiAgICAgIHJhd05hbWU6IFwidi10b29sdGlwOmxlZnRcIixcbiAgICAgIHZhbHVlOiAoe1xuICAgICAgICBodG1sOiAnUmVtb3ZlIHBob3RvJ1xuICAgICAgfSksXG4gICAgICBleHByZXNzaW9uOiBcIntodG1sOiAnUmVtb3ZlIHBob3RvJ31cIixcbiAgICAgIGFyZzogXCJsZWZ0XCJcbiAgICB9XSxcbiAgICBzdGF0aWNDbGFzczogXCJteC0yXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIFwiZmxhdFwiOiBcIlwiLFxuICAgICAgXCJpY29uXCI6IFwiXCJcbiAgICB9LFxuICAgIG9uOiB7XG4gICAgICBcImNsaWNrXCI6IF92bS5yZW1vdmVQaG90b1xuICAgIH1cbiAgfSwgW19jKCd2LWljb24nLCBbX3ZtLl92KFwiY2xvc2VcIildKV0sIDEpXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWNhcmQtYWN0aW9ucycsIFtfYygndi1zcGFjZXInKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtYnRuJywge1xuICAgIHN0YXRpY0NsYXNzOiBcInByaW1hcnktLXRleHRcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJ0eXBlXCI6IFwiYnV0dG9uXCIsXG4gICAgICBcImZsYXRcIjogXCJmbGF0XCJcbiAgICB9LFxuICAgIG5hdGl2ZU9uOiB7XG4gICAgICBcImNsaWNrXCI6IGZ1bmN0aW9uKCRldmVudCkge1xuICAgICAgICBfdm0uY2FuY2VsbGVkKCRldmVudClcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtfdm0uX3YoXCJDYW5jZWxcIildKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtYnRuJywge1xuICAgIHN0YXRpY0NsYXNzOiBcInByaW1hcnlcIixcbiAgICBhdHRyczoge1xuICAgICAgXCJ0eXBlXCI6IFwic3VibWl0XCIsXG4gICAgICBcImxvYWRpbmdcIjogX3ZtLnBvc3RpbmcsXG4gICAgICBcImRpc2FibGVkXCI6IF92bS5wb3N0aW5nXG4gICAgfVxuICB9LCBbX3ZtLl92KFwiUG9zdFwiKV0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCdpbnB1dCcsIHtcbiAgICByZWY6IFwiaGlkZGVuRmlsZVwiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcInR5cGVcIjogXCJmaWxlXCIsXG4gICAgICBcIm5hbWVcIjogXCJmaWxlSW1hZ2VcIixcbiAgICAgIFwiaWRcIjogXCJmaWxlSW1hZ2VcIlxuICAgIH0sXG4gICAgb246IHtcbiAgICAgIFwiY2hhbmdlXCI6IF92bS5vbkZpbGVDaGFuZ2VcbiAgICB9XG4gIH0pXSwgMSldKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi0wMTg3ODU3Y1wiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtMDE4Nzg1N2NcIixcImhhc1Njb3BlZFwiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvY29tcG9uZW50cy9zaGFyZWQvcG9zdHMvQWRkUG9zdC52dWVcbi8vIG1vZHVsZSBpZCA9IDI2MlxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ2RpdicsIFtfYygndi1sYXlvdXQnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwibWItM1wiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcImp1c3RpZnktY2VudGVyXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi1mbGV4Jywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInhzMTJcIjogXCJcIixcbiAgICAgIFwic204XCI6IFwiXCIsXG4gICAgICBcIm1kNlwiOiBcIlwiLFxuICAgICAgXCJsZzVcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCdkaXYnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwiaGVhZGxpbmVcIlxuICB9LCBbX3ZtLl92KFwiUG9zdHNcIildKV0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWxheW91dCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ3cmFwXCI6IFwiXCIsXG4gICAgICBcImp1c3RpZnktY2VudGVyXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi1mbGV4Jywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInhzMTJcIjogXCJcIixcbiAgICAgIFwic204XCI6IFwiXCIsXG4gICAgICBcIm1kNlwiOiBcIlwiLFxuICAgICAgXCJsZzVcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCdyLXBvc3RzJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInBvc3RzXCI6IF92bS5wb3N0c1xuICAgIH1cbiAgfSldLCAxKV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygnZGl2Jywge1xuICAgIHN0YXRpY0NsYXNzOiBcImZhYi1ob2xkZXJcIlxuICB9LCBbX2MoJ3YtYnRuJywge1xuICAgIGRpcmVjdGl2ZXM6IFt7XG4gICAgICBuYW1lOiBcInRvb2x0aXBcIixcbiAgICAgIHJhd05hbWU6IFwidi10b29sdGlwOnRvcFwiLFxuICAgICAgdmFsdWU6ICh7XG4gICAgICAgIGh0bWw6ICduZXcgcG9zdCdcbiAgICAgIH0pLFxuICAgICAgZXhwcmVzc2lvbjogXCJ7IGh0bWw6ICduZXcgcG9zdCcgfVwiLFxuICAgICAgYXJnOiBcInRvcFwiXG4gICAgfV0sXG4gICAgc3RhdGljQ2xhc3M6IFwicHJpbWFyeVwiLFxuICAgIGF0dHJzOiB7XG4gICAgICBcImRhcmtcIjogXCJcIixcbiAgICAgIFwiZmFiXCI6IFwiXCJcbiAgICB9LFxuICAgIG5hdGl2ZU9uOiB7XG4gICAgICBcImNsaWNrXCI6IGZ1bmN0aW9uKCRldmVudCkge1xuICAgICAgICAkZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIF92bS5vcGVuTmV3UG9zdCgkZXZlbnQpXG4gICAgICB9XG4gICAgfVxuICB9LCBbX2MoJ3YtaWNvbicsIFtfdm0uX3YoXCJhZGRcIildKV0sIDEpXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWRpYWxvZycsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ3aWR0aFwiOiBcIjYwMHB4XCJcbiAgICB9LFxuICAgIG1vZGVsOiB7XG4gICAgICB2YWx1ZTogKF92bS5uZXdQb3N0TW9kYWwpLFxuICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCQkdikge1xuICAgICAgICBfdm0ubmV3UG9zdE1vZGFsID0gJCR2XG4gICAgICB9LFxuICAgICAgZXhwcmVzc2lvbjogXCJuZXdQb3N0TW9kYWxcIlxuICAgIH1cbiAgfSwgW19jKCdyLWFkZC1wb3N0Jywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImNsZWFyXCI6IF92bS5jbGVhck5ld1Bvc3QsXG4gICAgICBcInVzZXJJbWFnZVwiOiBcIi9pbWFnZXMvYXZhdGFyMS5qcGdcIlxuICAgIH0sXG4gICAgb246IHtcbiAgICAgIFwiY2FuY2VsZWRcIjogZnVuY3Rpb24oJGV2ZW50KSB7XG4gICAgICAgIF92bS5uZXdQb3N0TW9kYWwgPSBmYWxzZVxuICAgICAgfSxcbiAgICAgIFwicG9zdGVkXCI6IF92bS5hZGRQb3N0XG4gICAgfVxuICB9KV0sIDEpXSwgMSlcbn0sc3RhdGljUmVuZGVyRm5zOiBbXX1cbm1vZHVsZS5leHBvcnRzLnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgIHJlcXVpcmUoXCJ2dWUtaG90LXJlbG9hZC1hcGlcIikucmVyZW5kZXIoXCJkYXRhLXYtZWNmNDBlYzJcIiwgbW9kdWxlLmV4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LWVjZjQwZWMyXCIsXCJoYXNTY29wZWRcIjpmYWxzZX0hLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9wb3N0c1NjcmVlbi52dWVcbi8vIG1vZHVsZSBpZCA9IDI2M1xuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJ2YXIgZGlzcG9zZWQgPSBmYWxzZVxuZnVuY3Rpb24gaW5qZWN0U3R5bGUgKHNzckNvbnRleHQpIHtcbiAgaWYgKGRpc3Bvc2VkKSByZXR1cm5cbiAgcmVxdWlyZShcIiEhdnVlLXN0eWxlLWxvYWRlciFjc3MtbG9hZGVyP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXg/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTQ0Mzc3OWYwXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IXN0eWx1cy1sb2FkZXIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9tZXNzYWdlc1NjcmVlbi52dWVcIilcbn1cbnZhciBDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplclwiKShcbiAgLyogc2NyaXB0ICovXG4gIHJlcXVpcmUoXCIhIWJhYmVsLWxvYWRlcj97XFxcImNhY2hlRGlyZWN0b3J5XFxcIjp0cnVlLFxcXCJwcmVzZXRzXFxcIjpbW1xcXCJlbnZcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2UsXFxcInRhcmdldHNcXFwiOntcXFwiYnJvd3NlcnNcXFwiOltcXFwiPiAyJVxcXCJdLFxcXCJ1Z2xpZnlcXFwiOnRydWV9fV0sW1xcXCJlczIwMTVcXFwiLHtcXFwibW9kdWxlc1xcXCI6ZmFsc2V9XSxbXFxcInN0YWdlLTJcXFwiXV19IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vbWVzc2FnZXNTY3JlZW4udnVlXCIpLFxuICAvKiB0ZW1wbGF0ZSAqL1xuICByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi00NDM3NzlmMFxcXCIsXFxcImhhc1Njb3BlZFxcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL21lc3NhZ2VzU2NyZWVuLnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIFwiZGF0YS12LTQ0Mzc3OWYwXCIsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvbWVzc2FnZXNTY3JlZW4udnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSBtZXNzYWdlc1NjcmVlbi52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtNDQzNzc5ZjBcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi00NDM3NzlmMFwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9tZXNzYWdlc1NjcmVlbi52dWVcbi8vIG1vZHVsZSBpZCA9IDI2NFxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtNDQzNzc5ZjBcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9tZXNzYWdlc1NjcmVlbi52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcIjM1NjdkY2UxXCIsIGNvbnRlbnQsIGZhbHNlKTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTQ0Mzc3OWYwXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vbWVzc2FnZXNTY3JlZW4udnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTQ0Mzc3OWYwXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vbWVzc2FnZXNTY3JlZW4udnVlXCIpO1xuICAgICBpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcbiAgICAgdXBkYXRlKG5ld0NvbnRlbnQpO1xuICAgfSk7XG4gfVxuIC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3NcbiBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTQ0Mzc3OWYwXCIsXCJzY29wZWRcIjp0cnVlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9kYXNoYm9hcmQvc2NyZWVucy9tZXNzYWdlc1NjcmVlbi52dWVcbi8vIG1vZHVsZSBpZCA9IDI2NVxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHRydWUpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiXFxuZGl2W2RhdGEtdi00NDM3NzlmMF0ge1xcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xcbn1cXG5pbWdbZGF0YS12LTQ0Mzc3OWYwXSB7XFxuICB3aWR0aDogMTUwcHg7XFxufVxcbmgxW2RhdGEtdi00NDM3NzlmMF0ge1xcbiAgY29sb3I6ICNmMDA7XFxufVxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvbWVzc2FnZXNTY3JlZW4udnVlXCIsXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2Rhc2hib2FyZC9zY3JlZW5zL21lc3NhZ2VzU2NyZWVuLnZ1ZVwiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiO0FBY0E7RUFDSSxtQkFBQTtDQ2JIO0FEZ0JEO0VBQ0ksYUFBQTtDQ2RIO0FEaUJEO0VBQ0ksWUFBQTtDQ2ZIXCIsXCJmaWxlXCI6XCJtZXNzYWdlc1NjcmVlbi52dWVcIixcInNvdXJjZXNDb250ZW50XCI6W1wiXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuZGl2IHtcXG4gICAgdGV4dC1hbGlnbjogY2VudGVyXFxufVxcblxcbmltZyB7XFxuICAgIHdpZHRoOiAxNTBweFxcbn1cXG5cXG5oMSB7XFxuICAgIGNvbG9yOiByZWQ7XFxufVxcblxcblwiLFwiZGl2IHtcXG4gIHRleHQtYWxpZ246IGNlbnRlcjtcXG59XFxuaW1nIHtcXG4gIHdpZHRoOiAxNTBweDtcXG59XFxuaDEge1xcbiAgY29sb3I6ICNmMDA7XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi00NDM3NzlmMFwiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvbWVzc2FnZXNTY3JlZW4udnVlXG4vLyBtb2R1bGUgaWQgPSAyNjZcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiPHRlbXBsYXRlPlxuICAgIDxkaXY+XG4gICAgICAgIDxpbWcgc3JjPVwiL2ltYWdlcy9sb2dvLnN2Z1wiIGFsdD1cIlZ1ZXRpZnkuanNcIj5cbiAgICAgICAgPGgxPk1lc3NhZ2VzIFNjcmVlbjwvaDE+XG4gICAgPC9kaXY+XG48L3RlbXBsYXRlPlxuXG48c2NyaXB0PlxuZXhwb3J0IGRlZmF1bHQge1xuXG59XG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzdHlsdXNcIiBzY29wZWQ+XG5kaXYge1xuICAgIHRleHQtYWxpZ246IGNlbnRlclxufVxuXG5pbWcge1xuICAgIHdpZHRoOiAxNTBweFxufVxuXG5oMSB7XG4gICAgY29sb3I6IHJlZDtcbn1cblxuPC9zdHlsZT5cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyBtZXNzYWdlc1NjcmVlbi52dWU/NDY1NDBmMjMiLCJtb2R1bGUuZXhwb3J0cz17cmVuZGVyOmZ1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX3ZtLl9tKDApXG59LHN0YXRpY1JlbmRlckZuczogW2Z1bmN0aW9uICgpe3ZhciBfdm09dGhpczt2YXIgX2g9X3ZtLiRjcmVhdGVFbGVtZW50O3ZhciBfYz1fdm0uX3NlbGYuX2N8fF9oO1xuICByZXR1cm4gX2MoJ2RpdicsIFtfYygnaW1nJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInNyY1wiOiBcIi9pbWFnZXMvbG9nby5zdmdcIixcbiAgICAgIFwiYWx0XCI6IFwiVnVldGlmeS5qc1wiXG4gICAgfVxuICB9KSwgX3ZtLl92KFwiIFwiKSwgX2MoJ2gxJywgW192bS5fdihcIk1lc3NhZ2VzIFNjcmVlblwiKV0pXSlcbn1dfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi00NDM3NzlmMFwiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtNDQzNzc5ZjBcIixcImhhc1Njb3BlZFwiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvZGFzaGJvYXJkL3NjcmVlbnMvbWVzc2FnZXNTY3JlZW4udnVlXG4vLyBtb2R1bGUgaWQgPSAyNjhcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiaW1wb3J0IExvZ2luIGZyb20gJ0AvcGFnZXMvYXV0aC9zY3JlZW5zL2xvZ2luU2NyZWVuLnZ1ZSc7XG5pbXBvcnQgUmVnaXN0ZXIgZnJvbSAnQC9wYWdlcy9hdXRoL3NjcmVlbnMvcmVnaXN0ZXJTY3JlZW4udnVlJztcblxuaW1wb3J0IHN0b3JlIGZyb20gJy4vLi4vc3RvcmUvc3RvcmUnXG5pbXBvcnQgdHlwZXMgZnJvbSAnLi8uLi9zdG9yZS90eXBlcydcblxubGV0IGNvbmZpcm1BdXRoID0gKHRvLCBmcm9tLCBuZXh0KSA9PiB7XG4gICAgaWYgKHN0b3JlLmdldHRlcnNbdHlwZXMuYXV0aC5OQU1FICsgJy8nICsgdHlwZXMuYXV0aC5JU19MT0dHRURfSU5dKSB7XG4gICAgICAgIG5leHQoeyBuYW1lOiAnZGFzaC5ob21lJyB9KTtcbiAgICB9XG4gICAgbmV4dCgpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBbe1xuICAgICAgICBwYXRoOiAnLycsXG4gICAgICAgIG5hbWU6ICdhdXRoLmxvZ2luJyxcbiAgICAgICAgY29tcG9uZW50OiBMb2dpbixcbiAgICAgICAgYmVmb3JlRW50ZXI6IGNvbmZpcm1BdXRoXG4gICAgfSxcbiAgICB7XG4gICAgICAgIHBhdGg6ICdyZWdpc3RlcicsXG4gICAgICAgIG5hbWU6ICdhdXRoLnJlZ2lzdGVyJyxcbiAgICAgICAgY29tcG9uZW50OiBSZWdpc3RlcixcbiAgICAgICAgYmVmb3JlRW50ZXI6IGNvbmZpcm1BdXRoXG4gICAgfSxcbl1cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL3JvdXRlci9hdXRoUm91dGVzLmpzIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbmZ1bmN0aW9uIGluamVjdFN0eWxlIChzc3JDb250ZXh0KSB7XG4gIGlmIChkaXNwb3NlZCkgcmV0dXJuXG4gIHJlcXVpcmUoXCIhIXZ1ZS1zdHlsZS1sb2FkZXIhY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi01NWVmMTdkYVxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hc3R5bHVzLWxvYWRlciEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2xvZ2luU2NyZWVuLnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi9sb2dpblNjcmVlbi52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LTU1ZWYxN2RhXFxcIixcXFwiaGFzU2NvcGVkXFxcIjpmYWxzZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL2xvZ2luU2NyZWVuLnZ1ZVwiKSxcbiAgLyogc3R5bGVzICovXG4gIGluamVjdFN0eWxlLFxuICAvKiBzY29wZUlkICovXG4gIG51bGwsXG4gIC8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xuICBudWxsXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9zY3JlZW5zL2xvZ2luU2NyZWVuLnZ1ZVwiXG5pZiAoQ29tcG9uZW50LmVzTW9kdWxlICYmIE9iamVjdC5rZXlzKENvbXBvbmVudC5lc01vZHVsZSkuc29tZShmdW5jdGlvbiAoa2V5KSB7cmV0dXJuIGtleSAhPT0gXCJkZWZhdWx0XCIgJiYga2V5LnN1YnN0cigwLCAyKSAhPT0gXCJfX1wifSkpIHtjb25zb2xlLmVycm9yKFwibmFtZWQgZXhwb3J0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiAqLnZ1ZSBmaWxlcy5cIil9XG5pZiAoQ29tcG9uZW50Lm9wdGlvbnMuZnVuY3Rpb25hbCkge2NvbnNvbGUuZXJyb3IoXCJbdnVlLWxvYWRlcl0gbG9naW5TY3JlZW4udnVlOiBmdW5jdGlvbmFsIGNvbXBvbmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0ZW1wbGF0ZXMsIHRoZXkgc2hvdWxkIHVzZSByZW5kZXIgZnVuY3Rpb25zLlwiKX1cblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LTU1ZWYxN2RhXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtNTVlZjE3ZGFcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9zY3JlZW5zL2xvZ2luU2NyZWVuLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjcwXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8vIHN0eWxlLWxvYWRlcjogQWRkcyBzb21lIGNzcyB0byB0aGUgRE9NIGJ5IGFkZGluZyBhIDxzdHlsZT4gdGFnXG5cbi8vIGxvYWQgdGhlIHN0eWxlc1xudmFyIGNvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi01NWVmMTdkYVxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9sb2dpblNjcmVlbi52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcIjk5MzA2ODUyXCIsIGNvbnRlbnQsIGZhbHNlKTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTU1ZWYxN2RhXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL2xvZ2luU2NyZWVuLnZ1ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgdmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi01NWVmMTdkYVxcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9sb2dpblNjcmVlbi52dWVcIik7XG4gICAgIGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuICAgICB1cGRhdGUobmV3Q29udGVudCk7XG4gICB9KTtcbiB9XG4gLy8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIhLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtNTVlZjE3ZGFcIixcInNjb3BlZFwiOmZhbHNlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvbG9naW5TY3JlZW4udnVlXG4vLyBtb2R1bGUgaWQgPSAyNzFcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSh0cnVlKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIlxcbi5sb2dpbi1zY3JlZW4ge1xcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xcbn1cXG5cIiwgXCJcIiwge1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvbG9naW5TY3JlZW4udnVlXCIsXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvc2NyZWVucy9sb2dpblNjcmVlbi52dWVcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIjtBQXlEQTtFQUNJLG1CQUFBO0NDeERIXCIsXCJmaWxlXCI6XCJsb2dpblNjcmVlbi52dWVcIixcInNvdXJjZXNDb250ZW50XCI6W1wiXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuLmxvZ2luLXNjcmVlbiB7XFxuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcXG4gICAgLy8gd2lkdGg6IDMwMHB4O1xcbn1cXG5cXG5cIixcIi5sb2dpbi1zY3JlZW4ge1xcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xcbn1cXG5cIl0sXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlcj9zb3VyY2VNYXAhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtNTVlZjE3ZGFcIixcInNjb3BlZFwiOmZhbHNlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvbG9naW5TY3JlZW4udnVlXG4vLyBtb2R1bGUgaWQgPSAyNzJcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiPHRlbXBsYXRlPlxuICAgIDx2LWNhcmQgY2xhc3M9XCJsb2dpbi1zY3JlZW5cIj5cbiAgICAgICAgPHYtY2FyZC10ZXh0IGNsYXNzPVwicGEtNSBwYi0wXCI+XG4gICAgICAgICAgICA8di1sYXlvdXQgY29sdW1uPlxuICAgICAgICAgICAgICAgIDxmb3JtIEBzdWJtaXQucHJldmVudD1cImxvZ2luQXR0ZW1wdFwiPlxuICAgICAgICAgICAgICAgIDx2LWZsZXggeHMxMj5cbiAgICAgICAgICAgICAgICAgICAgPHYtdGV4dC1maWVsZCBsYWJlbD1cIkUtTWFpbFwiIHByZXBlbmQtaWNvbj1cImVtYWlsXCIgdi1tb2RlbD1cInVzZXIuZW1haWxcIiB0eXBlPSdlbWFpbCc+PC92LXRleHQtZmllbGQ+XG4gICAgICAgICAgICAgICAgPC92LWZsZXg+XG4gICAgICAgICAgICAgICAgPHYtZmxleCB4czEyPlxuICAgICAgICAgICAgICAgICAgICA8di10ZXh0LWZpZWxkIGxhYmVsPVwiUGFzc3dvcmRcIiA6YXBwZW5kLWljb249XCJlID8gJ3Zpc2liaWxpdHknIDogJ3Zpc2liaWxpdHlfb2ZmJ1wiIDp0eXBlPVwiaXNQYXNzd29yZFZpc2libGVcIiA6YXBwZW5kLWljb24tY2I9XCIoKSA9PiAoZSA9ICFlKVwiIHByZXBlbmQtaWNvbj1cImxvY2tcIiB2LW1vZGVsPVwidXNlci5wYXNzd29yZFwiPjwvdi10ZXh0LWZpZWxkPlxuICAgICAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICAgICAgICAgIDx2LWZsZXggeHMxMj5cbiAgICAgICAgICAgICAgICAgICAgPHYtYnRuIHR5cGU9XCJzdWJtaXRcIiBwcmltYXJ5IGxhcmdlPkxvZ2luPC92LWJ0bj5cbiAgICAgICAgICAgICAgICA8L3YtZmxleD5cbiAgICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICA8L3YtbGF5b3V0PlxuICAgICAgICA8L3YtY2FyZC10ZXh0PlxuICAgICAgICA8di1jYXJkLXRleHQ+XG4gICAgICAgICAgICBEb24ndCBoYXZlIGFuIGFjY291bnQ/IDxyb3V0ZXItbGluayA6dG89XCJ7bmFtZTogJ2F1dGgucmVnaXN0ZXInfVwiPlJlZ2lzdGVyPC9yb3V0ZXItbGluaz5cbiAgICAgICAgPC92LWNhcmQtdGV4dD5cbiAgICA8L3YtY2FyZD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5pbXBvcnQgdXNlciBmcm9tICcuLy4uLy4uLy4uL2FwaS91c2VyLmpzJztcbmltcG9ydCBzIGZyb20gJy4vLi4vLi4vLi4vaGVscGVycy9zbmFja2Jhci5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBkYXRhKCl7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlOiBmYWxzZSxcbiAgICAgICAgICAgIHVzZXI6IHtcbiAgICAgICAgICAgICAgICBlbWFpbDogJycsXG4gICAgICAgICAgICAgICAgcGFzc3dvcmQ6ICcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgaXNQYXNzd29yZFZpc2libGUoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lID8gJ3RleHQnIDogJ3Bhc3N3b3JkJztcbiAgICAgICAgfVxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICBsb2dpbkF0dGVtcHQoKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhdHRlbXB0aW5nIGxvZ2luJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnVzZXIuZW1haWwpO1xuXG4gICAgICAgICAgICB1c2VyLmF0dGVtcHQodGhpcy51c2VyLmVtYWlsLCB0aGlzLnVzZXIucGFzc3dvcmQpXG4gICAgICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuJHJvdXRlci5wdXNoKHtuYW1lOiAnZGFzaC5ob21lJ30pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInN0eWx1c1wiPlxuLmxvZ2luLXNjcmVlbiB7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIC8vIHdpZHRoOiAzMDBweDtcbn1cblxuPC9zdHlsZT5cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyBsb2dpblNjcmVlbi52dWU/MWFjZjUxYzYiLCJpbXBvcnQgYXBpIGZyb20gJy4vaW5kZXgnO1xuaW1wb3J0IHMgZnJvbSAnLi8uLi9oZWxwZXJzL3NuYWNrYmFyJztcbmltcG9ydCBsIGZyb20gJy4vLi4vaGVscGVycy9sb2FkZXInO1xuaW1wb3J0IHN0b3JlIGZyb20gJy4vLi4vc3RvcmUvc3RvcmUnO1xuaW1wb3J0IHR5cGVzIGZyb20gJy4vLi4vc3RvcmUvdHlwZXMnO1xuXG5jbGFzcyBVc2VyIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLm1vZGVsID0gJ3VzZXJzJztcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgLy8gdGhpcy5sYXN0X2ZldGNoID0gbW9tZW50KCk7XG4gICAgfVxuXG4gICAgYXR0ZW1wdChlbWFpbCwgcGFzc3dvcmQpIHtcbiAgICAgICAgbGV0IGRhdGEgPSB7XG4gICAgICAgICAgICBlbWFpbCxcbiAgICAgICAgICAgIHBhc3N3b3JkXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgbC5zdGFydCgpO1xuXG4gICAgICAgICAgICBhcGkucG9zdCgnbG9naW4nLCBkYXRhKVxuICAgICAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXMuc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzLmZpcmUocmVzLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcmUuY29tbWl0KHR5cGVzLmF1dGguTkFNRSArICcvJyArIHR5cGVzLmF1dGguVVNFUl9MT0dJTiwgcmVzLmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbC5zdG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVzZXIgPSByZXMuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzLmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcy5maXJlKGVycm9yLmRhdGEubWVzc2FnZSwgJ3dhcm5pbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMuZmlyZShcInNvbWV0aGluZyB3ZW50IHdyb25nXCIsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbC5zdG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IFVzZXIoKTtcblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL2pzL2FwaS91c2VyLmpzIiwibW9kdWxlLmV4cG9ydHM9e3JlbmRlcjpmdW5jdGlvbiAoKXt2YXIgX3ZtPXRoaXM7dmFyIF9oPV92bS4kY3JlYXRlRWxlbWVudDt2YXIgX2M9X3ZtLl9zZWxmLl9jfHxfaDtcbiAgcmV0dXJuIF9jKCd2LWNhcmQnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwibG9naW4tc2NyZWVuXCJcbiAgfSwgW19jKCd2LWNhcmQtdGV4dCcsIHtcbiAgICBzdGF0aWNDbGFzczogXCJwYS01IHBiLTBcIlxuICB9LCBbX2MoJ3YtbGF5b3V0Jywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImNvbHVtblwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ2Zvcm0nLCB7XG4gICAgb246IHtcbiAgICAgIFwic3VibWl0XCI6IGZ1bmN0aW9uKCRldmVudCkge1xuICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgX3ZtLmxvZ2luQXR0ZW1wdCgkZXZlbnQpXG4gICAgICB9XG4gICAgfVxuICB9LCBbX2MoJ3YtZmxleCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ4czEyXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi10ZXh0LWZpZWxkJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImxhYmVsXCI6IFwiRS1NYWlsXCIsXG4gICAgICBcInByZXBlbmQtaWNvblwiOiBcImVtYWlsXCIsXG4gICAgICBcInR5cGVcIjogXCJlbWFpbFwiXG4gICAgfSxcbiAgICBtb2RlbDoge1xuICAgICAgdmFsdWU6IChfdm0udXNlci5lbWFpbCksXG4gICAgICBjYWxsYmFjazogZnVuY3Rpb24oJCR2KSB7XG4gICAgICAgIF92bS51c2VyLmVtYWlsID0gJCR2XG4gICAgICB9LFxuICAgICAgZXhwcmVzc2lvbjogXCJ1c2VyLmVtYWlsXCJcbiAgICB9XG4gIH0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWZsZXgnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwieHMxMlwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtdGV4dC1maWVsZCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJsYWJlbFwiOiBcIlBhc3N3b3JkXCIsXG4gICAgICBcImFwcGVuZC1pY29uXCI6IF92bS5lID8gJ3Zpc2liaWxpdHknIDogJ3Zpc2liaWxpdHlfb2ZmJyxcbiAgICAgIFwidHlwZVwiOiBfdm0uaXNQYXNzd29yZFZpc2libGUsXG4gICAgICBcImFwcGVuZC1pY29uLWNiXCI6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIChfdm0uZSA9ICFfdm0uZSk7IH0sXG4gICAgICBcInByZXBlbmQtaWNvblwiOiBcImxvY2tcIlxuICAgIH0sXG4gICAgbW9kZWw6IHtcbiAgICAgIHZhbHVlOiAoX3ZtLnVzZXIucGFzc3dvcmQpLFxuICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCQkdikge1xuICAgICAgICBfdm0udXNlci5wYXNzd29yZCA9ICQkdlxuICAgICAgfSxcbiAgICAgIGV4cHJlc3Npb246IFwidXNlci5wYXNzd29yZFwiXG4gICAgfVxuICB9KV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1mbGV4Jywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInhzMTJcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LWJ0bicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ0eXBlXCI6IFwic3VibWl0XCIsXG4gICAgICBcInByaW1hcnlcIjogXCJcIixcbiAgICAgIFwibGFyZ2VcIjogXCJcIlxuICAgIH1cbiAgfSwgW192bS5fdihcIkxvZ2luXCIpXSldLCAxKV0sIDEpXSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtY2FyZC10ZXh0JywgW192bS5fdihcIlxcbiAgICAgICAgRG9uJ3QgaGF2ZSBhbiBhY2NvdW50PyBcIiksIF9jKCdyb3V0ZXItbGluaycsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ0b1wiOiB7XG4gICAgICAgIG5hbWU6ICdhdXRoLnJlZ2lzdGVyJ1xuICAgICAgfVxuICAgIH1cbiAgfSwgW192bS5fdihcIlJlZ2lzdGVyXCIpXSldLCAxKV0sIDEpXG59LHN0YXRpY1JlbmRlckZuczogW119XG5tb2R1bGUuZXhwb3J0cy5yZW5kZXIuX3dpdGhTdHJpcHBlZCA9IHRydWVcbmlmIChtb2R1bGUuaG90KSB7XG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKG1vZHVsZS5ob3QuZGF0YSkge1xuICAgICByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpLnJlcmVuZGVyKFwiZGF0YS12LTU1ZWYxN2RhXCIsIG1vZHVsZS5leHBvcnRzKVxuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXI/e1wiaWRcIjpcImRhdGEtdi01NWVmMTdkYVwiLFwiaGFzU2NvcGVkXCI6ZmFsc2V9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9zY3JlZW5zL2xvZ2luU2NyZWVuLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjc1XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG5mdW5jdGlvbiBpbmplY3RTdHlsZSAoc3NyQ29udGV4dCkge1xuICBpZiAoZGlzcG9zZWQpIHJldHVyblxuICByZXF1aXJlKFwiISF2dWUtc3R5bGUtbG9hZGVyIWNzcy1sb2FkZXI/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleD97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMThlY2JmODFcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hc3R5bHVzLWxvYWRlciEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3JlZ2lzdGVyU2NyZWVuLnZ1ZVwiKVxufVxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpKFxuICAvKiBzY3JpcHQgKi9cbiAgcmVxdWlyZShcIiEhYmFiZWwtbG9hZGVyP3tcXFwiY2FjaGVEaXJlY3RvcnlcXFwiOnRydWUsXFxcInByZXNldHNcXFwiOltbXFxcImVudlxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZSxcXFwidGFyZ2V0c1xcXCI6e1xcXCJicm93c2Vyc1xcXCI6W1xcXCI+IDIlXFxcIl0sXFxcInVnbGlmeVxcXCI6dHJ1ZX19XSxbXFxcImVzMjAxNVxcXCIse1xcXCJtb2R1bGVzXFxcIjpmYWxzZX1dLFtcXFwic3RhZ2UtMlxcXCJdXX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi9yZWdpc3RlclNjcmVlbi52dWVcIiksXG4gIC8qIHRlbXBsYXRlICovXG4gIHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlci9pbmRleD97XFxcImlkXFxcIjpcXFwiZGF0YS12LTE4ZWNiZjgxXFxcIixcXFwiaGFzU2NvcGVkXFxcIjp0cnVlfSEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vcmVnaXN0ZXJTY3JlZW4udnVlXCIpLFxuICAvKiBzdHlsZXMgKi9cbiAgaW5qZWN0U3R5bGUsXG4gIC8qIHNjb3BlSWQgKi9cbiAgXCJkYXRhLXYtMThlY2JmODFcIixcbiAgLyogbW9kdWxlSWRlbnRpZmllciAoc2VydmVyIG9ubHkpICovXG4gIG51bGxcbilcbkNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwiL0FwcGxpY2F0aW9ucy92dWUva2VsbHkvcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvcmVnaXN0ZXJTY3JlZW4udnVlXCJcbmlmIChDb21wb25lbnQuZXNNb2R1bGUgJiYgT2JqZWN0LmtleXMoQ29tcG9uZW50LmVzTW9kdWxlKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtyZXR1cm4ga2V5ICE9PSBcImRlZmF1bHRcIiAmJiBrZXkuc3Vic3RyKDAsIDIpICE9PSBcIl9fXCJ9KSkge2NvbnNvbGUuZXJyb3IoXCJuYW1lZCBleHBvcnRzIGFyZSBub3Qgc3VwcG9ydGVkIGluICoudnVlIGZpbGVzLlwiKX1cbmlmIChDb21wb25lbnQub3B0aW9ucy5mdW5jdGlvbmFsKSB7Y29uc29sZS5lcnJvcihcIlt2dWUtbG9hZGVyXSByZWdpc3RlclNjcmVlbi52dWU6IGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRlbXBsYXRlcywgdGhleSBzaG91bGQgdXNlIHJlbmRlciBmdW5jdGlvbnMuXCIpfVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtMThlY2JmODFcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi0xOGVjYmY4MVwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvcmVnaXN0ZXJTY3JlZW4udnVlXG4vLyBtb2R1bGUgaWQgPSAyNzZcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiPHRlbXBsYXRlPlxuICAgIDx2LWNhcmQgY2xhc3M9XCJyZWdpc3Rlci1zY3JlZW5cIj5cbiAgICAgICAgPHYtY2FyZC10ZXh0IGNsYXNzPVwicGEtNVwiPlxuICAgICAgICAgICAgPHYtbGF5b3V0IHJvdyB3cmFwPlxuICAgICAgICAgICAgICAgIDx2LWZsZXggeHMxMj5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9XCJcIiAvPlxuICAgICAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICAgICAgICAgIDx2LWZsZXggeHMxMj5cbiAgICAgICAgICAgICAgICAgICAgPHYtdGV4dC1maWVsZCB2LW1vZGVsPVwidXNlci5uYW1lXCIgbGFiZWw9XCJGdWxsIE5hbWVcIiBwcmVwZW5kLWljb249XCJwZXJzb25cIiByZXF1aXJlZD48L3YtdGV4dC1maWVsZD5cbiAgICAgICAgICAgICAgICA8L3YtZmxleD5cbiAgICAgICAgICAgICAgICA8di1mbGV4IHhzMTI+XG4gICAgICAgICAgICAgICAgICAgIDx2LXRleHQtZmllbGQgbGFiZWw9XCJTaG9ydCBEZXNjcmlwdGlvblwiIHByZXBlbmQtaWNvbj1cInNwZWFrZXJfbm90ZXNcIiBtdWx0aS1saW5lIHJvd3M9JzInIG1heD1cIjkwXCIgY291bnRlciB2LW1vZGVsPVwidXNlci50aXRsZVwiIHJlcXVpcmVkPjwvdi10ZXh0LWZpZWxkPlxuICAgICAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICAgICAgICAgIDx2LWZsZXggeHMxMj5cbiAgICAgICAgICAgICAgICAgICAgPHYtdGV4dC1maWVsZCBsYWJlbD1cIkUtTWFpbFwiIHByZXBlbmQtaWNvbj1cImVtYWlsXCIgdi1tb2RlbD1cInVzZXIuZW1haWxcIiByZXF1aXJlZCB0eXBlPSdlbWFpbCc+PC92LXRleHQtZmllbGQ+XG4gICAgICAgICAgICAgICAgPC92LWZsZXg+XG4gICAgICAgICAgICAgICAgPHYtZmxleCB4czEyPlxuICAgICAgICAgICAgICAgICAgICA8di10ZXh0LWZpZWxkIGxhYmVsPVwiUGFzc3dvcmRcIiBoaW50PVwiQXQgbGVhc3QgNSBjaGFyYWN0ZXJzXCIgOm1pbj1cIjVcIiA6YXBwZW5kLWljb249XCJlID8gJ3Zpc2liaWxpdHknIDogJ3Zpc2liaWxpdHlfb2ZmJ1wiIDp0eXBlPVwiaXNQYXNzd29yZFZpc2libGVcIiA6YXBwZW5kLWljb24tY2I9XCIoKSA9PiAoZSA9ICFlKVwiIHByZXBlbmQtaWNvbj1cImxvY2tcIiB2LW1vZGVsPVwidXNlci5wYXNzd29yZFwiIHJlcXVpcmVkPjwvdi10ZXh0LWZpZWxkPlxuICAgICAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICAgICAgICAgIDx2LWZsZXggeHMxMj5cbiAgICAgICAgICAgICAgICAgICAgPHYtYnRuIHByaW1hcnkgbGFyZ2U+UmVnaXN0ZXI8L3YtYnRuPlxuICAgICAgICAgICAgICAgIDwvdi1mbGV4PlxuICAgICAgICAgICAgPC92LWxheW91dD5cbiAgICAgICAgPC92LWNhcmQtdGV4dD5cbiAgICAgICAgPHYtY2FyZC10ZXh0PlxuICAgICAgICAgICAgQWxyZWFkeSBoYXZlIGFuIGFjY291bnQ/IDxyb3V0ZXItbGluayA6dG89XCJ7bmFtZTogJ2F1dGgubG9naW4nfVwiPkxvZ2luPC9yb3V0ZXItbGluaz5cbiAgICAgICAgPC92LWNhcmQtdGV4dD5cbiAgICA8L3YtY2FyZD5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5leHBvcnQgZGVmYXVsdCB7XG4gICAgZGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGU6IGZhbHNlLFxuICAgICAgICAgICAgdXNlcjoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnJyxcbiAgICAgICAgICAgICAgICBlbWFpbDogJycsXG4gICAgICAgICAgICAgICAgaW1hZ2U6IG51bGwsXG4gICAgICAgICAgICAgICAgcGFzc3dvcmQ6ICcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJ1bGVzOiB7XG4gICAgICAgICAgICAgICAgcmVxdWlyZWQ6ICh2YWx1ZSkgPT4gISF2YWx1ZSB8fCAnUmVxdWlyZWQuJyxcbiAgICAgICAgICAgICAgICBlbWFpbDogKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhdHRlcm4gPSAvXigoW148PigpXFxbXFxdXFxcXC4sOzpcXHNAXCJdKyhcXC5bXjw+KClcXFtcXF1cXFxcLiw7Olxcc0BcIl0rKSopfChcIi4rXCIpKUAoKFxcW1swLTldezEsM31cXC5bMC05XXsxLDN9XFwuWzAtOV17MSwzfVxcLlswLTldezEsM31dKXwoKFthLXpBLVpcXC0wLTldK1xcLikrW2EtekEtWl17Mix9KSkkL1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0dGVybi50ZXN0KHZhbHVlKSB8fCAnSW52YWxpZCBlLW1haWwuJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgaXNQYXNzd29yZFZpc2libGUoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lID8gJ3RleHQnIDogJ3Bhc3N3b3JkJztcbiAgICAgICAgfVxuICAgIH1cblxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic3R5bHVzXCIgc2NvcGVkPlxuLnJlZ2lzdGVyLXNjcmVlbiB7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyXG4gICAgLy8gd2lkdGg6IDMwZW1cbn1cbjwvc3R5bGU+XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gcmVnaXN0ZXJTY3JlZW4udnVlPzdhN2FmOTQxIiwiLy8gcmVtb3ZlZCBieSBleHRyYWN0LXRleHQtd2VicGFjay1wbHVnaW5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3Jlc291cmNlcy9hc3NldHMvc3R5bHVzL2VudHJ5LnN0eWxcbi8vIG1vZHVsZSBpZCA9IDI4MVxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvLyByZW1vdmVkIGJ5IGV4dHJhY3QtdGV4dC13ZWJwYWNrLXBsdWdpblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL21kaS9zY3NzL21hdGVyaWFsZGVzaWduaWNvbnMuc2Nzc1xuLy8gbW9kdWxlIGlkID0gMjgyXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8vIHJlbW92ZWQgYnkgZXh0cmFjdC10ZXh0LXdlYnBhY2stcGx1Z2luXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9yZXNvdXJjZXMvYXNzZXRzL3Nhc3MvYXBwLnNjc3Ncbi8vIG1vZHVsZSBpZCA9IDI4M1xuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMThlY2JmODFcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6dHJ1ZX0hLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9yZWdpc3RlclNjcmVlbi52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcIjRhODU4NDljXCIsIGNvbnRlbnQsIGZhbHNlKTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTE4ZWNiZjgxXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVnaXN0ZXJTY3JlZW4udnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTE4ZWNiZjgxXFxcIixcXFwic2NvcGVkXFxcIjp0cnVlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOnRydWV9IS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsdXMtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVnaXN0ZXJTY3JlZW4udnVlXCIpO1xuICAgICBpZih0eXBlb2YgbmV3Q29udGVudCA9PT0gJ3N0cmluZycpIG5ld0NvbnRlbnQgPSBbW21vZHVsZS5pZCwgbmV3Q29udGVudCwgJyddXTtcbiAgICAgdXBkYXRlKG5ld0NvbnRlbnQpO1xuICAgfSk7XG4gfVxuIC8vIFdoZW4gdGhlIG1vZHVsZSBpcyBkaXNwb3NlZCwgcmVtb3ZlIHRoZSA8c3R5bGU+IHRhZ3NcbiBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24oKSB7IHVwZGF0ZSgpOyB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyIS4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyP3tcInZ1ZVwiOnRydWUsXCJpZFwiOlwiZGF0YS12LTE4ZWNiZjgxXCIsXCJzY29wZWRcIjp0cnVlLFwiaGFzSW5saW5lQ29uZmlnXCI6dHJ1ZX0hLi9ub2RlX21vZHVsZXMvc3R5bHVzLWxvYWRlciEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vcmVzb3VyY2VzL2Fzc2V0cy9qcy9wYWdlcy9hdXRoL3NjcmVlbnMvcmVnaXN0ZXJTY3JlZW4udnVlXG4vLyBtb2R1bGUgaWQgPSAyOTVcbi8vIG1vZHVsZSBjaHVua3MgPSAxIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2xpYi9jc3MtYmFzZS5qc1wiKSh0cnVlKTtcbi8vIGltcG9ydHNcblxuXG4vLyBtb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIlxcbi5yZWdpc3Rlci1zY3JlZW5bZGF0YS12LTE4ZWNiZjgxXSB7XFxuICB0ZXh0LWFsaWduOiBjZW50ZXI7XFxufVxcblwiLCBcIlwiLCB7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCIvQXBwbGljYXRpb25zL3Z1ZS9rZWxseS9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvc2NyZWVucy9yZXNvdXJjZXMvYXNzZXRzL2pzL3BhZ2VzL2F1dGgvc2NyZWVucy9yZWdpc3RlclNjcmVlbi52dWVcIixcIi9BcHBsaWNhdGlvbnMvdnVlL2tlbGx5L3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9zY3JlZW5zL3JlZ2lzdGVyU2NyZWVuLnZ1ZVwiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiO0FBNkRBO0VBQ0ksbUJBQUE7Q0M1REhcIixcImZpbGVcIjpcInJlZ2lzdGVyU2NyZWVuLnZ1ZVwiLFwic291cmNlc0NvbnRlbnRcIjpbXCJcXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG4ucmVnaXN0ZXItc2NyZWVuIHtcXG4gICAgdGV4dC1hbGlnbjogY2VudGVyXFxuICAgIC8vIHdpZHRoOiAzMGVtXFxufVxcblwiLFwiLnJlZ2lzdGVyLXNjcmVlbiB7XFxuICB0ZXh0LWFsaWduOiBjZW50ZXI7XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi0xOGVjYmY4MVwiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3N0eWx1cy1sb2FkZXIhLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9zY3JlZW5zL3JlZ2lzdGVyU2NyZWVuLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjk2XG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIm1vZHVsZS5leHBvcnRzPXtyZW5kZXI6ZnVuY3Rpb24gKCl7dmFyIF92bT10aGlzO3ZhciBfaD1fdm0uJGNyZWF0ZUVsZW1lbnQ7dmFyIF9jPV92bS5fc2VsZi5fY3x8X2g7XG4gIHJldHVybiBfYygndi1jYXJkJywge1xuICAgIHN0YXRpY0NsYXNzOiBcInJlZ2lzdGVyLXNjcmVlblwiXG4gIH0sIFtfYygndi1jYXJkLXRleHQnLCB7XG4gICAgc3RhdGljQ2xhc3M6IFwicGEtNVwiXG4gIH0sIFtfYygndi1sYXlvdXQnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwicm93XCI6IFwiXCIsXG4gICAgICBcIndyYXBcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LWZsZXgnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwieHMxMlwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ2ltZycsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJzcmNcIjogXCJcIlxuICAgIH1cbiAgfSldKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtZmxleCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ4czEyXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi10ZXh0LWZpZWxkJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImxhYmVsXCI6IFwiRnVsbCBOYW1lXCIsXG4gICAgICBcInByZXBlbmQtaWNvblwiOiBcInBlcnNvblwiLFxuICAgICAgXCJyZXF1aXJlZFwiOiBcIlwiXG4gICAgfSxcbiAgICBtb2RlbDoge1xuICAgICAgdmFsdWU6IChfdm0udXNlci5uYW1lKSxcbiAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigkJHYpIHtcbiAgICAgICAgX3ZtLnVzZXIubmFtZSA9ICQkdlxuICAgICAgfSxcbiAgICAgIGV4cHJlc3Npb246IFwidXNlci5uYW1lXCJcbiAgICB9XG4gIH0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWZsZXgnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwieHMxMlwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtdGV4dC1maWVsZCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJsYWJlbFwiOiBcIlNob3J0IERlc2NyaXB0aW9uXCIsXG4gICAgICBcInByZXBlbmQtaWNvblwiOiBcInNwZWFrZXJfbm90ZXNcIixcbiAgICAgIFwibXVsdGktbGluZVwiOiBcIlwiLFxuICAgICAgXCJyb3dzXCI6IFwiMlwiLFxuICAgICAgXCJtYXhcIjogXCI5MFwiLFxuICAgICAgXCJjb3VudGVyXCI6IFwiXCIsXG4gICAgICBcInJlcXVpcmVkXCI6IFwiXCJcbiAgICB9LFxuICAgIG1vZGVsOiB7XG4gICAgICB2YWx1ZTogKF92bS51c2VyLnRpdGxlKSxcbiAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigkJHYpIHtcbiAgICAgICAgX3ZtLnVzZXIudGl0bGUgPSAkJHZcbiAgICAgIH0sXG4gICAgICBleHByZXNzaW9uOiBcInVzZXIudGl0bGVcIlxuICAgIH1cbiAgfSldLCAxKSwgX3ZtLl92KFwiIFwiKSwgX2MoJ3YtZmxleCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJ4czEyXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfYygndi10ZXh0LWZpZWxkJywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcImxhYmVsXCI6IFwiRS1NYWlsXCIsXG4gICAgICBcInByZXBlbmQtaWNvblwiOiBcImVtYWlsXCIsXG4gICAgICBcInJlcXVpcmVkXCI6IFwiXCIsXG4gICAgICBcInR5cGVcIjogXCJlbWFpbFwiXG4gICAgfSxcbiAgICBtb2RlbDoge1xuICAgICAgdmFsdWU6IChfdm0udXNlci5lbWFpbCksXG4gICAgICBjYWxsYmFjazogZnVuY3Rpb24oJCR2KSB7XG4gICAgICAgIF92bS51c2VyLmVtYWlsID0gJCR2XG4gICAgICB9LFxuICAgICAgZXhwcmVzc2lvbjogXCJ1c2VyLmVtYWlsXCJcbiAgICB9XG4gIH0pXSwgMSksIF92bS5fdihcIiBcIiksIF9jKCd2LWZsZXgnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwieHMxMlwiOiBcIlwiXG4gICAgfVxuICB9LCBbX2MoJ3YtdGV4dC1maWVsZCcsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJsYWJlbFwiOiBcIlBhc3N3b3JkXCIsXG4gICAgICBcImhpbnRcIjogXCJBdCBsZWFzdCA1IGNoYXJhY3RlcnNcIixcbiAgICAgIFwibWluXCI6IDUsXG4gICAgICBcImFwcGVuZC1pY29uXCI6IF92bS5lID8gJ3Zpc2liaWxpdHknIDogJ3Zpc2liaWxpdHlfb2ZmJyxcbiAgICAgIFwidHlwZVwiOiBfdm0uaXNQYXNzd29yZFZpc2libGUsXG4gICAgICBcImFwcGVuZC1pY29uLWNiXCI6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIChfdm0uZSA9ICFfdm0uZSk7IH0sXG4gICAgICBcInByZXBlbmQtaWNvblwiOiBcImxvY2tcIixcbiAgICAgIFwicmVxdWlyZWRcIjogXCJcIlxuICAgIH0sXG4gICAgbW9kZWw6IHtcbiAgICAgIHZhbHVlOiAoX3ZtLnVzZXIucGFzc3dvcmQpLFxuICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCQkdikge1xuICAgICAgICBfdm0udXNlci5wYXNzd29yZCA9ICQkdlxuICAgICAgfSxcbiAgICAgIGV4cHJlc3Npb246IFwidXNlci5wYXNzd29yZFwiXG4gICAgfVxuICB9KV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1mbGV4Jywge1xuICAgIGF0dHJzOiB7XG4gICAgICBcInhzMTJcIjogXCJcIlxuICAgIH1cbiAgfSwgW19jKCd2LWJ0bicsIHtcbiAgICBhdHRyczoge1xuICAgICAgXCJwcmltYXJ5XCI6IFwiXCIsXG4gICAgICBcImxhcmdlXCI6IFwiXCJcbiAgICB9XG4gIH0sIFtfdm0uX3YoXCJSZWdpc3RlclwiKV0pXSwgMSldLCAxKV0sIDEpLCBfdm0uX3YoXCIgXCIpLCBfYygndi1jYXJkLXRleHQnLCBbX3ZtLl92KFwiXFxuICAgICAgICBBbHJlYWR5IGhhdmUgYW4gYWNjb3VudD8gXCIpLCBfYygncm91dGVyLWxpbmsnLCB7XG4gICAgYXR0cnM6IHtcbiAgICAgIFwidG9cIjoge1xuICAgICAgICBuYW1lOiAnYXV0aC5sb2dpbidcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtfdm0uX3YoXCJMb2dpblwiKV0pXSwgMSldLCAxKVxufSxzdGF0aWNSZW5kZXJGbnM6IFtdfVxubW9kdWxlLmV4cG9ydHMucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICAgcmVxdWlyZShcInZ1ZS1ob3QtcmVsb2FkLWFwaVwiKS5yZXJlbmRlcihcImRhdGEtdi0xOGVjYmY4MVwiLCBtb2R1bGUuZXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtMThlY2JmODFcIixcImhhc1Njb3BlZFwiOnRydWV9IS4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3Jlc291cmNlcy9hc3NldHMvanMvcGFnZXMvYXV0aC9zY3JlZW5zL3JlZ2lzdGVyU2NyZWVuLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjk3XG4vLyBtb2R1bGUgY2h1bmtzID0gMSJdLCJzb3VyY2VSb290IjoiIn0=