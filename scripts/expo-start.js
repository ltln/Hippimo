const { spawn } = require('node:child_process')

const args = process.argv.slice(2)
const expoBin = require.resolve('expo/bin/cli')

const child = spawn(process.execPath, [expoBin, ...args], {
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    EXPO_NO_DEPENDENCY_VALIDATION: '1',
  },
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})

