import _ from 'underscore'

import Dispatcher from './Dispatcher'
import ProxyMethods from './ProxyMethods'

/**
 * The core ModuleProxy class. This provides a messaging proxy layer between modules and calling code.
 * The main advantage of this proxy class is that missing modules won't cause exceptions in the code.
 *
 * Modules are accessed through the Application.get() method
 *
 * Producer modules typically `gather`/`respond`, while consumer modules typically `provide`/`request`.
 *
 * In addition, events are available as proxy methods (via `ProxyMethods`), so `proxy.someEvent(...)`
 * is equivalent to `proxy.provide('someEvent', ...)`.
 */
class ModuleProxy extends Dispatcher {
  _app: any
  _name: string
  loaded: boolean
  _requestedEvents: Record<string, boolean>
  _registeredEvents: Record<string, boolean>
  _instance: any

  private _onStopBound: () => void
  private _beforeLoadBound: () => void

  constructor(app: any, name: string) {
    super()
    this._app = app
    this._name = name
    this.loaded = false

    this._requestedEvents = {}
    this._registeredEvents = {}
    this._instance = null

    this._onStopBound = this._onStop.bind(this)
    this._beforeLoadBound = this._beforeLoad.bind(this)

    app.on('stop', this._onStopBound)
    app.on('load.before', this._beforeLoadBound)
  }

  private _onStop() {
    this.removeAllListeners()
    this.loaded = false
  }

  private _beforeLoad() {
    this.loaded = true
  }

  deregister() {
    this._app.removeListener('stop', this._onStopBound)
    this._app.removeListener('load.before', this._beforeLoadBound)
  }

  /**
   * Let another instance use this module's events to reduce boilerplate calls
   */
  use(instance: any) {
    if (!instance) return instance
    this._instance = instance

    const names = ['emit', 'provide', 'request', 'provideBefore', 'provideAfter', 'default', 'replace']
    const handlerNames = ['on', 'once', 'gather', 'respond', 'before', 'after', 'onceBefore', 'onceAfter']

    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
      .map((prop) =>
        instance[prop] instanceof Function && prop != 'constructor' && prop[0] != '_' ? prop : null
      )
      .filter((p) => p) as string[]

    for (const name of names) {
      if ((this as any)[name] === undefined) continue
      if (this._requestedEvents) this._requestedEvents[name] = true
      instance[name] = (this as any)[name].bind(this)
    }

    for (const method of methods) {
      this.gather(method, instance[method].bind(instance))
    }

    for (const name of handlerNames) {
      if ((this as any)[name] === undefined) continue
      if (this._requestedEvents) this._requestedEvents[name] = true
      instance[name] = (event: string, handler?: (...args: any[]) => any) => {
        if (handler === undefined) {
          if (instance[event]?.bind === undefined) {
            this._app.log.error(
              'Module',
              this._name,
              'tried to register',
              event,
              'without a handler, and does not define a method with that name'
            )
          } else {
            handler = instance[event].bind(instance)
          }
        }
        ;(this as any)[name](event, handler)
        return instance
      }
    }

    return instance
  }

  protected _provide(myself: string, when: string, name?: string, ...args: any[]) {
    if (name === undefined) {
      return ProxyMethods(() => {
        return (this as any).__proxyLess
      }, myself as any)()
    }
    if (this._instance && !this._registeredEvents[name]) {
      throw new Error(`Requested event ${name} which doesn't exist on target ${this._name}`)
    }

    if (!this.loaded) {
      return this._app[when]('load', () => this.emit(name, ...args))
    }
    return this.emit(name, ...args)
  }

  /**
   * Provide default arguments to a delayed `gather()` call, before other `provide()` calls.
   *
   * If called with no args, returns a proxy object so event names can be used as methods:
   * `proxy.default().someEvent(...)`.
   */
  default(name: string, ...args: any[]) {
    return this._provide('default', 'onceBefore', name, ...args)
  }

  /**
   * Alias for {@link default}.
   */
  provideBefore(name: string, ...args: any[]) {
    return this.default(name, ...args)
  }

  /**
   * Provide arguments to a delayed `gather()` call.
   *
   * If called with no args, returns a proxy object so event names can be used as methods:
   * `proxy.provide().someEvent(...)`.
   */
  provide(name: string, ...args: any[]) {
    return this._provide('provide', 'once', name, ...args)
  }

  /**
   * Provide a replacement for a delayed `gather()` call (after others are provided).
   *
   * If called with no args, returns a proxy object so event names can be used as methods:
   * `proxy.replace().someEvent(...)`.
   */
  replace(name: string, ...args: any[]) {
    return this._provide('replace', 'onceAfter', name, ...args)
  }

  /**
   * Alias for {@link replace}.
   */
  provideAfter(name: string, ...args: any[]) {
    return this.replace(name, ...args)
  }

  /**
   * Receive arguments provided to a delayed `gather()` call.
   *
   * Each `provide()` call will invoke `handler` with the provided arguments.
   */
  gather(name: string, handler: (...args: any[]) => any) {
    if (_.isEmpty(this._registeredEvents)) {
      this._app.emit('registeredModule', this._name)
    }
    this.on(name, handler)
    this._registeredEvents[name] = true
    return this
  }

  /**
   * Request the result of processing a named event.
   *
   * This is an alias for {@link provide}.
   */
  request(name: string, ...args: any[]) {
    return this.provide(name, ...args)
  }

  /**
   * Respond to a named event.
   *
   * This is an alias for {@link gather}.
   */
  respond(name: string, handler: (...args: any[]) => any) {
    return this.gather(name, handler)
  }
}

export default ProxyMethods((app: any, name: string) => new ModuleProxy(app, name))


