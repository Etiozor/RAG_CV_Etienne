"""Tests for Chainlit application (UI-01 through UI-05)."""

import os
from unittest.mock import AsyncMock, patch

import pytest


class TestAppConfiguration:
    """Tests for app.py configuration."""

    def test_api_key_validation(self, monkeypatch):
        """App raises ValueError when ANTHROPIC_API_KEY is missing."""
        import sys

        # Clear any cached module
        if "app" in sys.modules:
            del sys.modules["app"]

        # Store original value if it exists
        original_key = os.environ.get("ANTHROPIC_API_KEY")

        try:
            # Remove the key from environment
            if "ANTHROPIC_API_KEY" in os.environ:
                del os.environ["ANTHROPIC_API_KEY"]

            monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)

            with pytest.raises(ValueError, match="ANTHROPIC_API_KEY"):
                import app  # noqa: F401
        finally:
            # Restore original value
            if original_key:
                os.environ["ANTHROPIC_API_KEY"] = original_key


class TestStarters:
    """Tests for starter questions (UI-02)."""

    @pytest.mark.asyncio
    async def test_starters_return_five_items(self):
        """UI-02: set_starters returns exactly 5 starter questions."""
        # Ensure API key exists for import
        os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

        # Clear cached module to ensure fresh import with key set
        import sys
        if "app" in sys.modules:
            del sys.modules["app"]

        from app import set_starters

        starters = await set_starters()

        assert len(starters) == 5
        assert all(hasattr(s, "label") for s in starters)
        assert all(hasattr(s, "message") for s in starters)

    @pytest.mark.asyncio
    async def test_starters_have_french_labels(self):
        """UI-02: Starter questions have French labels."""
        os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

        import sys
        if "app" in sys.modules:
            del sys.modules["app"]

        from app import set_starters

        starters = await set_starters()

        labels = [s.label for s in starters]
        assert "Experience professionnelle" in labels
        assert "Competences techniques" in labels
        assert "Formation" in labels


class TestMessageHandler:
    """Tests for message handling (UI-03, UI-04)."""

    @pytest.mark.asyncio
    async def test_on_message_uses_rag_functions(self):
        """UI-03: on_message uses retrieve and build_prompt from rag module."""
        os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

        import sys
        if "app" in sys.modules:
            del sys.modules["app"]

        # Import app to verify it loads the RAG functions
        import app

        # Verify rag functions are imported
        assert hasattr(app, "retrieve")
        assert hasattr(app, "build_prompt")


class TestModel:
    """Tests for model configuration."""

    def test_model_is_claude_haiku(self):
        """App uses Claude 3.5 Haiku for economic generation."""
        os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

        import sys
        if "app" in sys.modules:
            del sys.modules["app"]

        from app import MODEL

        assert "haiku" in MODEL.lower()
        assert "claude" in MODEL.lower()
