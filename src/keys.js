const r = /(?=(?:\[|\.))/;
export default {
  parse(str) {
    return str.split(r).map(item => item[0] === '.' ? item.substr(1) : (item[0] === '[' ? + item.substr(1, item.length - 2) : item))
  },
  query(target, keys) {
    if (typeof keys === 'string') {
      keys = this.parse(keys)
    }
    keys = keys.slice();
    let value = target;
    let key
    while(keys.length) {
      target = value
      key = keys.shift();
      value = target[key]
    }
    return { target, key, value }
  }
}