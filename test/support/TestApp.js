'use strict';

const _ = require('underscore')
const sinon = require('sinon')

const {Dispatcher, ModuleProxy, ProxyMethods} = require('../..')

const stubPromise = Promise.resolve()

class TestApp extends Dispatcher {
  constructor(opts = {}) {
    super()

    this.log = sinon.spy();
    this.log.debug = sinon.spy();
    this.log.info = sinon.spy();
    this.log.warn = sinon.spy();
    this.log.error = sinon.spy();
    this.config = opts;

    this.on = sinon.spy(this.on);
    this.once = sinon.spy(this.once);
    this.before = sinon.spy(this.before);
    this.after = sinon.spy(this.after);
    this.onceBefore = sinon.spy(this.onceBefore);
    this.onceAfter = sinon.spy(this.onceAfter);

    this.testMethod = sinon.spy(this.onceAfter);

    this._request = sinon.stub().returns(stubPromise)
    this._provide = sinon.stub().returns(stubPromise)
    this._replace = sinon.stub().returns(stubPromise)
    this._default = sinon.stub().returns(stubPromise)

    this._get_on = sinon.spy();
    this._get_emit = sinon.spy(function(event, ...args) {return Promise.resolve(...args)})
    this._get_once = sinon.spy();
    this._get_gather = sinon.stub().returnsThis();
    this._get_respond = sinon.stub().returnsThis();
    this._get_default = sinon.stub().returnsThis();
    this._get_replace = sinon.stub().returnsThis();

    let handler = function(next) {
      return function(name, h) {
        if (h == undefined) {
          throw "Handler does not exist for "+name
        }
        return next(name, h)
      }
    }
    this._get = {
      gather: this._get_gather,
      respond: this._get_respond,
      on: sinon.stub().returns(this._get_on),
      emit: this._get_emit,
      once: sinon.stub().returns(this._get_once),
      request: this._request,
      provide: this._replace,
      provideAfter: this._replace,
      provideBefore: this._default,
      default: this._default,
      replace: this._replace,
      use: (i) => {
        let m = new ModuleProxy(this, i)
        let useme = _.extend(_.clone(this._get), {gather: handler(this._get_gather), respond: handler(this._get_respond), emit: () => {}})
        return m.use.call(useme, i)
      }
    }
    this.get = sinon.stub().returns(ProxyMethods(() => {return this._get})());
    this._request.withArgs().returns(this.get())
    this._provide.withArgs().returns(this.get())
    this._default.withArgs().returns(this.get())
    this._replace.withArgs().returns(this.get())

  }

  setUserConfig(key, value) {
    if(typeof this.config[key] == 'undefined') this.config[key] = value
  }

  launch() {
    return (async () => {
      for (let e of ['init', 'load', 'startup', 'launch']) {
        await this.emit(e)
      }
    })()
  }

}

module.exports = TestApp
