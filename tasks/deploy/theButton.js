const { task } = require("hardhat/config");
const {
  readContractAddress,
  writeContractAddress,
} = require("./addresses/utils");
const cArguments = require("./arguments/theButton");

task("deploy:TheButton")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async (taskArguments, { ethers, upgrades }) => {
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    // deploy TheButton
    const TheButton = await ethers.getContractFactory(
      "TheButton",
      accounts[index]
    );

    const theButtonProxy = await upgrades.deployProxy(TheButton, [
      cArguments.START_TIME,
    ]);

    await theButtonProxy.deployed();

    writeContractAddress("theButtonProxy", theButtonProxy.address);
    console.log("TheButton proxy deployed to: ", theButtonProxy.address);

    const theButton = await upgrades.erc1967.getImplementationAddress(
      theButtonProxy.address
    );
    writeContractAddress("theButton", theButton);
    console.log("TheButton deployed to :", theButton);
  });

task("upgrade:TheButton")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async function (taskArguments, { ethers, upgrades }) {
    console.log("--- start upgrading the TheButton Contract ---");
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    // Use accounts[1] as the signer for the real roll
    const TheButton = await ethers.getContractFactory(
      "TheButton",
      accounts[index]
    );

    const theButtonProxyAddress = readContractAddress("theButtonProxy");

    const upgraded = await upgrades.upgradeProxy(
      theButtonProxyAddress,
      TheButton
    );

    console.log("TheButton upgraded to: ", upgraded.address);

    const theButton = await upgrades.erc1967.getImplementationAddress(
      upgraded.address
    );
    writeContractAddress("theButton", theButton);
    console.log("TheButton deployed to :", theButton);
  });

task("verify:TheButton").setAction(async (taskArguments, { run }) => {
  const address = readContractAddress("theButton");

  try {
    await run("verify:verify", {
      address,
      constructorArguments: [],
    });
  } catch (err) {
    console.log(err);
  }
});
