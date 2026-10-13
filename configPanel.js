import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  AttachmentBuilder
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBotInstance } from './botManager.js';
import { AI_CAPABILITIES } from './aiConfigAssistant.js';
import { getPanelBottomBanner } from './panelMenu.js';
import { activeCustomerClients } from './customerBotRunner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAVELY_NET_PATH = path.join(__dirname, 'assets', 'mavely_net_clean.png');

export const TOTAL_PAGES = 8;

export const EMOJIS = {
  CHECK: '<:checkmark:1552901024400932894>',
  CROSS: '<:xmark:1552901454098989056>',
  BTN_ARROW_LEFT: { id: '1552907890681970688', name: 'left' },
  BTN_ARROW_RIGHT: { id: '1552909020833259520', name: 'right' }
};

export const DEFAULT_BOTTOM_BANNER = null;

/**
 * Module registry - drives the header, the intro blockquote, and the tab strip.
 * Tab labels are intentionally short so four of them fit cleanly in one action row.
 */
export const PAGE_META = [
  { id: 1, tab: 'Permissions', title: 'PERMISSIONS & CORE', intro: 'This is where you can manage your server permissions! If you wanna know more about what these permissions read the documentation' },
  { id: 2, tab: 'Tickets', title: 'TICKET CATEGORIES', intro: 'Configure your support desk categories, ticket spawn locations, and ping notifications.' },
  { id: 3, tab: 'Appearance', title: 'TICKET APPEARANCE', intro: 'Customize how members see your ticket panel, rule guidelines, and artwork.' },
  { id: 4, tab: 'Sessions', title: 'LIVE SESSIONS', intro: 'Configure ER:LC private server patrols, automated announcements, and stage voice chats.' },
  { id: 5, tab: 'Applications', title: 'STAFF APPLICATIONS', intro: 'Manage staff recruitment pipelines, reviewer channels, and interview banks.' },
  { id: 6, tab: 'Docs', title: 'STAFF DOCUMENTATION', intro: 'Setup your server central staff reference directory, guidelines, and handbook.' },
  { id: 7, tab: 'Community', title: 'COMMUNITY & MODULES', intro: 'Manage staff tracking modules: warnings, rank promotions, message quotas, forums, and daily questions.' },
  { id: 8, tab: 'AI', title: 'MAVELY AI ASSISTANT', intro: 'Powered by Mavely AI: automate server setup, generate customized rules, and update configurations using natural language.' }
];

