# 🇱🇰 Sri Lankan Historical Events Story Q&A Model

A machine learning model that answers questions about Sri Lankan historical events in story format. The system understands question variations and provides narrative answers.

## 📋 Features

- **Question Variation Handling**: Understands the same question asked in different ways
- **Story Format Answers**: Provides engaging narrative responses
- **Semantic Matching**: Uses AI to match similar questions
- **Free Training**: Works with free resources (Google Colab, local CPU)
- **Easy to Extend**: Add more events by updating the CSV file
- **React Web Interface**: Beautiful GUI for asking questions (NEW!)

## 🚀 Quick Start

### Step 1: Installation

```bash
# Clone or download this project
cd model

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Training the Model

**Option 1: Google Colab (Recommended - Free GPU) ⚡**

1. Go to [Google Colab](https://colab.research.google.com/)
2. Create a new notebook
3. Copy the content from `scripts/train_structured_colab.py` into Colab cells
4. Upload `data/sri_lankan_historical_events_structured.csv` to Colab
5. Enable GPU: Runtime → Change runtime type → GPU
6. Run all cells
7. Download the trained model (zip file will be downloaded automatically)
8. Extract the zip file and place it in `models/sri_lankan_history_model_structured/`

**Option 2: Local Training (CPU/GPU)**

```bash
python scripts/train_structured.py
```

The model will be saved to `models/sri_lankan_history_model_structured/`

**Training Time:**
- Google Colab (GPU): ~30-60 minutes
- Local (CPU): ~2-4 hours
- Local (GPU): ~30-60 minutes

### Step 3: Using the Model

**Option A: React Web Interface (Recommended) 🎨**

See [FRONTEND_SETUP.md](FRONTEND_SETUP.md) for detailed instructions.

Quick start:
```bash
# Terminal 1: Start backend
cd backend
pip3 install -r requirements.txt
python3 app.py

