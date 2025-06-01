#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🌐 Network Setup for Garage Interface\n');

// Get network interfaces
const getNetworkAddresses = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name: name,
          address: iface.address
        });
      }
    }
  }
  
  return addresses;
};

const addresses = getNetworkAddresses();

if (addresses.length === 0) {
  console.log('❌ No network interfaces found. Are you connected to a network?');
  process.exit(1);
}

console.log('Found network interfaces:');
addresses.forEach(({ name, address }, index) => {
  console.log(`${index + 1}. ${name}: ${address}`);
});

// Get server IP from user or use first available
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\nWhich IP address should the server use?');
console.log('(Press Enter to use the first one, or type the number)\n');

rl.question('Choice: ', (answer) => {
  let selectedAddress;
  
  if (!answer || answer.trim() === '') {
    selectedAddress = addresses[0].address;
  } else {
    const index = parseInt(answer) - 1;
    if (index >= 0 && index < addresses.length) {
      selectedAddress = addresses[index].address;
    } else {
      console.log('Invalid choice. Using first address.');
      selectedAddress = addresses[0].address;
    }
  }

  console.log(`\n✅ Using IP address: ${selectedAddress}`);

  // Create .env files
  const frontendEnv = `# Network configuration
REACT_APP_API_URL=http://${selectedAddress}:5000
`;

  const backendEnv = `# Network configuration
PORT=5000
HOST=0.0.0.0
`;

  // Write frontend .env
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
  fs.writeFileSync(frontendEnvPath, frontendEnv);
  console.log(`\n✅ Created ${frontendEnvPath}`);

  // Write backend .env
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  fs.writeFileSync(backendEnvPath, backendEnv);
  console.log(`✅ Created ${backendEnvPath}`);

  console.log('\n📱 Network setup complete!\n');
  console.log('To access your garage interface:');
  console.log(`- From this machine: http://localhost:3000`);
  console.log(`- From other devices: http://${selectedAddress}:3000`);
  console.log('\nMake sure to:');
  console.log('1. Restart both frontend and backend servers');
  console.log('2. Allow ports 3000 and 5000 through your firewall');
  console.log('3. Ensure all devices are on the same network\n');

  rl.close();
});