function maskSecret(str) {
  if (!str || typeof str !== 'string' || str.trim() === '') return 'Not Set';
  if (str.length <= 8) return '********';
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

function statusText(isConfigured, yesLabel = 'Configured', noLabel = 'Not Configured') {
  return isConfigured ? yesLabel : noLabel;
}

function chanRef(id) {
  return (id && String(id).trim()) ? `<#${String(id).trim()}>` : 'Not Configured';
}

function roleRef(id) {
  return (id && String(id).trim()) ? `<@&${String(id).trim()}>` : 'Not Configured';
}

/**
 * Build Initial Setup Gate payload (shown before config when credentials are missing)
 */
export function buildInitialSetupPayload(botId, bot) {
  const hasToken = Boolean(bot?.token && bot.token.trim().length > 0);
  const hasApiKey = Boolean(bot?.erlcApiKey && bot.erlcApiKey.trim().length > 0);

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setAuthor({ name: 'Mavely', iconURL: 'attachment://mavely_net_clean.png' })
    .setTitle('Mavely Setup')
    .setDescription(
      '> Welcome to **Mavely**! Before accessing the configuration panel, please connect your Discord bot token and ER:LC server API key below.\n\n' +
      '🔑 **Setup Credentials**\n' +
      `╭ \`Bot Token:\` ${hasToken ? 'Configured' : 'Not Configured'}\n` +
      `╰ \`ER:LC API Key:\` ${hasApiKey ? 'Configured' : 'Not Configured'}\n\n` +
      'If you need help either go to the [support server](https://discord.gg/mavely) or read the [documentation](https://docs.mavely.bot).'
    )
    .setThumbnail('attachment://mavely_net_clean.png')
    .setFooter({ text: 'Mavely • Initial Setup' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cfg_btn_initial_setup_${botId}`)
      .setLabel('Setup Credentials')
      .setStyle(ButtonStyle.Success)
      .setEmoji('⚡'),
    new ButtonBuilder()
      .setCustomId(`cfg_btn_skip_setup_${botId}`)
      .setLabel('Open Config Panel')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⚙️')
  );

  const files = [];
  if (fs.existsSync(MAVELY_NET_PATH)) {
    files.push(new AttachmentBuilder(MAVELY_NET_PATH, { name: 'mavely_net_clean.png' }));
  }

  return {
    embeds: [embed],
    components: [row],
    files,
    flags: 64
  };
}

/**
 * Shared Modules Dropdown Menu (matching reference screenshot)
 */
function buildModulesDropdown(botId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`cfg_menu_modules_${botId}`)
      .setPlaceholder('Modules')
      .addOptions([
        { label: 'Infractions', value: 'edit_infractions', description: 'Staff infractions and warnings system', emoji: '🚫' },
        { label: 'Promotions', value: 'edit_promotions', description: 'Staff promotions and rank logging', emoji: '🛡️' },
        { label: 'Message Quota', value: 'edit_quota', description: 'Staff message quota and activity tracking', emoji: '💬' },
        { label: 'Forums', value: 'edit_forums', description: 'Community forums and suggestions hub', emoji: '💭' },
        { label: 'Daily Questions', value: 'edit_daily_q', description: 'Daily question prompts and polls', emoji: '📅' },
        { label: 'Permissions & Core', value: 'nav_page_1', description: 'Staff roles and administrator access', emoji: '🔑' },
        { label: 'Ticket System', value: 'nav_page_2', description: 'Support desk and category channels', emoji: '🎫' },
        { label: 'Ticket Appearance', value: 'nav_page_3', description: 'Panel headline, guidelines and artwork', emoji: '🎨' },
        { label: 'Live Sessions', value: 'nav_page_4', description: 'ER:LC server patrols and radios', emoji: '🚔' },
        { label: 'Staff Applications', value: 'nav_page_5', description: 'Recruitment and interview pipelines', emoji: '📝' },
        { label: 'Documentation Hub', value: 'nav_page_6', description: 'Staff handbook and policies', emoji: '📚' },
        { label: 'AI Assistant', value: 'nav_page_8', description: 'Automated configuration with AI', emoji: '🤖' }
      ])
  );
}

/**
 * Shared Navigation Button Row (matching reference screenshot)
 */
function buildNavButtonRow(botId, activePage) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cfg_nav_prev_${botId}_${activePage}`)
      .setEmoji('◀')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(activePage <= 1),
    new ButtonBuilder()
      .setCustomId(`cfg_nav_page_${botId}_${activePage}`)
      .setLabel(`${activePage} / ${TOTAL_PAGES}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`cfg_nav_next_${botId}_${activePage}`)
      .setEmoji('▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(activePage >= TOTAL_PAGES),
    new ButtonBuilder()
      .setCustomId(`cfg_nav_refresh_${botId}_${activePage}`)
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`cfg_nav_helper_${botId}`)
      .setLabel('Helper')
      .setStyle(ButtonStyle.Success)
  );
}

/**
 * Build the interactive /config control panel payload matching exact user screenshots.
 */
export function buildConfigPanelPayload(botId, page = 1, includeAttachment = true) {
  const bot = getBotInstance(botId);
  if (!bot) {
    const errEmbed = new EmbedBuilder()
      .setColor(0xED4245)
      .setAuthor({ name: 'Mavely', iconURL: 'attachment://mavely_net_clean.png' })
      .setThumbnail('attachment://mavely_net_clean.png')
      .setTitle('Bot Not Found')
      .setDescription(`> No bot instance found matching ID **${botId}**.\n\nPlease verify your Bot ID or run /config again.`);
    return {
      embeds: [errEmbed],
      components: [],
      files: fs.existsSync(MAVELY_NET_PATH) ? [new AttachmentBuilder(MAVELY_NET_PATH, { name: 'mavely_net_clean.png' })] : [],
      flags: 64
    };
  }

  const cust = bot.customizations || {};
  const activePage = Math.max(1, Math.min(TOTAL_PAGES, page));
  const rows = [];
  const files = [];

  if (fs.existsSync(MAVELY_NET_PATH)) {
    files.push(new AttachmentBuilder(MAVELY_NET_PATH, { name: 'mavely_net_clean.png' }));
  }

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setAuthor({ name: 'Mavely', iconURL: 'attachment://mavely_net_clean.png' })
    .setThumbnail('attachment://mavely_net_clean.png')
    .setFooter({ text: `Mavely • Page ${activePage} of ${TOTAL_PAGES}` });

  switch (activePage) {
    // ══════════════════════════════════════════════════════════════════════
    // PAGE 1: PERMISSIONS & CORE
    // ══════════════════════════════════════════════════════════════════════
    case 1: {
      const staffDisplay = cust.botStaffRoleId ? `<@&${cust.botStaffRoleId}>` : 'Not Configured';
      const adminRole = cust.adminRoleId || (Array.isArray(cust.staffRoleIds) && cust.staffRoleIds[0]) || '';
      const adminDisplay = adminRole ? `<@&${adminRole}>` : 'Not Configured';

      embed.setDescription(
        '> This is where you can manage your server\'s permissions! If you wanna know more about what these permissions read the [documentation](https://docs.mavely.bot)\n\n' +
        '🔑 **Permissions**\n' +
        `╭ \`Staff Role:\` ${staffDisplay}\n` +
        `╰ \`Admin Role:\` ${adminDisplay}\n\n` +
        'If you need help either go to the [support server](https://discord.gg/mavely) or read the [documentation](https://docs.mavely.bot).'
      );

      // Row 1: Staff Role (Role Select Menu)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(`cfg_role_staff_${botId}`)
          .setPlaceholder('Staff Role')
      ));

      // Row 2: Admin Role (Role Select Menu)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(`cfg_role_admin_${botId}`)
          .setPlaceholder('Admin Role')
      ));

      // Row 3: Advanced Permissions (String Select Menu)
      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`cfg_menu_advperm_${botId}`)
          .setPlaceholder('Advanced Permissions')
          .addOptions([
            { label: 'Staff Role Permissions', value: 'edit_staffrole', description: 'Configure bot staff permissions' },
            { label: 'Ticket Claim Role', value: 'edit_ticket_banners', description: 'Configure who can claim tickets' },
            { label: 'Session Host Role', value: 'edit_session_channels', description: 'Configure ER:LC patrol hosts' },
            { label: 'Infraction Issuer Role', value: 'edit_infractions', description: 'Configure supervisors allowed to infract' },
            { label: 'Promotion Manager Role', value: 'edit_promotions', description: 'Configure managers allowed to promote' },
            { label: 'Bot Token & API Key', value: 'edit_credentials', description: 'Update Discord token and ER:LC key' },
            { label: 'Server Identity', value: 'edit_servercore', description: 'Community name and join code' }
          ])
      ));

      // Row 4: Modules Dropdown
      rows.push(buildModulesDropdown(botId));

      // Row 5: Navigation Button Row
      rows.push(buildNavButtonRow(botId, 1));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 2: TICKET CATEGORIES
    // ══════════════════════════════════════════════════════════════════════
    case 2: {
      const defaultCategories = [
        { id: "cat_1", name: "General Support", spawnCategoryId: "", pingRoleId: "" },
        { id: "cat_2", name: "High Rank", spawnCategoryId: "", pingRoleId: "" },
        { id: "cat_3", name: "Player Report", spawnCategoryId: "", pingRoleId: "" },
        { id: "cat_4", name: "Appeals", spawnCategoryId: "", pingRoleId: "" },
        { id: "cat_5", name: "Other", spawnCategoryId: "", pingRoleId: "" }
      ];
      const categories = Array.isArray(cust.ticketCategories) && cust.ticketCategories.length > 0
        ? cust.ticketCategories
        : defaultCategories;

      embed.setDescription(
        '> Configure your support desk categories, ticket spawn locations, and ping notifications.\n\n' +
        '🎫 **Ticket Categories**\n' +
        `╭ Slot 1: ${categories[0]?.name || 'General Support'}\n` +
        `├ Slot 2: ${categories[1]?.name || 'High Rank'}\n` +
        `├ Slot 3: ${categories[2]?.name || 'Player Report'}\n` +
        `├ Slot 4: ${categories[3]?.name || 'Appeals'}\n` +
        `╰ Slot 5: ${categories[4]?.name || 'Other'}\n\n` +
        '📁 **Spawn & Archiving**\n' +
        `╭ Transcripts: ${chanRef(cust.transcriptsChannelId)}\n` +
        `╰ Claim Role: ${roleRef(cust.ticketClaimRoleId)}\n\n` +
        'If you need help either go to the support server or read the documentation.'
      );

      // Row 1: Category Settings Actions
      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`cfg_index_${botId}_2`)
          .setPlaceholder('Select a ticket setting to edit...')
          .addOptions([
            { label: 'Category Names', value: 'edit_ticket_catnames', description: 'Name the 5 ticket categories' },
            { label: 'Spawn Channels', value: 'edit_ticket_catspawns', description: 'Where each category creates tickets' },
            { label: 'Alert Roles', value: 'edit_ticket_catpings', description: 'Roles alerted when a ticket opens' },
            { label: 'Transcripts & Claim Role', value: 'edit_ticket_banners', description: 'Set transcript log and claim role' }
          ])
      ));

      // Row 2: Modules Dropdown
      rows.push(buildModulesDropdown(botId));

      // Row 3: Navigation Button Row
      rows.push(buildNavButtonRow(botId, 2));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 3: TICKET APPEARANCE
    // ══════════════════════════════════════════════════════════════════════
    case 3: {
      embed.setDescription(
        '> Customize how members see your ticket panel, rule guidelines, and artwork.\n\n' +
        '🎨 **Panel Display**\n' +
        `╭ Panel Title: ${cust.panelTitle || 'Mavely Support'}\n` +
        `├ Rules Button: ${cust.showRulesButton !== false ? 'Visible' : 'Hidden'}\n` +
        `├ Rules Content: ${cust.rulesDescription ? 'Custom' : 'Default'}\n` +
        `╰ Inside Greeting: ${cust.ticketOpenMessage ? 'Custom' : 'Default'}\n\n` +
        '🖼️ **Artwork**\n' +
        `╭ Top Banner: ${cust.topBannerUrl ? 'Custom' : 'Default'}\n` +
        `├ Inside Banner: ${cust.ticketInsideBannerUrl ? 'Custom' : 'Default'}\n` +
        `╰ Bottom Accent: ${cust.bottomBannerUrl ? 'Custom' : 'Default'}\n\n` +
        'If you need help either go to the support server or read the documentation.'
      );

      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`cfg_index_${botId}_3`)
          .setPlaceholder('Select appearance setting to edit...')
          .addOptions([
            { label: 'Panel Text', value: 'edit_ticket_text', description: 'Panel headline and welcome copy' },
            { label: 'Rules & Greeting', value: 'edit_rules_greeting', description: 'Rules button name and modal text' },
            { label: 'Banners & Artwork', value: 'edit_ticket_banners', description: 'Header, inside, and bottom artwork' },
            { label: 'Reset Banners', value: 'reset_banners', description: 'Restore all banners back to default' }
          ])
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 3));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 4: LIVE SESSIONS
    // ══════════════════════════════════════════════════════════════════════
    case 4: {
      embed.setDescription(
        '> Configure ER:LC private server patrols, automated announcements, and stage voice chats.\n\n' +
        '🚔 **Live Patrol System**\n' +
        `╭ Announcement Channel: ${chanRef(cust.sessionChannelId)}\n` +
        `├ In-Game Radio VC: ${chanRef(cust.ingameVcId)}\n` +
        `├ Queue Staging VC: ${chanRef(cust.queueVcId)}\n` +
        `├ Patrol Host Role: ${roleRef(cust.hostRoleId)}\n` +
        `╰ Notification Role: ${roleRef(cust.notificationRoleId)}\n\n` +
        '⚡ **Server Connection**\n' +
        `╭ Join Code: ${cust.joinCode || 'Not Set'}\n` +
        `╰ ER:LC API Key: ${bot.erlcApiKey ? 'Linked' : 'Not Set'}\n\n` +
        'If you need help either go to the support server or read the documentation.'
      );

      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`cfg_index_${botId}_4`)
          .setPlaceholder('Select live session setting to edit...')
          .addOptions([
            { label: 'Channels & Access Roles', value: 'edit_session_channels', description: 'Announcements, voice channels, host role' },
            { label: 'Session Banners', value: 'edit_session_banners', description: 'Live, vote, and concluded artwork' },
            { label: 'Announcement Copy', value: 'edit_session_text', description: 'Startup and closing message text' }
          ])
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 4));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 5: STAFF APPLICATIONS
    // ══════════════════════════════════════════════════════════════════════
    case 5: {
      embed.setDescription(
        '> Manage staff recruitment pipelines, reviewer channels, and interview banks.\n\n' +
        '📝 **Intake Pipeline**\n' +
        `╭ Submissions Review: ${chanRef(cust.reviewChannelId)}\n` +
        `├ Public Results Feed: ${chanRef(cust.resultsChannelId)}\n` +
        `├ In-Game Moderator: ${cust.appIngameOpen !== false ? 'Open' : 'Closed'}\n` +
        `╰ Discord Moderator: ${cust.appDiscordOpen !== false ? 'Open' : 'Closed'}\n\n` +
        '❓ **Interview Banks**\n' +
        `╭ In-Game Questions: Loaded\n` +
        `╰ Discord Questions: Loaded\n\n` +
        'If you need help either go to the support server or read the documentation.'
      );

      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`cfg_index_${botId}_5`)
          .setPlaceholder('Select application setting to edit...')
          .addOptions([
            { label: 'Review & Results Channels', value: 'edit_app_channels', description: 'Where applications land and publish' },
            { label: 'In-Game Interview Questions', value: 'edit_app_questions_ingame', description: 'Questions asked in-game' },
            { label: 'Discord Interview Questions', value: 'edit_app_questions_discord', description: 'Questions asked for Discord' }
          ])
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 5));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 6: STAFF DOCUMENTATION
    // ══════════════════════════════════════════════════════════════════════
    case 6: {
      embed.setDescription(
        '> Setup your server\'s central staff reference directory, guidelines, and handbook.\n\n' +
        '📚 **Staff Documentation Hub**\n' +
        `╭ Destination Channel: ${chanRef(cust.staffDocsChannelId)}\n` +
        `├ Display Layout: ${cust.staffDocsLayout === 'buttons' ? 'Buttons' : 'Dropdown Menu'}\n` +
        `├ Hub Title: ${cust.staffDocsTitle || 'Official Staff Documentation'}\n` +
        `╰ Header Artwork: ${cust.staffDocsTopBannerUrl ? 'Custom' : 'Default'}\n\n` +
        'If you need help either go to the support server or read the documentation.'
      );

      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`cfg_index_${botId}_6`)
          .setPlaceholder('Select documentation setting to edit...')
          .addOptions([
            { label: 'Text & Layout Mode', value: 'edit_staffdocs_content', description: 'Hub title, welcome text, display mode' },
            { label: 'Header & Footer Banners', value: 'edit_staffdocs_banners', description: 'Top and bottom artwork' },
            { label: 'Destination Channel', value: 'edit_staffdocs_channel', description: 'Where documentation hub is posted' }
          ])
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 6));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 7: COMMUNITY & MODULES
    // ══════════════════════════════════════════════════════════════════════
    case 7: {
      embed.setDescription(
        '> Manage staff tracking modules: warnings, rank promotions, message quotas, forums, and daily questions.\n\n' +
        '🚫 **Infractions System**\n' +
        `╭ Channel: ${chanRef(cust.infractionsChannelId)}\n` +
        `╰ Supervisor Role: ${roleRef(cust.infractionStaffRoleId)}\n\n` +
        '🛡️ **Promotions System**\n' +
        `╭ Channel: ${chanRef(cust.promotionsChannelId)}\n` +
        `╰ Promoter Role: ${roleRef(cust.promotionStaffRoleId)}\n\n` +
        '💬 **Community Modules**\n' +
        `╭ Message Quota: ${cust.quotaRequirement || '100'} msgs/week\n` +
        `├ Community Forums: ${chanRef(cust.forumChannelId)}\n` +
        `╰ Daily Questions: ${chanRef(cust.dailyQuestionsChannelId)} (${cust.dailyQuestionsTime || '12:00 PM'})\n\n` +
        'If you need help either go to the support server or read the documentation.'
      );

      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`cfg_index_${botId}_7`)
          .setPlaceholder('Select community module to edit...')
          .addOptions([
            { label: 'Infractions System', value: 'edit_infractions', description: 'Disciplinary logging and auto-roles' },
            { label: 'Promotions System', value: 'edit_promotions', description: 'Rank-up announcements and congratulations' },
            { label: 'Message Quota', value: 'edit_quota', description: 'Weekly message activity targets' },
            { label: 'Community Forums', value: 'edit_forums', description: 'Feedback forum channels' },
            { label: 'Daily Questions', value: 'edit_daily_q', description: 'Automated engagement questions' },
            { label: 'Welcome Card', value: 'edit_welcome', description: 'New member greeting setup' }
          ])
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 7));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 8: MAVELY AI ASSISTANT
    // ══════════════════════════════════════════════════════════════════════
    case 8: {
      const activeAiProv = (cust.aiProvider || bot.aiProvider || 'openrouter').toUpperCase();
      const hasAiKey = Boolean(cust.aiApiKey || bot.aiApiKey);
      const activeModel = cust.aiModel || (activeAiProv === 'GEMINI' ? 'gemini-1.5-flash' : activeAiProv === 'GROQ' ? 'llama-3.3-70b' : 'gpt-4o-mini');

      embed.setDescription(
        '> Powered by Mavely AI: automate server setup, generate customized rules, and update configurations using natural language.\n\n' +
        '🤖 **Mavely AI Engine**\n' +
        `╭ Provider: ${activeAiProv}\n` +
        `├ Status: ${statusText(hasAiKey, 'Connected', 'Not Connected')}\n` +
        `╰ Model: ${activeModel}\n\n` +
        '✨ **Smart Capabilities**\n' +
        '╭ Rewrite ticket panels, welcome messages, and rules\n' +
        '├ Configure channels, categories, and staff permissions\n' +
        '╰ Instant automated server configuration\n\n' +
        'If you need help either go to the support server or read the documentation.'
      );

      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`cfg_index_${botId}_8`)
          .setPlaceholder('Select AI Assistant action...')
          .addOptions([
            { label: 'Ask AI Assistant', value: 'ask_ai', description: 'Describe a change in English to apply' },
            { label: 'API Key & Provider', value: 'edit_ai_key', description: 'Connect an OpenRouter or OpenAI key' }
          ])
      ));

      rows.push(buildModulesDropdown(botId));
      rows.push(buildNavButtonRow(botId, 8));
      break;
    }
  }

  const payload = {
    embeds: [embed],
    components: rows,
    flags: 64
  };

  if (files.length > 0) {
    payload.files = files;
  }

  return payload;
}

