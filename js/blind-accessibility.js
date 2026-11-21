// ==========================================================================
// Saksham — Dual Experience & Blind User Voice Navigation Architecture
// Compliant with WCAG 2.1 AAA Accessibility and Voice-First Principles
// Hardened with Strict State Machine, Mutual Exclusion & Anti-Echo Lifecycle
// ==========================================================================

/**
 * 0. Conversation State Machine & Explicit States
 * Ensures SPEAKING and LISTENING are mutually exclusive at all times.
 */
const ConversationState = {
  IDLE: 'IDLE',
  SPEAKING: 'SPEAKING',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  WAITING_FOR_CONFIRMATION: 'WAITING_FOR_CONFIRMATION',
  ERROR: 'ERROR'
};

/**
 * Anti-Echo & Self-Hearing Guard
 * Rejects transcripts that echo recent AI speech or questions within the tail window.
 */
const EchoGuard = {
  recentAiUtterances: [], // Array of { text: string, tokens: string[], timestamp: number }

  recordAiUtterance(text) {
    if (!text) return;
    const normalized = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!normalized) return;

    this.recentAiUtterances.push({
      text: normalized,
      tokens: normalized.split(' ').filter(w => w.length > 2),
      timestamp: Date.now()
    });

    // Prune entries older than 12 seconds
    const cutoff = Date.now() - 12000;
    this.recentAiUtterances = this.recentAiUtterances.filter(u => u.timestamp > cutoff);
  },

  isAiEcho(userTranscript) {
    if (!userTranscript) return false;
    const now = Date.now();
    const cleanUser = userTranscript.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanUser) return false;

    // Never reject simple affirmative or negative answers as echo
    const shortConfirmations = [
      'yes', 'no', 'yeah', 'yep', 'nope', 'haan', 'nahi', 'nahin',
      'sahi', 'sahi hai', 'theek hai', 'correct', 'wrong', 'right', 'हाँ', 'नहीं', 'सही है'
    ];
    if (shortConfirmations.includes(cleanUser)) {
      return false;
    }

    // Check against recent assistant utterances from the last 8 seconds
    for (const u of this.recentAiUtterances) {
      if (now - u.timestamp > 8000) continue;

      // 1. Exact or substring match (e.g. user transcript is part of or contains AI sentence)
      if (u.text.includes(cleanUser) || cleanUser.includes(u.text)) {
        return true;
      }

      // 2. High token overlap (if >50% of words in user transcript match AI words)
      const userTokens = cleanUser.split(' ').filter(w => w.length > 2);
      if (userTokens.length >= 2) {
        const matchingTokens = userTokens.filter(t => u.tokens.includes(t));
        if (matchingTokens.length / userTokens.length >= 0.5) {
          return true;
        }
      }
    }

    return false;
  }
};

/**
 * 1. SpeechSynthesisService
 * Robust Text-to-Speech service supporting English & Hindi.
 * Guaranteed: Completely suspends speech recognition and enforces tail delay.
 */
const SpeechSynthesisService = {
  isSpeaking: false,
  currentUtterance: null,
  selectedVoice: null,
  lang: 'en-IN',

  init() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      this.loadVoices();
    }
  },

  loadVoices() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (this.lang.startsWith('hi')) {
      this.selectedVoice = voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi')) || null;
    } else {
      this.selectedVoice = voices.find(v => v.lang === 'en-IN') ||
        voices.find(v => v.lang.startsWith('en') && (v.name.includes('India') || v.name.includes('Natural') || v.name.includes('Google'))) ||
        voices.find(v => v.lang.startsWith('en')) || null;
    }
  },

  setLanguage(langCode) {
    this.lang = langCode === 'hi' ? 'hi-IN' : 'en-IN';
    this.loadVoices();
  },

  speak(text, options = {}) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window) || !text) {
        resolve();
        return;
      }

      // ========================================================
      // STEP 1: IMMEDIATELY ABORT SPEECH RECOGNITION BEFORE TTS
      // ========================================================
      SpeechRecognitionService.abortAndMute();
      VoiceAssistantController.setState(ConversationState.SPEAKING);

      // Record for EchoGuard protection
      EchoGuard.recordAiUtterance(text);

      this.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;
      utterance.lang = options.lang || this.lang;
      if (this.selectedVoice) utterance.voice = this.selectedVoice;
      utterance.rate = options.rate || 0.95;
      utterance.pitch = options.pitch || 1.0;

      // Update screen reader live region
      const ariaLive = document.getElementById('blindAriaAnnouncer');
      if (ariaLive) ariaLive.textContent = text;

      // Update Voice Dock UI text
      const assistantText = document.getElementById('blindAssistantText');
      if (assistantText) assistantText.textContent = text;

      let hasFinished = false;
      const finishSpeech = async () => {
        if (hasFinished) return;
        hasFinished = true;
        clearTimeout(safetyTimer);
        this.isSpeaking = false;
        this.currentUtterance = null;

        // Post-TTS tail delay (650ms) before resolving
        await new Promise(r => setTimeout(r, 650));
        VoiceAssistantController.setState(ConversationState.IDLE);
        resolve();
      };

      utterance.onend = finishSpeech;
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        finishSpeech();
      };

      // Fallback safety timeout in case browser TTS engine fails to fire onend
      const maxDuration = Math.max(3500, text.length * 90);
      const safetyTimer = setTimeout(() => {
        console.warn('SpeechSynthesis safety timeout triggered');
        finishSpeech();
      }, maxDuration);

      this.isSpeaking = true;
      window.speechSynthesis.speak(utterance);
    });
  },

  cancel() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }
};

/**
 * 2. SpeechRecognitionService
 * Wraps Web Speech API with strict state machine checks, monotonic session IDs,
 * hardware echo cancellation constraints, and instant abort capabilities.
 */
