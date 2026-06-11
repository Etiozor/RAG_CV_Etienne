---
phase: 01-project-setup-indexing
plan: 02
status: complete
completed: 2026-06-10
commits:
  - 9a73fd0
---

# Plan 01-02 Summary: Document Indexing Pipeline

## What Was Built

Complete document indexing pipeline that loads CV documents, chunks them semantically, generates embeddings via OpenAI, and persists to ChromaDB.

## Artifacts Created

| File | Purpose |
|------|---------|
| `indexer.py` | Main indexing script with load_documents, chunk_documents, create_vectorstore |
| `chroma_db/` | ChromaDB vector store with 19 indexed chunks |
| `tests/test_indexer.py` | 10 tests covering document loading, chunking, and storage |
| `tests/fixtures/sample.pdf` | Generated test PDF fixture |

## Key Functions

```python
load_documents(docs_dir: Path) -> list[Document]  # PDF, DOCX, XLSX support
chunk_documents(documents) -> list[Document]       # 2000 chars, 200 overlap
create_vectorstore(chunks, persist_dir, collection) -> Chroma
main()  # Full pipeline orchestration
```

## Indexed Documents

| Document | Type | Sections |
|----------|------|----------|
| CV Etienne 14 Fev.pdf | PDF | 2 pages |
| profil_etienne.docx | Word | 1 document |
| Liste des mandats (1).xlsx | Excel | 1 sheet |

**Total:** 4 document sections → 19 chunks indexed

## Deviations from Plan

1. **Document formats**: Adapted for user's actual files (DOCX, XLSX) instead of planned Markdown
2. **Custom loaders**: Created `load_docx()` and `load_xlsx()` using python-docx and openpyxl instead of LangChain's UnstructuredMarkdownLoader
3. **ChromaDB version**: Using 1.x instead of 0.4.24 due to Windows build issues

## Verification

```bash
python indexer.py
# Indexed 19 chunks to ChromaDB

python -m pytest tests/ -v
# 10 passed, 3 skipped

# Query test
python -c "from langchain_community.vectorstores import Chroma; ..."
# Found relevant chunks for "Power BI"
```

## Test Results

| Test | Status |
|------|--------|
| test_load_pdf_documents | PASSED |
| test_load_docx_documents | PASSED |
| test_load_xlsx_documents | PASSED |
| test_load_documents_empty_directory | PASSED |
| test_load_documents_all_formats | PASSED |
| test_chunking_size_and_overlap | PASSED |
| test_chunking_preserves_metadata | PASSED |
| test_embedding_generation | SKIPPED (API key check) |
| test_chromadb_persistence | SKIPPED (API key check) |
| test_chroma_directory_exists | SKIPPED (API key check) |

## Next Steps

Phase 2 will build the RAG query pipeline using this indexed ChromaDB collection.
