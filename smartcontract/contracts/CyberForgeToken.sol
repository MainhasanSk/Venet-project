


// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// contract CyberForgeToken {
//     string private _name = "Safe Driving Coin";
//     string private _symbol = "SDC";
//     uint8 private _decimals = 18;
//     uint256 private _totalSupply;
//     uint256 private _initialSupply = 1000; // Changed to 1000 CFT
    
//     mapping(address => uint256) private balances;
//     mapping(address => uint256) public drivingPoints;
    
//     event Transfer(address indexed from, address indexed to, uint256 value);
//     event Mint(address indexed to, uint256 amount);
//     event DrivingPointsUpdated(address indexed user, uint256 points);
    
//     constructor() {
//         _totalSupply = _initialSupply * 10 ** uint256(_decimals);
//         balances[msg.sender] = _totalSupply;
//         emit Transfer(address(0), msg.sender, _totalSupply);
//     }
    
//     function name() public view returns (string memory) {
//         return _name;
//     }
    
//     function symbol() public view returns (string memory) {
//         return _symbol;
//     }
    
//     function decimals() public view returns (uint8) {
//         return _decimals;
//     }
    
//     function totalSupply() public view returns (uint256) {
//         return _totalSupply;
//     }
    
//     function balanceOf(address account) public view returns (uint256) {
//         return balances[account];
//     }
    
//     function transfer(address recipient, uint256 amount) public returns (bool) {
//         require(recipient != address(0), "Cannot transfer to zero address");
//         require(balances[msg.sender] >= amount, "Insufficient balance");
        
//         balances[msg.sender] -= amount;
//         balances[recipient] += amount;
//         emit Transfer(msg.sender, recipient, amount);
//         return true;
//     }
    
//     // Update driving points - this only accepts positive values as input
//     function setDrivingPoints(address user, uint256 points) public {
//         drivingPoints[user] = points;
//         emit DrivingPointsUpdated(user, points);
//     }
    
//     // Mint tokens based on driving points - 100 points = 1 CFT
//     function mintFromDrivingPoints() public {
//         require(drivingPoints[msg.sender] >= 100, "You need at least 100 driving points to mint");
        
//         // Calculate how many tokens to mint (100 points = 1 token)
//         uint256 tokensToMint = (drivingPoints[msg.sender] / 100) * 10 ** uint256(_decimals);
//         uint256 pointsUsed = (drivingPoints[msg.sender] / 100) * 100;
        
//         // Update driving points (subtract used points)
//         drivingPoints[msg.sender] -= pointsUsed;
        
//         // Mint tokens
//         balances[msg.sender] += tokensToMint;
//         _totalSupply += tokensToMint;
        
//         emit Mint(msg.sender, tokensToMint);
//         emit Transfer(address(0), msg.sender, tokensToMint);
//         emit DrivingPointsUpdated(msg.sender, drivingPoints[msg.sender]);
//     }
    
//     // Get driving points for a user
//     function getDrivingPoints(address user) public view returns (uint256) {
//         return drivingPoints[user];
//     }
// }

//new..........................................abi



pragma solidity ^0.8.0;

contract CyberForgeToken {
    string private _name = "Safe Driving Coin";
    string private _symbol = "SDC";
    uint8 private _decimals = 18;
    uint256 private _totalSupply;
    uint256 private _initialSupply = 1000; // 1000 SDC

    mapping(address => uint256) private balances;
    mapping(address => int256) public drivingPoints;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Mint(address indexed to, uint256 amount);
    event DrivingPointsUpdated(address indexed user, int256 points);

    constructor() {
        _totalSupply = _initialSupply * 10 ** uint256(_decimals);
        balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }

    function transfer(address recipient, uint256 amount) public returns (bool) {
        require(recipient != address(0), "Cannot transfer to zero address");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        balances[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    // Allows setting both positive and negative driving points
    function setDrivingPoints(address user, int256 points) public {
        drivingPoints[user] = points;
        emit DrivingPointsUpdated(user, points);
    }

    // Mint tokens based on driving points (only positive allowed)
    function mintFromDrivingPoints() public {
        require(drivingPoints[msg.sender] >= 100, "You need at least 100 driving points to mint");

        // Calculate how many tokens to mint (100 points = 1 token)
        uint256 tokensToMint = (uint256(drivingPoints[msg.sender]) / 100) * 10 ** uint256(_decimals);
        int256 pointsUsed = (drivingPoints[msg.sender] / 100) * 100;

        // Update driving points (subtract used points)
        drivingPoints[msg.sender] -= pointsUsed;

        // Mint tokens
        balances[msg.sender] += tokensToMint;
        _totalSupply += tokensToMint;

        emit Mint(msg.sender, tokensToMint);
        emit Transfer(address(0), msg.sender, tokensToMint);
        emit DrivingPointsUpdated(msg.sender, drivingPoints[msg.sender]);
    }

    // Get driving points for a user (can be negative)
    function getDrivingPoints(address user) public view returns (int256) {
        return drivingPoints[user];
    }
}