// ══════════════════════════════════════════════════════════════════════
// MODAL BUILDERS
// ══════════════════════════════════════════════════════════════════════

/**
 * Build Credentials Modal (Page 1)
 */
export function buildCredentialsModal(botId) {
  const bot = getBotInstance(botId);
  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_creds_${botId}`)
    .setTitle('Bot Setup: Credentials');

  const tokenInput = new TextInputBuilder()
    .setCustomId('token')
    .setLabel('Discord Bot Token (Required)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Paste your Discord Bot Token')
    .setRequired(true);
  if (bot?.token && bot.token.trim().length > 0) tokenInput.setValue(bot.token.trim());

  const apiKeyInput = new TextInputBuilder()
    .setCustomId('erlcApiKey')
    .setLabel('ER:LC Server API Key (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Paste your ER:LC Server API Key (Optional)')
    .setRequired(false);
  if (bot?.erlcApiKey && bot.erlcApiKey.trim().length > 0) apiKeyInput.setValue(bot.erlcApiKey.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(tokenInput),
    new ActionRowBuilder().addComponents(apiKeyInput)
  );

  return modal;
}

/**
 * Build Server Core & Join Code Modal (Page 1)
 */
export function buildServerCoreModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_servercore_${botId}`)
    .setTitle('Server Identity & Join Code');

  const nameInput = new TextInputBuilder()
    .setCustomId('serverName')
    .setLabel('In-Game Server Name')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. Liberty County Roleplay')
    .setRequired(false);
  if (cust.serverName?.trim()) nameInput.setValue(cust.serverName.trim());

  const joinInput = new TextInputBuilder()
    .setCustomId('joinCode')
    .setLabel('Server Join Code')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. LCRP')
    .setRequired(false);
  if (cust.joinCode?.trim()) joinInput.setValue(cust.joinCode.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(joinInput)
  );

  return modal;
}

