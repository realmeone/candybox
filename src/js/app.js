
App = {
  contract: null, 
  owners: [],
  airdropABI: [
    {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "token",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "_addressOfToken",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "CandySent",
      "type": "event"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "dests",
          "type": "address[]"
        },
        {
          "name": "values",
          "type": "uint256[]"
        }
      ],
      "name": "sendCandy",
      "outputs": [
        {
          "name": "success",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      web3 = new Web3(web3.currentProvider);
    } else {
      // Set the provider you want from Web3.providers
      web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
    if (!web3) alert('please install metamask extension first');

    return App.initEnv();
  },

  initEnv: function() {
    var netId = web3.version.network;
    var netName = null;
    switch (netId) {
      case "1":
        netName = "Mainnet";
        break;
      case "2":
        netName = "Morden Test Network(Deprecated!)";
        break;
      case "3":
        netName = "Ropsten Test Network";
        break;
      case "4":
        netName = "Rinkeby Test Network";
        break;
      case "42":
        netName = "Kovan Test Network";
        break;
    }
    if (netName) $('#network').val(netName);
    else $('#network_hint').text("Watch OOOOOut!!! Unknown network!!! Please check your metamask.");

    var account = web3.eth.accounts[0];
    if (!account) $('#logined_address_hint').text("please unlock your metamask and refresh this page!!");
    $('#logined_address').val(web3.eth.accounts[0]);

    if (account) {
      web3.eth.getBalance(account, function(err, amount) {
        if (!err) $('#logined_address_balance').val(web3.fromWei(amount, 'ether') + " ETH");
      });
    }

    return App.bindEvents();
  },

  bindEvents: function() {
    // $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '#load_contract_address', App.handleLoadTokenContract);
    $(document).on('click', '#load_owner_file', App.handleLoadOwnerFile);
    $(document).on('click', '#do_airdrop', App.handleAirdrop);
  },

  handleLoadOwnerFile: function(event) {
    event.preventDefault();
    var xlsFile = $('#owner_file').prop('files')[0];
    if (!xlsFile) {
      alert('Please choose a excel file first');
      return;
    }
    if (!xlsFile.type.includes('sheet')) {
      alert('The file is not a right excel file, Please choose a excel file first');
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        var data = e.target.result;
        var wb = XLSX.read(data, {type: 'binary'});
        var sheet_name_list = wb.SheetNames;
        App.owners = XLSX.utils.sheet_to_json(wb.Sheets[sheet_name_list[0]]);
        console.log(App.owners);
        var tbody = $('#owner_list');
        tbody.html('');
        for (var i = 0, length = App.owners.length; i < length; i++) {
          var item = App.owners[i];
          tbody.append('<tr><th scope="row">' + i + '</th><td>' + item.Address + '</td><td>' + item.Amount + '</td></tr>');
        }
    };
    reader.readAsBinaryString(xlsFile);
  },

  handleLoadTokenContract: function(event) {
    event.preventDefault();
    var address = $('#contract_address').val();
    if (!web3.isAddress(address)) {
      alert('address not right!');
      return;
    }

    try {
      var contract = web3.eth.contract(App.airdropABI);
      App.contract = contract.at(address);
      alert("contract load success!!");
    } catch(err) {
      if (err.message.includes('JSON')) alert('The ABI you input is not the JSON Format.');
      else alert('contract load fail!please check your contract abi and address.');
      console.log(err);
    }
  },

  handleAirdrop: function(event) {
    event.preventDefault();
    if (App.contract === null) {
      alert('Please load contract at No.2 step');
      return;
    }
    $('#do_airdrop').text('Sending Transactions ...');
    $('#do_airdrop').prop("disabled", true);

    var _owners = [];
    var _amounts = [];
    for (var i = 0, length = App.owners.length; i < length; i++) {
      var item = App.owners[i];
      _owners.push(item.Address);
      _amounts.push(web3.toWei(item.Amount, 'ether'));
    }

    if (_owners.length == 0 || _owners.length != _amounts.length) {
      alert("Data is wrong!Please check the Excel file");
      return;
    }

    App.contract.sendCandy(_owners,_amounts, {from: web3.eth.accounts[0]}, function(err, result) {
      var css = 'alert alert-danger';
      var text = 'Transaction fail!!!Please check your data.';
      if (!err) {
        css = 'alert alert-success';
        text = 'Transaction already sent.Please check the etherscan. Tx[' + result + ']';
      } 
      $('#airdrop_result').removeClass().addClass(css).html(text);
    
      $('#do_airdrop').removeAttr('disabled');
      $('#do_airdrop').text('Do Airdrop!');
    });

  }
};

$(function() {
  $(window).on('load', function() {
    App.init();
  });
});
