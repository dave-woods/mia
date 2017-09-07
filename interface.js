const readline = require('readline')

const init = opts => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${(opts && opts.promptChar) || '>'} `
  })
}

module.exports = {
  init,
  reader: {}
}
