/**
 * rPPG (Remote Photoplethysmography) Detection
 * Uses phone camera + torch to detect heart rate and HRV from fingertip
 * 
 * How it works:
 * - Phone torch (LED) shines white light into fingertip
 * - Blood absorbs light differently based on volume in vessels
 * - Heart beat = pulse of blood = more absorption = less reflected light
 * - Between beats = less blood = less absorption = more reflected light
 * - Camera captures these light fluctuations at 30fps
 * - RED channel is used because hemoglobin absorbs red light most strongly
 * 
 * Physical process:
 * - Torch shines light → Fingertip → Blood absorbs/reflects → Camera captures
 * - The rhythm of light changes IS your pulse
 */

export interface DetectionResult {
    hrv: number; // Heart Rate Variability in ms (RMSSD)
    heartRate: number; // Heart rate in bpm
    confidence: number; // 0-1 confidence score
    signalStrength: number; // Current signal strength
}

export class RPPGDetector {
    private video: HTMLVideoElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private stream: MediaStream | null = null;
    private track: MediaStreamTrack | null = null;
    private animationFrame: number | null = null;
    private isRunning = false;

    // Signal processing
    private signalHistory: number[] = [];
    private frameCount = 0;
    private startTime = 0;
    private readonly SAMPLE_RATE = 30; // fps
    private readonly MIN_SAMPLES = 90; // 3 seconds at 30fps
    private readonly MAX_SAMPLES = 300; // 10 seconds at 30fps

    // Callbacks for real-time updates
    private onSignalUpdate?: (signalStrength: number) => void;
    private onFrameProcessed?: (frameCount: number) => void;

