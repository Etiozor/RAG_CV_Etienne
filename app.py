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
MODEL = "claude-haiku-4-5-20251001"


@cl.set_starters
async def set_starters():
    """Display starter questions for quick engagement (UI-02)."""
    return [
        cl.Starter(
            label="Portrait des expertises techniques",
            message="Passons au travers de l'ensemble des expertises techniques d'Étienne et des concepts maîtrisés au sein de chacune de ces expertises.",
        ),
        cl.Starter(
            label="Évaluation d'une offre d'emploi",
            message="Évaluer la compatibilité avec une offre d'emploi — Collez le descriptif de poste ci-dessous, j'évaluerai dans quelles mesures Étienne répond à votre proposition.",
        ),
        cl.Starter(
            label="Projets personnels et réalisations",
            message="Montrez-moi des réalisations concrètes du candidat, que ce soit des projets personnels ou des mandats professionnels. Commençons avec des projets en lien avec l'intelligence artificielle, nous continuerons avec des réalisations autour d'autres sphères d'expertise.",
        ),
        cl.Starter(
            label="Centres d'intérêt et personnalité",
            message="Quels sont les centres d'intérêt personnels d'Étienne ? Décris-moi quel genre de professionnel est Étienne. Comment le positionnerais-tu sur le test des 16 personnalités ?",
        ),
        cl.Starter(
            label="Motivations",
            message="Quelles sont les motivations profondes du candidat dans son métier ? Qu'est-ce qui est important pour Étienne dans son environnement professionnel ?",
        ),
    ]


@cl.on_chat_start
async def on_chat_start():
    """Initialize chat session with LLM (UI-01)."""
    llm = ChatAnthropic(
        model=MODEL,
        temperature=0.7,
        max_tokens=1024,
    )
    cl.user_session.set("llm", llm)


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