/**
 * Build Ticket Category Names Modal (Page 2)
 */
export function buildTicketCategoryNamesModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};
  const currentCats = Array.isArray(cust.ticketCategories) ? cust.ticketCategories : [];

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_ticketcatnames_${botId}`)
    .setTitle('Ticket Category Names (1-5)');

  for (let i = 1; i <= 5; i++) {
    const existing = currentCats[i - 1]?.name || '';
    const input = new TextInputBuilder()
      .setCustomId(`cat_name_${i}`)
      .setLabel(`Category ${i} Name (Leave empty to disable)`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(i === 1 ? 'General Support' : i === 2 ? 'High Rank' : `Category ${i}`)
      .setRequired(false);
    if (existing) input.setValue(existing);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }

  return modal;
}

/**
 * Build Ticket Category Spawn Channels Modal (Page 2)
 */
export function buildTicketCategorySpawnsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};
  const currentCats = Array.isArray(cust.ticketCategories) ? cust.ticketCategories : [];

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_ticketcatspawns_${botId}`)
    .setTitle('Category Spawn Channels');

  for (let i = 1; i <= 5; i++) {
    const catName = currentCats[i - 1]?.name || `Category ${i}`;
    const existing = currentCats[i - 1]?.spawnCategoryId || '';
    const input = new TextInputBuilder()
      .setCustomId(`cat_spawn_${i}`)
      .setLabel(`${catName.slice(0, 20)} Category ID`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Discord Category ID where ticket opens')
      .setRequired(false);
    if (existing) input.setValue(existing);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }

  return modal;
}

/**
 * Build Ticket Category Ping Roles Modal (Page 2)
 */
