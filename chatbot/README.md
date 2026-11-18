# Saksham AI — Intelligent Chatbot Architecture & Training Hub

Welcome to the **Saksham AI Chatbot Hub** of Samarthya AI. This directory contains the complete technical specifications, model architectures, system prompts, training intents, and question datasets that power the Saksham conversational agent.

---

## 📁 Directory Structure & Documentation Map

| File | Description | Target Audience |
| :--- | :--- | :--- |
| **[`MODEL_SPECS.md`](file:///Users/amankumar/Desktop/Samarthya_AI/chatbot/MODEL_SPECS.md)** | Detailed AI model architecture, LLM configurations, parameters, latency metrics, voice engine, and DPDP Act 2023 compliance. | AI Engineers, Architects, Auditors |
| **[`SYSTEM_PROMPT.md`](file:///Users/amankumar/Desktop/Samarthya_AI/chatbot/SYSTEM_PROMPT.md)** | Production system prompt, persona definition, guardrails, fallback paths, and dual-track welfare/credit scoring directives. | Prompt Engineers, Evaluators |
| **[`TRAINED_QUESTIONS.md`](file:///Users/amankumar/Desktop/Samarthya_AI/chatbot/TRAINED_QUESTIONS.md)** | Human-readable catalog of 100+ trained questions across 10 categories in English, Hindi, and Hinglish with detailed answers. | Policy Analysts, Domain Experts, Users |
| **[`dataset_questions.json`](file:///Users/amankumar/Desktop/Samarthya_AI/chatbot/dataset_questions.json)** | Machine-readable JSON training dataset structured by `intent_id`, keywords, sample questions, and canonical responses. | ML Engineers, Test Harnesses, CI/CD |
| **[`README.md`](file:///Users/amankumar/Desktop/Samarthya_AI/chatbot/README.md)** | Master index and high-level technical overview (this document). | Everyone |

---

## 🤖 Models & Technologies Used

Saksham AI uses a **hybrid multi-tier inference architecture** to ensure zero hallucinations for statutory welfare benefits while providing natural, empathetic conversational reasoning.

### 1. Primary Reasoning Engine (Cloud LLM)
- **Model**: **Google Gemini 1.5 Flash** (`gemini-1.5-flash-latest`)
  - *Fallback / High-Complexity Tier*: **Google Gemini 1.5 Pro**
- **Provider**: Google AI Studio / Vertex AI
- **Context Window**: 1,000,000 tokens (Gemini 1.5)
- **Parameters**: `temperature: 0.2`, `top_p: 0.85`, `top_k: 40`, `max_output_tokens: 1024`
- **Role**: Multilingual understanding, conversational empathy, context extraction from user financial profiles, and conversational clarification.

### 2. Edge / Client-Side Deterministic Engine
- **Implementation**: [`js/samarthya-ai.js`](file:///Users/amankumar/Desktop/Samarthya_AI/js/samarthya-ai.js)
- **Engine Type**: Keyword match & semantic slot-filler with zero latency (< 5ms)
- **Role**: Provides instant, offline-capable responses for common queries (PM-KISAN, Ayushman Bharat, Credit Readiness scoring, language switching, and privacy rules). Ensures statutory criteria are never hallucinated or modified.

### 3. Voice Processing (STT & TTS)
- **Voice Intelligence**: **Wispr Flow** & HTML5 **Web Speech Recognition API** (`webkitSpeechRecognition`)
- **Text-to-Speech**: HTML5 `SpeechSynthesis` with regional Indian voice accents (`hi-IN`, `en-IN`, `pa-IN`, `mr-IN`, `ta-IN`, `gu-IN`)
- **Privacy Model**: Audio is streamed/transcribed ephemerally without persisting raw voice recordings on backend servers.

---

## 🎯 Question Categories & Training Scope

The chatbot is specifically trained on **10 core domains** covering over **104+ distinct queries and intents**:

1. **Platform & Identity**: What is Samarthya AI, who is Saksham, evolution from Sanjeevani Grid, and core mission.
2. **Government Schemes & Statutory Welfare**: Criteria and steps for PM-KISAN, Ayushman Bharat PM-JAY, PMAY, MGNREGA, e-Shram, and NFSA.
3. **Credit Readiness & Alternative Underwriting**: The 300–900 inclusive score, 5 evaluation pillars, PM MUDRA, PM SVANidhi, and moving from unbanked to bankable.
4. **Voice Navigation & Multilingual Access**: Mic controls, multi-dialect understanding, Hinglish recognition, and voice readouts.
5. **Privacy, DPDP Act 2023 & Security**: Zero Aadhaar/bank credential storage, zero OTP requests, ephemeral sessions, and encrypted client-side state.
6. **Agriculture & Farmer Welfare**: PM Fasal Bima (PMFBY 72-hour window), PM-KUSUM 60% solar subsidy, Soil Health Cards, and KCC interest subvention.
7. **Women & Child Empowerment**: PM Ujjwala 2.0 deposit-free LPG, Sukanya Samriddhi (8.2%), PMMVY, and Lakhpati Didi SHG loans up to ₹20 Lakh.
8. **Youth Employment, Skilling & Startups**: PM Vishwakarma ₹15,000 toolkits and 5% credit, PMKVY 4.0, and apprenticeship subsidies.
9. **Healthcare, Disability & Senior Citizens**: Ayushman Bharat ₹5 Lakh coverage for all seniors aged 70+, UDID disability cards, and Jan Aushadhi generic medicines.
10. **Portal Navigation & Technical Troubleshooting**: One-click PDF download of eligibility reports, interactive tracker usage, and reset tools.

---

## 🔒 Safety & Regulatory Guardrails

- **DPDP Act 2023 Compliant**: Client-side regex masks any 12-digit Aadhaar number before prompt evaluation.
- **Never Solicits Sensitive Credentials**: Refuses requests for OTPs, CVVs, passwords, or net banking credentials.
- **Statutory Financial Advice Boundary**: Distinguishes between official government subsidies and private financial advice; directs complex disputes to certified bank branches or CSC VLEs.

