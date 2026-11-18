# 📚 Complete Training Questions Catalog — Saksham AI Chatbot

This catalog lists all **100+ intents and questions** the Saksham AI chatbot has been trained to recognize and resolve. Each entry includes:
- **Intent Name**
- **User Query Variations** (English, Hindi, Hinglish)
- **Extracted Entities & Keywords**
- **Canonical Model Response Summary**
- **Target Application Route**

---

## Category 1: About Saksham & General Questions

### Intent 1.1: `about_saksham`
* **Training Phrases (English):**
  - "What is Saksham and how does it work?"
  - "Tell me about the Saksham portal."
  - "Who created Saksham and what is its goal?"
  - "What does Saksham AI do?"
  - "Explain the dual track welfare system."
* **Training Phrases (Hindi / Hinglish):**
  - "सक्षम पोर्टल क्या है और यह कैसे काम करता है?"
  - "Saksham kya hai aur kaise use karein?"
  - "Is website ka kya fayda hai?"
  - "Ye portal kis kaam aata hai?"
* **Keywords:** `saksham`, `what is`, `about`, `kya hai`, `kaise kaam karta`, `dual track`
* **Response Summary:** Introduces Saksham as an intelligent dual-track welfare matching portal for Persons with Disabilities (PwD schemes) and SC entrepreneurs (NSFDC concessional loans). Emphasizes zero middlemen, sub-2 second matching, and 100% DPDP Act 2023 compliance.
* **Call to Action:** `🎯 Start Finding Schemes`

---

### Intent 1.2: `how_to_match_schemes`
* **Training Phrases (English):**
  - "How do I check my eligibility?"
  - "Where do I find schemes matching my profile?"
  - "How long does scheme matching take?"
  - "Can I find scholarships without creating an account?"
* **Training Phrases (Hindi / Hinglish):**
  - "Main apni yogyata kaise check karoon?"
  - "Scheme matching kaise hoti hai?"
  - "Mujhe kaunsi scheme milegi kaise pata chalega?"
* **Keywords:** `match`, `check eligibility`, `yogyata`, `how to find`, `kaise check karein`
* **Response Summary:** Guides the user through the 60-second criteria intake (Age, Disability Type, Severity %, State, Annual Income). Explains that calculations happen instantly in the browser.
* **Call to Action:** Directs to `#page-match`.

---

## Category 2: NSFDC Concessional Loans & Credit Schemes (SIH26093)

### Intent 2.1: `nsfdc_overview`
* **Training Phrases (English):**
  - "How do NSFDC concessional loans work for SC entrepreneurs?"
  - "What is NSFDC channel finance?"
  - "Can Scheduled Caste business owners get low-interest loans?"
  - "What are the concessional credit schemes available?"
* **Training Phrases (Hindi / Hinglish):**
  - "NSFDC loan kya hota hai?"
  - "SC entrepreneurs ke liye sarkari loan kaise milta hai?"
  - "Kam byaj wala business loan kaise lein?"
  - "NSFDC scheme ki jaankari dein."
* **Keywords:** `nsfdc`, `credit scheme`, `concessional loan`, `sc business`, `low interest loan`
* **Response Summary:** Details NSFDC's mandate offering 6.5%–12% low-interest channel finance (compared to commercial banks at 14%–18%) for SC beneficiaries with household income ≤ ₹5.00 Lakh.
* **Call to Action:** `💼 Match Credit Schemes`

---

### Intent 2.2: `nsfdc_micro_finance`
* **Training Phrases (English):**
  - "What is the maximum loan limit for NSFDC Micro Finance?"
  - "Can I get a loan up to ₹1.4 Lakh for my small shop?"
  - "What is the interest rate on NSFDC Micro Finance?"
* **Training Phrases (Hindi / Hinglish):**
  - "Chhote vyapar ke liye Micro Finance loan kitna milta hai?"
  - "1.4 lakh tak ka loan kaise lein?"
  - "Micro finance loan ka interest kitna hai?"
