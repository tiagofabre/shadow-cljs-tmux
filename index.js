#! /usr/bin/env node
const pparams = process.argv.slice(2).join(' ')
const currentPath = process.cwd();
const spawn = require('child_process').spawn;
const options = {cwd: currentPath, shell: process.env.SHELL};
const shadow = require('child_process').spawn(`shadow-cljs ${pparams}`, options);

const gray = '#eff0f1'

function setBgColor (color) {
  spawn('tmux', ['set-option', 'status-left-bg', color])
  spawn('tmux', ['set-option', 'status-left-fg', 'black'])
}

setBgColor(gray)

function selectColor(data) {
  if(data.includes('Compiling')) {
    setBgColor("yellow")
  } else if (data.includes('Build completed')) {
    setBgColor("green")
  } else if (data.includes('Build failure')) {
    setBgColor("red")
  } else if (data.includes('running')) {
    setBgColor(gray)
  }
}

shadow.stdout.on('data', (data) => {
  selectColor(data)
  console.log(`${data}`)
})

shadow.stderr.on('data', (data) => {
  selectColor(data)
  console.log(`${data}`)
})

shadow.on('close', (code) => {
  console.log(`child process exited with code ${code}`)
})

function exitHandler(options, exitCode) {
  setBgColor('default')
  shadow.kill('SIGINT')
  process.exit()
}

process.on('exit', exitHandler.bind(null,{cleanup:true}))
process.on('SIGINT', exitHandler.bind(null, {exit:true}))
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}))
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}))
process.on('uncaughtException', exitHandler.bind(null, {exit:true}))
