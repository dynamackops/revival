import { useId, useRef, useState } from "react";

type RecognitionEvent = Event & {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
};

type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionConstructor = new () => Recognition;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

export function DictationTextarea({ label, hint, value, onChange }: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<Recognition | undefined>(undefined);
  const RecognitionApi = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  const fieldId = useId();

  function toggleDictation() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    if (!RecognitionApi) return;

    const recognition = new RecognitionApi();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, index) =>
        event.results[index][0].transcript,
      ).join(" ");
      onChange([value.trim(), transcript.trim()].filter(Boolean).join(" "));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  return (
    <div className="dictation-field">
      <span className="field-heading">
        <label htmlFor={fieldId}>{label}</label>
        <button
          className="dictation-button"
          type="button"
          onClick={toggleDictation}
          disabled={!RecognitionApi}
          aria-pressed={listening}
          title={RecognitionApi ? "Dictate this answer" : "Dictation is not available in this browser"}
        >
          <span aria-hidden="true">{listening ? "■" : "●"}</span>
          {listening ? "Listening" : "Dictate"}
        </button>
      </span>
      <textarea
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={hint}
        rows={3}
      />
    </div>
  );
}
