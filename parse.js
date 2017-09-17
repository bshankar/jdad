function regexParser (pattern, evalFn, s) {
  const regex = new RegExp('^\\s*' + pattern)
  let matched = s.match(regex)
  if (!matched) return null
  return afterRegexMatch(s, matched, evalFn)
}

function afterRegexMatch (s, matched, evalFn) {
  const len = matched[0].length
  matched[0] = matched[0].trim()
  if (matched.index === 0) {
    const result = (evalFn !== null) ? evalFn(matched[0]) : matched[0]
    return [result, s.slice(len)]
  }
}

function keyColonParser (s) {
  let result = stringParser(s)
  if (!result) return null
  let key = result[0]
  result = regexParser(':', null, result[1])
  if (!result) return null
  return [key, result[1]]
}

function containerParseHelper (delim, s) {
  const obj = (delim[0] === '\\[') ? [] : {}
  let result = regexParser(delim[0], null, s)
  if (!result) return null
  while (1) {
    let rest = result[1]
    result = delim[0] === '\\[' ? valueParser(rest) : keyColonParser(rest)
    if (!result) return [obj, regexParser(delim[1], null, rest)[1]]
    if (delim[0] === '\\[') obj.push(result[0])
    else {
      let key = result[0]
      console.log(result)
      result = valueParser(result[1])
      obj[key] = result[0]
    }
    let decidingResult = regexParser(delim[1], null, result[1])
    if (decidingResult) return [obj, decidingResult[1]]
    decidingResult = regexParser(',', null, result[1])
    if (!decidingResult) return [obj, result[1]]
    result = decidingResult
  }
}

const numberParser = regexParser.bind(null, '[-+]?(\\d+\\.?\\d*([eE][-+]?\\d+)?|\\d*\\.?\\d+([eE][-+]?\\d+)?)', parseFloat)
const booleanParser = regexParser.bind(null, '(?:true|false)', function (s) { return s === 'true' })
const nullParser = regexParser.bind(null, 'null', function (s) { return null })
const stringParser = regexParser.bind(null, '"(?:\\\\"|[^"])*"', function (s) { return s.slice(1, s.length - 1) })
const arrayParser = containerParseHelper.bind(null, ['\\[', '\\]'])
const objectParser = containerParseHelper.bind(null, ['{', '}'])
const valueParser = (s) => {
  return nullParser(s) || booleanParser(s) || numberParser(s) || stringParser(s) || arrayParser(s) || objectParser(s)
}

// run a file
const fs = require('fs')
const util = require('util')
const filename = process.argv[2]
fs.readFile(filename, 'utf-8', function (err, s) {
  if (err) throw err
  let result = objectParser(s)
  if (result) console.log(util.inspect(result[0], false, null))
 
  // try {
    // let result = objectParser(s)
    // if (result) console.log(util.inspect(result[0], false, null))
    // else console.log('Invalid Json')
  // } catch (e) {
    // console.log('Invalid Json')
  // }
})
