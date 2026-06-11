"""Pytest fixtures for CV Chatbot tests."""

import tempfile
from pathlib import Path

import pytest


def _ensure_sample_pdf_exists():
    """Create sample.pdf if it doesn't exist using pypdf."""
    pdf_path = Path(__file__).parent / "fixtures" / "sample.pdf"
    if pdf_path.exists():
        return pdf_path

    from pypdf import PdfWriter

    writer = PdfWriter()
    # Create a simple blank page - PyPDFLoader can still load it
    writer.add_blank_page(width=612, height=792)

    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    with open(pdf_path, "wb") as f:
        writer.write(f)

    return pdf_path


@pytest.fixture
def temp_docs_dir():
    """Provide a temporary directory for test documents."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def sample_pdf_path():
    """Return path to the sample PDF fixture (creates it if missing)."""
    return _ensure_sample_pdf_exists()


@pytest.fixture
def sample_md_path():
    """Return path to the sample Markdown fixture."""
    return Path(__file__).parent / "fixtures" / "sample.md"


@pytest.fixture
def temp_chroma_dir():
    """Provide a fresh temporary directory for ChromaDB."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)
