import { ethers } from "hardhat";
import type { ContractReceipt, Event } from "ethers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { AIBOMRegistry } from "../typechain-types";

async function main() {
  // 배포된 주소가 있으면 여기에, 없으면 deploy 스크립트로 배포 후 이 주소로 교체
  const deployedAddress = "0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8";
  const [deployer, dev] = await ethers.getSigners() as unknown as SignerWithAddress[];

  const registry = (await ethers.getContractAt("AIBOMRegistry", deployedAddress)) as unknown as AIBOMRegistry;

  console.log("Deployer(owner):", deployer.address);
  console.log("Developer:", dev.address);

  // 1. register
  const txReg = await registry.connect(dev).registerAIBOM("Qm12345TestCID");
  const receiptReg: ContractReceipt = await txReg.wait();
  const events = receiptReg.events ?? [];
  const regArgs = events.length > 0 ? events[0].args : null;
  const modelId = regArgs?.modelId ? regArgs.modelId.toNumber() : (regArgs ? regArgs[0].toNumber() : 0);
  console.log("Registered modelId:", modelId, "event args:", regArgs ? regArgs : "none");

  // 2. submit review
  const txSubmit = await registry.connect(dev).submitReview(modelId, "Qm12345ReviewCID");
  await txSubmit.wait();
  console.log("Review submitted for modelId:", modelId);

  // defensive read
  const aibomBefore = await registry.aiboms(modelId);
  console.log("Status before:", aibomBefore.status.toString());

  // 3. owner sets status -> IN_REVIEW (2)
  const IN_REVIEW = 2;
  try {
    // callStatic to pre-check will throw if revert
    await registry.connect(deployer).callStatic.setReviewStatus(modelId, IN_REVIEW);
    const tx3 = await registry.connect(deployer).setReviewStatus(modelId, IN_REVIEW);
    await tx3.wait();
    console.log("Status set to IN_REVIEW");
  } catch (err: any) {
    console.error("setReviewStatus failed:", err?.message ?? err);
    return;
  }

  // 4. owner reports vulnerability
  try {
    const txV = await registry.connect(deployer).reportVulnerability(modelId, "QmCID_VULN_789", "HIGH");
    await txV.wait();
    console.log("Vulnerability reported");
  } catch (err: any) {
    console.error("reportVulnerability failed:", err?.message ?? err);
  }

  // read back
  const aibomFinal = await registry.aiboms(modelId);
  console.log("AIBOM final:", {
    owner: aibomFinal.owner,
    cid: aibomFinal.cid,
    status: aibomFinal.status.toString(),
    timestamp: aibomFinal.timestamp.toString()
  });

  try {
    const vuln0 = await registry.vulnerabilities(modelId, 0);
    console.log("Vulnerability[0]:", { cid: vuln0.cid, severity: vuln0.severity, active: vuln0.active });
  } catch {
    console.log("No vulnerability recorded (or out of bounds).");
  }
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exitCode = 1;
});
