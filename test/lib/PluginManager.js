/* 
* @Author: Mike Reich
* @Date:   2015-07-16 08:47:51
* @Last Modified 2016-05-20
*/

'use strict';

const {PluginManager} = require('../..')

describe("PluginManager", () => {
  describe("Load", () => {
    var instance;

    it("should not be null", () => PluginManager.should.not.be.null)

    it("should be instantiated", () => {
      const app = {
        log: {debug: () => {}, warn: () => {}, error: () => {}}
      }
      instance = new PluginManager(app, {namespace: 'nxus'})
      instance.should.not.be.null
    })
  })

})
