"""Tests for document indexer (IDX-01 through IDX-06).

Tests marked with pytest.skip will be implemented in Plan 01-02.
"""

import pytest


def test_load_pdf_documents():
    """IDX-01: PyPDFLoader loads PDF documents successfully."""
    pytest.skip("Implemented in Plan 02")


def test_load_markdown_documents():
    """IDX-02: UnstructuredMarkdownLoader loads .md documents."""
    pytest.skip("Implemented in Plan 02")


def test_chunking_size_and_overlap():
    """IDX-03: RecursiveCharacterTextSplitter creates chunks of correct size."""
    pytest.skip("Implemented in Plan 02")


def test_embedding_generation():
    """IDX-04: OpenAIEmbeddings generates embeddings for chunks."""
    pytest.skip("Implemented in Plan 02")


def test_chromadb_persistence():
    """IDX-05: ChromaDB PersistentClient persists embeddings."""
    pytest.skip("Implemented in Plan 02")


def test_chroma_directory_exists():
    """IDX-06: chroma_db/ directory created and contains data."""
    pytest.skip("Implemented in Plan 02")
