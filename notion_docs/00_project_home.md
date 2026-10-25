# 00. Project Home — AlgoRevis

> 💡 **Welcome to AlgoRevis Documentation**: This workspace contains the authoritative technical architecture, schema specifications, and workflow documentation for **AlgoRevis**.

---

## 📌 Project Overview

| Property | Value |
|---|---|
| **Project Name** | **AlgoRevis** |
| **Tagline** | The Disciplined Curator for Algorithmic Mastery |
| **Current Version** | `1.0.0-production` |
| **Live Web App** | [https://algorevis-app.onrender.com](https://algorevis-app.onrender.com) |
| **Live Backend API** | [https://algorevis-backend.onrender.com](https://algorevis-backend.onrender.com) |
| **Git Repository** | [GitHub Repository](https://github.com/harsh13satyam/ALGO_REVIS_.git) |
| **License** | MIT License |
| **Primary Architecture** | Decoupled Client-Server (React 19 + Node/Express 5 + MongoDB Atlas + Chrome Extension MV3) |

---

## 🎯 The Problem & The Solution

```mermaid
flowchart LR
    subgraph Problem["The Traditional LeetCode Trap"]
        P1["Solve Problem Today"] --> P2["Forget Intuition in 2 Weeks"]
        P2 --> P3["Passive Re-reading"]
        P3 --> P4["Blanking Out in Interviews"]
    end
    
    subgraph Solution["The AlgoRevis Disciplined System"]
        S1["One-Click Extension Capture\n(Code + Intuition + Image)"] --> S2["SuperMemo SM-2\nSpaced-Repetition Engine"]
        S2 --> S3["Morning Daily Challenge\n(Question A: Revision)"]
        S3 --> S4["AI Variation Generation\n(Question B: Gemini Pattern Variant)"]
        S4 --> S5["In-Browser Sandbox Validation\n(Immediate Feedback)"]
        S5 --> S6["Evening Streak Notification\n(Brevo REST API)"]
    end
```

### The Problem
Engineers preparing for top-tier software engineering interviews suffer from the **"Leaky Bucket Problem"**:
- You solve 200+ problems, but 3 weeks later, you cannot recall the invariant for sliding window or the base cases for dynamic programming.
- Problem solutions are scattered across platforms (LeetCode, GeeksforGeeks, Codeforces), personal notebooks, and GitHub gists with zero systematic recall mechanism.
- Reviewing solutions passively (re-reading code) gives an illusion of competence; only **active recall** under simulated test conditions creates durable neural pathways.

### The Solution: AlgoRevis
**AlgoRevis** transforms DSA preparation into a disciplined, automated, spaced-repetition habit:
1. **Seamless Capture**: A Chrome Extension (Manifest V3) scrapes problem statements, constraints, submitted code, and intuition notes from LeetCode, GeeksforGeeks, and Codeforces with one click.
2. **Dual-Question Challenge**: Every morning, the engine selects **Question A** (a past problem scheduled by SM-2 spaced repetition) and generates **Question B** (a contextually calibrated AI variant created by Google Gemini).
3. **Integrated Execution**: A split-screen Monaco code editor allows running JavaScript and Python code against public and hidden test cases in an isolated execution sandbox.
4. **Streak Protection**: An automated dual-reminder system (09:00 AM problem release + 07:00 PM streak protection alert) delivered via Brevo HTTPS REST API keeps users disciplined every day.

---

## 🏗️ High-Level System Architecture

```mermaid
flowchart TD
    subgraph Clients["Client Layer"]
        EXT["Chrome Extension MV3\n(LeetCode/GFG/Codeforces Scraping)"]
        WEB["Web Application (React 19 + Vite 8)\nMonaco Code Editor & Split Compiler"]
    end

    subgraph Gateway["API & Routing Layer"]
        CORS["CORS & Cookie Parser"]
        AUTH_MW["JWT Auth Middleware\n(Silent /api/auth/me)"]
    end

    subgraph Backend["Application Server (Express 5.2 on Render)"]
        AUTH_ROUTER["Auth Controller"]
        PROB_ROUTER["Problems Controller"]
        CHAL_ROUTER["Challenges & Compiler Controller"]
        SCHEDULER["Cron Scheduler Worker\n(Tick every 60s)"]
    end

    subgraph Engines["Core Services"]
        REV_ENG["Revision Engine\n(SM-2 Algorithm)"]
        AI_ENG["Gemini AI Service\n(Archetype Pattern Detection)"]
        SANDBOX["Code Execution Sandbox\n(JS VM & Python CLI)"]
        EMAIL_SVC["Brevo REST API\n(Port 443 HTTPS SMTP)"]
        CLOUDINARY["Cloudinary CDN\n(Intuition Screenshot Hosting)"]
    end

    subgraph Data["Database Layer"]
        MONGO[("MongoDB Atlas Cloud Cluster\nUsers, Problems, Challenges, Attempts")]
    end

    EXT -->|Bearer JWT + REST| AUTH_MW
    WEB -->|HTTP-Only Cookie + REST| AUTH_MW
    AUTH_MW --> AUTH_ROUTER & PROB_ROUTER & CHAL_ROUTER
    PROB_ROUTER --> REV_ENG & CLOUDINARY & MONGO
    CHAL_ROUTER --> AI_ENG & SANDBOX & MONGO
    SCHEDULER --> REV_ENG & AI_ENG & EMAIL_SVC & MONGO
```

---

## 📑 Fast Navigation to All Documentation Pages

- **[01. Executive Summary](./01_executive_summary.md)**: Vision, differentiators, and impact.
- **[02. Requirements and Features](./02_requirements_and_features.md)**: Verified functional & non-functional requirements.
- **[03. System Architecture](./03_system_architecture.md)**: Comprehensive architectural breakdown.
- **[04. Data Flow and Process Diagrams](./04_data_flow_and_process_diagrams.md)**: Sequence diagrams for auth, scheduling, code execution.
- **[05. Database Design](./05_database_design.md)**: MongoDB schemas, ERDs, and index strategies.
- **[06. API Documentation](./06_api_documentation.md)**: Exhaustive route specifications and payloads.
- **[07. Authentication and Security](./07_authentication_and_security.md)**: Cryptographic password hashing and sandbox isolation.
- **[08. Installation and Local Development](./08_installation_and_local_development.md)**: Step-by-step developer onboarding.
- **[09. Internal Codebase Documentation](./09_internal_codebase_documentation.md)**: File-by-file directory reference.
- **[10. Testing and Quality Assurance](./10_testing_and_quality_assurance.md)**: Test suites, assertions, and coverage gates.
- **[11. Deployment and DevOps](./11_deployment_and_devops.md)**: Cloud hosting, Render build pipelines, and health checks.
- **[12. Troubleshooting and FAQ](./12_troubleshooting_and_faq.md)**: Known edge cases, recovery strategies, and error matrices.
- **[13. Roadmap and Future Improvements](./13_roadmap_and_future_improvements.md)**: Completed milestones and engineering backlog.
- **[14. Contribution Guidelines](./14_contribution_guidelines.md)**: Code standards, branching, and pull requests.
- **[15. Glossary and References](./15_glossary_and_references.md)**: Definitions, academic references, and tool docs.
- **[Notion Import Guide](./NOTION_IMPORT_GUIDE.md)**: Step-by-step guide to import into Notion.
