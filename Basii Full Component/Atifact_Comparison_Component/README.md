# Interactive Artifact & Comparison Engine

An interactive museum artifact exploration system with AI-powered explanations and cross-cultural comparisons. This system allows visitors to explore Sri Lankan artifacts with detailed information, interactive hotspots, zoom features, and side-by-side comparisons with artifacts from other cultures.

## Table of Contents

- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [System Architecture](#system-architecture)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up Images (Optional)

If you have artifact images, copy them using:

```bash
python copy_images.py
```

This copies images from the Artifact Pictures folder to `static/images/`.

### 3. Start the Server

```bash
python app.py
```

### 4. Open in Browser

Navigate to: `http://localhost:5000`

## How It Works

### System Flow

```
User Browser
    ↓
Frontend (HTML/CSS/JavaScript)
    ↓
Flask REST API (app.py)
    ↓
    ├──→ Comparison Engine (comparison_engine.py)
    │       └──→ TF-IDF Vectorization
    │       └──→ Cosine Similarity Matching
    │
    ├──→ AI Explainer (ai_explainer.py)
    │       └──→ OpenAI API (if configured)
    │       └──→ Template-based (fallback)
    │
    └──→ Artifact Data (Excel Dataset)
            └──→ Pandas DataFrame
            └──→ JSON API Response
```

### User Journey

1. **Browse Artifacts**
   - User opens the application
   - Frontend requests all artifacts from `/api/artifacts`
   - Artifacts are displayed in a gallery grid
   - User can filter by "All", "Sri Lankan", or "Comparison" artifacts

2. **Explore Artifact Details**
   - User clicks on an artifact card
   - Frontend requests artifact details from `/api/artifacts/<id>`
   - Artifact image, metadata, and information are displayed
   - Hotspots are loaded from `/api/hotspots/<id>` and overlaid on the image
   - AI explanation is fetched from `/api/artifacts/<id>/explain`

3. **Interactive Features**
   - User can click hotspots on the image for detailed information
   - Zoom controls allow closer inspection
   - All interactions happen client-side

4. **Compare Artifacts**
   - User clicks "Compare with Similar Artifacts"
   - Frontend requests similar artifacts from `/api/artifacts/<id>/similar`
   - Comparison Engine uses TF-IDF and cosine similarity to find matches
   - Similar artifacts are displayed with similarity scores

5. **View Comparison**
   - User selects an artifact to compare
   - Frontend sends both artifact IDs to `/api/compare`
   - AI Explainer generates a detailed comparison
   - Side-by-side view shows both artifacts with AI-generated comparison text

### Component Details

#### 1. Frontend (`static/`)

- **index.html**: Main page structure with gallery, detail view, and comparison view
- **app.js**: JavaScript handling all interactions, API calls, and UI updates
- **styles.css**: Modern, responsive styling with gradient backgrounds

**Key Functions:**
- `loadArtifacts()`: Fetches all artifacts on page load
- `showArtifactDetail()`: Displays artifact information and loads hotspots
- `loadHotspots()`: Fetches and displays interactive hotspots
- `showComparison()`: Finds and displays similar artifacts
- `compareArtifacts()`: Generates AI comparison between two artifacts

#### 2. Backend API (`app.py`)

Flask application serving REST API endpoints:

- **Data Loading**: Reads Excel file and converts to JSON
- **Image Mapping**: Loads `artifact_images.json` to map artifacts to images
- **Route Handlers**: Processes requests and returns JSON responses
- **Static File Serving**: Serves HTML, CSS, JS, and images

**Key Routes:**
- `GET /api/artifacts`: Returns all artifacts
- `GET /api/artifacts/<id>`: Returns specific artifact
- `GET /api/artifacts/<id>/similar`: Finds similar artifacts
- `GET /api/artifacts/<id>/explain`: Generates AI explanation
- `GET /api/hotspots/<id>`: Returns hotspot data
- `POST /api/compare`: Compares two artifacts
- `GET /images/<filename>`: Serves artifact images

#### 3. Comparison Engine (`comparison_engine.py`)

Finds similar artifacts using text similarity:

1. **Text Vectorization**: Combines artifact metadata (category, materials, function, symbolism, notes) into text
2. **TF-IDF Vectorization**: Converts text to numerical vectors using Term Frequency-Inverse Document Frequency
3. **Similarity Calculation**: Uses cosine similarity to find artifacts with similar vectors
4. **Result Ranking**: Returns top N similar artifacts sorted by similarity score

**Algorithm:**
```
For each artifact:
  1. Combine metadata fields into single text
  2. Create TF-IDF vector
  3. Calculate cosine similarity with all other artifacts
  4. Rank by similarity score
  5. Return top matches
```

#### 4. AI Explainer (`ai_explainer.py`)

Generates explanations and comparisons:

**Two Modes:**

1. **OpenAI Mode** (if API key configured):
   - Uses GPT-3.5-turbo to generate explanations
   - Provides context-aware, detailed descriptions
   - Removes markdown formatting for clean display

2. **Template Mode** (fallback):
   - Uses artifact metadata to create structured explanations
   - No external API required
   - Still provides useful information

**Process:**
```
For Explanation:
  1. Check if OpenAI API key exists
  2. If yes: Send artifact data to OpenAI with curated prompt
  3. If no: Generate from template using artifact metadata
  4. Remove markdown formatting (#, **)
  5. Return plain text explanation

For Comparison:
  1. Combine both artifacts' data
  2. Generate comparison prompt
  3. Extract similarities and differences
  4. Return structured comparison object
```

#### 5. Hotspot Generator

Creates interactive hotspots on artifact images:

**Logic:**
- Analyzes artifact metadata
- Creates hotspots for: Materials, Design, Function, Symbolism
- Positions hotspots at different coordinates (x, y percentages)
- Each hotspot has title and description

**Hotspot Types:**
- Material hotspots: Show materials used
- Design hotspots: Highlight craftsmanship details
- Function hotspots: Explain usage
- Symbolism hotspots: Describe cultural meaning

### Data Flow Example

**Scenario: User wants to compare Kandyan Sword with Japanese Katana**

1. User clicks "Kandyan Sword" → `GET /api/artifacts/A001`
   - Backend loads from Excel dataset
   - Returns artifact JSON with all metadata

2. User clicks "Compare" → `GET /api/artifacts/A001/similar`
   - Comparison Engine:
     - Loads all artifacts
     - Creates TF-IDF vectors
     - Finds cosine similarity scores
     - Returns top 5 matches (including Japanese Katana - C001)

3. User selects "Japanese Katana" → `POST /api/compare`
   - Request: `{artifact1_id: "A001", artifact2_id: "C001"}`
   - AI Explainer:
     - Combines both artifacts' data
     - Generates comparison (OpenAI or template)
     - Extracts similarities/differences
   - Returns: Comparison object with side-by-side data and AI text

4. Frontend displays:
   - Side-by-side artifact cards
   - AI-generated comparison text
   - Similarity highlights

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Gallery    │  │ Detail View  │  │  Comparison  │ │
│  │   View       │  │  + Hotspots  │  │     View     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP Requests
                        ↓
┌─────────────────────────────────────────────────────────┐
│              Flask REST API (app.py)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Route Handlers                                  │  │
│  │  - /api/artifacts                               │  │
│  │  - /api/artifacts/<id>                          │  │
│  │  - /api/artifacts/<id>/similar                  │  │
│  │  - /api/artifacts/<id>/explain                  │  │
│  │  - /api/compare                                 │  │
│  │  - /api/hotspots/<id>                           │  │
│  └──────────────────────────────────────────────────┘  │
└───┬──────────────────┬──────────────────┬─────────────┘
    │                  │                  │
    ↓                  ↓                  ↓
┌──────────┐    ┌──────────────┐    ┌─────────────┐
│  Excel  │    │  Comparison │    │    AI       │
│ Dataset │    │   Engine    │    │  Explainer  │
└──────────┘    └──────────────┘    └─────────────┘
    │                  │                  │
    │                  │                  │
    ↓                  ↓                  ↓
┌──────────┐    ┌──────────────┐    ┌─────────────┐
│ Pandas   │    │  TF-IDF +    │    │  OpenAI API │
│ DataFrame│    │  Cosine Sim  │    │  (optional) │
└──────────┘    └──────────────┘    └─────────────┘
```

## Features

### 1. Artifact Exploration
- Browse 30 artifacts (15 Sri Lankan + 15 comparison)
- Filter by origin (Sri Lankan / Comparison)
- View detailed information for each artifact
- Display artifact images with zoom controls

### 2. Interactive Hotspots
- Clickable hotspots on artifact images
- Highlight key features (materials, design, function, symbolism)
- Pop-up explanations for each hotspot

### 3. AI-Powered Explanations
- Dynamic explanations for each artifact
- Context-aware descriptions
- Cultural and historical insights
- Works with or without OpenAI API

### 4. Comparison Engine
- Find similar artifacts automatically
- Cross-cultural comparisons
- Side-by-side visual comparison
- AI-generated comparison summaries
- Similarity scoring

### 5. Modern UI
- Responsive design
- Gradient backgrounds
- Smooth transitions
- Error handling with fallbacks

## Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Steps

1. **Clone or download the project**

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up images (optional):**
   ```bash
   python copy_images.py
   ```
   Note: Update the source path in `copy_images.py` if your images are in a different location.

4. **Configure OpenAI (optional):**
   Create a `.env` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
   If not provided, the system uses template-based explanations.

5. **Start the server:**
   ```bash
   python app.py
   ```

6. **Open browser:**
   Navigate to `http://localhost:5000`

## Usage

### For Users

1. **Browse Artifacts**: Use the gallery to view all artifacts. Filter by type using the buttons.

2. **Explore Details**: Click any artifact card to see:
   - High-resolution image with zoom
   - Complete metadata
   - Interactive hotspots
   - AI-generated explanation

3. **Compare Artifacts**: Click "Compare with Similar Artifacts" to:
   - See similar artifacts from other cultures
   - View similarity scores
   - Read AI-generated comparisons

4. **Interactive Features**:
   - Click hotspots for detailed information
   - Use zoom controls to examine details
   - Navigate between views using back buttons

### For Developers

**Adding New Artifacts:**
1. Add rows to the Excel file: `Dataset 2 component 2 - Comparison.xlsx`
2. Restart the Flask server
3. Artifacts will automatically load

**Modifying Comparison Algorithm:**
- Edit `comparison_engine.py`
- Adjust TF-IDF parameters or similarity threshold

**Customizing AI Explanations:**
- Edit prompts in `ai_explainer.py`
- Modify template format for fallback mode

**Adding Images:**
1. Place images in `static/images/`
2. Update `artifact_images.json` with mapping:
   ```json
   {
     "A001": "images/filename.jpg"
   }
   ```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/artifacts` | GET | Get all artifacts |
| `/api/artifacts/<id>` | GET | Get specific artifact |
| `/api/artifacts/<id>/similar` | GET | Get similar artifacts (query: `?limit=5`) |
| `/api/artifacts/<id>/explain` | GET | Get AI explanation |
| `/api/hotspots/<id>` | GET | Get hotspot data |
| `/api/compare` | POST | Compare two artifacts (body: `{artifact1_id, artifact2_id}`) |
| `/images/<filename>` | GET | Serve artifact images |
| `/api/test-images` | GET | Test endpoint to verify images |

## Project Structure

```
Basi-Component2/
├── app.py                      # Main Flask application
├── comparison_engine.py        # Similarity matching algorithm
├── ai_explainer.py             # AI explanation generation
├── copy_images.py              # Script to copy artifact images
├── artifact_images.json         # Image path mappings
├── requirements.txt            # Python dependencies
├── Dataset 2 component 2 - Comparison.xlsx  # Artifact dataset
├── README.md                   # This file
└── static/
    ├── index.html              # Main frontend page
    ├── app.js                  # Frontend JavaScript
    ├── styles.css              # Styling
    └── images/                 # Artifact images
        ├── A001_Sword.jpg
        ├── A002_Geta_Bera.jpg
        └── ...
```

## Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Data Processing**: Pandas
- **Similarity Matching**: scikit-learn (TF-IDF, Cosine Similarity)
- **AI**: OpenAI API (optional) or template-based
- **Data Storage**: Excel file (can be migrated to database)

## Troubleshooting

**Images not showing:**
- Run `python copy_images.py` to copy images
- Check `static/images/` directory exists
- Verify `artifact_images.json` has correct paths
- Check browser console for 404 errors

**API errors:**
- Ensure Flask server is running
- Check port 5000 is not in use
- Verify Excel file exists and is readable

**AI explanations not working:**
- Check `.env` file if using OpenAI
- System falls back to templates if API unavailable
- Check console for error messages

## Future Enhancements

- Database integration (replace Excel)
- User authentication and favorites
- Advanced image processing
- Multi-language support
- Export comparison reports
- Enhanced visualization tools
