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
  return null
}

const numberParser = regexParser.bind(null, '-?\\d+\\.?\\d*e?-?\\d*', parseFloat)
const booleanParser = regexParser.bind(null, '(true|false)', function (s) { return s === 'true' })
const nullParser = regexParser.bind(null, 'null', function (s) { return null })
const stringParser = regexParser.bind(null, '"[^"]*"', function (s) { return s.slice(1, s.length - 1) })

function keyColonParser (s) {
  let result = stringParser(s)
  if (!result) return null

  let key = result[0]
  result = regexParser(':', null, result[1])
  if (!result) return null
  return [key, result[1]]
}

function valueParser (s) {
  const parsers = [nullParser, booleanParser, numberParser, stringParser, jsonParser]
  for (let i in parsers) {
    let result = parsers[i](s)
    if (result) return result
  }
  return null
}

function jsonParser (s) {
  const isArray = regexParser('\\[', null, s) !== null
  let obj = isArray ? [] : {}
  const delim = isArray ? ['\\[', '\\]'] : ['{', '}']
  let result = regexParser(delim[0], null, s)
  if (!result) return null

  while (1) {
    let rest = result[1]
    result = isArray ? valueParser(rest) : keyColonParser(rest)
    if (!result) return [obj, regexParser(delim[1], null, rest)[1]]

    if (isArray) obj.push(result[0])
    else {
      let key = result[0]
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

// tests
// ====================================
//  fundamental values
// ====================================
let s = '   {openCurlyBraceParser'
console.log(regexParser('{', null, s))

s = '  123.05{numberParser'
console.log(numberParser(s))

s = '  "where12x388" is my stringParser'
console.log(stringParser(s))

s = 'true in booleanParser'
console.log(booleanParser(s))

s = 'null here in nullParser'
console.log(nullParser(s))

s = '  "name"  :  "keyColonParser"'
console.log(keyColonParser(s))

s = 'null in valueParser'
console.log(valueParser(s))

s = '123 or'
console.log(valueParser(s))

// ====================================
// simple arrays
// ====================================

s = '[]'
console.log(jsonParser(s))

s = '[1, true, "hi"]'
console.log(jsonParser(s))

// ====================================
// simple objects
// ====================================

s = '{}'
console.log(jsonParser(s))

s = '{"name": 1}'
console.log(jsonParser(s))

s = '{"name": "something", "ro": 2235, "dead": true}'
console.log(jsonParser(s))

// ====================================
// nested arrays
// ====================================

s = '[1, null, [133, false]]'
console.log(jsonParser(s))

// ====================================
// nested objects
// ====================================
s = '{"name": 18, "address": {"street": 19}}'
console.log(jsonParser(s))

// ====================================
// arrays inside objects
// ====================================
s = '{"names": [1, 2, 3, 4], "other": true}'
console.log(jsonParser(s))

// ====================================
// objects inside arrays
// ====================================
s = '[1, 2, {"name": true}]'
console.log(jsonParser(s))

// ====================================
// nested mixed objects (complicated Json)
// ====================================
s = '{"name": "stuff", "ro": [3, 2, "hi", [44, true]]}'
console.log(jsonParser(s))

s = '{"name": "nu-12", "tugo": [1, 2, [3, null]], "address": {"one": 1, "time": true, "room": {"map": "top"}}}'
console.log(jsonParser(s))
