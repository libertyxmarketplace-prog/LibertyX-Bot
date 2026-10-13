import fs from 'fs';

async function run() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID || '1559709889989841006';

  if (!webhookUrl && !botToken) {
    console.error('Error: Neither DISCORD_WEBHOOK_URL nor DISCORD_BOT_TOKEN is provided.');
    process.exit(1);
  }

  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    console.error('Error: GITHUB_EVENT_PATH not found.');
    process.exit(1);
  }

  const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));

  const repository = eventData.repository || {};
  const repoName = repository.full_name || 'libertyxmarketplace-prog/ERLCXBOT';
  const repoUrl = repository.html_url || 'https://github.com/libertyxmarketplace-prog/ERLCXBOT';

  const ref = eventData.ref || 'refs/heads/main';
  const branch = ref.replace('refs/heads/', '');

  const sender = eventData.sender || {};
  const senderLogin = sender.login || 'Developer';
  const senderAvatar = sender.avatar_url || `https://github.com/${senderLogin}.png`;
  const senderProfile = sender.html_url || `https://github.com/${senderLogin}`;

  const commits = Array.isArray(eventData.commits) ? eventData.commits : [];
  if (commits.length === 0) {
    console.log('No commits in this push event, skipping update.');
    return;
  }

  const commitCount = commits.length;
  const compareUrl = eventData.compare || (commits[0] ? commits[0].url : repoUrl);

  // Format the commit lines (limit to last 10 if there are many)
  const commitLines = commits.slice(0, 10).map(c => {
    const shortSha = c.id.substring(0, 7);
    const authorName = c.author?.name || c.author?.username || senderLogin;
    const authorUser = c.author?.username || senderLogin;
    // Clean commit message (first line only)
    const firstLine = (c.message || 'No commit message').split('\n')[0].trim();
    return `• [\`${shortSha}\`](${c.url}) ${firstLine}\n  -# ${authorName} @${authorUser}`;
  }).join('\n\n');

  // Format timestamp (e.g. "October 13, 2026 at 5:30 PM")
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) + ' at ' + now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const embed = {
    color: 0xff2a4b, // Sleek Mavely crimson red
    author: {
      name: 'Mavely • Development Update',
      icon_url: 'https://raw.githubusercontent.com/libertyxmarketplace-prog/ERLCXBOT/main/assets/mavely_logo.png'
    },
    thumbnail: {
      url: senderAvatar
    },
    description: [
      `🎯 **Developer:** ${senderLogin} • [@${senderLogin}](${senderProfile})`,
      `📁 **Repository:** [${repoName}](${repoUrl})`,
      `🔀 \`${branch}\` • ${commitCount} commit${commitCount === 1 ? '' : 's'}`,
      '',
      `### ⚙️ What's changed`,
      commitLines
    ].join('\n'),
    footer: {
      text: `Mavely Development • ${dateFormatted}`
    }
  };

  const payload = {
    content: '@Updates',
    embeds: [embed],
    components: [
      {
        type: 1, // ActionRow
        components: [
          {
            type: 2, // Button
            style: 5, // Link button
            label: 'View changes',
            url: compareUrl
          },
          {
            type: 2, // Button
            style: 5, // Link button
            label: 'Developer profile',
            url: senderProfile
          }
        ]
      }
    ]
  };

  if (webhookUrl) {
    console.log('Sending update via Discord Webhook...');
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to send Discord webhook: ${res.status} ${errText}`);
      // Fallback without components if webhook doesn't support link buttons on specific webhook type
      const fallbackPayload = {
        content: payload.content,
        embeds: payload.embeds
      };
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackPayload)
      });
    } else {
      console.log('Successfully posted update to Discord!');
    }
  } else if (botToken && channelId) {
    console.log(`Sending update via Discord Bot REST API to channel ${channelId}...`);
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${botToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to send Discord message: ${res.status} ${errText}`);
      process.exit(1);
    } else {
      console.log('Successfully posted update to Discord!');
    }
  }
}

run().catch(err => {
  console.error('Fatal error running update script:', err);
  process.exit(1);
});
