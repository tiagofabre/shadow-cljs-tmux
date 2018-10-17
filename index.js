#! /usr/bin/env node
const pparams = process.argv.slice(2).join(' ')
const currentPath = process.cwd();
const spawn = require('child_process').spawn;
const options = {cwd: currentPath, shell: process.env.SHELL};
const shadow = require('child_process').spawn(`shadow-cljs ${pparams}`, options);

const gray = '#eff0f1'

const statusColors = {
  'default': 'default',
  'started': gray,
  'compiling': 'yellow',
  'completed': 'green',
  'failure': 'red',
  'running': gray,
};

function setBgColor (color) {
  spawn('tmux', ['set-option', 'status-left-bg', color])
  spawn('tmux', ['set-option', 'status-left-fg', 'black'])
}

function notifyUpdate(status) {
  color = statusColors[status]
  setBgColor(color)
}

function parseData(data) {
  if (data.includes('Compiling')) {
    return 'compiling'
  } else if (data.includes('Build completed')) {
    return 'completed'
  } else if (data.includes('Build failure')) {
    return 'failure'
  } else if (data.includes('running')) {
    return 'running'
  }
}

notifyUpdate('started')

shadow.stdout.on('data', (data) => {
  var status = parseData(data)
  if (status) {
    notifyUpdate(status)
  }
  console.log(`${data}`)
})

shadow.stderr.on('data', (data) => {
  var status = parseData(data)
  if (status) {
    notifyUpdate(status)
  }
  console.log(`${data}`)
})

shadow.on('close', (code) => {
  console.log(`child process exited with code ${code}`)
})

function exitHandler(options, exitCode) {
  notifyUpdate('default')
  shadow.kill('SIGINT')
  process.exit()
}

process.on('exit', exitHandler.bind(null,{cleanup:true}))
process.on('SIGINT', exitHandler.bind(null, {exit:true}))
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}))
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}))
process.on('uncaughtException', exitHandler.bind(null, {exit:true}))
