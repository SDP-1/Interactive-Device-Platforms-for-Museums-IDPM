# 🚀 Backend Installation & Run Commands

Quick reference for installing and running the Flask backend server.

## 📦 Installation

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip3 install -r requirements.txt
```

**Or if pip3 doesn't work:**
```bash
python3 -m pip install -r requirements.txt
```

## ▶️ Run Backend Server

```bash
# Make sure you're in the backend directory
cd backend

# Start the server
python3 app.py
```

**Or:**
```bash
python3 -m flask run --host=127.0.0.1 --port=5000
```

## ✅ Verify It's Running

After starting, you should see:
```
Initializing Sri Lankan History Q&A System...
System ready!
Server starting on http://localhost:5000
```

Test in browser:
- Health check: http://127.0.0.1:5000/api/health
- Example questions: http://127.0.0.1:5000/api/example-questions

## 🛑 Stop Server

Press `Ctrl + C` in the terminal where the server is running.

## 📝 Quick Commands Summary

```bash
# Install dependencies (one time)
cd backend && pip3 install -r requirements.txt

# Run server
cd backend && python3 app.py

# Stop server
Ctrl + C
```

## 🔧 Troubleshooting

**Port already in use?**
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

**Dependencies not installing?**
```bash
# Try with --user flag
pip3 install --user -r requirements.txt
```

**Module not found errors?**
```bash
# Make sure you're in the backend directory
cd backend
python3 app.py
```

---

**The backend will run on:** `http://127.0.0.1:5000`

