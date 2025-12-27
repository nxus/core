/*
* Watcher tests
*/

'use strict';

const {EventEmitter} = require('node:events')
const {performance} = require('node:perf_hooks')

const sinon = require('sinon')

const Watcher = require('../../dist/cjs/Watcher').default
const chokidar = require('chokidar')
const chokidarImpl = chokidar.default || chokidar

const {Dispatcher} = require('../..')

describe('Watcher', () => {
  let watchEmitter
  let watchStub
  let nowStub
  let watcher

  beforeEach(() => {
    watchEmitter = new EventEmitter()
    watchEmitter.close = sinon.spy()
    watchStub = sinon.stub(chokidarImpl, 'watch').returns(watchEmitter)
  })

  afterEach(() => {
    if (nowStub) nowStub.restore()
    nowStub = null
    if (watcher) watcher.close()
    watcher = null
    watchStub.restore()
  })

  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(label || 'timed out')), ms)),
    ])
  }

  it('wires chokidar "all" events to app.log.info and emits watchEvent', () => {
    class App extends Dispatcher {
      constructor() {
        super()
        this.log = {info: sinon.spy()}
      }
    }

    const app = new App()

    const eventPromise = app.once('custom.event', (p) => p)
    watcher = new Watcher(app, '/tmp', 'custom.event', [])

    watchStub.calledOnce.should.be.true()
    watcher.watch.should.equal(watchEmitter)
    watchEmitter.emit('all', 'add', '/tmp/file.js')

    return withTimeout(eventPromise, 500, 'custom.event did not fire').then((p) => {
      p.should.equal('/tmp/file.js')
      app.log.info.calledOnce.should.be.true()
      app.log.info.getCall(0).args[0].should.equal('custom.event')
      app.log.info.getCall(0).args[1].should.equal('/tmp/file.js')
    })
  })

  it('on change, restarts only when app is at final boot stage and then emits app.run.tests', () => {
    class App extends Dispatcher {
      constructor() {
        super()
        this.log = {info: sinon.spy()}
        this._bootEvents = ['init', 'load', 'startup', 'launch']
        this._currentStage = 'launch'
        this.restart = sinon.stub().returns(Promise.resolve())
      }
    }

    const app = new App()
    const testsPromise = app.once('app.run.tests', (p) => p)

    nowStub = sinon.stub(performance, 'now')
    nowStub.onCall(0).returns(1000)
    nowStub.onCall(1).returns(2500)

    watcher = new Watcher(app, '/tmp', 'change', [])

    watcher.watch.should.equal(watchEmitter)
    watchEmitter.emit('all', 'change', '/tmp/file.js')

    return withTimeout(testsPromise, 500, 'app.run.tests did not fire').then((p) => {
      p.should.equal('/tmp/file.js')
      app.restart.calledOnce.should.be.true()
      app.log.info.calledWithMatch(/Restart took \d+ seconds/).should.be.true()
    })
  })

  it('close() closes the underlying chokidar watcher', () => {
    class App extends Dispatcher {
      constructor() {
        super()
        this.log = {info: sinon.spy()}
      }
    }
    const app = new App()
    watcher = new Watcher(app, '/tmp', 'custom.event', [])
    watcher.close()
    watcher.watch.should.equal(watchEmitter)
    watchEmitter.close.calledOnce.should.be.true()
  })
})


