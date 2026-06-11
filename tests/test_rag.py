"""Tests for RAG retrieval and prompt construction (RAG-01 through RAG-04)."""

import os
from pathlib import Path
from unittest.mock import patch

import pytest
from langchain.schema import Document

from rag import SYSTEM_PROMPT, build_prompt, retrieve


class TestRetrieve:
    """Tests for retrieve() function (RAG-01)."""

    @pytest.mark.skipif(
        not os.getenv("OPENAI_API_KEY"),
        reason="OPENAI_API_KEY required for retrieval tests"
    )
    def test_retrieve_returns_documents(self):
        """RAG-01: retrieve() returns list of Document objects."""
        results = retrieve("Etienne competences", k=3)

        assert isinstance(results, list)
        assert len(results) <= 3
        for doc in results:
            assert isinstance(doc, Document)
            assert hasattr(doc, "page_content")
            assert hasattr(doc, "metadata")

    @pytest.mark.skipif(
        not os.getenv("OPENAI_API_KEY"),
        reason="OPENAI_API_KEY required for retrieval tests"
    )
    def test_retrieve_default_k(self):
        """RAG-01: retrieve() uses default k=5 when not specified."""
        results = retrieve("skills")

        assert isinstance(results, list)
        assert len(results) <= 5  # DEFAULT_K

    def test_retrieve_missing_api_key(self, monkeypatch):
        """retrieve() raises ValueError when OPENAI_API_KEY is missing."""
        # Patch os.getenv to return None for OPENAI_API_KEY
        original_getenv = os.getenv

        def mock_getenv(key, default=None):
            if key == "OPENAI_API_KEY":
                return None
            return original_getenv(key, default)

        monkeypatch.setattr(os, "getenv", mock_getenv)

        with pytest.raises(ValueError, match="OPENAI_API_KEY"):
            retrieve("test")

    def test_retrieve_missing_chroma_dir(self, monkeypatch, tmp_path):
        """retrieve() raises FileNotFoundError when chroma_db doesn't exist."""
        # Set a fake API key to bypass that check
        monkeypatch.setenv("OPENAI_API_KEY", "fake-key")

        # Patch CHROMA_DIR to a non-existent path
        with patch("rag.CHROMA_DIR", str(tmp_path / "nonexistent")):
            with pytest.raises(FileNotFoundError, match="ChromaDB directory not found"):
                retrieve("test")


class TestBuildPrompt:
    """Tests for build_prompt() function (RAG-02)."""

    def test_build_prompt_formats_context(self):
        """RAG-02: build_prompt() includes chunk content with source metadata."""
        doc = Document(
            page_content="Test content about Python skills",
            metadata={"source": "/path/to/file.pdf"}
        )

        result = build_prompt("What skills?", [doc])

        assert "Test content about Python skills" in result
        assert "[Source 1:" in result
        assert "file.pdf" in result
        assert "What skills?" in result

    def test_build_prompt_empty_chunks(self):
        """RAG-02: build_prompt() handles empty chunks gracefully."""
        result = build_prompt("question", [])

        assert "Aucun document pertinent" in result

    def test_build_prompt_multiple_chunks(self):
        """RAG-02: build_prompt() formats multiple chunks correctly."""
        docs = [
            Document(page_content="First chunk", metadata={"source": "doc1.pdf"}),
            Document(page_content="Second chunk", metadata={"source": "doc2.xlsx"}),
        ]

        result = build_prompt("test question", docs)

        assert "[Source 1:" in result
        assert "[Source 2:" in result
        assert "First chunk" in result
        assert "Second chunk" in result


class TestSystemPrompt:
    """Tests for SYSTEM_PROMPT content (RAG-03, RAG-04)."""

    def test_system_prompt_third_person(self):
        """RAG-03: System prompt instructs third-person speech about Etienne."""
        assert "Etienne" in SYSTEM_PROMPT
        assert "troisieme personne" in SYSTEM_PROMPT.lower()
        # Bot speaks ABOUT Etienne, not AS Etienne
        assert "Parle d'Etienne" in SYSTEM_PROMPT or "parle d'Etienne" in SYSTEM_PROMPT

    def test_system_prompt_grounding(self):
        """RAG-04: System prompt enforces 'I don't know' for missing information."""
        # Check for the explicit instruction
        assert "Je n'ai pas cette information" in SYSTEM_PROMPT

        # Check for prohibition on using general knowledge
        assert "JAMAIS" in SYSTEM_PROMPT
        assert "connaissances generales" in SYSTEM_PROMPT.lower()

    def test_system_prompt_bilingual(self):
        """D-06: System prompt instructs language matching."""
        assert "meme langue" in SYSTEM_PROMPT.lower() or "same language" in SYSTEM_PROMPT.lower()

    def test_system_prompt_has_placeholders(self):
        """System prompt contains required placeholders."""
        assert "{context}" in SYSTEM_PROMPT
        assert "{question}" in SYSTEM_PROMPT
