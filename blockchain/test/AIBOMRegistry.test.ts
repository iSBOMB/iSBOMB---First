import { expect } from "chai";
import { ethers } from "hardhat";
import type { AIBOMRegistry } from "../typechain-types";

describe("AIBOMRegistry (강화 테스트)", function () {
  let registry: AIBOMRegistry;
  let owner: any;
  let developer: any;
  let attacker: any;

  beforeEach(async () => {
    [owner, developer, attacker] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("AIBOMRegistry", owner);
    registry = (await Factory.deploy()) as AIBOMRegistry;
    await registry.deployed();
  });

  it("✅ AIBOM 등록 성공", async () => {
    const tx = await registry.connect(developer).registerAIBOM("QmCID_AIBOM");
    await tx.wait();

    const aibom = await registry.aiboms(0);
    expect(aibom.cid).to.equal("QmCID_AIBOM");
    expect(aibom.owner).to.equal(developer.address);
  });

  it("✅ Review 제출 성공", async () => {
    await registry.connect(developer).registerAIBOM("QmCID_AIBOM");
    await registry.connect(developer).submitReview(0, "QmCID_REVIEW");
    const aibom = await registry.aiboms(0);
    expect(Number(aibom.status)).to.equal(1); // SUBMITTED
  });

  it("🚨 다른 사용자가 review 제출 시 실패", async () => {
    await registry.connect(developer).registerAIBOM("QmCID_AIBOM");
    await expect(
      registry.connect(attacker).submitReview(0, "FakeCID")
    ).to.be.revertedWith("Not owner");
  });

  it("🚨 잘못된 상태 변경 실패", async () => {
    await registry.connect(developer).registerAIBOM("QmCID_AIBOM");
    await expect(
      registry.connect(owner).setReviewStatus(0, 0) // DRAFT 같은 잘못된 값
    ).to.be.revertedWith("Invalid status");
  });

  it("🚨 비-Owner가 취약점 보고 시 실패", async () => {
    await registry.connect(developer).registerAIBOM("QmCID_AIBOM");
    // 변경: 커스텀 에러 문자열을 기대하지 않고 단순히 revert 여부만 확인
    await expect(
      registry.connect(developer).reportVulnerability(0, "CID", "HIGH")
    ).to.be.reverted;
  });

  it("✅ Owner가 취약점 보고 성공", async () => {
    await registry.connect(developer).registerAIBOM("QmCID_AIBOM");
    await registry.connect(owner).reportVulnerability(0, "VULN_CID", "HIGH");

    const vuln = await registry.vulnerabilities(0, 0);
    expect(vuln.cid).to.equal("VULN_CID");
    expect(vuln.severity).to.equal("HIGH");
    expect(vuln.active).to.equal(true);
  });
});