const SpeechRecognitionService = {
  recognition: null,
  mediaStream: null,
  isListening: false,
  isPaused: false,
  sessionCounter: 0,
  currentSessionId: null,
  lang: 'en-IN',
  onResultCallback: null,
  onErrorCallback: null,

  async init() {
    // 1. Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.lang;

      this.recognition.onresult = (event) => {
        // Enforce Session & State Guard: Never accept speech during SPEAKING or PROCESSING
        const activeSession = this.currentSessionId;
        if (!this.isListening || !activeSession) return;

        const currentState = VoiceAssistantController.state;
        if (currentState === ConversationState.SPEAKING || currentState === ConversationState.PROCESSING) {
          console.warn('Discarded recognition result during', currentState);
          return;
        }

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        const rawText = (final || interim).trim();
        if (!rawText) return;

        // Echo Guard: Discard if the transcript matches recent AI speech
        if (EchoGuard.isAiEcho(rawText)) {
          console.warn('EchoGuard detected AI speech feedback, discarding:', rawText);
          return;
        }

        // Display user speech transcript
        const userTextEl = document.getElementById('blindUserTranscript');
        if (userTextEl) {
          userTextEl.textContent = `"${rawText}"`;
        }

        // Process final speech ONCE
        if (final) {
          const finalClean = final.trim();
          if (!finalClean || EchoGuard.isAiEcho(finalClean)) return;

          const cb = this.onResultCallback;

          // Stop recognition immediately and enter PROCESSING state
          this.abortAndMute();
          VoiceAssistantController.setState(ConversationState.PROCESSING);

          if (typeof cb === 'function') {
            cb(finalClean);
          }
        }
      };

      this.recognition.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;

        console.warn('SpeechRecognition error:', e.error);
        if (e.error === 'not-allowed') {
          VoiceAssistantController.setState(ConversationState.ERROR);
          SpeechSynthesisService.speak(
            this.lang.startsWith('hi')
              ? 'माइक्रोफ़ोन एक्सेस अस्वीकार कर दिया गया था। कृपया अपनी ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।'
              : 'Microphone access was denied. Please allow microphone permissions in your browser.'
          );
        }

        if (typeof this.onErrorCallback === 'function') {
          this.onErrorCallback(e);
        }
      };

      this.recognition.onend = () => {
        // Auto-reconnect ONLY if explicitly in LISTENING or WAITING_FOR_CONFIRMATION states
        const s = VoiceAssistantController.state;
        if (this.isListening && !this.isPaused && (s === ConversationState.LISTENING || s === ConversationState.WAITING_FOR_CONFIRMATION)) {
          try {
            this.recognition.start();
          } catch (e) {}
        }
      };
    } catch (err) {
      console.warn('SpeechRecognition init failed:', err);
    }

    // 2. Hardware Echo Cancellation audio constraints
    await this.initHardwareEchoCancellation();
  },

  async initHardwareEchoCancellation() {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !this.mediaStream) {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (e) {
        // Fallback gracefully; browser Web Speech API will continue
      }
    }
  },

  setLanguage(langCode) {
    this.lang = langCode === 'hi' ? 'hi-IN' : 'en-IN';
    if (this.recognition) {
      this.recognition.lang = this.lang;
    }
  },

  startListening(onResult, onError) {
    // Mutual Exclusion: Never start listening if assistant is actively speaking or processing
    const curState = VoiceAssistantController.state;
    if (curState === ConversationState.SPEAKING || curState === ConversationState.PROCESSING) {
      console.warn('Blocked speech recognition start while in state:', curState);
      return;
    }

    if (!this.recognition) this.init();
    if (!this.recognition) return;

    // Increment monotonic session ID
    const sessionId = ++this.sessionCounter;
    this.currentSessionId = sessionId;
    this.isListening = true;
    this.isPaused = false;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;

    // Enable hardware audio tracks
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => { track.enabled = true; });
    }

    // Set UI state
    const isConfirming = ConversationalFormEngine.stage === 'confirming_answer' || ConversationalFormEngine.stage === 'review';
    VoiceAssistantController.setState(
      isConfirming ? ConversationState.WAITING_FOR_CONFIRMATION : ConversationState.LISTENING
    );

    // Reset user transcript display for the fresh session
    const userTextEl = document.getElementById('blindUserTranscript');
    if (userTextEl) {
      userTextEl.textContent = 'Listening for your voice...';
    }

    try {
      this.recognition.lang = this.lang;
      this.recognition.start();
    } catch (e) {
      // Ignore if already active
    }
  },

  abortAndMute() {
    this.isListening = false;
    this.currentSessionId = null;
    this.onResultCallback = null;

    // Mute hardware audio stream tracks to cut audio feedback into speech recognition
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => { track.enabled = false; });
    }

    if (this.recognition) {
      try {
        this.recognition.abort(); // Instant cancellation
      } catch (e) {}
    }
  },

  pause() {
    this.isPaused = true;
    this.abortAndMute();
    VoiceAssistantController.setState(ConversationState.IDLE);
    const micBtn = document.getElementById('blindMicBtn');
    if (micBtn) {
      micBtn.classList.add('paused');
      micBtn.innerHTML = '<span>▶️</span> <span>Resume Listening</span>';
    }
  },

  resume() {
    this.isPaused = false;
    const micBtn = document.getElementById('blindMicBtn');
    if (micBtn) {
      micBtn.classList.remove('paused');
      micBtn.innerHTML = '<span>🎙️</span> <span>Pause Listening</span>';
    }
    ConversationalFormEngine.resumeListening();
  },

  stop() {
    this.abortAndMute();
  }
};

/**
 * 3. FormValidationService
 * Validates spoken inputs against official Saksham schemas
 */
