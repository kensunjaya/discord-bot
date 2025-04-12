const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QueryType } = require("discord-player");
const os = require('os');
const si = require('systeminformation');


const getIcon = (query) => {
    if (query === QueryType.YOUTUBE || query === QueryType.YOUTUBE_PLAYLIST || query === QueryType.YOUTUBE_VIDEO || query === QueryType.YOUTUBE_SEARCH || query === 'youtube') {
        return 'https://i.imgur.com/xzVHhFY.png'
    } 
    else if (query === QueryType.SPOTIFY_SONG || query  === QueryType.SPOTIFY_ALBUM || query === QueryType.SPOTIFY_PLAYLIST || query === QueryType.SPOTIFY_SEARCH || query === 'spotify') {
        return 'https://i.imgur.com/qvdqtsc.png'
    }
    return 'https://i.imgur.com/qGIQSGW.png'
}

class EmbedMessage {
    wordScramble(obj, number, color=0x85C1E9) {
        return new EmbedBuilder()
        .setColor(color)
        .setTitle(`Question ${number}`)
        .setDescription(obj.scrambled)
        .setFooter({text: 'Unscramble the word and type your answer in the chat'})
    }

    correctAnswer(user, ws, color=0x58D68D) {
        return new EmbedBuilder()
        .setColor(color)
        .setAuthor({name: user.username, iconURL: user.displayAvatarURL(), url: user.avatarURL()})
        .setDescription(`🎉 **Correct!** The answer is \`${ws.getAnswer()}\``)
        .setFooter({text: `$1 has been added to ${user.username}'s balance`})
    }

    musicPlaying(obj, color=0xD6F7FF) {
        return new EmbedBuilder()
        .setColor(color)
        .addFields({name : 'Now Playing', value : `[${obj.cleanTitle}](<${obj.url}>)`, inline : false})
        .addFields({name : 'Duration', value : `\`${obj.duration}\``, inline : true})
        .addFields({name : 'Requester', value : `\`${obj.requestedBy.username}\``, inline : true})
        .addFields({ name : 'Source', value : `\`${obj.source.charAt(0).toUpperCase() + obj.source.slice(1)}\``, inline : true })
        .setThumbnail(`${obj.thumbnail}`)
    }

    playerInitiallyStarted(obj, color=0x85C1E9) {
        return new EmbedBuilder()
        .setColor(color)
        .setDescription('Enjoy the music! The track will be played shortly.');
    }

    alert(obj, color=0xF6546A) {
        return new EmbedBuilder()
        .setColor(color)
        .setDescription(obj)
    }
    showCommands(obj, color=0x85C1E9) {
        return new EmbedBuilder()
        .setColor(color)
        .setTitle(`Hello, ${obj.user.username}! These are all available commands`)
        .addFields({name : 'Music Player', value : '```/p``` ```/play``` ```/skip``` ```/jump``` ```/queue``` ```/stop``` ```/remove``` ```/pause``` ```/resume``` ```/loop```', inline : true})
        .addFields({name : 'Utility', value : '```/help``` ```/info``` ```/ping```', inline : true})
    }
    addPlaylist(obj, color=0xCFC7D8) {
        return new EmbedBuilder()
        .setColor(color)
        .addFields({name : `Added ${obj.tracks.length} tracks to queue`, value : `[${obj.title}](${obj.url})`, inline : false})
        .addFields({name : 'Duration', value : `\`${obj.durationFormatted}\``, inline : true})
        .addFields({name : 'Author', value : `\`${obj.author.name}\``, inline : true})
        .addFields({ name : 'Source', value : `\`${obj.source.charAt(0).toUpperCase() + obj.source.slice(1)}\``, inline : true })
        .setThumbnail(`${obj.thumbnail}`)
        .setFooter({text : `Type : ${obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}`, iconURL : getIcon(obj.source)});
    }
    async   info(obj) {
        const temp = await si.cpuTemperature();
        const cpuData = await si.cpu();
        const gpu = await si.graphics();

        const systemInformation = `OS: ${os.type()} ${os.release()}\nPlatform: ${os.platform()}\nCPU: ${cpuData.manufacturer} ${cpuData.brand} (${cpuData.speed}GHz, ${cpuData.cores} cores)\nArch: ${os.arch()}\nCPU Temperature: ${temp.main}°C\nTotal Memory: ${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB\nFree Memory: ${(os.freemem() / (1024 ** 3)).toFixed(2)} GB\nUptime: ${(os.uptime() / 60).toFixed(2)} mins`;
        const infoBuilder = `\`\`\`yaml\nCreated by @kensunjaya\nThis bot is a music player bot that can play music from Youtube and Spotify\nSince this bot is still in development, there might be some bugs and errors.\n\nSystem Information:\n${systemInformation}\`\`\``;
        if (obj.user.id === process.env.ADMIN_ROLE_ID) {
            const fetchButton = new ButtonBuilder()
                .setCustomId('fetch')
                .setLabel('UPDATE DATABASE')
                .setStyle(ButtonStyle.Secondary);
            
            const row = new ActionRowBuilder()
                .addComponents(fetchButton);

            return [infoBuilder, row];
        }

        return [infoBuilder, null];
    }
}

module.exports = { EmbedMessage }
