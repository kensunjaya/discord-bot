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

    wordTokenize(text) {
        return text.match(/\b\w+\b/g) || [];
    }

    findSimilarity = (str1, str2) => {
        str1 = str1.toLowerCase();
        str2 = str2.toLowerCase();
        const word = [str1, str2];
        const d = [];
        let max = 0;

        for (let i = 0; i < word.length; i++) {
            d.push({});
            const tokens = this.wordTokenize(word[i]);
            for (const j of tokens) {
                if (d[i][j]) {
                    d[i][j] += 1;
                } else {
                    d[i][j] = 1;
                }
            }
            if (Object.keys(d[i]).length > max) {
                max = Object.keys(d[i]).length;
            }
        }

        let a = 0;
        for (const i in d[0]) {
            if (d[1][i]) {
                a += d[0][i] * d[1][i];
            }
        }

        let b = 1;
        for (const i of d) {
            let temp = 0;
            for (const j in i) {
                temp += i[j] ** 2;
            }
            b *= Math.sqrt(temp);
        }

        return (a / b);
    }

    constructQueue = (queue, page=1) => {
        let queueBuilder = '```json\n' + `IN QUEUE - [${queue.tracks.data.length} Tracks]\n\n`;
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