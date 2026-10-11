import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { getBotInstance } from './botManager.js';
import { AI_CAPABILITIES } from './aiConfigAssistant.js';
import { getPanelBottomBanner } from './panelMenu.js';
import { activeCustomerClients } from './customerBotRunner.js';

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
  { id: 1, tab: 'Core', title: 'CREDENTIALS & SETUP', intro: 'Link your bot, lock in your community identity, and confirm this instance is live.' },
  { id: 2, tab: 'Tickets', title: 'TICKET CATEGORIES', intro: 'Name the slots members see, route where each ticket is created, and choose who gets alerted.' },
  { id: 3, tab: 'Appearance', title: 'TICKET APPEARANCE', intro: 'Control the panel headline, the rules gate members must pass, and every banner on show.' },
  { id: 4, tab: 'Sessions', title: 'LIVE SESSIONS', intro: 'Wire broadcast channels and operating roles, then set the artwork and copy for each stage.' },
  { id: 5, tab: 'Applications', title: 'STAFF APPLICATIONS', intro: 'Point intake at the right channels and maintain the interview banks for each discipline.' },
  { id: 6, tab: 'Docs', title: 'STAFF DOCUMENTATION', intro: 'Publish the central staff reference hub, pick its layout, and frame it with artwork.' },
  { id: 7, tab: 'Staff', title: 'STAFF & COMMUNITY', intro: 'Grant control of this instance, greet new members, and route promotions and infractions.' },
  { id: 8, tab: 'AI', title: 'AI ASSISTANT', intro: 'Connect a provider and let the assistant rewrite panels, roles, and banners for you.' }
];


