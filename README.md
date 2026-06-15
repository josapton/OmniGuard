<div align="center">
  <h1>🛡️ OmniGuard</h1>
  <p><strong>Automated Threat Intelligence & Attack Surface Mapping Platform</strong></p>
  <p><i>Powered by Multi-LLM (Claude, Gemini, Llama-3) and Advanced Reconnaissance Engines</i></p>
  
  <br />

  [![Deploy Status](https://img.shields.io/badge/Deployment-Automated%20(CI%2FCD)-success?style=for-the-badge&logo=githubactions)](https://github.com/josapton/OmniGuard/actions)
  [![Documentation](https://img.shields.io/badge/Documentation-Wiki-blue?style=for-the-badge&logo=wikipedia)](https://github.com/josapton/OmniGuard/wiki)
  [![Stack](https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20PostgreSQL-orange?style=for-the-badge)]()
</div>

<br />

## 📖 Overview

**OmniGuard** is a next-generation cybersecurity platform that automates threat intelligence gathering and attack surface mapping. Built for Security Analysts and DevSecOps teams, OmniGuard utilizes real-time web crawling, port scanning, and OSINT gathering to feed data directly into an intelligent **Multi-LLM ecosystem** (Anthropic Claude, Google Gemini, and Groq Llama-3).

Rather than just presenting raw scan results, OmniGuard's AI evaluates the data, generates a predictive **Risk Score (0-100)**, identifies critical CVEs, and provides **Auto-Remediation** scripts (Bash, Iptables, Ansible) to secure your infrastructure instantly.

---

## ✨ Key Features

- 🔍 **Automated Attack Surface Mapping** — One-click reconnaissance to discover endpoints, open ports, and technologies.
- 🧠 **Multi-LLM Threat Analysis** — Uses Claude 3 as the primary engine, with intelligent fallbacks to Gemini and Groq for uninterrupted analysis.
- 🛠️ **Auto-Remediation** — AI-generated mitigation scripts to instantly patch discovered vulnerabilities.
- 🤖 **Interactive SOC Copilot** — A context-aware chatbot designed to assist cybersecurity analysts in deep-dive investigations.
- 🌐 **Deep OSINT Search** — Real-time dark web and open-source intelligence gathering via Firecrawl and NVD databases.
- 📊 **Executive Reports** — Professional PDF threat reports with severity metrics and mitigation roadmaps.
- 🔄 **Continuous Monitoring** — Scheduled background scans with instant Discord webhook alerts for critical findings.

---

## 📚 Documentation (Wiki)

We have moved all comprehensive documentation to our **[GitHub Wiki](https://github.com/josapton/OmniGuard/wiki)** to keep this repository clean and focused.

Please visit the Wiki for detailed guides:

1. 🧑‍💻 **[End-User Manual](https://github.com/josapton/OmniGuard/wiki/End-User-Manual)**
   *A plain-english guide for non-technical users. Learn how to log in, run scans, read Risk Scores, and use the SOC Copilot.*
2. ⚙️ **[Admin Guide & Deployment](https://github.com/josapton/OmniGuard/wiki/Admin-Guide)**
   *The comprehensive manual for server administrators. Covers the CI/CD pipeline, VPS deployment, Docker architecture, and Environment variables management.*
3. 🔬 **[Technical Documentation](https://github.com/josapton/OmniGuard/wiki/Technical-Documentation)**
   *Deep-dive into the source code structure, API design, Database Schema, AI Fallback mechanisms, and integration logic.*

---

## 💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Backend** | Python 3.11, FastAPI, Uvicorn |
| **Database** | PostgreSQL 15 |
| **Search Engine**| Elasticsearch 8.12 |
| **Infrastructure**| Docker, Docker Compose, Traefik Reverse Proxy |
| **AI Models** | Anthropic Claude, Google Gemini, Groq Llama-3 |
| **Integrations** | Supabase Auth, Discord Webhooks, NVD, Shodan, Firecrawl |

---

<div align="center">
  <i>Developed for continuous security and peace of mind.</i>
</div>
