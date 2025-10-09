import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  paths: {
    sources: "./contracts",   // 소스 디렉토리 유지
    tests: "./test"           // Hardhat은 test 폴더만 테스트로 본다
  },
  // forge-std가 들어간 파일 제외
  mocha: {
    grep: "^(?!.*\\.t\\.sol$)"
  }
};

export default config;
