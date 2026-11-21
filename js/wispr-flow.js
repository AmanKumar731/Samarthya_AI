// ============================================
// Samarthya — Wispr Flow AI Voice Engine
// Next-Gen Continuous Voice Dictation, Smart Field Autofill & Audio Wave Visualizer
// ============================================

const WisprFlow = {
  isRecording: false,
  recognition: null,
  activeTargetInput: null,
  lastTranscript: '',
  animationId: null,
  restartTimeout: null,

  init() {
    this.setupSpeechRecognition();
    this.setupVisualizerBar();
  },

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API is not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      const langMap = { en: 'en-IN', hi: 'hi-IN', pa: 'pa-IN', mr: 'mr-IN', ta: 'ta-IN', gu: 'gu-IN' };
      const currentLang = (typeof I18N !== 'undefined' && I18N.currentLang) ? I18N.currentLang : 'en';
      this.recognition.lang = langMap[currentLang] || 'en-IN';

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const displayText = (finalTranscript || interimTranscript).trim();
        if (displayText) {
          this.updateTranscriptDisplay(displayText, false);
        }

        // Handle targeted text field direct voice fill
        if (this.activeTargetInput && displayText) {
          const cleanName = this.cleanSpokenName(displayText);
          if (cleanName) {
            this.activeTargetInput.value = cleanName;
            this.activeTargetInput.dispatchEvent(new Event('input', { bubbles: true }));
            this.activeTargetInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }

        // Stream into AI drawer if active and not targeting specific input
        if (!this.activeTargetInput) {
          const aiDrawer = document.getElementById('aiDrawer');
          const aiInput = document.getElementById('aiChatInput');
          if (aiDrawer && aiDrawer.classList.contains('open') && aiInput) {
            aiInput.value = displayText;
          }
        }

        // Process final or confident phrases for smart form filling & commands
        if (finalTranscript) {
          this.lastTranscript = finalTranscript.trim();
          this.processWisprInput(this.lastTranscript);
        }
      };

      this.recognition.onerror = (e) => {
        // Non-fatal silence pause — do NOT stop continuous recognition
        if (e.error === 'no-speech') {
          return;
        }

        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          console.warn('Wispr recognition access denied:', e.error);
          this.showWisprNotification('Microphone access was denied. Please allow microphone permissions in your browser.', 'error');
          this.stop();
          return;
        }

        if (e.error === 'network') {
          console.warn('Wispr network error during recognition');
          this.showWisprNotification('Network issue during voice recognition. Please verify connection.', 'warn');
          return;
        }

        console.warn('Wispr recognition error:', e.error);
      };

      this.recognition.onend = () => {
        // If user hasn't explicitly stopped recording, automatically restart to maintain continuous listening
        if (this.isRecording) {
          clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (this.isRecording && this.recognition) {
              try {
                const langMap = { en: 'en-IN', hi: 'hi-IN', pa: 'pa-IN', mr: 'mr-IN', ta: 'ta-IN', gu: 'gu-IN' };
                const cur = (typeof I18N !== 'undefined' && I18N.currentLang) ? I18N.currentLang : 'en';
                this.recognition.lang = langMap[cur] || 'en-IN';
                this.recognition.start();
              } catch (err) {
                // Ignore InvalidStateError if already started
              }
            }
          }, 150);
        }
      };
    } catch (err) {
      console.warn('SpeechRecognition initialization error:', err);
    }
  },

  toggle(targetInputId = null) {
    if (this.isRecording) {
      if (targetInputId && this.activeTargetInput && this.activeTargetInput.id === targetInputId) {
        this.stop();
        return;
      } else if (targetInputId) {
        // Switch active target input without stopping recording
        this.activeTargetInput = document.getElementById(targetInputId);
        const nameLabel = targetInputId.includes('credit') ? 'Entrepreneur Name' : 'Student Name';
        this.showWisprNotification(`🎙️ Now speaking into ${nameLabel}`);
        return;
      }
      this.stop();
    } else {
      this.start(targetInputId);
    }
  },

  start(targetInputId = null) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.showWisprNotification('Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.', 'error');
      return;
    }

    if (!this.recognition) {
      this.setupSpeechRecognition();
    }

    this.activeTargetInput = targetInputId ? document.getElementById(targetInputId) : null;
    this.isRecording = true;

    if (window.SoundEngine && SoundEngine.playClick) {
      SoundEngine.playClick();
    }

    // Activate floating bar
    const bar = document.getElementById('wisprFlowBar');
    if (bar) bar.classList.add('active');

    // Activate button recording states
    const pills = document.querySelectorAll('.wispr-btn, .voice-input-btn, #headerVoiceBtn');
    pills.forEach(p => p.classList.add('recording'));

    const isHindi = typeof I18N !== 'undefined' && I18N.currentLang === 'hi';
    const initialInstruction = isHindi
      ? 'सुन रहा हूँ... हिंदी या अंग्रेजी में स्वाभाविक रूप से बोलें'
      : 'Listening... Speak naturally in Hindi or English';

    this.updateTranscriptDisplay(initialInstruction, true);
    this.startAudioVisualization();

    if (this.recognition) {
      try {
        const langMap = { en: 'en-IN', hi: 'hi-IN', pa: 'pa-IN', mr: 'mr-IN', ta: 'ta-IN', gu: 'gu-IN' };
        const cur = (typeof I18N !== 'undefined' && I18N.currentLang) ? I18N.currentLang : 'en';
        this.recognition.lang = langMap[cur] || 'en-IN';
        this.recognition.start();
      } catch (e) {
        // Already active or starting
      }
    }
  },

  stop() {
    this.isRecording = false;
    clearTimeout(this.restartTimeout);

    if (window.SoundEngine && SoundEngine.playNotification) {
      SoundEngine.playNotification();
    }

    const bar = document.getElementById('wisprFlowBar');
    if (bar) bar.classList.remove('active');

    const pills = document.querySelectorAll('.wispr-btn, .voice-input-btn, #headerVoiceBtn');
    pills.forEach(p => p.classList.remove('recording'));

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    try {
      if (this.recognition) {
        this.recognition.stop();
      }
    } catch (e) {}

    // Reset transcript display text
    const textEl = document.getElementById('wisprLiveTranscript');
    if (textEl) {
      const isHi = typeof I18N !== 'undefined' && I18N.currentLang === 'hi';
      textEl.textContent = isHi ? 'सुन रहा हूँ... हिंदी या अंग्रेजी में बोलें' : 'Listening... Speak in Hindi or English';
    }

    // Auto-send to AI Assistant if chat drawer is open and transcript is present
    if (this.lastTranscript && !this.activeTargetInput) {
      const aiInput = document.getElementById('aiChatInput');
      const aiDrawer = document.getElementById('aiDrawer');
      if (aiDrawer && aiDrawer.classList.contains('open') && aiInput) {
        aiInput.value = this.lastTranscript;
        if (typeof SamarthyaAI !== 'undefined' && SamarthyaAI.handleSend) {
          SamarthyaAI.handleSend();
        }
      }
    }

    this.activeTargetInput = null;
  },

  updateTranscriptDisplay(text, isInstruction = false) {
    const textEl = document.getElementById('wisprLiveTranscript');
    if (textEl) {
      textEl.textContent = text || 'Listening...';
    }
    // Only update targeted input with actual speech, NEVER with placeholder instructions
    if (this.activeTargetInput && text && !isInstruction) {
      const cleaned = this.cleanSpokenName(text);
      if (cleaned) {
        this.activeTargetInput.value = cleaned;
      }
    }
  },

  cleanSpokenName(rawText) {
    if (!rawText) return '';
    let name = rawText.trim();

    // Strip leading prefix phrases
    name = name.replace(/^(mera\s+naam\s+(hai\s+)?|mera\s+nam\s+|my\s+name\s+is\s+|name\s+is\s+|myself\s+|i\s+am\s+|main\s+|mein\s+|this\s+is\s+)/i, '');

    // Strip trailing suffix phrases
    name = name.replace(/\s+(hai|hoon|he|h|hai\s+ji|ji|sir|madam)$/i, '');

    // Clean punctuation
    name = name.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '').trim();

    // Format Latin words into Title Case
    if (/^[A-Za-z\s]+$/.test(name)) {
      name = name.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    return name;
  },

  extractPercentage(text) {
    // 1. Check numeric pattern e.g. "40%", "60 percent", "75 pratishat"
    const digitMatch = text.match(/(\d{1,3})\s*(%|percent|percentage|pratishat|प्रतिशत)?/i);
    if (digitMatch) {
      const val = parseInt(digitMatch[1], 10);
      if (val >= 0 && val <= 100) return val;
    }

    // 2. English & Hindi spoken words dictionary
    const wordNumbers = {
      'zero': 0, 'shunya': 0, 'शून्य': 0,
      'ten': 10, 'das': 10, 'दस': 10,
      'fifteen': 15, 'pandrah': 15, 'पंद्रह': 15,
      'twenty': 20, 'bees': 20, 'बीस': 20,
      'twenty five': 25, 'pachees': 25, 'पच्चीस': 25,
      'thirty': 30, 'tees': 30, 'तीस': 30,
      'thirty five': 35, 'paintis': 35, 'पैंतीस': 35,
      'forty': 40, 'chaalis': 40, 'chalis': 40, 'चालीस': 40,
      'forty five': 45, 'paintaalis': 45, 'पैंतालीस': 45,
      'fifty': 50, 'pachaas': 50, 'pachas': 50, 'पचास': 50,
      'fifty five': 55, 'pachpan': 55, 'पचपन': 55,
      'sixty': 60, 'saath': 60, 'sath': 60, 'साठ': 60,
      'sixty five': 65, 'painsath': 65, 'पैंसठ': 65,
      'seventy': 70, 'sattar': 70, 'सत्तर': 70,
      'seventy five': 75, 'pachattar': 75, 'पचहत्तर': 75,
      'eighty': 80, 'assi': 80, 'अस्सी': 80,
      'eighty five': 85, 'pachaasi': 85, 'पचासी': 85,
      'ninety': 90, 'nabbe': 90, 'नब्बे': 90,
      'hundred': 100, 'sau': 100, 'सौ': 100
    };

    const sortedEntries = Object.entries(wordNumbers).sort((a, b) => b[0].length - a[0].length);
    for (const [word, num] of sortedEntries) {
      const isAscii = /^[a-z0-9\s]+$/i.test(word);
      if (isAscii) {
        if (new RegExp(`\\b${word}\\b`, 'i').test(text)) return num;
      } else {
        if (text.includes(word)) return num;
      }
    }

    return null;
  },

  processWisprInput(transcript) {
    if (!transcript) return;
    const text = transcript.toLowerCase().trim();
    const updatedFields = [];

    // ============================================
    // 1. Navigation & Assistant Voice Commands
    // ============================================
    if (text.includes('open ai') || text.includes('ask ai') || text.includes('chatbot') || text.includes('ai assistant') || text.includes('samarthya ai') || text.includes('सहायक')) {
      if (typeof SamarthyaAI !== 'undefined' && SamarthyaAI.toggle) {
        SamarthyaAI.toggle();
      }
      this.showWisprNotification('🤖 Opened Samarthya AI Assistant');
      this.stop();
      return;
    }

    if (text.includes('open ngo') || text.includes('ngo mode') || text.includes('sahayak mode')) {
      if (typeof App !== 'undefined') {
        App.navigate('ngo');
      }
      this.showWisprNotification('🤝 Switched to Sahayak / NGO Mode');
      this.stop();
      return;
    }

    if (text.includes('go home') || text.includes('main page') || text.includes('home page')) {
      if (typeof App !== 'undefined') {
        App.navigate('home');
      }
      this.showWisprNotification('🏠 Navigating Home');
      this.stop();
      return;
    }

    if (text.includes('find scheme') || text.includes('match scheme') || text.includes('yojana dhundho') || text.includes('योजना खोजें') || text.includes('scholarship')) {
      if (typeof App !== 'undefined') {
        App.switchPersona('welfare');
        App.navigate('match');
      }
      updatedFields.push('Welfare Track');
    }

    if (text.includes('apply loan') || text.includes('credit scheme') || text.includes('nsfdc loan') || text.includes('loan chahiye') || text.includes('ऋण') || text.includes('लोन')) {
      if (typeof App !== 'undefined') {
        App.switchPersona('credit');
        App.navigate('match');
      }
      updatedFields.push('Credit Track');
    }

    // ============================================
    // 2. Disability Percentage Auto-fill
    // ============================================
    if (text.includes('percent') || text.includes('%') || text.includes('pratishat') || text.includes('प्रतिशत') ||
        text.includes('disability') || text.includes('divyang')) {
      const pct = this.extractPercentage(text);
      if (pct !== null) {
        const range = document.getElementById('inputPercent');
        if (range) {
          range.value = pct;
          if (typeof FormController !== 'undefined' && FormController.updatePercent) {
            FormController.updatePercent(pct);
          }
          updatedFields.push(`Disability ${pct}%`);
        }
      }
    }

    // ============================================
    // 3. State / UT Domicile Auto-fill (Both Forms)
    // ============================================
    const stateKeywords = {
      'andhra_pradesh': ['andhra', 'andhra pradesh', 'आंध्र प्रदेश', 'आंध्र'],
      'arunachal_pradesh': ['arunachal', 'arunachal pradesh', 'अरुणाचल'],
      'assam': ['assam', 'asom', 'असम'],
      'bihar': ['bihar', 'बिहार'],
      'chhattisgarh': ['chhattisgarh', 'chattisgarh', 'छत्तीसगढ़'],
      'goa': ['goa', 'गोवा'],
      'gujarat': ['gujarat', 'गुजरात'],
      'haryana': ['haryana', 'हरियाणा'],
      'himachal_pradesh': ['himachal', 'himachal pradesh', 'हिमाचल'],
      'jharkhand': ['jharkhand', 'झारखंड'],
      'karnataka': ['karnataka', 'कर्नाटक'],
      'kerala': ['kerala', 'केरल'],
      'madhya_pradesh': ['madhya pradesh', 'mp', 'मध्य प्रदेश'],
      'maharashtra': ['maharashtra', 'महाराष्ट्र'],
      'manipur': ['manipur', 'मणिपुर'],
      'meghalaya': ['meghalaya', 'मेघालय'],
      'mizoram': ['mizoram', 'मिजोरम'],
      'nagaland': ['nagaland', 'नागालैंड'],
      'odisha': ['odisha', 'orissa', 'ओडिशा'],
      'punjab': ['punjab', 'पंजाब'],
      'rajasthan': ['rajasthan', 'राजस्थान'],
      'sikkim': ['sikkim', 'सिक्किम'],
      'tamil_nadu': ['tamil nadu', 'tamilnadu', 'तमिलनाडु'],
      'telangana': ['telangana', 'तेलंगाना'],
      'tripura': ['tripura', 'त्रिपुरा'],
      'uttar_pradesh': ['uttar pradesh', 'up', 'उत्तर प्रदेश'],
      'uttarakhand': ['uttarakhand', 'uttaranchal', 'उत्तराखंड'],
      'west_bengal': ['west bengal', 'bengal', 'पश्चिम बंगाल'],
      'delhi': ['delhi', 'new delhi', 'दिल्ली', 'नई दिल्ली'],
      'jammu_kashmir': ['jammu', 'kashmir', 'j&k', 'जम्मू'],
      'ladakh': ['ladakh', 'लद्दाख'],
      'chandigarh': ['chandigarh', 'चंडीगढ़'],
      'puducherry': ['puducherry', 'pondicherry', 'पुडुचेरी']
    };

    let matchedState = null;
    for (const [stateId, aliases] of Object.entries(stateKeywords)) {
      if (aliases.some(alias => text.includes(alias))) {
        matchedState = stateId;
        break;
      }
    }

    if (matchedState) {
      const studentState = document.getElementById('inputState');
      if (studentState) {
        studentState.value = matchedState;
        studentState.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const creditState = document.getElementById('creditInputState');
      if (creditState) {
        creditState.value = matchedState;
        creditState.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const stateObj = (typeof INDIAN_STATES !== 'undefined') ? INDIAN_STATES.find(s => s.id === matchedState) : null;
      updatedFields.push(`State: ${stateObj ? stateObj.label : matchedState}`);
    }

    // ============================================
    // 4. Gender Auto-fill (Both Forms)
    // ============================================
    let matchedGender = null;
    if (text.includes('female') || text.includes('woman') || text.includes('girl') || text.includes('mahila') || text.includes('ladki') || text.includes('stree') || text.includes('महिला') || text.includes('लड़की')) {
      matchedGender = 'female';
    } else if (text.includes('male') || text.includes('man') || text.includes('boy') || text.includes('purush') || text.includes('ladka') || text.includes('aadmi') || text.includes('पुरुष') || text.includes('लड़का')) {
      matchedGender = 'male';
    } else if (text.includes('transgender') || text.includes('other') || text.includes('third gender') || text.includes('किन्नर') || text.includes('अन्य')) {
      matchedGender = 'other';
    }

    if (matchedGender) {
      const gStudent = document.getElementById('inputGender');
      if (gStudent) {
        gStudent.value = matchedGender;
        gStudent.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const gCredit = document.getElementById('creditInputGender');
      if (gCredit) {
        gCredit.value = matchedGender;
        gCredit.dispatchEvent(new Event('change', { bubbles: true }));
      }
      updatedFields.push(`Gender: ${matchedGender}`);
    }

    // ============================================
    // 5. Disability Type Selection (Checkbox Grid)
    // ============================================
    const disMap = {
      'locomotor': ['locomotor', 'ortho', 'handicap', 'chalne', 'pair', 'hath', 'haath', 'amputation', 'spinal', 'polio', 'लोकोमोटर', 'चलने', 'अस्थि'],
      'visual': ['blind', 'blindness', 'visual', 'vision', 'drishti', 'eyes', 'sight', 'aankh', 'andhata', 'कम दृष्टि', 'दृष्टि', 'अंधता'],
      'hearing': ['deaf', 'hearing', 'sunne', 'ear', 'badhir', 'bahra', 'बधिर', 'सुनने', 'बहरा'],
      'speech': ['speech', 'speaking', 'bolne', 'vaak', 'mute', 'gunga', 'वाक्', 'बोलने'],
      'intellectual': ['intellectual', 'down syndrome', 'idd', 'manasik', 'मंदबुद्धि', 'बौद्धिक'],
      'learning': ['learning disability', 'dyslexia', 'dysgraphia', 'adhd', 'सीखने', 'डिस्लेक्सिया'],
      'autism': ['autism', 'asd', 'ऑटिज्म'],
      'mental_illness': ['mental illness', 'psychiatric', 'depression', 'मानसिक बीमारी'],
      'cerebral_palsy': ['cerebral palsy', 'cp', 'सेरेब्रल पाल्सी'],
      'muscular_dystrophy': ['muscular dystrophy', 'मस्कुलर डिस्ट्रोफी'],
      'chronic_neurological': ['neurological', 'parkinson', 'sclerosis', 'तंत्रिका'],
      'blood_disorder': ['blood disorder', 'thalassemia', 'sickle cell', 'hemophilia', 'रक्त विकार'],
      'multiple': ['multiple disability', 'deafblind', 'बहु-दिव्यांगता'],
      'acid_attack': ['acid attack', 'एसिड अटैक'],
      'dwarfism': ['dwarfism', 'dwarf', 'baunapan', 'बौनापन'],
      'leprosy_cured': ['leprosy', 'kushth', 'कुष्ठ'],
      'none': ['no disability', 'not disabled', 'general', 'koi divyangta nahi', 'सामान्य', 'कोई दिव्यांगता नहीं']
    };

    for (const [disId, keywords] of Object.entries(disMap)) {
      if (keywords.some(kw => text.includes(kw))) {
        this.selectDisabilityCheckbox(disId);
        updatedFields.push(`Disability: ${disId}`);
      }
    }

    // ============================================
    // 6. Education Level Selection
    // ============================================
    const eduMap = {
      'pre_primary': ['pre primary', 'nursery', 'anganwadi', 'lkg', 'ukg', 'आंगनवाड़ी'],
      'primary': ['primary', 'class 1', 'class 2', 'class 3', 'class 4', 'class 5', '1st', '2nd', '3rd', '4th', '5th', 'प्राथमिक'],
      'upper_primary': ['upper primary', 'middle', 'class 6', 'class 7', 'class 8', '6th', '7th', '8th', 'उच्च प्राथमिक'],
      'secondary': ['secondary', 'class 9', 'class 10', 'matric', '10th', 'दसवीं', 'माध्यमिक'],
      'higher_secondary': ['higher secondary', 'class 11', 'class 12', 'inter', 'intermediate', '12th', 'बारहवीं', 'उच्च माध्यमिक'],
      'graduate': ['graduate', 'graduation', 'bachelor', 'btech', 'b.tech', 'ba', 'b.a', 'bsc', 'b.sc', 'bcom', 'b.com', 'ug', 'स्नातक'],
      'post_graduate': ['post graduate', 'master', 'mtech', 'ma', 'msc', 'mcom', 'pg', 'स्नातकोत्तर'],
      'professional': ['professional', 'mbbs', 'medical', 'law', 'llb', 'engineering', 'पेशेवर'],
      'vocational': ['vocational', 'iti', 'diploma', 'polytechnic', 'आईटीआई', 'डिप्लोमा'],
      'not_enrolled': ['not enrolled', 'dropped out', 'नामांकित नहीं']
    };

    for (const [eduId, keywords] of Object.entries(eduMap)) {
      if (keywords.some(kw => text.includes(kw))) {
        const eduSelect = document.getElementById('inputEducation');
        if (eduSelect) {
          eduSelect.value = eduId;
          eduSelect.dispatchEvent(new Event('change', { bubbles: true }));
          updatedFields.push(`Education: ${eduId}`);
          break;
        }
      }
    }

    // ============================================
    // 7. Annual Household Income Auto-fill
    // ============================================
    if (text.includes('income') || text.includes('aay') || text.includes('aamdani') || text.includes('lakh') || text.includes('hazar') || text.includes('hazaar') || text.includes('bpl')) {
      const studentInc = document.getElementById('inputIncome');
      const creditInc = document.getElementById('creditInputIncome');

      if (text.includes('bpl') || text.includes('below 50') || text.includes('50 thousand') || text.includes('50 hazar') || text.includes('50 hazaar') || text.includes('पचास हजार')) {
        if (studentInc) studentInc.value = '50000';
        if (creditInc) creditInc.value = '80000';
        updatedFields.push('Income: < ₹50,000 (BPL Priority)');
      } else if (text.includes('1 lakh') || text.includes('one lakh') || text.includes('ek lakh') || text.includes('1.5 lakh') || text.includes('एक लाख')) {
        if (studentInc) studentInc.value = '150000';
        if (creditInc) creditInc.value = '150000';
        updatedFields.push('Income: ₹1L — ₹2L');
      } else if (text.includes('2 lakh') || text.includes('two lakh') || text.includes('do lakh') || text.includes('2.5 lakh') || text.includes('दो लाख')) {
        if (studentInc) studentInc.value = '250000';
        if (creditInc) creditInc.value = '250000';
        updatedFields.push('Income: ₹2L — ₹2.5L');
      } else if (text.includes('3 lakh') || text.includes('three lakh') || text.includes('teen lakh') || text.includes('तीन लाख')) {
        if (studentInc) studentInc.value = '300000';
        if (creditInc) creditInc.value = '400000';
        updatedFields.push('Income: ₹3L');
      } else if (text.includes('4 lakh') || text.includes('5 lakh') || text.includes('five lakh') || text.includes('paanch lakh') || text.includes('पांच लाख')) {
        if (studentInc) studentInc.value = '500000';
        if (creditInc) creditInc.value = '400000';
        updatedFields.push('Income: ≤ ₹5L (NSFDC Cap)');
      } else if (text.includes('6 lakh') || text.includes('8 lakh') || text.includes('10 lakh') || text.includes('above 10') || text.includes('दस लाख')) {
        if (studentInc) studentInc.value = '1000000';
        if (creditInc) creditInc.value = '600000';
        updatedFields.push('Income: > ₹5L');
      }

      if (studentInc) studentInc.dispatchEvent(new Event('change', { bubbles: true }));
      if (creditInc) creditInc.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // ============================================
    // 8. Credit Purpose & SC Category Checkbox
    // ============================================
    if (text.includes('business') || text.includes('vyapar') || text.includes('dukaan') || text.includes('shop') || text.includes('enterprise') || text.includes('startup') || text.includes('व्यापार')) {
      if (typeof CreditFormController !== 'undefined' && CreditFormController.setPurpose) {
        CreditFormController.setPurpose('business');
        const bizRadio = document.querySelector('input[name="creditPurpose"][value="business"]');
        if (bizRadio) bizRadio.checked = true;
        updatedFields.push('Purpose: Business & Enterprise');
      }
    } else if (text.includes('education loan') || text.includes('higher education') || text.includes('padhai loan') || text.includes('college loan') || text.includes('shiksha') || text.includes('शिक्षा')) {
      if (typeof CreditFormController !== 'undefined' && CreditFormController.setPurpose) {
        CreditFormController.setPurpose('education');
        const eduRadio = document.querySelector('input[name="creditPurpose"][value="education"]');
        if (eduRadio) eduRadio.checked = true;
        updatedFields.push('Purpose: Higher Education');
      }
    }

    if (text.includes('scheduled caste') || text.includes('sc cert') || text.includes('sc category') || text.includes('anusuchit') || text.includes('अनुसूचित')) {
      const scCb = document.getElementById('creditInputCasteCert');
      if (scCb) {
        scCb.checked = true;
        updatedFields.push('SC Category Self-Declaration');
      }
    }

    // ============================================
    // Audio Cues & Feedback Toast
    // ============================================
    if (updatedFields.length > 0) {
      if (window.SoundEngine && SoundEngine.playSuccess) {
        SoundEngine.playSuccess();
      }
      this.showWisprNotification(`✨ Auto-filled: ${updatedFields.join(' • ')}`);
    }
  },

  selectDisabilityCheckbox(id) {
    const container = document.getElementById('disabilityCheckboxes');
    if (!container) return;

    const cb = container.querySelector(`input[value="${id}"]`);
    if (!cb) return;

    if (id === 'none') {
      container.querySelectorAll('input[type="checkbox"]').forEach(other => {
        other.checked = (other === cb);
        const item = other.closest('.checkbox-item');
        if (item) item.classList.toggle('selected', other === cb);
      });
    } else {
      const noneCb = container.querySelector('input[value="none"]');
      if (noneCb) {
        noneCb.checked = false;
        const noneItem = noneCb.closest('.checkbox-item');
        if (noneItem) noneItem.classList.remove('selected');
      }
      cb.checked = true;
      const item = cb.closest('.checkbox-item');
      if (item) item.classList.add('selected');
    }

    if (typeof FormController !== 'undefined' && FormController.toggleDisabilityPercentVisibility) {
      FormController.toggleDisabilityPercentVisibility();
    }

    const err = document.getElementById('disabilityError');
    if (err) err.classList.remove('show');
  },

  showWisprNotification(msg, type = 'info') {
    const existing = document.querySelectorAll('.wispr-toast');
    existing.forEach(t => {
      if (t && typeof t.remove === 'function') t.remove();
    });

    const toast = document.createElement('div');
    toast.className = `wispr-toast animate-in ${type}`;
    const icon = type === 'error' ? '⚠️' : type === 'warn' ? '🔔' : '🎙️';
    toast.innerHTML = `<span style="font-size:16px">${icon}</span> <span style="font-weight:500">${msg}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 20);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast && typeof toast.remove === 'function') toast.remove();
      }, 400);
    }, 4000);
  },

  setupVisualizerBar() {
    const canvas = document.getElementById('wisprCanvas');
    if (!canvas) return;
    canvas.width = 120;
    canvas.height = 36;
  },

  startAudioVisualization() {
    const canvas = document.getElementById('wisprCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 120;
    canvas.height = 36;

    let step = 0;
    const draw = () => {
      if (!this.isRecording) return;
      this.animationId = requestAnimationFrame(draw);
      step += 0.08;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 18;
      const barWidth = 3;
      const gap = 3;

      for (let i = 0; i < bars; i++) {
        const height = Math.sin(step + i * 0.4) * 11 + 13 + Math.random() * 5;
        const x = i * (barWidth + gap) + 6;
        const y = (canvas.height - height) / 2;

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#6EE7B7');
        gradient.addColorStop(1, '#10B981');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, barWidth, height, [3]);
        } else {
          ctx.rect(x, y, barWidth, height);
        }
        ctx.fill();
      }
    };
    draw();
  }
};

window.WisprFlow = WisprFlow;