export function buildTicketCategoryPingsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};
  const currentCats = Array.isArray(cust.ticketCategories) ? cust.ticketCategories : [];

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_ticketcatpings_${botId}`)
    .setTitle('Category Alert Roles');

  for (let i = 1; i <= 5; i++) {
    const catName = currentCats[i - 1]?.name || `Category ${i}`;
    const existing = currentCats[i - 1]?.pingRoleId || '';
    const input = new TextInputBuilder()
      .setCustomId(`cat_ping_${i}`)
      .setLabel(`${catName.slice(0, 20)} Role ID`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Staff Role ID to ping when opened')
      .setRequired(false);
    if (existing) input.setValue(existing);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }

  return modal;
}

/**
 * Build Ticket Banners & Settings Modal (Page 3)
 */
export function buildTicketBannersModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_ticketbanners_${botId}`)
    .setTitle('Ticket Banners & Appearance');

  const topBannerInput = new TextInputBuilder()
    .setCustomId('topBannerUrl')
    .setLabel('Main Panel Top Banner URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/banner.png')
    .setRequired(false);
  if (cust.topBannerUrl?.trim()) topBannerInput.setValue(cust.topBannerUrl.trim());

  const insideBannerInput = new TextInputBuilder()
    .setCustomId('ticketInsideBannerUrl')
    .setLabel('Inside-Ticket Header Banner URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/inside_banner.png')
    .setRequired(false);
  if (cust.ticketInsideBannerUrl?.trim()) insideBannerInput.setValue(cust.ticketInsideBannerUrl.trim());

  const bottomInput = new TextInputBuilder()
    .setCustomId('bottomBannerUrl')
    .setLabel('Global Bottom Strip Banner URL (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/bottom_strip.png')
    .setRequired(false);
  if (cust.bottomBannerUrl?.trim()) bottomInput.setValue(cust.bottomBannerUrl.trim());

  const transInput = new TextInputBuilder()
    .setCustomId('transcriptsChannelId')
    .setLabel('Transcripts Log Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where closed transcripts are sent')
    .setRequired(false);
  if (cust.transcriptsChannelId?.trim()) transInput.setValue(cust.transcriptsChannelId.trim());

  const claimRoleInput = new TextInputBuilder()
    .setCustomId('ticketClaimRoleId')
    .setLabel('Allowed Ticket Claim Staff Role ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Role ID allowed to claim tickets')
    .setRequired(false);
  if (cust.ticketClaimRoleId?.trim()) claimRoleInput.setValue(cust.ticketClaimRoleId.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(topBannerInput),
    new ActionRowBuilder().addComponents(insideBannerInput),
    new ActionRowBuilder().addComponents(bottomInput),
    new ActionRowBuilder().addComponents(transInput),
    new ActionRowBuilder().addComponents(claimRoleInput)
  );

  return modal;
}

export const buildBannersModal = buildTicketBannersModal;

/**
 * Build Support Text & Guidelines Modal (Page 3)
 */
export function buildSupportTextModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_text_${botId}`)
    .setTitle('Ticket Guidelines & Welcome');

  const titleInput = new TextInputBuilder()
    .setCustomId('panelTitle')
    .setLabel('Support Panel Title')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Support')
    .setRequired(false);
  if (cust.panelTitle) titleInput.setValue(cust.panelTitle);

  const descInput = new TextInputBuilder()
    .setCustomId('panelDescription')
    .setLabel('Support Panel Description')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('If you require support, open a ticket below...')
    .setRequired(false);
  if (cust.panelDescription) descInput.setValue(cust.panelDescription);

  const defaultWelcome = `Welcome {user} to support! A staff member will assist you shortly.\nPlease provide your Roblox username and detail your inquiry below.`;
  const openMsgInput = new TextInputBuilder()
    .setCustomId('ticketOpenMessage')
    .setLabel('Inside-Ticket Welcome Message')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Enter inside-ticket welcome message (supports {user})...')
    .setRequired(false);
  openMsgInput.setValue(cust.ticketOpenMessage || defaultWelcome);

  const rulesLabelInput = new TextInputBuilder()
    .setCustomId('rulesButtonLabel')
    .setLabel('Rules Button Name (blue button on panel)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Rules')
    .setRequired(false);
  if (cust.rulesButtonLabel) rulesLabelInput.setValue(cust.rulesButtonLabel);

  const rulesDescInput = new TextInputBuilder()
    .setCustomId('rulesDescription')
    .setLabel('Rules Content (shown when Rules is clicked)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Read and follow all community and roleplay rules before opening a ticket...')
    .setRequired(false);
  if (cust.rulesDescription) rulesDescInput.setValue(cust.rulesDescription);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput),
    new ActionRowBuilder().addComponents(rulesLabelInput),
    new ActionRowBuilder().addComponents(rulesDescInput),
    new ActionRowBuilder().addComponents(openMsgInput)
  );

  return modal;
}

/**
 * Build Session Channels & Roles Modal (Page 4)
 */
export function buildSessionChannelsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_sessionchannels_${botId}`)
    .setTitle('Session Channels & Roles');

  const sChanInput = new TextInputBuilder()
    .setCustomId('sessionChannelId')
    .setLabel('Session Announcements Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where live panel is sent')
    .setRequired(false);
  if (cust.sessionChannelId?.trim()) sChanInput.setValue(cust.sessionChannelId.trim());

  const hostRoleInput = new TextInputBuilder()
    .setCustomId('hostRoleId')
    .setLabel('Session Host Staff Role ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Role permitted to start, vote, and shutdown')
    .setRequired(false);
  if (cust.hostRoleId?.trim()) hostRoleInput.setValue(cust.hostRoleId.trim());

  const notifyRoleInput = new TextInputBuilder()
    .setCustomId('notificationRoleId')
    .setLabel('Session Alert / Notification Role ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Role pinged when session goes live')
    .setRequired(false);
  if (cust.notificationRoleId?.trim()) notifyRoleInput.setValue(cust.notificationRoleId.trim());

  const ingameInput = new TextInputBuilder()
    .setCustomId('ingameVcId')
    .setLabel('In-Game Radio VC ID (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Voice channel ID for active in-game radio')
    .setRequired(false);
  if (cust.ingameVcId?.trim()) ingameInput.setValue(cust.ingameVcId.trim());

  const queueInput = new TextInputBuilder()
    .setCustomId('queueVcId')
    .setLabel('Queue Staging VC ID (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Voice channel ID for queue staging')
    .setRequired(false);
  if (cust.queueVcId?.trim()) queueInput.setValue(cust.queueVcId.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(sChanInput),
    new ActionRowBuilder().addComponents(hostRoleInput),
    new ActionRowBuilder().addComponents(notifyRoleInput),
    new ActionRowBuilder().addComponents(ingameInput),
    new ActionRowBuilder().addComponents(queueInput)
  );

  return modal;
}

/**
 * Build Session Banners Modal (Page 4)
 */