const FormValidationService = {
  cleanName(text) {
    if (!text) return null;
    let n = text.trim();
    n = n.replace(/^(mera\s+naam\s+(hai\s+)?|my\s+name\s+is\s+|name\s+is\s+|myself\s+|i\s+am\s+|main\s+|mein\s+)/i, '');
    n = n.replace(/\s+(hai|hoon|he|h|ji|sir|madam)$/i, '');
    n = n.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '').trim();
    if (n.length < 2) return null;
    return n.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  },

  parseAge(text) {
    const digitMatch = text.match(/\b(\d{1,3})\b/);
    if (digitMatch) {
      const age = parseInt(digitMatch[1], 10);
      if (age >= 3 && age <= 100) return age;
    }

    const ageWords = {
      'eighteen': 18, 'atharah': 18, 'nineteen': 19, 'unnis': 19,
      'twenty': 20, 'bees': 20, 'twenty one': 21, 'twenty two': 22,
      'twenty three': 23, 'twenty four': 24, 'chaubees': 24,
      'twenty five': 25, 'pachees': 25, 'twenty six': 26, 'twenty seven': 27,
      'twenty eight': 28, 'twenty nine': 29, 'thirty': 30, 'tees': 30,
      'thirty five': 35, 'forty': 40, 'chaalis': 40, 'forty five': 45,
      'fifty': 50, 'pachaas': 50, 'sixty': 60, 'saath': 60
    };

    for (const [w, val] of Object.entries(ageWords)) {
      if (new RegExp(`\\b${w}\\b`, 'i').test(text)) return val;
    }
    return null;
  },

  parseState(text) {
    const lower = text.toLowerCase();
    const stateAliases = {
      'andhra_pradesh': ['andhra', 'आंध्र'],
      'arunachal_pradesh': ['arunachal', 'अरुणाचल'],
      'assam': ['assam', 'asom', 'असम'],
      'bihar': ['bihar', 'बिहार'],
      'chhattisgarh': ['chhattisgarh', 'chattisgarh', 'छत्तीसगढ़'],
      'goa': ['goa', 'गोवा'],
      'gujarat': ['gujarat', 'गुजरात'],
      'haryana': ['haryana', 'हरियाणा'],
      'himachal_pradesh': ['himachal', 'हिमाचल'],
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
      'delhi': ['delhi', 'new delhi', 'दिल्ली'],
      'jammu_kashmir': ['jammu', 'kashmir', 'जम्मू'],
      'ladakh': ['ladakh', 'लद्दाख'],
      'chandigarh': ['chandigarh', 'चंडीगढ़'],
      'puducherry': ['puducherry', 'pondicherry', 'पुडुचेरी']
    };

    for (const [id, aliases] of Object.entries(stateAliases)) {
      if (aliases.some(a => lower.includes(a))) return id;
    }
    return null;
  },

  parseGender(text) {
    const lower = text.toLowerCase();
    if (lower.includes('female') || lower.includes('woman') || lower.includes('girl') || lower.includes('mahila') || lower.includes('महिला')) {
      return 'female';
    }
    if (lower.includes('male') || lower.includes('man') || lower.includes('boy') || lower.includes('purush') || lower.includes('पुरुष')) {
      return 'male';
    }
    if (lower.includes('transgender') || lower.includes('other') || lower.includes('third') || lower.includes('अन्य')) {
      return 'other';
    }
    return null;
  },

  parseDisability(text) {
    const lower = text.toLowerCase();
    if (lower.includes('none') || lower.includes('no disability') || lower.includes('not disabled') || lower.includes('nahi') || lower.includes('सामान्य')) {
      return 'none';
    }
    if (lower.includes('visual') || lower.includes('blind') || lower.includes('eyes') || lower.includes('sight') || lower.includes('drishti') || lower.includes('दृष्टि')) {
      return 'visual';
    }
    if (lower.includes('locomotor') || lower.includes('ortho') || lower.includes('handicap') || lower.includes('chalne') || lower.includes('walking') || lower.includes('लोकोमोटर')) {
      return 'locomotor';
    }
    if (lower.includes('hearing') || lower.includes('deaf') || lower.includes('sunne') || lower.includes('बधिर')) {
      return 'hearing';
    }
    if (lower.includes('speech') || lower.includes('bolne') || lower.includes('वाक्')) {
      return 'speech';
    }
    if (lower.includes('intellectual') || lower.includes('down syndrome') || lower.includes('idd') || lower.includes('बौद्धिक')) {
      return 'intellectual';
    }
    if (lower.includes('autism') || lower.includes('asd') || lower.includes('ऑटिज्म')) {
      return 'autism';
    }
    return null;
  },

  parsePercentage(text) {
    const digitMatch = text.match(/(\d{1,3})\s*(%|percent|pratishat|प्रतिशत)?/i);
    if (digitMatch) {
      const val = parseInt(digitMatch[1], 10);
      if (val >= 0 && val <= 100) return val;
    }
    const words = {
      'forty': 40, 'chaalis': 40, 'चालीस': 40,
      'fifty': 50, 'pachaas': 50, 'पचास': 50,
      'sixty': 60, 'saath': 60, 'साठ': 60,
      'seventy': 70, 'sattar': 70, 'सत्तर': 70,
      'eighty': 80, 'assi': 80, 'अस्सी': 80,
      'hundred': 100, 'sau': 100, 'सौ': 100
    };
    for (const [w, val] of Object.entries(words)) {
      if (text.includes(w)) return val;
    }
    return null;
  },

  parseEducation(text) {
    const lower = text.toLowerCase();
    if (lower.includes('post graduate') || lower.includes('master') || lower.includes('mtech') || lower.includes('स्नातकोत्तर')) {
      return 'post_graduate';
    }
    if (lower.includes('graduate') || lower.includes('graduation') || lower.includes('bachelor') || lower.includes('btech') || lower.includes('ba') || lower.includes('bsc') || lower.includes('स्नातक')) {
      return 'graduate';
    }
    if (lower.includes('12th') || lower.includes('higher secondary') || lower.includes('inter') || lower.includes('बारहवीं')) {
      return 'higher_secondary';
    }
    if (lower.includes('10th') || lower.includes('secondary') || lower.includes('matric') || lower.includes('दसवीं')) {
      return 'secondary';
    }
    if (lower.includes('iti') || lower.includes('diploma') || lower.includes('vocational') || lower.includes('डिप्लोमा')) {
      return 'vocational';
    }
    if (lower.includes('primary') || lower.includes('5th') || lower.includes('प्राथमिक')) {
      return 'primary';
    }
    return null;
  },

  parseIncome(text) {
    const lower = text.toLowerCase();
    if (lower.includes('below 50') || lower.includes('50 hazar') || lower.includes('50000') || lower.includes('bpl') || lower.includes('पचास हजार')) {
      return 50000;
    }
    if (lower.includes('1 lakh') || lower.includes('one lakh') || lower.includes('ek lakh') || lower.includes('100000') || lower.includes('एक लाख')) {
      return 150000;
    }
    if (lower.includes('2 lakh') || lower.includes('two lakh') || lower.includes('do lakh') || lower.includes('2.5 lakh') || lower.includes('250000') || lower.includes('दो लाख')) {
      return 250000;
    }
    if (lower.includes('3 lakh') || lower.includes('three lakh') || lower.includes('teen lakh') || lower.includes('300000') || lower.includes('तीन लाख')) {
      return 300000;
    }
    if (lower.includes('5 lakh') || lower.includes('five lakh') || lower.includes('paanch lakh') || lower.includes('500000') || lower.includes('पांच लाख')) {
      return 500000;
    }
    if (lower.includes('above 10') || lower.includes('10 lakh') || lower.includes('ten lakh') || lower.includes('दस लाख')) {
      return 1000000;
    }
    const digit = text.match(/\b(\d{4,7})\b/);
    if (digit) return parseInt(digit[1], 10);
    return null;
  },

  parseRequirement(text) {
    const lower = text.toLowerCase();
    if (lower.includes('loan') || lower.includes('business') || lower.includes('vyapar') || lower.includes('credit') || lower.includes('ऋण') || lower.includes('लोन')) {
      return 'credit';
    }
    return 'welfare';
  }
};

/**
 * 4. VoiceCommandInterpreter
 * Identifies global control, navigation, or affirmative/negative confirmation intents
 */
const VoiceCommandInterpreter = {
  isAffirmative(text) {
    const t = text.toLowerCase().trim();
    const yesTokens = ['yes', 'yeah', 'yep', 'correct', 'right', 'confirm', 'haan', 'sahi', 'sahi hai', 'theek hai', 'ha', 'bilkul', 'हाँ', 'सही है'];
    return yesTokens.some(k => t === k || t.startsWith(k + ' ') || t.endsWith(' ' + k));
  },

  isNegative(text) {
    const t = text.toLowerCase().trim();
    const noTokens = ['no', 'nope', 'incorrect', 'wrong', 'change', 'nahi', 'galat', 'galat hai', 'nahin', 'नहीं', 'गलत'];
    return noTokens.some(k => t === k || t.startsWith(k + ' ') || t.endsWith(' ' + k));
  },

  checkGlobalCommands(text) {
    const t = text.toLowerCase().trim();

    if (t.includes('repeat') || t.includes('dobara') || t.includes('phir se')) {
      return { type: 'repeat' };
    }
    if (t.includes('pause') || t.includes('stop listening') || t.includes('ruko') || t.includes('rok do')) {
      return { type: 'pause' };
    }
    if (t.includes('resume') || t.includes('continue') || t.includes('shuru')) {
      return { type: 'resume' };
    }
    if (t.includes('cancel') || t.includes('band karo') || t.includes('cancel process')) {
      return { type: 'cancel' };
    }
    if (t.includes('change language') || t.includes('bhasha badlo') || t.includes('hindi mein bolo') || t.includes('speak in english')) {
      return { type: 'change_lang' };
    }
    if (t.includes('go home') || t.includes('homepage') || t.includes('main page')) {
      return { type: 'nav_home' };
    }
    if (t.includes('switch to standard') || t.includes('standard mode') || t.includes('exit voice')) {
      return { type: 'switch_standard' };
    }
    return null;
  }
};

