import * as React from 'react';
import { useEffect, useRef } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { HandTrackingState } from '../types';

interface HandTrackerProps {
    onUpdate: (state: HandTrackingState) => void;
    onClap: () => void;
    onSnap: () => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onUpdate, onClap, onSnap }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Fix stale closure: Keep track of the latest callbacks
    const onUpdateRef = useRef(onUpdate);
    const onSnapRef = useRef(onSnap);

    useEffect(() => {
        onUpdateRef.current = onUpdate;
        onSnapRef.current = onSnap;
    }, [onUpdate, onSnap]);

    const landmarkerRef = useRef<HandLandmarker | null>(null);
    const requestRef = useRef<number>();
    const previousTensionRef = useRef<number>(0);
    const lastVideoTimeRef = useRef<number>(-1);
    const snapCooldownRef = useRef<number>(0);

    useEffect(() => {
        const initLandmarker = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );

                landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 1 // Only need 1 hand for tension control
                });

                startCamera();
            } catch (err) {
                console.error("Failed to load hand tracking model:", err);
            }
        };

        initLandmarker();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(t => t.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.addEventListener("loadeddata", predictWebcam);
            }
        } catch (err) {
            console.error("Camera permission denied or not available:", err);
        }
    };

    const calculateTension = (landmarks: any[]) => {
        // ... (existing code)
        // Wrist is 0. Tips are 4, 8, 12, 16, 20.
        // Palm base scale: Distance between 0 and 9 (Middle finger MCP)
        const wrist = landmarks[0];
        const middleMCP = landmarks[9];
        const palmSize = Math.sqrt(
            Math.pow(wrist.x - middleMCP.x, 2) +
            Math.pow(wrist.y - middleMCP.y, 2) +
            Math.pow(wrist.z - middleMCP.z, 2)
        );

        let totalTipDist = 0;
        const tips = [4, 8, 12, 16, 20];
        tips.forEach(idx => {
            const tip = landmarks[idx];
            const dist = Math.sqrt(
                Math.pow(wrist.x - tip.x, 2) +
                Math.pow(wrist.y - tip.y, 2) +
                Math.pow(wrist.z - tip.z, 2)
            );
            totalTipDist += dist;
        });

        const avgTipDist = totalTipDist / 5;
        const ratio = avgTipDist / palmSize;

        // Adjusted calibration based on actual hand measurements
        const openRatio = 1.8;
        const closedRatio = 0.8;
        let tension = (openRatio - ratio) / (openRatio - closedRatio);
        return Math.max(0, Math.min(1, tension));
    };

    const predictWebcam = () => {
        requestRef.current = requestAnimationFrame(predictWebcam);

        if (!landmarkerRef.current || !videoRef.current) return;

        const startTimeMs = performance.now();
        if (lastVideoTimeRef.current !== videoRef.current.currentTime) {
            lastVideoTimeRef.current = videoRef.current.currentTime;

            const result = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

            if (result.landmarks && result.landmarks.length > 0) {
                // Use the first detected hand for tension control
                const primaryHand = result.landmarks[0];
                const primaryTension = calculateTension(primaryHand);

                // --- SNAP / PINCH DETECTION (Thumb + Middle Finger) ---
                // Thumb Tip = 4, Middle Finger Tip = 12
                const thumbTip = primaryHand[4];
                const middleTip = primaryHand[12];

                const pinchDist = Math.sqrt(
                    Math.pow(thumbTip.x - middleTip.x, 2) +
                    Math.pow(thumbTip.y - middleTip.y, 2) +
                    Math.pow(thumbTip.z - middleTip.z, 2)
                );

                // Threshold for pinch (based on normalized coordinates)
                const PINCH_THRESHOLD = 0.05;
                const now = performance.now();

                if (pinchDist < PINCH_THRESHOLD && now > snapCooldownRef.current) {
                    onSnapRef.current(); // Trigger shape change
                    snapCooldownRef.current = now + 1500; // 1.5s cooldown
                }

                // Clap Detection
                if (previousTensionRef.current < 0.35 && primaryTension > 0.8) {
                    onClap();
                }
                previousTensionRef.current = primaryTension;

                onUpdateRef.current({
                    isTracking: true,
                    tension: primaryTension,
                    handX: 0,
                    handY: 0,
                    hasLeftHand: false,
                    error: null
                });
            } else {
                onUpdateRef.current({
                    isTracking: false,
                    tension: 0,
                    handX: 0,
                    handY: 0,
                    hasLeftHand: false,
                    error: null
                });
            }
        }
    };

    // Hidden video element - hand tracking works in background
    // Using a clipping container to hide the video while keeping frames rendering
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '1px',
                height: '1px',
                overflow: 'hidden',
                opacity: 0.01, // Nearly invisible but still renders
                pointerEvents: 'none',
                zIndex: -9999,
            }}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                    width: '640px',
                    height: '480px',
                }}
            />
        </div>
    );
};

export default HandTracker;
