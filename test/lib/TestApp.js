'use strict';

var TestApp = require('../support/TestApp');

describe("TestApp", () => {
  var app = new TestApp();
  
  it("Get", () => {
    app.get('module')
    app.get.calledWith('module').should.be.true()
  });

  it("Provide", () => {
    var ret = app.get('module').provide('event', 'val')
    app.get('module').provide.calledWith('event', 'val').should.be.true()
    ret.then.should.be.Function();
  });

  it("Use", () => {
    app.get('module').use({'event': () => {}}).gather('event')
    app.get('module').gather.calledWith('event').should.be.true()
  });

  it("Default and Replace", () => {
    app.get('module').default().something('here')
    app.get().provide.calledWith('something').should.be.true()
    app.get('module').replace().something('here')
    app.get().provide.calledWith('something').should.be.true()
  });
  
})
