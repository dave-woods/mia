const Interface = require('./interface.js')

// TODO:
// + tab autcompletion
// - randomise name Mia calls you
// - give Mia more things to do
// - abstract dialog to separate file
// - abstract input options to separate file
// - user profile?
// - extra personality (emoticons etc)
// - ASCII "graphics"?
// - equivalent terms dictionary (eg 'my name' = 'Dave')

const mia = {
  state: {
    busy: false,
    shouldExit: false
  },
  say: (dialog, noPrompt = false) => {
    console.log(`\n${dialog}`)
    !noPrompt && Interface.reader.prompt()
  },
  ask: (dialog, callback) => Interface.reader.question(dialog, callback),
  init: (opts) => {
    Interface.reader = Interface.init(opts)
    console.log('Howdy! I\'m Mia. What can I do for you today?')
    Interface.reader.prompt()
  },
  on: (event, callback) => Interface.reader.on(event, callback),
  exit: () => Interface.reader.close(),
  commands: [ '.exit', 'say' ]
}

// console.log('\x1Bc') // clears terminal screen
mia.init({
  promptChar: '#',
  completer: (line) => {
    const hits = mia.commands.filter(c => c.startsWith(line))
    return [ hits.length ? hits : mia.commands, line ]
  }
})

mia.on('line', line => {
  if (mia.state.shouldExit) {
    if (line.match(/^y(es)?$/i) || line.trim() === '') {
      mia.exit()
    } else if (line.match(/^n(o)?$/i)) {
      mia.state.shouldExit = false
      mia.say('Okay, darlin\'. I\'ll stay.')
    } else if (line.match(/^maybe$/i)) {
      mia.say('Well, make up your mind, honey! Should I leave?')
    } else {
      mia.state.shouldExit = false
      mia.say('That doesn\'t sound like an answer to me... I guess I\'ll stay?')
    }
  } else if (line.toLowerCase().startsWith('say ')) {
    const str = line.slice(4)
    mia.say(`"${str}"${str === 'something' ? ' ;P' : ''}`, true)
    mia.say('What else can I do for you?')
  } else if (line === '.exit') {
    mia.exit()
  } else {
    mia.say('Well aren\'t you the sweetest thing?')
  }
})

mia.on('SIGINT', () => {
  console.log() // as if newline was typed
  if (mia.state.shouldExit) mia.exit()
  else {
    mia.state.shouldExit = true
    mia.say('Do you really want me to go away? :(')
  }
})

mia.on('close', () => {
  mia.say('Bye bye, sweetheart.', true)
})
