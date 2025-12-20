/**
 * One-time Discord server bootstrap.
 * Usage (PowerShell):
 *   set DISCORD_BOT_TOKEN=your_token
 *   set DISCORD_GUILD_ID=your_guild_id
 *   node scripts/setup-discord.js
 *
 * Bot needs permissions to manage channels/roles.
 */

const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } = require('discord.js');

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !GUILD_ID) {
  console.error('Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID environment variables.');
  process.exit(1);
}

const CATEGORIES = [
  { name: 'Info', channels: [
    { name: 'welcome', type: ChannelType.GuildText },
    { name: 'rules', type: ChannelType.GuildText },
    { name: 'announcements', type: ChannelType.GuildText, readOnly: true },
    { name: 'patch-notes', type: ChannelType.GuildText, readOnly: true },
    { name: 'faq', type: ChannelType.GuildText },
  ]},
  { name: 'Support', channels: [
    { name: 'support', type: ChannelType.GuildText },
    { name: 'bug-reports', type: ChannelType.GuildText },
    { name: 'feedback', type: ChannelType.GuildText },
    { name: 'study-hall', type: ChannelType.GuildText },
  ]},
  { name: 'Game', channels: [
    { name: 'table-lfg', type: ChannelType.GuildText },
    { name: 'blackjack-chat', type: ChannelType.GuildText },
    { name: 'poker-chat', type: ChannelType.GuildText },
    { name: 'tournament-lobby', type: ChannelType.GuildText },
  ]},
  { name: 'Ops', channels: [
    { name: 'ops-alerts', type: ChannelType.GuildText, modOnly: true },
    { name: 'bot-log', type: ChannelType.GuildText, modOnly: true },
  ]},
  { name: 'Voice', channels: [
    { name: 'Table Talk', type: ChannelType.GuildVoice },
    { name: 'Tournament Voice', type: ChannelType.GuildVoice },
    { name: 'Streamer Lounge', type: ChannelType.GuildVoice, modOnly: true },
  ]},
];

const ROLES = [
  { name: 'Streamer', color: 0x00d4a6, perms: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles, PermissionFlagsBits.MentionEveryone] },
  { name: 'Mod', color: 0x7289da, perms: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers] },
  { name: 'Player', color: 0x99aab5, perms: [] },
  { name: 'Announcements', color: 0xf1c40f, perms: [] },
];

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(TOKEN);
  const guild = await client.guilds.fetch(GUILD_ID);
  await guild.fetch();

  // Ensure roles
  const roleMap = {};
  for (const r of ROLES) {
    let role = guild.roles.cache.find(x => x.name === r.name);
    if (!role) {
      role = await guild.roles.create({ name: r.name, color: r.color, permissions: r.perms });
      console.log('Created role', role.name);
    }
    roleMap[r.name] = role;
  }

  // Create categories/channels
  for (const cat of CATEGORIES) {
    let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === cat.name);
    if (!category) {
      category = await guild.channels.create({ name: cat.name, type: ChannelType.GuildCategory });
      console.log('Created category', cat.name);
    }
    for (const ch of cat.channels) {
      let channel = guild.channels.cache.find(c => c.name === ch.name && c.parentId === category.id);
      if (!channel) {
        const overwrites = [];
        if (ch.readOnly) {
          overwrites.push({ id: guild.roles.everyone, deny: [PermissionFlagsBits.SendMessages] });
          if (roleMap.Streamer) overwrites.push({ id: roleMap.Streamer.id, allow: [PermissionFlagsBits.SendMessages] });
          if (roleMap.Mod) overwrites.push({ id: roleMap.Mod.id, allow: [PermissionFlagsBits.SendMessages] });
        }
        if (ch.modOnly) {
          overwrites.push({ id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] });
          if (roleMap.Streamer) overwrites.push({ id: roleMap.Streamer.id, allow: [PermissionFlagsBits.ViewChannel] });
          if (roleMap.Mod) overwrites.push({ id: roleMap.Mod.id, allow: [PermissionFlagsBits.ViewChannel] });
        }
        channel = await guild.channels.create({
          name: ch.name,
          type: ch.type,
          parent: category.id,
          permissionOverwrites: overwrites,
        });
        console.log('Created channel', ch.name);
      }
    }
  }

  console.log('Setup complete');
  client.destroy();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
