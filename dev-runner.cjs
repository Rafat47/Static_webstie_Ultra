// dev-runner.cjs
// Keeps stdin pipe open to prevent Netlify CLI from exiting on background stdin EOF
const { spawn } = require('child_process');

const child = spawn('npx', ['netlify', 'dev', '--offline'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  cwd: __dirname,
  env: process.env,
  shell: true
});

child.on('exit', (code) => {
  console.log(`[Netlify Dev Storefront] Exited with code ${code}`);
  process.exit(code || 0);
});

process.on('SIGINT', () => child.kill());
process.on('SIGTERM', () => child.kill());

// Keep event loop active
setInterval(() => {}, 3600000);
