# Academic Matrix Solver

This is a professional-grade academic scheduling system designed for high-density university faculty requirements. Powered by a custom Constraint Satisfaction Algorithm (CSA), it automates complex timetable generation while honoring academic hard constraints and faculty soft-preferences.

## Deployment & Local Development

**Prerequisites:**
- Node.js (v18+)
- Python (v3.9+)

### 1. Frontend Setup
```bash
# Install React dependencies
npm install

# Start the development server
npm run dev
```

### 2. Backend Setup
```bash
# Navigate to the server directory
cd server

# Install Python requirements
pip install -r requirements.txt

# Launch the Flask API
python app.py
```

## Features
- **Deterministic Solver**: Conflict-free allocation for courses and venues.
- **Asset Manager**: Persistent SQLite-backed CRUD for university resources.
- **Professional Exports**: Direct PDF download for timetables and CSV for bulk data management.
- **Manual Reassignment**: Dynamic grid control with persistence.

---
© 2026 University of Port Harcourt (UNIPORT) - Faculty of Computing.
