import fs from 'fs';

// ─── 1. UPDATE configPanel.js ───────────────────────────────────────────────
let configContent = fs.readFileSync('configPanel.js', 'utf8');

// A. buildInitialSetupPayload:
// Big icon on the right inside embed: .setThumbnail('attachment://mavely_logo.png')
// Attach mavely_logo.png cleanly
// NO helper inside initial setup
// Gate "Open Config Panel" so it only appears if credentials are complete
const oldInitialSetup = `export function buildInitialSetupPayload(botId, bot) {
  const hasToken = Boolean(bot?.token && bot.token.trim().length > 0);
  const hasApiKey = Boolean(bot?.erlcApiKey && bot.erlcApiKey.trim().length > 0);
  const isSetupComplete = hasToken && hasApiKey;

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('Initial Setup')
    .setDescription(
      '> Connect your Discord bot token and ER:LC server key to activate your instance.\\n\\n' +
      '**Credentials**\\n' +
      \`\${hasToken ? EMOJIS.CHECK : EMOJIS.CROSS} Bot Token: \${hasToken ? 'Connected' : 'Not Configured'}\\n\` +
      \`\${hasApiKey ? EMOJIS.CHECK : EMOJIS.CROSS} ER:LC API Key: \${hasApiKey ? 'Connected' : 'Not Configured'}\\n\\n\` +
      '**Assistant**\\n' +
      'Need help with credentials? Click the **Helper** button below for guidance.'
    )
    .setFooter({ text: 'Initial Setup' });

  const buttons = [
    new ButtonBuilder()
      .setCustomId(\`cfg_btn_initial_setup_\${botId}\`)
      .setLabel('Setup Credentials')
      .setStyle(ButtonStyle.Success)
  ];

  if (isSetupComplete) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(\`cfg_btn_skip_setup_\${botId}\`)
        .setLabel('Open Config Panel')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  buttons.push(
    new ButtonBuilder()
      .setCustomId(\`cfg_nav_helper_\${botId}\`)
      .setLabel('Helper')
      .setStyle(ButtonStyle.Success)
  );

  const row = new ActionRowBuilder().addComponents(buttons);

  return {
    embeds: [embed],
    components: [row],
    flags: 64
  };
}`;

const newInitialSetup = `export function buildInitialSetupPayload(botId, bot) {
  const hasToken = Boolean(bot?.token && bot.token.trim().length > 0);
  const hasApiKey = Boolean(bot?.erlcApiKey && bot.erlcApiKey.trim().length > 0);
  const isSetupComplete = hasToken && hasApiKey;

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('Initial Setup')
    .setDescription(
      '> Connect your Discord bot token and ER:LC server key to activate your instance.\\n\\n' +
      '**Credentials**\\n' +
      \`\${hasToken ? EMOJIS.CHECK : EMOJIS.CROSS} Bot Token: \${hasToken ? 'Connected' : 'Not Configured'}\\n\` +
      \`\${hasApiKey ? EMOJIS.CHECK : EMOJIS.CROSS} ER:LC API Key: \${hasApiKey ? 'Connected' : 'Not Configured'}\`
    )
    .setThumbnail('attachment://mavely_logo.png')
    .setFooter({ text: 'Initial Setup' });

  const buttons = [
    new ButtonBuilder()
      .setCustomId(\`cfg_btn_initial_setup_\${botId}\`)
      .setLabel('Setup Credentials')
      .setStyle(ButtonStyle.Success)
  ];

  if (isSetupComplete) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(\`cfg_btn_skip_setup_\${botId}\`)
        .setLabel('Open Config Panel')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  const row = new ActionRowBuilder().addComponents(buttons);

  const files = [];
  if (fs.existsSync(MAVELY_LOGO_PATH)) {
    files.push(new AttachmentBuilder(MAVELY_LOGO_PATH, { name: 'mavely_logo.png' }));
  }

  return {
    embeds: [embed],
    components: [row],
    files,
    flags: 64
  };
}`;

if (configContent.includes(oldInitialSetup)) {
  configContent = configContent.replace(oldInitialSetup, newInitialSetup);
  console.log('Updated buildInitialSetupPayload with thumbnail on right, no helper');
} else {
  console.warn('Could not find oldInitialSetup exact block');
}

