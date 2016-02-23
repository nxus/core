'use strict';

var TestApp = require('../support/TestApp');

describe("TestApp", () => {
  var app = new TestApp();
  
  it("Get", () => {
    app.get('module')
    app.get.calledWith('module').should.be.true
  });

  it("Provide", () => {
    var ret = app.get('module').provide('event', 'val')
    app.get().provide.calledWith('event', 'val').should.be.true
    ret.then.should.be.Function();
  });

  it("Use", () => {
    app.get('module').use({'event': () => {}}).gather('event')
    app.get().gather.calledWith('module').should.be.true
  });
  
})
