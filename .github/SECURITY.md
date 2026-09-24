<div align="center">

[![English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](SECURITY.md)
[![Türkçe](https://img.shields.io/badge/Dil-T%C3%BCrk%C3%A7e-red?style=for-the-badge)](SECURITY.tr.md)

</div>

# Security Policy

Corvus aims to provide a secure and reliable server launcher and observability hub for homelab and self-hosted environments. We take security vulnerabilities seriously.

## 🛡️ Supported Versions

The following versions are actively receiving security updates:

| Version | Supported |
|---|---|
| `1.x` (v1) | :white_check_mark: Supported |
| `< 1.0` | :x: End of Life |

---

## 🔒 Docker Socket & Privilege Isolation

Corvus interacts directly with the Docker daemon to discover and monitor containers:
1. **Read-Only Socket Mounting:**
   - For standard monitoring-only setups, we recommend mounting the Docker socket in **read-only** mode (`/var/run/docker.sock:/var/run/docker.sock:ro`).
   - In this mode, Corvus only queries container states and cannot alter the host system or other containers.
2. **Container Lifecycle Controls:**
   - Container Start, Stop, Pause, and Restart actions require read-write access to the Docker socket. If you do not intend to manage container lifecycles from the dashboard, mount the socket with the `:ro` flag.
3. **Authentication:**
   - When exposed to external networks or the public internet, ensure authentication is enabled (`CORVUS_AUTH_ENABLED=true`).
   - We recommend toggling off open user registration in Settings once the administrator account is created.

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability in Corvus, please **do not report it publicly via open GitHub issues**.

Instead, please:
1. Open a private security advisory through the repository's **Security Advisories** tab on GitHub, OR
2. Contact the maintainers directly.

All vulnerability reports will be acknowledged and reviewed within 48 hours.
