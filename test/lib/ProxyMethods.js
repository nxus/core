/*
* ProxyMethods tests
*/

'use strict';

const sinon = require('sinon')

const {ProxyMethods} = require('../..')

describe('ProxyMethods', () => {
  it('returns existing properties without proxying', () => {
    const module = {
      provide: sinon.spy(),
      existingMethod: sinon.spy(() => 'ok'),
    }

    const wrapped = ProxyMethods(() => module)
    const prox = wrapped()

    prox.existingMethod().should.equal('ok')
    module.existingMethod.calledOnce.should.be.true()
    module.provide.called.should.be.false()
  })

  it('proxies missing properties to provide(property, ...args)', () => {
    const module = {
      provide: sinon.spy(() => Promise.resolve('done')),
    }

    const wrapped = ProxyMethods(() => module)
    const prox = wrapped()

    return prox.someEvent(1, 2).then((result) => {
      result.should.equal('done')
      module.provide.calledWith('someEvent', 1, 2).should.be.true()
    })
  })

  it('can proxy to an alternate method (e.g. request)', () => {
    const module = {
      request: sinon.spy(() => 'requested'),
    }

    const wrapped = ProxyMethods(() => module, 'request')
    const prox = wrapped()

    prox.otherEvent('a').should.equal('requested')
    module.request.calledWith('otherEvent', 'a').should.be.true()
  })

  it('sets __proxyLess on the underlying module and exposes it through the proxy', () => {
    const module = {
      provide: sinon.spy(),
    }

    const wrapped = ProxyMethods(() => module)
    const prox = wrapped()

    prox.__proxyLess.should.equal(module)
  })
})


