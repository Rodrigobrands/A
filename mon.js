const { Client, MessageEmbed } = require('discord.js-selfbot-v13');
const fetch = require('node-fetch');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let client;

async function monitoramento() {
    const config = require('./config.json')
    let cor = hex(config.cor_painel || '#A020F0');
    const reset = hex('#ffffff');
    function hex(hex) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      throw new Error('Código hex inválido. Deve ser no formato #RRGGBB.');
    } }
  console.clear();
  const userIdToMonitor = await questionAsync(`[ 1. ] Adicione ID da pessoa: `);
  const webhookUrl = await questionAsync(`[ 2. ] Adicione a Webhook: `);

  client = new Client({ checkUpdate: false });

  client.once('ready', () => {
    console.clear();
    console.log(`Monitoramento ativo, para desativar, feche o painel.`);
  });

  client.on('messageCreate', async message => {
    let contextName = '';
  
    if (message.guild) {
      contextName = message.guild.name;
    } else {
      contextName = `DM - ${message.author.tag}`;
    }
  
    if (message.author && message.author.id === userIdToMonitor) {
      let messageContent = message.content;
      let imageUrl = '';
  
      if (message.attachments.size > 0) {
        message.attachments.forEach(attachment => {
          if (attachment.contentType && (attachment.contentType.startsWith('image/') || attachment.contentType.startsWith('video/'))) {
            imageUrl = attachment.url;
          }
        });
      }

      const embed = new MessageEmbed()
        .setAuthor({
          name: `${message.author.tag} - ${contextName}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setColor('#2b2d31')
        .setDescription(
          `**Usuário:**\n<@${userIdToMonitor}> \`(${message.author.id})\`\n\n` +
          `**Canal:** ${message.guild ? `<#${message.channel.id}>` : contextName}\n` +
          `**Mensagem:**\n \`\`\`${messageContent}\`\`\`\n`
        )
        .setTimestamp();

      if (imageUrl) {
        embed.setImage(imageUrl);
      }

      const payload = JSON.stringify({ embeds: [embed] });

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      }).catch(console.error);
    }
  });

  client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (newMessage.author && newMessage.author.id === userIdToMonitor) {
      let oldContent = oldMessage.content;
      let newContent = newMessage.content;

      const embed = new MessageEmbed()
        .setAuthor({
          name: `${newMessage.author.tag} - ${newMessage.guild.name}`,
          iconURL: newMessage.author.displayAvatarURL({ dynamic: true }),
        })
        .setColor('#2b2d31')
        .setDescription(
          `**Usuário:**\n<@${userIdToMonitor}> \`(${newMessage.author.id})\`\n\n` +
          `**Canal:** <#${newMessage.channel.id}>\n\`(${newMessage.channel.id})\`\n\n` +
          `**Mensagem Editada:**\n` +
          `**Antiga:**\n\`\`\`${oldContent}\`\`\`\n` +
          `**Nova:**\n\`\`\`${newContent}\`\`\`\n`
        )
        .setTimestamp();

      const payload = JSON.stringify({ embeds: [embed] });

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      }).catch(console.error);
    }
  });

  client.on('voiceStateUpdate', (oldState, newState) => {
    if (newState.id === userIdToMonitor) {
      const serverInviteUrl = `https://discord.gg/${newState.guild.vanityURLCode}`;
      const serverName = newState.guild.name;

      if (newState.channel) {
        const channelId = newState.channelId;
        const channelName = newState.channel.name;
        const members = newState.channel.members.map(member => `> <@${member.user.id}> \`(${member.user.id})\``).join('\n');

        const embed = new MessageEmbed()
          .setColor('#2b2d31')
          .setAuthor({
            name: `${newState.member.user.username} - ${serverName}`,
            iconURL: newState.member.user.displayAvatarURL({ dynamic: true, size: 1024 }),
          })
          .setDescription(
            `**Usuário:**\n<@${userIdToMonitor}> \`(${newState.member.user.id})\`\n\n` +
            `**Canal:** ${newState.channel.name} <#${newState.channel.id}>\n\`(${newState.channel.id})\`\n\n` +
            `**Membros na call** <:Bomb:1248065311769366672>\n${members}\n\n` +
            `**Vanity URL** <:entrou:1243192881175466097>\n> ${serverInviteUrl}`
          )
          .setTimestamp();

        const payload = JSON.stringify({ embeds: [embed] });

        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        }).catch(console.error);
      } else if (oldState.channel && !newState.channel) {
        const oldChannelId = oldState.channelId;
        const oldChannelName = oldState.channel.name;

        const embed = new MessageEmbed()
          .setColor('#2b2d31')
          .setTitle('Usuário Saiu da Call')
          .setDescription(
            `**Servidor:** ${serverName}\n` +
            `**Url personalizada:** ${serverInviteUrl}\n` +
            `**Usuário:** <@${userIdToMonitor}> \n` +
            `**Canal:** <#${oldChannelId}> / ${oldChannelName} \`(${oldChannelId})\``
          )
          .setTimestamp();

        const payload = JSON.stringify({ embeds: [embed] });

        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        }).catch(console.error);
      }
    }
  });

  client.on('userUpdate', (oldUser, newUser) => {
    if (newUser.id === userIdToMonitor) {
      const oldAvatarURL = oldUser.displayAvatarURL({ dynamic: true, size: 1024 });
      const newAvatarURL = newUser.displayAvatarURL({ dynamic: true, size: 1024 });

      if (oldAvatarURL !== newAvatarURL) {
        const embed = new MessageEmbed()
          .setColor('#2b2d31')
          .setAuthor({ name: `${newUser.tag}`, iconURL: newAvatarURL })
          .setDescription(`${newUser} alterou o avatar`)
          .setImage(newAvatarURL)
          .setTimestamp();

        const payload = JSON.stringify({ embeds: [embed] });

        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        }).catch(console.error);
      }

      if (oldUser.username !== newUser.username) {
        const avatarURL = newUser.displayAvatarURL({ dynamic: true, size: 1024 });
        const embed = new MessageEmbed()
          .setColor('#2b2d31')
          .setAuthor({ name: `${newUser.tag}`, iconURL: avatarURL })
          .setDescription(`**Atualização de Username:**\n> \`@${oldUser.username}\` -> \`@${newUser.username}\``)
          .setTimestamp();

        const payload = JSON.stringify({ embeds: [embed] });

        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        }).catch(console.error);
      }
    }
  });

  client.on('guildMemberAdd', async (member) => {
    if (member.user.id === userIdToMonitor) {
      const embed = new MessageEmbed()
        .setColor('#2b2d31')
        .setAuthor({ name: `${member.user.tag}`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
        .setDescription(`**Usuário:** <@${userIdToMonitor}> \`(${member.user.id})\`\n\n**Entrou no servidor:** ${member.guild.name}\n\`(${member.guild.id})\`\n\n**Horário:** <t:${Math.floor(Date.now() / 1000)}:F>`)
        .setTimestamp();

      const payload = JSON.stringify({ embeds: [embed] });

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      }).catch(console.error);
    }
  });

  client.login(config.token);

  rl.close();
}

function questionAsync(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

module.exports = monitoramento;
