import { ShapeType } from '../types';


export const generateGeometry = (type: ShapeType, count: number): Float32Array => {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        let x = 0, y = 0, z = 0;
        const i3 = i * 3;

        switch (type) {
            case ShapeType.Sphere: {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = 2.5;
                x = r * Math.sin(phi) * Math.cos(theta);
                y = r * Math.sin(phi) * Math.sin(theta);
                z = r * Math.cos(phi);
                break;
            }

            case ShapeType.Heart3D: {
                const t = Math.random() * Math.PI * 2;
                const fillFactor = Math.pow(Math.random(), 0.33);
                const scale = 0.12;
                const hx = 16 * Math.pow(Math.sin(t), 3);
                const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
                x = hx * scale * fillFactor;
                y = hy * scale * fillFactor;
                const depthScale = Math.sin(t) * 0.5 + 0.5;
                z = (Math.random() - 0.5) * 2 * scale * fillFactor * depthScale;
                break;
            }

            case ShapeType.Flower: {
                // 🌹 2D Rose curve - multi-harmonic petal waves
                // R(t) = 1.0 * [1 + 0.28*sin(5t+0.4) + 0.13*sin(10t-0.8) + 0.07*sin(15t+1.9)]
                // x(t) = R(t) * cos(t), y(t) = R(t) * sin(t)
                // t ∈ [0, 2π], z = 0 (flat 2D curve)
                const scale = 2.0;

                // Parameter t from 0 to 2π
                const t = Math.random() * Math.PI * 2;

                // Radial function with harmonic petal waves
                const R = 1.0 * (1
                    + 0.28 * Math.sin(5 * t + 0.4)
                    + 0.13 * Math.sin(10 * t - 0.8)
                    + 0.07 * Math.sin(15 * t + 1.9));

                // Fill the rose (not just outline) by scaling R
                const fill = Math.random();
                const rFilled = R * fill * scale;

                // 2D parametric curve: x and y only, z = 0
                x = rFilled * Math.cos(t);
                y = rFilled * Math.sin(t);
                z = 0;

                break;
            }

            case ShapeType.Saturn: {
                const isRing = Math.random() > 0.3;
                if (isRing) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = 3 + Math.random() * 1.5;
                    x = r * Math.cos(angle);
                    z = r * Math.sin(angle);
                    y = (Math.random() - 0.5) * 0.2;
                    const tilt = Math.PI / 6;
                    const yNew = y * Math.cos(tilt) - z * Math.sin(tilt);
                    const zNew = y * Math.sin(tilt) + z * Math.cos(tilt);
                    y = yNew;
                    z = zNew;
                } else {
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const r = 1.5;
                    x = r * Math.sin(phi) * Math.cos(theta);
                    y = r * Math.sin(phi) * Math.sin(theta);
                    z = r * Math.cos(phi);
                }
                break;
            }
        }

        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
    }

    return positions;
};
