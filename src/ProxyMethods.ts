/**
 * Wraps a module proxy instance in a JS Proxy so unknown properties become methods
 * that forward to the proxy's `provide`/`request` layer.
 *
 * @private
 */
export default function ProxyMethods<T extends object>(
  constructor: (...args: any[]) => T,
  proxyTo: keyof T & string = 'provide' as any
) {
  return function (...args: any[]) {
    const module = constructor(...args)
    const handlers: ProxyHandler<T> = {
      get(target, property) {
        const prop = property as keyof T
        const existing = (target as any)[prop]
        if (existing !== undefined) {
          return existing
        }
        return (...innerArgs: any[]) => {
          return (target as any)[proxyTo](property, ...innerArgs)
        }
      },
    }
    const prox = new Proxy(module, handlers)
    ;(module as any).__proxyLess = module
    return prox
  }
}



