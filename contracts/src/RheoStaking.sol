// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RheoStaking
 * @author Rheo Finance
 * @notice Staking contract for native HTS RHEO tokens that distributes USDC dividends.
 */
contract RheoStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable rheoToken;
    IERC20 public immutable rewardToken; // USDC

    struct Staker {
        uint256 stakedAmount;
        uint256 rewardDebt;
    }

    mapping(address => Staker) public stakers;
    uint256 public totalStaked;
    uint256 public accRewardPerShare;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardAdded(uint256 amount);
    event TokenAssociated(address indexed token);

    constructor(address _rheoToken, address _rewardToken, address _initialOwner) Ownable(_initialOwner) {
        require(_rheoToken != address(0), "Invalid RHEO token");
        require(_rewardToken != address(0), "Invalid reward token");
        rheoToken = IERC20(_rheoToken);
        rewardToken = IERC20(_rewardToken);
    }

    /**
     * @notice Associates this contract with an HTS token.
     * @dev Must be called on Hedera for RHEO and USDC tokens before any transfers.
     */
    function associateToken(address token) external onlyOwner {
        address hts = address(0x167);
        (bool success, bytes memory result) = hts.call(
            abi.encodeWithSignature("associateToken(address,address)", address(this), token)
        );
        require(success, "HTS precompile call failed");
        int32 responseCode = abi.decode(result, (int32));
        require(responseCode == 22, "HTS association failed");
        emit TokenAssociated(token);
    }

    /**
     * @notice View function to see pending reward USDC for a user.
     */
    function pendingReward(address _user) public view returns (uint256) {
        Staker memory staker = stakers[_user];
        return (staker.stakedAmount * accRewardPerShare / 1e12) - staker.rewardDebt;
    }

    /**
     * @notice Stakes RHEO tokens to earn dividends.
     */
    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        
        Staker storage staker = stakers[msg.sender];
        
        // Claim pending rewards if any
        if (staker.stakedAmount > 0) {
            uint256 pending = pendingReward(msg.sender);
            if (pending > 0) {
                rewardToken.safeTransfer(msg.sender, pending);
                emit RewardClaimed(msg.sender, pending);
            }
        }

        // Pull RHEO tokens
        rheoToken.safeTransferFrom(msg.sender, address(this), _amount);
        staker.stakedAmount += _amount;
        totalStaked += _amount;

        staker.rewardDebt = staker.stakedAmount * accRewardPerShare / 1e12;
        emit Staked(msg.sender, _amount);
    }

    /**
     * @notice Withdraws staked RHEO tokens and claims accumulated dividends.
     */
    function withdraw(uint256 _amount) external nonReentrant {
        Staker storage staker = stakers[msg.sender];
        require(staker.stakedAmount >= _amount, "Withdraw amount exceeds staked");
        require(_amount > 0, "Amount must be > 0");

        uint256 pending = pendingReward(msg.sender);
        if (pending > 0) {
            rewardToken.safeTransfer(msg.sender, pending);
            emit RewardClaimed(msg.sender, pending);
        }

        staker.stakedAmount -= _amount;
        totalStaked -= _amount;
        
        // Return RHEO tokens
        rheoToken.safeTransfer(msg.sender, _amount);

        staker.rewardDebt = staker.stakedAmount * accRewardPerShare / 1e12;
        emit Withdrawn(msg.sender, _amount);
    }

    /**
     * @notice Claims accumulated USDC dividends without unstaking.
     */
    function claimRewards() external nonReentrant {
        Staker storage staker = stakers[msg.sender];
        uint256 pending = pendingReward(msg.sender);
        if (pending > 0) {
            rewardToken.safeTransfer(msg.sender, pending);
            staker.rewardDebt = staker.stakedAmount * accRewardPerShare / 1e12;
            emit RewardClaimed(msg.sender, pending);
        }
    }

    /**
     * @notice Notifies the contract of new USDC rewards.
     * @dev Transits USDC from caller to this contract and increases accRewardPerShare.
     */
    function notifyRewardAmount(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Reward must be > 0");
        rewardToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        if (totalStaked > 0) {
            accRewardPerShare += (_amount * 1e12) / totalStaked;
            emit RewardAdded(_amount);
        }
    }
}
