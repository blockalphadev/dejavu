# Security Policy

## 🛡️ Commitment to Security

ExoDuZe takes the security of our prediction market platform seriously. We are committed to protecting our users, their assets, and the integrity of our financial data. This document outlines our security policies, reporting procedures, and the active measures we take to secure the platform.

## 📦 Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Status | Security Updates |
| :--- | :--- | :--- |
| **2.x.x** | **Current Stable** | ✅ **Active Support** |
| 1.x.x | Legacy | ❌ End of Life |

If you are running an older version, please upgrade immediately to benefit from the latest security patches.

## 🐞 Reporting a Vulnerability

We value the contributions of the security research community. If you discover a vulnerability in ExoDuZe, please report it to us responsibly.

### How to Report
Please email our security team at **security@exoduze.finance** with the following details:
1.  **Subject**: Security Vulnerability - [Brief Description]
2.  **Description**: Detailed explanation of the vulnerability.
3.  **Steps to Reproduce**: PoC steps, scripts, or screenshots.
4.  **Impact**: Estimated severity and affected components.

### Our Response Policy
*   We will acknowledge receipt of your report within **24 hours**.
*   We aim to validate the issue within **48 hours**.
*   We will provide a timeline for the fix and keep you updated.
*   We request that you **do not disclose** the vulnerability publicly until we have released a patch.

## 🔐 Security Architecture & Features

Our platform is built with a defense-in-depth approach. Key security restrictions implemented include:

### 1. Authentication & Authorization
*   **JWT Fingerprinting**: Session tokens are cryptographically bound to the user's device and IP to prevent session hijacking (OWASP A01).
*   **Role-Based Access Control (RBAC)**: Strict separation of duties between Users, Admins, and Service Roles.
*   **Wallet Verification**: Cryptographic signature verification (SIWE/SIWS) for all wallet-based logins.

### 2. Network & Real-Time Security
*   **WebSocket Guards**: All real-time connections via `SportsGateway`, `MarketGateway`, etc., are protected by `WsAuthGuard`.
*   **Rate Limiting**: Strict API rate limits (`ThrottlerGuard`) based on IP and User ID to prevent DoS and brute-force attacks.
*   **Origin Validation**: Strict CORS and WebSocket origin checking.

### 3. Data Integrity & Validation
*   **Input Validation**: All DTOs use rigorous validation decorators (`@IsSafeNumber`, `@IsUUIDv4`) to prevent injection and data corruption.
*   **Idempotency**: Financial transactions require `Idempotency-Key` headers to prevent replay attacks and duplicate processing.
*   **Sanitization**: Automatic string sanitization to neutralize XSS vectors.

### 4. Dependency Management
*   **Supply Chain Security**: We strictly pin dependencies and use `pnpm overrides` to force secure versions of transitive dependencies.
*   **Regular Audits**: Automated `pnpm audit` checks in CI/CD pipelines.

## 🚫 Out of Scope

The following are considered out of scope for security reports:
*   Social engineering or phishing attacks against our employees.
*   Physical security of our offices.
*   DoS attacks that simply exhaust bandwidth (we have upstream mitigation).
*   UI/UX bugs that do not pose a security risk.

## 📝 License

This project is licensed under the MIT License.
