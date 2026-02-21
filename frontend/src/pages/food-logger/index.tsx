import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { foodApi } from '@shared/api/endpoints';
import { useUserStore } from '@shared/store/user-store';
import { Card } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Icons } from '@shared/ui/icons';
import { useVoice } from '@shared/hooks/use-voice';
import { ResultModal } from '@shared/ui/modal';

export const FoodLoggerPage = () => {
  const { user } = useUserStore();
  const [method, setMethod] = useState<'camera' | 'voice'>('camera');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    message: string;
    details: { label: string; value: string }[];
    variant: 'success' | 'warning' | 'error' | 'info';
  } | null>(null);

  const {
    isRecording,
    isProcessing,
    transcript,
    recordedAudio,
    startRecording,
    stopRecording,
    error: voiceError,
  } = useVoice();

  const showFoodResult = (result: any) => {
    const bpImpact = result.bpImpact || 'low';
    let variant: 'success' | 'warning' | 'error' | 'info' = 'success';
    if (bpImpact === 'high') variant = 'error';
    else if (bpImpact === 'moderate') variant = 'warning';

    const details: { label: string; value: string }[] = [];
    if (result.foodName) details.push({ label: 'Food', value: result.foodName });
    if (result.calories) details.push({ label: 'Calories', value: `${result.calories} kcal` });
    if (result.sodium) details.push({ label: 'Sodium', value: `${result.sodium} mg` });
    details.push({ label: 'BP Impact', value: bpImpact.charAt(0).toUpperCase() + bpImpact.slice(1) });

    setModalData({
      title: result.foodName || 'Food Analysis',
      message: result.message || 'Food logged successfully.',
      details,
      variant,
    });
    setModalOpen(true);
    setSelectedFile(null);
  };

  const analyzeMutation = useMutation({
    mutationFn: (file: File) => foodApi.analyze(file, user!.id),
    onSuccess: (response) => {
      const result = response.data.data;
      if (result) showFoodResult(result);
    },
    onError: (err: any) => {
      setModalData({
        title: 'Analysis Failed',
        message: err.response?.data?.error?.message || 'Could not analyze the food image. Please try again.',
        details: [],
        variant: 'error',
      });
      setModalOpen(true);
    },
  });

  const voiceMutation = useMutation({
    mutationFn: (file: File) => foodApi.logVoice(user!.id, file),
    onSuccess: (response) => {
      const result = response.data.data;
      if (result) showFoodResult(result);
    },
    onError: (err: any) => {
      setModalData({
        title: 'Voice Analysis Failed',
        message: err.response?.data?.error?.message || 'Could not process voice input. Please try again.',
        details: [],
        variant: 'error',
      });
      setModalOpen(true);
    },
  });

  // Auto-submit when audio is recorded and transcription is complete
  useEffect(() => {
    if (recordedAudio && !isProcessing && user && transcript && !voiceMutation.isPending && method === 'voice') {
      voiceMutation.mutate(recordedAudio);
    }
  }, [recordedAudio, isProcessing, transcript, user, method]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      analyzeMutation.mutate(file);
    }
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-6">
            <Icons.Camera className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Food Logger</h1>
          <p className="text-lg text-gray-600">Log your meals using camera or voice</p>
        </motion.div>

        <Card className="p-8">
          {/* Method Selection */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMethod('camera')}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                method === 'camera'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <Icons.Camera className={`w-8 h-8 mx-auto mb-3 ${
                method === 'camera' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <p className={`font-semibold ${
                method === 'camera' ? 'text-blue-900' : 'text-gray-600'
              }`}>
                Camera
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMethod('voice')}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                method === 'voice'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <Icons.Microphone className={`w-8 h-8 mx-auto mb-3 ${
                method === 'voice' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <p className={`font-semibold ${
                method === 'voice' ? 'text-blue-900' : 'text-gray-600'
              }`}>
                Voice
              </p>
            </motion.button>
          </div>

          {/* Camera Method */}
          {method === 'camera' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzeMutation.isPending}
                className="w-full"
                size="lg"
                icon="Camera"
                loading={analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? 'Analyzing...' : 'Take Photo'}
              </Button>
            </motion.div>
          )}

          {/* Voice Method */}
          {method === 'voice' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleVoiceRecord}
                  disabled={isProcessing}
                  className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 shadow-lg'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-lg'
                  } text-white`}
                >
                  {isRecording ? (
                    <Icons.Stop className="w-10 h-10" />
                  ) : (
                    <Icons.Microphone className="w-10 h-10" />
                  )}
                </motion.button>
                <p className="mt-4 text-sm text-gray-600">
                  {isRecording ? 'Recording... Tap to stop' : 'Tap to describe your meal'}
                </p>
              </div>

              {transcript && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Transcript:</p>
                  <p className="text-gray-900">{transcript}</p>
                </div>
              )}

              {voiceError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700">{voiceError}</p>
                </div>
              )}

              {(isProcessing || voiceMutation.isPending) && (
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    {isProcessing ? 'Transcribing...' : 'Analyzing food...'}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {selectedFile && !analyzeMutation.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              <p className="text-sm font-medium text-gray-700 mb-1">Selected:</p>
              <p className="text-gray-900 font-semibold">{selectedFile.name}</p>
            </motion.div>
          )}
        </Card>
      </div>

      {/* Food Result Modal */}
      {modalData && (
        <ResultModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setModalData(null); }}
          title={modalData.title}
          message={modalData.message}
          details={modalData.details}
          variant={modalData.variant}
          actionLabel="Got it"
        />
      )}
    </div>
  );
};