// B. buildConfigPanelPayload header with user server name, server icon, and thumbnail
const oldConfigHeader = `export function buildConfigPanelPayload(botId, page = 1, includeAttachment = true) {
  const bot = getBotInstance(botId);
  if (!bot) {
    const errEmbed = new EmbedBuilder()
      .setColor(0xED4245)
      .setAuthor({ name: 'Mavely', iconURL: 'attachment://mavely_logo.png' })
      .setThumbnail('attachment://mavely_logo.png')
      .setTitle('Bot Not Found')
      .setDescription(\`> No bot instance found matching ID **\${botId}**.\\n\\nPlease verify your Bot ID or run /config again.\`);
    return {
      embeds: [errEmbed],
      components: [],
      files: fs.existsSync(MAVELY_LOGO_PATH) ? [new AttachmentBuilder(MAVELY_LOGO_PATH, { name: 'mavely_logo.png' })] : [],
      flags: 64
    };
  }

  const cust = bot.customizations || {};
  const activePage = Math.max(1, Math.min(TOTAL_PAGES, page));
  const rows = [];

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setFooter({ text: \`Page \${activePage} of \${TOTAL_PAGES}\` });

  if (cust.topBannerUrl && typeof cust.topBannerUrl === 'string' && cust.topBannerUrl.startsWith('http') && !cust.topBannerUrl.includes('imgur.com/8QzX9nB')) {
    embed.setImage(cust.topBannerUrl.trim());
  }`;

const newConfigHeader = `export function buildConfigPanelPayload(botId, page = 1, includeAttachment = false, guild = null) {
  const bot = getBotInstance(botId);
  if (!bot) {
    const errEmbed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('Bot Not Found')
      .setDescription(\`> No bot instance found matching ID **\${botId}**.\\n\\nPlease verify your Bot ID or run /config again.\`);
    return {
      embeds: [errEmbed],
      components: [],
      flags: 64
    };
  }

  const cust = bot.customizations || {};
  const activePage = Math.max(1, Math.min(TOTAL_PAGES, page));
  const rows = [];

  let guildName = guild?.name;
  let guildIcon = guild?.iconURL?.({ extension: 'png', size: 256 }) || null;

  if (!guildName && bot?.guildId) {
    const custClient = activeCustomerClients?.get(botId);
    const cachedGuild = custClient?.guilds?.cache?.get(bot.guildId);
    if (cachedGuild) {
      guildName = cachedGuild.name;
      guildIcon = cachedGuild.iconURL?.({ extension: 'png', size: 256 }) || null;
    }
  }

  const displayName = guildName || cust.serverName || 'Server Configuration';

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setAuthor({ name: displayName, iconURL: guildIcon || undefined })
    .setFooter({ text: \`Page \${activePage} of \${TOTAL_PAGES}\` });

  if (guildIcon) {
    embed.setThumbnail(guildIcon);
  }

  if (cust.topBannerUrl && typeof cust.topBannerUrl === 'string' && cust.topBannerUrl.startsWith('http') && !cust.topBannerUrl.includes('imgur.com/8QzX9nB')) {
    embed.setImage(cust.topBannerUrl.trim());
  }`;

if (configContent.includes(oldConfigHeader)) {
  configContent = configContent.replace(oldConfigHeader, newConfigHeader);
  console.log('Updated buildConfigPanelPayload with server branding and server thumbnail');
} else {
  console.warn('Could not find oldConfigHeader');
}

// C. Remodel Page 8 (AI Engine) - Keep ONLY Connect AI Key, nice Discord markdowns
const oldPage8 = `    case 8: {
      const activeAiProv = (cust.aiProvider || bot.aiProvider || 'openrouter').toUpperCase();
      const hasAiKey = Boolean(cust.aiApiKey || bot.aiApiKey);
      const activeModel = cust.aiModel || (activeAiProv === 'GEMINI' ? 'gemini-1.5-flash' : activeAiProv === 'GROQ' ? 'llama-3.3-70b' : 'gpt-4o-mini');

      embed.setDescription(
        '> Natural language assistant for instant server configuration and setup.\\n\\n' +
        '**AI Engine**\\n' +
        \`Provider: \${activeAiProv}\\n\` +
        \`Status: \${statusText(hasAiKey, 'Connected', 'Not Connected')}\\n\` +
        \`Model: \${activeModel}\`
      );

      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(\`cfg_index_\${botId}_8\`)
          .setPlaceholder('AI Actions')
          .addOptions([
            { label: 'Ask AI Assistant', value: 'ask_ai', description: 'Describe a configuration change in plain text' },
            { label: 'Connect AI Key', value: 'edit_ai_key', description: 'Connect OpenRouter or OpenAI API key' }
          ])
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 8));
      break;
    }`;

