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
                return App.render();
            });
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
        });

        App.loading = false;
        loader.hide();
        content.show();
    }
}

$(function () {
    $(window).load(function () {
        App.init();
    })
});