/**
 * 5. ConversationalFormEngine
 * Form-filling state machine asking one question at a time.
 * Enforces mutual exclusion: Microphone recognition is only active AFTER TTS finishes.
 */
const ConversationalFormEngine = {
  currentStepIndex: 0,
  stage: 'idle', // 'idle' | 'asking' | 'confirming_answer' | 'review' | 'matched'
  pendingKey: null,
  pendingValue: null,
  pendingDisplay: null,
  lang: 'en',

  profile: {
    name: '',
    age: null,
    state: '',
    gender: '',
    disabilityType: '',
    disabilityPercent: 0,
    educationLevel: '',
    annualIncome: null,
    requirement: 'welfare'
  },

  steps: [
    {
      key: 'name',
      labelEn: 'Full Name',
      labelHi: 'पूरा नाम',
      promptEn: "Let's start with your personal information. Please tell me your full name.",
      promptHi: "आइए आपकी व्यक्तिगत जानकारी से शुरू करते हैं। कृपया अपना पूरा नाम बताएं।",
      parse: (t) => FormValidationService.cleanName(t),
      formatConfirmEn: (v) => `I heard ${v}. Is that correct? Say yes to confirm or no to change.`,
      formatConfirmHi: (v) => `मैंने सुना ${v}। क्या यह सही है? पुष्टि के लिए हाँ या बदलने के लिए नहीं कहें।`,
      apply: (v) => {
        const inp = document.getElementById('inputName');
        const cInp = document.getElementById('creditInputName');
        if (inp) inp.value = v;
        if (cInp) cInp.value = v;
      }
    },
    {
      key: 'age',
      labelEn: 'Age',
      labelHi: 'आयु',
      promptEn: "Please tell me your age in years.",
      promptHi: "कृपया अपनी आयु वर्षों में बताएं।",
      parse: (t) => FormValidationService.parseAge(t),
      formatConfirmEn: (v) => `I heard ${v} years old. Is that correct?`,
      formatConfirmHi: (v) => `मैंने सुना आपकी आयु ${v} वर्ष है। क्या यह सही है?`,
      apply: (v) => {
        const today = new Date();
        const birthYear = today.getFullYear() - v;
        const dobStr = `${birthYear}-01-01`;
        const dobInput = document.getElementById('inputDob');
        if (dobInput) dobInput.value = dobStr;
      }
    },
    {
      key: 'state',
      labelEn: 'State Domicile',
      labelHi: 'राज्य निवास',
      promptEn: "Which Indian state or Union Territory do you live in?",
      promptHi: "आप किस राज्य या केंद्र शासित प्रदेश में रहते हैं?",
      parse: (t) => FormValidationService.parseState(t),
      formatConfirmEn: (v) => {
        const s = (typeof INDIAN_STATES !== 'undefined') ? INDIAN_STATES.find(x => x.id === v) : null;
        return `I recorded your state as ${s ? s.label : v}. Is that correct?`;
      },
      formatConfirmHi: (v) => {
        const s = (typeof INDIAN_STATES !== 'undefined') ? INDIAN_STATES.find(x => x.id === v) : null;
        return `मैंने आपका राज्य ${s ? s.label : v} दर्ज किया है। क्या यह सही है?`;
      },
      apply: (v) => {
        const s1 = document.getElementById('inputState');
        const s2 = document.getElementById('creditInputState');
        if (s1) s1.value = v;
        if (s2) s2.value = v;
      }
    },
    {
      key: 'gender',
      labelEn: 'Gender',
      labelHi: 'लिंग',
      promptEn: "Please tell me your gender: Male, Female, or Other.",
      promptHi: "कृपया अपना लिंग बताएं: पुरुष, महिला, या अन्य।",
      parse: (t) => FormValidationService.parseGender(t),
      formatConfirmEn: (v) => `I heard ${v}. Is that correct?`,
      formatConfirmHi: (v) => `मैंने सुना ${v === 'female' ? 'महिला' : v === 'male' ? 'पुरुष' : 'अन्य'}। क्या यह सही है?`,
      apply: (v) => {
        const g1 = document.getElementById('inputGender');
        const g2 = document.getElementById('creditInputGender');
        if (g1) g1.value = v;
        if (g2) g2.value = v;
      }
    },
    {
      key: 'disabilityType',
      labelEn: 'Disability Condition',
      labelHi: 'दिव्यांगता स्थिति',
      promptEn: "Do you have any disability, such as visual impairment, locomotor disability, or hearing impairment? You can name your condition, or say 'no disability'.",
      promptHi: "क्या आपको कोई दिव्यांगता है, जैसे दृष्टि बाधित, चलने-फिरने में अक्षमता, या श्रवण बाधित? आप अपनी स्थिति बता सकते हैं, या 'कोई दिव्यांगता नहीं' कह सकते हैं।",
      parse: (t) => FormValidationService.parseDisability(t),
      formatConfirmEn: (v) => {
        const dObj = (typeof DISABILITY_TYPES !== 'undefined') ? DISABILITY_TYPES.find(x => x.id === v) : null;
        return `I recorded ${dObj ? dObj.label : v}. Is that correct?`;
      },
      formatConfirmHi: (v) => {
        const dObj = (typeof DISABILITY_TYPES !== 'undefined') ? DISABILITY_TYPES.find(x => x.id === v) : null;
        return `मैंने ${dObj ? dObj.labelHi || dObj.label : v} दर्ज किया है। क्या यह सही है?`;
      },
      apply: (v) => {
        if (window.WisprFlow && WisprFlow.selectDisabilityCheckbox) {
          WisprFlow.selectDisabilityCheckbox(v);
        }
      }
    },
    {
      key: 'disabilityPercent',
      labelEn: 'Disability Percentage',
      labelHi: 'दिव्यांगता प्रतिशत',
      skipIf: (p) => p.disabilityType === 'none' || !p.disabilityType,
      promptEn: "What is your approximate disability percentage from your certificate? For example, 40 percent or 60 percent.",
      promptHi: "आपके प्रमाण पत्र के अनुसार आपकी दिव्यांगता का प्रतिशत क्या है? जैसे 40 प्रतिशत या 60 प्रतिशत।",
      parse: (t) => FormValidationService.parsePercentage(t),
      formatConfirmEn: (v) => `I heard ${v} percent. Is that correct?`,
      formatConfirmHi: (v) => `मैंने सुना ${v} प्रतिशत। क्या यह सही है?`,
      apply: (v) => {
        const range = document.getElementById('inputPercent');
        if (range) range.value = v;
        if (typeof FormController !== 'undefined' && FormController.updatePercent) {
          FormController.updatePercent(v);
        }
      }
    },
    {
      key: 'educationLevel',
      labelEn: 'Education Level',
      labelHi: 'शिक्षा स्तर',
      promptEn: "What is your highest education level? For example, 10th pass, 12th pass, graduate, or vocational diploma.",
      promptHi: "आपकी वर्तमान या उच्चतम शिक्षा का स्तर क्या है? जैसे 10वीं पास, 12वीं पास, स्नातक, या डिप्लोमा।",
      parse: (t) => FormValidationService.parseEducation(t),
      formatConfirmEn: (v) => {
        const eObj = (typeof EDUCATION_LEVELS !== 'undefined') ? EDUCATION_LEVELS.find(x => x.id === v) : null;
        return `I recorded ${eObj ? eObj.label : v}. Is that correct?`;
      },
      formatConfirmHi: (v) => {
        const eObj = (typeof EDUCATION_LEVELS !== 'undefined') ? EDUCATION_LEVELS.find(x => x.id === v) : null;
        return `मैंने ${eObj ? eObj.labelHi || eObj.label : v} दर्ज किया है। क्या यह सही है?`;
      },
      apply: (v) => {
        const eSelect = document.getElementById('inputEducation');
        if (eSelect) eSelect.value = v;
      }
    },
    {
      key: 'annualIncome',
      labelEn: 'Annual Family Income',
      labelHi: 'वार्षिक पारिवारिक आय',
      promptEn: "What is your approximate annual family income in rupees? For example, below 50,000, 1 lakh, or 2 lakh 50 thousand.",
      promptHi: "आपकी वार्षिक पारिवारिक आय लगभग कितने रुपये है? जैसे 50 हजार से कम, 1 लाख, या 2 लाख 50 हजार।",
      parse: (t) => FormValidationService.parseIncome(t),
      formatConfirmEn: (v) => `Your annual family income is ₹${v.toLocaleString('en-IN')}. Is this correct?`,
      formatConfirmHi: (v) => `आपकी वार्षिक पारिवारिक आय ₹${v.toLocaleString('en-IN')} है। क्या यह सही है?`,
      apply: (v) => {
        const inc1 = document.getElementById('inputIncome');
        const inc2 = document.getElementById('creditInputIncome');
        if (inc1) inc1.value = v;
        if (inc2) inc2.value = v;
      }
    },
    {
      key: 'requirement',
      labelEn: 'Financial Assistance Requirement',
      labelHi: 'वित्तीय सहायता आवश्यकता',
      promptEn: "Are you primarily seeking welfare scholarships and assistive support, or concessional loans for business enterprise?",
      promptHi: "क्या आप छात्रवृत्ति और कल्याणकारी योजनाओं की तलाश कर रहे हैं, या व्यापार के लिए रियायती ऋण की?",
      parse: (t) => FormValidationService.parseRequirement(t),
      formatConfirmEn: (v) => `I recorded your primary requirement as ${v === 'credit' ? 'Business / Enterprise Concessional Loan' : 'Welfare Scholarships and Assistive Support'}. Is that correct?`,
      formatConfirmHi: (v) => `मैंने आपकी प्राथमिक आवश्यकता ${v === 'credit' ? 'उद्यम ऋण' : 'छात्रवृत्ति एवं कल्याण'} दर्ज की है। क्या यह सही है?`,
      apply: (v) => {
        if (typeof App !== 'undefined') {
          App.switchPersona(v);
        }
      }
    }
  ],

  start() {
    this.currentStepIndex = 0;
    this.stage = 'asking';
    this.askCurrentStep();
  },

  getCurrentStep() {
    const step = this.steps[this.currentStepIndex];
    if (step && step.skipIf && step.skipIf(this.profile)) {
      this.currentStepIndex++;
      return this.getCurrentStep();
    }
    return step;
  },

  async askCurrentStep() {
    const step = this.getCurrentStep();
    if (!step) {
      this.startReview();
      return;
    }

    this.stage = 'asking';
    const isHi = this.lang === 'hi';
    const stepBadge = document.getElementById('blindStepBadge');
    if (stepBadge) {
      stepBadge.textContent = isHi
        ? `चरण ${this.currentStepIndex + 1} / ${this.steps.length}: ${step.labelHi}`
        : `Step ${this.currentStepIndex + 1} of ${this.steps.length}: ${step.labelEn}`;
    }

    const promptText = isHi ? step.promptHi : step.promptEn;

    // AI speaks question with recognition strictly STOPPED & MUTED
    await SpeechSynthesisService.speak(promptText);

    // ONLY after speech completely ends + tail delay: start fresh listening session
    SpeechRecognitionService.startListening(
      (speech) => this.handleUserSpeech(speech),
      (err) => console.warn('Form speech error:', err)
    );
  },

  resumeListening() {
    SpeechRecognitionService.startListening(
      (speech) => this.handleUserSpeech(speech),
      (err) => console.warn('Form speech error:', err)
    );
  },

  async handleUserSpeech(transcript) {
    // 1. Check for global navigation or control commands
    const globalCmd = VoiceCommandInterpreter.checkGlobalCommands(transcript);
    if (globalCmd) {
      this.executeGlobalCommand(globalCmd);
      return;
    }

    const isHi = this.lang === 'hi';

    // 2. If in Confirming Answer Stage
    if (this.stage === 'confirming_answer') {
      if (VoiceCommandInterpreter.isAffirmative(transcript)) {
        // Confirmed! Commit value to profile and DOM
        this.profile[this.pendingKey] = this.pendingValue;
        const step = this.steps[this.currentStepIndex];
        if (step && typeof step.apply === 'function') {
          step.apply(this.pendingValue);
        }

        const confirmMsg = isHi
          ? `${step.labelHi} सफलतापूर्वक दर्ज हो गया।`
          : `${step.labelEn} successfully saved.`;

        // Speaks confirmation with microphone muted
        await SpeechSynthesisService.speak(confirmMsg);

        this.currentStepIndex++;
        this.pendingKey = null;
        this.pendingValue = null;

        // Moves to next question cleanly
        this.askCurrentStep();
      } else if (VoiceCommandInterpreter.isNegative(transcript)) {
        const retryMsg = isHi
          ? 'कोई बात नहीं। कृपया अपना उत्तर फिर से बताएं।'
          : 'No problem. Please state your answer again.';
        await SpeechSynthesisService.speak(retryMsg);
        this.stage = 'asking';
        SpeechRecognitionService.startListening(
          (s) => this.handleUserSpeech(s),
          (e) => {}
        );
      } else {
        const clarMsg = isHi
          ? 'कृपया केवल हाँ या नहीं बोलकर पुष्टि करें।'
          : 'Please confirm by saying Yes or No.';
        await SpeechSynthesisService.speak(clarMsg);
        SpeechRecognitionService.startListening(
          (s) => this.handleUserSpeech(s),
          (e) => {}
        );
      }
      return;
    }

    // 3. If in Final Review Stage
    if (this.stage === 'review') {
      if (VoiceCommandInterpreter.isAffirmative(transcript)) {
        await SpeechSynthesisService.speak(
          isHi
            ? 'धन्यवाद! आपकी प्रोफ़ाइल की पुष्टि हो गई है। अब मैं आपकी पात्रता का मूल्यांकन कर रहा हूँ।'
            : 'Thank you! Your profile has been verified. I am now matching you against all government schemes.'
        );
        this.stage = 'matched';
        VoiceSchemePresenter.runMatching(this.profile, this.lang);
      } else if (VoiceCommandInterpreter.isNegative(transcript)) {
        await SpeechSynthesisService.speak(
          isHi
            ? 'आप किस जानकारी को बदलना चाहते हैं? आप नाम, आयु, राज्य, दिव्यांगता, या आय कह सकते हैं।'
            : 'Which information would you like to change? You can say name, age, state, disability, or income.'
        );
        SpeechRecognitionService.startListening(
          (s) => this.handleCorrectionTarget(s),
          (e) => {}
        );
      }
      return;
    }

    // 4. In Asking Stage — Parse and Validate
    const step = this.getCurrentStep();
    if (!step) return;

    const parsed = step.parse(transcript);
    if (parsed !== null && parsed !== undefined) {
      this.pendingKey = step.key;
      this.pendingValue = parsed;
      this.stage = 'confirming_answer';

      const confirmText = isHi ? step.formatConfirmHi(parsed) : step.formatConfirmEn(parsed);

      // AI speaks confirmation question with recognition strictly STOPPED & MUTED
      await SpeechSynthesisService.speak(confirmText);

      // ONLY after speech completes + tail delay: start listening for confirmation
      SpeechRecognitionService.startListening(
        (s) => this.handleUserSpeech(s),
        (e) => {}
      );
    } else {
      const errPrompt = isHi
        ? `माफ़ कीजिये, मैं समझ नहीं पाया। कृपया अपना ${step.labelHi} दोबारा बताएं।`
        : `I could not understand that properly. Could you please repeat your ${step.labelEn}?`;
      await SpeechSynthesisService.speak(errPrompt);

      SpeechRecognitionService.startListening(
        (s) => this.handleUserSpeech(s),
        (e) => {}
      );
    }
  },

  async handleCorrectionTarget(transcript) {
    const t = transcript.toLowerCase();
    let targetIdx = -1;
    if (t.includes('name') || t.includes('naam')) targetIdx = 0;
    else if (t.includes('age') || t.includes('umar') || t.includes('aayu')) targetIdx = 1;
    else if (t.includes('state') || t.includes('rajya')) targetIdx = 2;
    else if (t.includes('gender') || t.includes('ling')) targetIdx = 3;
    else if (t.includes('disability') || t.includes('divyang')) targetIdx = 4;
    else if (t.includes('education') || t.includes('shiksha')) targetIdx = 6;
    else if (t.includes('income') || t.includes('aay')) targetIdx = 7;

    if (targetIdx !== -1) {
      this.currentStepIndex = targetIdx;
      this.askCurrentStep();
    } else {
      await SpeechSynthesisService.speak(
        this.lang === 'hi'
          ? 'कृपया उस फ़ील्ड का नाम बताएं जिसे आप बदलना चाहते हैं।'
          : 'Please specify the field you want to modify, such as name, state, or income.'
      );
      SpeechRecognitionService.startListening(
        (s) => this.handleCorrectionTarget(s),
        (e) => {}
      );
    }
  },

  async startReview() {
    this.stage = 'review';
    const isHi = this.lang === 'hi';

    const p = this.profile;
    const sObj = (typeof INDIAN_STATES !== 'undefined') ? INDIAN_STATES.find(x => x.id === p.state) : null;
    const stateName = sObj ? sObj.label : p.state;

    const reviewText = isHi
      ? `हमने आपकी प्रोफ़ाइल पूरी कर ली है। आइए जानकारी की दोबारा समीक्षा करते हैं।
         आपका नाम ${p.name} है।
         आपकी आयु ${p.age} वर्ष है।
         आपका राज्य ${stateName} है।
         आपकी वार्षिक पारिवारिक आय ₹${p.annualIncome ? p.annualIncome.toLocaleString('en-IN') : 0} है।
         क्या यह सारी जानकारी सही है? आगे बढ़ने के लिए हाँ या बदलाव के लिए नहीं कहें।`
      : `We have completed your profile. Let me read your information once again.
         Your name is ${p.name}.
         Your age is ${p.age}.
         Your state is ${stateName}.
         Your annual family income is ₹${p.annualIncome ? p.annualIncome.toLocaleString('en-IN') : 0}.
         Your assistance requirement is ${p.requirement === 'credit' ? 'Business Loan' : 'Welfare Scholarships'}.
         Is all this information correct? You can say yes to continue or no to make changes.`;

    await SpeechSynthesisService.speak(reviewText);

    SpeechRecognitionService.startListening(
      (s) => this.handleUserSpeech(s),
      (e) => {}
    );
  },

  executeGlobalCommand(cmd) {
    if (cmd.type === 'repeat') {
      SpeechSynthesisService.speak(
        SpeechSynthesisService.currentUtterance?.text || 'Repeating last instruction'
      );
    } else if (cmd.type === 'pause') {
      SpeechRecognitionService.pause();
      SpeechSynthesisService.speak(this.lang === 'hi' ? 'वॉयस असिस्टेंट रुका हुआ है।' : 'Voice assistant paused.');
    } else if (cmd.type === 'resume') {
      SpeechRecognitionService.resume();
      SpeechSynthesisService.speak(this.lang === 'hi' ? 'सुनना जारी है।' : 'Resumed listening.');
    } else if (cmd.type === 'cancel') {
      this.stage = 'idle';
      SpeechRecognitionService.stop();
      SpeechSynthesisService.speak(this.lang === 'hi' ? 'प्रक्रिया रद्द कर दी गई।' : 'Process cancelled.');
    } else if (cmd.type === 'change_lang') {
      this.lang = this.lang === 'en' ? 'hi' : 'en';
      SpeechSynthesisService.setLanguage(this.lang);
      SpeechRecognitionService.setLanguage(this.lang);
      SpeechSynthesisService.speak(this.lang === 'hi' ? 'अब मैं हिंदी में बोलूंगा।' : 'Switched to English.');
      setTimeout(() => this.askCurrentStep(), 1200);
    } else if (cmd.type === 'nav_home') {
      if (typeof App !== 'undefined') App.navigate('home');
      SpeechSynthesisService.speak(this.lang === 'hi' ? 'होमपेज पर नेविगेट किया गया।' : 'Navigated to Homepage.');
    } else if (cmd.type === 'switch_standard') {
      AccessibilityModeManager.selectMode('standard');
    }
  }
};

