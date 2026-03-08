# Museum Guide - Full Stack Application

A complete full-stack application for managing museum artifacts with English and Sinhala language support.

## 🚀 Project Structure

```
abc/
├── backend/              # Node.js Express API
│   ├── models/
│   │   └── Artifact.js
│   ├── routes/
│   │   └── artifacts.js
│   ├── server.js
│   ├── package.json
│   └── .env
└── frontend/            # React + Vite + Tailwind
    ├── src/
    │   ├── components/
    │   ├── services/
    │   ├── types/
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    └── package.json
```

## 📋 Features

### Backend (Node.js + Express + MongoDB)

- ✅ CRUD operations for artifacts
- ✅ MongoDB integration
- ✅ RESTful API endpoints
- ✅ Bilingual support (English & Sinhala)
- ✅ Error handling and validation
- ✅ CORS enabled

### Frontend (React + Vite + Tailwind CSS + TypeScript)

- ✅ Modern React with TypeScript
- ✅ Responsive UI with Tailwind CSS
- ✅ Create, Read, Update, Delete operations
- ✅ Language toggle (English/Sinhala)
- ✅ Image preview support
- ✅ Form validation

## 🔧 Artifact Schema

Fields with bilingual support:

- `title_en` / `title_si` - Artifact title
- `origin_en` / `origin_si` - Origin location
- `category_en` / `category_si` - Category
- `description_en` / `description_si` - Description
- `material_en` / `material_si` - Material (optional)
- `dimensions_en` / `dimensions_si` - Dimensions (optional)
- `culturalSignificance_en` / `culturalSignificance_si` - Cultural significance (optional)
- `gallery_en` / `gallery_si` - Gallery name (optional)
- `year` - Year of creation
- `imageUrls` - Array of image URLs

## 📦 API Endpoints

### Get All Artifacts

```
GET /api/artifacts
```

Response:

```json
{
  "success": true,
  "data": [...],
  "total": 10
}
```

### Get Single Artifact

```
GET /api/artifacts/:id
```

### Create Artifact

```
POST /api/artifacts
Content-Type: application/json

{
  "title_en": "...",
  "title_si": "...",
  "origin_en": "...",
  "origin_si": "...",
  "year": "2023",
  "category_en": "...",
  "category_si": "...",
  "description_en": "...",
  "description_si": "...",
  "imageUrls": ["https://..."]
}
```

### Update Artifact

```
PUT /api/artifacts/:id
Content-Type: application/json
```

### Delete Artifact

```
DELETE /api/artifacts/:id
```

### Save Session Chat Interaction

```
POST /api/sessions/:session_id/chat
Content-Type: application/json

{
   "question": "Who was King Dutugemunu?",
   "reply": "King Dutugemunu was...",
   "reference_type": "king", // general | king | artifact
   "reference_id": "KIN001", // required for king/artifact
   "language": "en",
   "question_time": "2026-02-26T10:00:00.000Z", // optional
   "reply_time": "2026-02-26T10:00:02.000Z" // optional
}
```

### Get Session Chat History

```
GET /api/sessions/:session_id/chat
GET /api/sessions/:session_id/chat?reference_type=king
GET /api/sessions/:session_id/chat?reference_type=artifact&reference_id=ART001
```

## ⚙️ Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (credentials provided)

### Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. The `.env` file is already configured with:

```
MONGO_URI=mongodb+srv://root:1234@musium.issrtsy.mongodb.net/?appName=musium
DB_NAME=museum_guide
PORT=5000
```

4. Start the backend server:

```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. The `.env` file is configured with:

```
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🎯 Usage

1. **Start Backend:**

   ```bash
   cd backend && npm run dev
   ```

2. **Start Frontend (in another terminal):**

   ```bash
   cd frontend && npm run dev
   ```

3. **Access the application:**

   - Open `http://localhost:3000` in your browser

4. **Features:**
   - Click "Add New Artifact" to create a new artifact
   - Fill in English and Sinhala content
   - Add comma-separated image URLs
   - Toggle language with the language button
   - Edit or delete artifacts from the list

## 📝 Environment Variables

### Backend (.env)

```
MONGO_URI=mongodb+srv://root:1234@musium.issrtsy.mongodb.net/?appName=musium
DB_NAME=museum_guide
PORT=5000
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000/api
```

## 🛠️ Technologies Used

### Backend

- Express.js - Web framework
- Mongoose - MongoDB ODM
- CORS - Cross-origin requests
- dotenv - Environment variables

### Frontend

- React 18 - UI library
- TypeScript - Type safety
- Vite - Build tool
- Tailwind CSS - Styling
- Axios - HTTP client

## 📚 Form Fields

### Required Fields

- Title (English & Sinhala)
- Origin (English & Sinhala)
- Year
- Category (English & Sinhala)
- Description (English & Sinhala)
- Image URLs (at least one)

### Optional Fields

- Material (English & Sinhala)
- Dimensions (English & Sinhala)
- Cultural Significance (English & Sinhala)
- Gallery Name (English & Sinhala)

## 🎨 UI Features

- **Responsive Design:** Works on mobile, tablet, and desktop
- **Language Toggle:** Switch between English and Sinhala
- **Image Preview:** First image displays as card thumbnail
- **Form Validation:** Client-side validation for required fields
- **Loading States:** Visual feedback during operations
- **Error Handling:** Clear error messages for failed operations

## 🚀 Building for Production

### Frontend

```bash
cd frontend
npm run build
```

This creates an optimized build in the `dist` folder.

## 📱 Example Data

You can create artifacts with the following sample data:

```json
{
  "title_en": "Ancient Ceramic Vessel",
  "title_si": "පුරාණ පිඩු භාණ්ඩ",
  "origin_en": "Sri Lanka",
  "origin_si": "ශ්‍රී ලංකා",
  "year": "2000 BC",
  "category_en": "Pottery",
  "category_si": "පිඩු ශිල්පය",
  "description_en": "A well-preserved ceramic vessel from ancient times",
  "description_si": "පුරාණ කාලයේ ආරක්ෂිත පිඩු භාණ්ඩ",
  "material_en": "Clay",
  "material_si": "මඩ",
  "dimensions_en": "25cm x 20cm",
  "dimensions_si": "25cm x 20cm",
  "culturalSignificance_en": "Used in daily life during ancient periods",
  "culturalSignificance_si": "පුරාණ කාලයේ දෛනිक ජීවිතයේ භාවිතා",
  "gallery_en": "Ancient Artifacts",
  "gallery_si": "පුරාණ කෞතුක",
  "imageUrls": ["https://example.com/vessel.jpg"]
}
```

## 🐛 Troubleshooting

### MongoDB Connection Issues

- Verify the MONGO_URI in `.env`
- Check if your MongoDB Atlas cluster is active
- Ensure IP whitelist includes your machine

### CORS Errors

- Backend is running on port 5000
- Frontend is running on port 3000
- CORS is enabled on the backend

### Port Already in Use

- Backend: Change PORT in `.env`
- Frontend: Vite will use next available port

## 📞 Support

For issues or questions, please check:

1. Console errors in browser DevTools
2. Server logs in terminal
3. MongoDB Atlas connection status

---

**Created:** January 2026
**Version:** 1.0.0
