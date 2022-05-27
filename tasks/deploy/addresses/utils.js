const { config: dotenvConfig } = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenvConfig({ path: path.resolve(__dirname, "../../../.env") });

console.log("DEPLOY_NETWORK: ", process.env.DEPLOY_NETWORK);

const network = () => {
  const { DEPLOY_NETWORK } = process.env;
  if (DEPLOY_NETWORK) return DEPLOY_NETWORK;
  return "bscTestnet";
};

const writeContractAddress = (contractFileName, address) => {
  const NETWORK = network();

  fs.writeFileSync(
    path.join(__dirname, `${NETWORK}/${contractFileName}.json`),
    JSON.stringify({
      address,
    })
  );
};

const readContractAddress = (contractFileName) => {
  const NETWORK = network();

  const rawData = fs.readFileSync(
    path.join(__dirname, `${NETWORK}/${contractFileName}.json`)
  );
  const info = JSON.parse(rawData.toString());

  return info.address;
};

module.exports = {
  writeContractAddress,
  readContractAddress,
};
