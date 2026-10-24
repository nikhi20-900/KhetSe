# Security Policy

## Supported Versions

As this project is currently in early hackathon scaffold and development, security updates are applied to the active branch (`main`).

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

We take the security of KhetSe seriously. If you discover a security vulnerability, please do not disclose it publicly in GitHub issues or discussions.

Instead, please report security concerns directly to the project lead via GitHub security advisory or by contacting `nikhi20-900`.

### What to Include

- A description of the vulnerability and its potential impact.
- Clear steps to reproduce the vulnerability (proof of concept script or request).
- Any recommended remediation steps if available.

### Response Timeline

- **Initial Acknowledgement**: Within 48 hours.
- **Triage & Assessment**: Within 5 business days.
- **Fix & Disclosure**: Coordinated release schedule following confirmation.

## Security Practices

- **No Hardcoded Secrets**: Real API keys, database credentials, and production secrets must never be committed. Use `.env.example` as a template for local environment variables.
- **Dependency Auditing**: Automated CI runs `npm audit` and vulnerability scanning across dependencies.
