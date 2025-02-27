const ShivToken = artifacts.require("ShivToken");

contract("ShivToken", (accounts) => {
    let tokenInstance;

    before(async () => {
        tokenInstance = await ShivToken.deployed();
    });

    it("initializes the contract with the correct values", async () => {
        const name = await tokenInstance.name();
        const symbol = await tokenInstance.symbol();
        const standard = await tokenInstance.standard();

        assert.equal(name, "Shiv Token", "Has the correct name");
        assert.equal(symbol, "SHIV", "Has the correct symbol");
        assert.equal(standard, "Shiv Token v1.0", "Has the correct standard");
    });

    it("allocates the initial supply upon deployment", async () => {
        const totalSupply = await tokenInstance.totalSupply();
        const adminBalance = await tokenInstance.balanceOf(accounts[0]);

        assert.equal(totalSupply.toNumber(), 1000000, "Sets the total supply to 1,000,000");
        assert.equal(adminBalance.toNumber(), 1000000, "Allocates the initial supply to the admin account");
    });

    it("transfers token ownership", async () => {
        try {
            await tokenInstance.transfer.call(accounts[1], 9999999);
            assert.fail("Expected throw not received");
        } catch (error) {
            assert(error.message.includes("revert"), "Error message must contain revert");
        }

        const success = await tokenInstance.transfer.call(accounts[1], 250000, { from: accounts[0] });
        assert.equal(success, true, "Returns true on successful transfer");

        const receipt = await tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] });
        assert.equal(receipt.logs.length, 1, "Triggers one event");
        assert.equal(receipt.logs[0].event, "Transfer", 'Should be the "Transfer" event');
        assert.equal(receipt.logs[0].args._from, accounts[0], "Logs the sender account");
        assert.equal(receipt.logs[0].args._to, accounts[1], "Logs the receiver account");
        assert.equal(receipt.logs[0].args._value.toNumber(), 250000, "Logs the transferred amount");

        const balanceReceiver = await tokenInstance.balanceOf(accounts[1]);
        assert.equal(balanceReceiver.toNumber(), 250000, "Adds amount to receiving account");
        
        const balanceSender = await tokenInstance.balanceOf(accounts[0]);
        assert.equal(balanceSender.toNumber(), 750000, "Deducts amount from sending account");
    });

    it("approves tokens for delegated transfer", async () => {
        const success = await tokenInstance.approve.call(accounts[1], 100);
        assert.equal(success, true, "Returns true on approval");

        const receipt = await tokenInstance.approve(accounts[1], 100, { from: accounts[0] });
        assert.equal(receipt.logs.length, 1, "Triggers one event");
        assert.equal(receipt.logs[0].event, "Approval", 'Should be the "Approval" event');
        assert.equal(receipt.logs[0].args._owner, accounts[0], "Logs the owner account");
        assert.equal(receipt.logs[0].args._spender, accounts[1], "Logs the spender account");
        assert.equal(receipt.logs[0].args._value.toNumber(), 100, "Logs the approved amount");

        const allowance = await tokenInstance.allowance(accounts[0], accounts[1]);
        assert.equal(allowance.toNumber(), 100, "Stores the allowance for delegated transfer");
    });

    it("handles delegated token transfers", async () => {
        let fromAccount = accounts[2];
        let toAccount = accounts[3];
        let spendingAccount = accounts[4];

        // Transfer some tokens to fromAccount
        await tokenInstance.transfer(fromAccount, 100, { from: accounts[0] });

        // Approve spendingAccount to spend 10 tokens from fromAccount
        await tokenInstance.approve(spendingAccount, 10, { from: fromAccount });

        // Try transferring tokens
        const success = await tokenInstance.transferFrom.call(fromAccount, toAccount, 10, { from: spendingAccount });
        assert.equal(success, true, "transferFrom should return true");

        const receipt = await tokenInstance.transferFrom(fromAccount, toAccount, 10, { from: spendingAccount });
        assert.equal(receipt.logs.length, 1, "Triggers one event");
        assert.equal(receipt.logs[0].event, "Transfer", 'Should be the "Transfer" event');
        assert.equal(receipt.logs[0].args._from, fromAccount, "Logs the sender account");
        assert.equal(receipt.logs[0].args._to, toAccount, "Logs the receiver account");
        assert.equal(receipt.logs[0].args._value.toNumber(), 10, "Logs the transferred amount");

        const balanceReceiver = await tokenInstance.balanceOf(toAccount);
        assert.equal(balanceReceiver.toNumber(), 10, "Adds the amount to receiving account");

        const balanceSender = await tokenInstance.balanceOf(fromAccount);
        assert.equal(balanceSender.toNumber(), 90, "Deducts amount from sending account");

        const newAllowance = await tokenInstance.allowance(fromAccount, spendingAccount);
        assert.equal(newAllowance.toNumber(), 0, "Deducts the spent amount from the allowance");
    });
});