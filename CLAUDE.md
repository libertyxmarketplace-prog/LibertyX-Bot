# ERLCXBOT (Mavely) - AI Development Guide

This repository contains **Mavely** (the master bot) and the **Customer Bot Multi-Tenant Engine** for Discord servers.

## Tech Stack & Architecture
- **Environment:** Node.js (CommonJS: `require` / `module.exports`)
- **Discord Library:** `discord.js` v14
- **Main Files:**
  - `index.js`: Core master bot ("Mavely") implementation & slash command handlers.
  - `server.js`: Web API / dashboard backend & bot instance supervisor.
  - `customerBotRunner.js`: Runtime engine for customer bot instances.
  - `botManager.js` & `botDatabase.js`: Customer bot database, lifecycle, and encryption.
  - `config.js` & `configPanel.js`: Bot configuration, embed templates, and interactive setup panel.
  - `panelBuilder.js`: Interactive panel builders for Discord components.
  - `applicationManager.js`: Staff application creation, review, and submission.
  - `departmentManager.js`: Server department roles & permissions.
  - `musicManager.js`: Music playback system.
  - `giveawayManager.js`: Giveaway creation and rolling.
  - `sessionManager.js`: In-game session logging, hosting, and tracking.
  - `loaManager.js`: Leave of Absence management.

## Critical Rules for AI Agents (DO NOT VIOLATE)
1. **NO Nuclear File Rewrites:**
   - Do NOT rewrite entire files from scratch.
   - Always preserve existing functions, commands, listeners, and custom ID patterns.
   - When modifying a feature, edit ONLY the targeted logic.
2. **Preserve Discord Custom IDs:**
   - Buttons, select menus, and modals rely on consistent `customId` formats (e.g., `cfg_`, `ticket_`, `panel_`, `modal_`).
   - Never change a `customId` without updating its exact handler in `customerBotRunner.js` or `index.js`.
3. **Discord Interaction Handling:**
   - Discord interactions expire in 3 seconds.
   - For any asynchronous operation or database access, always check:
     ```js
     if (!interaction.deferred && !interaction.replied) {
       await interaction.deferReply({ ephemeral: true });
     }
     ```
4. **Environment & Secrets:**
   - Never hardcode tokens, client IDs, or webhook URLs in code.
   - Always retrieve them from `process.env`.
5. **Data Persistence (`data/` folder):**
   - Files in `data/` are gitignored.
   - Code must gracefully handle empty or missing files on startup by creating default `{}` objects if `!fs.existsSync(...)`.

## Development & Testing Workflow
- To test customer bot runner locally: `node customerBotRunner.js`
- To test the master bot & web server: `node server.js`
- Run Git branches for every new feature: `git checkout -b feature/your-feature-name`

## Commit & Git Push Rules (MANDATORY)
1. **Simple, Plain English Commit Messages:**
   - Commit messages MUST be written in very simple, plain English so the lead developer can easily understand what was changed.
   - Do NOT use overly complex technical jargon or confusing words.
   - Explain what feature was added or what bug was fixed in plain everyday language.
   - Example: "Fixed ticket close button error" or "Added music pause and resume command".
2. **Major / Breaking Changes Alerting:**
   - If a change is dangerous, breaks an existing feature, modifies database schemas, or touches core bot configs, ALWAYS start the commit message with `[ALERT]` (e.g. `[ALERT] Changed database schema for tickets`).
   - The Discord notification system will automatically flag this and ping `@here` to alert the team.