# Terminal 2: Start frontend
cd frontend
npm install
npm start
```

Then open http://localhost:3000 in your browser!

**Option B: Command Line Interface**

```bash
python scripts/inference_structured.py
```

Then ask questions like:
- "What is the Anuradhapura Kingdom?"
- "Tell me about Sigiriya"
- "When did Sri Lanka get independence?"
- "Who brought Buddhism to Sri Lanka?"

The system will understand variations of the same question!

## 📁 Project Structure

```
model/
├── data/
│   └── sri_lankan_historical_events_structured.csv  # Structured dataset
├── models/                                # Trained models (created after training)
│   └── sri_lankan_history_model_structured/  # Your trained model goes here
├── backend/
│   ├── app.py                            # Flask API server
│   └── requirements.txt                  # Backend dependencies
├── frontend/
│   ├── src/                              # React source files
│   ├── public/                           # Public assets
│   └── package.json                      # Frontend dependencies
├── scripts/
│   ├── train_structured.py               # Local training script (structured format)
│   ├── train_structured_colab.py         # Google Colab training script (structured format)
│   ├── inference_structured.py            # Inference/query script (structured format)
│   └── test_model.py                     # Test and validation script
├── requirements.txt                      # Python dependencies
├── .gitignore                            # Git ignore file
├── README.md                             # This file
└── FRONTEND_SETUP.md                     # Frontend setup guide
```

## 📊 Dataset Format (Structured)

The CSV file uses a structured format with the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| `name` | Historical event name | "Anuradhapura Kingdom" |
| `description` | Brief description of the event | "First major capital of the Sinhalese people..." |
| `era` | Time period | "377 BC - 1017 AD" |
| `what_happened` | Key events (pipe-separated, point-wise) | "• Founded in 377 BC\|• Served as capital..." |
| `question_variations` | Different ways to ask (pipe-separated) | "What is...?\|Tell me about...\|Explain..." |

**Example entry:**
```csv
name,description,era,what_happened,question_variations
"Anuradhapura Kingdom","First major capital...","377 BC - 1017 AD","• Founded in 377 BC|• Served as capital...","What is the Anuradhapura Kingdom?|Tell me about Anuradhapura Kingdom"
```

**Important:** The system automatically converts this structured data into story-formatted answers during training and inference.

## 🎯 Supported Historical Events

The current dataset includes:
- **Anuradhapura Kingdom** - Ancient capital and civilization
- **Arrival of Buddhism** - How Buddhism came to Sri Lanka
- **Sigiriya Rock Fortress** - The legendary rock palace
- **Portuguese Colonization** - European colonization period
- **Kandyan Kingdom** - Last independent Sinhalese kingdom
- **Sri Lankan Independence** - Gaining freedom in 1948
- **King Dutugemunu** - Great warrior king
- **Dutugemunu-Elara War** - Historic battle for unification

You can add more events by editing `data/sri_lankan_historical_events_structured.csv`!

## 🔧 How It Works

1. **Semantic Matching**: When you ask a question, the system first searches for similar questions in the dataset using AI embeddings
2. **Answer Retrieval**: If a highly similar question is found (>85% similarity), it returns the exact answer from the dataset
3. **Generation**: If no exact match is found, the trained model generates a new story answer
4. **Question Variations**: The system understands that "What is X?", "Tell me about X", and "Explain X" are the same question

## 🧪 Testing

Test the model with various question formats:

```bash
python scripts/test_model.py
```

This will:
- Validate the dataset structure
- Test question variation handling
- Test individual questions
- Check answer consistency

## 💻 System Requirements

### Minimum (Local CPU Training)
- Python 3.8+
- 8GB RAM
- 5GB free storage
- Any modern CPU

### Recommended (Google Colab)
- Google account (free)
- Internet connection
- Free GPU access (12 hours/day)

### Optional (Local GPU Training)
- NVIDIA GPU with CUDA support
- CUDA toolkit installed
- 4GB+ VRAM

## 📝 Adding More Events

To add more Sri Lankan historical events:

1. Open `data/sri_lankan_historical_events_structured.csv`
2. Add new rows with:
   - `name`: Event name
   - `description`: Brief description
   - `era`: Time period
   - `what_happened`: Key events (pipe-separated, use `• ` prefix for points)
   - `question_variations`: Different ways to ask (pipe-separated)
3. Retrain the model using `train_structured.py` or `train_structured_colab.py`

Example:
```csv
name,description,era,what_happened,question_variations
"Polonnaruwa Kingdom","Medieval capital of Sri Lanka","1017 AD - 1236 AD","• Founded after Anuradhapura|• Great irrigation works|• Home to Gal Vihara","What is Polonnaruwa?|Tell me about Polonnaruwa|Explain Polonnaruwa Kingdom"
```

## 🐛 Troubleshooting

### Model not found error
- Make sure you've trained the model first
- Check that the model is in `models/sri_lankan_history_model_structured/`
- The system will use a pre-trained model as fallback, but results may be less accurate

### Out of memory error
- Reduce batch size in training script
- Use Google Colab instead of local training
- Close other applications

### Slow training
- Use Google Colab with GPU (free)
- Reduce number of epochs
- Use smaller model (t5-small instead of t5-base)

### Questions not matching
- Add more question variations to your dataset
- Lower the similarity threshold in `inference_structured.py`
- Retrain the model with more data

## 📚 Example Questions

Try these questions to test the system:

**Anuradhapura Kingdom:**
- "What is the Anuradhapura Kingdom?"
- "Tell me about Anuradhapura Kingdom"
- "Explain Anuradhapura Kingdom"

**Buddhism:**
- "Who brought Buddhism to Sri Lanka?"
- "How did Buddhism come to Sri Lanka?"
- "Tell me about Buddhism coming to Sri Lanka"

**Independence:**
- "When did Sri Lanka get independence?"
- "What happened in Sri Lankan Independence?"
- "How did Sri Lanka gain independence?"

## 🎓 Learning Resources

- [Hugging Face Transformers](https://huggingface.co/docs/transformers/)
- [T5 Model Documentation](https://huggingface.co/docs/transformers/model_doc/t5)
- [Sentence Transformers](https://www.sbert.net/)

## 📝 License

Free to use for educational and personal projects.

## 🤝 Contributing

Feel free to:
- Add more Sri Lankan historical events
- Improve story answers
- Add more question variations
- Report bugs or suggest improvements

## 🙏 Acknowledgments

- Built with Hugging Face Transformers
- Uses T5 model for text generation
- Sentence Transformers for semantic matching
- FAISS for fast similarity search

---

**Made with stronger for Sri Lankan History Education**