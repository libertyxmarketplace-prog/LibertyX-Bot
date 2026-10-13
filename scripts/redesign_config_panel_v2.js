import fs from 'fs';

let content = fs.readFileSync('configPanel.js', 'utf8');

// 1. Update embed header: remove author, remove thumbnail, keep big banner only
const oldEmbedHeader = `  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setAuthor({ name: 'Mavely', iconURL: 'attachment://mavely_logo.png' })
    .setThumbnail('attachment://mavely_logo.png')
    .setFooter({ text: \`Mavely • Page \${activePage} of \${TOTAL_PAGES}\` });`;

const newEmbedHeader = `  const bigBanner = cust.topBannerUrl || CONFIG.SESSION.VOTE_TOP_BANNER_URL || 'https://i.imgur.com/8QzX9nB.png';

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setImage(bigBanner)
    .setFooter({ text: \`Page \${activePage} of \${TOTAL_PAGES}\` });`;

if (content.includes(oldEmbedHeader)) {
  content = content.replace(oldEmbedHeader, newEmbedHeader);
  console.log('Updated embed header: removed author & thumbnail, added big banner only');
} else {
  console.warn('Could not find oldEmbedHeader exact match');
}

// 2. Update buildNavButtonRow: Left, Page, Right, Helper (far right, no Refresh button in between)
const oldNavRow = `export function buildNavButtonRow(botId, activePage) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(\`cfg_nav_prev_\${botId}_\${activePage}\`)
      .setEmoji(EMOJIS.LEFT)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(activePage <= 1),
    new ButtonBuilder()
      .setCustomId(\`cfg_nav_page_\${botId}_\${activePage}\`)
      .setLabel(\`\${activePage} / \${TOTAL_PAGES}\`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(\`cfg_nav_next_\${botId}_\${activePage}\`)
      .setEmoji(EMOJIS.RIGHT)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(activePage >= TOTAL_PAGES),
    new ButtonBuilder()
      .setCustomId(\`cfg_nav_refresh_\${botId}_\${activePage}\`)
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(\`cfg_nav_helper_\${botId}\`)
      .setLabel('Helper')
      .setStyle(ButtonStyle.Success)
  );
}`;

const newNavRow = `export function buildNavButtonRow(botId, activePage) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(\`cfg_nav_prev_\${botId}_\${activePage}\`)
      .setEmoji(EMOJIS.LEFT)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(activePage <= 1),
    new ButtonBuilder()
      .setCustomId(\`cfg_nav_page_\${botId}_\${activePage}\`)
      .setLabel(\`\${activePage} / \${TOTAL_PAGES}\`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(\`cfg_nav_next_\${botId}_\${activePage}\`)
      .setEmoji(EMOJIS.RIGHT)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(activePage >= TOTAL_PAGES),
    new ButtonBuilder()
      .setCustomId(\`cfg_nav_helper_\${botId}\`)
      .setLabel('Helper')
      .setStyle(ButtonStyle.Success)
  );
}`;

if (content.includes(oldNavRow)) {
  content = content.replace(oldNavRow, newNavRow);
  console.log('Updated buildNavButtonRow with Helper cleanly at the far right');
} else {
  console.warn('Could not find oldNavRow');
}

// 3. Update Page 1 description with checkmark / xmark
const oldPage1Desc = `      const staffDisplay = cust.botStaffRoleId ? \`<@&\${cust.botStaffRoleId}>\` : 'Not Configured';
      const adminRole = cust.adminRoleId || (Array.isArray(cust.staffRoleIds) && cust.staffRoleIds[0]) || '';
      const adminDisplay = adminRole ? \`<@&\${adminRole}>\` : 'Not Configured';

      embed.setDescription(
        '> Manage server access and authority levels for your community. Select roles below to grant permissions.\\n\\n' +
        '**Permissions**\\n' +
        \`Staff Role: \${staffDisplay}\\n\` +
        \`Admin Role: \${adminDisplay}\`
      );`;

