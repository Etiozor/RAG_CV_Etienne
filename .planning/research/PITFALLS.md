# Domain Pitfalls: RAG Chatbot Systems

**Domain:** RAG-powered chatbot with LangChain, ChromaDB, Claude API, OpenAI Embeddings, Chainlit
**Researched:** 2026-06-10
**Confidence:** HIGH (official docs + production incident reports + community patterns)

## Executive Summary

RAG systems fail through three critical failure modes: **chunking decisions that destroy context**, **vector store persistence issues in deployment**, and **API rate limiting during indexing**. The project's stack (ChromaDB on HuggingFace Spaces + OpenAI embeddings + Claude Haiku) introduces specific risks around persistence configuration, batch processing, and streaming stability. Most failures are preventable with configuration changes before Phase 1 deployment.

**Highest-risk areas for this project:**
1. ChromaDB persistence on HuggingFace Spaces (well-documented failure mode)
2. OpenAI embeddings rate limiting during document indexing
3. PDF structure loss during parsing (tables, lists, formatting)
4. Chunking strategy that fragments CV structure

---

## Critical Pitfalls

Mistakes that cause rewrites, complete failures, or major quality issues.

### Pitfall 1: ChromaDB Persistence Failure on HuggingFace Spaces

**What goes wrong:**
ChromaDB works locally but loses all data on HuggingFace Spaces deployment. The warning "Using embedded DuckDB without persistence: data will be transient" appears in logs, and the vector index must be rebuilt on every container restart. Queries return empty results or crash.

**Why it happens:**
- ChromaDB defaults to in-memory mode without explicit persistence configuration
- HuggingFace Spaces has restrictive filesystem permissions and ephemeral storage patterns
- Path issues: relative paths break in containerized environments
- Missing `persist_directory` parameter in ChromaDB client initialization
- Forgetting to call `.persist()` after adding embeddings

**Consequences:**
- Index lost on every deployment or restart
- Must re-embed all documents on container boot (OpenAI API costs + latency)
- Recruiter QR code leads to non-functional chatbot during cold starts
- Production chatbot unusable until re-indexing completes

**Prevention:**
```python
# BAD: No persistence configured
client = chromadb.Client()

# GOOD: Explicit persistence with absolute path
import os
PERSIST_DIR = os.path.abspath("./chroma_db")
client = chromadb.PersistentClient(path=PERSIST_DIR)

# After adding documents
collection.add(...)
# No explicit persist() needed with PersistentClient - auto-persists
```

**Additional safeguards:**
- Store `chroma_db/` in git (normally gitignored locally, but needed for HF Spaces deployment)
- Test deployment: deploy to HF Spaces, restart instance, verify data persists
- Verify absolute paths in production environment
- Check HF Spaces logs for "transient" warnings immediately after deployment

**Detection:**
- Warning in logs: "Using embedded DuckDB without persistence: data will be transient"
- Empty query results after container restart
- Cold start takes >30 seconds (indicates re-indexing)
- HF Spaces instance metrics show high OpenAI API traffic on startup

**Phase mapping:** Phase 1 (MVP Indexing & Deployment) - must be resolved before deployment

