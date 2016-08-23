/* 
* @Author: Mike Reich
* @Date:   2015-11-22 13:06:39
* @Last Modified 2016-08-22
*/

'use strict';

import _ from 'underscore'

import Dispatcher from './Dispatcher'

import ProxyMethods from './ProxyMethods'

/**
 * The core ModuleProxy class. This provides a messaging proxy layer between modules and calling code.
 * The main advantage of this proxy class is that missing modules won't cause exceptions in the code.
 *
 * Modules are accessed through the Application.get() method
 *
 * ## Examples
 * 
 * Producer modules should register themselves with the use() method, and define gather() and respond() handlers:
 * 
 *     app.get('router').use(this).gather('route')
 *     app.get('templater').use(this).respond('template')
 *
 * Consumer modules should get the module they need to use and call provide or request
 * 
 *     app.get('router').provide('route', ...)
 *     app.get('templater').request('render', ...)
 *
 * Modules proxy event names as methods to provide/request, so these are synomymous with above: 
 * 
 *     app.get('router').route(...)
 *     app.get('templater').render(...)
 * 
 * Default implementations should be indicated by using default() to occur before provide()
 * Overriding another implementation can use replace() to occur after provide()
 * 
 *     app.get('router').default('route', GET', '/', ...)
 *     app.get('router').replace('route', GET', '/', ...)
 *
 * Provide, default, and replace all return a proxy object if called with no arguments, so these are synonymous with above:
 * 
 *     app.get('router').default().route('GET', '/', ...)
 *     app.get('router').replace().route('GET', '/', ...)
 *
 */
class ModuleProxy extends Dispatcher {

  constructor(app, name) {
    super()
    this._app = app;
    this._name = name;
    this.loaded = false
    app.on('stop', this.removeAllListeners.bind(this));
    app.on('load.before', () => {
      this.loaded = true
    })
    this._requestedEvents = {}
    this._registeredEvents = {}
    app.after('launch', this._checkMissingEvents.bind(this))
  }

  /**
   * Let another instance use this module's events to reduce boilerplate calls
   * @ params {object} instance The instance to copy methods to
   */

  use(instance) {
    let names = ['emit', 'provide', 'request', 'provideBefore', 'provideAfter', 'default', 'replace']
    let handler_names = ['on', 'once', 'gather', 'respond', 'before', 'after', 'onceBefore', 'onceAfter']
    for (let name of names) {
      if (this[name] === undefined) continue
      instance[name] = this[name].bind(this)
    }
    for (let name of handler_names) {
      if (this[name] === undefined) continue
      instance[name] = (event, handler) => {
        if (handler === undefined) {
          handler = instance[event].bind(instance)
        }
        this[name](event, handler)
        return instance
      }
    }
    return instance
  }

  _checkMissingEvents() {
    let registered = _.keys(this._registeredEvents)
    if (registered.length == 0) {
      this._app.log.warn("Application.get called with", this._name, "but only knows of:", _.keys(this._app.registeredModules).join(' '))
      return
    }
    
    let diff = _.difference(_.keys(this._requestedEvents), registered)
    if (diff.length) {
      this._app.log.warn("Module", this._name, "called with events:", diff.join(' '), "but only knows of:", registered.join(' '))
    }
  }

  _provide(myself, when, name, ...args) {
    if (name === undefined) {
      return ProxyMethods(() => { return this.__proxyLess }, myself)()
    }
    this._requestedEvents[name] = true
    if(!this.loaded) {
      return this._app[when]('load').then(() => {
        return this.emit(name, ...args);
      });
    } else {
      return this.emit(name, ...args);
    }
  }

  /**
   * Provide default arguments to a delayed gather() call, before other provides
   *  
   * @param  {string} name The name of the gather event
   * @param  {...*}   args Arguments to provide to the gather event
   * @return {Promise} Resolves when the event is eventually handled
   */  
  default(name, ...args) {
    return this._provide('default', 'onceBefore', name, ...args)
  }

  provideBefore(name, ...args) {
    return this.default(name, ...args)
  }
  

  /**
   * Provide arguments to a delayed gather() call.
   *  
   * @param  {string} name The name of the gather event
   * @param  {...*}   args Arguments to provide to the gather event
   * @return {Promise} Resolves when the event is eventually handled
   */  
  provide(name, ...args) {
    return this._provide('provide', 'once', name, ...args)
  }

    /**
   * Provide a replacement for a delayed gather() call (after others are provided)
   *  
   * @param  {string} name The name of the gather event
   * @param  {...*}   args Arguments to provide to the gather event
   * @return {Promise} Resolves when the event is eventually handled
   */  
  replace(name, ...args) {
    return this._provide('replace', 'onceAfter', name, ...args)
  }

  provideAfter(name, ...args) {
    return this.replace(name, ...args)
  }
  
  
  /**
   * Receive arguments provided to a delayed gather() call.
   *  
   * @param  {string}   name The name of the gather event
   * @param  {callable} handler The handler for each provided value
   */  
  gather(name, handler) {
    if (_.isEmpty(this._registeredEvents)) {
      this._app.emit('registeredModule', this._name)
    }
    this._registeredEvents[name] = true
    this.on(name, handler);
    return this;
  }

  /**
   * Request the result of processing a named event
   *  
   * @param  {string}   name The name of the request event
   * @param  {...*}   args Arguments to provide to the responder
   * @return {Promise} Resolves to the result of the event's handler
   */  
  request(name, ...args) {
    return this.provide(name, ...args);
  }

  /**
   * Respond to a named event
   *  
   * @param  {string}   name The name of the request event
   * @param  {callable} handler The handler for the request
   */  
  respond(name, handler) {
    return this.gather(name, handler);
  }
}

export default ProxyMethods((...args) => {return new ModuleProxy(...args)})