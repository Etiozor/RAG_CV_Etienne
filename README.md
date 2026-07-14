---
title: CV Chatbot Etienne
emoji: 💼
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
short_description: RAG chatbot for recruiter questions about Etienne's profile
---

# CV Chatbot - Etienne Lepironnec

An AI assistant that answers recruiter questions about Etienne's professional profile using RAG (Retrieval-Augmented Generation).

## Features

- Natural language Q&A about experience, skills, and projects
- French and English support (auto-detects language)
- Source-grounded responses (no hallucination)
- Streaming responses for real-time feedback

## Usage

Simply ask questions like:
- "Peux-tu me faire un portrait des expertises techniques d'Étienne?"
- "Voici une offre d'emploi, dans quelle mesure Étienne y correspond-il?"
- "Quels projets personnels ou mandats professionnels Étienne a-t-il réalisés?"
- "Quels sont les centres d'intérêt et la personnalité d'Étienne?"
- "Qu'est-ce qui motive Étienne dans son métier?"

## Technology Stack

- **LLM:** Claude Haiku 4.5 (Anthropic API)
- **Embeddings:** OpenAI text-embedding-3-small
- **Vector Store:** ChromaDB
- **UI:** Chainlit
- **Deployment:** HuggingFace Spaces (Docker)

## Local Development

### Prerequisites
- Python 3.11+
- OpenAI API key
- Anthropic API key

### Setup

1. Clone the repository:
```bash
git clone https://github.com/<username>/cv-chatbot.git
cd cv-chatbot
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API keys
```

5. Index documents (if needed):
```bash
python indexer.py
```

6. Run the application:
```bash
chainlit run app.py
```

## Deployment

### HuggingFace Spaces

1. Create a new Space at huggingface.co/new-space
2. Select "Docker" as the SDK
3. Clone the Space and copy project files
4. Configure secrets in Space Settings:
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
5. Push to deploy

### Deploy to Railway

Railway builds the same Dockerfile as HuggingFace Spaces and binds the container to the `$PORT` it injects automatically (no port configuration needed by you). `chroma_db/` (pre-indexed, read-only) is shipped inside the image, so **no Railway Volume is required**. `railway.json` pins the Docker builder so Railway does not fall back to auto-detection.

**Required Variables** (set in the Railway project, same keys as HF Spaces):
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`

**Option A — GitHub deploy (dashboard):**
1. In your Railway project: **New/Existing Project → Add service → Deploy from GitHub repo**
2. Select `Etiozor/RAG_CV_Etienne` — Railway auto-detects the Dockerfile
3. Add the two Variables above in the service's **Variables** tab
4. Click **Generate Domain** to get a public URL

**Option B — CLI deploy (from the repo root):**
```bash
railway login
railway link          # link to the already-created Railway project
railway up
railway variables --set ANTHROPIC_API_KEY="your-key" --set OPENAI_API_KEY="your-key"
railway domain        # generate a public URL
```

### Local Docker

```bash
# Build
docker build -t cv-chatbot .

# Run (with API keys)
docker run -p 7860:7860 \
  -e ANTHROPIC_API_KEY="your-key" \
  -e OPENAI_API_KEY="your-key" \
  cv-chatbot
```

## Project Structure

```
cv-chatbot/
├── app.py           # Chainlit application
├── rag.py           # RAG retrieval module
├── indexer.py       # Document indexer
├── chainlit.md      # Welcome screen
├── Dockerfile       # Container configuration
├── requirements.txt # Python dependencies
├── public/          # Custom Chainlit theme (stylesheet, theme switcher, logos, avatar)
├── .chainlit/       # Chainlit config + translations
├── chroma_db/       # Pre-indexed vectors
├── docs/            # Source documents
└── tests/           # Unit tests
```

## License

Private project - All rights reserved.

---

*Built with Chainlit and Claude*
