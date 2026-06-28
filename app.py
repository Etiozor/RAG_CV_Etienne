"""Chainlit chat application for CV Chatbot.

Provides a conversational interface for recruiters to ask questions
about Etienne Lepironnec's professional profile.
"""

import os

import chainlit as cl
from dotenv import load_dotenv
from langchain.schema import HumanMessage
from langchain_anthropic import ChatAnthropic

from rag import build_prompt, retrieve

load_dotenv()

# Validate API key at import time
if not os.getenv("ANTHROPIC_API_KEY"):
    raise ValueError(
        "ANTHROPIC_API_KEY not found in environment. "
        "Copy .env.example to .env and add your key."
    )

# Claude Haiku - economical with excellent French support
MODEL = "claude-haiku-4-5"


@cl.set_starters
async def set_starters():
    """Display starter questions for quick engagement (UI-02)."""
    return [
        cl.Starter(
            label="Experience professionnelle",
            message="Quelle est l'experience professionnelle d'Etienne?",
        ),
        cl.Starter(
            label="Competences techniques",
            message="Quelles sont les competences techniques d'Etienne?",
        ),
        cl.Starter(
            label="Missions recentes",
            message="Quelles sont les missions recentes d'Etienne?",
        ),
        cl.Starter(
            label="Formation",
            message="Quelle est la formation d'Etienne?",
        ),
        cl.Starter(
            label="Contact",
            message="Comment contacter Etienne?",
        ),
    ]


@cl.on_chat_start
async def on_chat_start():
    """Initialize chat session with LLM and welcome message (UI-01)."""
    llm = ChatAnthropic(
        model=MODEL,
        temperature=0.7,
        max_tokens=1024,
    )
    cl.user_session.set("llm", llm)

    await cl.Message(
        content="Bonjour! Je suis l'assistant virtuel d'Etienne Lepironnec. "
        "Posez-moi vos questions sur son parcours professionnel, "
        "ses competences ou ses experiences."
    ).send()


@cl.on_message
async def on_message(message: cl.Message):
    """Handle user messages with RAG retrieval and streaming response (UI-03, UI-04)."""
    llm = cl.user_session.get("llm")

    try:
        # RAG retrieval
        chunks = retrieve(message.content)
        prompt = build_prompt(message.content, chunks)

        # Stream response
        msg = cl.Message(content="")

        async for chunk in llm.astream([HumanMessage(content=prompt)]):
            if chunk.content:
                await msg.stream_token(chunk.content)

        await msg.send()

    except Exception as e:
        await cl.Message(
            content="Desole, une erreur s'est produite. Veuillez reessayer."
        ).send()
        raise
