import { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import ParticleSystem from './components/ParticleSystem';
import HandTracker from './components/HandTracker';

import { ShapeType, ColorOption, HandTrackingState } from './types';

const COLORS: ColorOption[] = [
    { name: 'Dreamwave Aqua', value: '#7FFBF1', glow: '#A3FFF6' },
    { name: 'Lotus Bloom', value: '#FF93C9', glow: '#FFACD7' },
    { name: 'Mint Radiance', value: '#A8FFD0', glow: '#C0FFE0' },
    { name: 'Celestial Pink', value: '#FFB3F1', glow: '#FFC2F5' },
    { name: 'Soft Sunrise', value: '#FFE6A7', glow: '#FFEFBE' },
    { name: 'Blush Pink', value: '#FFB8D1', glow: '#FFB8D1' },
    { name: 'Seafoam', value: '#C8FFE0', glow: '#C8FFE0' },
    { name: 'Baby Blue', value: '#BEE8FF', glow: '#BEE8FF' },
    { name: 'Heavenly Blue', value: '#96D8FF', glow: '#B4E6FF' },
    { name: 'Azure', value: '#70B7FF', glow: '#70B7FF' },
    { name: 'Ocean Blue', value: '#4EC8FF', glow: '#4EC8FF' },
    { name: 'Cyan Flash', value: '#00F6FF', glow: '#00F6FF' },
    { name: 'Aqua', value: '#57FFF7', glow: '#57FFF7' },
    { name: 'Violet', value: '#8E71FF', glow: '#8E71FF' },
    { name: 'Iridescent Violet', value: '#D7A6FF', glow: '#E4C4FF' },
    { name: 'Lilac', value: '#B68BFF', glow: '#B68BFF' },
    { name: 'Tangerine', value: '#FFB66E', glow: '#FFB66E' },
    { name: 'Coral', value: '#FF8A5C', glow: '#FF8A5C' },
    { name: 'Peach', value: '#FFD8C2', glow: '#FFD8C2' },
    { name: 'Golden', value: '#FFD700', glow: '#FFAA00' },
    { name: 'Red', value: '#FF0000', glow: '#FF0000' },
    { name: 'Hot Pink', value: '#FF00FF', glow: '#FF00FF' },
    { name: 'Ghost White', value: '#F4F7FF', glow: '#F4F7FF' },
];

function App() {
    const [shape, setShape] = useState<ShapeType>(ShapeType.Sphere);
    const [color, setColor] = useState<ColorOption>(COLORS[0]);
    const [tension, setTension] = useState(0);
    const [tensionLocked, setTensionLocked] = useState(false); // Caps Lock toggle
    const [explosionTrigger, setExplosionTrigger] = useState(0);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());

    const handleHandUpdate = useCallback((state: HandTrackingState) => {
        // Only update tension if not locked
        if (!tensionLocked) {
            setTension(state.tension);
        }
    }, [tensionLocked]);

    const handleClap = useCallback(() => {
        setExplosionTrigger(prev => prev + 1);
    }, []);

    const handleSnap = useCallback(() => {
        setShape(prev => {
            const shapes = Object.values(ShapeType);
            const currentIndex = shapes.indexOf(prev);
            const nextIndex = (currentIndex + 1) % shapes.length;
            return shapes[nextIndex];
        });
    }, []);

    // Keyboard rotation animation loop
    useEffect(() => {
        let animationId: number;
        const rotationSpeed = 0.08;

        const animate = () => {
            if (keysPressed.size > 0) {
                setRotation(prev => {
                    let newX = prev.x;
                    let newY = prev.y;

                    if (keysPressed.has('ArrowLeft')) newY -= rotationSpeed;
                    if (keysPressed.has('ArrowRight')) newY += rotationSpeed;
                    if (keysPressed.has('ArrowUp')) newX -= rotationSpeed;
                    if (keysPressed.has('ArrowDown')) newX += rotationSpeed;

                    return { x: newX, y: newY };
                });
            }
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [keysPressed]);

    // Keyboard shortcuts
    useEffect(() => {
        let capsLockDebounce = false;

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key;
            const keyLower = key.toLowerCase();

            // Ctrl key to toggle tension lock (with debounce to prevent double-firing)
            if (key === 'Control' && !capsLockDebounce) {
                capsLockDebounce = true;
                setTimeout(() => { capsLockDebounce = false; }, 300);

                setTensionLocked(prev => {
                    const newLocked = !prev;
                    // When locking, set tension to 1 (full contract)
                    if (newLocked) {
                        setTension(1);
                    }
                    console.log('Tension Locked (Ctrl):', newLocked); // Debug log
                    return newLocked;
                });
                return;
            }

            // Arrow keys for rotation
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
                e.preventDefault();
                setKeysPressed(prev => new Set(prev).add(key));
                return;
            }

            // Number keys for shapes
            if (keyLower === '1') {
                setShape(ShapeType.Sphere);
            } else if (keyLower === '2') {
                setShape(ShapeType.Heart3D);
            } else if (keyLower === '3') {
                setShape(ShapeType.Flower);
            } else if (keyLower === '4') {
                setShape(ShapeType.Saturn);
            } else {
                // A-W for colors
                const keyIndex = keyLower.charCodeAt(0) - 97;
                if (keyIndex >= 0 && keyIndex < COLORS.length) {
                    setColor(COLORS[keyIndex]);
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                setKeysPressed(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(e.key);
                    return newSet;
                });
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden selection:bg-none" tabIndex={0}>
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black -z-10" />

            {/* 3D Scene */}
            <Canvas className="w-full h-full">
                <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate={false}
                />

                <ambientLight intensity={0.2} />

                <ParticleSystem
                    shape={shape}
                    color={color}
                    tension={tension}
                    explosionTrigger={explosionTrigger}
                    rotation={rotation}
                />
            </Canvas>

            {/* Components */}
            <HandTracker
                onUpdate={handleHandUpdate}
                onClap={handleClap}
                onSnap={handleSnap}
            />
        </div>
    );
}

export default App;
