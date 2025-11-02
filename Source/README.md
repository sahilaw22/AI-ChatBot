# GCET Assistant — Backend (Node.js + Express + SQLite)

This repository provides a simple backend that plugs into the frontend you provided.
It supports:
- `/api/query` — main chat handler (structured responses for "timetable", "exam", "pdfs")
- `/api/history` GET/DELETE — per-user history
- `/api/profile` POST — save student profile
- `/api/upload` POST — file upload (multipart/form-data)
- `/api/summarise` POST — summarise uploaded PDF (requires pdf-parse; optional OpenAI for improved summaries)
- `/admin/*` endpoints protected by `ADMIN_TOKEN` header/query param

## Quick start (development)
1. Clone or copy files into a folder, then:
```bash
npm install
cp .env.example .env
# edit .env to set ADMIN_TOKEN and optionally OPENAI_API_KEY
npm start