/**
 * 6. VoiceSchemePresenter
 * Runs verified profile against SamarthyaMatcher and speaks explainable results
 */
const VoiceSchemePresenter = {
  results: [],
  currentIndex: 0,
  lang: 'en',

  async runMatching(profile, lang = 'en') {
    this.lang = lang;
    const isHi = lang === 'hi';

    let results = [];

    if (profile.requirement === 'credit') {
      const creditProfile = {
        name: profile.name,
        casteCertificate: true,
        gender: profile.gender || 'male',
        state: profile.state || 'delhi',
        purpose: 'business',
        projectType: 'trade',
        projectCost: 150000,
        householdIncome: profile.annualIncome || 150000
      };

      if (typeof App !== 'undefined') {
        App.creditProfile = creditProfile;
        App.switchPersona('credit');
        App.navigate('match');
      }

      if (typeof CreditMatcher !== 'undefined' && typeof CREDIT_SCHEME_DATABASE !== 'undefined') {
        results = CreditMatcher.match(creditProfile, CREDIT_SCHEME_DATABASE);
      }

      if (typeof CreditResultsRenderer !== 'undefined' && results.length > 0) {
        CreditResultsRenderer.render(results, creditProfile);
      }
    } else {
      // Build welfare matcher profile
      const matchProfile = {
        name: profile.name,
        dob: `${new Date().getFullYear() - profile.age}-01-01`,
        age: profile.age,
        gender: profile.gender || 'male',
        state: profile.state || 'delhi',
        disabilityTypes: profile.disabilityType ? [profile.disabilityType] : ['none'],
        disabilityPercent: profile.disabilityPercent || 0,
        educationLevel: profile.educationLevel || 'secondary',
        householdIncome: profile.annualIncome || 150000
      };

      if (typeof App !== 'undefined') {
        App.profile = matchProfile;
        App.switchPersona('welfare');
        App.navigate('match');
      }

      if (typeof SamarthyaMatcher !== 'undefined' && typeof SCHEME_DATABASE !== 'undefined') {
        results = SamarthyaMatcher.match(matchProfile, SCHEME_DATABASE);
      }

      if (typeof ResultsRenderer !== 'undefined' && results.length > 0) {
        ResultsRenderer.render(results, matchProfile);
      }
    }

    this.results = results;
    this.currentIndex = 0;

    if (results.length === 0) {
      await SpeechSynthesisService.speak(
        isHi
          ? 'आपके वर्तमान मानदंडों के लिए कोई सीधी मेल खाने वाली योजना नहीं मिली। आप अपने मानदंड बदलकर पुनः प्रयास कर सकते हैं।'
          : 'I did not find any directly matching schemes for your exact criteria. You can change your criteria and try again.'
      );
      return;
    }

    const topScheme = results[0].scheme;
    const introMsg = isHi
      ? `आपके पुष्ट विवरण के आधार पर, मुझे ${results.length} प्रासंगिक सरकारी योजनाएं मिली हैं। आपकी सबसे उपयुक्त योजना ${topScheme.nameHi || topScheme.name} है, जिसका मिलान स्कोर ${results[0].score} प्रतिशत है। क्या आप इसके लाभ सुनना चाहते हैं?`
      : `Based on your verified information, I found ${results.length} matching government schemes. Your top match is ${topScheme.name} with a match score of ${results[0].score} percent. Would you like me to explain its financial benefits?`;

    await SpeechSynthesisService.speak(introMsg);

    // Listen for follow-up questions
    SpeechRecognitionService.startListening(
      (speech) => this.handleSchemeQuestions(speech),
      (err) => {}
    );
  },

  async handleSchemeQuestions(speech) {
    const t = speech.toLowerCase();
    const isHi = this.lang === 'hi';
    const current = this.results[this.currentIndex];
    if (!current) return;
    const scheme = current.scheme;

    if (VoiceCommandInterpreter.isAffirmative(t) || t.includes('benefit') || t.includes('fayda') || t.includes('how much') || t.includes('labh')) {
      const benefits = isHi
        ? (scheme.benefitsHi || scheme.benefits || scheme.concession || 'रियायती ब्याज दर और ऋण स्थगन सहायता')
        : (scheme.benefits || scheme.concession || 'Low interest concessional funding with moratorium holiday');
      const bText = isHi
        ? `इस योजना के मुख्य लाभ हैं: ${benefits}. क्या आप आवश्यक दस्तावेज़ जानना चाहते हैं?`
        : `The key benefits of this scheme are: ${benefits}. Would you like to know the required documents?`;
      await SpeechSynthesisService.speak(bText);
    } else if (t.includes('document') || t.includes('dastavez') || t.includes('kagaz')) {
      const docs = scheme.documentsRequired
        ? scheme.documentsRequired.join(', ')
        : (scheme.documents ? scheme.documents.join(', ') : 'Aadhaar, Caste/Disability Certificate, Domicile and Bank Details');
      const docText = isHi
        ? `आवश्यक दस्तावेज़ हैं: ${docs}। आवेदन करने के लिए आप संबंधित आधिकारिक पोर्टल या जिला कार्यालय जा सकते हैं।`
        : `The required documents are: ${docs}. To apply, you can visit the official online portal or accredited Channel Partner branch.`;
      await SpeechSynthesisService.speak(docText);
    } else if (t.includes('why') || t.includes('eligible') || t.includes('kyon')) {
      const reasons = current.matchedReasons ? current.matchedReasons.join('. ') : 'Your disability, state, and income criteria match.';
      const whyText = isHi
        ? `आप पात्र हैं क्योंकि: ${reasons}`
        : `You are eligible because: ${reasons}`;
      await SpeechSynthesisService.speak(whyText);
    } else if (t.includes('next') || t.includes('agla') || t.includes('dusri')) {
      if (this.currentIndex + 1 < this.results.length) {
        this.currentIndex++;
        const next = this.results[this.currentIndex];
        const nextMsg = isHi
          ? `अगली योजना है ${next.scheme.nameHi || next.scheme.name}, स्कोर ${next.score} प्रतिशत। क्या आप इसके लाभ सुनना चाहते हैं?`
          : `The next scheme is ${next.scheme.name} with a match score of ${next.score} percent. Would you like me to explain its benefits?`;
        await SpeechSynthesisService.speak(nextMsg);
      } else {
        await SpeechSynthesisService.speak(isHi ? 'यह आपकी अंतिम योजना थी।' : 'That was the last matching scheme in your list.');
      }
    } else if (t.includes('stop') || t.includes('finish') || t.includes('khatam')) {
      await SpeechSynthesisService.speak(isHi ? 'धन्यवाद! आपकी सहायता करके खुशी हुई।' : 'Thank you! It was a pleasure assisting you.');
      SpeechRecognitionService.stop();
      return;
    }

    // Keep listening for next command
    SpeechRecognitionService.startListening(
      (s) => this.handleSchemeQuestions(s),
      (e) => {}
    );
  }
};

