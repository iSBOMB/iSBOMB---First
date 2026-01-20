# 🛡️ iSBOMB: A Blockchain-based Governance Framework for AIBOM Integrity

> **AI 공급망의 투명성 확보와 규제 준수 자동화를 위한 블록체인 기반 거버넌스 프레임워크**

이 프로젝트는 AI 시스템의 보안 관리 핵심 요소인 **AIBOM(AI Bill of Materials)**의 데이터 무결성을 보장하고, 복잡한 규제 승인 절차를 블록체인과 DID 기술을 통해 혁신적으로 개선하는 것을 목표로 합니다.

---

## 👨‍💻 팀원 소개

| <img src="https://github.com/minchaeki.png" width="200" height="200"/> | <img src="https://github.com/sheunn.png" width="200" height="200"/> |
| :---: | :---: |
| **김민채** <br/> [@minchaeki](https://github.com/minchaeki) | **김시은** <br/> [@sheunn](https://github.com/sheunn) |
| **Full-stack & Blockchain Developer** | **AI Developer** |
| DID 인증, 프론트엔드, IPFS 구축, 블록체인 설계, UI/UX 디자인 | AI 챗봇 및 자동화 모듈 전반적 개발 |

---

## 📑 목차
1. [프로젝트 개요](#-프로젝트-개요)
2. [핵심 문제 해결 전략](#-핵심-문제-해결-전략)
3. [시스템 아키텍처](#-시스템-아키텍처)
4. [주요 기능 구현 상세](#-주요-기능-구현-상세)
5. [시현 영상](#-시현-영상)
6. [기술 스택](#-기술-스택)
7. [기대 효과 및 향후 계획](#-기대-효과-및-향후-계획)

---

## 💡 프로젝트 개요
최근 생성형 AI의 급격한 확산으로 AI 시스템의 안전성, 신뢰성, 투명성에 대한 요구가 높아지고 있습니다. 특히 의료 AI와 같은 고위험 분야는 엄격한 규제 승인이 필수적이지만, 수동으로 이루어지는 현재의 프로세스는 과도한 시간과 비용이 소요됩니다. 본 프로젝트는 이를 해결하기 위해 **iSBOMB(Integrity-assured SBOM using Blockchain)** 프레임워크를 제안합니다.

## 🎯 핵심 문제 해결 전략
* **AIBOM 데이터 무결성**: 중앙 집중식 저장소의 위변조 위험을 방지하기 위해 블록체인의 불변성을 활용합니다.
* **신원 인증 체계**: 중앙 서버 없는 자율적인 신원 관리를 위해 W3C 표준인 **DID(Decentralized Identifier)**를 통합합니다.
* **대용량 데이터 처리**: 블록체인의 가스비 효율성을 위해 원본 데이터는 **IPFS**에 저장하고, 무결성 증명값(CID)만 온체인에 기록합니다.
* **사후 시장 감시**: 제품 출시 후에도 보안 취약점을 지속적으로 추적하고 기록할 수 있는 체계를 제공합니다.

## 🏗 시스템 아키텍처
iSBOMB 프레임워크는 논리적으로 분리된 3개 계층으로 구성됩니다.


### 1. Application & Authentication Layer
* **Frontend Dashboard**: React/Next.js 기반으로 개발자, 규제자, 감독자에게 역할별 기능을 제공합니다.
* **DID Auth**: Hyperledger Indy/Aries 프레임워크를 사용하여 사용자 인증 및 전자 서명을 수행합니다.

### 2. Data Processing & Storage Layer
* **IPFS Distributed Storage**: 대용량 AIBOM 및 규제 서류를 분산 저장하고 고유한 CID를 생성합니다.
* **LLM Module**: (※ 협업 파트너 구현 파트)

### 3. Blockchain Layer (On-Chain)
* **Ethereum Smart Contracts**: Polygon 네트워크상에서 AIBOM 레지스트리, 승인 결과, 보안 취약점 리포트를 관리합니다.
* **Single Source of Truth**: 모든 이해관계자가 검증 가능한 투명한 이력 관리 기반을 제공합니다.

## 🛠 주요 기능 구현 상세

### ✅ DID 기반 신원 인증
* Hyperledger Aries를 통해 생성된 QR 코드를 스캔하여 보안 연결을 생성합니다.
* 중앙 집중식 ID 제공자 없이 역할 기반 접근 제어(RBAC)를 수행합니다.

### ✅ AIBOM 등록 및 온체인 앵커링
* AIBOM 업로드 시 IPFS에서 파일의 지문인 **CID(Content Identifier)**를 추출합니다.
* 추출된 CID와 모델 메타데이터를 스마트 컨트랙트에 기록하여 영구적인 증거를 남깁니다.

### ✅ 사후 시장 감시 및 취약점 보고
* 감독자(Supervisor)는 시장에 출시된 모델의 취약점을 분석하여 온체인 리포트를 제출합니다.
* 리포트 내역과 트랜잭션 해시를 통해 보안 조치 과정을 투명하게 공개합니다.

## 🎥 시현 영상
> 아래 이미지를 클릭하면 프로젝트 시현 영상을 확인하실 수 있습니다.



## Tech Skills 🛠️
| Category | Stack |
| :--- | :--- |
| **Blockchain** | ![Solidity](https://img.shields.io/badge/Solidity-363636?style=flat-square&logo=solidity&logoColor=white) ![Polygon](https://img.shields.io/badge/Polygon-8247E5?style=flat-square&logo=polygon&logoColor=white) ![Hardhat](https://img.shields.io/badge/Hardhat-FFF100?style=flat-square&logo=hardhat&logoColor=black) |
| **Identity & Storage** | ![Hyperledger](https://img.shields.io/badge/Hyperledger_Indy/Aries-2F3134?style=flat-square&logo=hyperledger&logoColor=white) ![IPFS](https://img.shields.io/badge/IPFS-65C2CB?style=flat-square&logo=ipfs&logoColor=white) |
| **Languages** | ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) ![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) ![Solidity](https://img.shields.io/badge/Solidity-363636?style=flat-square&logo=solidity&logoColor=white) |
| **Client** | ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black) ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) |
| **Backend** | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) |
| **Dev Tools** | ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) |
| **Design Tools** | ![Figma](https://img.shields.io/badge/Figma-F24E1E?style=flat-square&logo=figma&logoColor=white) |
## 🚀 기대 효과 및 향후 계획
* **신뢰성 및 효율성**: 신뢰 기반 문서 자동화를 통해 컴플라이언스 비용과 시간을 대폭 절감합니다.
* **투명한 이력 관리**: AI 모델의 생애주기 전반에 걸친 책임 소재를 명확히 합니다.
* **향후 계획**: 영지식 증명(ZKP) 도입을 통한 데이터 프라이버시 강화 및 SPDX/CycloneDX 등 국제 표준과의 호환성 확보를 목표로 합니다.

