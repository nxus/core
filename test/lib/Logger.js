/*
* @Author: mike
* @Date:   2016-08-25 09:55:55
* @Last Modified 2016-08-25
* @Last Modified time: 2016-08-25 10:06:36
*/

'use strict';

const {logger, Logger} = require('../..')

describe("Logger", () => {
  
  describe("Import", () => {
    it("Class should not be null", () => Logger.should.not.be.null())

    it("Instance should not be null", () => logger.should.not.be.null());
    
    it("Instance Error Log should not be null", () => logger.error.should.not.be.null());
    it("Instance Info Log should not be null", () => logger.info.should.not.be.null());
    it("Instance Warn Log should not be null", () => logger.warn.should.not.be.null());
    it("Instance Debug Log should not be null", () => logger.debug.should.not.be.null());
    it("Instance Log should not be null", () => logger.log.should.not.be.null());
  });
})