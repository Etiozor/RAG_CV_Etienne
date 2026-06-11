"""Tests for document indexer (IDX-01 through IDX-06)."""

import os
import tempfile
from pathlib import Path

import pytest
from langchain.schema import Document

from indexer import (
    chunk_documents,
    create_vectorstore,
    load_documents,
    load_docx,
    load_pdf,
    load_xlsx,
)


class TestDocumentLoading:
    """Tests for document loading functions (IDX-01, IDX-02)."""

    def test_load_pdf_documents(self, sample_pdf_path):
        """IDX-01: PyPDFLoader loads PDF documents successfully."""
        docs = load_pdf(sample_pdf_path)

        assert isinstance(docs, list)
        assert len(docs) >= 1
        assert all(isinstance(doc, Document) for doc in docs)
        assert all(hasattr(doc, "page_content") for doc in docs)
        assert all("source" in doc.metadata for doc in docs)

    def test_load_docx_documents(self):
        """IDX-02: Word documents are loaded with source metadata."""
        docs_dir = Path(__file__).parent.parent / "docs"
        docx_files = list(docs_dir.glob("*.docx"))

        if not docx_files:
            pytest.skip("No .docx files in docs/")

        docs = load_docx(docx_files[0])

        assert isinstance(docs, list)
        assert len(docs) >= 1
        assert all(isinstance(doc, Document) for doc in docs)
        assert all(doc.page_content for doc in docs)  # non-empty content
        assert all("source" in doc.metadata for doc in docs)

    def test_load_xlsx_documents(self):
        """IDX-02: Excel documents are loaded with sheet metadata."""
        docs_dir = Path(__file__).parent.parent / "docs"
        xlsx_files = list(docs_dir.glob("*.xlsx"))

        if not xlsx_files:
            pytest.skip("No .xlsx files in docs/")

        docs = load_xlsx(xlsx_files[0])

        assert isinstance(docs, list)
        assert len(docs) >= 1
        assert all(isinstance(doc, Document) for doc in docs)
        assert all(doc.page_content for doc in docs)
        assert all("source" in doc.metadata for doc in docs)
        assert all("sheet" in doc.metadata for doc in docs)

    def test_load_documents_empty_directory(self, temp_docs_dir):
        """Edge case: Empty directory returns empty list."""
        docs = load_documents(temp_docs_dir)
        assert docs == []

    def test_load_documents_all_formats(self):
        """Load all document formats from docs/."""
        docs_dir = Path(__file__).parent.parent / "docs"
        docs = load_documents(docs_dir)

        # Should have loaded something if docs/ has files
        has_files = any(docs_dir.glob("*.pdf")) or any(docs_dir.glob("*.docx")) or any(docs_dir.glob("*.xlsx"))
        if has_files:
            assert len(docs) > 0


class TestChunking:
    """Tests for document chunking (IDX-03)."""

    def test_chunking_size_and_overlap(self):
        """IDX-03: RecursiveCharacterTextSplitter creates chunks of correct size."""
        # Create a document with 5000 characters
        long_text = "This is a test sentence. " * 250  # ~6000 chars
        doc = Document(page_content=long_text, metadata={"source": "test.txt"})

        chunks = chunk_documents([doc])

        assert len(chunks) > 1, "Long document should produce multiple chunks"
        for chunk in chunks:
            assert len(chunk.page_content) <= 2000, f"Chunk too large: {len(chunk.page_content)} chars"
            assert "source" in chunk.metadata, "Metadata should be preserved"

    def test_chunking_preserves_metadata(self):
        """Chunking preserves original document metadata."""
        doc = Document(
            page_content="Short text " * 500,
            metadata={"source": "test.pdf", "page": 1, "custom": "value"}
        )

        chunks = chunk_documents([doc])

        for chunk in chunks:
            assert chunk.metadata.get("source") == "test.pdf"
            assert chunk.metadata.get("page") == 1
            assert chunk.metadata.get("custom") == "value"


class TestEmbeddingsAndStorage:
    """Tests for embedding and ChromaDB persistence (IDX-04, IDX-05, IDX-06)."""

    @pytest.mark.skipif(
        not os.getenv("OPENAI_API_KEY"),
        reason="OPENAI_API_KEY required for embedding tests"
    )
    def test_embedding_generation(self):
        """IDX-04: OpenAIEmbeddings generates embeddings for chunks."""
        from langchain_openai import OpenAIEmbeddings

        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        result = embeddings.embed_query("Test query for embedding")

        assert isinstance(result, list)
        assert len(result) > 0
        assert all(isinstance(x, float) for x in result)

    @pytest.mark.skipif(
        not os.getenv("OPENAI_API_KEY"),
        reason="OPENAI_API_KEY required for ChromaDB tests"
    )
    def test_chromadb_persistence(self, temp_chroma_dir):
        """IDX-05: ChromaDB PersistentClient persists embeddings."""
        chunks = [
            Document(page_content="Test content about Python", metadata={"source": "test.txt"}),
            Document(page_content="Test content about Power BI", metadata={"source": "test.txt"}),
        ]

        vectorstore = create_vectorstore(
            chunks,
            persist_directory=str(temp_chroma_dir),
            collection_name="test_collection"
        )

        # Verify directory has files
        assert temp_chroma_dir.exists()
        assert any(temp_chroma_dir.iterdir())

    @pytest.mark.skipif(
        not os.getenv("OPENAI_API_KEY"),
        reason="OPENAI_API_KEY required for ChromaDB tests"
    )
    def test_chroma_directory_exists(self, temp_chroma_dir):
        """IDX-06: Can load existing collection and query it."""
        from langchain_community.vectorstores import Chroma
        from langchain_openai import OpenAIEmbeddings

        # Create and persist
        chunks = [
            Document(page_content="Experience with Python programming", metadata={"source": "cv.pdf"}),
            Document(page_content="Power BI dashboard development", metadata={"source": "mandats.xlsx"}),
        ]

        create_vectorstore(
            chunks,
            persist_directory=str(temp_chroma_dir),
            collection_name="test_query"
        )

        # Load and query
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        vectorstore = Chroma(
            persist_directory=str(temp_chroma_dir),
            embedding_function=embeddings,
            collection_name="test_query"
        )

        results = vectorstore.similarity_search("Python", k=1)

        assert len(results) > 0
        assert "Python" in results[0].page_content
