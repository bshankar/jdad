function regexParser (pattern, parseFunction, s) {
  if (s === null) {
    // nothing to be done!
    return null
  }

  if (s instanceof Array) {
    // this is the output from another parser
    // we should consider only the remaining string 
    s = s[1]
  }

  // leading whitespaces do not matter
  // we find them and remove them later
  const regex = new RegExp('\\s*' + pattern)
  let matched = s.match(regex)

  if (matched === null) {
    // parsing failed
    return null
  }
  return afterRegexMatch(s, matched, parseFunction)
}

function afterRegexMatch (s, matched, parseFunction) {
  // Processing after a successful RegExp match
  const len = matched[0].length
  matched[0] = matched[0].trim() // remove leading whitespaces
  if (matched.index === 0) {
    // apply the function to parse fundamental values (if provided)
    const result = (parseFunction !== null) ? parseFunction(matched[0]) : matched[0]
    return [result, s.slice(len)] // parsing was successful!
  }
  // parsing failed
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
  // eval function for boolean values
  // 'true' -> true
  // 'false' -> false
  return s === 'true'
})

const nullParser = regexParser.bind(null, 'null', function (s) {
  // 'null' -> null
  return null
})

const stringParser = regexParser.bind(null, '"[^"]*"', function (s) {
  // remove the surrounding double quotes
  return s.slice(1, s.length - 1)
})

function keyParser (s) {
  let result = stringParser(s)
  if (result === null) {
    return null
  }

  let key = result[0]
  result = colonParser(result)
  if (result === null) {
    return null
  }
  return [key, result[1]]
}

function valueParser (s) {
  const parsers = [nullParser, booleanParser, numberParser, stringParser, arrayParser, objectParser]
  // try various parsers in sequence
  // and return the first successful parse
  for (let i in parsers) {
    let result = parsers[i](s)
    if (result !== null) {
      return result
    }
  }
  return null
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

s = '   :   colonParser'
console.log(colonParser(s))

s = '  "name"  :  "keyParser"'
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
