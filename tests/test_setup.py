"""Tests for project setup verification (SETUP-01, SETUP-02, SETUP-03)."""

from pathlib import Path


def test_requirements_txt_exists():
    """SETUP-01: requirements.txt exists at project root."""
    requirements_path = Path(__file__).parent.parent / "requirements.txt"
    assert requirements_path.exists(), "requirements.txt not found at project root"


def test_env_example_documents_keys():
    """SETUP-02: .env.example documents required environment variables."""
    env_example_path = Path(__file__).parent.parent / ".env.example"
    assert env_example_path.exists(), ".env.example not found"

    content = env_example_path.read_text()
    assert "OPENAI_API_KEY" in content, ".env.example must document OPENAI_API_KEY"
    assert "platform.openai.com" in content, ".env.example should include API key URL"


def test_gitignore_excludes_secrets():
    """SETUP-03: .gitignore excludes .env and chroma_db/."""
    gitignore_path = Path(__file__).parent.parent / ".gitignore"
    assert gitignore_path.exists(), ".gitignore not found"

    content = gitignore_path.read_text()
    lines = [line.strip() for line in content.splitlines()]

    assert ".env" in lines, ".gitignore must exclude .env"
    assert "chroma_db/" in lines, ".gitignore must exclude chroma_db/"
