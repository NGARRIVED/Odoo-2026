const { spawn } = require('child_process');

function start(label, args) {
  const child = spawn('npm', args, {
    stdio: 'inherit',
    shell: true
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  child.on('error', (error) => {
    console.error(`[${label}] failed to start:`, error);
    process.exitCode = 1;
  });

  return child;
}

const frontend = start('frontend', ['run', 'dev', '--workspace', '@assetflow/main-frontend']);
const backend = start('backend', ['run', 'dev', '--workspace', '@assetflow/main-backend']);

function shutdown(signal) {
  frontend.kill(signal);
  backend.kill(signal);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));