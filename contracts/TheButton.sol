//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "hardhat/console.sol";

contract TheButton is
    Initializable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    // CONSTANTS
    uint256 public constant EXPIRATION = 5 minutes;
    uint256 public constant CLAIMABLE_AMOUNT = 1 ether;
    // start time
    uint256 private startTime;
    // winner address
    address payable private winner;

    /**
     * @dev Initializer function
     * @param _startTime Auction start time
     */
    function initialize(uint256 _startTime) external initializer {
        __Context_init();
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        require(_startTime > block.timestamp, "invalid start time");

        startTime = _startTime;
    }

    /**
     * @notice to call this function, user must send 1 ETH,
     * @dev claim function
     */
    function claim() external payable whenNotPaused callerIsUser nonReentrant {
        refundIfOver(CLAIMABLE_AMOUNT);
        // Check if time is expired
        if (block.timestamp > startTime + EXPIRATION) {
            // transfer all ETH to the winner
            winner.transfer(address(this).balance);
            // reset start time
            startTime = block.timestamp;
        }
        // update winner
        winner = payable(msg.sender);
    }

    // INTERNAL METHODS
    function refundIfOver(uint256 _price) private {
        require(_price >= 0 && msg.value >= _price, "need to send more ETH");
        if (msg.value > _price) {
            payable(msg.sender).transfer(msg.value - _price);
        }
    }

    // MODIFIERS
    modifier callerIsUser() {
        require(tx.origin == msg.sender, "caller is not a user");
        _;
    }
}
