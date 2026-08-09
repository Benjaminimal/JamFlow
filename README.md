# JamFlow

Ever recorded a jam session and spent ages scrubbing through audio to find the one good take? JamFlow is a personal tool I built to solve exactly that. Upload long audio recordings, clip out the parts worth keeping, and have them ready to share or revisit.

## Tech Stack

**Backend**:

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- S3 compatible storage

**Frontend**:

- TypeScript
- React
- howler.js

## Development Setup

### Prerequisites

- uv
- prek
- pnpm
- Docker

### Installation

```bash
git clone https://github.com/Benjaminimal/JamFlow.git
cd JamFlow
# Run setup script and follow its instructions
./scripts/setup-dev.sh
```

**Local services:**

- Frontend application <http://localhost:5173>
- Backend server <http://localhost:8000>
- MinIO interface <http://localhost:9090>
- PostgreSQL localhost:5432

## API Documentation

You can find the API documentation at <http://localhost:8000/docs>
