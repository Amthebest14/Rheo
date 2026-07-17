// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface ISAUCE {
    function mint(address to, uint256 amount) external;
}

contract SaucerSwapYieldFarm is Ownable {
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
    }

    struct PoolInfo {
        IERC20 lpToken;
        uint256 allocPoint;
        uint256 lastRewardTime;
        uint256 accSaucePerShare;
    }

    ISAUCE public sauce;
    uint256 public saucePerSecond;

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    uint256 public totalAllocPoint;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    
    constructor(address _sauce, uint256 _saucePerSecond) Ownable(msg.sender) {
        sauce = ISAUCE(_sauce);
        saucePerSecond = _saucePerSecond;
    }

    function add(uint256 _allocPoint, IERC20 _lpToken) public onlyOwner {
        uint256 lastRewardTime = block.timestamp;
        totalAllocPoint += _allocPoint;
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardTime: lastRewardTime,
            accSaucePerShare: 0
        }));
    }

    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.timestamp <= pool.lastRewardTime) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0 || pool.allocPoint == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }
        uint256 multiplier = block.timestamp - pool.lastRewardTime;
        uint256 sauceReward = (multiplier * saucePerSecond * pool.allocPoint) / totalAllocPoint;
        
        sauce.mint(address(this), sauceReward);
        
        pool.accSaucePerShare += (sauceReward * 1e12) / lpSupply;
        pool.lastRewardTime = block.timestamp;
    }

    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accSaucePerShare = pool.accSaucePerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        
        if (block.timestamp > pool.lastRewardTime && lpSupply != 0) {
            uint256 multiplier = block.timestamp - pool.lastRewardTime;
            uint256 sauceReward = (multiplier * saucePerSecond * pool.allocPoint) / totalAllocPoint;
            accSaucePerShare += (sauceReward * 1e12) / lpSupply;
        }
        
        return (user.amount * accSaucePerShare / 1e12) - user.rewardDebt;
    }

    function deposit(uint256 _pid, uint256 _amount) public payable {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accSaucePerShare / 1e12) - user.rewardDebt;
            if (pending > 0) {
                IERC20(address(sauce)).transfer(msg.sender, pending);
            }
        }
        
        if (_amount > 0) {
            pool.lpToken.transferFrom(address(msg.sender), address(this), _amount);
            user.amount += _amount;
        }
        
        user.rewardDebt = (user.amount * pool.accSaucePerShare) / 1e12;
        emit Deposit(msg.sender, _pid, _amount);
    }

    function withdraw(uint256 _pid, uint256 _amount) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        
        uint256 pending = (user.amount * pool.accSaucePerShare / 1e12) - user.rewardDebt;
        if (pending > 0) {
            IERC20(address(sauce)).transfer(msg.sender, pending);
        }
        
        if (_amount > 0) {
            user.amount -= _amount;
            pool.lpToken.transfer(address(msg.sender), _amount);
        }
        
        user.rewardDebt = (user.amount * pool.accSaucePerShare) / 1e12;
        emit Withdraw(msg.sender, _pid, _amount);
    }

    function depositFee() external pure returns (uint256) {
        return 0; // our clone doesn't charge a fee
    }
}
