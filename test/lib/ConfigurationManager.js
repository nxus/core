/* 
* @Author: Mike Reich
* @Date:   2015-07-16 07:51:45
* @Last Modified 2015-07-16
*/

'use strict';

var ConfigurationManager = require('../../src/ConfigurationManager')

describe("ConfigurationManager", () => {
  describe("Load", () => {
    var instance;

    it("should not be null", () => ConfigurationManager.should.not.be.null())

    it("should be instantiated", () => (instance = new ConfigurationManager()).should.not.be.null())
  })
})