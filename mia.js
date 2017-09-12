const exec = require('child_process').exec
const readline = require('readline')

const dict = require('./dictionary.json')

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
// - improve help menu -> make mia.commands an object (eg) say:{name:'say',fn:() => {},desc:'blah'}
// - improve natural language interpretation (external package?)
// + split input text to array
// - put errors to a logfile rather than on-screen
// - have a dev-mode env variable for access to debug cmds

const mia = {
  state: {
    busy: false,
    shouldExit: false
  },
  cli: {
    pout: process.stdout,
    clearLine: readline.clearLine,
    cursorTo: readline.cursorTo
  },
  commands: [ 'exit', 'say', 'open', 'help', 'show me my', 'who' ],
  otherCommands: [ 'nothing' ],
  dictionary: dict
}

mia.init = (opts) => {
  mia.cli.main = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${(opts && opts.promptChar) || '>'} `,
    completer: opts && opts.completer
  })
  console.log('Hi there! I\'m Mia. What can I do for you today?')
  mia.cli.main.prompt()
}

mia.say = (dialog, noPrompt = false) => {
  console.log(`\n${dialog}`)
  !noPrompt && mia.cli.main.prompt()
}

mia.ask = (dialog, callback) => mia.cli.main.question(dialog, callback)

mia.on = (event, callback) => mia.cli.main.on(event, callback)

mia.exit = () => mia.cli.main.close()

// console.log('\x1Bc') // clears terminal screen
mia.init({
  promptChar: '#',
  completer: (line) => {
    const hits = [...mia.commands, ...mia.otherCommands].filter(c => c.startsWith(line))
    return [ hits.length ? hits : mia.commands, line ]
  }
})

mia.on('line', line => {
  const [ command, ...args ] = line.trim().split(' ')
  if (mia.state.shouldExit) {
    if (command.match(/^y(es)?$/i) || command === '') {
      mia.exit()
    } else if (command.match(/^n(o)?$/i)) {
      mia.state.shouldExit = false
      mia.say('Okay. I\'ll stay. :)')
    } else if (command.match(/^maybe$/i)) {
      mia.say(':|', true)
      setTimeout(() => {
        mia.say('Should I leave?')
      }, 500)
    } else {
      mia.state.shouldExit = false
      mia.say('That doesn\'t sound like an answer to me... I guess I\'ll stay?')
    }
    return
  }

  if (command === '') {
    mia.cli.main.prompt()
    return
  }

  let str
  switch (command.toLowerCase()) {
    case 'say':
      str = args.join(' ')
      mia.say(`"${str}"${str === 'something' ? ' ;P' : ''}`, true)
      mia.say('What else can I do for you?')
      break
    case 'open':
      str = args.join(' ')
      mia.say(`Opening ${str}...`, true)
      // NOT SAFE! SANITISE USER INPUT!!!
      exec(`xdg-open "${str}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`)
        }
        mia.say('What else can I do for you?')
      })
      break
    case 'show':
      // Only 'show me my' working for now
      if (args.length < 3 || args[0].toLowerCase() !== 'me' || args[1].toLowerCase() !== 'my') {
        mia.cli.main.prompt()
        break
      }
      str = args.slice(2).join(' ')
      // NOT SAFE! SANITISE USER INPUT!!!
      exec(`neofetch --off | grep -i '${str}'`, (error, stdout, stderr) => {
        if (error) {
          mia.say('I\'m not sure how to show you that... :/', true)
        } else mia.say(`I found this:\n${stdout}`, true)
        mia.say('What else can I do for you?')
      })
      break
    case 'nothing':
      mia.say('Okay. Now doing nothing...', true)
      let percent = 0
      const interval = setInterval(() => {
        if (percent > 100) {
          mia.say('Successfully did nothing.', true)
          mia.say('What else can I do for you?')
          clearInterval(interval)
        } else {
          mia.cli.clearLine(process.stdout, 0)
          mia.cli.cursorTo(process.stdout, 0)
          mia.cli.pout.write(`${percent}% of nothing completed.`)
          percent++
        }
      }, 10)
      break
    case 'help':
      mia.say(`Try any of these:\n${mia.commands.join('\n')}`, true)
      mia.say('What else can I do for you?')
      break
    case 'exit':
      mia.exit()
      break
    case 'dict':
      console.log(mia.dictionary)
      break
    case 'who':
      if (args.length < 2 || !args[0].match(/^(is|are|am)$/i)) {
        mia.cli.main.prompt() // fall through to default/post-switch?
        break
      }
      let { name, pronouns } = mia.dictionary.entities.mia
      if ([ name, ...pronouns.user.obj ].includes(args[1])) {
        mia.say(`${pronouns.self.subj[0]} am ${name}`, true) // silly
      } else {
        mia.say('I\'m not sure... :/', true)
      }
      mia.say('What else can I do for you?')
      break
    default:
      mia.say('Sorry, I\'m not sure how to do that yet. I\'ll do my best to learn!')
      break
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
  mia.say('Bye for now.', true)
})
