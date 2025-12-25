// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint8, euint64, externalEuint8, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title OnchainProphecy - Encrypted daily price prediction game for ETH and BTC
/// @notice Users submit encrypted price thresholds and directions with an ETH stake.
/// Prices are recorded once per day. After the daily price is posted, users can
/// confirm results and receive encrypted points equal to their stake if they predicted correctly.
contract OnchainProphecy is ZamaEthereumConfig {
    enum Asset {
        ETH,
        BTC
    }

    struct PricePoint {
        uint256 ethPrice;
        uint256 btcPrice;
        uint256 updatedAt;
    }

    struct Prediction {
        euint64 price;
        euint8 direction;
        ebool outcome;
        uint256 stake;
        uint256 day;
        bool exists;
        bool resolved;
    }

    uint8 private constant DIRECTION_ABOVE = 1;
    uint8 private constant DIRECTION_BELOW = 2;
    uint256 public constant PRICE_DECIMALS = 8;

    address public immutable owner;
    uint256 public lastRecordedDay;
    bool private _locked;

    mapping(uint256 => PricePoint) private _pricesByDay;
    mapping(uint256 => mapping(address => mapping(uint8 => Prediction))) private _predictions;
    mapping(address => euint64) private _userPoints;
    mapping(address => bool) private _pointsInitialized;
    mapping(address => mapping(uint8 => uint256[])) private _userPredictionDays;

    event PricesUpdated(uint256 indexed day, uint256 ethPrice, uint256 btcPrice, uint256 updatedAt);
    event PredictionPlaced(address indexed user, Asset indexed asset, uint256 indexed day, uint256 stake);
    event PredictionResolved(address indexed user, Asset indexed asset, uint256 indexed day, uint256 stake);
    event PointsUpdated(address indexed user, euint64 totalPoints);

    error InvalidAsset();
    error PredictionExists(uint256 day, address user, Asset asset);
    error PredictionMissing(uint256 day, address user, Asset asset);
    error PredictionAlreadyResolved(uint256 day, address user, Asset asset);
    error PriceNotRecorded(uint256 day);
    error CannotResolveYet(uint256 day);
    error StakeRequired();
    error DayAlreadyLocked(uint256 day);
    error StakeTooLarge();
    error NotAuthorized();
    error ReentrancyDetected();
    error PriceTooLarge();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    modifier validAsset(Asset asset) {
        if (uint8(asset) > 1) revert InvalidAsset();
        _;
    }

    modifier nonReentrant() {
        if (_locked) revert ReentrancyDetected();
        _locked = true;
        _;
        _locked = false;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Returns the current UTC day index.
    function getCurrentDay() public view returns (uint256) {
        return block.timestamp / 1 days;
    }

    /// @notice Records prices for the current day. Can only be called once per day.
    /// @param ethPrice ETH price scaled by PRICE_DECIMALS
    /// @param btcPrice BTC price scaled by PRICE_DECIMALS
    function updatePrices(uint256 ethPrice, uint256 btcPrice) external onlyOwner {
        uint256 day = getCurrentDay();
        if (_pricesByDay[day].updatedAt != 0) {
            revert DayAlreadyLocked(day);
        }

        if (ethPrice > type(uint64).max || btcPrice > type(uint64).max) {
            revert PriceTooLarge();
        }

        _pricesByDay[day] = PricePoint({ethPrice: ethPrice, btcPrice: btcPrice, updatedAt: block.timestamp});
        lastRecordedDay = day;

        emit PricesUpdated(day, ethPrice, btcPrice, block.timestamp);
    }

    /// @notice Submit a new encrypted prediction for the current day.
    /// @param asset Asset to predict (0 = ETH, 1 = BTC)
    /// @param encryptedPrice Encrypted price threshold
    /// @param encryptedDirection Encrypted direction (1 = above, 2 = below)
    /// @param inputProof Proof attached to the encrypted inputs
    function placePrediction(
        Asset asset,
        externalEuint64 encryptedPrice,
        externalEuint8 encryptedDirection,
        bytes calldata inputProof
    ) external payable validAsset(asset) returns (uint256 day) {
        if (msg.value == 0) {
            revert StakeRequired();
        }

        if (msg.value > type(uint64).max) {
            revert StakeTooLarge();
        }

        day = getCurrentDay();
        if (_pricesByDay[day].updatedAt != 0) {
            revert DayAlreadyLocked(day);
        }

        Prediction storage record = _predictions[day][msg.sender][uint8(asset)];
        if (record.exists) {
            revert PredictionExists(day, msg.sender, asset);
        }

        euint64 price = FHE.fromExternal(encryptedPrice, inputProof);
        euint8 direction = FHE.fromExternal(encryptedDirection, inputProof);

        record.price = price;
        record.direction = direction;
        record.stake = msg.value;
        record.day = day;
        record.exists = true;

        FHE.allowThis(price);
        FHE.allow(price, msg.sender);
        FHE.allowThis(direction);
        FHE.allow(direction, msg.sender);

        _userPredictionDays[msg.sender][uint8(asset)].push(day);

        emit PredictionPlaced(msg.sender, asset, day, msg.value);
    }

    /// @notice Resolve a previously submitted prediction after the daily prices are recorded.
    /// Points equal to the stake are added if the prediction is correct. Stake is refunded.
    /// @param day Day identifier of the prediction
    /// @param asset Asset that was predicted
    function confirmPrediction(uint256 day, Asset asset) external validAsset(asset) nonReentrant {
        Prediction storage record = _predictions[day][msg.sender][uint8(asset)];
        if (!record.exists) {
            revert PredictionMissing(day, msg.sender, asset);
        }

        if (record.resolved) {
            revert PredictionAlreadyResolved(day, msg.sender, asset);
        }

        PricePoint memory pricePoint = _pricesByDay[day];
        if (pricePoint.updatedAt == 0) {
            revert PriceNotRecorded(day);
        }

        if (day >= getCurrentDay()) {
            revert CannotResolveYet(day);
        }

        uint256 actualPrice = asset == Asset.ETH ? pricePoint.ethPrice : pricePoint.btcPrice;
        euint64 actualPriceCipher = FHE.asEuint64(uint64(actualPrice));

        ebool predictsAbove = FHE.eq(record.direction, FHE.asEuint8(DIRECTION_ABOVE));
        ebool predictsBelow = FHE.eq(record.direction, FHE.asEuint8(DIRECTION_BELOW));

        ebool aboveResult = FHE.gt(actualPriceCipher, record.price);
        ebool belowResult = FHE.lt(actualPriceCipher, record.price);

        ebool matchedAbove = FHE.and(predictsAbove, aboveResult);
        ebool matchedBelow = FHE.and(predictsBelow, belowResult);
        ebool outcome = FHE.or(matchedAbove, matchedBelow);

        record.outcome = outcome;
        record.resolved = true;

        FHE.allowThis(outcome);
        FHE.allow(outcome, msg.sender);

        uint256 stakeAmount = record.stake;
        record.stake = 0;

        _updatePoints(msg.sender, stakeAmount, outcome);

        if (stakeAmount > 0) {
            (bool success, ) = msg.sender.call{value: stakeAmount}("");
            require(success, "Stake refund failed");
        }

        emit PredictionResolved(msg.sender, asset, day, stakeAmount);
    }

    /// @notice Returns encrypted points for a user.
    /// @param user Address of the user to query
    function getUserPoints(address user) external view returns (euint64) {
        return _userPoints[user];
    }

    /// @notice Returns prediction metadata and encrypted fields for a user/day/asset.
    /// @param user Address of the user
    /// @param day Day identifier
    /// @param asset Asset identifier
    function getPrediction(address user, uint256 day, Asset asset)
        external
        view
        validAsset(asset)
        returns (Prediction memory)
    {
        return _predictions[day][user][uint8(asset)];
    }

    /// @notice Lists all day identifiers a user has participated in for a given asset.
    /// @param user Address of the user
    /// @param asset Asset identifier
    function getUserPredictionDays(address user, Asset asset)
        external
        view
        validAsset(asset)
        returns (uint256[] memory)
    {
        return _userPredictionDays[user][uint8(asset)];
    }

    /// @notice Returns price data for a specific day.
    /// @param day Day identifier
    function getPricesForDay(uint256 day) external view returns (PricePoint memory) {
        return _pricesByDay[day];
    }

    /// @notice Utility to read the configured price decimals used for scaling off-chain values.
    function getPriceDecimals() external pure returns (uint256) {
        return PRICE_DECIMALS;
    }

    function _updatePoints(address user, uint256 stakeAmount, ebool outcome) private {
        if (!_pointsInitialized[user]) {
            _userPoints[user] = FHE.asEuint64(0);
            _pointsInitialized[user] = true;
            FHE.allowThis(_userPoints[user]);
            FHE.allow(_userPoints[user], user);
        }

        euint64 currentPoints = _userPoints[user];
        euint64 stakeCipher = FHE.asEuint64(uint64(stakeAmount));
        euint64 updatedPoints = FHE.select(outcome, FHE.add(currentPoints, stakeCipher), currentPoints);

        _userPoints[user] = updatedPoints;

        FHE.allowThis(updatedPoints);
        FHE.allow(updatedPoints, user);

        emit PointsUpdated(user, updatedPoints);
    }
}
