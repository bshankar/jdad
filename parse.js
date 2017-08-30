/*
Before parsing, remove all whitespace characters from the Json string. 
So that we don't need to parse the optional spaces again and again.
*/

function charParser (ch, s) {
  if (s[0] === ch) {
    return [s[0], s.slice(1)]
  }
  return null
}

function regexParser (regex, parseFunction, s) {
  let foundMatch = s.match(regex)

  if (foundMatch === null) {
    return null
  }

  if (parseFunction === null) {
    // use identify function as default 
    parseFunction = function (e) {
      return e
    }
  }

  if (foundMatch.index === 0) {
    return [parseFunction(foundMatch[0]), s.slice(foundMatch[0].length)]
  }
  return null
}

function booleanParser (s) {
  if (s.slice(0, 4) === 'true') {
    return [true, s.slice(4)]
  }
  if (s.slice(0, 5) === 'false') {
    return [false, s.slice(5)]
  }

  return null
}

function nullParser (s) {
  if (s.slice(0, 4) === 'null') {
    return [null, s.slice(4)]
  }
  return null
}

// define some fundamental parsers 
const openCurlyBraceParser = charParser.bind(null, '{')
const closeCurlyBraceParser = charParser.bind(null, '}')
const commaParser = charParser.bind(null, ',')
const colonParser = charParser.bind(null, ':')
const openSquareBracketParser = charParser.bind(null, '[')
const closeSquareBracketParser = charParser.bind(null, ']')
const numberParser = regexParser.bind(null, /\d+.?\d+e?\d+/, parseFloat)

const stringParser = regexParser.bind(null, /"\w+"/, function (s) {
  return s.slice(1, s.length - 1)
})

// define some higher level parsers

function keyParser (s) {
  // composite of stringParser, colonParser
  let parsersToTest = [stringParser, colonParser]
  let result = stringParser(s)
  if (result === null) {
    return null
  }

  let key = result[0]
  let rest = result[1]
  let optionalSpacesResult = spaceParser(rest)
  if (optionalSpacesResult !== null) {
    rest = optionalSpacesResult[1]
  }

  result = colonParser(rest)
  if (result === null) {
    return null
  }
  return [key, result[1]]
}

function valueParser (s) {
  let parsersToTest = [nullParser, booleanParser, numberParser, stringParser]
  for (let parser in parsersToTest) {
    let result = parsersToTest[parser](s)
    if (result !== null) {
      return result
    }
  }
  return null
}

function arrayParser(s) {
  
  return null
}

// define the json parser
function jsonParser(s) {
  
}

// tests
let s = '{where'
console.log(openCurlyBraceParser(s))

s = 'this {'
console.log(openCurlyBraceParser(s))

s = '}this'
console.log(closeCurlyBraceParser(s))

s = '   is'
console.log(spaceParser(s))

s = '123.05{'
console.log(numberParser(s))

s = '"where12x388" is my'
console.log(stringParser(s))

s = 'true in'
console.log(booleanParser(s))

s = 'null here'
console.log(nullParser(s))

s = ': here'
console.log(colonParser(s))

s = ', stuff'
console.log(commaParser(s))

s = '[something here]'
console.log(openSquareBracketParser(s))

s = '] something'
console.log(closeSquareBracketParser(s))

s = '"name"  : "Ra"'
console.log(keyParser(s))

s = 'null in'
console.log(valueParser(s))

s = '123 or'
console.log(valueParser(s))