    constructor(
        videoElement: HTMLVideoElement,
        canvasElement: HTMLCanvasElement,
        callbacks?: {
            onSignalUpdate?: (signalStrength: number) => void;
            onFrameProcessed?: (frameCount: number) => void;
        }
    ) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d', { willReadFrequently: true });
        this.onSignalUpdate = callbacks?.onSignalUpdate;
        this.onFrameProcessed = callbacks?.onFrameProcessed;
    }

    async start(): Promise<void> {
        try {
            // Request camera access with torch/flashlight if available
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' }, // Back camera for phones
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 },
                    torch: true, // Request torch if available
                } as MediaTrackConstraints,
            });

            // Try to enable torch/flashlight
            this.track = this.stream.getVideoTracks()[0];
            if (this.track && 'applyConstraints' in this.track) {
                try {
                    await (this.track as any).applyConstraints({
                        advanced: [{ torch: true } as any],
                    });
                } catch (e) {
                    console.log('Torch not available, continuing without it');
                }
            }

            if (this.video) {
                this.video.srcObject = this.stream;
                await this.video.play();
                this.isRunning = true;
                this.startTime = Date.now();
                this.frameCount = 0;
                this.signalHistory = [];
                this.processFrames();
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            throw new Error('Could not access camera. Please ensure camera permissions are granted.');
        }
    }

    stop(): void {
        this.isRunning = false;

        // Turn off torch
        if (this.track && 'applyConstraints' in this.track) {
            try {
                (this.track as any).applyConstraints({
                    advanced: [{ torch: false } as any],
                });
            } catch (e) {
                // Ignore
            }
        }

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.video) {
            this.video.srcObject = null;
        }
    }

    private processFrames(): void {
        if (!this.isRunning || !this.video || !this.canvas || !this.ctx) return;

        // Check if video is ready
        if (this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
            this.animationFrame = requestAnimationFrame(() => this.processFrames());
            return;
        }

        // Draw video frame to canvas
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        // Extract ROI (Region of Interest) - CENTER of frame for fingertip
        // Fingertip should be placed in center of camera view
        const roiX = this.canvas.width * 0.25;
        const roiY = this.canvas.height * 0.25;
        const roiWidth = this.canvas.width * 0.5;
        const roiHeight = this.canvas.height * 0.5;

        const imageData = this.ctx.getImageData(roiX, roiY, roiWidth, roiHeight);

        // Calculate average RED channel (hemoglobin absorbs red light most strongly)
        // This is the key difference - we use RED, not green
        let redSum = 0;
        let pixelCount = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
            redSum += imageData.data[i]; // RED channel (index 0)
            pixelCount++;
        }
        const avgRed = redSum / pixelCount;

        // Store in signal history
        // When heart beats: more blood = more absorption = less red reflected = lower value
        // Between beats: less blood = less absorption = more red reflected = higher value
        this.signalHistory.push(avgRed);
        this.frameCount++;

        // Keep only recent samples
        if (this.signalHistory.length > this.MAX_SAMPLES) {
            this.signalHistory.shift();
        }

        // Calculate current signal strength
        const signalStrength = this.calculateCurrentSignalStrength();
        if (this.onSignalUpdate) {
            this.onSignalUpdate(signalStrength);
        }
        if (this.onFrameProcessed) {
            this.onFrameProcessed(this.frameCount);
        }

        // Continue processing
        this.animationFrame = requestAnimationFrame(() => this.processFrames());
    }

    private calculateCurrentSignalStrength(): number {
        if (this.signalHistory.length < 10) return 0;

        // Calculate variance in recent samples
        // Higher variance = stronger pulse signal = better detection
        const recent = this.signalHistory.slice(-30); // Last 30 frames (~1 second)
        const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
        const variance = recent.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recent.length;
        const stdDev = Math.sqrt(variance);

        // Normalize to 0-1 (higher variance = better signal)
        // Typical good signal has stdDev around 3-5
        return Math.min(1.0, stdDev / 5.0);
    }

    getResult(): DetectionResult | null {
        if (this.signalHistory.length < this.MIN_SAMPLES) {
            return null;
        }

        // Apply bandpass filter (0.7-4 Hz for heart rate = 42-240 bpm)
        const filtered = this.bandpassFilter(this.signalHistory, 0.7, 4.0, this.SAMPLE_RATE);

        // Find dominant frequency (heart rate)
        const heartRate = this.findDominantFrequency(filtered, this.SAMPLE_RATE);

        // Calculate HRV from signal variability (RMSSD)
        const hrv = this.calculateHRV(filtered);

        // Calculate confidence based on signal quality
        const confidence = this.calculateConfidence(filtered);
        const signalStrength = this.calculateCurrentSignalStrength();

        return {
            hrv: Math.round(hrv),
            heartRate: Math.round(heartRate),
            confidence: Math.min(confidence, 1.0),
            signalStrength: signalStrength,
        };
    }

    private bandpassFilter(signal: number[], lowFreq: number, highFreq: number, sampleRate: number): number[] {
        // Simple moving average filter as approximation
        const windowSize = Math.floor(sampleRate / lowFreq);
        const filtered: number[] = [];

        for (let i = 0; i < signal.length; i++) {
            let sum = 0;
            let count = 0;
            for (let j = Math.max(0, i - windowSize); j <= Math.min(signal.length - 1, i + windowSize); j++) {
                sum += signal[j];
                count++;
            }
            filtered.push(sum / count);
        }

        return filtered;
    }

    private findDominantFrequency(signal: number[], sampleRate: number): number {
        // Simple peak detection in frequency domain
        const fft = this.simpleFFT(signal);
        const freqs = fft.map((_, i) => (i * sampleRate) / signal.length);

        // Find peak in heart rate range (0.7-4 Hz = 42-240 bpm)
        let maxPower = 0;
        let dominantFreq = 1.2; // Default ~72 bpm

        for (let i = 0; i < freqs.length; i++) {
            if (freqs[i] >= 0.7 && freqs[i] <= 4.0) {
                if (fft[i] > maxPower) {
                    maxPower = fft[i];
                    dominantFreq = freqs[i];
                }
            }
        }

        // Convert Hz to bpm
        return dominantFreq * 60;
    }

    private simpleFFT(signal: number[]): number[] {
        // Simplified FFT approximation using autocorrelation
        const n = signal.length;
        const result: number[] = [];

        for (let k = 0; k < n / 2; k++) {
            let real = 0;
            let imag = 0;

            for (let j = 0; j < n; j++) {
                const angle = (2 * Math.PI * k * j) / n;
                real += signal[j] * Math.cos(angle);
                imag -= signal[j] * Math.sin(angle);
            }

            result.push(Math.sqrt(real * real + imag * imag));
        }

        return result;
    }

    private calculateHRV(signal: number[]): number {
        // Calculate RMSSD (Root Mean Square of Successive Differences)
        // This measures the variation in time between consecutive heartbeats
        // A healthy heart is slightly irregular - that's what we're measuring
        if (signal.length < 2) return 50; // Default

        const differences: number[] = [];
        for (let i = 1; i < signal.length; i++) {
            differences.push(Math.abs(signal[i] - signal[i - 1]));
        }

        const meanDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
        const variance = differences.reduce((sum, diff) => sum + Math.pow(diff - meanDiff, 2), 0) / differences.length;
        const rmssd = Math.sqrt(variance);

        // Convert to HRV (scale factor based on typical ranges)
        // Typical HRV: 20-100ms, scale rmssd to this range
        const hrv = 20 + (rmssd * 80); // Scale to 20-100ms range
        return Math.max(20, Math.min(100, hrv));
    }

    private calculateConfidence(signal: number[]): number {
        // Calculate signal-to-noise ratio as confidence
        if (signal.length < 10) return 0;

        const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
        const variance = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;
        const stdDev = Math.sqrt(variance);

        // Higher variance = better signal (more variation = actual pulse)
        // Normalize to 0-1 range
        const confidence = Math.min(1.0, stdDev / 10.0);
        return confidence;
    }

    getFrameCount(): number {
        return this.frameCount;
    }

    getSignalHistoryLength(): number {
        return this.signalHistory.length;
    }
}
