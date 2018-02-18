const util = require('util')
const fs = require('fs')
const { valueParser } = require('./parse')

const filename = process.argv[2]
const mode = process.argv[3] || 'normal'
fs.readFile(filename, 'utf-8', function (err, s) {
  if (err) throw err
  if (mode === 'bench') console.time()
  let res = valueParser(s)
  if (mode === 'bench') {
    console.timeEnd()
    console.log('Testing JSON.parse')
    console.time()
    JSON.parse(s)
    console.timeEnd()
  } else console.log(!res ? res : util.inspect(res[0], false, null))
})
