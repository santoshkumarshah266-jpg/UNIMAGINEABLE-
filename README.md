# ZenParticles

A real-time, interactive 3D particle meditation experience using React, Three.js, custom GLSL shaders, GPU-accelerated MediaPipe hand tracking, and glassmorphic UI controls.

## Features

- **Interactive Particles**: Thousands of particles reacting to your hand movements.
- **Hand Tracking**: Uses MediaPipe to detect hand tension (Open = Expand, Closed = Contract).
- **Clap Detection**: Clap your hands to trigger a particle explosion.
- **Custom Shaders**: Beautiful GLSL shaders for particle motion, trails, and glow.
- **Shapes**: Morph between Sphere, Heart, Flower, Saturn, Buddha, and Fireworks.
- **Glassmorphic UI**: Modern controls for shape and color selection.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to the URL shown (usually `http://localhost:5173`).
4. Allow camera access when prompted.

## Tech Stack

- React 18
- Three.js / React Three Fiber
- MediaPipe Tasks Vision
- TailwindCSS
- Vite

## Controls

- **Open Hand**: Particles expand outward (High energy/tension visual).
- **Closed Fist**: Particles contract inward (Calm/Focus).
- **Clap**: Trigger an explosion.
- **UI**: Use the bottom panel to change shapes and colors.
