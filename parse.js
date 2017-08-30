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
    if (result != null) {
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
const numberParser = regexParser.bind(null, '\\d+.?\\d+e?\\d+', parseFloat)

const booleanParser = regexParser.bind(null, '(true|false)', function (s) {
  return s === 'true'
})

const nullParser = regexParser.bind(null, 'null', function (s) {
  return null
})

const stringParser = regexParser.bind(null, '"\\w+"', function (s) {
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
  return applyParsers(s, [nullParser, booleanParser, numberParser, stringParser])
}

function jsonParser (s) {
  let result = {}
  let parseResult = openCurlyBraceParser(s)
  if (parseResult === null) {
    return null
  }

  while (1) {
    let rest = parseResult[1]
    parseResult = keyParser(rest)
    let key = parseResult[0]
    rest = parseResult[1]
    parseResult = valueParser(rest)
    console.log(parseResult)
    result[key] = parseResult[0]
    rest = parseResult[1]

    // finding a } will end the loop
    let decisionParseResult = closeCurlyBraceParser(rest)
    if (decisionParseResult !== null) {
      break
    }
    // finding , will continue
    decisionParseResult = commaParser(rest)
    console.log(decisionParseResult)

    if (decisionParseResult === null) {
      // Json code was valid until now
      return result
    }
    parseResult = decisionParseResult
  }
  return result
}

// tests
// let s = '   {where'
// console.log(openCurlyBraceParser(s))

// s = 'this {'
// console.log(openCurlyBraceParser(s))

// s = '   }this'
// console.log(closeCurlyBraceParser(s))

// s = '  123.05{'
// console.log(numberParser(s))

// s = '  "where12x388" is my'
// console.log(stringParser(s))

// s = 'true in'
// console.log(booleanParser(s))

// s = 'null here'
// console.log(nullParser(s))

// s = ': here'
// console.log(colonParser(s))

// s = ', stuff'
// console.log(commaParser(s))

// s = '[something here]'
// console.log(openSquareBracketParser(s))

// s = '] something'
// console.log(closeSquareBracketParser(s))

// s = '"name"  : "Ra"'
// console.log(keyParser(s))

// s = 'null in'
// console.log(valueParser(s))

// s = '123 or'
// console.log(valueParser(s))

s = '{"name": "something", "ro": 2235}'
console.log(jsonParser(s))
