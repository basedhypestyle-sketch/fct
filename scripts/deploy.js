async function main(){
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with', deployer.address);
  const F = await ethers.getContractFactory('FIDGhost');
  const f = await F.deploy();
  await f.deployed();
  console.log('FIDGhost deployed to:', f.address);
}
main().catch(e=>{console.error(e); process.exit(1);});
