const path = require('path')
const exec = require('child_process').exec

const Interface = require(path.resolve('/home/david/code/js/mia', 'interface.js'))

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
// - sanitise user input (for open command etc)
// - add exit/error codes
// - add more states (eg shouldPromptForInput)
// - improve help menu
// - improve natural language interpretation (external package?)
// - split input text to array
// - put errors to a logfile rather than on-screen

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
  commands: [ 'exit', 'say', 'open', 'help', 'show me my' ]
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
  const input = line.toLowerCase().trim()
  if (mia.state.shouldExit) {
    if (input.match(/^y(es)?$/i) || input === '') {
      mia.exit()
    } else if (input.match(/^n(o)?$/i)) {
      mia.state.shouldExit = false
      mia.say('Okay, darlin\'. I\'ll stay.')
    } else if (input.match(/^maybe$/i)) {
      mia.say('Well, make up your mind, honey! Should I leave?')
    } else {
      mia.state.shouldExit = false
      mia.say('That doesn\'t sound like an answer to me... I guess I\'ll stay?')
    }
  } else if (input.startsWith('say ')) {
    const str = line.slice(4)
    mia.say(`"${str}"${str === 'something' ? ' ;P' : ''}`, true)
    mia.say('What else can I do for you?')
  } else if (input.startsWith('open ')) {
    const str = line.slice(5)
    mia.say(`Opening ${str}...`, true)
    // NOT SAFE! SANITISE USER INPUT!!!
    exec(`xdg-open "${str}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
      }
      mia.say('What else can I do for you?')
    })
  } else if (input.startsWith('show me my ')) {
    const str = input.slice(11)
    // NOT SAFE! SANITISE USER INPUT!!!
    exec(`neofetch --off | grep -i '${str}'`, (error, stdout, stderr) => {
      if (error) {
        mia.say('I\'m not sure how to show you that... :/', true)
      } else mia.say(`I found this:\n${stdout}`, true)
      mia.say('What else can I do for you?')
    })
  } else if (input === 'help') {
    mia.say(`Try any of these:\n${mia.commands.join('\n')}`, true)
    mia.say('What else can I do for you?')
  } else if (input === 'exit') {
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
