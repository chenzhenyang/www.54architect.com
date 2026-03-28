# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Astro + Starlight** documentation site containing technical articles on:
- Agentic Engineering Patterns
- Claude Code & Oh My ClaudeCode (OMC)
- Spec-Driven Development
- Harness Engineering
- Exploring Generative AI

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start local dev server at localhost:4321
npm run build        # Build production site to ./dist/
npm run preview      # Preview build locally before deploying
npm run astro --help # Get help on Astro CLI commands
```

## Architecture

**Content Structure:**
- `src/content/docs/` — Markdown/MDX documentation files
  - Each `.md`/`.mdx` file becomes a route based on its filename
  - Organized into themed subdirectories that map to sidebar sections
- `src/content.config.ts` — Defines the `docs` collection using Starlight's `docsLoader()`
- `src/assets/` — Static assets (images, etc.) embedded via relative links
- `public/` — Static files served at root (favicons, etc.)

**Configuration:**
- `astro.config.mjs` — Starlight integration with sidebar auto-generated from directories
- `tsconfig.json` — Extends `astro/tsconfigs/strict`

**Sidebar Sections** (configured in `astro.config.mjs`):
- Agent, Exploring Generative AI, Agentic Engineering Patterns, Agent Harness
- Claude Code, Oh My ClaudeCode, Spec-Driven Development

## Adding Content

Create `.md` or `.mdx` files in `src/content/docs/<section>/`. The sidebar auto-generates based on the directory structure.
