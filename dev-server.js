process.chdir(__dirname);
require('child_process').execSync('npx vite --host --port 5174', { stdio: 'inherit' });
