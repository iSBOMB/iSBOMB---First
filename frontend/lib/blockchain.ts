// frontend/lib/blockchain.ts
import { Contract, ethers } from "ethers";
import AIBOMRegistryJson from "@/data/AIBOMRegistry.json";

const RPC_URL: string = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";

export const CONTRACT_ADDRESS: string =
  process.env.NEXT_PUBLIC_AIBOM_CONTRACT_ADDRESS ??
  "0x1fA02b2d6A771842690194Cf62D91bdd92BfE28d";

const readOnlyProvider = new ethers.providers.JsonRpcProvider(RPC_URL);

/** 읽기 전용 컨트랙트 (Provider 사용) */
export function getReadOnlyContract(): Contract {
  return new ethers.Contract(CONTRACT_ADDRESS, AIBOMRegistryJson.abi, readOnlyProvider);
}

/** 브라우저용 Provider (MetaMask) */
export function getBrowserProvider(): ethers.providers.Web3Provider {
  if (typeof window === "undefined") {
    throw new Error("❌ 클라이언트 환경에서만 호출 가능");
  }
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("❌ MetaMask가 설치되어 있지 않습니다.");
  return new ethers.providers.Web3Provider(eth);
}

/**
 * 지갑이 연결된 컨트랙트 (Signer 포함)
 * - 로컬 하드햇(31337) 사용을 가정. 필요하면 chainId, RPC 바꿔서 사용하세요.
 */
export async function getContractWithWallet(): Promise<Contract> {
  const provider = getBrowserProvider();
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();

  // 네트워크 체크 (하드햇 31337)
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  if (chainId !== 31337) {
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7A69" }], // 31337 hex
      });
    } catch (error: any) {
      // 체인이 없으면 추가하도록 시도 (optional)
      if (error?.code === 4902) {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x7A69",
              chainName: "Hardhat Localhost",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            },
          ],
        });
      } else {
        throw error;
      }
    }
  }

  return new ethers.Contract(CONTRACT_ADDRESS, AIBOMRegistryJson.abi, signer);
}

/** 지갑 주소 조회 */
export async function getWalletAddress(): Promise<string> {
  const provider = getBrowserProvider();
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  return signer.getAddress();
}

/**
 * 이벤트 로그에서 ReviewSubmitted 이벤트로부터 CID 가져오기
 * (provider는 읽기 전용 provider를 넣어 호출)
 */
export async function getReviewSubmittedCid(
  provider: ethers.providers.Provider,
  contractAddress: string,
  modelId: number,
  fromBlock = 0,
  toBlock: number | "latest" = "latest"
): Promise<string | null> {
  try {
    const iface = new ethers.utils.Interface(AIBOMRegistryJson.abi);
    const eventTopic = iface.getEventTopic("ReviewSubmitted");
    const modelTopic = ethers.utils.hexZeroPad(ethers.utils.hexlify(modelId), 32);

    const logs = await provider.getLogs({
      address: contractAddress,
      fromBlock,
      toBlock,
      topics: [eventTopic, modelTopic],
    });

    if (!logs || logs.length === 0) return null;
    const last = logs[logs.length - 1];
    const parsed = iface.parseLog(last);
    // event ReviewSubmitted(uint256 indexed modelId, string cid);
    const cid = parsed.args?.[1] ?? parsed.args?.cid ?? null;
    return cid;
  } catch (err) {
    console.error("getReviewSubmittedCid error:", err);
    return null;
  }
}

/* --------------------
   Helpful wrappers that frontend can call
   -------------------- */

/** 읽기: 전체 AIBOM 목록 (읽기 전용) */
export async function readAllAIBOMs() {
  const c = getReadOnlyContract();
  return await c.getAllAIBOMs();
}

/** 읽기: 특정 모델의 vulnerabilities */
export async function readVulnerabilities(modelId: number) {
  const c = getReadOnlyContract();
  return await c.getVulnerabilities(modelId);
}

/** 읽기: 특정 모델의 advisories */
export async function readAdvisories(modelId: number) {
  const c = getReadOnlyContract();
  return await c.getAdvisories(modelId);
}

/** 개발자 작업: registerAIBOM on-chain (wallet required) */
export async function registerAIBOMOnChain(cid: string) {
  const contract = await getContractWithWallet();
  const tx = await contract.registerAIBOM(cid);
  const r = await tx.wait();
  return r;
}

/** 개발자 작업: submitReview (wallet required) */
export async function submitReviewOnChain(modelId: number, cid: string) {
  const contract = await getContractWithWallet();
  const tx = await contract.submitReview(modelId, cid);
  const r = await tx.wait();
  return r;
}

/** 규제기관(오너) 작업: setReviewStatus (owner wallet required)
 * - status: numeric enum value (0..4)
 */
export async function setReviewStatusOnChain(modelId: number, status: number, reason: string) {
  const contract = await getContractWithWallet();
  const tx = await contract.setReviewStatus(modelId, status, reason);
  const r = await tx.wait();
  return r;
}

/** supervisor 전용: getApprovedSubmissions (requires supervisor or owner signer) */
export async function getApprovedSubmissionsForSupervisor(modelId: number): Promise<string[]> {
  const contract = await getContractWithWallet();
  // solidity returns string[] memory
  const arr: string[] = await contract.getApprovedSubmissions(modelId);
  return arr;
}

/** supervisor가 온체인으로 권고 기록 (recordAdvisory) */
export async function recordAdvisoryOnChain(
  modelId: number,
  advisoryCid: string,
  scope: string,
  action: string
) {
  const contract = await getContractWithWallet();
  const tx = await contract.recordAdvisory(modelId, advisoryCid, scope, action);
  const r = await tx.wait();
  return r;
}

/** owner(또는 오너 권한)으로 취약점 신고 (reportVulnerability) */
export async function reportVulnerabilityOnChain(modelId: number, cid: string, severity: string) {
  const contract = await getContractWithWallet();
  const tx = await contract.reportVulnerability(modelId, cid, severity);
  const r = await tx.wait();
  return r;
}

/** developer convenience: getMySubmissions (returns string[]) */
export async function getMySubmissionsForDeveloper(modelId: number): Promise<string[]> {
  const contract = await getContractWithWallet();
  const arr: string[] = await contract.getMySubmissions(modelId);
  return arr;
}
