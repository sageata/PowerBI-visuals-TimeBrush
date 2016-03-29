(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("_"), require("d3"), require("jQuery"));
	else if(typeof define === 'function' && define.amd)
		define(["_", "d3", "jQuery"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("_"), require("d3"), require("jQuery")) : factory(root["_"], root["d3"], root["jQuery"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function(__WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_4__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var EventEmitter_1 = __webpack_require__(1);
	var $ = __webpack_require__(4);
	var _ = __webpack_require__(2);
	var d3 = __webpack_require__(3);
	var DEBOUNCE_TIME = 1000;
	var TICK_WIDTH = 100;
	/**
	* Represents a timebrush
	*/
	/* @Mixin(EventEmitter)*/
	var TimeBrush = (function () {
	    /**
	     * Constructor for the timebrush
	     */
	    function TimeBrush(element, dimensions) {
	        this._dimensions = { width: 500, height: 500 };
	        this._eventEmitter = new EventEmitter_1.default();
	        this.element = element;
	        this.element.hide();
	        this.x = d3.time.scale();
	        this.y = d3.scale.linear();
	        this.buildTimeScale();
	        if (!this.dimensions) {
	            this.resizeElements();
	        }
	        else {
	            this.dimensions = dimensions;
	        }
	    }
	    Object.defineProperty(TimeBrush.prototype, "data", {
	        /**
	         * Returns the data contained in this timebrush
	         */
	        get: function () {
	            return this._data;
	        },
	        /**
	         * Setter for the data
	         */
	        set: function (data) {
	            this._data = data || [];
	            this.selectedRange = undefined;
	            // Hide/show based on the data
	            this.element.toggle(this._data.length > 0);
	            this.x.domain(d3.extent(this._data.map(function (d) { return d.date; })));
	            this.y.domain([0, d3.max(this._data.map(function (d) { return +d.value; }))]);
	            this.resizeElements();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(TimeBrush.prototype, "events", {
	        /**
	         * Gets an event emitter by which events can be listened to
	         * Note: Would be nice if we could mixin EventEmitter
	         */
	        get: function () {
	            return this._eventEmitter;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(TimeBrush.prototype, "dimensions", {
	        /**
	         * Gets the dimensions of this timebrush
	         */
	        get: function () {
	            return this._dimensions;
	        },
	        /**
	         * Sets the dimensions of this timebrush
	         */
	        set: function (value) {
	            $.extend(this._dimensions, value);
	            this.dimensions.height = Math.max(50, this.dimensions.height);
	            this.dimensions.width = Math.max(50, this.dimensions.width);
	            this.resizeElements();
	            if (this._range) {
	                this.brush.extent(this._range);
	                this.brush(d3.select(this.element.find(".brush")[0]));
	            }
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(TimeBrush.prototype, "selectedRange", {
	        /**
	         * Sets the currently selected range of dates
	         */
	        set: function (range) {
	            function selectedRangeChanged() {
	                var _this = this;
	                // One is set, other is unset
	                if ((!range || !this._range) && (range || this._range)) {
	                    return true;
	                }
	                if (range && this._range) {
	                    // Length of Array Changed
	                    if (range.length !== this._range.length) {
	                        return true;
	                    }
	                    else {
	                        // Check each date
	                        return range.some(function (v, i) {
	                            return v.getTime() !== _this._range[i].getTime();
	                        });
	                    }
	                }
	                return false;
	            }
	            function redrawRange() {
	                if (range && range.length === 2) {
	                    this.brush.extent(range);
	                }
	                else {
	                    this.brush.clear();
	                }
	                this.brush(d3.select(this.element.find(".brush")[0]));
	            }
	            if (selectedRangeChanged.bind(this)()) {
	                this._range = range;
	                redrawRange.bind(this)();
	            }
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Builds the initial timescale
	     */
	    TimeBrush.prototype.buildTimeScale = function () {
	        var _this = this;
	        this.svg = d3.select(this.element[0]).append("svg");
	        this.clip = this.svg.append("defs").append("clipPath")
	            .attr("id", "clip")
	            .append("rect");
	        this.context = this.svg.append("g")
	            .attr("class", "context");
	        this.bars = this.context.append("g")
	            .attr("class", "bars");
	        this.xAxis = this.context.append("g")
	            .attr("class", "x axis");
	        var brushed = _.debounce(function () {
	            var dateRange = _this.brush.empty() ? [] : _this.brush.extent();
	            var items = [];
	            if (dateRange && dateRange.length) {
	                var lowerItem_1;
	                var upperItem_1;
	                _this.data.forEach(function (item) {
	                    if (!lowerItem_1) {
	                        lowerItem_1 = item;
	                    }
	                    if (!upperItem_1) {
	                        upperItem_1 = item;
	                    }
	                    if (Math.abs(dateRange[0].getTime() - item.date.getTime()) <
	                        Math.abs(dateRange[0].getTime() - lowerItem_1.date.getTime())) {
	                        lowerItem_1 = item;
	                    }
	                    if (Math.abs(dateRange[1].getTime() - item.date.getTime()) <
	                        Math.abs(dateRange[1].getTime() - upperItem_1.date.getTime())) {
	                        upperItem_1 = item;
	                    }
	                });
	                items = [lowerItem_1, upperItem_1];
	            }
	            _this._range = dateRange;
	            _this.events.raiseEvent("rangeSelected", dateRange, items);
	        }, DEBOUNCE_TIME);
	        this.brush = d3.svg.brush().on("brush", brushed);
	    };
	    /**
	     * Resizes all the elements in the graph
	     */
	    TimeBrush.prototype.resizeElements = function () {
	        var _this = this;
	        var margin = { top: 0, right: 10, bottom: 20, left: 10 }, width = this._dimensions.width - margin.left - margin.right, height = this._dimensions.height - margin.top - margin.bottom;
	        this.x.range([0, width]);
	        this.y.range([height, 0]);
	        if (this.bars && this._data) {
	            var tmp = this.bars
	                .selectAll("rect")
	                .data(this._data);
	            tmp
	                .enter().append("rect");
	            tmp
	                .attr("transform", function (d, i) {
	                var rectHeight = _this.y(0) - _this.y(d.value);
	                var x = _this.x(d.date) || 0;
	                return "translate(" + x + "," + (height - rectHeight) + ")";
	            })
	                .attr("width", 2)
	                .attr("height", function (d) { return Math.max(0, _this.y(0) - _this.y(d.value)); });
	            tmp.exit().remove();
	        }
	        this.svg
	            .attr("width", width + margin.left + margin.right)
	            .attr("height", height + margin.top + margin.bottom);
	        this.clip
	            .attr("width", width)
	            .attr("height", height);
	        this.xAxis
	            .attr("transform", "translate(0," + height + ")")
	            .call(d3.svg.axis().scale(this.x).orient("bottom").ticks(this.dimensions.width / TICK_WIDTH));
	        this.context
	            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	        this.brush.x(this.x);
	        // Need to recreate the brush element for some reason
	        d3.selectAll(this.element.find(".x.brush").toArray()).remove();
	        this.brushEle = this.context.append("g")
	            .attr("class", "x brush")
	            .call(this.brush)
	            .selectAll("rect")
	            .attr("height", height + 7)
	            .attr("y", -6);
	        this.brushGrip = d3.select(this.element.find(".x.brush")[0])
	            .selectAll(".resize").append("rect")
	            .attr('x', -3)
	            .attr('rx', 2)
	            .attr('ry', 2)
	            .attr("y", (height / 2) - 15)
	            .attr("width", 6)
	            .attr("fill", "lightgray")
	            .attr("height", 30);
	    };
	    return TimeBrush;
	}());
	exports.TimeBrush = TimeBrush;


/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";
	/**
	 * A mixin that adds support for event emitting
	 */
	var EventEmitter = (function () {
	    function EventEmitter() {
	        this.listeners = {};
	    }
	    /**
	     * Adds an event listener for the given event
	     */
	    EventEmitter.prototype.on = function (name, handler) {
	        var _this = this;
	        var listeners = this.listeners[name] = this.listeners[name] || [];
	        listeners.push(handler);
	        return {
	            destroy: function () {
	                _this.off(name, handler);
	            }
	        };
	    };
	    /**
	     * Removes an event listener for the given event
	     */
	    EventEmitter.prototype.off = function (name, handler) {
	        var listeners = this.listeners[name];
	        if (listeners) {
	            var idx = listeners.indexOf(handler);
	            if (idx >= 0) {
	                listeners.splice(idx, 1);
	            }
	        }
	    };
	    /**
	     * Raises the given event
	     */
	    /*protected*/ EventEmitter.prototype.raiseEvent = function (name) {
	        var _this = this;
	        var args = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            args[_i - 1] = arguments[_i];
	        }
	        var listeners = this.listeners[name];
	        if (listeners) {
	            listeners.forEach(function (l) {
	                l.apply(_this, args);
	            });
	        }
	    };
	    return EventEmitter;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = EventEmitter;


/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_3__;

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_4__;

/***/ }
/******/ ])
});
;