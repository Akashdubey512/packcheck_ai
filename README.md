# Legal Metrology (Packaged Commodities) Compliance Checker

Scans packaged product label images and checks compliance against the Legal
Metrology (Packaged Commodities) Rules, 2011.

## Structure

```
frontend/     React app (Yash)
backend/      Node/Express API + MongoDB (Akash & Ravi)
ai-service/   Python/FastAPI OCR + rule engine (Sandeep & Gyanish)
docs/         api-contract.md (source of truth for all JSON shapes), sample label images
```

See `docs/api-contract.md` before touching any request/response shape between services.
See `docs/PRD.md` for the full product spec and rule set.

## Local setup

Each service runs independently. Start whichever ones you're working on.

### backend/
```bash
cd backend
cp .env.example .env      # fill in real values
npm install
npm run dev                # expects nodemon script in package.json
```

### ai-service/
```bash
cd ai-service
cp .env.example .env
python -m venv venv
source venv/bin/activate   # venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### frontend/
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Working agreements

1. Contract changes go into `docs/api-contract.md` first, announced in chat, then code.
2. Branch per feature (`feature/upload-api`, `feature/ocr-pipeline`), merge often, not one branch per person held till the end.
3. Test against the same shared images in `docs/sample-images/` — don't tune against your own random photos.
4. Each service must run and respond sensibly even if the others are down (no crashes, clear errors).
5. `.env` files are never committed — only `.env.example`.
