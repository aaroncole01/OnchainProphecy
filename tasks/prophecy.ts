import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:prophecy-address", "Prints the OnchainProphecy address").setAction(async function (_args: TaskArguments, hre) {
  const { deployments } = hre;
  const prophecy = await deployments.get("OnchainProphecy");
  console.log("OnchainProphecy address is " + prophecy.address);
});

task("task:update-prices", "Owner: set daily prices (scaled by contract PRICE_DECIMALS)")
  .addParam("eth", "ETH price scaled by PRICE_DECIMALS")
  .addParam("btc", "BTC price scaled by PRICE_DECIMALS")
  .addOptionalParam("address", "Override contract address")
  .setAction(async function (args: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const ethPrice = BigInt(args.eth);
    const btcPrice = BigInt(args.btc);

    const contractDeployment = args.address ? { address: args.address } : await deployments.get("OnchainProphecy");
    const [signer] = await ethers.getSigners();
    const prophecy = await ethers.getContractAt("OnchainProphecy", contractDeployment.address);

    const tx = await prophecy.connect(signer).updatePrices(ethPrice, btcPrice);
    console.log(`updatePrices tx=${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`status=${receipt?.status} day=${await prophecy.lastRecordedDay()}`);
  });

task("task:place-prediction", "Submit encrypted prediction for today")
  .addParam("asset", "Asset to predict: eth or btc")
  .addParam("price", "Predicted price threshold scaled by PRICE_DECIMALS (uint64 max)")
  .addParam("direction", "1 for above, 2 for below")
  .addParam("stake", "Stake amount in ETH")
  .addOptionalParam("address", "Override contract address")
  .setAction(async function (args: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const asset = args.asset.toLowerCase() === "btc" ? 1 : 0;
    const price = BigInt(args.price);
    const direction = BigInt(args.direction);
    const stake = ethers.parseEther(args.stake);

    const contractDeployment = args.address ? { address: args.address } : await deployments.get("OnchainProphecy");
    const prophecy = await ethers.getContractAt("OnchainProphecy", contractDeployment.address);
    const [signer] = await ethers.getSigners();

    const input = fhevm.createEncryptedInput(contractDeployment.address, signer.address);
    input.add64(price);
    input.add8(direction);
    const encrypted = await input.encrypt();

    const tx = await prophecy
      .connect(signer)
      .placePrediction(asset, encrypted.handles[0], encrypted.handles[1], encrypted.inputProof, { value: stake });

    console.log(`placePrediction tx=${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`status=${receipt?.status} day=${await prophecy.getCurrentDay()}`);
  });

task("task:confirm-prediction", "Resolve a prediction for a past day")
  .addParam("day", "Day index to resolve")
  .addParam("asset", "Asset to resolve: eth or btc")
  .addOptionalParam("address", "Override contract address")
  .setAction(async function (args: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const asset = args.asset.toLowerCase() === "btc" ? 1 : 0;
    const day = BigInt(args.day);

    const contractDeployment = args.address ? { address: args.address } : await deployments.get("OnchainProphecy");
    const prophecy = await ethers.getContractAt("OnchainProphecy", contractDeployment.address);
    const [signer] = await ethers.getSigners();

    const tx = await prophecy.connect(signer).confirmPrediction(day, asset);
    console.log(`confirmPrediction tx=${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`status=${receipt?.status}`);
  });

task("task:decrypt-points", "Decrypt user points for the first signer")
  .addOptionalParam("address", "Override contract address")
  .setAction(async function (args: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const contractDeployment = args.address ? { address: args.address } : await deployments.get("OnchainProphecy");
    const prophecy = await ethers.getContractAt("OnchainProphecy", contractDeployment.address);
    const [signer] = await ethers.getSigners();

    const encryptedPoints = await prophecy.getUserPoints(signer.address);
    if (encryptedPoints === ethers.ZeroHash) {
      console.log("Points: 0");
      return;
    }

    const clearPoints = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedPoints,
      contractDeployment.address,
      signer,
    );
    console.log(`Points handle=${encryptedPoints} clear=${clearPoints}`);
  });
