import hre from "hardhat";

async function main() {
  console.log("Starting deployment for VCFileVault Smart Contract...");

  // Compile contract
  const VCFileVault = await hre.ethers.getContractFactory("VCFileVault");
  
  // Deploy the contract
  const fileVault = await VCFileVault.deploy();
  await fileVault.waitForDeployment();
  
  const address = await fileVault.getAddress();
  
  console.log("-----------------------------------------");
  console.log(`✅ VCFileVault correctly deployed to: ${address}`);
  console.log("✅ The blockchain layer is now fully operational!");
  console.log("-----------------------------------------");
  console.log("Note: Add this address to your backend/frontend .env file under CONTRACT_ADDRESS");
}

main().catch((error) => {
  console.error("🛑 Error deploying contract:", error);
  process.exitCode = 1;
});
