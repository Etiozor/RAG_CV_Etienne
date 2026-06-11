# Graph Report - Projet CV - RAG  (2026-06-11)

## Corpus Check
- 35 files · ~39,296 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 584 nodes · 616 edges · 49 communities (48 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `78696d4b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]

## God Nodes (most connected - your core abstractions)
1. `Phase 1: Project Setup & Indexing - Research` - 20 edges
2. `Phase 3: Chainlit Application - Research` - 19 edges
3. `Phase 2: RAG Pipeline - Research` - 19 edges
4. `CV Chatbot` - 12 edges
5. `Domain Pitfalls: RAG Chatbot Systems` - 12 edges
6. `Sources` - 12 edges
7. `Optional: better PDF parsing` - 12 edges
8. `load_documents()` - 11 edges
9. `Document` - 10 edges
10. `retrieve()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `build_prompt()` --calls--> `Path`  [INFERRED]
  rag.py → indexer.py
- `_get_vectorstore()` --calls--> `Path`  [INFERRED]
  rag.py → indexer.py
- `main()` --calls--> `Path`  [INFERRED]
  rag.py → indexer.py
- `_ensure_sample_pdf_exists()` --calls--> `Path`  [INFERRED]
  tests/conftest.py → indexer.py
- `sample_md_path()` --calls--> `Path`  [INFERRED]
  tests/conftest.py → indexer.py

## Import Cycles
- None detected.

## Communities (49 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (42): chunk_documents(), create_vectorstore(), load_documents(), load_docx(), load_pdf(), load_xlsx(), main(), Chroma (+34 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (48): Already Installed (from Phase 1), Anti-Patterns to Avoid, Applicable ASVS Categories, Architectural Responsibility Map, Architecture Patterns, Assumptions Log, ChatAnthropic Usage (for Phase 3 reference), Claude's Discretion (+40 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (23): build_prompt(), _get_vectorstore(), main(), Chroma, Document, RAG retrieval and prompt construction module for CV Chatbot.  Provides two core, CLI interface for testing RAG pipeline., Initialize connection to ChromaDB vectorstore.      Returns:         Chroma vect (+15 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (27): Confidence Assessment, Critical Pitfalls, Domain Pitfalls: RAG Chatbot Systems, Executive Summary, Gotcha 1: ChromaDB SQLite Locking with Multiple Workers, Gotcha 2: LangChain v1.0 Import Path Changes, Gotcha 3: Anthropic Streaming + Chainlit Token Rendering, Gotcha 4: OpenAI Embeddings Dimension Mismatch (+19 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (24): Alternatives Considered, Architecture, Constraints, Conventions, Core, Core Technologies, Developer Profile, Development Tools (+16 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (24): Anti-Pattern 1: Embedding at Query Time, Anti-Pattern 2: Giant Chunks, Anti-Pattern 3: No System Prompt Grounding, Anti-Pattern 4: Blocking LLM Calls, Anti-Patterns, Architectural Patterns, Architecture Research, Build Order (Phase Dependencies) (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (21): Ancrage géographique, Apprentissage de l'anglais, Certification, Club So — Organisation d'événements, Compétences techniques, Cuisine & gastronomie, Cyclisme, Infrastructure de données Consignaction (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (15): Canonical References, Chunking Strategy, Claude's Discretion, Deferred Ideas, Established Patterns, Existing Code Insights, Implementation Decisions, Integration Points (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (15): Active, Architecture, Constraints, Context, Core Value, CV Chatbot, Evolution, File Structure (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (14): Chat Interface, Deployment, Enhanced Indexing, Enhanced UX, Indexing, Language Support, Operations, Out of Scope (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (14): Add After Validation (v1.x), Anti-Features (Commonly Requested, Often Problematic), Competitor Feature Analysis, Dependency Notes, Differentiators (Competitive Advantage), Feature Dependencies, Feature Landscape, Feature Prioritization Matrix (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (12): Architectural Responsibility Map, Assumptions Log, Don't Hand-Roll, Environment Availability, Metadata, Open Questions, Package Legitimacy Audit, Phase 1: Project Setup & Indexing - Research (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (12): Alternatives Considered, Core Technologies, Development Tools, Installation, Recommended Stack, requirements.txt, Sources, Stack Patterns by Variant (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (12): Architecture, Confidence Assessment, Critical Pitfalls to Avoid, Executive Summary, Explicitly Excluded, Feature Priorities, Must Have (P1), Next Steps (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (11): Assumptions, Canonical References, Claude's Discretion, Deferred to Phase 3, Implementation Decisions, Locked Decisions, Phase 2: RAG Pipeline - Context, Phase Boundary (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.17
Nodes (11): Execution Order, Must Haves, Notes, Open Questions (RESOLVED), Plan: 03-01 Chainlit Application, Requirements Coverage, Task 1: Setup dependencies and configuration, Task 2: Create app.py with Chainlit chat interface (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (11): Architectural Responsibility Map, Assumptions Log, Don't Hand-Roll, Environment Availability, Metadata, Open Questions (RESOLVED), Package Legitimacy Audit, Phase 3: Chainlit Application - Research (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.17
Nodes (12): API Rate Limiting and Token Management, Chainlit Production Issues, ChromaDB Deployment and Persistence, Chunking and RAG Quality, HuggingFace Spaces Deployment, LangChain and Vector Stores, PDF Parsing and Document Structure, RAG Hallucination Prevention (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (11): _ensure_sample_pdf_exists(), Pytest fixtures for CV Chatbot tests., Create sample.pdf if it doesn't exist using pypdf., Provide a temporary directory for test documents., Return path to the sample PDF fixture (creates it if missing)., Return path to the sample Markdown fixture., Provide a fresh temporary directory for ChromaDB., sample_md_path() (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (10): Area Selection, Chunking Approach, Claude's Discretion, Deferred Ideas, PDF Parsing, Phase 1: Project Setup & Indexing - Discussion Log, Question 1: Chunking Method, Question 1: PDF Structure (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (9): Artifacts Created, Deviations from Plan, Indexed Documents, Key Functions, Next Steps, Plan 01-02 Summary: Document Indexing Pipeline, Test Results, Verification (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.20
Nodes (9): IDX-03 Overlap Reconciliation, Manual-Only Verifications, Per-Task Verification Map, Phase 1 — Validation Strategy, Sampling Rate, Test Infrastructure, Validation Sign-Off, Wave 0 Requirements (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.20
Nodes (9): Milestone: v1.0, Overview, Phase 1: Project Setup & Indexing, Phase 2: RAG Pipeline, Phase 3: Chainlit Application, Phase 4: Deployment, Phase Dependencies, Phase Details (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.20
Nodes (6): Tests for SYSTEM_PROMPT content (RAG-03, RAG-04)., RAG-03: System prompt instructs third-person speech about Etienne., RAG-04: System prompt enforces 'I don't know' for missing information., D-06: System prompt instructs language matching., System prompt contains required placeholders., TestSystemPrompt

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (8): Artifacts this phase produces, Configuration, Data Stores, Files, Functions (indexer.py), STRIDE Threat Register, Test Functions (tests/test_indexer.py), Trust Boundaries

### Community 25 - "Community 25"
Cohesion: 0.25
Nodes (7): Artifacts Created, Deviations from Plan, Next Steps, Plan 01-01 Summary: Project Foundation Setup, User Documents Received, Verification, What Was Built

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (8): Anti-Patterns to Avoid, Architecture Patterns, Pattern 1: Document Loading with LangChain Loaders, Pattern 2: Semantic Chunking with RecursiveCharacterTextSplitter, Pattern 3: ChromaDB Persistent Collection with Safe Creation, Pattern 4: Metadata Schema for RAG Debugging, Recommended Project Structure, System Architecture Diagram

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (7): CLI Verification, Deliverables, Notes, Plan Summary: 02-01 RAG Pipeline, Requirements Covered, Tasks Completed, Test Results

### Community 28 - "Community 28"
Cohesion: 0.25
Nodes (7): Deliverables, Dependencies, Notes, Phase 3 Context: Chainlit Application, Requirements, Success Criteria, Technical Constraints

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (7): Blockers, Completed Phase Details, Next Actions, Phase Progress, Project Reference, Project State: CV Chatbot, Recent Activity

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (6): Artifacts this phase produces, Files, Pytest Fixtures, STRIDE Threat Register, Test Functions, Trust Boundaries

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (6): Artifacts this plan produces, CLI Interface, Files, Functions Exported, STRIDE Threat Register, Trust Boundaries

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (7): Anti-Patterns to Avoid, Architecture Patterns, Pattern 1: Chainlit App Initialization, Pattern 2: Streaming Response with RAG, Pattern 3: Starter Questions, Recommended Project Structure, System Architecture Diagram

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (6): Common Pitfalls, Pitfall 1: Chunk Size Mismatch Between Characters and Tokens, Pitfall 2: Chunk Overlap Too Small or Missing, Pitfall 3: ChromaDB Collection Not Persisting After Script Exit, Pitfall 4: OpenAI API Rate Limits on Bulk Embedding, Pitfall 5: Forgetting to Gitignore .env and ChromaDB

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (6): Common Pitfalls, Pitfall 1: Missing ANTHROPIC_API_KEY, Pitfall 2: Streaming Not Working, Pitfall 3: Wrong Prompt Structure, Pitfall 4: HuggingFace Spaces Port Mismatch, Pitfall 5: Session State Lost Between Messages

### Community 35 - "Community 35"
Cohesion: 0.40
Nodes (5): Phase Requirements → Test Map, Sampling Rate, Test Framework, Validation Architecture, Wave 0 Gaps

### Community 36 - "Community 36"
Cohesion: 0.40
Nodes (5): Alternatives Considered, Claude Model Selection, Core, Standard Stack, Supporting (already in requirements.txt)

### Community 37 - "Community 37"
Cohesion: 0.40
Nodes (5): Phase Requirements -> Test Map, Sampling Rate, Test Framework, Validation Architecture, Wave 0 Gaps

### Community 38 - "Community 38"
Cohesion: 0.50
Nodes (4): Alternatives Considered, Core, Standard Stack, Supporting

### Community 39 - "Community 39"
Cohesion: 0.50
Nodes (4): Claude's Discretion, Deferred Ideas (OUT OF SCOPE), Locked Decisions, User Constraints (from CONTEXT.md)

### Community 40 - "Community 40"
Cohesion: 0.50
Nodes (4): Primary (MEDIUM confidence - verified via official documentation), Secondary (MEDIUM confidence - WebSearch verified with official sources), Sources, Tertiary (LOW confidence - assumed from training data)

### Community 41 - "Community 41"
Cohesion: 0.50
Nodes (4): chainlit.md Welcome Screen, Code Examples, Complete app.py Template, Dockerfile for HuggingFace Spaces

### Community 42 - "Community 42"
Cohesion: 0.50
Nodes (4): Claude's Discretion, Deferred Ideas (OUT OF SCOPE), Locked Decisions, User Constraints (from CONTEXT.md)

### Community 43 - "Community 43"
Cohesion: 0.50
Nodes (4): Primary (HIGH confidence), Secondary (MEDIUM confidence), Sources, Tertiary (LOW confidence)

### Community 44 - "Community 44"
Cohesion: 0.50
Nodes (3): Achievements, Project Details, Sample Mandate

### Community 45 - "Community 45"
Cohesion: 0.67
Nodes (3): Applicable ASVS Categories, Known Threat Patterns for Python RAG Indexing, Security Domain

### Community 46 - "Community 46"
Cohesion: 0.67
Nodes (3): Code Examples, Complete Indexing Pipeline, Testing ChromaDB Persistence

### Community 47 - "Community 47"
Cohesion: 0.67
Nodes (3): Applicable ASVS Categories, Known Threat Patterns for Chat Applications, Security Domain

## Knowledge Gaps
- **365 isolated node(s):** `Chroma`, `Tasks Completed`, `Deliverables`, `Requirements Covered`, `Test Results` (+360 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Path` connect `Community 0` to `Community 2`, `Community 18`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `build_prompt()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `Phase 3: Chainlit Application - Research` connect `Community 16` to `Community 32`, `Community 34`, `Community 36`, `Community 37`, `Community 41`, `Community 42`, `Community 43`, `Community 47`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `Path` (e.g. with `build_prompt()` and `_get_vectorstore()`) actually correct?**
  _`Path` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Document indexer for CV Chatbot.  Loads documents from docs/, chunks them, gener`, `Load a PDF file using PyPDFLoader.`, `Load a Word document using python-docx.` to the rest of the system?**
  _417 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0632996632996633 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._