import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import { spawn } from 'child_process';

const start = async () => {
  console.log('Starting shared MongoMemoryServer...');
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  console.log('Shared MongoDB URI:', uri);
  
  // Update .env with the temporary URI so both next.js and express see it.
  // We will append it to .env
  let envContent = fs.readFileSync('.env', 'utf-8');
  
  // Remove any existing MONGODB_URI/MONGO_URI to prevent conflicts
  envContent = envContent.replace(/^MONGODB_URI=.*$/gm, '');
  envContent = envContent.replace(/^MONGO_URI=.*$/gm, '');
  
  envContent += `\nMONGODB_URI="${uri}"\nMONGO_URI="${uri}"\n`;
  fs.writeFileSync('.env', envContent);
  console.log('.env updated with shared MongoDB URI');

  const child = spawn('npm', ['run', 'start'], {
    stdio: 'inherit',
    shell: true
  });
  
  child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
    process.exit(code);
  });
};

start();