const newPage1Desc = `      const staffMark = cust.botStaffRoleId ? EMOJIS.CHECK : EMOJIS.CROSS;
      const staffDisplay = cust.botStaffRoleId ? \`<@&\${cust.botStaffRoleId}>\` : 'Not Configured';
      const adminRole = cust.adminRoleId || (Array.isArray(cust.staffRoleIds) && cust.staffRoleIds[0]) || '';
      const adminMark = adminRole ? EMOJIS.CHECK : EMOJIS.CROSS;
      const adminDisplay = adminRole ? \`<@&\${adminRole}>\` : 'Not Configured';

      embed.setDescription(
        '> Manage server access and authority levels for your community. Select roles below to grant permissions.\\n\\n' +
        '**Permissions**\\n' +
        \`\${staffMark} Staff Role: \${staffDisplay}\\n\` +
        \`\${adminMark} Admin Role: \${adminDisplay}\`
      );`;

if (content.includes(oldPage1Desc)) {
  content = content.replace(oldPage1Desc, newPage1Desc);
  console.log('Updated Page 1 description with checkmarks');
} else {
  console.warn('Could not find oldPage1Desc');
}

// 4. Update Page 2 to integrate Ticket Appearance + Spawn Channel Select Menu
const oldPage2Block = `    case 2: {
      const defaultCategories = [
        { id: 'cat_1', name: 'General Support', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_2', name: 'High Rank', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_3', name: 'Player Report', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_4', name: 'Appeals', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_5', name: 'Other', spawnCategoryId: '', pingRoleId: '' }
      ];
      const categories = Array.isArray(cust.ticketCategories) && cust.ticketCategories.length > 0
        ? cust.ticketCategories
        : defaultCategories;

      embed.setDescription(
        '> Support desk configuration and transcript archiving.\\n\\n' +
        '**Ticket Categories**\\n' +
        \`Slot 1: \${categories[0]?.name || 'General Support'}\\n\` +
        \`Slot 2: \${categories[1]?.name || 'High Rank'}\\n\` +
        \`Slot 3: \${categories[2]?.name || 'Player Report'}\\n\` +
        \`Slot 4: \${categories[3]?.name || 'Appeals'}\\n\` +
        \`Slot 5: \${categories[4]?.name || 'Other'}\\n\\n\` +
        '**System Channels & Roles**\\n' +
        \`Transcripts: \${chanRef(cust.transcriptsChannelId)}\\n\` +
        \`Claim Role: \${roleRef(cust.ticketClaimRoleId)}\`
      );

      // Row 1: Transcripts Channel (Select channel directly)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(\`cfg_chan_transcripts_\${botId}\`)
          .setPlaceholder('Select Transcripts Channel')
          .setChannelTypes(ChannelType.GuildText)
      ));

      // Row 2: Ticket Claim Role (Select role directly)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(\`cfg_role_claim_\${botId}\`)
          .setPlaceholder('Select Ticket Claim Role')
      ));

      // Row 3: Category Action Selector
      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(\`cfg_index_\${botId}_2\`)
          .setPlaceholder('Category Settings')
          .addOptions([
            { label: 'Category Names', value: 'edit_ticket_catnames', description: 'Rename the 5 support categories' },
            { label: 'Category Spawn Channels', value: 'edit_ticket_catspawns', description: 'Where tickets are opened' },
            { label: 'Staff Notification Pings', value: 'edit_ticket_catpings', description: 'Roles pinged per category' },
            { label: 'Reset to Defaults', value: 'reset_ticket_categories', description: 'Restore default categories' }
          ])
      ));

      // Row 4: Modules Dropdown
      rows.push(buildModulesDropdown(botId));

      // Row 5: Navigation Button Row
      rows.push(buildNavButtonRow(botId, 2));
      break;
    }`;

