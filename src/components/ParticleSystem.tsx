import * as React from 'react';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType, ColorOption } from '../types';
import { generateGeometry } from '../utils/geometryFactory';

interface ParticleSystemProps {
    shape: ShapeType;
    color: ColorOption;
    tension: number;
    explosionTrigger: number;
    rotation: { x: number; y: number };
}

const vertexShader = `
  uniform float uTime;
  uniform float uTension;
  uniform float uExplosion;
  uniform float uMorph;
  uniform vec3 uColor;
  uniform float uHeartbeat;
  
  attribute vec3 startPos;
  attribute vec3 targetPos;
  attribute float aRandom;
  attribute float aScale;
  attribute float aTrailIdx;
  
  varying vec3 vColor;
  varying float vAlpha;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    // Morph between start and target positions
    vec3 basePos = mix(startPos, targetPos, uMorph);
    
    float openAmount = 1.0 - uTension;
    float timeLag = uTime - (aTrailIdx * 0.05);
    
    // Subtle breathing even when closed (always active)
    float breathe = sin(uTime * 1.5 + aRandom * 6.28) * 0.03;
    float shimmer = sin(uTime * 3.0 + aRandom * 12.56) * 0.015;
    
    // More movement when open
    float noiseVal = snoise(basePos * 0.5 + timeLag * 0.2) * openAmount;
    float pulse = sin(timeLag * 2.0) * 0.1 * openAmount;
    float expansion = openAmount * 4.0 + uExplosion * 8.0;

    vec3 dir = normalize(basePos);
    if (length(basePos) < 0.001) dir = vec3(0.0, 1.0, 0.0);

    // Apply subtle movement always + more when open
    vec3 subtleMove = dir * (breathe + shimmer);
    vec3 turbulentPos = basePos + subtleMove + dir * (noiseVal * 0.5);
    vec3 finalPos = turbulentPos + dir * expansion + dir * pulse;
    float trailScale = 1.0 - (aTrailIdx * 0.05 * openAmount);
    finalPos *= trailScale;

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Subtle size pulsing even when closed
    float sizePulse = 1.0 + breathe * 0.5;
    
    // Heartbeat logic
    if (uHeartbeat > 0.5) {
        float beat = sin(uTime * 4.0) * 0.5 + 0.5; // 0 to 1
        beat = pow(beat, 3.0); // Make it snappy
        float heartScale = 1.0 + beat * 0.15;
        
        // Pulse position from center
        vec3 centerDir = normalize(basePos);
        vec3 pulsePos = basePos * heartScale;
        
        // Replace finalPos logic slightly for heartbeat
        finalPos = mix(finalPos, pulsePos + subtleMove, 0.5);
        sizePulse += beat * 0.5;
    }

    float tensionSize = 1.0 + openAmount * 2.0;
    gl_PointSize = (aScale * 40.0 * tensionSize * sizePulse * (1.0 - aTrailIdx * 0.15)) / -mvPosition.z;
    
    vColor = uColor;
    vAlpha = 1.0 - (aTrailIdx * 0.2);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord.xy - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 1.5);
    vec3 finalColor = mix(vColor, vec3(1.0), glow * 0.5);
    gl_FragColor = vec4(finalColor, vAlpha * glow);
  }
`;

const PARTICLE_COUNT = 4000;
const TRAIL_COUNT = 5;
const TOTAL_COUNT = PARTICLE_COUNT * TRAIL_COUNT;

