// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title OwnerWallet
/// @notice Holds ETH and allows only the owner to send it.
contract OwnerWallet {
    address public owner;

    event DepositReceived(address indexed sender, uint256 amount);
    event FundsSent(address indexed recipient, uint256 amount);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    receive() external payable {
        emit DepositReceived(msg.sender, msg.value);
    }

    function sendFunds(
        address payable recipient,
        uint256 amount
    ) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(address(this).balance >= amount, "Insufficient balance");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsSent(recipient, amount);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");

        address previousOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function walletBalance() external view returns (uint256) {
        return address(this).balance;
    }
}