const newPage2Block = `    case 2: {
      const defaultCategories = [
        { id: 'cat_1', name: 'General Support', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_2', name: 'High Rank', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_3', name: 'Player Report', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_4', name: 'Appeals', spawnCategoryId: '', pingRoleId: '' },
        { id: 'cat_5', name: 'Other', spawnCategoryId: '', pingRoleId: '' }
      ];
      const categories = Array.isArray(cust.ticketCategories) && cust.ticketCategories.length > 0
        ? cust.ticketCategories
        : defaultCategories;

      const spawnMark = (cust.ticketSpawnCategoryId || categories[0]?.spawnCategoryId) ? EMOJIS.CHECK : EMOJIS.CROSS;
      const transMark = cust.transcriptsChannelId ? EMOJIS.CHECK : EMOJIS.CROSS;
      const claimMark = cust.ticketClaimRoleId ? EMOJIS.CHECK : EMOJIS.CROSS;

      embed.setDescription(
        '> Support desk routing, category channels, and appearance styling.\\n\\n' +
        '**Ticket Routing & Access**\\n' +
        \`\${spawnMark} Spawn Category: \${chanRef(cust.ticketSpawnCategoryId || categories[0]?.spawnCategoryId)}\\n\` +
        \`\${transMark} Transcripts: \${chanRef(cust.transcriptsChannelId)}\\n\` +
        \`\${claimMark} Claim Role: \${roleRef(cust.ticketClaimRoleId)}\\n\\n\` +
        '**Categories**\\n' +
        \`1. \${categories[0]?.name || 'General Support'}\\n\` +
        \`2. \${categories[1]?.name || 'High Rank'}\\n\` +
        \`3. \${categories[2]?.name || 'Player Report'}\\n\` +
        \`4. \${categories[3]?.name || 'Appeals'}\\n\` +
        \`5. \${categories[4]?.name || 'Other'}\`
      );

      // Row 1: Category Spawn Channel (Select category/channel directly - NO ID TYPING)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(\`cfg_chan_ticketspawn_\${botId}\`)
          .setPlaceholder('Select Ticket Spawn Category / Channel')
          .setChannelTypes(ChannelType.GuildCategory, ChannelType.GuildText)
      ));

      // Row 2: Transcripts Channel (Select channel directly - NO ID TYPING)
      rows.push(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(\`cfg_chan_transcripts_\${botId}\`)
          .setPlaceholder('Select Transcripts Channel')
          .setChannelTypes(ChannelType.GuildText)
      ));

      // Row 3: Ticket Claim Role (Select role directly - NO ID TYPING)
      rows.push(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId(\`cfg_role_claim_\${botId}\`)
          .setPlaceholder('Select Ticket Claim Role')
      ));

      // Row 4: Appearance & Category Options (Appearance integrated right here)
      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(\`cfg_index_\${botId}_2\`)
          .setPlaceholder('Appearance & Category Settings')
          .addOptions([
            { label: 'Category Names', value: 'edit_ticket_catnames', description: 'Rename the 5 support categories' },
            { label: 'Panel Headline & Description', value: 'edit_ticket_text', description: 'Customize ticket center title and text' },
            { label: 'Header & Bottom Banners', value: 'edit_ticket_banners', description: 'Set artwork image links' },
            { label: 'Rules Button & Greeting', value: 'edit_rules_greeting', description: 'Rules modal and greeting text' },
            { label: 'Staff Notification Pings', value: 'edit_ticket_catpings', description: 'Roles pinged per category' },
            { label: 'Reset to Defaults', value: 'reset_ticket_categories', description: 'Restore default categories & style' }
          ])
      ));

      // Row 5: Navigation Button Row
      rows.push(buildNavButtonRow(botId, 2));
      break;
    }`;

if (content.includes(oldPage2Block)) {
  content = content.replace(oldPage2Block, newPage2Block);
  console.log('Updated Page 2: integrated Appearance + spawn channel select menu');
} else {
  console.warn('Could not find oldPage2Block');
}

