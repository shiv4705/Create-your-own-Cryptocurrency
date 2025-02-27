var ShivToken = artifacts.require("./ShivToken.sol");

module.exports = function(deployer) {
  deployer.deploy(ShivToken, 1000000);
};
