import { ethers } from "hardhat";

async function main() {
  const AIBOMRegistry = await ethers.getContractFactory("AIBOMRegistry");
  const registry = await AIBOMRegistry.deploy();
  await registry.deployed();

  console.log("✅ AIBOMRegistry deployed to:", registry.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
