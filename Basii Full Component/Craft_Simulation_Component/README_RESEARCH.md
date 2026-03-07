# Component 3: Interactive Cultural Craft Simulation

## 🎨 Overview
The **Interactive Cultural Craft Simulation** is a procedural learning platform that uses gamification to preserve and teach traditional Sri Lankan artistic techniques. Unlike passive video tutorials, this module employs "Learning-by-Doing" through a highly interactive 2D canvas architecture.

## 🚀 Functionality
- **Procedural Crafting Modules**:
    - **Kandyan Painting Restoration**: Restoring traditional mural art with specific pigment and iconographic rules.
    - **Kolam Mask Coloring**: Designing and painting ritual masks used in ancient healing ceremonies.
    - **Ceremonial Pottery Decoration**: Applying 2,500-year-old motifs (Anuradhapura/Polonnaruwa styles) to ceramic vessels.
- **Cultural Guidance Overlays**: Context-aware pop-ups that explain the *meaning* of colors, symbols, and techniques as the user interacts with the simulation.
- **Micro-Feedback Loops**: Visual and auditory feedback (via Howler.js and Framer Motion) that makes the learning process engaging and satisfying.

## 🛠️ Technical Implementation
- **Frontend Framework**: **React 18** for a component-driven, responsive UI.
- **Interactive Engine**: **Konva.js / react-konva**, an HTML5 2D canvas library that enables complex dragging, painting, and layering interactions.
- **State Management**: **Zustand** for lightweight, global application state (tracking progress, selected colors, and tools).
- **Animations & UX**:
    - **Framer Motion**: For smooth transitions between different craft modules and UI elements.
    - **Howler.js**: For immersive audio feedback, simulating the sounds of traditional craftsmanship.
- **Guidance System**: A structured JSON content-delivery system (`CulturalGuidance.jsx`) that maps specific steps to historical descriptions and "Expert Tips."

## 🎯 Use Case
- **Gamified Heritage Education**: Engaging younger generations who may find traditional museum displays uninteresting.
- **Digitization of Intangible Heritage**: Capturing the *process* of creation, not just the final artifact.
- **Skill Simulation**: Providing a "sandbox" for users to experiment with traditional design principles without the need for physical materials.

## ✨ Novelty & Research Value
- **Intangible Heritage Capture**: While most systems focus on *tangible* artifacts, this component focuses on the *intangible*—the skills, techniques, and rituals of creation.
- **Adaptive Pedagogy**: The system guides the user through the cultural significance of their actions in real-time, bridging the gap between artistic expression and cultural education.