/**
 * 7. VoiceAssistantController
 * Orchestrates voice assistant activation, greeting, language choice, permissions, and controls
 */
const VoiceAssistantController = {
  isActive: false,
  state: ConversationState.IDLE,

  setState(newState) {
    this.state = newState;

    const pill = document.getElementById('blindStatusPill');
    const text = document.getElementById('blindStatusText');
    const statusAria = document.getElementById('blindStatusAria');

    if (!pill || !text) return;

    let cssClass = 'listening';
    let label = 'Listening...';

    switch (newState) {
      case ConversationState.IDLE:
        cssClass = 'idle';
        label = 'Ready';
        break;
      case ConversationState.SPEAKING:
        cssClass = 'speaking';
        label = 'Speaking...';
        break;
      case ConversationState.LISTENING:
        cssClass = 'listening';
        label = 'Listening...';
        break;
      case ConversationState.PROCESSING:
        cssClass = 'processing';
        label = 'Processing...';
        break;
      case ConversationState.WAITING_FOR_CONFIRMATION:
        cssClass = 'confirming';
        label = 'Waiting for Confirmation';
        break;
      case ConversationState.ERROR:
        cssClass = 'error';
        label = 'Microphone Error';
        break;
    }

    pill.className = `blind-status-pill ${cssClass}`;
    text.textContent = label;

    if (statusAria) {
      statusAria.textContent = `Status: ${label}`;
    }
  },

  async start() {
    this.isActive = true;
    const dock = document.getElementById('blindVoiceAssistantDock');
    if (dock) dock.classList.add('open');

    SpeechSynthesisService.init();
    await SpeechRecognitionService.init();

    // Welcome Greeting (Recognition is strictly muted)
    const greeting = "Welcome to Saksham. Your voice assistant is ready. I will guide you through every step of the process. You can speak naturally, ask me to repeat anything, or say stop at any time.";
    await SpeechSynthesisService.speak(greeting);

    // Language Preference Selection
    const langPrompt = "Would you like to continue in English, or Hindi? You can say English, or Hindi.";
    await SpeechSynthesisService.speak(langPrompt);

    // ONLY after both greetings finish: start listening for language preference
    SpeechRecognitionService.startListening(
      (speech) => this.handleInitialLanguageSelection(speech),
      (err) => console.warn('Initial speech error:', err)
    );
  },

  async handleInitialLanguageSelection(transcript) {
    const t = transcript.toLowerCase().trim();
    let selectedLang = 'en';

    if (t.includes('hindi') || t.includes('हिंदी')) {
      selectedLang = 'hi';
    }

    ConversationalFormEngine.lang = selectedLang;
    VoiceSchemePresenter.lang = selectedLang;
    SpeechSynthesisService.setLanguage(selectedLang);
    SpeechRecognitionService.setLanguage(selectedLang);

    const isHi = selectedLang === 'hi';
    const ackMsg = isHi
      ? 'हिंदी का चयन किया गया है। सुरक्षित बातचीत के लिए, कृपया ब्राउज़र में माइक्रोफ़ोन की अनुमति दें।'
      : 'English confirmed. For secure hands-free assistance, please allow microphone access in your browser.';

    await SpeechSynthesisService.speak(ackMsg);

    const startMsg = isHi
      ? 'अब हम आपके लिए सर्वोत्तम सरकारी योजनाएं और छात्रवृत्ति खोजने के लिए एक छोटा पात्रता मूल्यांकन शुरू कर रहे हैं।'
      : 'We will now begin your step-by-step eligibility assessment to discover entitled schemes and financial assistance.';

    await SpeechSynthesisService.speak(startMsg);

    // Start Question 1
    ConversationalFormEngine.start();
  },

  toggleMic() {
    if (SpeechRecognitionService.isListening && !SpeechRecognitionService.isPaused) {
      SpeechRecognitionService.pause();
    } else {
      SpeechRecognitionService.resume();
    }
  },

  repeatLastInstruction() {
    ConversationalFormEngine.executeGlobalCommand({ type: 'repeat' });
  },

  toggleLanguage() {
    ConversationalFormEngine.executeGlobalCommand({ type: 'change_lang' });
  },

  stop() {
    this.isActive = false;
    SpeechSynthesisService.cancel();
    SpeechRecognitionService.stop();
    this.setState(ConversationState.IDLE);

    const dock = document.getElementById('blindVoiceAssistantDock');
    if (dock) dock.classList.remove('open');
  }
};

