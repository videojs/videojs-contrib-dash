'use strict';

// modified from https://github.com/es-shims/es6-shim
var keys = require('object-keys');
var canBeObject = function (obj) {
	return typeof obj !== 'undefined' && obj !== null;
};
var hasSymbols = typeof Symbol === 'function' && typeof Symbol() === 'symbol';
var defineProperties = require('define-properties');
var toObject = Object;
var push = Array.prototype.push;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

var assignShim = function assign(target, source1) {
	if (!canBeObject(target)) { throw new TypeError('target must be an object'); }
	var objTarget = toObject(target);
	var s, source, i, props, syms;
	for (s = 1; s < arguments.length; ++s) {
		source = toObject(arguments[s]);
		props = keys(source);
		if (hasSymbols && Object.getOwnPropertySymbols) {
			syms = Object.getOwnPropertySymbols(source);
			for (i = 0; i < syms.length; ++i) {
				if (propIsEnumerable.call(source, syms[i])) {
					push.call(props, syms[i]);
				}
			}
		}
		for (i = 0; i < props.length; ++i) {
			objTarget[props[i]] = source[props[i]];
		}
	}
	return objTarget;
};

defineProperties(assignShim, {
	shim: function shimObjectAssign() {
		var assignHasPendingExceptions = function () {
			if (!Object.assign || !Object.preventExtensions) {
				return false;
			}
			// Firefox 37 still has "pending exception" logic in its Object.assign implementation,
			// which is 72% slower than our shim, and Firefox 40's native implementation.
			var thrower = Object.preventExtensions({ 1: 2 });
			try {
				Object.assign(thrower, 'xy');
			} catch (e) {
				return thrower[1] === 'y';
			}
		};
		defineProperties(
			Object,
			{ assign: assignShim },
			{ assign: assignHasPendingExceptions }
		);
		return Object.assign || assignShim;
	}
});

module.exports = assignShim;