const ParticleSystem: React.FC<ParticleSystemProps> = ({
    shape, color, tension, explosionTrigger, rotation
}) => {
    const pointsRef = useRef<THREE.Points>(null);
    const geometryRef = useRef<THREE.BufferGeometry>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const explosionVal = useRef(0);
    const morphProgress = useRef(1);
    const [currentShape, setCurrentShape] = useState(shape);

    // Store position arrays
    const startPositions = useRef<Float32Array>(new Float32Array(TOTAL_COUNT * 3));
    const targetPositions = useRef<Float32Array>(new Float32Array(TOTAL_COUNT * 3));
    const randoms = useRef<Float32Array>(new Float32Array(TOTAL_COUNT));
    const scales = useRef<Float32Array>(new Float32Array(TOTAL_COUNT));
    const trailIndices = useRef<Float32Array>(new Float32Array(TOTAL_COUNT));

    // Initialize positions
    useEffect(() => {
        const basePositions = generateGeometry(shape, PARTICLE_COUNT);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const x = basePositions[i * 3];
            const y = basePositions[i * 3 + 1];
            const z = basePositions[i * 3 + 2];
            const rnd = Math.random();
            const scale = 0.5 + Math.random() * 0.5;

            for (let t = 0; t < TRAIL_COUNT; t++) {
                const idx = i * TRAIL_COUNT + t;
                startPositions.current[idx * 3] = x;
                startPositions.current[idx * 3 + 1] = y;
                startPositions.current[idx * 3 + 2] = z;
                targetPositions.current[idx * 3] = x;
                targetPositions.current[idx * 3 + 1] = y;
                targetPositions.current[idx * 3 + 2] = z;
                randoms.current[idx] = rnd;
                scales.current[idx] = scale;
                trailIndices.current[idx] = t;
            }
        }
    }, []);

    // Handle shape change - trigger morph
    useEffect(() => {
        if (shape !== currentShape) {
            // Copy current interpolated positions to start
            if (geometryRef.current) {
                const startAttr = geometryRef.current.getAttribute('startPos') as THREE.BufferAttribute;
                const targetAttr = geometryRef.current.getAttribute('targetPos') as THREE.BufferAttribute;

                // Lerp current positions based on morph progress
                for (let i = 0; i < TOTAL_COUNT * 3; i++) {
                    startPositions.current[i] = THREE.MathUtils.lerp(
                        startAttr.array[i] as number,
                        targetAttr.array[i] as number,
                        morphProgress.current
                    );
                }
                startAttr.needsUpdate = true;
            }

            // Generate new target positions
            const newPositions = generateGeometry(shape, PARTICLE_COUNT);
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const x = newPositions[i * 3];
                const y = newPositions[i * 3 + 1];
                const z = newPositions[i * 3 + 2];

                for (let t = 0; t < TRAIL_COUNT; t++) {
                    const idx = i * TRAIL_COUNT + t;
                    targetPositions.current[idx * 3] = x;
                    targetPositions.current[idx * 3 + 1] = y;
                    targetPositions.current[idx * 3 + 2] = z;
                }
            }

            if (geometryRef.current) {
                const targetAttr = geometryRef.current.getAttribute('targetPos') as THREE.BufferAttribute;
                targetAttr.needsUpdate = true;
            }

            // Reset morph progress
            morphProgress.current = 0;
            setCurrentShape(shape);
        }
    }, [shape, currentShape]);

    useEffect(() => {
        if (explosionTrigger > 0) {
            explosionVal.current = 1.0;
        }
    }, [explosionTrigger]);

    // Memoize uniforms to prevent reset on re-render
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color.value) },
        uTension: { value: 0 },
        uExplosion: { value: 0 },
        uMorph: { value: 1 },
        uHeartbeat: { value: 0 },
    }), []);

    useFrame((state) => {
        // Animate morph progress
        if (morphProgress.current < 1) {
            morphProgress.current = Math.min(1, morphProgress.current + 0.025);
        }

        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
            materialRef.current.uniforms.uMorph.value = morphProgress.current;

            // Smoothly interpolate tension
            const currentTension = materialRef.current.uniforms.uTension.value;
            materialRef.current.uniforms.uTension.value = THREE.MathUtils.lerp(currentTension, tension, 0.1);

            if (explosionVal.current > 0) {
                explosionVal.current = THREE.MathUtils.lerp(explosionVal.current, 0, 0.05);
                if (explosionVal.current < 0.01) explosionVal.current = 0;
            }
            materialRef.current.uniforms.uExplosion.value = explosionVal.current;
            materialRef.current.uniforms.uColor.value.set(color.value);

            // Heartbeat effect for Prasamsha shape
            const isHeartShape = shape === ShapeType.Prasamsha;
            materialRef.current.uniforms.uHeartbeat.value = isHeartShape ? 1.0 : 0.0;
        }

        // Apply keyboard rotation
        if (pointsRef.current) {
            pointsRef.current.rotation.x = rotation.x;
            pointsRef.current.rotation.y = rotation.y;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry ref={geometryRef}>
                <bufferAttribute
                    attach="attributes-position"
                    count={TOTAL_COUNT}
                    array={startPositions.current}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-startPos"
                    count={TOTAL_COUNT}
                    array={startPositions.current}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-targetPos"
                    count={TOTAL_COUNT}
                    array={targetPositions.current}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aRandom"
                    count={TOTAL_COUNT}
                    array={randoms.current}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-aScale"
                    count={TOTAL_COUNT}
                    array={scales.current}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-aTrailIdx"
                    count={TOTAL_COUNT}
                    array={trailIndices.current}
                    itemSize={1}
                />
            </bufferGeometry>
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                uniforms={uniforms}
            />
        </points>
    );
};

export default ParticleSystem;
