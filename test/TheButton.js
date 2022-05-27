const { artifacts, ethers, waffle } = require("hardhat");
const { expect } = require("chai");

const DELAY = 100;
const EXPIRATION_TIME = 300;

const deployTheButton = async (signer) => {
  const ARGS = [];

  const theButtonArtifact = await artifacts.readArtifact("TheButton");
  return await waffle.deployContract(signer, theButtonArtifact, ARGS);
};

describe("TheButton", function () {
  before(async function () {
    this.signers = {};

    const signers = await ethers.getSigners();
    this.signers.owner = signers[0];
    this.signers.karl = signers[1];
    this.signers.justin = signers[2];

    this.signers.andy = signers[3];
    this.signers.bell = signers[4];
    this.signers.john = signers[5];

    // Deploy TheButton
    this.theButton = await deployTheButton(this.signers.owner);
    // initialize TheButton
    const START_TIME = Math.floor(new Date().getTime() / 1000);
    await this.theButton.initialize(START_TIME + 1);
  });

  describe("Claim", async function () {
    it("should revert if not started", async function () {
      // Karl tried to claim before start
      const tx = this.theButton
        .connect(this.signers.karl)
        .claim({ value: ethers.utils.parseEther("1") });
      await expect(tx).to.be.revertedWith("not started yet");
    });

    it("should claim and refund if over", async function () {
      // We fast forward
      await ethers.provider.send("evm_increaseTime", [DELAY + 1]);
      await ethers.provider.send("evm_mine");
      // Karl tried to claim
      await expect(() =>
        this.theButton
          .connect(this.signers.karl)
          .claim({ value: ethers.utils.parseEther("1.5") })
      ).to.changeEtherBalance(this.signers.karl, ethers.utils.parseEther("-1"));
      // check contract balance
      const balance = await ethers.provider.getBalance(this.theButton.address);
      expect(balance).to.equal(ethers.utils.parseEther("1"));
    });

    it("should reward to winner", async function () {
      // Karl tried to claim
      await this.theButton
        .connect(this.signers.karl)
        .claim({ value: ethers.utils.parseEther("1") });
      // Justin tried to claim
      await this.theButton
        .connect(this.signers.justin)
        .claim({ value: ethers.utils.parseEther("1") });
      // We fast forward
      await ethers.provider.send("evm_increaseTime", [EXPIRATION_TIME + 1]);
      await ethers.provider.send("evm_mine");
      // Bell tried to claim
      await expect(() =>
        this.theButton
          .connect(this.signers.bell)
          .claim({ value: ethers.utils.parseEther("1") })
      ).to.changeEtherBalance(
        this.signers.justin,
        ethers.utils.parseEther("3")
      );
      // check contract balance
      const balance = await ethers.provider.getBalance(this.theButton.address);
      expect(balance).to.equal(ethers.utils.parseEther("1"));
    });

    it("should emit RewardClaimed event", async function () {
      // Karl tried to claim
      await this.theButton
        .connect(this.signers.karl)
        .claim({ value: ethers.utils.parseEther("1") });
      // Justin tried to claim
      await this.theButton
        .connect(this.signers.justin)
        .claim({ value: ethers.utils.parseEther("1") });
      // We fast forward
      await ethers.provider.send("evm_increaseTime", [EXPIRATION_TIME + 1]);
      await ethers.provider.send("evm_mine");
      // Bell tried to claim
      const tx = this.theButton
        .connect(this.signers.bell)
        .claim({ value: ethers.utils.parseEther("1") });
      await expect(tx)
        .to.be.emit(this.theButton, "RewardClaimed")
        .withArgs(this.signers.justin.address, ethers.utils.parseEther("4"));
    });
  });
});
