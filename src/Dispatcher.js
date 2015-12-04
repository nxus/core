/* 
* @Author: Mike Reich
* @Date:   2015-11-06 07:44:02
* @Last Modified 2015-12-04
*/

'use strict';

import { EventEmitter } from 'events'

/**
 * The core Dispatcher class, which implements promisified 
 * 
 * @extends EventEmitter
 * @example
 * import { Dispatcher } from '@nxus/core'
 * class MyClass extends Dispatcher {
 *   ...
 * }
 */

export default class Dispatcher extends EventEmitter {
  constructor() {
    super()
    this._awaits = []
  }

  /**
   * Ensures `event` doesn't fire until the passed promise returns
   * @param  {string} event   the name of the event to hold on
   * @param  {Promise} promise the Promise to await resolution
   */
  await (event, promise) {
    if(!this._awaits[event]) this._awaits[event] = []
    this._awaits[event].push(Promise.resolve(promise)); 
  }

  /**
   * Bind to an event
   * @param  {string} event The name of the event to bind to
   * @return {Promise}       Returns a promise that resolves when the event fires
   */
  on (event) {
    let superOn = super.on
    return new Promise((resolve, reject) => {
      superOn.apply(this, [event, resolve])
    })
  }

  /**
   * Emits an event, calling all registered handlers.
   * @param  {string} event The name of the event to emit.
   * @return {Promise}       Returns a promise that resolves when all handlers and awaiting promises have completed.
   */
  emit (event) {
    var cb = (...args) => {

      let _handlers = [].concat(super.listeners(event+".before")).concat(super.listeners(event)).concat(super.listeners(event+".after"));
      let _awaits = [].concat(this._awaits[event+".before"]).concat(this._awaits[event]).concat(this._awaits[event+".after"]);

      return Promise.all(_handlers.map((handler) => {
        let ret = handler(...args)
        return Promise.resolve(ret)
      }).concat(_awaits));
    }

    return {
      with: cb
    }
  }
} 
