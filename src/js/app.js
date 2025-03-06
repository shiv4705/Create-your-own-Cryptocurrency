App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    loading: false,
    tokenPrice: 1000000000000000,
    tokensSold: 0,
    tokensAvailable: 750000,

    init: function () {
        console.log('App initialized');
        return App.initWeb3();
    },

    initWeb3: function () {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }
        return App.initContract();
    },

    initContract: function () {
        $.getJSON('ShivTokenSale.json', function (data) {
            App.contracts.ShivTokenSale = TruffleContract(data);
            App.contracts.ShivTokenSale.setProvider(App.web3Provider);
            App.contracts.ShivTokenSale.deployed().then(function (shivTokenSaleInstance) {
                console.log('Shiv Token Sale Address:', shivTokenSaleInstance.address);
            });
        }).done(function () {
            $.getJSON('ShivToken.json', function (data) {
                App.contracts.ShivToken = TruffleContract(data);
                App.contracts.ShivToken.setProvider(App.web3Provider);
                App.contracts.ShivToken.deployed().then(function (shivTokenInstance) {
                    console.log('Shiv Token Address:', shivTokenInstance.address);
                });
                App.listenForEvents();
                return App.render();
            });
        })
    },

    //Listen for events emitted from the contract
    listenForEvents: function () {
        App.contracts.ShivTokenSale.deployed().then(function (instance) {
            instance.Sell({}, {
                fromBlock: 0,
                toBlock: 'latest',
            }).watch(function (error, event) {
                console.log('event triggered', event);
                App.render();
            })
        })
    },

    render: function () {
        if (App.loading) {
            return;
        }
        App.loading = true;

        var loader = $('#loader');
        var content = $('#content');

        loader.show();
        content.hide();
        // Load Account Data
        web3.eth.getAccounts(function (err, accounts) {
            if (err !== null) {
                console.error('Error getting accounts:', err);
                return;
            }
            if (accounts.length === 0) {
                console.error('No accounts found.');
                return;
            }
            console.log('Accounts:', accounts);
            App.account = accounts[0];
            $('#accountAddress').html('Your Account: ' + App.account);
        })

        App.contracts.ShivTokenSale.deployed().then(function (Instance) {
            shivTokenSaleInstance = Instance;
            return shivTokenSaleInstance.tokenPrice();
        }).then(function (tokenPrice) {
            App.tokenPrice = tokenPrice;
            $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
            return shivTokenSaleInstance.tokensSold();
        }).then(function (tokensSold) {
            App.tokensSold = tokensSold.toNumber();
            $('.tokens-sold').html(App.tokensSold);
            $('.tokens-available').html(App.tokensAvailable);

            var progressPercent = (App.tokensSold / App.tokensAvailable) * 100;
            $('#progress').css('width', progressPercent + '%');

            // Load Token Contract
            App.contracts.ShivToken.deployed().then(function (Instance) {
                shivTokenInstance = Instance;
                return shivTokenInstance.balanceOf(App.account);
            }).then(function (balance) {
                $('.shiv-balance').html(balance.toNumber());
                App.loading = false;
                loader.hide();
                content.show();
            })
        });
    },

    buyTokens: function () {
        $('#content').hide();
        $('#loader').show();
        var numberOfTokens = $('#numberOfToken').val(); // Corrected the ID to match the HTML
        App.contracts.ShivTokenSale.deployed().then(function (Instance) {
            return Instance.buyTokens(numberOfTokens, {
                from: App.account,
                value: numberOfTokens * App.tokenPrice,
                gas: 500000
            });
        }).then(function (result) {
            console.log('Tokens bought...');
            $('form').trigger('reset'); // Reset number of tokens in form
            // Wait for Sell event
        }).catch(function (error) {
            console.error('Error buying tokens:', error);
            $('#loader').hide();
            $('#content').show();
        });
    }
}

$(function () {
    $(window).load(function () {
        App.init();
    })
});