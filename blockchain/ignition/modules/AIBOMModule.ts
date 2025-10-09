import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// 네트워크별 admin/초기 롤을 파라미터로 주입 가능하게 설계
export default buildModule("AIBOMModule", (m) => {
  const admin      = m.getAccount(0);   // 기본 admin
  const creator0   = m.getAccount(0);   // 예시: 첫 계정을 CREATOR로
  const regulator0 = m.getAccount(1);   // 예시: 두번째 계정을 REGULATOR로

  const registry = m.contract("AIBOMRegistry", [
    admin,
    [creator0],     // initialCreators
    [regulator0]    // initialRegulators
  ]);

  return { registry };
});
