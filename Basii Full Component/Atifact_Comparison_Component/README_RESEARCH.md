# Component 2: Artifact Explorer & Comparison Engine

## 🏺 Overview
The **Artifact Explorer & Comparison Engine** is a sophisticated curation tool that enables users to explore Sri Lankan heritage through the lens of semantic similarity and cross-cultural comparison. It moves beyond static galleries by providing an "AI-assisted guide" and a "Comparative Heritage" framework.

## 🚀 Functionality
- **High-Resolution Exploration**: Detailed image viewer with zoom capabilities and interactive hotspots.
- **Explainable AI (XAI) Overlays**: Hotspots provide deep-dives into four categories: **Materials**, **Design**, **Function**, and **Symbolism**.
- **Cross-Cultural Semantic Comparison**: Automatically identifies artifacts from other cultures (e.g., Japanese, Indian) that share functional or aesthetic traits with the selected Sri Lankan artifact.
- **Side-by-Side Analysis**: AI-generated comparison text highlighting similarities and differences in craftsmanship, cultural intent, and historical evolution.

## 🛠️ Technical Implementation
- **Backend Architecture**: Flask-based REST API.
- **Search & Similarity Engine**:
    - **TF-IDF (Term Frequency-Inverse Document Frequency)**: Used to vectorize artifact metadata (materials, historical notes, etc.).
    - **Cosine Similarity**: Algorithm used to rank and retrieve the most "semantically close" artifacts from the global dataset.
- **AI Models**:
    - **Google T5 (Text-to-Text Transfer Transformer)**: Large language model fine-tuned for generating concise, domain-specific artifact explanations.
    - **OpenAI (Fallback)**: Integration for complex comparison narratives when high-level reasoning is required.
- **Data Source**: Integrated Excel-based museum dataset (`Dataset 2`), mapped via a metadata-image dictionary.

## 🎯 Use Case
- **Comparative Cultural Studies**: Visualizing how different civilizations solved similar utilitarian or artistic problems (e.g., comparing weaponry or pottery).
- **Interactive Museum Exhibits**: Empowering visitors to "discover" connections themselves rather than just reading labels.
- **Digital Archival**: Organizing large collections based on semantic meaning rather than just chronological date.

## ✨ Novelty & Research Value
- **The "Glass Box" Solution**: Provides transparency through interactive hotspots (XAI), explaining *why* an artifact is significant rather than just *what* it is.
- **Cross-Cultural Bridging**: The semantic similarity engine highlights Sri Lanka's place in the global heritage landscape by finding parallels in diverse cultures.