export function buildSessionBannersModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_sessionbanners_${botId}`)
    .setTitle('Session Banners');

  const topInput = new TextInputBuilder()
    .setCustomId('sessionTopBannerUrl')
    .setLabel('Live Session Top Banner URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/live_banner.png')
    .setRequired(false);
  if (cust.sessionTopBannerUrl?.trim()) topInput.setValue(cust.sessionTopBannerUrl.trim());

  const voteTopInput = new TextInputBuilder()
    .setCustomId('sessionVoteTopBannerUrl')
    .setLabel('Session Vote Top Banner URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/vote_top.png')
    .setRequired(false);
  if (cust.sessionVoteTopBannerUrl?.trim()) voteTopInput.setValue(cust.sessionVoteTopBannerUrl.trim());

  const shutInput = new TextInputBuilder()
    .setCustomId('sessionShutdownBannerUrl')
    .setLabel('Session Concluded Banner URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/shutdown_banner.png')
    .setRequired(false);
  if (cust.sessionShutdownBannerUrl?.trim()) shutInput.setValue(cust.sessionShutdownBannerUrl.trim());

  const bottomInput = new TextInputBuilder()
    .setCustomId('sessionBottomBannerUrl')
    .setLabel('Session Bottom Strip Banner URL (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/bottom_strip.png')
    .setRequired(false);
  if (cust.sessionBottomBannerUrl?.trim()) bottomInput.setValue(cust.sessionBottomBannerUrl.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(topInput),
    new ActionRowBuilder().addComponents(voteTopInput),
    new ActionRowBuilder().addComponents(shutInput),
    new ActionRowBuilder().addComponents(bottomInput)
  );

  return modal;
}

/**
 * Build Session Announcement Text Modal (Page 4)
 */
export function buildSessionTextModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_sessiontext_${botId}`)
    .setTitle('Session Announcement Text');

  const startTitleInput = new TextInputBuilder()
    .setCustomId('sessionStartTitle')
    .setLabel('Session Startup Headline')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('SESSION STARTING')
    .setRequired(false);
  if (cust.sessionStartTitle) startTitleInput.setValue(cust.sessionStartTitle);

  const startDescInput = new TextInputBuilder()
    .setCustomId('sessionStartDesc')
    .setLabel('Session Startup Description')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('The session vote has succeeded and operations are commencing.')
    .setRequired(false);
  if (cust.sessionStartDesc) startDescInput.setValue(cust.sessionStartDesc);

  const shutTitleInput = new TextInputBuilder()
    .setCustomId('sessionShutdownTitle')
    .setLabel('Session Concluded Headline')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('SESSION CONCLUDED')
    .setRequired(false);
  if (cust.sessionShutdownTitle) shutTitleInput.setValue(cust.sessionShutdownTitle);

  const shutDescInput = new TextInputBuilder()
    .setCustomId('sessionShutdownDesc')
    .setLabel('Session Concluded Description')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('The session has concluded. Thank you for attending today.')
    .setRequired(false);
  if (cust.sessionShutdownDesc) shutDescInput.setValue(cust.sessionShutdownDesc);

  modal.addComponents(
    new ActionRowBuilder().addComponents(startTitleInput),
    new ActionRowBuilder().addComponents(startDescInput),
    new ActionRowBuilder().addComponents(shutTitleInput),
    new ActionRowBuilder().addComponents(shutDescInput)
  );

  return modal;
}

/**
 * Build Applications Modal (Page 5)
 */
export function buildAppsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_apps_${botId}`)
    .setTitle('Staff Application Settings');

  const revInput = new TextInputBuilder()
    .setCustomId('reviewChannelId')
    .setLabel('Application Review Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where submitted applications go')
    .setRequired(false);
  if (cust.reviewChannelId?.trim()) revInput.setValue(cust.reviewChannelId.trim());

  const resInput = new TextInputBuilder()
    .setCustomId('resultsChannelId')
    .setLabel('Public Results Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where accept/deny notices post')
    .setRequired(false);
  if (cust.resultsChannelId?.trim()) resInput.setValue(cust.resultsChannelId.trim());

  const ingameInput = new TextInputBuilder()
    .setCustomId('appIngameOpen')
    .setLabel('In-Game Moderator Open? (yes / no)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('yes')
    .setRequired(false);
  ingameInput.setValue(cust.appIngameOpen !== false ? 'yes' : 'no');

  const discordInput = new TextInputBuilder()
    .setCustomId('appDiscordOpen')
    .setLabel('Discord Moderator Open? (yes / no)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('yes')
    .setRequired(false);
  discordInput.setValue(cust.appDiscordOpen !== false ? 'yes' : 'no');

  modal.addComponents(
    new ActionRowBuilder().addComponents(revInput),
    new ActionRowBuilder().addComponents(resInput),
    new ActionRowBuilder().addComponents(ingameInput),
    new ActionRowBuilder().addComponents(discordInput)
  );

  return modal;
}

/**
 * Build In-Game Moderator Questions Modal (Page 5, up to 20 questions)
 */
export function buildIngameQuestionsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const defaultQuestions = [
    '1. What is your Roblox username and age?',
    '2. What prior staff or moderation experience do you have in ER:LC?',
    '3. How many hours per week can you actively dedicate to in-game moderation?',
    '4. How do you handle a player performing Random Deathmatch (RDM)?',
    '5. What steps do you take when a user accuses another player of Fail Roleplay?',
    '6. When is it appropriate to freeze an active roleplay scene?',
    '7. How do you respond to a player who disrespects or argues with you in mod call?',
    '8. What evidence do you require before executing a server ban?',
    '9. How do you de-escalate tension between two disputing civs?',
    '10. How would you handle a fellow staff member abusing mod commands?',
    '11. What is your timezone and typical availability?',
    '12. Why should we choose you over other in-game applicant candidates?',
    '13. Describe your understanding of Powergaming and Metagaming.',
    '14. Do you have working recording software for capturing clip evidence?',
    '15. Any additional notes or information for management review?'
  ].join('\n');

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_appquestions_ingame_${botId}`)
    .setTitle('In-Game Mod Questions (1-20)');

  const questionsInput = new TextInputBuilder()
    .setCustomId('ingameQuestions')
    .setLabel('Interview Questions (1 per line, up to 20)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Enter your questions, 1 per line (up to 20)...')
    .setRequired(false);
  questionsInput.setValue(cust.ingameQuestions || defaultQuestions);

  modal.addComponents(new ActionRowBuilder().addComponents(questionsInput));
  return modal;
}

/**
 * Build Discord Moderator Questions Modal (Page 5, up to 20 questions)
 */