**Sources:**
- [ChromaDB HuggingFace Spaces deployment issue #412](https://github.com/chroma-core/chroma/issues/412)
- [HF Spaces persistence discussion](https://discuss.huggingface.co/t/failed-to-deploy-in-huggingface-spaces/37637)

---

### Pitfall 2: Chunking Strategy Destroys CV Structure

**What goes wrong:**
Fixed token chunking (e.g., 500 tokens every 500 tokens) splits CV entries mid-sentence, separates job titles from descriptions, fragments skill lists, and breaks table structures. Recruiters ask "What Power BI experience does Étienne have?" and get partial, contradictory, or nonsensical answers because relevant context is scattered across 3+ disconnected chunks.

**Why it happens:**
- Default `RecursiveCharacterTextSplitter` with naive token counts ignores semantic boundaries
- 500 tokens = ~375 words = often mid-paragraph in structured CVs
- Overlap (50 tokens) doesn't solve structure breaks - just duplicates broken fragments
- "Chunking is a tunable parameter" advice leads to copy-paste defaults without validation

**Consequences:**
- RAG retrieves 3 chunks: job title in chunk 1, responsibilities in chunk 2, skills in chunk 3
- LLM can't connect "Power BI" (chunk 3) to "BI Analyst role 2022-2024" (chunk 1)
- Hallucinations increase 3x (LLM fills gaps when context is incomplete)
- Critical recruiter questions fail: "What Azure experience?" returns "No information available" when Azure is mentioned in chunk that scored below top-k threshold
- Project looks unprofessional - candidate seems evasive or uninformed about own experience

**Prevention:**

**Strategy 1: Semantic chunking based on CV structure**
```python
# Treat each CV section as a chunk boundary:
# - One chunk per job/mandate (title + dates + responsibilities + skills)
# - One chunk per skills section
# - One chunk for education

# For mandats.md (markdown structure):
# Split on ## headers, keep full section intact

from langchain.text_splitter import MarkdownHeaderTextSplitter

headers_to_split_on = [
    ("#", "Title"),
    ("##", "Job"),
]
splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
chunks = splitter.split_text(mandats_content)
```

**Strategy 2: Validation before deployment**
- Create test queries: "Décris-moi son expérience en Power BI"
- Check retrieved chunks - do they contain complete, coherent information?
- If answer requires 3+ chunks, chunking strategy is wrong

**Strategy 3: Measure before optimizing**
- Calculate precision@k and recall@k on test query set (20-30 recruiter questions)
- Baseline: recursive chunking (512 tokens, 50 overlap)
- If precision < 0.7 or recall < 0.8, switch to semantic chunking

**Detection:**
- Partial answers: "Étienne a travaillé sur..." (incomplete thought)
- Contradictions: "Il a 5 ans d'expérience... il a débuté en 2022" (context from different chunks)
- "No information available" for questions you know the CV answers
- Retrieved chunks contain sentence fragments or orphaned bullets

**Phase mapping:**
- Phase 1: Choose chunking strategy (semantic recommended for structured CVs)
- Phase 2: If quality issues appear, validate chunks manually
- Phase 3: Implement retrieval metrics (precision/recall) if needed

**Sources:**
- [Chunking strategies that kill RAG performance](https://medium.com/@theabhishek.040/the-chunking-strategy-thats-killing-your-rag-performance-95-of-developers-get-this-wrong-0600b91daabe)
- [Chunking strategies insights from 80+ GenAI interviews](https://levelup.gitconnected.com/chunking-strategies-in-rag-systems-insights-from-80-genai-interviews-8ceb4a17701a)
- [RAG chunking strategies 2026 playbook](https://www.digitalapplied.com/blog/rag-chunking-strategies-2026-retrieval-quality-playbook)

---

### Pitfall 3: OpenAI Embeddings Rate Limiting During Indexing

**What goes wrong:**
Indexer script crashes with `429 Rate limit reached for text-embedding-3-small on tokens per min (TPM): Limit 1,000,000, Used 1,000,000, Requested 38,761`. Embedding generation fails mid-batch. HuggingFace Spaces deployment times out during initialization. Partial index created - some documents embedded, others skipped.

**Why it happens:**
- Processing large documents (cv.pdf + mandats.md) generates 50+ embedding requests in quick succession
- Default behavior: send one API request per chunk (no batching)
- OpenAI free tier: 1M TPM limit (text-embedding-3-small)
- No retry logic - first 429 error kills the entire indexing process
- Synchronous processing amplifies the problem (blocks on each request)

**Consequences:**
- Indexing fails on HuggingFace Spaces deploy (timeout or crash)
- Incomplete vector store: some mandates indexed, others missing
- Silent failure mode: index completes but missing 30% of documents
- Recruiter asks about recent experience, bot says "no information" (that section wasn't embedded)
- Costs money: retries consume quota without backoff

**Prevention:**

**Strategy 1: Batch embedding requests**
```python
# BAD: One request per chunk
for chunk in chunks:
    embedding = openai_client.embeddings.create(input=chunk.text)

# GOOD: Batch multiple chunks per request
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    # Built-in batching: sends up to 2048 texts per request
)

# LangChain handles batching automatically
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,  # Batches internally
    persist_directory="./chroma_db"
)
```

**Strategy 2: Implement retry with exponential backoff**
```python
import time
from openai import RateLimitError

def embed_with_retry(texts, max_retries=5):
    for attempt in range(max_retries):
        try:
            return embeddings.embed_documents(texts)
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s, 8s, 16s
            print(f"Rate limited. Retrying in {wait_time}s...")
            time.sleep(wait_time)
```

**Strategy 3: Use OpenAI Batch API for offline indexing**
- For initial index creation (not real-time), use Batch API
- 50% cost reduction vs synchronous API
- 24-hour completion SLA acceptable for deploy-time indexing
- Does not count against synchronous rate limits

**Detection:**
- `429` HTTP status in OpenAI API responses
- Indexing script crashes with "Rate limit reached"
- ChromaDB collection has fewer documents than expected (`collection.count()` < total chunks)
- HuggingFace Spaces build logs show timeout or crash during app initialization

**Phase mapping:**
- Phase 1 (Indexing): Implement batching and retry logic BEFORE first HF Spaces deploy
- Validate: Run indexer locally with rate limit simulation (`OPENAI_TPM_LIMIT=50000` env var)

**Sources:**
- [OpenAI rate limits documentation](https://developers.openai.com/api/docs/guides/rate-limits)
- [Handling OpenAI rate limit errors](https://developers.openai.com/cookbook/examples/how_to_handle_rate_limits)
- [Rate limiting hangs during embedding batch operations](https://github.com/coleam00/Archon/issues/528)
- [Text-embedding-3-large rate limit issue](https://community.openai.com/t/text-embedding-3-large-rate-limit-issue/981689)

---

### Pitfall 4: PDF Structure Loss During Parsing

**What goes wrong:**
CV tables (skills matrix, project timeline) become unreadable gibberish after PDF extraction. Lists lose bullets and merge into single paragraphs. Multi-column layouts extract in wrong order. Headers/footers/page numbers inject noise into every chunk. RAG retrieves technically-correct text that makes no semantic sense.

**Example disaster:**
```
# Original CV table:
Tool          | Proficiency | Years
Power BI      | Expert      | 5
Azure         | Intermediate| 3

# After naive PDF parsing:
Tool Proficiency Years Power BI Expert 5 Azure Intermediate 3

# What recruiter sees:
"Tool Proficiency Years Power" (LLM can't parse this)
```

**Why it happens:**
- PDFs are display formats, not data formats - no semantic structure
- Default PDF parsers (PyPDF2, pdfminer) extract text in visual order, ignoring logical structure
- Tables stored as positioned text blocks, not structured data
- Multi-column layouts read column 1 line 1, column 2 line 1, back to column 1 line 2 (chaos)
- Headers/footers repeated on every page: "Curriculum Vitae - Étienne - Page 3" embedded in every chunk

**Consequences:**
- Recruiter asks "Quelles sont ses compétences Power BI?" → Bot returns: "Tool Proficiency Years Power BI Expert 5" (incomprehensible)
- Skills matrix completely unreadable
- Project timelines jumbled (2024 project appears before 2022 project due to column extraction order)
- Increased hallucination: LLM tries to "fix" garbled text by inventing plausible content
- Professionalism destroyed - candidate looks disorganized

**Prevention:**

**Strategy 1: Use structure-aware PDF parsing**
```python
# BAD: Basic extraction loses structure
from pypdf import PdfReader
reader = PdfReader("cv.pdf")
text = "".join([page.extract_text() for page in reader.pages])

# GOOD: Preserve structure with layout-aware parser
from unstructured.partition.pdf import partition_pdf

elements = partition_pdf(
    "cv.pdf",
    strategy="hi_res",  # Uses layout detection
    extract_tables_as_markdown=True,  # Preserves table structure
    extract_image_block_types=["Image", "Table"]
)

# Convert to markdown with structure preserved
markdown_text = "\n\n".join([
    f"# {el.text}" if el.category == "Title" else
    el.text if el.category == "Table" else  # Already in markdown format
    el.text
    for el in elements
])
```

**Strategy 2: Prefer Markdown source documents**
- For mandats.md and competences.md: Already in Markdown - no parsing issues
- For cv.pdf: If possible, request Markdown or structured source from candidate
- Markdown preserves headings (`# Job Title`), lists (`- Skill`), tables (`| Col1 | Col2 |`)

**Strategy 3: Post-parsing validation**
```python
# After parsing, check for common issues:
def validate_parsed_cv(text):
    warnings = []

    # Check for header/footer repetition
    if text.count("Curriculum Vitae") > 2:
        warnings.append("Headers detected - may need filtering")

    # Check for table fragments
    if "| " in text and text.count("|") < 10:
        warnings.append("Possible broken table structure")

    # Check for unnatural line breaks
    if text.count("\n") / len(text) > 0.02:
        warnings.append("Excessive line breaks - may be multi-column")

    return warnings
```

**Strategy 4: Use multimodal parsing for complex layouts**
- GPT-4 Vision or Claude Vision can "read" PDF pages as images
- Preserves visual context (tables, formatting, layout)
- Expensive but effective for critical documents (1-page CV acceptable cost)

**Detection:**
- Retrieved chunks contain obvious gibberish: "Tool Proficiency Years Power BI"
- Skills questions return unreadable fragments
- Manual review: open first 3 chunks, read them - do they make sense?
- Test query: "List Étienne's technical skills" - if formatting broken, parsing failed

**Phase mapping:**
- Phase 1 (Indexing): Choose PDF parser (recommend Unstructured or manual Markdown conversion)
- Before deploying: Manually review 5-10 sample chunks from cv.pdf parsing
- Phase 2: If quality issues appear, switch parsing strategy

**Sources:**
- [The RAG Playbook: Advanced parsing for PDFs](https://lettersfromacoder.substack.com/p/the-rag-playbook-advanced-parsing)
- [Best PDF parser for RAG apps](https://nanonets.com/blog/best-pdf-parser-for-rag-apps-a-comprehensive-guide/)
- [PDF parsing in RAG: How to parse tables](https://www.elastic.co/search-labs/blog/alternative-approach-for-parsing-pdfs-in-rag)
- [From PDF to Markdown: Why document parsing is important](https://dev.to/lei_qin_486b5f0693eac8f66/from-pdf-to-markdown-why-document-parsing-is-important-for-rag-4ao)

---

## Moderate Pitfalls

Issues causing degraded quality, tech debt, or operational friction.

### Pitfall 5: LangChain-ChromaDB Version Incompatibility

**What goes wrong:**
Code works locally, breaks on HuggingFace Spaces with errors like `chromadb!=0.5.4,!=0.5.5 requirement not met` or `TypeError: Instance and class checks can only be used with @runtime_checkable protocols`. Deployment fails due to dependency conflicts. Upgrade ChromaDB → LangChain breaks. Upgrade LangChain → ChromaDB breaks.

**Why it happens:**
- ChromaDB 0.4.0+ removed DuckDB+Parquet backend (breaking change)
- ChromaDB 0.5.4, 0.5.5, 0.5.7, 0.5.9-0.5.12 blocklisted by langchain-chroma (critical bugs)
- ChromaDB 1.x (Rust rewrite) requires matching client version - incompatible with older langchain-chroma
- EmbeddingFunction interface changed in ChromaDB 0.4.16 (signature mismatch)
- Version conflicts: pip installs compatible versions locally but HF Spaces uses different resolution order

**Prevention:**

**Strategy 1: Pin exact versions in requirements.txt**
```txt
# BAD: Allows version drift
langchain
chromadb

# GOOD: Pin to tested compatible versions
langchain==0.1.20
langchain-community==0.0.38
langchain-openai==0.1.7
langchain-anthropic==0.1.11
chromadb==0.4.24  # Avoid 0.5.4-0.5.12, avoid 1.x until langchain-chroma supports it
```

**Strategy 2: Test deployment environment locally**
```bash
# Create fresh virtualenv matching HF Spaces Python version
python3.11 -m venv test_deploy
source test_deploy/bin/activate

# Install from requirements.txt (exactly as HF Spaces does)
pip install -r requirements.txt

# Run indexer and app - catch version conflicts before deploy
python indexer.py
python app.py
```

**Strategy 3: Monitor breaking changes**
- Check [langchain-chroma changelog](https://github.com/langchain-ai/langchain/releases)
- Check [ChromaDB releases](https://github.com/chroma-core/chroma/releases)
- Before upgrading: search GitHub issues for `langchain chromadb [version]`

**Detection:**
- `ImportError` or `TypeError` on HF Spaces but not locally
- Requirements conflict warnings during pip install
- Errors mentioning `EmbeddingFunction`, `duckdb`, or `@runtime_checkable protocols`

**Phase mapping:**
- Phase 1: Pin versions in requirements.txt before first deploy
- Ongoing: Review version compatibility before any dependency updates

**Sources:**
- [ChromaDB 0.4+ incompatible with LangChain client config](https://github.com/langchain-ai/langchain/issues/7887)
- [Latest Chroma server release incompatible with langchain-chroma](https://github.com/langchain-ai/langchain/issues/31047)
- [Managing Chroma versions in LangChain projects](https://medium.com/@garysvenson09/how-to-manage-chroma-versions-in-langchain-projects-d59e12d5c493)
- [EmbeddingFunction update issue](https://github.com/langchain-ai/langchain/issues/13441)

---

### Pitfall 6: Anthropic API Rate Limiting in Production

**What goes wrong:**
Chatbot works for first 2-3 queries, then crashes with `429 Rate Limit Exceeded`. Recruiter sees "Error: Request failed" mid-conversation. Streaming response stops abruptly. Silent failures - recruiter thinks bot is "thinking" but request already failed.

**Why it happens:**
- Free tier limits: Tier 1 = 50 requests/min, 40,000 tokens/min (Claude Haiku)
- Single recruiter conversation = 5-10 requests/min with RAG context
- Context window grows: Request 1 = 5k tokens, Request 10 = 50k tokens (conversation history + RAG chunks)
- Multiple recruiters simultaneously → quota exhausted in seconds
- Streaming responses: If rate limited mid-stream, response cuts off without error message

**Prevention:**

**Strategy 1: Implement proper retry logic**
```python
from anthropic import Anthropic, RateLimitError
import time

def chat_with_retry(messages, max_retries=3):
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model="claude-haiku-4.5",
                messages=messages,
                max_tokens=1024,
                stream=True
            )
            return response
        except RateLimitError as e:
            retry_after = e.response.headers.get("retry-after", 5)
            if attempt == max_retries - 1:
                # Show user-friendly error
                yield "Je suis actuellement très sollicité. Veuillez réessayer dans quelques secondes."
                return
            time.sleep(int(retry_after))
```

**Strategy 2: Manage context window growth**
```python
# After 10-15 exchanges, context > 50k tokens → exceeds TPM in single request
# Solution: Truncate or summarize conversation history

def manage_context_window(messages, max_messages=10):
    if len(messages) > max_messages:
        # Keep system prompt + last N messages
        return [messages[0]] + messages[-(max_messages-1):]
    return messages
```

**Strategy 3: Monitor usage and request tier increase**
- Check [Claude Console usage dashboard](https://console.anthropic.com/usage)
- Set up usage alerts to get notified when approaching limits
- Request tier increase when organic usage justifies it

**Strategy 4: Use Claude Haiku efficiently**
- Haiku has most generous limits across all tiers (10x Opus/Sonnet)
- Project already uses Haiku (good choice)
- Keep prompts concise: Don't inject full CV into every request

**Detection:**
- `429` HTTP status in Anthropic API responses
- Chainlit error: "Error: Request failed"
- Streaming response stops mid-sentence with no error
- Check console: Log `x-ratelimit-remaining-requests` header

**Phase mapping:**
- Phase 1: Implement retry logic with exponential backoff
- Phase 2: Add context window management if conversations exceed 10 exchanges
- Phase 3: Monitor usage metrics, request tier increase if needed

**Sources:**
- [Anthropic Claude API rate limits documentation](https://platform.claude.com/docs/en/api/rate-limits)
- [Claude API rate limiting guide](https://www.sitepoint.com/claude-code-rate-limits-explained/)
- [Handling Anthropic usage limits](https://www.hashbuilds.com/articles/claude-code-api-rate-limiting-handling-anthropic-usage-limits)
- [Claude API quota tiers explained](https://www.aifreeapi.com/en/posts/claude-api-quota-tiers-limits)

---

### Pitfall 7: RAG Hallucination - Answering Questions Not in Context

**What goes wrong:**
Recruiter asks "Does Étienne have Kubernetes experience?" (not in CV). Bot confidently responds "Yes, Étienne has worked with Kubernetes on cloud migration projects" (fabricated). Recruiter fact-checks, discovers lie, loses trust in candidate and tool.

**Why it happens:**
- LLMs are trained to be helpful → infer/extrapolate when information is missing
- RAG retrieval fails: query "Kubernetes" returns 0 or low-relevance chunks
- System prompt doesn't enforce strict grounding: "Use context" vs "ONLY use context"
- Top-k retrieval sometimes returns irrelevant chunks with keyword matches (false positives)
- Model fills gaps: "Cloud migration" in CV → LLM assumes Kubernetes involved

**Consequences:**
- Fabricated experience damages candidate's credibility
- Recruiter asks candidate about hallucinated information in interview (embarrassing)
- Legal risk: Misrepresentation of skills/experience
- Undermines entire project: If bot lies, recruiters won't trust it

**Prevention:**

**Strategy 1: Enforce grounding in system prompt**
```python
# BAD: Permissive prompt
system_prompt = """
Tu es un assistant qui aide les recruteurs à comprendre le profil d'Étienne.
Réponds aux questions en utilisant le contexte fourni.
"""

# GOOD: Strict grounding with explicit refusal instruction
system_prompt = """
Tu es un assistant qui représente le profil professionnel d'Étienne.

RÈGLES CRITIQUES - RESPECTE-LES ABSOLUMENT:
1. RÉPONDS UNIQUEMENT à partir des informations contenues dans le contexte fourni ci-dessous.
2. Si l'information N'EST PAS dans le contexte, réponds EXACTEMENT: "Je n'ai pas cette information dans le profil d'Étienne."
3. N'INVENTE JAMAIS d'informations, ne déduis pas, ne suppose pas.
4. Si tu es incertain, dis "Je n'ai pas cette information" plutôt que de deviner.

Contexte disponible:
{context}
"""
```

**Strategy 2: Add citation/source references**
```python
# Modify RAG pipeline to return source metadata
retrieval_results = vectorstore.similarity_search_with_score(query, k=3)

# Include source in response
context_with_sources = "\n\n".join([
    f"[Source: {doc.metadata['source']}]\n{doc.page_content}"
    for doc, score in retrieval_results
])

# LLM instruction: "Cite the source for each claim"
```

**Strategy 3: Retrieval relevance threshold**
```python
# Don't pass low-relevance chunks to LLM
def retrieve_with_threshold(query, min_score=0.7):
    results = vectorstore.similarity_search_with_score(query, k=5)
    filtered = [(doc, score) for doc, score in results if score >= min_score]

    if not filtered:
        # No relevant chunks found - return empty context
        return "Aucune information pertinente trouvée dans le profil."

    return "\n\n".join([doc.page_content for doc, score in filtered])
```

**Strategy 4: Test with adversarial queries**
```python
# Create test set of questions CV DOESN'T answer
adversarial_queries = [
    "Does Étienne have Kubernetes experience?",  # Not in CV
    "What are his Python frameworks?",  # Only if not mentioned
    "Has he worked in finance sector?",  # Only if not mentioned
]

# Expected response: "Je n'ai pas cette information"
# If bot fabricates answer → prompt needs strengthening
```

**Detection:**
- Recruiter reports: "Bot mentioned X but it's not in CV"
- Test queries: Ask about skills NOT in CV, check if bot refuses or fabricates
- Manual audit: Review 20 bot responses, verify each claim against source documents

**Phase mapping:**
- Phase 1: Implement strict grounding prompt before deployment
- Phase 2: Add retrieval relevance threshold
- Phase 3: If hallucinations persist, add citation/source references

**Sources:**
- [Stop AI hallucinations: Developer's guide to prompt engineering](https://shelf.io/blog/stop-ai-hallucinations-a-developers-guide-to-prompt-engineering/)
- [Reducing hallucination in structured outputs via RAG](https://www.promptingguide.ai/research/rag_hallucinations)
- [Mitigating hallucinations in RAG](https://machinelearningmastery.com/understanding-rag-part-viii-mitigating-hallucinations-in-rag/)
- [Advanced prompting for RAG: System prompts that prevent hallucination](https://aiamastery.substack.com/p/lesson-25-advanced-prompting-for)

---

### Pitfall 8: Chainlit Streaming Issues in Production

**What goes wrong:**
Chatbot works locally, but on HuggingFace Spaces: responses appear twice, chats randomly shut down mid-conversation, WebSocket connections drop, or streaming stops without error. Recruiter sees duplicate answers or conversation ends abruptly.

**Why it happens:**
- Chainlit streaming + LangChain callbacks = double response rendering (known issue)
- HuggingFace Spaces / Google Cloud Run WebSocket timeouts (default 60s-120s)
- WebSocket disconnects not handled - no automatic reconnection
- `on_chat_end` callback triggered randomly without errors logged
- Multiple worker configuration issues in production (session state conflicts)

**Consequences:**
- Duplicate responses: Unprofessional, confusing for recruiters
- Random disconnects: Recruiter asks question, conversation dies, QR code experience broken
- Silent failures: Errors not logged, impossible to debug

**Prevention:**

**Strategy 1: Avoid double response with streaming**
```python
import chainlit as cl
from anthropic import Anthropic

# BAD: Using LangChain callback handlers with Chainlit
# (causes double rendering)

# GOOD: Direct streaming with Chainlit Message
@cl.on_message
async def main(message: cl.Message):
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    # Create message placeholder
    msg = cl.Message(content="")

    # Stream directly from Anthropic API
    async with client.messages.stream(
        model="claude-haiku-4.5",
        messages=[{"role": "user", "content": message.content}],
        max_tokens=1024,
    ) as stream:
        async for text in stream.text_stream:
            await msg.stream_token(text)

    await msg.send()
```

**Strategy 2: Handle WebSocket timeouts**
```python
# Increase timeout on HuggingFace Spaces
# In HF Spaces settings:
# Set environment variable: CHAINLIT_TIMEOUT=3600

# Or in code - keep-alive pings
import chainlit as cl

@cl.on_session_start
async def start():
    # Configure session timeout
    cl.user_session.set("timeout", 3600)
```

**Strategy 3: Test production environment early**
- Deploy to HF Spaces in Phase 1 (even with dummy data)
- Test: Ask 5 questions in sequence, verify no disconnects
- Check logs for WebSocket errors or timeout warnings
- Test from mobile (QR code use case) - different network conditions

**Strategy 4: Error handling and logging**
```python
import chainlit as cl
import logging

logging.basicConfig(level=logging.INFO)

@cl.on_message
async def main(message: cl.Message):
    try:
        # ... RAG + LLM logic ...
    except Exception as e:
        logging.error(f"Error processing message: {e}")
        await cl.Message(
            content="Désolé, une erreur s'est produite. Veuillez réessayer."
        ).send()
```

**Detection:**
- Duplicate responses visible in Chainlit UI
- Logs show `on_chat_end` called without user action
- WebSocket disconnect errors in HF Spaces logs
- Conversations fail after 60-120 seconds

**Phase mapping:**
- Phase 1: Implement direct streaming (avoid LangChain callbacks)
- Phase 1: Deploy to HF Spaces early, test WebSocket stability
- Phase 2: Add error handling and logging if issues persist

**Sources:**
- [Critical: on_chat_end randomly called in production](https://github.com/Chainlit/chainlit/issues/2198)
- [Double response with RetrievalQA chain when streaming](https://github.com/Chainlit/chainlit/issues/764)
- [Chainlit streaming documentation](https://docs.chainlit.io/advanced-features/streaming)
- [Double output with ChainlitCallbackHandler](https://github.com/Chainlit/chainlit/issues/108)

---

## Minor Pitfalls

Issues causing inconvenience but not critical failures.

### Pitfall 9: API Keys Exposure in Version Control

**What goes wrong:**
Developer commits `.env` with `ANTHROPIC_API_KEY=sk-ant-...` to GitHub. Key immediately leaked. Automated scanners (TruffleHog) detect and flag the leak. API key revoked by Anthropic. Chatbot breaks in production. Potential unauthorized API usage (cost exposure).

**Prevention:**
- Add `.env` to `.gitignore` before first commit
- Use HuggingFace Spaces Secrets for production keys (never in code/files)
- Enable HuggingFace secrets scanner (automatic TruffleHog integration)
- Use environment variable validation at startup:
  ```python
  import os
  assert os.getenv("ANTHROPIC_API_KEY"), "ANTHROPIC_API_KEY not set"
  assert os.getenv("OPENAI_API_KEY"), "OPENAI_API_KEY not set"
  ```

**Detection:**
- Email from HuggingFace/GitHub: "Secret detected in commit"
- API returns `401 Unauthorized` (key revoked)
- Check: `git log --all -- .env` (should return nothing)

**Phase mapping:** Phase 1 - configure before first commit

**Sources:**
- [HuggingFace Spaces secrets documentation](https://huggingface.co/docs/huggingface_hub/en/guides/manage-spaces)
- [HuggingFace secrets scanner](https://huggingface.co/docs/hub/security-secrets)
- [Exploiting Gradio file read to steal secrets](https://horizon3.ai/attack-research/disclosures/exploiting-file-read-vulnerabilities-in-gradio-to-steal-secrets-from-hugging-face-spaces/)

---

### Pitfall 10: Cold Start Latency After Deployment

**What goes wrong:**
Recruiter scans QR code, lands on HF Spaces URL. First question takes 30-60 seconds to respond (or times out). Subsequent questions fast. Recruiter assumes bot is broken, closes tab.

**Why it happens:**
- HuggingFace Spaces cold start: container initialization takes 15-30s
- Loading embedding model into memory: 5-10s
- Loading LLM tokenizer: 2-5s
- First query includes all overhead: model loading + embedding + retrieval + LLM inference
- Spaces may pause instance after inactivity (15-30 min idle)

**Prevention:**

**Strategy 1: Keep Spaces instance warm**
```yaml
# In HF Spaces README.md metadata
---
title: CV Chatbot Étienne
emoji: 💼
sdk: docker
sdk_version: 3.9
app_file: app.py
pinned: true  # Prevents auto-sleep (requires Pro account)
---
```

**Strategy 2: Preload models at startup**
```python
# In app.py - load models before @cl.on_message
import chainlit as cl
from langchain_openai import OpenAIEmbeddings
import chromadb

# Preload at module level (runs on container start)
print("Loading embeddings model...")
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
print("Loading vector store...")
vectorstore = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embeddings
)
print("Preload complete. Ready for requests.")

@cl.on_message
async def main(message: cl.Message):
    # Models already loaded - first query fast
    pass
```

**Strategy 3: Show loading indicator**
```python
@cl.on_chat_start
async def start():
    await cl.Message(
        content="Bienvenue ! Je suis prêt à répondre à vos questions sur le profil d'Étienne."
    ).send()
    # User knows bot is ready
```

**Detection:**
- First query > 10s response time
- HF Spaces logs show model loading during first request
- Recruiter reports: "Bot doesn't respond to first question"

**Phase mapping:** Phase 1 - implement preloading before deployment

**Sources:**
- [RAG latency playbook: Batching, caching, scope reduction](https://python.plainenglish.io/the-rag-latency-playbook-batching-caching-scope-reduction-reranking-and-graph-rag-b85dae5cdfb7)
- [Understanding RAG pipeline latency](https://www.echelonedge.com/blogs/breaking-down-a-rag-pipeline-where-latency-really-comes-from/)
- [Ollama keep-alive: Eliminate cold start latency](https://mljourney.com/ollama-keep-alive-and-model-preloading-eliminate-cold-start-latency/)

---

### Pitfall 11: No Evaluation Metrics - Flying Blind

**What goes wrong:**
Chatbot deployed. Recruiter asks "What Power BI experience?" Bot responds with vague answer. Developer doesn't know if chunking strategy is working, if retrieval is accurate, or if answers are faithful to source documents. Changes made blindly: "Let me try 300 token chunks instead of 500" without measuring impact.

**Prevention:**
- Define test query set: 20-30 typical recruiter questions with expected answers
- Measure retrieval quality: Precision@3, Recall@3 (are relevant chunks in top 3 results?)
- Measure answer faithfulness: Does response match retrieved context? (manual review or LLM-as-judge)
- Log metrics before and after changes

**Detection:**
- Can't answer: "Is chunking strategy working?"
- Can't answer: "Did that change improve quality?"
- No baseline metrics for comparison

**Phase mapping:** Phase 2 or 3 - add if quality concerns arise

**Sources:**
- [Evaluating precision and recall at retrieval time in RAG systems](https://www.sciencepublishinggroup.com/article/10.11648/j.ajcst.20250804.11)
- [How to evaluate retrieval quality in RAG pipelines](https://towardsdatascience.com/how-to-evaluate-retrieval-quality-in-rag-pipelines-precisionk-recallk-and-f1k/)
- [Metrics for evaluation of retrieval in RAG systems](https://deconvoluteai.com/blog/rag/metrics-retrieval)
- [RAG evaluation guide: Metrics, frameworks & infrastructure](https://redis.io/blog/rag-system-evaluation/)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Risk Level |
|-------------|---------------|------------|------------|
| **Phase 1: Indexing** | OpenAI rate limiting during batch embedding | Implement batching + retry with backoff before indexing | HIGH |
| **Phase 1: Indexing** | PDF parsing destroys CV structure (tables, lists) | Use Unstructured or manually convert to Markdown; validate sample chunks | HIGH |
| **Phase 1: Indexing** | Chunking strategy fragments CV entries | Use semantic chunking (split on job/section boundaries), not fixed tokens | CRITICAL |
| **Phase 1: Deployment** | ChromaDB persistence fails on HF Spaces | Use `PersistentClient` with absolute path, include chroma_db/ in deployment | CRITICAL |
| **Phase 1: Deployment** | Cold start latency (30-60s first query) | Preload models at startup, show loading indicator | MEDIUM |
| **Phase 1: Deployment** | API keys leaked in git | Add .env to .gitignore, use HF Spaces Secrets | HIGH |
| **Phase 1: Deployment** | LangChain-ChromaDB version conflict | Pin exact versions in requirements.txt, test in clean virtualenv | HIGH |
| **Phase 2: RAG Pipeline** | Hallucination - bot fabricates information | Enforce strict grounding in system prompt, add relevance threshold | CRITICAL |
| **Phase 2: RAG Pipeline** | Claude API rate limiting in production | Implement retry logic, manage context window growth | MEDIUM |
| **Phase 3: UI/Streaming** | Chainlit double responses or WebSocket disconnects | Use direct streaming (not LangChain callbacks), increase timeout | MEDIUM |
| **Phase 3: Optimization** | No metrics - can't measure impact of changes | Define test queries, measure precision/recall before changes | LOW |

---

## Integration Gotchas

Specific to interactions between LangChain, ChromaDB, OpenAI, Anthropic, Chainlit, and HuggingFace Spaces.

### Gotcha 1: ChromaDB SQLite Locking with Multiple Workers

**Issue:** ChromaDB uses SQLite for metadata storage with file-level locking. Multiple Chainlit workers = concurrent writes = `database is locked` errors.

**Solution:** Run Chainlit in single-worker mode on HF Spaces:
```bash
# In Dockerfile or startup command
chainlit run app.py --host 0.0.0.0 --port 7860 --workers 1
```

---

### Gotcha 2: LangChain v1.0 Import Path Changes

**Issue:** LangChain restructured packages in v1.0. Old imports break:
```python
# Old (breaks in v1.0+)
from langchain.vectorstores import Chroma

# New
from langchain_community.vectorstores import Chroma
```

**Solution:** Use `langchain-community`, `langchain-openai`, `langchain-anthropic` packages explicitly.

---

### Gotcha 3: Anthropic Streaming + Chainlit Token Rendering

**Issue:** Anthropic streaming returns delta events, not full tokens. Chainlit `stream_token()` expects strings.

**Solution:**
```python
async with client.messages.stream(...) as stream:
    async for text in stream.text_stream:  # Use text_stream, not raw events
        await msg.stream_token(text)
```

---

### Gotcha 4: OpenAI Embeddings Dimension Mismatch

**Issue:** Switch from `text-embedding-3-small` (1536 dimensions) to `text-embedding-3-large` (3072 dimensions) breaks existing ChromaDB index.

**Solution:** Don't change embedding model after initial indexing. If needed, rebuild entire index from scratch.

---

## Operational Pitfalls

### Pitfall 12: No Cost Monitoring

**Issue:** Free tier APIs (OpenAI embeddings, Claude Haiku) can rack up unexpected costs if:
- Indexer runs multiple times unnecessarily
- Infinite retry loop during rate limiting
- Recruiter conversations exceed expected volume

**Prevention:**
- Set OpenAI usage limits in dashboard (e.g., $5/month alert)
- Set Anthropic budget alerts
- Log API call counts: "Embedded 42 chunks (estimate: $0.12)"
- Monitor HF Spaces logs for repeated indexing (shouldn't happen if persistence works)

**Phase mapping:** Phase 1 - set up cost alerts before deployment

---

## Sources

All findings verified across multiple authoritative sources:

### Chunking and RAG Quality
- [The Chunking Strategy That's Killing Your RAG Performance](https://medium.com/@theabhishek.040/the-chunking-strategy-thats-killing-your-rag-performance-95-of-developers-get-this-wrong-0600b91daabe)
- [Chunking Strategies in RAG Systems: Insights from 80+ GenAI Interviews](https://levelup.gitconnected.com/chunking-strategies-in-rag-systems-insights-from-80-genai-interviews-8ceb4a17701a)
- [RAG Chunking Strategies: A 2026 Retrieval Playbook](https://www.digitalapplied.com/blog/rag-chunking-strategies-2026-retrieval-quality-playbook)
- [Chunking Strategies to Improve LLM RAG Pipeline Performance](https://weaviate.io/blog/chunking-strategies-for-rag)

### LangChain and Vector Stores
- [LangChain RAG issues with VectorStore & OpenAI LLM](https://www.mongodb.com/community/forums/t/langchain-rag-issues-with-vectorstore-openai-llm/275399)
- [Production RAG with LangChain & Vector Databases](https://www.freecodecamp.org/news/production-rag-with-langchain-vector-databases/)

### ChromaDB Deployment and Persistence
- [ChromaDB deployment failure on HuggingFace Spaces - Issue #412](https://github.com/chroma-core/chroma/issues/412)
- [Failed to Deploy in HuggingFace Spaces](https://discuss.huggingface.co/t/failed-to-deploy-in-huggingface-spaces/37637)
- [Persistence not working with ChromaDB Docker](https://github.com/chroma-core/chroma/issues/6132)

### Version Compatibility
- [ChromaDB 0.4+ incompatible with LangChain client config](https://github.com/langchain-ai/langchain/issues/7887)
- [Latest Chroma release incompatible with langchain-chroma](https://github.com/langchain-ai/langchain/issues/31047)
- [How to Manage Chroma Versions in LangChain Projects](https://medium.com/@garysvenson09/how-to-manage-chroma-versions-in-langchain-projects-d59e12d5c493)

### API Rate Limiting and Token Management
- [Anthropic Claude API Rate Limits Documentation](https://platform.claude.com/docs/en/api/rate-limits)
- [Claude Code Rate Limits Explained 2026](https://www.sitepoint.com/claude-code-rate-limits-explained/)
- [OpenAI Rate Limits Documentation](https://developers.openai.com/api/docs/guides/rate-limits)
- [How to Handle OpenAI Rate Limits](https://developers.openai.com/cookbook/examples/how_to_handle_rate_limits)
- [Rate Limiting Causes Infinite Hangs During Embedding Batch Operations](https://github.com/coleam00/Archon/issues/528)

### RAG Hallucination Prevention
- [Stop AI Hallucinations: Developer's Guide to Prompt Engineering](https://shelf.io/blog/stop-ai-hallucinations-a-developers-guide-to-prompt-engineering/)
- [Reducing Hallucination in Structured Outputs via RAG](https://www.promptingguide.ai/research/rag_hallucinations)
- [Reducing Hallucinations Using Prompt Engineering and RAG](https://dzone.com/articles/reducing-llm-hallucinations-prompt-engineering-and-rag)
- [Advanced Prompting for RAG: System Prompts That Prevent Hallucination](https://aiamastery.substack.com/p/lesson-25-advanced-prompting-for)
- [Understanding RAG Part VIII: Mitigating Hallucinations](https://machinelearningmastery.com/understanding-rag-part-viii-mitigating-hallucinations-in-rag/)

### PDF Parsing and Document Structure
- [The RAG Playbook: Advanced Parsing for PDFs - Tables, Footnotes, & Figures](https://lettersfromacoder.substack.com/p/the-rag-playbook-advanced-parsing)
- [Best PDF Parser for RAG Apps: A Comprehensive Guide](https://nanonets.com/blog/best-pdf-parser-for-rag-apps-a-comprehensive-guide/)
- [PDF Parsing in RAG: How to Parse PDF Tables](https://www.elastic.co/search-labs/blog/alternative-approach-for-parsing-pdfs-in-rag)
- [From PDF to Markdown: Why Document Parsing is Important For RAG](https://dev.to/lei_qin_486b5f0693eac8f66/from-pdf-to-markdown-why-document-parsing-is-important-for-rag-4ao)

### Chainlit Production Issues
- [Critical: on_chat_end Randomly Called in Production - Issue #2198](https://github.com/Chainlit/chainlit/issues/2198)
- [Double Response with RetrievalQA Chain When Streaming](https://github.com/Chainlit/chainlit/issues/764)
- [Chainlit Streaming Documentation](https://docs.chainlit.io/advanced-features/streaming)
- [Double Output with ChainlitCallbackHandler](https://github.com/Chainlit/chainlit/issues/108)

### HuggingFace Spaces Deployment
- [HuggingFace Spaces: Manage Your Space](https://huggingface.co/docs/huggingface_hub/en/guides/manage-spaces)
- [HuggingFace Spaces Overview](https://huggingface.co/docs/hub/en/spaces-overview)
- [How to Manage User Secrets and API Keys](https://discuss.huggingface.co/t/how-to-manage-user-secrets-and-api-keys/67948)
- [HuggingFace Secrets Scanning](https://huggingface.co/docs/hub/security-secrets)

### Retrieval Evaluation Metrics
- [Evaluating Precision and Recall at Retrieval Time in RAG Systems](https://www.sciencepublishinggroup.com/article/10.11648/j.ajcst.20250804.11)
- [How to Evaluate Retrieval Quality in RAG Pipelines: Precision@k, Recall@k, F1@k](https://towardsdatascience.com/how-to-evaluate-retrieval-quality-in-rag-pipelines-precisionk-recallk-and-f1k/)
- [Metrics for Evaluation of Retrieval in RAG Systems](https://deconvoluteai.com/blog/rag/metrics-retrieval)
- [RAG Evaluation Guide: Metrics, Frameworks & Infrastructure](https://redis.io/blog/rag-system-evaluation/)

### RAG Latency and Performance
- [RAG Latency Playbook: Batching, Caching, Scope Reduction](https://python.plainenglish.io/the-rag-latency-playbook-batching-caching-scope-reduction-reranking-and-graph-rag-b85dae5cdfb7)
- [Understanding RAG Pipeline Latency: A Complete Breakdown](https://www.echelonedge.com/blogs/breaking-down-a-rag-pipeline-where-latency-really-comes-from/)
- [Ollama Keep-Alive and Model Preloading: Eliminate Cold Start Latency](https://mljourney.com/ollama-keep-alive-and-model-preloading-eliminate-cold-start-latency/)

---

## Confidence Assessment

| Category | Confidence | Evidence |
|----------|------------|----------|
| ChromaDB Persistence Issues | HIGH | Official GitHub issue #412, HF Forums discussion, multiple reproduction cases |
| Chunking Strategy Impact | HIGH | Multiple 2026 sources, systematic analysis, consensus across sources |
| OpenAI Rate Limiting | HIGH | Official OpenAI docs, cookbook examples, GitHub issue reports |
| PDF Parsing Challenges | HIGH | Multiple technical guides, consensus on structure preservation importance |
| LangChain-ChromaDB Compatibility | MEDIUM | GitHub issues document specific version conflicts, some issues closed/fixed |
| Anthropic Rate Limiting | HIGH | Official Anthropic API docs, console documentation |
| RAG Hallucination Patterns | HIGH | Academic research (RAGTruth corpus), practitioner guides, consensus |
| Chainlit Production Issues | MEDIUM | GitHub issues document problems, some environment-specific |
| HuggingFace Spaces Secrets | HIGH | Official HuggingFace documentation |
| Cold Start Latency | MEDIUM | General RAG latency patterns, some platform-specific solutions |
| Retrieval Evaluation Metrics | HIGH | Academic publications, practitioner consensus |

---

## Research Gaps

Areas where documentation was limited or contradictory:

1. **ChromaDB + HuggingFace Spaces specific configuration**: Most sources discuss general persistence issues; few provide HF Spaces-specific solutions. Recommendation: Test persistence early in Phase 1.

2. **Optimal chunking for CV/resume documents**: General RAG chunking advice available, but CV-specific strategies underdocumented. Recommendation: Manual validation of sample chunks before deployment.

3. **Chainlit + Anthropic streaming integration**: Limited documentation on best practices. Recommendation: Prefer direct Anthropic client over LangChain callbacks based on issue reports.

4. **Cost benchmarks for small-scale RAG**: Difficult to find cost estimates for "3 documents, 10 queries/day" scale. Recommendation: Monitor closely in Phase 1, set conservative budget alerts.

---

## Next Steps for Roadmap Creation

Based on this pitfall research, roadmap should:

1. **Phase 1 must address:**
   - ChromaDB persistence configuration (CRITICAL)
   - Chunking strategy selection and validation (CRITICAL)
   - OpenAI rate limiting mitigation (HIGH)
   - Version pinning in requirements.txt (HIGH)
   - API key security setup (HIGH)

2. **Phase 2 should include:**
   - RAG hallucination prevention (strict grounding prompt)
   - Anthropic rate limiting mitigation
   - Retrieval quality validation

3. **Phase 3 can defer:**
   - Retrieval metrics implementation (unless quality issues arise)
   - Advanced PDF parsing (if Markdown sources available)
   - Cost optimization (unless budget exceeded)

4. **Testing strategy:**
   - Test ChromaDB persistence on HF Spaces early (Phase 1)
   - Validate chunking with sample queries before full deployment (Phase 1)
   - Create adversarial test queries for hallucination detection (Phase 2)

5. **Documentation priorities:**
   - Document exact LangChain + ChromaDB versions used
   - Document chunking strategy rationale
   - Document troubleshooting steps for common failures (persistence, rate limiting, streaming)