/**
 * 8. AccessibilityModeManager
 * Manages dual experience modes (Standard vs. Blind Voice Navigation) with session persistence
 */
const AccessibilityModeManager = {
  currentMode: 'standard', // 'standard' | 'blind'

  init() {
    SpeechSynthesisService.init();
    this.setupKeyboardShortcuts();

    const saved = localStorage.getItem('saksham_experience_mode');
    if (saved === 'blind') {
      this.selectMode('blind', false);
    } else if (!saved) {
      setTimeout(() => {
        this.openModal();
      }, 700);
    } else {
      this.updateNavbarPill('standard');
    }
  },

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Alt + M (or Alt + V) toggles experience selector modal
      if (e.altKey && (e.key === 'm' || e.key === 'M' || e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        this.openModal();
      }

      // In Blind Mode: Spacebar toggles microphone if not actively typing in an input
      if (this.currentMode === 'blind') {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (e.code === 'Space' && activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          VoiceAssistantController.toggleMic();
        } else if ((e.key === 'r' || e.key === 'R') && activeTag !== 'input') {
          e.preventDefault();
          VoiceAssistantController.repeatLastInstruction();
        } else if ((e.key === 'c' || e.key === 'C') && activeTag !== 'input') {
          e.preventDefault();
          VoiceAssistantController.stop();
        }
      }
    });
  },

  openModal() {
    const modal = document.getElementById('experienceModal');
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');

      const activeCard = modal.querySelector('.experience-card.selected') || modal.querySelector('.experience-card');
      if (activeCard) activeCard.focus();

      const ariaLive = document.getElementById('blindAriaAnnouncer');
      if (ariaLive) {
        ariaLive.textContent = "Experience Selection dialog opened. Choose between Standard Experience or Blind Voice Navigation.";
      }
    }
  },

  closeModal() {
    const modal = document.getElementById('experienceModal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  },

  selectMode(mode, save = true) {
    this.currentMode = mode;
    if (save) {
      localStorage.setItem('saksham_experience_mode', mode);
    }

    this.closeModal();
    this.updateNavbarPill(mode);

    if (mode === 'blind') {
      document.body.classList.add('blind-mode-active');
      VoiceAssistantController.start();
    } else {
      document.body.classList.remove('blind-mode-active');
      VoiceAssistantController.stop();
      if (save) {
        const ariaLive = document.getElementById('blindAriaAnnouncer');
        if (ariaLive) {
          ariaLive.textContent = "Switched to Standard Experience.";
        }
      }
    }
  },

  updateNavbarPill(mode) {
    const pill = document.getElementById('headerExperienceBtn');
    const text = document.getElementById('headerExperienceText');
    const icon = document.getElementById('headerExperienceIcon');

    if (pill && text && icon) {
      if (mode === 'blind') {
        pill.classList.add('blind-active');
        text.textContent = 'Voice Nav Active';
        icon.textContent = '🎙️';
      } else {
        pill.classList.remove('blind-active');
        text.textContent = 'Standard Mode';
        icon.textContent = '👁️';
      }
    }
  }
};

// Export services to window
window.ConversationState = ConversationState;
window.EchoGuard = EchoGuard;
window.SpeechSynthesisService = SpeechSynthesisService;
window.SpeechRecognitionService = SpeechRecognitionService;
window.FormValidationService = FormValidationService;
window.VoiceCommandInterpreter = VoiceCommandInterpreter;
window.ConversationalFormEngine = ConversationalFormEngine;
window.VoiceSchemePresenter = VoiceSchemePresenter;
window.VoiceAssistantController = VoiceAssistantController;
window.AccessibilityModeManager = AccessibilityModeManager;
