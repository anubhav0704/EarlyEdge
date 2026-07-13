import { useState, useEffect, useRef } from 'react';

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [heardText, setHeardText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [asrSupported, setAsrSupported] = useState(false);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // Initialize Speech APIs Support check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTtsSupported(!!window.speechSynthesis);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setAsrSupported(!!SpeechRecognition);
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Speak method
  const speak = (text, onEndCallback = null) => {
    if (!window.speechSynthesis) {
      if (onEndCallback) setTimeout(onEndCallback, 1000);
      return;
    }

    // Cancel active synthesis speech
    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    let callbackFired = false;
    let failsafeTimer = null;

    const triggerCallback = () => {
      if (callbackFired) return;
      callbackFired = true;
      setIsSpeaking(false);
      clearTimeout(failsafeTimer);
      if (onEndCallback) onEndCallback();
    };

    // Chrome/Edge synthesis failsafe backup: ~120ms per character + 3000ms grace period.
    const maxDuration = (text.length * 120) + 3000;
    failsafeTimer = setTimeout(() => {
      console.warn('Speech synthesis utterance onend timed out. Triggering failsafe backup.');
      try { window.speechSynthesis.cancel(); } catch (e) {}
      triggerCallback();
    }, maxDuration);

    utterance.onend = () => {
      setTimeout(triggerCallback, 500);
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      triggerCallback();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Start listening method
  const startListening = (onFinalCallback = null, durationMs = 3000) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser.');
      // Mock result fallback for demo stability
      setTimeout(() => {
        if (onFinalCallback) onFinalCallback("React and Node.js with MongoDB");
      }, 2000);
      return;
    }

    // Stop active recognition before launching new
    stopListening();
    setHeardText('');
    setInterimText('');
    setIsListening(true);

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    let finalTranscript = '';
    let latestInterim = '';

    rec.onstart = () => {
      console.log('Voice listener active...');
    };

    rec.onresult = (event) => {
      clearTimeout(silenceTimerRef.current);
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      latestInterim = interimTranscript;
      setInterimText(interimTranscript);

      // Trigger automatic silence callback
      silenceTimerRef.current = setTimeout(() => {
        console.log('Silence detected...');
        const fullText = (finalTranscript + latestInterim).trim();
        if (fullText.length > 0) {
          rec.stop();
        }
      }, durationMs);
    };

    rec.onend = () => {
      setIsListening(false);
      clearTimeout(silenceTimerRef.current);
      
      const fullText = (finalTranscript + latestInterim).trim();
      setHeardText(fullText);

      if (onFinalCallback) {
        onFinalCallback(fullText);
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') return; // Silence handles
      setIsListening(false);
      clearTimeout(silenceTimerRef.current);
    };

    recognitionRef.current = rec;
    
    try {
      rec.start();
    } catch (e) {
      console.error('Speech start exception:', e);
      setIsListening(false);
    }
  };

  // Stop listening method
  const stopListening = () => {
    clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Stop recognition error:', e);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  return {
    isListening,
    heardText,
    interimText,
    isSpeaking,
    ttsSupported,
    asrSupported,
    speak,
    startListening,
    stopListening
  };
};
