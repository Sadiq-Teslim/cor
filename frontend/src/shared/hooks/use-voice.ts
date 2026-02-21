import { useState, useRef, useCallback } from 'react';
import { voiceApi } from '../api/endpoints';

interface UseVoiceOptions {
  onTranscribe?: (text: string, language: string) => void;
  onError?: (error: Error) => void;
}

export const useVoice = (options?: UseVoiceOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [language, setLanguage] = useState<string>('en');
  const [error, setError] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        setRecordedAudio(audioFile);
        setIsProcessing(true);

        try {
          const response = await voiceApi.transcribe(audioFile);
          if (response.data.data) {
            const { text, language: detectedLang } = response.data.data;
            setTranscript(text);
            setLanguage(detectedLang);
            if (options?.onTranscribe) {
              options.onTranscribe(text, detectedLang);
            }
          }
        } catch (err: any) {
          const errorMsg = err.response?.data?.error?.message || err.message || 'Failed to transcribe audio';
          setError(errorMsg);
          if (options?.onError) {
            options.onError(new Error(errorMsg));
          }
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to access microphone';
      setError(errorMsg);
      if (options?.onError) {
        options.onError(new Error(errorMsg));
      }
    }
  }, [options]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const speak = useCallback(async (text: string, lang: string = 'en') => {
    try {
      setError('');
      const response = await voiceApi.speak(text, lang);
      const audioBlob = response.data;
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      return new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = (err) => {
          URL.revokeObjectURL(audioUrl);
          reject(err);
        };
        audio.play();
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Failed to generate speech';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  return {
    isRecording,
    isProcessing,
    transcript,
    language,
    error,
    recordedAudio,
    startRecording,
    stopRecording,
    speak,
    clearTranscript: () => {
      setTranscript('');
      setRecordedAudio(null);
      audioChunksRef.current = [];
    },
  };
};

