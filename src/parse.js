function regexParser (pattern, s, inner) {
  if (!s) return null
  if (typeof s === 'string') s = ['', s]
  const res = pattern.exec(s[1])
  if (res) {
    const eaten = res[0].trim()
    const len = res[0].length
    return [inner ? inner(eaten) : eaten, s[1].slice(len)]
  }
  return null
}

function elementParser (acc, s) {
  if (acc instanceof Array) {
    const val = valueParser(s)
    return val ? [[val[0]], val[1]] : null
  }
  const mbKey = stringParser(s)
  const mbValue = valueParser(regexParser(/^\s*:/, mbKey))
  return mbKey && mbValue ? [{[mbKey[0]]: mbValue[0]}, mbValue[1]] : null
}

function containerParser (open, close, s, acc) {
  const put = (val, acc) => acc instanceof Array
    ? [...acc, ...val] : {...acc, ...val}
  let res = regexParser(open, s)
  while (res) {
    const resElement = elementParser(acc, res)
    if (resElement) acc = put(resElement[0], acc)
    const hasEnded = regexParser(close, resElement || res)
    if (hasEnded) return [acc, hasEnded[1]]
    res = regexParser(/^\s*,/, resElement || res)
  }
  return null
}

const nullParser = s => regexParser(/^\s*null/, s, x => null)
const boolParser = s => regexParser(/^\s*(?:true|false)/, s, x => x === 'true')
const numberParser = s => regexParser(/^\s*[-+]?\d+\.?\d*(?:[eE][-+]?\d+)?/, s, parseFloat)
const stringParser = s => regexParser(/^\s*"(?:\\"|[^"])*"/, s, x => x.slice(1, x.length - 1))
const arrayParser = s => containerParser(/^\s*\[/, /^\s*\]/, s, [])
const objectParser = s => containerParser(/^\s*\{/, /^\s*\}/, s, {})
const valueParser = s => stringParser(s) || numberParser(s) || arrayParser(s) ||
  boolParser(s) || nullParser(s) || objectParser(s)

module.exports = { valueParser }