function maskSecret(str) {
  if (!str || typeof str !== 'string' || str.trim() === '') return 'Not Set';
  if (str.length <= 8) return '********';
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

// Clean plain-text status - no emojis, no backticks, no clutter
function statusText(isConfigured, yesLabel = 'Configured', noLabel = 'Not set') {
  return isConfigured ? yesLabel : noLabel;
}

function chanRef(id) {
  return (id && String(id).trim()) ? `<#${String(id).trim()}>` : 'Not set';
}

function roleRef(id) {
  return (id && String(id).trim()) ? `<@&${String(id).trim()}>` : 'Not set';
}

/**
 * Build the interactive /config control panel payload using Discord Components V2 Container (type 17).
 *
 * Futuristic card layout:
 *  - Emoji-free headers with a stable "Page X of Y" marker (used for reliable arrow navigation)
 *  - Section cards (type 9) with right-aligned action buttons (accessory)
 *  - Two arrow controls (kept as requested) + position pill + Refresh + Helper
 */
export function buildConfigPanelPayload(botId, page = 1, includeAttachment = true) {
  const bot = getBotInstance(botId);
  if (!bot) {
    return {
      flags: 32768,
      components: [
        {
          type: 17,
          components: [
            {
              type: 10,
              content: `# BOT NOT FOUND\n-# No instance matches **${botId}**. Run /config again with a valid Bot ID.`
            }
          ]
        }
      ]
    };
  }

  const cust = bot.customizations || {};
  const activePage = Math.max(1, Math.min(TOTAL_PAGES, page));

  const containerComponents = [];
  const files = [];

  // ── Layout helpers ──────────────────────────────────────────────────────
  const act = (action, label, style = 2) => ({
    type: 2,
    style,
    label,
    custom_id: `cfg_act_${botId}_${action}`
  });

  let cardPillSeq = 0;
  const card = (text, accessory = null, pillLabel = 'Read only') => {
    // Sub-lines render as blockquotes ("> ") for a cleaner reference-style read
    const content = text.replace(/^-# /gm, '> ');
    const section = { type: 9, components: [{ type: 10, content }] };
    // Discord requires an accessory on every Section - use a disabled pill when none is given
    section.accessory = accessory || {
      type: 2,
      style: 2,
      label: pillLabel,
      custom_id: `cfg_pill_${botId}_card_${++cardPillSeq}`,
      disabled: true
    };
    return section;
  };

  // ── Page directory ─────────────────────────────────────────────────────
  // Intro copy rendered as a blockquote under every page title
  const PAGE_INTROS = {
    1: 'Your bot control room. Credentials, secrets and live link state live here, and are never exposed to server members.',
    2: 'The support lanes members pick from, and exactly where each one opens its ticket. Name a slot, point it at a channel, then choose who gets pinged.',
    3: 'How the ticket panel reads to members: headline copy, the rules gate they pass before opening a ticket, and the artwork framing it all.',
    4: 'Everything that powers an ER:LC live session: broadcast channels, operating roles, banner artwork and announcement copy.',
    5: 'Staff intake. Decide where submissions land, who publishes results, and edit the interview banks used during review.',
    6: 'The documentation hub your team opens whenever they need a reference at hand, including layout and artwork.',
    7: 'Access control, greeting cards, promotions and infraction logging for your staff team.',
    8: 'Connect an AI provider, then describe the change you want in plain English and let the assistant apply it for you.'
  };
  // Per-page index dropdown - mirrors the reference "index" row at the top
  const PAGE_INDEX = {
    1: [
      { label: 'Bot Token & API Key', desc: 'Discord token and ER:LC key', action: 'edit_credentials' },
      { label: 'Server Details', desc: 'Community name and join code', action: 'edit_servercore' }
    ],
    2: [
      { label: 'Category Names', desc: 'Name the five ticket slots', action: 'edit_ticket_catnames' },
      { label: 'Spawn Channels', desc: 'Where each slot opens a ticket', action: 'edit_ticket_catspawns' },
      { label: 'Alert Roles', desc: 'Who gets pinged on open', action: 'edit_ticket_catpings' },
      { label: 'Claim & Transcripts', desc: 'Archive target and claim role', action: 'edit_ticket_banners' }
    ],
    3: [
      { label: 'Panel Text', desc: 'Panel title and inside greeting', action: 'edit_ticket_text' },
      { label: 'Rules & Greeting', desc: 'Rules button, name and content', action: 'edit_rules_greeting' },
      { label: 'Banners', desc: 'Header, inside and accent art', action: 'edit_ticket_banners' },
      { label: 'Reset Banners', desc: 'Clear every banner back to default', action: 'reset_banners' }
    ],
    4: [
      { label: 'Channels & Roles', desc: 'Announcements, radios, host', action: 'edit_session_channels' },
      { label: 'Session Banners', desc: 'Live, vote and concluded art', action: 'edit_session_banners' },
      { label: 'Announcement Text', desc: 'Startup and closing copy', action: 'edit_session_text' }
    ],
    5: [
      { label: 'Application Channels', desc: 'Review and results feeds', action: 'edit_app_channels' },
      { label: 'In-Game Interview Bank', desc: 'Questions asked in game', action: 'edit_app_questions_ingame' },
      { label: 'Discord Interview Bank', desc: 'Questions asked on Discord', action: 'edit_app_questions_discord' }
    ],
    6: [
      { label: 'Text & Layout', desc: 'Hub title and display mode', action: 'edit_staffdocs_content' },
      { label: 'Banners', desc: 'Top and bottom artwork', action: 'edit_staffdocs_banners' },
      { label: 'Destination', desc: 'Where the hub is posted', action: 'edit_staffdocs_channel' }
    ],
    7: [
      { label: 'Staff Role', desc: 'Who can manage this instance', action: 'edit_staffrole' },
      { label: 'Welcome Setup', desc: 'Greeting card and banner', action: 'edit_welcome' },
      { label: 'Promotions', desc: 'Rank-up announcements', action: 'edit_promotions' },
      { label: 'Infractions', desc: 'Disciplinary records', action: 'edit_infractions' }
    ],
    8: [
      { label: 'API Key & Provider', desc: 'Connect an AI provider', action: 'edit_ai_key' },
      { label: 'Ask AI Assistant', desc: 'Describe a change in English', action: 'ask_ai' }
    ]
  };

  // Closing notice rendered above the navigation deck on every page
  const PAGE_NOTES = {
    1: 'Never share your bot token - anyone holding it has full control of the account.',
    2: 'Slot names are what members read, so keep them short and unmistakable.',
    3: 'The rules gate is enforced on the ticket panel and inside every new ticket.',
    4: 'Sessions only broadcast once a host has been granted the host role.',
    5: 'Closed positions hide themselves from the public application hub automatically.',
    6: 'Documentation is visible to staff only - keep sensitive material out of it.',
    7: 'Falling back to server administrators is always safe if a role is left unset.',
    8: 'The assistant only ever writes to this bot instance, never anything global.'
  };
  const header = (title) => {
    containerComponents.push({
      type: 10,
      content: [
        `# ${title}`,
        `-# Page ${activePage} of ${TOTAL_PAGES} \u2022 ${botId}`,
        '',
        `> ${PAGE_INTROS[activePage] || ''}`
      ].join('\n')
    });


    // Index dropdown listing everything this page can edit
    const indexEntries = PAGE_INDEX[activePage] || [];
    if (indexEntries.length > 0) {
      containerComponents.push({
        type: 1,
        components: [{
          type: 3,
          custom_id: `cfg_index_${botId}_${activePage}`,
          placeholder: 'Select a setting to open\u2026',
          options: indexEntries.map(e => ({
            label: e.label,
            description: e.desc,
            value: e.action
          }))
        }]
      });
    }

    containerComponents.push({ type: 14, divider: true, spacing: 1 });
  };

  switch (activePage) {
    // ══════════════════════════════════════════════════════════════════════
    // PAGE 1: CREDENTIALS & SETUP
    // ══════════════════════════════════════════════════════════════════════
    case 1: {
      const hasToken = Boolean(bot.token && bot.token.trim().length > 0);
      const hasApiKey = Boolean(bot.erlcApiKey && bot.erlcApiKey.trim().length > 0);
      const isClientOnline = activeCustomerClients.has(botId);
      const botStatus = bot.banned
        ? 'Suspended'
        : (isClientOnline ? 'Online' : (bot.status === 'invalid_token' ? 'Invalid Token' : (hasToken ? 'Active' : 'Unconfigured')));

      let discordBotId = bot.discordBotId || null;
      if (!discordBotId && hasToken) {
        try {
          const rawId = Buffer.from(bot.token.split('.')[0], 'base64').toString('utf-8');
          if (/^\d{17,20}$/.test(rawId)) {
            discordBotId = rawId;
          }
        } catch {}
      }

      const discordBotDisplay = discordBotId
        ? `<@${discordBotId}>`
        : (hasToken ? 'Token linked' : 'Not linked');

      const ownerDisplay = (bot.ownerUserId && bot.ownerUserId !== 'OWNER')
        ? `<@${bot.ownerUserId}>`
        : 'Server administrators';

      header('CREDENTIALS & SETUP');

      containerComponents.push(card(
        [
          `**Connection**`,
          `-# Discord identity, secrets, and live state`,
          `**Linked Bot** • ${discordBotDisplay}`,
          `**Bot Token** • ${statusText(hasToken)}`,
          `**ER:LC API Key** • ${statusText(hasApiKey)}`,
          `**State** • ${botStatus}`
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**In-Game Server**`,
          `-# Community identity used across every panel`,
          `**Community Name** • ${cust.serverName?.trim() || 'Not set'}`,
          `**Join Code** • ${cust.joinCode?.trim() || 'Not set'}`
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Ownership**`,
          `-# Instance assignment and control`,
          `**Assigned Owner** • ${ownerDisplay}`,
          `**Instance** • \`${botId}\``
        ].join('\n')
      ));

      if (discordBotId) {
        containerComponents.push({
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: 'Invite Bot',
              url: `https://discord.com/oauth2/authorize?client_id=${discordBotId}&permissions=8&scope=bot%20applications.commands`
            }
          ]
        });
      }
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

      const slot = (c, i) => {
        const n = String(i + 1).padStart(2, '0');
        return `**${n}** • ${c.name || `Slot ${n}`}`;
      };

      header('TICKET CATEGORIES');

      containerComponents.push(card(
        [
          `**Category Directory**`,
          `-# Named slots rendered on the ticket panel`,
          categories.map((c, i) => slot(c, i)).join('\n')
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Spawn Routing**`,
          `-# Where each slot creates its ticket channel`,
          categories.map((c, i) =>
            `${slot(c, i)} → ${c.spawnCategoryId ? `<#${c.spawnCategoryId}>` : 'not set'}`
          ).join('\n')
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Staff Alerts**`,
          `-# Roles pinged the moment a ticket opens`,
          categories.map((c, i) =>
            `${slot(c, i)} → ${c.pingRoleId ? `<@&${c.pingRoleId}>` : 'no ping'}`
          ).join('\n')
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Archiving**`,
          `-# Transcript destination and claim permissions`,
          `**Transcripts** • ${chanRef(cust.transcriptsChannelId)}`,
          `**Claim Role** • ${roleRef(cust.ticketClaimRoleId)}`
        ].join('\n'),
      ));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 3: TICKET APPEARANCE - PANEL / RULES & GREETING / GRAPHICS
    // ══════════════════════════════════════════════════════════════════════
    case 3: {
      const insideBanner = cust.ticketInsideBannerUrl ? 'Custom' : 'Default';
      const topBanner = cust.topBannerUrl ? 'Custom' : 'Default';
      const bottomBanner = cust.bottomBannerUrl ? 'Custom' : 'Default';
      const openGreeting = cust.ticketOpenMessage
        ? `"${cust.ticketOpenMessage.slice(0, 60)}${cust.ticketOpenMessage.length > 60 ? '...' : ''}"`
        : 'Built-in support welcome';
      const showRules = cust.showRulesButton !== false;

      header('TICKET APPEARANCE');

      containerComponents.push(card(
        [
          `**Panel**`,
          `-# Headline members see above the ticket controls`,
          `**Title** • ${cust.panelTitle || 'Support'}`,
          `**Header Banner** • ${topBanner}`,
          `**Inside Banner** • ${insideBanner}`
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Rules & Greeting**`,
          `-# Gate members pass before opening a ticket`,
          `**Rules Button** • ${showRules ? 'Visible' : 'Hidden'} (blue)`,
          `**Button Name** • "${cust.rulesButtonLabel || 'Rules'}"`,
          `**Rules Content** • ${cust.rulesDescription ? 'Custom' : 'Default'}`,
          `**Inside Greeting** • ${openGreeting}`
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Graphics**`,
          `-# Artwork used across the ticket experience`,
          `**Header Banner** • ${topBanner}`,
          `**Inside Banner** • ${insideBanner}`,
          `**Bottom Accent** • ${bottomBanner}`
        ].join('\n'),
      ));

      break;
    }
    // ══════════════════════════════════════════════════════════════════════
    // PAGE 4: LIVE SESSIONS
    // ══════════════════════════════════════════════════════════════════════
    case 4: {
      const liveBanner = cust.sessionTopBannerUrl ? 'Custom' : 'Default';
      const shutBanner = cust.sessionShutdownBannerUrl ? 'Custom' : 'Default';
      const voteBanner = cust.sessionVoteTopBannerUrl ? 'Custom' : 'Default';

      header('LIVE SESSIONS');

      containerComponents.push(card(
        [
          `**Channels & Access**`,
          `-# Broadcast targets and operating roles`,
          `**Announcements** • ${chanRef(cust.sessionChannelId)}`,
          `**In-Game Radio** • ${chanRef(cust.ingameVcId)}`,
          `**Queue Staging** • ${chanRef(cust.queueVcId)}`,
          `**Session Host** • ${roleRef(cust.hostRoleId)}`,
          `**Staff Alerts** • ${roleRef(cust.notificationRoleId)}`
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Visual Package**`,
          `-# Banners shown at each session phase`,
          `**Live Stage** • ${liveBanner}`,
          `**Vote Stage** • ${voteBanner}`,
          `**Concluded Stage** • ${shutBanner}`
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Announcement Copy**`,
          `-# Headlines posted when sessions open and close`,
          `**Startup Headline** • ${cust.sessionStartTitle || 'Default'}`,
          `**Concluded Headline** • ${cust.sessionShutdownTitle || 'Default'}`
        ].join('\n'),
      ));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 5: STAFF APPLICATIONS
    // ══════════════════════════════════════════════════════════════════════
    case 5: {
      const isIngameOpen = cust.appIngameOpen !== false;
      const isDiscordOpen = cust.appDiscordOpen !== false;
      const ingameQCount = Array.isArray(cust.appQuestionsIngame) ? cust.appQuestionsIngame.length : 5;
      const discordQCount = Array.isArray(cust.appQuestionsDiscord) ? cust.appQuestionsDiscord.length : 5;

      header('STAFF APPLICATIONS');

      containerComponents.push(card(
        [
          `**Review Pipeline**`,
          `-# Where submissions land and get published`,
          `**Review Feed** • ${chanRef(cust.reviewChannelId)}`,
          `**Results Channel** • ${chanRef(cust.resultsChannelId)}`
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Open Positions**`,
          `-# Intake toggles per discipline`,
          `**In-Game Moderator** • ${isIngameOpen ? 'Open' : 'Closed'}`,
          `**Discord Moderator** • ${isDiscordOpen ? 'Open' : 'Closed'}`
        ].join('\n')
      ));

      containerComponents.push(card(
        [
          `**In-Game Interview Bank**`,
          `-# Questions asked during in-game interviews`,
          `**Questions Loaded** • ${ingameQCount}`
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Discord Interview Bank**`,
          `-# Questions asked during Discord interviews`,
          `**Questions Loaded** • ${discordQCount}`
        ].join('\n'),
      ));
      break;
    }
    // ══════════════════════════════════════════════════════════════════════
    // PAGE 6: STAFF DOCUMENTATION
    // ══════════════════════════════════════════════════════════════════════
    case 6: {
      const layoutMode = cust.staffDocsLayout === 'buttons' ? 'Buttons' : 'Dropdown menu';
      const topBannerStatus = cust.staffDocsTopBannerUrl ? 'Custom' : 'Default';
      const bottomBannerStatus = cust.staffDocsBottomBannerUrl ? 'Custom' : 'Default';

      header('STAFF DOCUMENTATION');

      containerComponents.push(card(
        [
          `**Documentation Hub**`,
          `-# Central home for staff references`,
          `**Destination** • ${chanRef(cust.staffDocsChannelId)}`,
          `**Layout** • ${layoutMode}`,
          `**Title** • ${cust.staffDocsTitle || 'Official Staff Documentation'}`
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Graphics**`,
          `-# Artwork framing the documentation hub`,
          `**Top Banner** • ${topBannerStatus}`,
          `**Bottom Banner** • ${bottomBannerStatus}`
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Destination**`,
          `-# Where the hub gets published`,
          `**Channel** • ${chanRef(cust.staffDocsChannelId)}`
        ].join('\n'),
      ));
      break;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 7: STAFF & COMMUNITY
    // ══════════════════════════════════════════════════════════════════════
    case 7: {
      header('STAFF & COMMUNITY');

      containerComponents.push(card(
        [
          `**Access Control**`,
          `-# Who can manage this instance`,
          `**Staff Role** • ${roleRef(cust.botStaffRoleId)}`,
          `**Fallback** • Server administrators`
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Welcome System**`,
          `-# Greeting card delivered to new members`,
          `**Channel** • ${chanRef(cust.welcomeChannelId)}`,
          `**Status** • ${cust.welcomeEnabled && cust.welcomeChannelId ? 'Enabled' : 'Disabled'}`,
          `**Banner** • ${cust.welcomeBannerUrl ? 'Custom' : 'Default'}`
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Promotions**`,
          `-# Rank-up announcements and recognition`,
          `**Channel** • ${chanRef(cust.promotionsChannelId)}`,
          `**Ping Role** • ${roleRef(cust.promotionStaffRoleId)}`,
          `**Banner** • ${cust.promoteBannerUrl ? 'Custom' : 'Default'}`
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Infractions**`,
          `-# Disciplinary records and staff action logs`,
          `**Channel** • ${chanRef(cust.infractionsChannelId)}`,
          `**Ping Role** • ${roleRef(cust.infractionStaffRoleId)}`,
          `**Banner** • ${cust.infractBannerUrl ? 'Custom' : 'Default'}`
        ].join('\n'),
      ));
      break;
    }
    // ══════════════════════════════════════════════════════════════════════
    // PAGE 8: AI ASSISTANT
    // ══════════════════════════════════════════════════════════════════════
    case 8: {
      const activeAiProv = (cust.aiProvider || bot.aiProvider || 'openrouter').toUpperCase();
      const hasAiKey = Boolean(cust.aiApiKey || bot.aiApiKey);
      const activeModel = cust.aiModel || (activeAiProv === 'GEMINI' ? 'gemini-1.5-flash' : activeAiProv === 'GROQ' ? 'llama-3.3-70b' : 'gpt-4o-mini');

      header('AI ASSISTANT');

      containerComponents.push(card(
        [
          `**Link Status**`,
          `-# Provider connection powering smart setup`,
          `**Provider** • ${activeAiProv}`,
          `**API Key** • ${statusText(hasAiKey, 'Connected', 'Not set')}`,
          `**Model** • ${activeModel}`
        ].join('\n'),
      ));

      containerComponents.push(card(
        [
          `**Capabilities**`,
          `-# What the assistant can change for you`,
          `• Rewrite ticket panels, welcome messages, and rules`,
          `• Configure radios, queue channels, and staff roles`,
          `• Update or clear banners across every module`
        ].join('\n')
      ));

      containerComponents.push({
        type: 1,
        components: [
        ]
      });
      break;
    }
  }

  // ── Closing notice strip ───────────────────────────────────────────────────
  containerComponents.push({ type: 14, divider: true, spacing: 1 });
  if (PAGE_NOTES[activePage]) {
    containerComponents.push({
      type: 10,
      content: `> ${PAGE_NOTES[activePage]}`
    });
  }

  // ── Navigation deck (two arrows kept, position pill, refresh, helper) ──
  containerComponents.push({ type: 14, divider: true, spacing: 2 });
  containerComponents.push({
    type: 1,
    components: [
      {
        type: 2,
        style: 2,
        emoji: EMOJIS.BTN_ARROW_LEFT,
        custom_id: `cfg_nav_prev_${botId}_${activePage}`,
        disabled: activePage <= 1
      },
      {
        type: 2,
        style: 2,
        label: `${activePage} / ${TOTAL_PAGES}`,
        custom_id: `cfg_pill_nav_${botId}_${activePage}`,
        disabled: true
      },
      {
        type: 2,
        style: 2,
        emoji: EMOJIS.BTN_ARROW_RIGHT,
        custom_id: `cfg_nav_next_${botId}_${activePage}`,
        disabled: activePage >= TOTAL_PAGES
      },
      {
        type: 2,
        style: 2,
        label: 'Refresh',
        custom_id: `cfg_nav_refresh_${botId}_${activePage}`
      },
      {
        type: 2,
        style: 3,
        label: 'Helper',
        custom_id: `cfg_btn_ai_helper_${botId}`
      }
    ]
  });

  // Bottom Accent Strip (Uploaded Banner or Local Fallback)
  const bottomBanner = getPanelBottomBanner(cust.bottomBannerUrl);
  if (bottomBanner.mediaUrl) {
    containerComponents.push({
      type: 12,
      items: [{ media: { url: bottomBanner.mediaUrl } }]
    });

    if (includeAttachment && bottomBanner.attachment) {
      files.push(bottomBanner.attachment);
    }
  }

  const payload = {
    flags: 32768,
    components: [
      {
        type: 17,
        components: containerComponents
      }
    ]
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