export function buildDiscordQuestionsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const defaultQuestions = [
    '1. What is your Discord tag, Roblox username, and age?',
    '2. What experience do you have moderating large Discord servers?',
    '3. How would you handle a raid or mass spam attack in public text channels?',
    '4. When is a verbal warning appropriate versus an official warning or mute?',
    '5. How do you handle NSFW or illegal content posted in a general channel?',
    '6. What steps do you take if a user opens a ticket complaining about an unfair mute?',
    '7. How do you handle hate speech or extreme toxicity in Discord voice channels?',
    '8. How many hours daily do you spend monitoring Discord chat activity?',
    '9. How do you address staff members arguing in front of community members?',
    '10. What Discord bot moderation commands are you most familiar with?',
    '11. Why are you interested in becoming a Discord Moderator specifically?',
    '12. What would you do if an unauthorized user attempts to access staff chats?',
    '13. What is your strategy for keeping community chat active and positive?',
    '14. Do you agree to keep all staff discussions strictly confidential?',
    '15. Any closing remarks or credentials for the management team?'
  ].join('\n');

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_appquestions_discord_${botId}`)
    .setTitle('Discord Mod Questions (1-20)');

  const questionsInput = new TextInputBuilder()
    .setCustomId('discordQuestions')
    .setLabel('Interview Questions (1 per line, up to 20)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Enter your questions, 1 per line (up to 20)...')
    .setRequired(false);
  questionsInput.setValue(cust.discordQuestions || defaultQuestions);

  modal.addComponents(new ActionRowBuilder().addComponents(questionsInput));
  return modal;
}

/**
 * Build Application Questionnaire Modal (Page 5 fallback)
 */
export function buildAppQuizModal(botId) {
  return buildIngameQuestionsModal(botId);
}

/**
 * Build Staff Docs Content & Layout Modal (Page 6)
 */
export function buildDocsContentModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_docscontent_${botId}`)
    .setTitle('Documentation Content & Layout');

  const titleInput = new TextInputBuilder()
    .setCustomId('staffDocsTitle')
    .setLabel('Documentation Hub Title')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Official Staff Documentation')
    .setRequired(false);
  if (cust.staffDocsTitle) titleInput.setValue(cust.staffDocsTitle);

  const descInput = new TextInputBuilder()
    .setCustomId('staffDocsDescription')
    .setLabel('Documentation Overview / Welcome Text')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Welcome to the official Staff Documentation directory...')
    .setRequired(false);
  if (cust.staffDocsDescription) descInput.setValue(cust.staffDocsDescription);

  const layoutInput = new TextInputBuilder()
    .setCustomId('staffDocsLayout')
    .setLabel('Layout Style ("select" or "buttons")')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('select')
    .setRequired(false);
  layoutInput.setValue(cust.staffDocsLayout || 'select');

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput),
    new ActionRowBuilder().addComponents(layoutInput)
  );

  return modal;
}

/**
 * Build Staff Docs Banners Modal (Page 6)
 */
export function buildDocsBannersModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_docsbanners_${botId}`)
    .setTitle('Staff Documentation Banners');

  const topInput = new TextInputBuilder()
    .setCustomId('staffDocsTopBannerUrl')
    .setLabel('Top Header Banner URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/docs_top.png')
    .setRequired(false);
  if (cust.staffDocsTopBannerUrl?.trim()) topInput.setValue(cust.staffDocsTopBannerUrl.trim());

  const bottomInput = new TextInputBuilder()
    .setCustomId('staffDocsBottomBannerUrl')
    .setLabel('Bottom Accent Banner URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/docs_bottom.png')
    .setRequired(false);
  if (cust.staffDocsBottomBannerUrl?.trim()) bottomInput.setValue(cust.staffDocsBottomBannerUrl.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(topInput),
    new ActionRowBuilder().addComponents(bottomInput)
  );

  return modal;
}

/**
 * Build Staff Docs Hub Modal (Page 6)
 */
export function buildDocsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_docs_${botId}`)
    .setTitle('Staff Documentation Channel');

  const chanInput = new TextInputBuilder()
    .setCustomId('staffDocsChannelId')
    .setLabel('Staff Docs Hub Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where documentation is posted')
    .setRequired(false);
  if (cust.staffDocsChannelId?.trim()) chanInput.setValue(cust.staffDocsChannelId.trim());

  modal.addComponents(new ActionRowBuilder().addComponents(chanInput));
  return modal;
}

/**
 * Build Promotion Config Modal (Page 7)
 */
export function buildPromotionConfigModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_promotion_${botId}`)
    .setTitle('Staff Promotion Settings');

  const chanInput = new TextInputBuilder()
    .setCustomId('promotionsChannelId')
    .setLabel('Promotions Announcement Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where rank promotions post')
    .setRequired(false);
  if (cust.promotionsChannelId?.trim()) chanInput.setValue(cust.promotionsChannelId.trim());

  const roleInput = new TextInputBuilder()
    .setCustomId('promotionStaffRoleId')
    .setLabel('Allowed Promoters Staff Role ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Staff Role allowed to run /promote')
    .setRequired(false);
  if (cust.promotionStaffRoleId?.trim()) roleInput.setValue(cust.promotionStaffRoleId.trim());

  const topBannerInput = new TextInputBuilder()
    .setCustomId('promotionsBannerUrl')
    .setLabel('Promotion Top Banner URL (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/promotion_banner.png')
    .setRequired(false);
  if (cust.promotionsBannerUrl?.trim()) topBannerInput.setValue(cust.promotionsBannerUrl.trim());

  const bottomBannerInput = new TextInputBuilder()
    .setCustomId('promotionBottomBannerUrl')
    .setLabel('Promotion Bottom Banner URL (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/promotion_bottom.png')
    .setRequired(false);
  if (cust.promotionBottomBannerUrl?.trim()) bottomBannerInput.setValue(cust.promotionBottomBannerUrl.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(chanInput),
    new ActionRowBuilder().addComponents(roleInput),
    new ActionRowBuilder().addComponents(topBannerInput),
    new ActionRowBuilder().addComponents(bottomBannerInput)
  );

  return modal;
}

/**
 * Build Infraction Config Modal (Page 7)
 */
export function buildInfractionConfigModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_infraction_${botId}`)
    .setTitle('Staff Infraction Settings');

  const chanInput = new TextInputBuilder()
    .setCustomId('infractionsChannelId')
    .setLabel('Infractions Announcement Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where infractions post')
    .setRequired(false);
  if (cust.infractionsChannelId?.trim()) chanInput.setValue(cust.infractionsChannelId.trim());

  const roleInput = new TextInputBuilder()
    .setCustomId('infractionStaffRoleId')
    .setLabel('Allowed Supervisors Staff Role ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Staff Role allowed to run /infract')
    .setRequired(false);
  if (cust.infractionStaffRoleId?.trim()) roleInput.setValue(cust.infractionStaffRoleId.trim());

  const topBannerInput = new TextInputBuilder()
    .setCustomId('infractionsBannerUrl')
    .setLabel('Infraction Top Banner URL (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/infraction_banner.png')
    .setRequired(false);
  if (cust.infractionsBannerUrl?.trim()) topBannerInput.setValue(cust.infractionsBannerUrl.trim());

  const bottomBannerInput = new TextInputBuilder()
    .setCustomId('infractionBottomBannerUrl')
    .setLabel('Infraction Bottom Banner URL (Optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://example.com/infraction_bottom.png')
    .setRequired(false);
  if (cust.infractionBottomBannerUrl?.trim()) bottomBannerInput.setValue(cust.infractionBottomBannerUrl.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(chanInput),
    new ActionRowBuilder().addComponents(roleInput),
    new ActionRowBuilder().addComponents(topBannerInput),
    new ActionRowBuilder().addComponents(bottomBannerInput)
  );

  return modal;
}

