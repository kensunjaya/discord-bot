require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { EmbedBuilder, Client, IntentsBitField, GuildMember, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActivityType } = require('discord.js');
const { Player, QueryType, QueueRepeatMode } = require("discord-player");
const { EmbedMessage } = require('./embed.js');
const { Utility } = require('./utilities/utility.js');
const { interactionCommands } = require('./commands.js');
const { Server } = require("socket.io");
const { YoutubeiExtractor, createYoutubeiStream } = require("discord-player-youtubei")
const { SpotifyExtractor, SoundCloudExtractor } = require("@discord-player/extractor");
const e = require('cors');

const PORT = 3030;
let playerFollowedUp = true;
const io = new Server(PORT, {
    cors: {
        origin: "http://localhost:5173", // Replace with your frontend URL
        methods: ["GET", "POST"],
        allowedHeaders: "messages",
        credentials: true
    }
});

const socketMessages = [];

const prisma = new PrismaClient();

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates,
    ]
});

const player = new Player(client);
const util = new Utility();
const Embed = new EmbedMessage();
const guildHandler = new Map();
const queueHandler = new Map();

client.on('ready', (c) => {
    console.log(`${c.user.tag} is online`);
    client.user.setPresence({
        activities: [{ name: `Type !deploy to enable commands`, type: ActivityType.Custom }],
    });
    
}) // access events, listens when our bot is ready


player.events.on('playerStart', async (queue, track) => {
    if (guildHandler.get(queue.guild)) {
        try {
            if (track.url === process.env.INTRO_URL) {
                await guildHandler.get(queue.guild).followUp({embeds : [Embed.playerInitiallyStarted()], ephemeral : true});
                playerFollowedUp = true;
                return;
            }
            if (!playerFollowedUp) {
                await guildHandler.get(queue.guild).followUp({embeds : [Embed.musicPlaying(track)]});
                playerFollowedUp = true;
                return;
            }
            await guildHandler.get(queue.guild).channel.send({embeds : [Embed.musicPlaying(track)]});
        }
        catch (error) {
            console.error("Failed to follow up interaction");
            await guildHandler.get(queue.guild).channel.send({embeds : [Embed.musicPlaying(track)]});
        }
        currentTrackTimestamp = new Date().getTime();
    }
});



player.events.on('disconnect', (queue) => {
    guildHandler.delete(queue.guild);
});

player.events.on('error', (queue, error) => {
    // Emitted when the player queue encounters error
    console.log(`General player error event: ${error.message}`);
    guildHandler.get(queue.guild).channel.send({embeds : [Embed.alert("Something went wrong while working with the queue")]});
});