* **Keywords:** `micro finance`, `1.4 lakh`, `small trade`, `artisan loan`, `micro enterprise`
* **Response Summary:** Explains that loans up to ₹1,40,000 carry interest rates of 6.5%–8% p.a. with 3–6 months moratorium holiday, tailored for small shops, artisans, and vendors.

---

### Intent 2.3: `nsfdc_term_loan`
* **Training Phrases (English):**
  - "What is the NSFDC Term Loan scheme?"
  - "Can I get up to ₹50 Lakh for a manufacturing or transport business?"
  - "What is the tenure and moratorium on NSFDC Term Loans?"
* **Training Phrases (Hindi / Hinglish):**
  - "50 lakh tak ka business loan kaise milega?"
  - "Term loan kitne saal ke liye milta hai?"
  - "Bade project ke liye NSFDC loan ki shartein kya hain?"
* **Keywords:** `term loan`, `50 lakh`, `tenure`, `project cost`, `manufacturing`
* **Response Summary:** Explains project finance up to ₹50,00,000 covering up to 90% of viable project costs at 8%–12% interest for up to 10 years tenure with up to 12 months moratorium holiday.

---

### Intent 2.4: `nsfdc_education_loan`
* **Training Phrases (English):**
  - "What are the interest rates on NSFDC Education Loans?"
  - "Can SC students get a loan for studying abroad?"
  - "Is the interest rate lower for female students?"
* **Training Phrases (Hindi / Hinglish):**
  - "Padhai ke liye NSFDC education loan kitna milta hai?"
  - "Videsh padhne ke liye loan mil sakta hai?"
  - "Ladkiyon ke liye education loan par kitni chhoot hai?"
* **Keywords:** `education loan`, `study abroad`, `female concession`, `20 lakh`, `40 lakh`
* **Response Summary:** Covers up to ₹20 Lakh (India) and ₹40 Lakh (Abroad). Explains special concessional rate: 6.5% for female students and 7.5% for male students with zero EMI during course duration + 6 months post-study holiday.

---

## Category 3: Channel Partners & "Nearest Capable" Routing

### Intent 3.1: `channel_partners_explanation`
* **Training Phrases (English):**
  - "Which channel partner should I apply through for credit?"
  - "Does NSFDC give loans directly to my bank account?"
  - "Where do I submit my NSFDC loan application?"
* **Training Phrases (Hindi / Hinglish):**
  - "NSFDC loan ke liye kahan apply karein?"
  - "Channel partner kya hota hai?"
  - "Direct NSFDC office jaana padta hai kya?"
* **Keywords:** `channel partner`, `sca`, `apply through`, `where to apply`, `disbursement`
* **Response Summary:** Clarifies that NSFDC does *not* disburse funds directly to individuals. Applications route through accredited Channel Partners: State Channelizing Agencies (SCAs like DSFDC, UPSCFDC, MPBCDC), Public Sector Banks (PSBs like PNB, SBI, BoB), and Regional Rural Banks (RRBs).

---

### Intent 3.2: `nearest_capable_npa_filter`
* **Training Phrases (English):**
  - "What is the Nearest Capable filter?"
  - "Why does Saksham filter out high-NPA bank branches?"
  - "How do I avoid bank branches that reject or delay loans?"
* **Training Phrases (Hindi / Hinglish):**
  - "Nearest Capable filter kya hai?"
  - "NPA filtering se kya fayda hai?"
  - "Kaunsa bank branch sabse jaldi loan sanction karega?"
* **Keywords:** `nearest capable`, `npa`, `high npa`, `branch backlog`, `active lender`
* **Response Summary:** Explains that high NPA backlogs or exhausted quotas cause silent loan rejections at branch level. Saksham's GIS locator filters out high-NPA branches by default to route entrepreneurs directly to healthy, active lending branches.

---

## Category 4: Financial Calculations, Moratorium & EMI Holidays

### Intent 4.1: `moratorium_periods`
* **Training Phrases (English):**
  - "What is the moratorium period on NSFDC loans?"
  - "Do I have to pay EMIs immediately from month one?"
  - "How long is the repayment holiday?"