// 5. Update Page 4 (Live Sessions) with checkmarks
const oldPage4Desc = `      embed.setDescription(
        '> Manage in-game voice channel status counters and session announcement alerts.\\n\\n' +
        '**Session Settings**\\n' +
        \`Channel: \${chanRef(cust.sessionChannelId)}\\n\` +
        \`Host Role: \${roleRef(cust.hostRoleId)}\\n\` +
        \`Notification Role: \${roleRef(cust.notificationRoleId)}\\n\\n\` +
        '**Panel Layout**\\n' +
        \`Display Mode: \${cust.sessionLayout === 'buttons' ? 'Action Buttons' : 'Dropdown Menu'}\\n\` +
        \`Title: \${cust.sessionTitle || 'Live Server Session'}\`
      );`;

const newPage4Desc = `      const sesMark = cust.sessionChannelId ? EMOJIS.CHECK : EMOJIS.CROSS;
      const hostMark = cust.hostRoleId ? EMOJIS.CHECK : EMOJIS.CROSS;
      const notifMark = cust.notificationRoleId ? EMOJIS.CHECK : EMOJIS.CROSS;

      embed.setDescription(
        '> Manage in-game voice channel status counters and session announcement alerts.\\n\\n' +
        '**Session Settings**\\n' +
        \`\${sesMark} Session Channel: \${chanRef(cust.sessionChannelId)}\\n\` +
        \`\${hostMark} Host Role: \${roleRef(cust.hostRoleId)}\\n\` +
        \`\${notifMark} Notification Role: \${roleRef(cust.notificationRoleId)}\\n\\n\` +
        '**Panel Layout**\\n' +
        \`Display Mode: \${cust.sessionLayout === 'buttons' ? 'Action Buttons' : 'Dropdown Menu'}\\n\` +
        \`Title: \${cust.sessionTitle || 'Live Server Session'}\`
      );`;

if (content.includes(oldPage4Desc)) {
  content = content.replace(oldPage4Desc, newPage4Desc);
  console.log('Updated Page 4 with checkmarks');
} else {
  console.warn('Could not find oldPage4Desc');
}

// 6. Update Page 5 (Staff Applications) with checkmarks
const oldPage5Desc = `      embed.setDescription(
        '> Configure staff recruitment, application submission channels, and quiz settings.\\n\\n' +
        '**Application Routing**\\n' +
        \`Review Channel: \${chanRef(cust.reviewChannelId)}\\n\` +
        \`Results Channel: \${chanRef(cust.resultsChannelId)}\\n\\n\` +
        '**Configuration**\\n' +
        \`Status: \${statusText(cust.appsEnabled !== false, 'Open & Accepting', 'Closed')}\\n\` +
        \`Pass Threshold: \${cust.passingScore || '70'}%\\n\` +
        \`Questions: \${Array.isArray(cust.appQuestions) ? cust.appQuestions.length : 5} questions\`
      );`;

const newPage5Desc = `      const revMark = cust.reviewChannelId ? EMOJIS.CHECK : EMOJIS.CROSS;
      const resMark = cust.resultsChannelId ? EMOJIS.CHECK : EMOJIS.CROSS;

      embed.setDescription(
        '> Configure staff recruitment, application submission channels, and quiz settings.\\n\\n' +
        '**Application Routing**\\n' +
        \`\${revMark} Review Channel: \${chanRef(cust.reviewChannelId)}\\n\` +
        \`\${resMark} Results Channel: \${chanRef(cust.resultsChannelId)}\\n\\n\` +
        '**Configuration**\\n' +
        \`Status: \${statusText(cust.appsEnabled !== false, 'Open & Accepting', 'Closed')}\\n\` +
        \`Pass Threshold: \${cust.passingScore || '70'}%\\n\` +
        \`Questions: \${Array.isArray(cust.appQuestions) ? cust.appQuestions.length : 5} questions\`
      );`;

if (content.includes(oldPage5Desc)) {
  content = content.replace(oldPage5Desc, newPage5Desc);
  console.log('Updated Page 5 with checkmarks');
} else {
  console.warn('Could not find oldPage5Desc');
}

