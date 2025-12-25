import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { OnchainProphecy, OnchainProphecy__factory } from "../types";

describe("OnchainProphecy", function () {
  let prophecy: OnchainProphecy;
  let prophecyAddress: string;
  const stake = ethers.parseEther("1");

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    const factory = (await ethers.getContractFactory("OnchainProphecy")) as OnchainProphecy__factory;
    prophecy = (await factory.deploy()) as OnchainProphecy;
    prophecyAddress = await prophecy.getAddress();
  });

  it("awards points on a correct prediction and refunds stake", async function () {
    const [, alice] = await ethers.getSigners();
    const priceGuess = 10_000_000_000n; // 100 * 1e8

    const encryptedInput = await fhevm
      .createEncryptedInput(prophecyAddress, alice.address)
      .add64(priceGuess)
      .add8(1)
      .encrypt();

    await prophecy.connect(alice).placePrediction(0, encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof, {
      value: stake,
    });

    await prophecy.updatePrices(12_000_000_000n, 0); // Price greater than guess

    const currentDay = await prophecy.getCurrentDay();
    await time.increase(24 * 60 * 60 + 1);

    await prophecy.connect(alice).confirmPrediction(currentDay, 0);

    const encryptedPoints = await prophecy.getUserPoints(alice.address);
    const clearPoints = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedPoints,
      prophecyAddress,
      alice,
    );

    expect(clearPoints).to.equal(stake);
    expect(await ethers.provider.getBalance(prophecyAddress)).to.equal(0);
  });

  it("does not add points on an incorrect prediction", async function () {
    const [, alice] = await ethers.getSigners();
    const priceGuess = 20_000_000_000n; // 200 * 1e8

    const encryptedInput = await fhevm
      .createEncryptedInput(prophecyAddress, alice.address)
      .add64(priceGuess)
      .add8(2) // Predict below
      .encrypt();

    await prophecy.connect(alice).placePrediction(1, encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof, {
      value: stake,
    });

    await prophecy.updatePrices(0, 25_000_000_000n); // BTC price above guess

    const currentDay = await prophecy.getCurrentDay();
    await time.increase(24 * 60 * 60 + 1);

    await prophecy.connect(alice).confirmPrediction(currentDay, 1);

    const encryptedPoints = await prophecy.getUserPoints(alice.address);
    const clearPoints = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedPoints,
      prophecyAddress,
      alice,
    );

    expect(clearPoints).to.equal(0);
  });

  it("prevents duplicate predictions for the same asset and day", async function () {
    const [, alice] = await ethers.getSigners();
    const encryptedInput = await fhevm.createEncryptedInput(prophecyAddress, alice.address).add64(1n).add8(1n).encrypt();

    const currentDay = await prophecy.getCurrentDay();

    await prophecy
      .connect(alice)
      .placePrediction(0, encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof, { value: stake });

    await expect(
      prophecy
        .connect(alice)
        .placePrediction(0, encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof, { value: stake }),
    ).to.be.revertedWithCustomError(prophecy, "PredictionExists").withArgs(currentDay, alice.address, 0);
  });

  it("requires price to be posted before confirming", async function () {
    const [, alice] = await ethers.getSigners();
    const encryptedInput = await fhevm.createEncryptedInput(prophecyAddress, alice.address).add64(1n).add8(1n).encrypt();

    const day = await prophecy.getCurrentDay();

    await prophecy
      .connect(alice)
      .placePrediction(0, encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof, { value: stake });

    await time.increase(24 * 60 * 60 + 1);

    await expect(prophecy.connect(alice).confirmPrediction(day, 0))
      .to.be.revertedWithCustomError(prophecy, "PriceNotRecorded")
      .withArgs(day);
  });

  it("prevents new predictions once the day is locked by prices", async function () {
    const [, alice] = await ethers.getSigners();
    const encryptedInput = await fhevm.createEncryptedInput(prophecyAddress, alice.address).add64(1n).add8(1n).encrypt();

    await prophecy.updatePrices(1, 1);

    await expect(
      prophecy
        .connect(alice)
        .placePrediction(0, encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof, { value: stake }),
    )
      .to.be.revertedWithCustomError(prophecy, "DayAlreadyLocked")
      .withArgs(await prophecy.getCurrentDay());
  });
});
