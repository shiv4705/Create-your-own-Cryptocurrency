pragma solidity ^0.4.2;

contract ShivToken {
	string public name = "Shiv Token";
	string public symbol = "SHIV";
	string public standard = "Shiv Token v1.0";
	uint256 public totalSupply;

	event Transfer(
		address indexed _from,
		address indexed _to,
		uint256 _value
	);

	mapping(address => uint256) public balanceOf;

	function ShivToken(uint256 _initialSupply) public {
		balanceOf[msg.sender] = _initialSupply;
		totalSupply = _initialSupply;
	}

	function transfer(address _to, uint256 _value) public returns (bool success) {
		require(balanceOf[msg.sender] >= _value);
		
		balanceOf[msg.sender] -= _value;
		balanceOf[_to] += _value;

		Transfer(msg.sender, _to, _value);

		return true;
	}

	
}
