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

    // EVENTS
    event RewardClaimed(address indexed receiver, uint256 amount);

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
        require(startTime <= block.timestamp, "not started yet");
        refundIfOver(CLAIMABLE_AMOUNT);

        address payable _winner = winner;
        // Check if time is expired
        if (block.timestamp > startTime + EXPIRATION) {
            // reset start time
            startTime = block.timestamp;
            // check if winner is set
            // no need to revert if winner is not set yet
            // we just need to start the auction from there
            if (_winner != address(0)) {
                // transfer unclaimed amount ETH in previous round to the winner
                uint256 balance = address(this).balance;
                _winner.transfer(balance - CLAIMABLE_AMOUNT);

                emit RewardClaimed(_winner, balance);
            }
        }
        // update winner
        winner = payable(msg.sender);
    }

    /**
     * @notice owner function to withdraw current funds to the current winner
     * This is for the owner to withdraw remaining funds to the winner if no longer accept bidders
     */
    function withdrawToWinner() external onlyOwner {
        // no need to check if winner is set or not
        winner.transfer(address(this).balance);
        startTime = block.timestamp;
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