// 7. Update Page 6 (Staff Documentation) with checkmarks
const oldPage6Desc = `      embed.setDescription(
        '> Staff guidelines, handbook, and operational protocols.\\n\\n' +
        '**Documentation Hub**\\n' +
        \`Destination Channel: \${chanRef(cust.staffDocsChannelId)}\\n\` +
        \`Layout Mode: \${cust.staffDocsLayout === 'buttons' ? 'Buttons' : 'Select Menu'}\\n\` +
        \`Hub Title: \${cust.staffDocsTitle || 'Staff Documentation'}\`
      );`;

const newPage6Desc = `      const docMark = cust.staffDocsChannelId ? EMOJIS.CHECK : EMOJIS.CROSS;

      embed.setDescription(
        '> Staff guidelines, handbook, and operational protocols.\\n\\n' +
        '**Documentation Hub**\\n' +
        \`\${docMark} Destination Channel: \${chanRef(cust.staffDocsChannelId)}\\n\` +
        \`Layout Mode: \${cust.staffDocsLayout === 'buttons' ? 'Buttons' : 'Select Menu'}\\n\` +
        \`Hub Title: \${cust.staffDocsTitle || 'Staff Documentation'}\`
      );`;

if (content.includes(oldPage6Desc)) {
  content = content.replace(oldPage6Desc, newPage6Desc);
  console.log('Updated Page 6 with checkmarks');
} else {
  console.warn('Could not find oldPage6Desc');
}

// 8. Update Page 7 (Community & Tracking) with checkmarks
const oldPage7Desc = `      embed.setDescription(
        '> Disciplinary tracking, rank advancements, and engagement channels.\\n\\n' +
        '**Infractions**\\n' +
        \`Channel: \${chanRef(cust.infractionsChannelId)}\\n\` +
        \`Supervisor Role: \${roleRef(cust.infractionStaffRoleId)}\\n\\n\` +
        '**Promotions**\\n' +
        \`Channel: \${chanRef(cust.promotionsChannelId)}\\n\` +
        \`Promoter Role: \${roleRef(cust.promotionStaffRoleId)}\\n\\n\` +
        '**Community Channels**\\n' +
        \`Forums: \${chanRef(cust.forumChannelId)}\\n\` +
        \`Daily Questions: \${chanRef(cust.dailyQuestionsChannelId)}\`
      );`;

const newPage7Desc = `      const infChanMark = cust.infractionsChannelId ? EMOJIS.CHECK : EMOJIS.CROSS;
      const infRoleMark = cust.infractionStaffRoleId ? EMOJIS.CHECK : EMOJIS.CROSS;
      const promChanMark = cust.promotionsChannelId ? EMOJIS.CHECK : EMOJIS.CROSS;

      embed.setDescription(
        '> Disciplinary tracking, rank advancements, and engagement channels.\\n\\n' +
        '**Infractions**\\n' +
        \`\${infChanMark} Channel: \${chanRef(cust.infractionsChannelId)}\\n\` +
        \`\${infRoleMark} Supervisor Role: \${roleRef(cust.infractionStaffRoleId)}\\n\\n\` +
        '**Promotions**\\n' +
        \`\${promChanMark} Channel: \${chanRef(cust.promotionsChannelId)}\\n\` +
        \`Promoter Role: \${roleRef(cust.promotionStaffRoleId)}\\n\\n\` +
        '**Community Channels**\\n' +
        \`Forums: \${chanRef(cust.forumChannelId)}\\n\` +
        \`Daily Questions: \${chanRef(cust.dailyQuestionsChannelId)}\`
      );`;

if (content.includes(oldPage7Desc)) {
  content = content.replace(oldPage7Desc, newPage7Desc);
  console.log('Updated Page 7 with checkmarks');
} else {
  console.warn('Could not find oldPage7Desc');
}

fs.writeFileSync('configPanel.js', content, 'utf8');
console.log('Successfully refreshed configPanel.js with all user requirements!');
