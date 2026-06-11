"""RAG retrieval and prompt construction module for CV Chatbot.

Provides two core functions:
- retrieve(question, k=5): Semantic search against indexed CV documents
- build_prompt(question, chunks): Construct grounded prompt with system instructions

Configuration must match indexer.py exactly for embeddings compatibility.
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings


# Configuration - MUST match indexer.py
CHROMA_DIR = "./chroma_db"
COLLECTION_NAME = "cv_documents"
EMBEDDING_MODEL = "text-embedding-3-small"
DEFAULT_K = 5

# System prompt with strict grounding rules (D-03, D-04, D-06)
SYSTEM_PROMPT = """Tu es un assistant virtuel qui repond aux questions des recruteurs a propos d'Etienne Lepironnec.

REGLES STRICTES:
1. Reponds UNIQUEMENT en utilisant les informations du CONTEXTE ci-dessous
2. Parle d'Etienne a la troisieme personne ("Etienne a travaille...", "Il possede...")
3. Ne te fais JAMAIS passer pour Etienne - tu es un assistant qui parle DE lui
4. Si le CONTEXTE ne contient pas l'information demandee, reponds: "Je n'ai pas cette information dans les documents disponibles."
5. N'utilise JAMAIS tes connaissances generales pour completer le CONTEXTE
6. Reponds dans la meme langue que la question (francais ou anglais)

CONTEXTE:
{context}

QUESTION: {question}

REPONSE:"""


def _get_vectorstore() -> Chroma:
    """Initialize connection to ChromaDB vectorstore.

    Returns:
        Chroma vectorstore instance

    Raises:
        ValueError: If OPENAI_API_KEY is not set
        FileNotFoundError: If chroma_db directory doesn't exist
    """
    load_dotenv()

    if not os.getenv("OPENAI_API_KEY"):
        raise ValueError(
            "OPENAI_API_KEY not found in environment. "
            "Copy .env.example to .env and add your key."
        )

    chroma_path = Path(CHROMA_DIR)
    if not chroma_path.exists():
        raise FileNotFoundError(
            f"ChromaDB directory not found: {CHROMA_DIR}. "
            "Run 'python indexer.py' first to create the index."
        )

    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)

    return Chroma(
        persist_directory=CHROMA_DIR,
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings
    )


def retrieve(question: str, k: int = DEFAULT_K) -> list[Document]:
    """Retrieve top-k relevant chunks from ChromaDB.

    Args:
        question: User's question to search for
        k: Number of chunks to retrieve (default 5)

    Returns:
        List of Document objects with page_content and metadata

    Raises:
        ValueError: If OPENAI_API_KEY is not set
        FileNotFoundError: If chroma_db doesn't exist
    """
    vectorstore = _get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": k})
    return retriever.invoke(question)


def build_prompt(question: str, chunks: list[Document]) -> str:
    """Build a grounded prompt with retrieved context.

    Args:
        question: User's question
        chunks: Retrieved Document chunks

    Returns:
        Formatted prompt string ready for LLM
    """
    if not chunks:
        context = "Aucun document pertinent trouve."
    else:
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            source = chunk.metadata.get("source", "unknown")
            source_name = Path(source).name if source != "unknown" else source
            context_parts.append(f"[Source {i}: {source_name}]\n{chunk.page_content}")
        context = "\n\n".join(context_parts)

    return SYSTEM_PROMPT.format(context=context, question=question)


def main():
    """CLI interface for testing RAG pipeline."""
    if len(sys.argv) < 2:
        print("Usage: python rag.py <question>")
        print('Example: python rag.py "Quelles sont les competences d\'Etienne?"')
        sys.exit(1)

    question = " ".join(sys.argv[1:])

    print("=" * 60)
    print("CV Chatbot - RAG Pipeline Test")
    print("=" * 60)

    try:
        # Retrieve chunks
        print(f"\n[1/2] Retrieving chunks for: {question}")
        chunks = retrieve(question, k=DEFAULT_K)
        print(f"Retrieved {len(chunks)} chunks:")

        for i, chunk in enumerate(chunks, 1):
            source = chunk.metadata.get("source", "unknown")
            source_name = Path(source).name if source != "unknown" else source
            preview = chunk.page_content[:100].replace("\n", " ")
            print(f"  {i}. [{source_name}] {preview}...")

        # Build prompt
        print(f"\n[2/2] Building prompt...")
        prompt = build_prompt(question, chunks)

        print("\n" + "=" * 60)
        print("FORMATTED PROMPT:")
        print("=" * 60)
        print(prompt)

    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
