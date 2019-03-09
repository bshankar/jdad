function reParser (pattern, s, eval = x => x) {
  if (!s) return null
  if (s instanceof Array) s = s[1]
  const res = pattern.exec(s.trim())
  if (res) return [eval(res[0]), s.trim().slice(res[0].length)]
  return null
}

function elementParser (acc, s) {
  if (acc instanceof Array) {
    const val = valueParser(s)
    return val ? [[val[0]], val[1]] : null
  }
  const mbKey = stringParser(s)
  const mbValue = valueParser(reParser(/^:/, mbKey))
  return mbKey && mbValue ? [{[mbKey[0]]: mbValue[0]}, mbValue[1]] : null
}

function containerParser (open, close, s, acc) {
  const put = (val, acc) => acc instanceof Array
    ? [...acc, ...val] : {...acc, ...val}
  let res = reParser(open, s)
  while (res) {
    const resElement = elementParser(acc, res)
    if (resElement) acc = put(resElement[0], acc)
    const hasEnded = reParser(close, resElement || res)
    if (hasEnded) return [acc, hasEnded[1]]
    res = reParser(/^,/, resElement)
    if (res && reParser(close, res)) return null
  }
  return null
}

const nullParser = s => reParser(/^null/, s, () => null)
const boolParser = s => reParser(/^(?:true|false)/, s, x => x === 'true')
const numParser = s => reParser(/^-?\d+\.?\d*(?:[eE][-+]?\d+)?/, s, parseFloat)
const stringParser = s => reParser(/^"(?:\\"|[^"])*"/, s, x => x.slice(1, -1))
const arrayParser = s => containerParser(/^\[/, /^\]/, s, [])
const objectParser = s => containerParser(/^\{/, /^\}/, s, {})
const valueParser = s => stringParser(s) || numParser(s) || arrayParser(s) ||
  boolParser(s) || nullParser(s) || objectParser(s)

module.exports = { valueParser }
