/* 
* Promise utilities tests
*/

'use strict';

const sinon = require('sinon')
const should = require('should')

const {pReduce, pMapSeries} = require('../../dist/cjs/promiseUtils')

describe('promiseUtils', () => {
  describe('pReduce', () => {
    it('reduces sequentially (async reducer) and preserves order', () => {
      const seen = []
      return pReduce([1, 2, 3], async (acc, item) => {
        await Promise.resolve()
        seen.push(item)
        return acc + item
      }, 0).then((result) => {
        result.should.equal(6)
        seen.should.eql([1, 2, 3])
      })
    })
  })

  describe('pMapSeries', () => {
    it('maps sequentially (async mapper) and preserves result order', () => {
      const seen = []
      return pMapSeries([3, 2, 1], async (item) => {
        await Promise.resolve()
        seen.push(item)
        return item * 2
      }).then((results) => {
        results.should.eql([6, 4, 2])
        seen.should.eql([3, 2, 1])
      })
    })

    it('does not run mapper concurrently', () => {
      let inFlight = 0
      let maxInFlight = 0
      return pMapSeries([1, 2, 3, 4], (item) => {
        inFlight++
        maxInFlight = Math.max(maxInFlight, inFlight)
        return new Promise((resolve) => {
          setTimeout(() => {
            inFlight--
            resolve(item)
          }, 10)
        })
      }).then(() => {
        maxInFlight.should.equal(1)
      })
    })
  })
})