/**
 * Build Staff Role Permission Modal (Page 1)
 */
export function buildStaffRoleModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_staffrole_${botId}`)
    .setTitle('Authorized Staff Role');

  const roleInput = new TextInputBuilder()
    .setCustomId('botStaffRoleId')
    .setLabel('Authorized Staff Role ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Staff Role ID required to use the bot')
    .setRequired(false);
  if (cust.botStaffRoleId?.trim()) roleInput.setValue(cust.botStaffRoleId.trim());

  modal.addComponents(new ActionRowBuilder().addComponents(roleInput));
  return modal;
}

/**
 * Build AI API Key Modal (Page 8)
 */
export function buildAiKeyModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_aikey_${botId}`)
    .setTitle('Connect AI Assistant Key');

  const provInput = new TextInputBuilder()
    .setCustomId('aiProvider')
    .setLabel('Provider (openrouter or openai)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('openrouter')
    .setRequired(true);
  provInput.setValue(cust.aiProvider || bot?.aiProvider || 'openrouter');

  const keyInput = new TextInputBuilder()
    .setCustomId('aiApiKey')
    .setLabel('API Key')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Paste your OpenRouter or OpenAI API Key')
    .setRequired(true);
  if (cust.aiApiKey || bot?.aiApiKey) keyInput.setValue(cust.aiApiKey || bot.aiApiKey);

  modal.addComponents(
    new ActionRowBuilder().addComponents(provInput),
    new ActionRowBuilder().addComponents(keyInput)
  );

  return modal;
}

/**
 * Build Ask AI Modal (Page 8)
 */
export function buildAskAiModal(botId) {
  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_askai_${botId}`)
    .setTitle('Ask AI Assistant');

  const promptInput = new TextInputBuilder()
    .setCustomId('prompt')
    .setLabel('What would you like the AI to configure?')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('e.g. Remove rules in ticket panel, set session channel to #sessions...')
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(promptInput));
  return modal;
}

/**
 * Build Welcome System Modal
 */
export function buildWelcomeModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_welcome_${botId}`)
    .setTitle('Welcome Settings');

  const channelInput = new TextInputBuilder()
    .setCustomId('welcomeChannelId')
    .setLabel('Welcome Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Paste welcome channel ID')
    .setRequired(false);
  if (cust.welcomeChannelId?.trim()) channelInput.setValue(cust.welcomeChannelId.trim());

  const bannerInput = new TextInputBuilder()
    .setCustomId('welcomeBannerUrl')
    .setLabel('Welcome Card Banner Image URL')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://... image link')
    .setRequired(false);
  if (cust.welcomeBannerUrl?.trim()) bannerInput.setValue(cust.welcomeBannerUrl.trim());

  const textInput = new TextInputBuilder()
    .setCustomId('welcomeText')
    .setLabel('Welcome Message Text')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Welcome to {server}, {user}! Enjoy your stay.')
    .setRequired(false);
  if (cust.welcomeText?.trim()) textInput.setValue(cust.welcomeText.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(channelInput),
    new ActionRowBuilder().addComponents(bannerInput),
    new ActionRowBuilder().addComponents(textInput)
  );

  return modal;
}


/**
 * Build Initial Setup Modal
 */
export function buildInitialSetupModal(botId) {
  const bot = getBotInstance(botId);
  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_initial_setup_${botId}`)
    .setTitle('Mavely Credentials');

  const tokenInput = new TextInputBuilder()
    .setCustomId('discord_token')
    .setLabel('Discord Bot Token (Required)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Paste your Discord Bot Token')
    .setRequired(true);
  if (bot?.token && bot.token.trim().length > 0) tokenInput.setValue(bot.token.trim());

  const apiKeyInput = new TextInputBuilder()
    .setCustomId('erlc_api_key')
    .setLabel('ER:LC Server API Key (Required)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Paste your ER:LC Server API Key')
    .setRequired(true);
  if (bot?.erlcApiKey && bot.erlcApiKey.trim().length > 0) apiKeyInput.setValue(bot.erlcApiKey.trim());

  modal.addComponents(
    new ActionRowBuilder().addComponents(tokenInput),
    new ActionRowBuilder().addComponents(apiKeyInput)
  );

  return modal;
}

/**
 * Build Message Quota Modal
 */
export function buildMessageQuotaModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_quota_${botId}`)
    .setTitle('Staff Message Quota');

  const targetInput = new TextInputBuilder()
    .setCustomId('quotaRequirement')
    .setLabel('Weekly Messages Required')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. 100')
    .setValue(cust.quotaRequirement || '100')
    .setRequired(true);

  const chanInput = new TextInputBuilder()
    .setCustomId('quotaChannelId')
    .setLabel('Quota Tracking Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where quotas post')
    .setValue(cust.quotaChannelId || '')
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(targetInput),
    new ActionRowBuilder().addComponents(chanInput)
  );

  return modal;
}

/**
 * Build Forums Modal
 */
export function buildForumsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_forums_${botId}`)
    .setTitle('Community Forums Setup');

  const chanInput = new TextInputBuilder()
    .setCustomId('forumChannelId')
    .setLabel('Forum Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID for community forums')
    .setValue(cust.forumChannelId || '')
    .setRequired(false);

  modal.addComponents(new ActionRowBuilder().addComponents(chanInput));
  return modal;
}

/**
 * Build Daily Questions Modal
 */
export function buildDailyQuestionsModal(botId) {
  const bot = getBotInstance(botId);
  const cust = bot?.customizations || {};

  const modal = new ModalBuilder()
    .setCustomId(`cfg_modal_daily_q_${botId}`)
    .setTitle('Daily Questions Setup');

  const chanInput = new TextInputBuilder()
    .setCustomId('dailyQuestionsChannelId')
    .setLabel('Daily Questions Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Channel ID where questions post')
    .setValue(cust.dailyQuestionsChannelId || '')
    .setRequired(false);

  const timeInput = new TextInputBuilder()
    .setCustomId('dailyQuestionsTime')
    .setLabel('Post Schedule Time')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. 12:00 PM EST')
    .setValue(cust.dailyQuestionsTime || '12:00 PM')
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(chanInput),
    new ActionRowBuilder().addComponents(timeInput)
  );

  return modal;
}
