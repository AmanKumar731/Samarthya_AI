# 🤖 AI Model Specifications & Architecture — Saksham Chatbot

This document details the **Artificial Intelligence models, architectures, reasoning pipelines, and runtime specifications** powering the **Saksham AI Assistant** (formerly Sanjeevani Grid AI).

---

## 1. Model Overview & Tech Stack

The Saksham Chatbot operates on a **Hybrid Multi-Tier AI Architecture** designed for high availability, zero hallucination on statutory government rules, sub-second latency, and strict DPDP Act 2023 privacy compliance.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      User Query (Text / Voice)                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │    Voice Transcription Tier   │
                    │   Wispr Flow (Web Speech API) │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │      Safety & Domain Guard    │
                    │   Off-Topic & Exploit Filter  │
                    └───────┬───────────────┬───────┘
            Within Domain   │               │ Out-of-Domain
                            │               ▼
                            │      ┌─────────────────────────┐
                            │      │ Domain-Restricted Notice │
                            │      │  (Safe Boundary Reject) │
                            │      └─────────────────────────┘
                            ▼
    ┌───────────────────────────────────────────────────────────────┐
    │                Dual-Inference Execution Engine                │
    ├───────────────────────────────┬───────────────────────────────┤
    │  Tier 1: Cloud Foundation LLM │  Tier 2: Edge Deterministic   │
    │  Google Gemini 1.5 Flash/Pro  │  Local Statutory Rule Engine  │
    │  (Semantic Reasoning & NLU)   │  (Zero-Latency / Offline Hub) │
    └───────────────────────────────┴───────────────────────────────┘
                                    │
                                    ▼
    ┌───────────────────────────────────────────────────────────────┐
    │                Statutory Scheme Knowledge Base                │
    │    50+ Welfare Schemes • NSFDC Credit • ALIMCO • UDID • DPDP  │
    └───────────────────────────────────────────────────────────────┘
```

---

## 2. Core AI Foundation Models

### A. Primary Conversational LLM: **Google Gemini 1.5 Flash / Pro**
* **Provider:** Google DeepMind / Google Cloud Vertex AI / Gemini API
* **Model Identifier:** `gemini-1.5-flash` (Primary Production) / `gemini-1.5-pro` (Complex Multi-step Appeals)
* **Model Type:** Multimodal Transformer Architecture with Long-Context Window
* **Context Window:** Up to 1,000,000 tokens (Gemini 1.5 Flash)
* **Primary Role:**
  * Natural language understanding (NLU) across Indian linguistic nuances, colloquialisms, and regional terminology.
  * Extracting applicant criteria from conversational input (age, caste certificate status, disability severity percentage, income slab, desired business project cost).
  * Synthesizing multi-scheme comparative advice without bureaucrat jargon.

#### Hyperparameters & Inference Configuration:
| Parameter | Setting | Rationale |
| :--- | :--- | :--- |
| **Temperature** | `0.20` | Strict factual fidelity; prevents hallucination of non-existent government funds or inaccurate interest rates. |
| **Top-P (Nucleus Sampling)** | `0.80` | Ensures high lexical consistency on legal and statutory terms. |
| **Top-K** | `40` | Balances vocabulary diversity with statutory compliance. |
| **Max Output Tokens** | `1024` | Keeps responses concise, readable, and mobile-friendly. |
| **Stop Sequences** | `["User:", "\n\n---"]` | Clean dialog turn isolation. |
| **Safety Thresholds** | `BLOCK_LOW_AND_ABOVE` (Hate, Harassment, Sexual, Dangerous) | Maximum public sector safety standards. |

---

### B. Client-Side Edge Deterministic Engine: **Saksham NLU Hub**
* **Engine Type:** Embedded JavaScript Rule & Semantic Intent Matcher (`js/samarthya-ai.js`)
* **Execution Location:** 100% Client-Side Browser Engine (zero external network latency)
* **Latency:** `< 50ms` (Instant response)
* **Primary Role:**
  * Guarantees 0% hallucination on statutory government figures:
    * Micro Finance Loan Limit: `≤ ₹1,40,000`
    * Term Loan Limit: `≤ ₹50,00,000`
    * Concessional Interest: `6.5% – 12.0%`
    * Moratorium Holidays: `3–6 months` (Micro) / `6–12 months` (Term) / `Course + 6 months` (Education)
    * Disability Benchmark: `≥ 40%` for UDID/NSP/ADIP
    * Maximum Income: `≤ ₹5.0L` (NSFDC Credit) / `≤ ₹2.5L` (Pre/Post-Matric Scholarships)
  * Seamless fallback when user is offline or experiencing unstable 2G connectivity.

---

### C. Voice Input Engine: **Wispr Flow Voice**
* **Provider / Technology:** HTML5 Web Speech API (`webkitSpeechRecognition`) + Procedural Audio Waveform Synthesis (`js/wispr-flow.js`)
* **Acoustic Processing:** Real-Time `AnalyserNode` FFT Frequency Data visualization.
* **Supported Locales:**
  * `hi-IN` (Hindi)
  * `en-IN` (Indian English)
  * `mr-IN` (Marathi)
  * `pa-IN` (Punjabi)
  * `ta-IN` (Tamil)
  * `gu-IN` (Gujarati)
* **Functionality:** Continuous listening, smart punctuation handling, automated entity extraction to auto-fill criteria intake forms.

---

## 3. Specialized Domain Modules

### 1. Nearest Capable NPA Channel Filter
* **Algorithmic Logic:** Scans channelizing banks (State Channelizing Agencies, Public Sector Banks, Regional Rural Banks) within the applicant's state and filters out branches with high NPA (Non-Performing Asset) backlogs or frozen sanction quotas to prevent application stagnation.

### 2. Dual-Track Intent Classifier
* **Track 1: Welfare & Disability Entitlements** (UDID, ALIMCO assistive appliances, Pre/Post-Matric Scholarships, Top Class, National Overseas, Railway Concessions).
* **Track 2: Concessional Credit & Loans (SIH26093)** (NSFDC Term Loans, Micro Finance, Education Loan, Collateral Subsidy, Amortization Schedule).

### 3. Out-Of-Domain (OOD) Guardrail
* Rejects off-topic inquiries (weather, cryptocurrency, gaming, coding, entertainment, general jokes) with an institutional disclaimer redirecting the user back to statutory PwD and SC welfare topics.

---

## 4. Privacy & Compliance Protocol (DPDP Act 2023)

* **Zero Cloud Document Storage:** The chatbot **never** requests or stores Aadhaar cards, PAN numbers, bank passbooks, or disability certificates on cloud databases.
* **Client-Session Scored:** All calculations and eligibility queries evaluate dynamically in memory.
* **Official Gateway Handoff:** For actual application submission, the chatbot hands off to authenticated official endpoints (`scholarships.gov.in`, `swavlambancard.gov.in`, `nsfdc.nic.in`, `alimco.in`).

