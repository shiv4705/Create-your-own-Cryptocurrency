var ShivToken = artifacts.require('./ShivToken.sol');
var ShivTokenSale = artifacts.require('./ShivTokenSale.sol');

contract('ShivTokenSale', function(accounts) {
    var tokenInstance;
    var tokenSaleInstance;
    var admin = accounts[0];
    var buyer = accounts[1];
    var tokenPrice = 1000000000000000; // in wei
    var tokensAvailable = 750000;
    var numberOfTokens;

    it('initialized the contract with the correct values', function() {
        return ShivTokenSale.deployed().then(function(instance) {
            tokenSaleInstance = instance;
            return tokenSaleInstance.address;
        }).then(function(address) {
            assert.notEqual(address, 0x0, 'has contract address');
            return tokenSaleInstance.tokenContract();
        }).then(function(address) {
            assert.notEqual(address, 0x0, 'has token contract address');
            return tokenSaleInstance.tokenPrice();
        }).then(function(price) {
            assert.equal(price, tokenPrice, 'token price is correct');
        });
    });

    it('facilitates token buying', function() {
        return ShivToken.deployed().then(function(instance) {
            tokenInstance = instance;
            return ShivTokenSale.deployed();
        }).then(function(instance) {
            tokenSaleInstance = instance;
            return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin });
        }).then(function(receipt) { 
            numberOfTokens = 10;
            return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice });
        }).then(function(receipt) {
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');
            assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
            assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
            return tokenSaleInstance.tokensSold();
        }).then(function(amount) {
            assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold');
            return tokenInstance.balanceOf(buyer);
        }).then(function(balance) {
            assert.equal(balance.toNumber(), numberOfTokens);
            return tokenInstance.balanceOf(tokenSaleInstance.address);
        }).then(function(balance) {
            assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens);
        })
        // Test buying more tokens than available
        .then(function() {
            return tokenSaleInstance.buyTokens(800000, { from: buyer, value: 800000 * tokenPrice });
        }).then(function() {
            assert.fail('Expected revert not received');
        }).catch(function(error) {
            assert(error.message.includes('revert'), 'Expected "revert", got: ' + error.message);
        });
    });

    it('ends token sale', function() {
    	return ShivToken.deployed().then(function(instance) {
        	tokenInstance = instance;
        	return ShivTokenSale.deployed();
    	}).then(function(instance) {
        	tokenSaleInstance = instance;
			// Attempt to end sale from non-admin account
        	return tokenSaleInstance.endSale({ from: buyer });
    	}).then(assert.fail).catch(function(error) {
        	assert(error.message.includes('revert'), 'must be admin to end sale');
        	// Now end sale as admin
        	return tokenSaleInstance.endSale({ from: admin });
    	}).then(function(receipt) {
        	return tokenInstance.balanceOf(admin);
    	}).then(function(balance) {
        	assert.equal(balance.toNumber(), 999990, 'returns all unsold tokens to admin');
	        // Check if token price reset (selfdestruct is removed)
    	    return tokenSaleInstance.tokenPrice();
    	}).then(function(price) {
        	assert.equal(price.toNumber(), 0, 'token price was reset');
    	});
	});

});