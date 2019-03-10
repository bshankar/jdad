function reParser (pattern, s, eval = x => x) {
  if (!s) return null
  if (Array.isArray(s)) s = s[1]
  const res = pattern.exec(s.trim())
  if (res) return [eval(res[0]), s.trim().slice(res[0].length)]
  return null
}

function elementParser (acc, s, isArray) {
  const key = isArray ? [Object.keys(acc).length, s] : stringParser(s)
  const value = module.exports.valueParser(isArray ? s : reParser(/^:/, key))
  return key && value ? [{[key[0]]: value[0]}, value[1]] : null
}

function containerParser (open, close, s, acc, isArray) {
  let res = reParser(open, s)
  while (res) {
    const resElement = elementParser(acc, res, isArray)
    if (resElement) acc = { ...acc, ...resElement[0] }
    const hasEnded = reParser(close, resElement || res)
    if (hasEnded) return [isArray ? Object.values(acc): acc, hasEnded[1]]
    res = reParser(/^,/, resElement)
    if (res && reParser(close, res)) return null
  }
  return null
}

const nullParser = s => reParser(/^null/, s, () => null)
const boolParser = s => reParser(/^(?:true|false)/, s, x => x === 'true')
const numParser = s => reParser(/^-?\d+\.?\d*(?:[eE][-+]?\d+)?/, s, parseFloat)
const stringParser = s => reParser(/^"(?:\\"|[^"])*"/, s, x => x.slice(1, -1))
const arrayParser = s => containerParser(/^\[/, /^\]/, s, [], true)
const objectParser = s => containerParser(/^\{/, /^\}/, s, {}, false)
module.exports.valueParser = s => stringParser(s) || numParser(s) ||
  arrayParser(s) || boolParser(s) || nullParser(s) || objectParser(s)
