# HuggingFace Spaces Docker deployment
# Source: https://huggingface.co/docs/hub/spaces-sdks-docker
FROM python:3.11-slim

# Create non-root user (HF Spaces runs as UID 1000)
RUN useradd -m -u 1000 user
USER user

# Environment setup
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1

WORKDIR $HOME/app

# Dependencies first for Docker layer caching
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Application code
COPY --chown=user app.py rag.py indexer.py chainlit.md ./
COPY --chown=user .chainlit ./.chainlit

# Pre-indexed vector store (must be included for RAG)
COPY --chown=user chroma_db ./chroma_db

# Expose HuggingFace Spaces port
EXPOSE 7860

# Production Chainlit command
# -h: headless mode (no browser open)
# --host 0.0.0.0: accept external connections
# --port 7860: HF Spaces default port
CMD ["chainlit", "run", "app.py", "-h", "--host", "0.0.0.0", "--port", "7860"]
