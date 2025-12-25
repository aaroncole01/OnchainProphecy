import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const signers = await hre.ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No signer configured. Set PRIVATE_KEY in your .env before deploying.");
  }

  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedProphecy = await deploy("OnchainProphecy", {
    from: deployer,
    log: true,
  });

  console.log(`OnchainProphecy contract: `, deployedProphecy.address);
};
export default func;
func.id = "deploy_onchain_prophecy"; // id required to prevent reexecution
func.tags = ["OnchainProphecy"];