* **Training Phrases (Hindi / Hinglish):**
  - "Moratorium period kya hota hai?"
  - "Pehle mahine se EMI bharni padegi kya?"
  - "Loan wapas karne mein kitna time milta hai?"
* **Keywords:** `moratorium`, `emi holiday`, `repayment`, `gestation period`
* **Response Summary:** Explains that statutory moratorium shields the borrower from EMIs while setting up business: 3–6 months for Micro Finance, 6–12 months for Term Loans, and course duration + 6 months for Education Loans.
* **Call to Action:** Launches `Financial Calculator`.

---

### Intent 4.2: `emi_calculator_guidance`
* **Training Phrases (English):**
  - "How can I calculate my monthly EMI for a 5 lakh loan?"
  - "Can I see the month-by-month amortization schedule?"
  - "Where is the financial calculator?"
* **Training Phrases (Hindi / Hinglish):**
  - "Mera mahina ka EMI kitna aayega?"
  - "EMI calculator kahan hai?"
  - "Interest aur principal ka hisaab kaise dekhein?"
* **Keywords:** `emi`, `calculator`, `amortization`, `calculation`, `byaj hisab`
* **Response Summary:** Directs the user to the interactive Financial Calculator tool to simulate tenure, interest subsidies, and download CSV repayment schedules.

---

## Category 5: Disability Scholarships (PwD Welfare Track)

### Intent 5.1: `pwd_scholarships_overview`
* **Training Phrases (English):**
  - "Which scholarships are available for 40%+ disability?"
  - "Can disabled students get government scholarships?"
  - "What are the central scholarships for PwD students?"
* **Training Phrases (Hindi / Hinglish):**
  - "Divyang vidyarthiyon ke liye kaunsi scholarship hai?"
  - "40% disability par scholarship kaise milti hai?"
  - "PwD scholarship ke baare mein batayein."
* **Keywords:** `scholarship`, `pwd scholarship`, `40% disability`, `pre matric`, `post matric`
* **Response Summary:** Details Pre-Matric (Class 9–10), Post-Matric (Class 11+ to PG), Top Class (IIT/IIM/AIIMS), and National Fellowships (M.Phil/Ph.D.) processed through the National Scholarship Portal (NSP).

---

### Intent 5.2: `pre_matric_scholarship`
* **Training Phrases (English):**
  - "What is the Pre-Matric scholarship for PwD?"
  - "Can a class 9 or 10 disabled student get scholarship?"
  - "What is the income limit for Pre-Matric disability scholarship?"
* **Training Phrases (Hindi / Hinglish):**
  - "Class 9 aur 10 ke liye scholarship kaise milegi?"
  - "Pre-Matric scholarship ki eligibility kya hai?"
  - "Pre-matric mein kitna paisa milta hai?"
* **Keywords:** `pre matric`, `class 9`, `class 10`, `books grant`, `maintenance allowance`
* **Response Summary:** Class 9–10, disability ≥ 40%, family income ≤ ₹2.5 Lakh/year. Provides maintenance allowance and annual book grant.

---

### Intent 5.3: `post_matric_scholarship`
* **Training Phrases (English):**
  - "What does the Post-Matric disability scholarship cover?"
  - "Does government pay full college tuition fees for disabled students?"
  - "Who is eligible for Post-Matric PwD scholarship?"
* **Training Phrases (Hindi / Hinglish):**
  - "College students ke liye Post-Matric scholarship kya hai?"
  - "Kya college fee poori maaf hoti hai?"
  - "Post-matric scholarship mein kitna allowance milta hai?"
* **Keywords:** `post matric`, `college fee`, `degree`, `diploma`, `4000 allowance`
* **Response Summary:** Class 11 through Postgraduate degrees. 100% non-refundable tuition fees reimbursed plus up to ₹4,000/month maintenance allowance for hostellers.

---

