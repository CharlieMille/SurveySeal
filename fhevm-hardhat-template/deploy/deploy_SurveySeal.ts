import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedSurveySeal = await deploy("SurveySeal", {
    from: deployer,
    log: true,
  });

  console.log(`SurveySeal contract: `, deployedSurveySeal.address);
};
export default func;
func.id = "deploy_surveySeal"; // id required to prevent reexecution
func.tags = ["SurveySeal"];


