function regexParser (pattern, parseFunction, s) {
  // find leading whitespaces
  let regex = new RegExp('\\s*' + pattern)
  let matched = s.match(regex)

  if (matched === null) {
    return null
  }

  // remove leading whitespaces
  let len = matched[0].length
  matched[0] = matched[0].trim()
  if (matched.index === 0) {
    let result = (parseFunction !== null) ? parseFunction(matched[0]) : matched[0]
    return [result, s.slice(len)]
  }
  return null
}

function applyParsers (s, parsers) {
  // apply parsers in sequence
  for (let i in parsers) {
    let result = parsers[i](s)
    if (result !== null) {
      return result
    }
  }
  return null
}

// define some fundamental parsers 
const openCurlyBraceParser = regexParser.bind(null, '{', null)
const closeCurlyBraceParser = regexParser.bind(null, '}', null)
const commaParser = regexParser.bind(null, ',', null)
const colonParser = regexParser.bind(null, ':', null)
const openSquareBracketParser = regexParser.bind(null, '\\[', null)
const closeSquareBracketParser = regexParser.bind(null, '\\]', null)
const numberParser = regexParser.bind(null, '[0-9]+\\.?[0-9]*e?[0-9]*', parseFloat)

const booleanParser = regexParser.bind(null, '(true|false)', function (s) {
  return s === 'true'
})

const nullParser = regexParser.bind(null, 'null', function (s) {
  return null
})

const stringParser = regexParser.bind(null, '"[^"]*"', function (s) {
  return s.slice(1, s.length - 1)
})

function keyParser (s) {
  let result = stringParser(s)

  if (result === null) {
    return null
  }

  let key = result[0]
  let rest = result[1]
  result = colonParser(rest)

  if (result === null) {
    return null
  }

  return [key, result[1]]
}

function valueParser (s) {
  return applyParsers(s, [nullParser, booleanParser, numberParser, stringParser, arrayParser, objectParser])
}

function arrayParser (s) {
  let result = []
  let parseResult = openSquareBracketParser(s)

  if (parseResult === null) {
    return null
  }

  let rest = parseResult[1]

  while (1) {
    parseResult = valueParser(rest)

    if (parseResult === null) {
      // console.log(rest)
      parseResult = closeSquareBracketParser(rest)
      return [result, parseResult[1]]
    }

    result.push(parseResult[0])
    let decisionParseResult = closeSquareBracketParser(parseResult[1])
    if (decisionParseResult !== null) {
      return [result, decisionParseResult[1]]
    }

    decisionParseResult = commaParser(parseResult[1])
    if (decisionParseResult === null) {
      return [result, parseResult[1]]
    }
    parseResult = decisionParseResult
    rest = decisionParseResult[1]
  }
}

function objectParser (s) {
  let result = {}
  let parseResult = openCurlyBraceParser(s)
  if (parseResult === null) {
    return null
  }

  while (1) {
    let rest = parseResult[1]
    parseResult = keyParser(rest)

    if (parseResult === null) {
      parseResult = closeCurlyBraceParser(rest)
      return [result, parseResult[1]]
    }

    let key = parseResult[0]
    rest = parseResult[1]
    parseResult = valueParser(rest)
    result[key] = parseResult[0]
    rest = parseResult[1]

    // finding a } will end the loop
    let decisionParseResult = closeCurlyBraceParser(rest)
    if (decisionParseResult !== null) {
      parseResult = decisionParseResult
      break
    }
    // finding , will continue
    decisionParseResult = commaParser(rest)

    if (decisionParseResult === null) {
      // Json code was valid until now
      return [result, parseResult[1]]
    }
    parseResult = decisionParseResult
  }
  return [result, parseResult[1]]
}

// tests
let s = '   {openCurlyBraceParser'
console.log(openCurlyBraceParser(s))

s = 'openCurlyBraceParser {'
console.log(openCurlyBraceParser(s))

s = '   }closeCurlyBraceParser'
console.log(closeCurlyBraceParser(s))

s = '  123.05{numberParser'
console.log(numberParser(s))

s = '  "where12x388" is my stringParser'
console.log(stringParser(s))

s = 'true in booleanParser'
console.log(booleanParser(s))

s = 'null here in nullParser'
console.log(nullParser(s))

s = ': here in colonParser'
console.log(colonParser(s))

s = ', stuff in commaParser'
console.log(commaParser(s))

s = '[openSquareBracketParser]'
console.log(openSquareBracketParser(s))

s = '] closeSquareBracketParser'
console.log(closeSquareBracketParser(s))

s = '"name"  : "keyParser"'
console.log(keyParser(s))

s = 'null in valueParser'
console.log(valueParser(s))

s = '123 or'
console.log(valueParser(s))

s = '{"name": "something", "ro": 2235, "dead": true}'
console.log(objectParser(s))

s = '  1,'
console.log(numberParser(s))

s = '  true, '
console.log(valueParser(s))

s = 'true, '
console.log(valueParser(s))

s = '[1, true, "hi"]'
console.log(arrayParser(s))

s = '{"name": "stuff", "ro": [3, 2, "hi", [44, true]]}'
console.log(objectParser(s))

s = '[]'
console.log(arrayParser(s))

s = '[1, 2]'
console.log(arrayParser(s))

s = '{"name": 1}'
console.log(objectParser(s))

s = '{}'
console.log(objectParser(s))

s = '{"name": []}'
console.log(objectParser(s))

s = '{"name": "nu-12", "tugo": [1, 2, [3, null]], "address": {"one": 1, "time": true, "room": {"map": "top"}}}'
let obj = objectParser(s)
console.log(obj)
console.log(obj[0].tugo)
console.log(obj[0].address)