### Intent 5.4: `top_class_scholarship`
* **Training Phrases (English):**
  - "What is the Top Class Education Scheme for disabled students?"
  - "Can I get a free laptop under Top Class scholarship?"
  - "Which institutes are covered under Top Class PwD scheme?"
* **Training Phrases (Hindi / Hinglish):**
  - "IIT ya IIM mein padhne wale PwD students ko scholarship milti hai?"
  - "Top class scholarship mein laptop milta hai kya?"
  - "Top class scheme ki eligibility kya hai?"
* **Keywords:** `top class`, `iit`, `iim`, `aiims`, `laptop grant`, `2 lakh tuition`
* **Response Summary:** For premier institutions (IITs, IIMs, NITs, AIIMS). Provides full tuition fee up to ₹2 Lakh/year + ₹30,000 one-time computer grant + living allowances.

---

### Intent 5.5: `national_fellowship_nfpwd`
* **Training Phrases (English):**
  - "What is NFPwD for research scholars?"
  - "How much is the JRF and SRF fellowship for disabled Ph.D. scholars?"
  - "Is NET qualification required for National Fellowship for PwD?"
* **Training Phrases (Hindi / Hinglish):**
  - "Ph.D. karne wale divyang chhatro ke liye fellowship kitni hai?"
  - "NFPwD fellowship kya hai?"
  - "JRF aur SRF ka stipend kitna hota hai?"
* **Keywords:** `nfpwd`, `fellowship`, `jrf`, `srf`, `phd`, `mphil`, `31000`
* **Response Summary:** ₹31,000/month for JRF, ₹35,000/month for SRF + HRA and annual contingency grants for research scholars with disabilities.

---

## Category 6: Assistive Devices & ADIP / ALIMCO Appliances

### Intent 6.1: `adip_scheme_overview`
* **Training Phrases (English):**
  - "How do I apply for free assistive devices under ADIP?"
  - "What is the ADIP scheme?"
  - "Can I get a free motorized tricycle or wheelchair from government?"
  - "How does ALIMCO distribute aids and appliances?"
* **Training Phrases (Hindi / Hinglish):**
  - "ADIP scheme kya hai?"
  - "Free wheelchair ya motorized tricycle kaise milegi?"
  - "ALIMCO se saaman kaise milta hai?"
  - "Divyang upkaran ke liye kahan apply karein?"
* **Keywords:** `adip`, `alimco`, `wheelchair`, `motorized tricycle`, `assistive device`, `free aid`
* **Response Summary:** Details ALIMCO's scheme providing 100% free aids if family income is ≤ ₹20,000/month (50% subsidy for ₹20,001–₹30,000/month). Covers motorized tricycles, smart wheelchairs, prosthetic limbs, and crutches.

---

### Intent 6.2: `hearing_and_visual_aids`
* **Training Phrases (English):**
  - "Does government provide free hearing aids for deaf children?"
  - "Can blind students get a free smart cane or screen reading laptop?"
  - "What is the subsidy for pediatric cochlear implants?"
* **Training Phrases (Hindi / Hinglish):**
  - "Kaan ki machine free mein kaise milti hai?"
  - "Andhe bacchon ke liye braille device ya laptop milta hai kya?"
  - "Cochlear implant ke liye kitna paisa milta hai?"
* **Keywords:** `hearing aid`, `cochlear implant`, `braille`, `smart cane`, `daisy player`
* **Response Summary:** Outlines digital BTE hearing aids, up to ₹6 Lakh grant for cochlear implants for children under 5, and smart canes / Daisy players / JAWS-enabled screen reader laptops for visual impairments.

---

## Category 7: Statutory Documents & UDID Swavlamban Card

### Intent 7.1: `required_documents_list`
* **Training Phrases (English):**
  - "What documents are needed to apply for government welfare schemes?"
  - "Which certificates do I need for scholarship verification?"
  - "Is income certificate required from Tehsildar?"
* **Training Phrases (Hindi / Hinglish):**
  - "Government schemes ke liye kya kya document chahiye?"
  - "Form bharne ke liye kaunse paper lagte hain?"
  - "Income certificate kiska hona chahiye?"
