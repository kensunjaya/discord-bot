const { EmbedBuilder } = require('discord.js');
const { QueryType } = require("discord-player");


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
    musicPlaying(obj, color=0xD6F7FF) {
        return new EmbedBuilder()
        .setColor(color)
        .addFields({name : 'Now Playing', value : `[${obj.title}](${obj.url})`, inline : false})
        .addFields({name : 'Duration', value : `\`${obj.duration}\``, inline : true})
        .addFields({name : 'Requestor', value : `\`${obj.requestedBy.username}\``, inline : true})
        .addFields({ name : 'Source', value : `\`${obj.source}\``, inline : true })
        .setThumbnail(`${obj.thumbnail}`)
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
        .addFields({name : 'Music Player', value : '```/p``` ```/play``` ```/skip``` ```/jump``` ```/queue``` ```/stop``` ```/remove``` ```/pause``` ```/resume```', inline : true})
        .addFields({name : 'Utility', value : '```/help```', inline : true})
    }
    addPlaylist(obj, color=0xDAF7A6) {
        return new EmbedBuilder()
        .setColor(color)
        .setAuthor({ name: `Added ${obj.tracks.length} tracks to queue list`, iconURL: getIcon(obj.source), url: obj.url })
        .setDescription(`\`\`\`Title    : ${obj.title}\nDuration : ${obj.durationFormatted}\nAuthor   : ${obj.author.name}\`\`\``)
        
    }
}

module.exports = { EmbedMessage }