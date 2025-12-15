export enum ShapeType {
    Sphere = 'Sphere',
    Heart3D = 'Heart3D',
    Flower = 'Flower',
    Saturn = 'Saturn',
    Prasamsha = 'Prasamsha',
}

export interface ColorOption {
    name: string;
    value: string; // hex or rgb string
    glow: string; // secondary glow color
}

export interface ParticleUniforms {
    uTime: { value: number };
    uColor: { value: THREE.Color };
    uTension: { value: number }; // 0.0 (open) to 1.0 (closed)
    uExplosion: { value: number }; // 0.0 to 1.0
    uShapeFactor: { value: number }; // For morphing if needed, or just specific shape params
}

export interface HandTrackingState {
    isTracking: boolean;
    tension: number; // 0.0 to 1.0 (right hand)
    handX: number; // -1 to 1 (left hand position, left to right)
    handY: number; // -1 to 1 (left hand position, bottom to top)
    hasLeftHand: boolean; // true if left hand detected for rotation
    error: string | null;
}

export interface HandLandmarkerResult {
    landmarks: Array<Array<{ x: number; y: number; z: number }>>;
    worldLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
}
