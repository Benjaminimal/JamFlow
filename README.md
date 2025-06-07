# JamFlow

A web-based audio recording management tool.

## Description

Ever listened to long audio recordings and wished you could easily find specific parts?
With JamFlow you can easily clip parts of your uploaded audio files, making it easy to locate, share, and chat about the interesting parts.

## Features

- Upload tracks (MP3, WAV, OGG)
- Clip specific sections of a track
- Listen to tracks and clips

## Tech Stack

List the main technologies, frameworks, and tools used. This is what recruiters often scan for first.

**Backend**:

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- S3 compatible storage

## Getting Started

### Prerequisites

- Docker

### Installation & Setup

```bash
git clone https://github.com/Benjaminimal/JamFlow.git
cd JamFlow
cp .env.example .env
# Configure your .env file
docker compose up
```

**Local services:**

- Backend server http://localhost:8000
- MinIO interface http://localhost:9090
- PostgreSQL localhost:5432

## API Documentation

You can find the API documentation at http://localhost:8000/docs

## Project Status

**Complete:**

- Core API operations (track upload, clip creation, playback)
- PostgreSQL + S3 storage integration

**Planned:**

- Authentication & authorization
- Web frontend
- Sharing tracks & clips
- Discussions on clips
- Production deployment
- Test coverage
- Clip comments