* **Keywords:** `document`, `documents needed`, `kya paper chahiye`, `income certificate`, `domicile`
* **Response Summary:** Comprehensive 5-point checklist: 1. Disability / UDID Certificate (≥40%), 2. Income Certificate from Competent Revenue Officer, 3. Educational Passing Marksheets, 4. Aadhaar-seeded Bank Account for DBT, 5. State Domicile Certificate.

---

### Intent 7.2: `udid_swavlamban_card`
* **Training Phrases (English):**
  - "What is a UDID card and how do I apply for one?"
  - "Is UDID card mandatory across India?"
  - "What benefits does Swavlamban card provide?"
* **Training Phrases (Hindi / Hinglish):**
  - "UDID card kya hota hai aur kaise banwaye?"
  - "Swavlamban card ke kya fayde hain?"
  - "Divyang certificate online kaise banta hai?"
* **Keywords:** `udid`, `swavlamban`, `disability certificate`, `swavlambancard.gov.in`
* **Response Summary:** Explains the Unique Disability ID (UDID) issued via `swavlambancard.gov.in`. Acts as a single nationwide verified pass for railway ticket concessions (50–75%), hospital care, and Section 80U income tax deductions.

---

## Category 8: Privacy, Security & DPDP Act 2023 Compliance

### Intent 8.1: `aadhaar_and_privacy`
* **Training Phrases (English):**
  - "Does Saksham require my Aadhaar card?"
  - "Is it safe to enter my details on Saksham?"
  - "Do you upload or store my certificates in the cloud?"
  - "How is Saksham compliant with DPDP Act 2023?"
* **Training Phrases (Hindi / Hinglish):**
  - "Kya Saksham par Aadhaar card upload karna padega?"
  - "Mera data safe hai kya?"
  - "Kya mere documents server par save hote hain?"
* **Keywords:** `aadhaar`, `privacy`, `document upload`, `data safe`, `dpdp act 2023`
* **Response Summary:** Reassures the user that **no Aadhaar or personal document upload is ever required** on Saksham. Matching executes purely in the browser session with zero server data harvesting in strict compliance with the Digital Personal Data Protection Act 2023.

---

## Category 9: Official Notifications, Deadlines & WhatsApp Alerts

### Intent 9.1: `whatsapp_channel_alerts`
* **Training Phrases (English):**
  - "How do I get WhatsApp alerts for new government schemes?"
  - "Is there an official WhatsApp group or channel?"
  - "How can I stay updated on scholarship deadlines?"
* **Training Phrases (Hindi / Hinglish):**
  - "WhatsApp par update kaise milega?"
  - "Nayi sarkari yojana ki jaankari WhatsApp par milti hai kya?"
  - "WhatsApp group join kaise karein?"
* **Keywords:** `whatsapp`, `alert`, `channel`, `notification`, `deadline update`
* **Response Summary:** Directs user to the VIP WhatsApp Alert service for real-time announcements on new Ministry releases, deadline extensions, and local ALIMCO appliance distribution camps.
* **Call to Action:** Opens WhatsApp VIP Lead Modal.

---

## Category 10: Out-Of-Domain Guardrail Questions (Negative Test Prompts)

### Intent 10.1: `out_of_domain_reject`
* **Training Phrases (General Out-Of-Domain):**
  - "Who won the cricket world cup?"
  - "What is the weather today in Delhi?"
  - "Can you write a python script to hack a website?"
  - "Tell me a funny joke."
  - "Who is the president of USA?"
  - "What is the price of Bitcoin?"
  - "How do I cook butter chicken?"
* **Keywords Filtered:** `cricket`, `weather`, `bitcoin`, `crypto`, `hack`, `python code for`, `joke`, `president of`, `recipe`
* **Model Handling:** Blocks the prompt gracefully with the `Saksham Domain Assistant` badge, reiterating that the bot is strictly trained on Government PwD welfare schemes, scholarships, and NSFDC loans.