player.events.on('playerError', (queue, error) => {
    // Emitted when the audio player errors while streaming audio track
    console.log(`Player error event: ${error.message}`);
    guildHandler.get(queue.guild).channel.send({embeds : [Embed.alert("Error fetching the audio track")]});
});

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;
    if (message.attachments.size > 0) {
        console.log(`[${message.guild.name} (${message.channel.name})] : [${message.author.username}] >> ${message.attachments.first().url}`)
        socketMessages.push({
            timestamp: new Date().toLocaleString(),
            guild: message.guild.name,
            channel: message.channel.name,
            author: message.author.username,
            content: message.attachments.first().url,
            alt: message.attachments.first().name,
            contentType: 'image'
        });
        io.emit('message', socketMessages);
    }
    else {
        console.log(`[${message.guild.name} (${message.channel.name})] : [${message.author.username}] >> ${message.content}`)
        socketMessages.push({
            timestamp: new Date().toLocaleString(),
            guild: message.guild.name,
            channel: message.channel.name,
            author: message.author.username,
            content: message.content,
            contentType: 'text'
        });
        io.emit('message', socketMessages);
    }
    
    if (!client.application?.owner) await client.application?.fetch();

    if (message.content === "!deploy") {
        await message.guild.commands.set(interactionCommands);
        await message.reply("Bot successfully deployed! Type /help to see the list of commands");
    }
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
        console.log(`[${interaction.guild.name} (${interaction.channel.name})] : [${interaction.user.username}] => ${interaction.customId}`);
        socketMessages.push({
            timestamp: new Date().toLocaleString(),
            guild: interaction.guild.name,
            channel: interaction.channel.name,
            author: interaction.user.username,
            content: interaction.customId,
            contentType: 'interaction'
        });
        io.emit('message', socketMessages);
        if (interaction.customId === 'next') {
            const queue = player.nodes.get(interaction.guildId);
            if (!queue) return void interaction.reply({ content : "Queue list is empty. Use /play to add some tracks", ephemeral: true });
            if (queueHandler.get(interaction.channel) && queueHandler.get(interaction.channel).get(interaction.user) && (queueHandler.get(interaction.channel).get(interaction.user)[2] > new Date().getTime() - 600000)) {
                let [msg, page] = queueHandler.get(interaction.channel).get(interaction.user);
                queueHandler.get(interaction.channel).set(interaction.user, [msg, ++page, queueHandler.get(interaction.channel).get(interaction.user)[2]]);
                const [queueBuilder, row] = util.constructQueue(queue, page);
                (await msg).edit({ content : queueBuilder, components : [row]});
                return void await interaction.deferUpdate();
            }
            const [queueBuilder, row] = util.constructQueue(queue);
            const msg = await interaction.reply({ content : queueBuilder, components : [row], ephemeral: true});
            queueHandler.set(interaction.channel, new Map());
            queueHandler.get(interaction.channel).set(interaction.user, [msg, 1, new Date().getTime()]);
            
        }
        else if (interaction.customId === 'prev') {
            const queue = player.nodes.get(interaction.guildId);
            if (!queue) return void interaction.reply({ content : "Queue list is empty. Use /play to add some tracks", ephemeral: true });
            if (queueHandler.get(interaction.channel) && queueHandler.get(interaction.channel).get(interaction.user) && (queueHandler.get(interaction.channel).get(interaction.user)[2] > new Date().getTime() - 600000)) {
                let [msg, page] = queueHandler.get(interaction.channel).get(interaction.user);
                queueHandler.get(interaction.channel).set(interaction.user, [msg, --page, queueHandler.get(interaction.channel).get(interaction.user)[2]]);
                const [queueBuilder, row] = util.constructQueue(queue, page);
                (await msg).edit({ content : queueBuilder, components : [row]});
                return void await interaction.deferUpdate();
            }
            const [queueBuilder, row] = util.constructQueue(queue);
            const msg = await interaction.reply({ content : queueBuilder, components : [row], ephemeral: true});
            queueHandler.set(interaction.channel, new Map());
            queueHandler.get(interaction.channel).set(interaction.user, [msg, 1, new Date().getTime()]);
        }
        else if (interaction.customId === 'shuffle') {
            const queue = player.nodes.get(interaction.guildId);
            if (!queue || !queue.isPlaying()) return;
            if (queueHandler.get(interaction.channel) && queueHandler.get(interaction.channel).get(interaction.user) && (queueHandler.get(interaction.channel).get(interaction.user)[2] > new Date().getTime() - 600000)) {
                queue.tracks.shuffle();
                let [msg, page] = queueHandler.get(interaction.channel).get(interaction.user);
                const [queueBuilder, row] = util.constructQueue(queue, page);
                (await msg).edit({ content : queueBuilder, components : [row]});
                return void await interaction.deferUpdate();
            }
            const [queueBuilder, row] = util.constructQueue(queue);
            const msg = await interaction.channel.send({ content : queueBuilder, components : [row], ephemeral: true});
            queueHandler.set(interaction.channel, new Map());
            queueHandler.get(interaction.channel).set(interaction.user, [msg, 1, new Date().getTime()]);
        }
        else if (interaction.customId === 'refresh') {
            const queue = player.nodes.get(interaction.guildId);
            if (!queue || !queue.isPlaying()) return;
            if (queueHandler.get(interaction.channel) && queueHandler.get(interaction.channel).get(interaction.user) && (queueHandler.get(interaction.channel).get(interaction.user)[2] > new Date().getTime() - 600000)) {
                let [msg, page] = queueHandler.get(interaction.channel).get(interaction.user);
                if (!queue) {
                    (await msg).edit({ content : '```QUEUE LIST IS EMPTY. Use /play to add some tracks```', components : []});
                }
                else {
                    const [queueBuilder, row] = util.constructQueue(queue, page);
                    (await msg).edit({ content : queueBuilder, components : [row]});
                }
                return void await interaction.deferUpdate();
            }
            const [queueBuilder, row] = util.constructQueue(queue);
            const msg = await interaction.channel.send({ content : queueBuilder, components : [row], ephemeral: true});
            queueHandler.set(interaction.channel, new Map());
            queueHandler.get(interaction.channel).set(interaction.user, [msg, 1, new Date().getTime()]);
        }
        else if (interaction.customId === 'skip') {
            try {
                const queue = player.nodes.get(interaction.guildId);
                if (!queue || !queue.isPlaying()) return;
                if (!queue.tracks.data.length) {
                    await interaction.channel.send({ embeds: [Embed.alert('⏹️  Player closed due to empty queue', 0xDEB600)] });
                    await interaction.deferUpdate();
                    return void queue.delete();
                }
                queue.node.skipTo(queue.tracks.data[0]);
                if (queueHandler.get(interaction.channel) && queueHandler.get(interaction.channel).get(interaction.user) && (queueHandler.get(interaction.channel).get(interaction.user)[2] > new Date().getTime() - 600000)) {
                    try {
                        let [msg, page] = queueHandler.get(interaction.channel).get(interaction.user);
                        const [queueBuilder, row] = util.constructQueue(queue, page);
                        (await msg).edit({ content : queueBuilder, components : [row]});
                        return void await interaction.deferUpdate();
                    }
                    catch (err) {
                        return void console.log("Error : " + err);
                    }
                }
                const [queueBuilder, row] = util.constructQueue(queue);
                const msg = await interaction.channel.send({ content : queueBuilder, components : [row], ephemeral: true});
                queueHandler.set(interaction.channel, new Map());
                queueHandler.get(interaction.channel).set(interaction.user, [msg, 1, new Date().getTime()]);
            }
            catch (error) {
                console.log(error);
                return void interaction.channel.send(`Something went wrong: ${error.message}`);
            }
            
        }
        else if (interaction.customId === 'fetch') {
            const guilds = client.guilds.cache.map(guild => {
                return {
                    guild_id: guild.id,
                    guild_name: guild.name,
                    guild_members: guild.members
                };
            });
            console.log(guilds) // this feature is not finished yet
            await interaction.deferUpdate();
        }
    }
    

    if (!interaction.isCommand() || !interaction.guildId) return;

    if (interaction.commandName === "ping") {
        await interaction.deferReply();
        const reply = await interaction.fetchReply();
        const ping = reply.createdTimestamp - interaction.createdTimestamp;
        return void interaction.followUp({content : `\`\`\`elm\nPong!\nUser's latency : ${ping} ms\nBot's latency  : ${client.ws.ping} ms\`\`\``});
    }
    else if (interaction.commandName === "help") {
        return void interaction.reply({ embeds : [Embed.showCommands(interaction)], ephemeral : true });
    }
    else if (interaction.commandName === "info") {
        const [content, row] = Embed.info(interaction);
        return void interaction.reply({ content : content, components : row ? [row] : null, ephemeral : true });
    }

    if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
        return void interaction.reply({ content: "You are not in a voice channel!", ephemeral: true });
    }

    await player.extractors.register(SpotifyExtractor, {
        createStream: createYoutubeiStream,
    })
    await player.extractors.register(YoutubeiExtractor, {
        streamOptions: {
            useClient: 'ANDROID',
        },
        overrideBridgeMode: 'ytmusic',
    });
    await player.extractors.register(SoundCloudExtractor, {});


    console.log(`[${interaction.guild.name} (${interaction.channel.name})] : [${interaction.user.username}] => ${interaction}`);

    socketMessages.push({
        timestamp: new Date().toLocaleString(),
        guild: interaction.guild.name,
        channel: interaction.channel.name,
        author: interaction.user.username,
        content: interaction.toString(),
        contentType: 'interaction'
    });
    io.emit('message', socketMessages);

    if (interaction.commandName === "play" || interaction.commandName === "p") {
        await interaction.deferReply();
        const query = interaction.options.get("query").value;
        const search_engine = interaction.options.get("search_engine");

        const queue = player.nodes.create(interaction.guild, {
            metadata: interaction.channel,
            leaveOnEmpty: false,
            leaveOnEnd: false,
            selfDeaf: true,
            volume: 100,
        });

        if (!queue.isPlaying() && !queue.connection) {
            guildHandler.set(interaction.guild, interaction);
            await player
            .search(process.env.INTRO_URL, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE,
            })
            .catch((error) => {
                console.log(error);
            }).then(async (result) => {
                queue.addTrack(result.tracks[0]);
            });
        }

        let searchResult = await player
        .search(query, {
            requestedBy: interaction.user,
            searchEngine: search_engine ? search_engine.value : QueryType.AUTO,
        })
        .catch((error) => {
            console.log(error);
        });

        let similarity = 0;

        if (!searchResult || !searchResult.tracks.length) {
            if (search_engine && search_engine.type != 3) {
                await interaction.followUp({ content: "No results were found!" });
            }
            const availableEngines = [QueryType.SPOTIFY_PLAYLIST,
                QueryType.SPOTIFY_ALBUM,
                QueryType.SPOTIFY_SONG]
            if (!search_engine) {
                availableEngines.push(QueryType.YOUTUBE);
                availableEngines.push(QueryType.YOUTUBE_PLAYLIST);
                availableEngines.push(QueryType.SOUNDCLOUD);
            }
            for (const element of availableEngines) {
                searchResult = await player
                .search(query, {
                    requestedBy: interaction.user,
                    searchEngine: element
                })
                .catch(() => {});
                if (searchResult) break;
            }
            if (!searchResult || !searchResult.tracks.length) {
                return await interaction.followUp({ content: "No results were found!" });
            }
        }

        if (searchResult) {
            // Check for query and result similarity
            similarity = util.findSimilarity(query, searchResult.tracks[0].url);
            if (similarity < 0.8) {
                let parameters = [searchResult.tracks[0].cleanTitle, searchResult.tracks[0].description];
                for (const element of parameters) {
                    const tempSimilarity = util.findSimilarity(query, element);
                    if (tempSimilarity > similarity) similarity = tempSimilarity;
                    if (similarity >= 0.25) break;
                }
                if (similarity < 0.05) {
                    const lyrics = await player.lyrics.search({
                        q: searchResult.tracks[0].cleanTitle
                    })
                    if (!lyrics.length) return await interaction.followUp({embeds: [Embed.alert(`No close matches found for **"${query}"**. Please try refining your search.`)]});

                    similarity = util.findSimilarity(query, lyrics[0].plainLyrics);
                    await interaction.followUp({
                        embeds: [Embed.alert(`Your search for **"${query}"** didn't closely match any track titles, but I found a track whose lyrics may relate to your search: **"${searchResult.tracks[0].cleanTitle}"**.`, 0xFFCC00)],
                        ephemeral: true
                    });
                }
                else if (similarity < 0.25) {
                    await interaction.followUp({
                        embeds: [Embed.alert(`Your search for "${query}" has a low similarity to any results. The closest match is **"${searchResult.tracks[0].cleanTitle}"** **[${Math.round(similarity*100)}%]**`, 0xFFCC00)],
                        ephemeral: true
                    });
                }
            }
            console.log("Similarity:", similarity);
        }

        guildHandler.set(interaction.guild, interaction);
        playerFollowedUp = false;

        
        try {
            if (!queue.connection) await queue.connect(interaction.member.voice.channel);
        } catch {
            await player.deleteQueue(interaction.guildId);
            return await interaction.followUp({ content: "Could not join your voice channel!" });
        }

        if (searchResult.playlist) {
            searchResult.playlist.tracks.map(track => {
                queue.addTrack(track);
                
            });
            await interaction.followUp({embeds : [Embed.addPlaylist(searchResult.playlist)]});
        }
        else {
            queue.addTrack(searchResult.tracks[0]);
        }

        if (!queue.isPlaying()) {
            await queue.node.play(queue.tracks.data[0]);
            // await interaction.followUp({embeds : [Embed.musicPlaying(queue.currentTrack)]});
            queue.removeTrack(queue.tracks.data[0]);
            
            return;
        }

        if (!searchResult.playlist) {
            await interaction.followUp(`📔 | Added [${searchResult.tracks[0].description}](<${searchResult.tracks[0].url}>) to queue **[${Math.round(similarity*100)}% match]**`);
        }
    } 

    else if (interaction.commandName === "skip") {
        try {
            const queue = player.nodes.get(interaction.guildId);
        
            if (!queue || !queue.isPlaying()) {
                return await interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true});
            }
            await interaction.deferReply();
            if (!queue.tracks.data.length) {
                await interaction.followUp({ embeds: [Embed.alert('⏹️  Player closed due to empty queue', 0xDEB600)] });
                return queue.delete();
            }
            
            const success = queue.node.skipTo(queue.tracks.data[0]);

            
            return await interaction.followUp({
                embeds: success ? [Embed.alert(`Skipped track to **${queue.tracks.data[0].description}**`, 0x85C1E9)] : [Embed.alert("Something went wrong while we were trying to skip the current track. Try again later")]
            });
        }
        catch (error) {
            console.log(error);
            return await interaction.reply(`Something went wrong: ${error.message}`);
        }  
    } 

    else if (interaction.commandName === "lyrics") {
        const queue = player.nodes.get(interaction.guildId);
        if (queue.currentTrack.source !== "spotify") {
            return await interaction.reply({ embeds: [Embed.alert("This command only works with Spotify tracks")] });
        }

        if (!player.nodes.get(interaction.guildId) || !player.nodes.get(interaction.guildId).isPlaying()) {
            return await interaction.reply({ embeds: [Embed.alert("No music is being played!")] });
        }
        
        try {
            const lyrics = await player.lyrics.search({
                q: queue.currentTrack.author + " " + queue.currentTrack.cleanTitle,
                trackName: queue.currentTrack.cleanTitle,
                artistName: queue.currentTrack.author,
            });
            if (!lyrics.length) {
                return await interaction.reply({ embeds: [Embed.alert("No lyrics found for this track")] });
            }
    
            const first = lyrics[0];
            if (!first.syncedLyrics) {
                return await interaction.reply({ embeds: "```" + first.plainLyrics + "```" });
            }
            
            const syncedLyrics = queue.syncedLyrics(first);
    
            let lyricsBuilder = "```yaml\n";
    
            syncedLyrics.onChange(async (lyrics, timestamp) => {
                // timestamp = timestamp in lyrics (not queue's time)
                // lyrics = line in that timestamp
                console.log(timestamp, lyrics);
                if (lyricsBuilder.length + lyrics.length < 1900) {
                    lyricsBuilder += `[${Math.round(timestamp / queue.currentTrack.durationMS * 100)}%]: ${lyrics}\n`;
                    await interaction.editReply({
                        content: lyricsBuilder + "```"
                    });
                }
                else {
                    lyricsBuilder = "```yaml\n";
                    lyricsBuilder += `[${Math.round(timestamp / queue.currentTrack.durationMS * 100)}%]: ${lyrics}\n`;
                    await interaction.editReply({
                        content: lyricsBuilder + "```"
                    });
                }
            });
    
            syncedLyrics.subscribe();
            await interaction.reply({ content: "```yaml\nLive lyrics is now enabled```" });

        } catch (error) {
            console.log(error);
            return await interaction.reply({ embeds: [Embed.alert("Failed to fetch lyrics. Please try again later")] });
        }
    }


    else if (interaction.commandName === "loop") {
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            return await interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true});
        }
        await interaction.deferReply();
        const state = interaction.options.get("condition").value;
        if (state === "on") {
            queue.setRepeatMode(QueueRepeatMode.QUEUE);
            await interaction.followUp({ embeds: [Embed.alert('🔁  Repeat mode : ON', 0xBBCEB2)] });
        }
        else if (state === "off") {
            queue.setRepeatMode(QueueRepeatMode.OFF);
            await interaction.followUp({ embeds: [Embed.alert('🔁  Repeat mode : OFF', 0xFF5520)] });
        }
    }

    else if (interaction.commandName === "stop") {
        const queue = player.nodes.get(interaction.guildId);

        if (!queue || !queue.isPlaying()) {
            return void interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true });
        }
        
        queue.delete();
        await interaction.deferReply();
        return void interaction.followUp({ content: "⏹️  Player stopped!" });
    } 

    else if (interaction.commandName === "queue") {
        const queue = player.nodes.get(interaction.guildId);

        if (!queue || !queue.isPlaying()) return void interaction.reply({ content : "Queue list is empty. Use /play to add some tracks", ephemeral: true });
        const [queueBuilder, row] = util.constructQueue(queue);
        
        const msg = await interaction.reply({ content : queueBuilder, components : [row], ephemeral: true});
        
        queueHandler.set(interaction.channel, new Map());
        queueHandler.get(interaction.channel).set(interaction.user, [msg, 1, new Date().getTime()]);
    } 

    else if (interaction.commandName === "remove") {
        const index = interaction.options.get("index").value;
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            return void interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true});
        }
        if (index < 1 || index > queue.tracks.data.length) {
            return void interaction.reply({ embeds: [Embed.alert(`Index must be in between 1 to ${queue.tracks.data.length}`)] , ephemeral: true})
        }
        const trackToRemove = queue.tracks.data[index-1]
        const success = queue.removeTrack(trackToRemove);
        await interaction.deferReply();
        return void interaction.followUp({
            embeds: success ? [Embed.alert(`Removed ${trackToRemove.cleanTitle} from queue`, 0x6FA8DC)] : [Embed.alert(`Failed to remove ${trackToRemove.cleanTitle} from queue`)]
        });
    } 
    else if (interaction.commandName === "pause") {
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            return void interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true});
        }
        if (!queue.node.isPaused()) {
            const success = queue.node.pause();
            await interaction.deferReply();
            return void interaction.followUp({embeds : success ? [Embed.alert('Track paused. Use **/resume** to resume', 0xF0B27A)] : [Embed.alert('Something went wrong while trying to pause the current track')]});
        }
        
        return void interaction.reply({content : 'Player is already paused. Use **/resume** to resume', ephemeral : true});
    }
    else if (interaction.commandName === "resume") {
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            return void interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true});
        }
        if (!queue.node.isPaused()) {
            return void interaction.reply({content : 'Player is currently not paused', ephemeral : true});   
        }
        await interaction.deferReply();
        const success = queue.node.resume();
        return void interaction.followUp({embeds : success ? [Embed.alert('Track resumed playing',  0x73C6B6)] : [Embed.alert('Something went wrong while trying to resume the current track')]});
    }
    else if (interaction.commandName === "jump") {
        const index = interaction.options.get("index").value;
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            return void interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true});
        }
        if (index < 1 || index > queue.tracks.data.length) {
            return void interaction.reply({ embeds: [Embed.alert(`Index must be in between 1 to ${queue.tracks.data.length}`)] , ephemeral: true})
        }
        await interaction.deferReply();
        
        if (queue.repeatMode === QueueRepeatMode.QUEUE) {
            for (let i=0;i<index-1;i++) {
                queue.addTrack(queue.tracks.data[0]);
                if (!queue.removeTrack(queue.tracks.data[0])) {
                    return void interaction.followUp({embed : [Embed.alert(`Something went wrong`)]});
                }
            }
            queue.node.skipTo(queue.tracks.data[0]);
        }
        else queue.node.skipTo(queue.tracks.data[index-1]);

        return void interaction.followUp({
            embeds: [Embed.alert(`Skipped ${index-1} tracks`, 0x6FA8DC)]
        });
    }
    else if (interaction.commandName === "shuffle") {
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            return void interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true});
        }
        await interaction.deferReply();
        queue.tracks.shuffle();
        return void interaction.followUp({
            embeds: queue.tracks.data ? [Embed.alert(`Shuffled the playlist!`, 0x73C6B6)] : [Embed.alert('Cannot shuffle the current playlist')]
        });
    }
    else {
        interaction.reply({
            content: "Unknown command!",
            ephemeral: true
        });
    }
});

module.exports = { client, socketMessages };
client.login(process.env.TOKEN);
