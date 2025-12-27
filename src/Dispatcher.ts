import {EventEmitter} from 'node:events'

import _ from 'underscore'

import {pReduce} from './promiseUtils'

type BeforeListener = (args: any[], originalArgs?: any[]) => any[] | void | Promise<any[] | void>
type AfterListener = (results: any, args?: any[]) => any | void | Promise<any | void>

/**
 * The core Dispatcher class, which implements promisified event dispatch with
 * `before` and `after` hooks.
 *
 * @extends EventEmitter
 * @example
 * import { Dispatcher } from 'nxus-core'
 * class MyClass extends Dispatcher {
 *   ...
 * }
 */
// Note: we intentionally override EventEmitter's `emit` and `once` to return Promises
// for Nxus semantics. We extend a widened type to avoid TS signature conflicts.
export default class Dispatcher extends (EventEmitter as any) {
  constructor() {
    super()
    this.setMaxListeners(1000)
  }

  /**
   * Bind to an event once
   * @param  {string} event The name of the event to bind to
   * @param  {callable} [listener] The handler for the event
   * @return {Promise} Returns a promise that resolves when the event fires
   */
  once(event: string, listener?: (...args: any[]) => any): Promise<any> {
    if (listener === undefined) {
      listener = () => {}
    }

    return new Promise((resolve) => {
      let fired = false
      const g = (...args: any[]) => {
        this.removeListener(event, g)
        if (!fired) {
          fired = true
          const result = listener?.apply(this, args)
          resolve(result)
          return result
        }
      }
      this.on(event, g)
    })
  }

  /**
   * Bind to before an event. Receives the event arguments, should return
   * modified arguments or nothing.
   */
  before(event: string, listener: BeforeListener) {
    return this.on(`${event}.before`, listener)
  }

  /**
   * Bind to after an event. Receives the event handlers results, should return
   * modified results or nothing.
   */
  after(event: string, listener: AfterListener) {
    return this.on(`${event}.after`, listener)
  }

  /**
   * Bind once to before an event. Receives the event arguments, should return
   * modified arguments or nothing.
   */
  onceBefore(event: string, listener?: BeforeListener) {
    return this.once(`${event}.before`, listener as any)
  }

  /**
   * Bind once to after an event. Receives the event handlers results, should return
   * modified results or nothing.
   */
  onceAfter(event: string, listener?: AfterListener) {
    return this.once(`${event}.after`, listener as any)
  }

  /**
   * Emits an event, calling all registered handlers, plus `.before` and `.after` hooks.
   *
   * Returns a promise that resolves when all handlers have completed.
   */
  emit(event: string, ...args: any[]): Promise<any> {
    const beforeListeners = super.listeners(`${event}.before`) as unknown as BeforeListener[]
    const afterListeners = super.listeners(`${event}.after`) as unknown as AfterListener[]

    return (async () => {
      const newArgs = await pReduce<any[], BeforeListener>(
        beforeListeners,
        async (prevArgs, curr) => {
          // allow observing-only handlers that don't return anything
          const maybeArgs = await Promise.resolve(curr(prevArgs))
          return maybeArgs || prevArgs
        },
        args
      )

      const handlers = super.listeners(event) as unknown as ((...a: any[]) => any)[]

      let results: any
      if (handlers.length === 0) {
        results = newArgs
      } else {
        const raw = await Promise.all(
          handlers.map((handler) => Promise.resolve(handler(...newArgs)))
        )
        results = raw
      }

      results = this._squashMultipleListenerArrayResults(results)

      // ensure afters run even when results is undefined by using [] sentinel
      const afterStart = results ?? []
      const afterResult = await pReduce<any, AfterListener>(
        afterListeners,
        async (prev, curr) => {
          const maybe = await Promise.resolve(curr(prev, newArgs))
          return maybe === undefined ? prev : maybe
        },
        afterStart
      )

      if (_.isArray(afterResult) && afterResult.length < 1) {
        // undefined and untouched by afters, return original
        return results
      }
      return afterResult
    })()
  }

  protected _squashMultipleListenerArrayResults(results: any) {
    if (_.isArray(results)) {
      results = results.filter((x: any) => x !== undefined)
      if (results.length < 1) return undefined
      if (results.length === 1) return results[0]
    }
    return results
  }
}


