'use strict';

const {Dispatcher} = require('../..')

describe("Dispatcher", () => {
  module = null
  
  describe("Load", () => {
    it("should not be null", () => Dispatcher.should.not.be.null())

    it("should be instantiated", () => {
     module = new Dispatcher()
     module.should.not.be.null() 
    });
  });

  describe("Emit", () => {
    beforeEach(() => {
      module.removeAllListeners()
    })
    
    it("should alter args with befores", () => {
      module.on('event', (arg) => {
        arg.should.equal(true)
        return arg
      })
      module.before('event', ([arg]) => {
        arg.should.equal(1)
        return [arg == 1]
      })

      return module.emit('event', 1).then((result) => {
        result.should.be.true()
      })
    })

    it("should run afters wtih no on handler", () => {
      module.after("afterOnly", (result) => {
        return result+1
      })
      return module.emit("afterOnly", 1).then((after) => {
        after.should.equal(2)
      })
    })
    
    it("should not alter args if before does not return anything", () => {
      module.on('event', (arg) => {
        arg.should.equal(1)
        return arg
      })
      module.before('event', ([arg]) => {
        arg.should.equal(1)
      })

      return module.emit('event', 1).then((result) => {
        result.should.equal(1)
      })
    })

    it("should return a value for single listener even if 0", () => {
      module.on('event', () => {
        return 0
      })
      return module.emit('event').then((result) => {
        result.should.equal(0)
      })
    })
    it("should return a value for multiple listener even if 0 and undefined", () => {
      module.on('event', () => {
        return 0
      })
      module.on('event', () => {
      })
      return module.emit('event').then((result) => {
        result.should.equal(0)
      })
    })
    
    it("should return an array for multiple listeners", () => {
      module.on('event', () => {
        return 1
      })
      module.on('event', () => {
        return 2
      })
      return module.emit('event').then((result) => {
        result.length.should.equal(2)
        result.includes(1).should.be.true()
        result.includes(2).should.be.true()
      })
    })

    it("should accumulate afters", () => {
      module.on('event', () => {
        return [1,2,3]
      })
      module.after('event', (results) => {
        return results.map((x) => {return x+1})
      })
      module.after('event', (results) => {
        return results.map((x) => {return x+2})
      })

      return module.emit('event').then((result) => {
        result.length.should.equal(3)
        result.includes(4).should.be.true()
        result.includes(5).should.be.true()
        result.includes(6).should.be.true()
      })
    })
    it("should accumulate afters for non-array", () => {
      module.on('event', () => {
        return 3
      })
      module.after('event', (results) => {
        return results + 1
      })
      module.after('event', (results) => {
        return results + 2
      })

      return module.emit('event').then((results) => {
        results.should.equal(6)
      })
    })
    it("should send args to afters", () => {
      module.on('event', (arg) => {
        return 3
      })
      module.after('event', (results, args) => {
        return args[0]
      })
      return module.emit('event', 5).then((results) => {
        results.should.equal(5)
      })
    })
    it("should not accumulate afters that do not return anything", () => {
      module.on('event', (arg) => {
        return 3
      })
      module.after('event', (results) => {
        return
      })
      return module.emit('event', 5).then((results) => {
        results.should.equal(3)
      })
    })
    
    it("should not change false non-array responses", () => {
      module.on('event', () => {
        return undefined
      })
      return module.emit('event').then((result) => {
        (result === undefined).should.be.true()
      })
    })
    it("should not change actual array responses", () => {
      module.on('event', () => {
        return [1]
      })
      return module.emit('event').then((result) => {
        result.should.be.instanceof(Array)
        result.length.should.equal(1)
        result[0].should.equal(1)
      })
    })

  })
})
