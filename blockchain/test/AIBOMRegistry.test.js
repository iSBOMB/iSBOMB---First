const { expect } = require("chai");

describe("AIBOMRegistry", function () {
  let registry, owner, dev;

  beforeEach(async function () {
    [owner, dev] = await ethers.getSigners();
    const AIBOMRegistry = await ethers.getContractFactory("AIBOMRegistry");
    registry = await AIBOMRegistry.deploy();
    await registry.deployed();
  });

  it("should register an AIBOM", async function () {
    const tx = await registry.connect(dev).registerAIBOM("QmTestCID");
    const receipt = await tx.wait();
    const modelId = await registry.nextModelId() - 1;
    const record = await registry.aiboms(modelId);

    expect(record.cid).to.equal("QmTestCID");
    expect(record.owner).to.equal(dev.address);
  });

  it("should allow developer to submit review", async function () {
    await registry.connect(dev).registerAIBOM("QmTestCID");
    await registry.connect(dev).submitReview(0, "QmDocCID");
    const record = await registry.aiboms(0);
    expect(record.status).to.equal(1); // SUBMITTED
  });

  it("should allow owner to change status", async function () {
    await registry.connect(dev).registerAIBOM("QmTestCID");
    await registry.connect(owner).setReviewStatus(0, 2); // IN_REVIEW
    const record = await registry.aiboms(0);
    expect(record.status).to.equal(2);
  });
});