const newPage8 = `    case 8: {
      const activeAiProv = (cust.aiProvider || bot.aiProvider || 'openrouter').toUpperCase();
      const hasAiKey = Boolean(cust.aiApiKey || bot.aiApiKey);
      const activeModel = cust.aiModel || (activeAiProv === 'GEMINI' ? 'gemini-1.5-flash' : activeAiProv === 'GROQ' ? 'llama-3.3-70b' : 'gpt-4o-mini');
      const aiStatusMark = hasAiKey ? EMOJIS.CHECK : EMOJIS.CROSS;

      embed.setDescription(
        '### <:development:1552549821272039465> AI Intelligence Core\\n' +
        '> Connect your neural API engine to unlock automated server setup suggestions, smart rules, and intelligent parsing.\\n\\n' +
        '**Integration Status**\\n' +
        \`\${aiStatusMark} **Key Status:** \\\`\${hasAiKey ? 'Active & Authenticated' : 'Not Configured'}\\\`\\n\` +
        \`<:chart:1552551135737413663> **Provider:** \\\`\${activeAiProv}\\\`\\n\` +
        \`<:briefcase:1552550290425909258> **Active Model:** \\\`\${activeModel}\\\`\\n\\n\` +
        '**Capabilities**\\n' +
        \`\\\`\\\`\\\`yaml\\n\` +
        \`• Natural Language Server Configuration\\n\` +
        \`• Automated Setup Suggestions\\n\` +
        \`• Instant Rule & Guideline Optimization\\n\` +
        \`\\\`\\\`\\\`\\n\` +
        '**Assistant**\\n' +
        'Need help with your AI key? Click the **Helper** button below for guidance.'
      );

      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(\`cfg_index_\${botId}_8\`)
          .setPlaceholder('AI Engine Settings')
          .addOptions([
            { label: 'Connect AI Key', value: 'edit_ai_key', description: 'Authenticate OpenRouter, OpenAI, Groq, or Gemini key' }
          ])
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 8));
      break;
    }`;

if (configContent.includes(oldPage8)) {
  configContent = configContent.replace(oldPage8, newPage8);
  console.log('Remodeled Page 8: kept ONLY Connect AI Key with clean markdown');
} else {
  console.warn('Could not find oldPage8');
}

fs.writeFileSync('configPanel.js', configContent, 'utf8');
console.log('Saved configPanel.js');

// ─── 2. UPDATE index.js ─────────────────────────────────────────────────────
let indexContent = fs.readFileSync('index.js', 'utf8');

// Fix buildConfigActionModal to support edit_server_core
const oldModalAction = `    case 'edit_credentials': return buildCredentialsModal(botId);
    case 'edit_servercore': return buildServerCoreModal(botId);`;

const newModalAction = `    case 'edit_credentials': return buildCredentialsModal(botId);
    case 'edit_server_core':
    case 'edit_servercore': return buildServerCoreModal(botId);`;

if (indexContent.includes(oldModalAction)) {
  indexContent = indexContent.replace(oldModalAction, newModalAction);
  console.log('Updated index.js: added edit_server_core action support');
} else {
  console.warn('Could not find oldModalAction');
}

// Pass interaction.guild into buildConfigPanelPayload where appropriate
const oldPage1Reply = `        const payload = buildConfigPanelPayload(botId, 1, false);
        return interaction.update(payload).catch(() => null);`;

const newPage1Reply = `        const payload = buildConfigPanelPayload(botId, 1, false, interaction.guild);
        return interaction.update(payload).catch(async () => interaction.editReply(payload).catch(() => null));`;

if (indexContent.includes(oldPage1Reply)) {
  indexContent = indexContent.replace(oldPage1Reply, newPage1Reply);
  console.log('Updated index.js: passed interaction.guild to Page 1 update');
}

// Also update pagination buttons to pass interaction.guild
indexContent = indexContent.replace(
  /buildConfigPanelPayload\(botId,\s*targetPage,\s*false\)/g,
  'buildConfigPanelPayload(botId, targetPage, false, interaction.guild)'
);
indexContent = indexContent.replace(
  /buildConfigPanelPayload\(botId,\s*curPage,\s*false\)/g,
  'buildConfigPanelPayload(botId, curPage, false, interaction.guild)'
);
indexContent = indexContent.replace(
  /buildConfigPanelPayload\(targetBot\.botId,\s*requestedPage,\s*true\)/g,
  'buildConfigPanelPayload(targetBot.botId, requestedPage, false, interaction.guild)'
);

fs.writeFileSync('index.js', indexContent, 'utf8');
console.log('Saved index.js');
