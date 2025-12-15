import { ShapeType } from '../types';

// STANDARD UPPERCASE TYPOGRAPHY - Clean & Bold
const LETTER_STROKES: { [key: string]: number[][] } = {
    'P': Array(20).fill(null).flatMap(() => [
        [0.1, 0, 0.1, 1],         // Left Stem
        [0.1, 1, 0.6, 1],         // Top Bar
        [0.6, 1, 0.6, 0.5],       // Right Vertical
        [0.6, 0.5, 0.1, 0.5],     // Middle Bar
    ]),
    'R': Array(20).fill(null).flatMap(() => [
        [0.1, 0, 0.1, 1],         // Left Stem
        [0.1, 1, 0.6, 1],         // Top Bar
        [0.6, 1, 0.6, 0.5],       // Right Vertical (Loop)
        [0.6, 0.5, 0.1, 0.5],     // Middle Bar
        [0.3, 0.5, 0.65, 0],      // Diagonal Leg
    ]),
    'A': Array(20).fill(null).flatMap(() => [
        [0.1, 0, 0.35, 1],        // Left Diagonal
        [0.35, 1, 0.6, 0],        // Right Diagonal
        [0.22, 0.4, 0.48, 0.4],   // Middle Bar
    ]),
    'S': Array(20).fill(null).flatMap(() => [
        [0.6, 0.85, 0.2, 0.85],   // Top Horizontal
        [0.2, 0.85, 0.1, 0.6],    // Top Left Curve
        [0.1, 0.6, 0.6, 0.4],     // Diagonal Middle
        [0.6, 0.4, 0.6, 0.2],     // Bottom Right Curve
        [0.6, 0.2, 0.15, 0.15],   // Bottom Horizontal
    ]),
    'M': Array(20).fill(null).flatMap(() => [
        [0.1, 0, 0.1, 1],         // Left Stem
        [0.1, 1, 0.35, 0.5],      // Diag Down
        [0.35, 0.5, 0.6, 1],      // Diag Up
        [0.6, 1, 0.6, 0],         // Right Stem
    ]),
    'H': Array(20).fill(null).flatMap(() => [
        [0.1, 0, 0.1, 1],         // Left Stem
        [0.6, 0, 0.6, 1],         // Right Stem
        [0.1, 0.5, 0.6, 0.5],     // Middle Bar
    ]),
};

function generateLetterPoint(letter: string, offsetX: number, offsetY: number, scale: number): { x: number; y: number } {
    const strokes = LETTER_STROKES[letter];
    if (!strokes || strokes.length === 0) {
        return {
            x: offsetX + Math.random() * scale * 0.5,
            y: offsetY + (Math.random() - 0.5) * scale,
        };
    }

    const stroke = strokes[Math.floor(Math.random() * strokes.length)];
    const t = Math.random();
    const px = stroke[0] + (stroke[2] - stroke[0]) * t;
    const py = stroke[1] + (stroke[3] - stroke[1]) * t;

    // Make letters THICK and visible
    const thickness = 0.08;
    const nx = (Math.random() - 0.5) * thickness;
    const ny = (Math.random() - 0.5) * thickness;

    return {
        x: offsetX + (px + nx) * scale,
        y: offsetY + (py + ny - 0.35) * scale,
    };
}

function generateNameWithHearts(index: number, totalCount: number): { x: number; y: number; z: number } {
    const text = 'PRASAMSHA';
    const letterCount = text.length;

    const pHeartL = 0.25;
    const pText = 0.40;
    const pHeartR = 0.25;

    const idxLeftHeart = Math.floor(totalCount * pHeartL);
    const idxText = idxLeftHeart + Math.floor(totalCount * pText);
    const idxRightHeart = idxText + Math.floor(totalCount * pHeartR);

    // UNIFORM SPACING SETUP
    const heartScale = 0.08;
    // Each letter gets a uniform "slot" of space
    const letterSpacing = 0.8;
    const totalTextWidth = letterCount * letterSpacing;
    const letterScale = 0.85;       // Scale of the letter itself within the slot

    const heartWidth = 2.0;
    const gap = 0.6;

    const totalLayoutWidth = heartWidth + gap + totalTextWidth + gap + heartWidth;
    const startX = -totalLayoutWidth / 2;

    const leftHeartCeX = startX + heartWidth / 2;
    const textStartX = startX + heartWidth + gap;
    const rightHeartCeX = startX + heartWidth + gap + totalTextWidth + gap + heartWidth / 2;

    let x = 0, y = 0, z = 0;

    if (index < idxLeftHeart) {
        const isShell = Math.random() < 0.85;
        const t = Math.random() * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

        let scale = heartScale;
        if (!isShell) scale *= Math.pow(Math.random(), 0.5);

        x = leftHeartCeX + hx * scale;
        y = hy * scale;

        const zDepthMax = 2.0;
        const depth = (Math.random() - 0.5) * zDepthMax * scale;
        z = depth * (1.0 - Math.abs(x - leftHeartCeX) / (16 * scale));

    } else if (index < idxText) {
        const localIdx = index - idxLeftHeart;
        const countText = idxText - idxLeftHeart;

        // Even distribution
        const particlesPerLetter = countText / letterCount;
        const charIdx = Math.min(Math.floor(localIdx / particlesPerLetter), letterCount - 1);

        const char = text[charIdx];

        // UNIFORM POSITION: calculated purely by index * uniform spacing
        const letterX = textStartX + (charIdx * letterSpacing) + (letterSpacing * 0.1); // +offset slightly to center in slot

        const point = generateLetterPoint(char, letterX, 0, letterScale);
        x = point.x;
        y = point.y;
        z = (Math.random() - 0.5) * 0.05;

    } else if (index < idxRightHeart) {
        const isShell = Math.random() < 0.85;
        const t = Math.random() * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

        let scale = heartScale;
        if (!isShell) scale *= Math.pow(Math.random(), 0.5);

        x = rightHeartCeX + hx * scale;
        y = hy * scale;

        const zDepthMax = 2.0;
        z = (Math.random() - 0.5) * zDepthMax * scale * (1.0 - Math.abs(x - rightHeartCeX) / (16 * scale));

    } else {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 3.5 + Math.random() * 2.5;

        x = r * Math.sin(phi) * Math.cos(theta);
        y = (r * Math.sin(phi) * Math.sin(theta)) * 0.3;
        z = r * Math.cos(phi) * 0.3;

        // Bias y up a bit
        y += 0.5;
    }

    return { x, y, z };
}

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
                const scale = 2.0;
                const t = Math.random() * Math.PI * 2;
                const R = 1.0 * (1
                    + 0.28 * Math.sin(5 * t + 0.4)
                    + 0.13 * Math.sin(10 * t - 0.8)
                    + 0.07 * Math.sin(15 * t + 1.9));
                const fill = Math.random();
                const rFilled = R * fill * scale;
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

            case ShapeType.Prasamsha: {
                const result = generateNameWithHearts(i, count);
                x = result.x;
                y = result.y;
                z = result.z;
                break;
            }
        }

        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
    }

    return positions;
};
