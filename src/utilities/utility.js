const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class Utility {
    formatDuration = (ms) => {
        const time = {
          day: Math.floor(ms / 86400000),
          hour: Math.floor(ms / 3600000) % 24,
          minute: Math.floor(ms / 60000) % 60,
          second: Math.floor(ms / 1000) % 60,
        };
        let formatBuilder = '';
        time.day ? formatBuilder += (time.day.toString() + 'd ') : null;
        time.hour ? formatBuilder += (time.hour.toString() + 'h ') : null;
        time.minute ? formatBuilder += (time.minute.toString() + 'm ') : null;
        formatBuilder += (time.second.toString() + 's');
        return formatBuilder;
    };
    constructQueue = (queue, page=1) => {
        let queueBuilder = '```json\n' + `SHOWING QUEUE - [${queue.tracks.data.length} Tracks]\n\n`;
        queueBuilder += `► Now playing ${queue.currentTrack.description}\n`
        let tempQueue = '';
        let estDuration = queue.currentTrack.durationMS;
        const tracks = queue.tracks.data;
        const totalPage = tracks.length ? Math.ceil(tracks.length / 25) : 1;
    
        const next = new ButtonBuilder()
            .setCustomId('next')
            .setLabel('>')
            .setStyle(ButtonStyle.Secondary);
    
        const prev = new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('<')
            .setStyle(ButtonStyle.Secondary);
        
        const shuffle = new ButtonBuilder()
            .setCustomId('shuffle')
            .setLabel('Shuffle')
            .setStyle(ButtonStyle.Primary);
        
        const refresh = new ButtonBuilder()
            .setCustomId('refresh')
            .setLabel('Refresh')
            .setStyle(ButtonStyle.Success);
        const skip = new ButtonBuilder()
            .setCustomId('skip')
            .setLabel('Skip')
            .setStyle(ButtonStyle.Primary);
        
        const info = new ButtonBuilder()
            .setCustomId('info')
            .setLabel('?')
            .setStyle(ButtonStyle.Danger);
    
        const row = new ActionRowBuilder()
            .addComponents(prev, next, shuffle, skip, refresh);
    
        if (page >= totalPage) {
            next.setDisabled(true);
            page = totalPage;
        }
        if (page <= 1) {
            prev.setDisabled(true);
            page = 1;
        }
        for (let i=(page-1)*25;i<page*25;i++) {
            if (i >= tracks.length) break;
            if ((tempQueue + `${i+1}. ${tracks[i].description} -- 【${tracks[i].duration}】\n`).length < 1800) {
                tempQueue += `${i+1}. ${tracks[i].description} -- 【${tracks[i].duration}】\n`;
            } else {
                break;
            }
        }
        queue.tracks.data.forEach((track) => {
            estDuration += track.durationMS;
        })
        queueBuilder += tempQueue;
        queueBuilder +=  `Page ${page} of ${totalPage}\n\n⬑ Estimated duration : ${new Utility().formatDuration(estDuration)}`;
        if (queue.repeatMode === 2) {
            queueBuilder += ' [♾️]\nRepeat mode : ON';
        }
        queueBuilder += '```';
        return [queueBuilder, row];
    }
}

module.exports = { Utility }