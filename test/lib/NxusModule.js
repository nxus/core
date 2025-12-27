/* 
* @Author: Mike Reich
* @Date:   2015-07-16 08:47:51
* @Last Modified 2016-09-06
*/

'use strict';

const {NxusModule, application} = require('../..')

class SubModule extends NxusModule {

  _defaultConfig() {
    return {"other": "you"}
  }

  _userConfig() {
    return {user: 'config'}
  }

  test(done) {
    if(cb) done()
  }
}
SubModule.subModule = SubModule.getProxy()

describe("NxusModule", () => {
  var instance;

  beforeEach(() => {
    instance = new SubModule(application)
  })

  describe("Load", () => {
    it("should not be null", () => NxusModule.should.not.be.null)

    it("should be subclassable", () => {
      instance.should.not.be.null
    })

    it("should set itself in app modules with the config name (dashed)", () => {
      application._moduleProxies.should.have.property('sub-module')
    })

    it("should set defaultConfig", () => {
      instance.config.should.not.be.null()
      instance.config.should.have.property("other", "you")
    })

    it("should set the userConfig value", () => {
      instance.config.user.should.not.be.null()
      application._userConfig.should.have.property('sub_module')
    })

    it("should get config from app key", () => {
      delete instance.config
      application.config['sub_module'] = {"hi": "hello"}
      instance.config.hi.should.equal("hello")
    })
  })

  describe("Config", () => {
    it("should be settable", () => {
      instance.config.key = 'value'
      instance.config.key.should.equal('value')
    })
  })

  describe("Logging", () => {
    it("should have a logger instance", () => {
      instance.log.should.not.be.null
    })
  })

  describe("_dirName", () => {
    it("should be this directory", () => {
      instance._dirName.includes("test/lib").should.equal(true)
    })
  })

})
