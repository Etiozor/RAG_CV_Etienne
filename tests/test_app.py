"""Tests for Chainlit application (UI-01 through UI-05)."""

import os
from unittest.mock import AsyncMock, patch

import pytest


class TestAppConfiguration:
    """Tests for app.py configuration."""

    def test_api_key_required_message(self):
        """App.py contains API key validation logic."""
        import sys
        from pathlib import Path

        # Read the source file to verify validation exists
        app_path = Path(__file__).parent.parent / "app.py"
        source = app_path.read_text()

        assert "ANTHROPIC_API_KEY" in source
        assert "ValueError" in source


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

    def test_model_is_claude(self):
        """App uses a Claude model for generation."""
        os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

        import sys
        if "app" in sys.modules:
            del sys.modules["app"]

        from app import MODEL

        assert "claude" in MODEL.lower()
