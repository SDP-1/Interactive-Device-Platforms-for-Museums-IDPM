# Enhanced Museum Applications for Smart Devices
**AI-Based Platform for Cultural Engagement and Intelligent Interaction**

This repository contains the full codebase for our research project: a multi-component, AI-driven museum platform designed to transform conventional museum experiences from passive observation into active, immersive, and personalized cultural exploration. Developed with a focus on Sri Lankan cultural heritage.

---

## 🏛️ Project Overview
The widespread adoption of digital technologies for knowledge access has exposed the limitations of static presentation methods in enabling immersive and interactive historical learning. To address this, we introduce a unified ecosystem comprising **four closely integrated components**:

1. **AI-Driven Interactive Exploration Platform (IDPM)** - A kiosk-based system for semantic artifact comparison, localized RAG scenario generation, and tactile craft simulation.
2. **Global Context Explorer (GCE-SL)** - A graph-based reasoning framework (GNN) and spatio-temporal explorer to identify plausible global influences on local historical events.
3. **AI Guide Mobile Application** - A conversational, multilingual (Sinhala, Tamil, English) museum guide powered by Retrieval-Augmented Generation (RAG) and historical persona interactions.
4. **AI-Driven Narration & Artifact Reconstruction System** - Combines intelligent multimodal storytelling with generative AI (Gemini/SDXL) to restore damaged artifacts and convert them into interactive 3D models (Meshy AI).

---

## ✨ Key Features

### 1. Kiosk-Based Interactive Exploration (IDPM)
* **Semantic & Visual Artifact Comparison:** Utilizes weighted TF-IDF matrices, Sentence Transformers, and GPT-4 Vision to mathematically and visually identify historical relationships between artifacts.
* **Zero-Hallucination Dialogue:** A localized RAG pipeline using ChromaDB to generate historically accurate, curator-verified narratives.
* **Procedural Craft Simulation:** A React-Konva-based sandbox allowing visitors to virtually restore royal portraits, color traditional masks (Kolam/Raksha), and decorate clay pottery with historical motifs.

### 2. Spatio-Temporal Global Context Explorer (GCE-SL)
* **Graph Neural Network (GNN) Reasoning:** Implemented via PyTorch Geometric to infer multi-hop, complex relationships between global events and local Sri Lankan history.
* **Interactive Map & Timeline:** Built with Leaflet, enabling users to visualize shifting trade networks, historical harbors, and cultivation regions across time.

### 3. AI Guide Mobile Application
* **Historical Persona Mode:** Engage in multi-turn, multilingual conversations with simulated historical figures (e.g., King Parakramabahu I) powered by GPT-4o-mini and Qdrant vector search.
* **QR-Triggered Digital Twins:** Scan physical artifacts to access deep metadata, audio narrations, and 3D views.

### 4. Artifact Reconstruction & 3D Visualization
* **2D Artifact Inpainting:** Uses Gemini / SDXL to dynamically reconstruct missing pieces of damaged artifacts from uploaded photos.
* **Image-to-3D Conversion:** Generates navigable `.glb` 3D models using Meshy AI for interactive mobile viewing.

---

## 🛠️ System Architecture & Technologies

The platform operates on a decoupled microservices architecture, ensuring low latency and high availability.

### Frontend
* **Kiosk Interface:** React 18, Vite, Zustand (State Management), React-Konva (Canvas), Leaflet.js
* **Mobile Application:** Flutter (Cross-platform iOS/Android)

### Backend & Microservices
* **Orchestration:** Node.js, Express.js
* **AI/ML Core:** Python (FastAPI, Flask)
* **Database & Storage:** MongoDB (CMS), Supabase (Auth/Relational DB/Storage)

### AI & Machine Learning Stack
* **Vector Databases:** ChromaDB, Qdrant, FAISS
* **NLP & LLMs:** GPT-4o-mini, GPT-4 Vision, T5-small (with Dynamic Quantization), Sentence-BERT (all-MiniLM-L6-v2)
* **Graph Reasoning:** PyTorch Geometric (GNN)
* **Generative AI (Reconstruction):** Gemini API, Stable Diffusion XL (SDXL), Meshy AI

---

## 📚 Research & Documentation
For a comprehensive deep dive into our methodology, system testing, and academic findings, please refer to our full research publications:
👉 **[Read the Full Reports & Research Paper](https://ultra-museum.netlify.app/)**

---

## 👥 Contributors
This research was conducted as part of the BSc Honors Degree in Information Technology (Specializing in Software Engineering) at the **Sri Lanka Institute of Information Technology (SLIIT)**.

* **Obeyesekere A. D.** (IT22332080)
* **Devinda P. S.** (IT22334206)
* **Bandara M. R. B. S.** (IT22234148)
* **Ireshan P. U.** (IT22924896)

**Supervisors:**
* Prof. Nuwan Kodagoda (Project Supervisor)
* Mr. Nushkan Nismi (Co-Supervisor)
* Mrs. Sanjeewani Widyaratne, Museum Superintendent (Acting), Colombo National Museum (External Supervisor)

---

## 📜 Acknowledgements
We express our deepest gratitude to the Colombo National Museum for their invaluable industry insights, practical knowledge, and continuous guidance.
