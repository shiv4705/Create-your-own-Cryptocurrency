var ShivToken = artifacts.require("./ShivToken.sol");
var ShivTokenSale = artifacts.require("./ShivTokenSale.sol");

module.exports = function(deployer) {
  deployer.deploy(ShivToken, 1000000).then(function() {
    //Token price is 0.001 Ether
    var tokenPrice = 1000000000000000;
    return deployer.deploy(ShivTokenSale, ShivToken.address, tokenPrice);
  });
};
