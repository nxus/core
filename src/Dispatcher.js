/*
* @Author: Mike Reich
* @Date:   2015-11-06 07:44:02
* @Last Modified 2016-08-22
*/

'use strict';

import Promise from 'bluebird'
import { EventEmitter } from 'events'
import _ from 'underscore'

/**
 * The core Dispatcher class, which implements promisified
 *
 * @extends EventEmitter
 * @example
 * import { Dispatcher } from 'nxus-core'
 * class MyClass extends Dispatcher {
 *   ...
 * }
 */

export default class Dispatcher extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(1000)
  }

  /**
   * Bind to an event once
   * @param  {string} event The name of the event to bind to
   * @param  {callable} [listener] The handler for the event
   * @return {Promise}       Returns a promise that resolves when the event fires
   */
  once (event, listener) {
    if (listener === undefined) {
      listener = () => {};
    }

    return new Promise((resolve, reject) => {
      var fired = false;

      var g = (...args) => {
        this.removeListener(event, g);
        if (!fired) {
          fired = true;
          var result = listener.apply(this, args);
          resolve(result);
          return result;
        }
      }
      this.on.apply(this, [event, g]);
    })
  }

  /**
   * Bind to before an event. Receives the event arguments, should return
   *  modified arguments or nothing.
   * @param  {string} event The name of the event to bind to
   * @param  {callable} listener The before handler for the event
   */
  before (event, listener) {
    return this.on(event+".before", listener);
  }

  /**
   * Bind to after an event. Receives the event handlers results, should return
   *  modified results or nothing.
   * @param  {string} event The name of the event to bind to
   * @param  {callable} listener The after handler for the event
   */
  after (event, listener) {
    return this.on(event+".after", listener);
  }

  /**
   * Bind once to before an event. Receives the event arguments, should return
   *  modified arguments or nothing.
   * @param  {string} event The name of the event to bind to
   * @param  {callable} listener The before handler for the event
   * @return {Promise}       Returns a promise that resolves when the event fires
   */
  onceBefore (event, listener) {
    return this.once(event+".before", listener);
  }

  /**
   * Bind once to after an event. Receives the event handlers results, should return
   *  modified results or nothing.
   * @param  {string} event The name of the event to bind to
   * @param  {callable} listener The after handler for the event
   * @return {Promise}       Returns a promise that resolves when the event fires
   */
  onceAfter (event, listener) {
    return this.once(event+".after", listener);
  }

  /**
   * Emits an event, calling all registered handlers.
   * @param  {string} event The name of the event to emit.
   * @param  {...*}   args  Arguments to the event handlers
   * @return {Promise}       Returns a promise that resolves when all handlers have completed, with any returned results as an array.
   */
  emit (event, ...args) {

    let waterfaller = (newArgs) => {
      return (prev, curr) => {
        // Need to resolve internally so that we can allow observing-only handlers
        //  that don't return anything, even from their promise.
        return Promise.resolve(curr(prev, newArgs)).then((_args) => { return _args || prev });
      }
    }

    return Promise.reduce(super.listeners(event+".before"), waterfaller(), args)
      .then((newArgs) => {
        let handlers = super.listeners(event)
        let p
        if (handlers.length == 0) {
          p = Promise.resolve(newArgs)
        } else  {
          p = Promise.all(handlers.map((handler) => {
            let ret = handler(...newArgs)
            return Promise.resolve(ret)
          }))
        }
        return p.then((results) => {
          return [results, newArgs]
        })
      })
      .spread((results, newArgs) => {
        results = this._squashMultipleListenerArrayResults(results)
        // Promise.reduce will not call afters if results is undefined, so pass [] as sentinel
        return Promise.reduce(super.listeners(event+".after"), waterfaller(newArgs), results || []).then((r) => {
          if(_.isArray(r) && r.length < 1) {
            // undefined and untouched by afters, return original
            return results
          }
          return r
        })
      })
  }

  _squashMultipleListenerArrayResults(results) {
    if(_.isArray(results)) {
      results = results.filter(x => x !== undefined)
      if(results.length < 1) return undefined
      else if (results.length == 1) return results[0]
    }
    return results
  }
}
