// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIBOMRegistry
 * @notice AIBOM (IPFS CID) 등록 및 심사 상태 / 제출문서 / 취약점 / 권고 기록용 온체인 레지스트리
 */
contract AIBOMRegistry is Ownable {
    // -------------------------
    // ENUMS
    // -------------------------
    enum ReviewStatus { DRAFT, SUBMITTED, IN_REVIEW, APPROVED, REJECTED }

    // -------------------------
    // STRUCTS
    // -------------------------
    struct AIBOM {
        address owner;
        string cid;
        uint256 timestamp;
        ReviewStatus status;
        string reviewReason; // 규제기관이 승인/거절 시 남긴 사유
    }

    struct Vulnerability {
        string cid;
        uint256 timestamp;
        string severity;
        bool active;
    }

    struct Advisory {
        string cid;       // advisory 문서 CID (IPFS) 또는 요약 텍스트
        string scope;     // 범위 (예: v1.3.x)
        string action;    // 권고 조치
        uint256 timestamp;
        address reporter; // who registered
    }

    // -------------------------
    // STATE
    // -------------------------
    uint256 public nextModelId;
    mapping(uint256 => AIBOM) public aiboms;                   // modelId -> AIBOM
    mapping(uint256 => string[]) private submissions;          // modelId -> list of submitted doc CIDs (by dev)
    mapping(uint256 => Vulnerability[]) public vulnerabilities;// modelId -> vulnerabilities
    mapping(uint256 => Advisory[]) private advisories;         // modelId -> advisories (by supervisor)
    mapping(address => bool) public supervisors;               // supervisor accounts

    // -------------------------
    // EVENTS
    // -------------------------
    event AIBOMRegistered(uint256 indexed modelId, address indexed owner, string cid);
    event ReviewSubmitted(uint256 indexed modelId, string cid);
    event ReviewStatusChanged(uint256 indexed modelId, ReviewStatus status);
    event ReviewApprovedWithSubmission(uint256 indexed modelId, string latestSubmissionCid, string reason);
    event VulnerabilityReported(uint256 indexed modelId, string cid, string severity);
    event VulnerabilityDeactivated(uint256 indexed modelId, uint256 vulnIndex);
    event AdvisoryRecorded(uint256 indexed modelId, string cid, address reporter);

    // -------------------------
    // CONSTRUCTOR
    // -------------------------
    constructor() Ownable(msg.sender) {}

    // -------------------------
    // MODIFIERS / HELPERS
    // -------------------------
    modifier onlySupervisorOrOwner() {
        require(supervisors[msg.sender] || owner() == msg.sender, "Not authorized");
        _;
    }

    // -------------------------
    // Supervisor management (owner only)
    // -------------------------
    function addSupervisor(address who) external onlyOwner {
        supervisors[who] = true;
    }

    function removeSupervisor(address who) external onlyOwner {
        supervisors[who] = false;
    }

    // -------------------------
    // Developer API
    // -------------------------
    function registerAIBOM(string calldata cid) external returns (uint256) {
        uint256 modelId = nextModelId++;
        aiboms[modelId] = AIBOM({
            owner: msg.sender,
            cid: cid,
            timestamp: block.timestamp,
            status: ReviewStatus.DRAFT,
            reviewReason: ""
        });
        emit AIBOMRegistered(modelId, msg.sender, cid);
        return modelId;
    }

    /**
     * @notice developer가 규제기관에 제출(심사요청)할 때 호출 — 제출 CID는 submissions 배열에 추가
     */
    function submitReview(uint256 modelId, string calldata cid) external {
        require(modelId < nextModelId, "Invalid modelId");
        require(aiboms[modelId].owner == msg.sender, "Not owner");
        // Allow multiple submits (e.g. updated documents)
        submissions[modelId].push(cid);
        aiboms[modelId].status = ReviewStatus.SUBMITTED;
        emit ReviewSubmitted(modelId, cid);
        emit ReviewStatusChanged(modelId, ReviewStatus.SUBMITTED);
    }

    // -------------------------
    // Regulator (owner) API
    // -------------------------
    /**
     * @notice 규제기관(owner)이 심사상태 변경 (IN_REVIEW / APPROVED / REJECTED)
     * @dev reason 파라미터를 받아서 aibom.reviewReason에 저장
     */
    function setReviewStatus(uint256 modelId, ReviewStatus status, string calldata reason) external onlyOwner {
        require(modelId < nextModelId, "Invalid modelId");
        require(
            status == ReviewStatus.IN_REVIEW ||
            status == ReviewStatus.APPROVED ||
            status == ReviewStatus.REJECTED,
            "Invalid status"
        );

        aiboms[modelId].status = status;
        aiboms[modelId].reviewReason = reason;
        emit ReviewStatusChanged(modelId, status);

        if (status == ReviewStatus.APPROVED) {
            // emit latest submission CID (if any) for off-chain listeners
            string memory latestCid = "";
            if (submissions[modelId].length > 0) {
                latestCid = submissions[modelId][submissions[modelId].length - 1];
            }
            emit ReviewApprovedWithSubmission(modelId, latestCid, reason);
        }
    }

    // -------------------------
    // Supervisor functionality
    // -------------------------
    /**
     * @notice supervisor 또는 owner 만 호출 가능. 그리고 모델 상태가 APPROVED 여야 제출문서 조회 허용
     */
    function getApprovedSubmissions(uint256 modelId) external view returns (string[] memory) {
        require(modelId < nextModelId, "Invalid modelId");
        require(aiboms[modelId].status == ReviewStatus.APPROVED, "Model not approved");
        require(supervisors[msg.sender] || owner() == msg.sender, "Not authorized");
        return submissions[modelId];
    }

    /**
     * @notice supervisor가 문제를 발견하여 온체인으로 Advisory(권고)를 등록
     */
    function recordAdvisory(
        uint256 modelId,
        string calldata cid,
        string calldata scope,
        string calldata action
    ) external {
        require(modelId < nextModelId, "Invalid modelId");
        require(supervisors[msg.sender] || owner() == msg.sender, "Not authorized");
        Advisory memory a = Advisory({
            cid: cid,
            scope: scope,
            action: action,
            timestamp: block.timestamp,
            reporter: msg.sender
        });
        advisories[modelId].push(a);
        emit AdvisoryRecorded(modelId, cid, msg.sender);
    }

    // -------------------------
    // Watchdog / Supervisor vulnerability (owner only)
    // -------------------------
    function reportVulnerability(
        uint256 modelId,
        string calldata cid,
        string calldata severity
    ) external onlyOwner {
        require(modelId < nextModelId, "Invalid modelId");
        vulnerabilities[modelId].push(Vulnerability({
            cid: cid,
            timestamp: block.timestamp,
            severity: severity,
            active: true
        }));
        emit VulnerabilityReported(modelId, cid, severity);
    }

    function deactivateVulnerability(uint256 modelId, uint256 index) external onlyOwner {
        require(modelId < nextModelId, "Invalid modelId");
        require(index < vulnerabilities[modelId].length, "Invalid index");
        vulnerabilities[modelId][index].active = false;
        emit VulnerabilityDeactivated(modelId, index);
    }

    // -------------------------
    // 조회 함수 (Frontend용)
    // -------------------------
    function getAllAIBOMs() external view returns (AIBOM[] memory) {
        AIBOM[] memory list = new AIBOM[](nextModelId);
        for (uint256 i = 0; i < nextModelId; i++) {
            list[i] = aiboms[i];
        }
        return list;
    }

    function getVulnerabilities(uint256 modelId) external view returns (Vulnerability[] memory) {
        return vulnerabilities[modelId];
    }

    function getAdvisories(uint256 modelId) external view returns (Advisory[] memory) {
        return advisories[modelId];
    }

    // Developer convenience: developer can fetch their model's submissions
    function getMySubmissions(uint256 modelId) external view returns (string[] memory) {
        require(modelId < nextModelId, "Invalid modelId");
        require(aiboms[modelId].owner == msg.sender, "Not owner");
        return submissions[modelId];
    }
}
