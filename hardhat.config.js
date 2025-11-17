require('@nomiclabs/hardhat-ethers');
module.exports = {
  solidity: '0.8.17',
  networks: {
    base: {
      url: process.env.RPC_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453
    }
  }
};
