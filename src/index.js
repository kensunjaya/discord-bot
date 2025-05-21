require('dotenv').config();
// const { PrismaClient } = require('@prisma/client');
const { EmbedBuilder, Client, IntentsBitField, GuildMember, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActivityType } = require('discord.js');
const { Player, QueryType, QueueRepeatMode } = require("discord-player");
const { EmbedMessage } = require('./embed.js');
const { Utility } = require('./utilities/utility.js');
const { interactionCommands } = require('./commands.js');
const { Server } = require("socket.io");
const { YoutubeiExtractor, createYoutubeiStream } = require("discord-player-youtubei")
const { SpotifyExtractor, SoundCloudExtractor } = require("@discord-player/extractor");
const { WordScramble, Participant } = require('./game.js');
const { MongoWorker } = require('./utilities/dbworker.js');
const { GoogleGenAI } = require('@google/genai');
const fetch = require('node-fetch');
const e = require('cors');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const training_dataset = [
    ["Hina foto ini", "Kayak anak hilang aja!"],
    ["Hina foto ini", "Idih najis banget, kayak monyet!"],
    ["Hina foto ini", "Pernah ga sih lagi makan tiba-tiba pengen muntah? Ya gara-gara ngeliat foto lo!"],
    ["Hina foto ini", "Ew, kek makanan kucing!"],
    ["Hina foto ini", "Kucel banget kayak gembel!"],
    ["Hina foto ini", "Ngeri amat, kayak setan!"],
    ["Hina foto ini", "Macam psikopat!"],
    ["Hina foto ini", "Main terus! Gak ada kerjaan lain?"],
    ["Hina foto ini", "Gak ada otak ya?"],
    ["Hina foto ini", "Kayak orang gila!"],
    ["Hina foto ini", "Kayak anak hilang aja!"],
    ["Hina foto ini", "Bisa main ga sih? Cupu banget!"],
    ["Hina foto ini", "Ikan hiu makan tomat, idih najisnyo!"],
];


const PORT = 3030;
let playerFollowedUp = true;
const mongo = new MongoWorker(process.env.MONGO_URI, "discord-bot");
const io = new Server(PORT, {
    cors: {
        origin: "http://localhost:5173", // Replace with your frontend URL
        methods: ["GET", "POST"],
        allowedHeaders: "messages",
        credentials: true
    }
});

const socketMessages = [];

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
const wordScrambleChannels = new Map();

function buildFewShotPrompt(dataset, task) {
  let prompt = "";
  for (const [input, output] of dataset) {
    prompt += `Q: ${input}\nA: ${output}\n`;
  }
  prompt += `Q: ${task}\nA:`;
  return prompt;
}

client.on('ready', async (c) => {
    console.log(`${c.user.tag} is online`);
    client.user.setPresence({
        activities: [{ name: `Type !deploy to enable commands`, type: ActivityType.Custom }],
    });

    await player.extractors.register(YoutubeiExtractor, {
        //authentication: access_token,
        //generateWithPoToken:true,
        //streamOptions: {
        //    useClient: 'WEB',
        //},
        //overrideBridgeMode: 'ytmusic',
    });
    //await player.extractors.register(SpotifyExtractor, {
        //createStream: createYoutubeiStream,
    //})
    //await player.extractors.register(SoundCloudExtractor, {});
});


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
    }
});



player.events.on('disconnect', (queue) => {
    guildHandler.delete(queue.guild);
});

player.events.on('error', (queue, error) => {
    // Emitted when the player queue encounters error
    console.log(`General player error event: ${error.message}`);
    guildHandler.get(queue.guild).channel.send({embeds : [Embed.alert("Failed to fetch audio stream data")]});
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

        try {
            const imageUrl = message.attachments.first().url;
            const response = await fetch(imageUrl);
            const imageArrayBuffer = await response.arrayBuffer();
            const base64ImageData = Buffer.from(imageArrayBuffer).toString('base64');

            const prompt = buildFewShotPrompt(training_dataset, "Hina foto ini dalam 1 kalimat bahasa gaul");

            const result = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: [
                {
                    inlineData: {
                    mimeType: 'image/webp',
                    data: base64ImageData,
                    },
                },
                { text: prompt }
                ],
            });

            await message.reply(result.text)
        } catch (error) {
            console.error("Error processing image:", error);
        }
        
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
        if (wordScrambleChannels.has(message.channel) && message.content === wordScrambleChannels.get(message.channel).getAnswer()) {
            wordScrambleChannels.get(message.channel).addPlayer(new Participant(message.author.username, message.author.id));
            await message.reply({embeds : [Embed.correctAnswer(message.author, wordScrambleChannels.get(message.channel))]});
            await util.getScrambledWord().then(word => {
                wordScrambleChannels.get(message.channel).setQuestion(word.scrambled);
                wordScrambleChannels.get(message.channel).setAnswer(word.answer);
                wordScrambleChannels.get(message.channel).incrementQuestionNumber();
                message.channel.send({ embeds : [Embed.wordScramble(word, wordScrambleChannels.get(message.channel).getQuestionNumber())]})
            });
            await mongo.findOne("Users", { userId: message.author.id }).then(async user => {
                if (!user) {
                    await mongo.insertOne("Users", {
                        name: message.author.username,
                        userId: message.author.id,
                        balance: { 'usd': 1 }
                    });
                }
                else {
                    await mongo.updateOne("Users", { userId: message.author.id }, { balance: { 'usd': user.balance.usd + 1 } });
                }
            });
        }
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
            if (!queue) return await interaction.reply({ content : "Queue list is empty. Use /play to add some tracks", ephemeral: true });
            if (queueHandler.get(interaction.channel) && queueHandler.get(interaction.channel).get(interaction.user) && (queueHandler.get(interaction.channel).get(interaction.user)[2] > new Date().getTime() - 600000)) {
                let [msg, page] = queueHandler.get(interaction.channel).get(interaction.user);
                queueHandler.get(interaction.channel).set(interaction.user, [msg, ++page, queueHandler.get(interaction.channel).get(interaction.user)[2]]);
                const [queueBuilder, row] = util.constructQueue(queue, page);
                (await msg).edit({ content : queueBuilder, components : [row]});
                return await await interaction.deferUpdate();
            }
            const [queueBuilder, row] = util.constructQueue(queue);
            const msg = await interaction.reply({ content : queueBuilder, components : [row], ephemeral: true});
            queueHandler.set(interaction.channel, new Map());
            queueHandler.get(interaction.channel).set(interaction.user, [msg, 1, new Date().getTime()]);
            
        }
        else if (interaction.customId === 'prev') {
            const queue = player.nodes.get(interaction.guildId);
            if (!queue) return await interaction.reply({ content : "Queue list is empty. Use /play to add some tracks", ephemeral: true });
            if (queueHandler.get(interaction.channel) && queueHandler.get(interaction.channel).get(interaction.user) && (queueHandler.get(interaction.channel).get(interaction.user)[2] > new Date().getTime() - 600000)) {
                let [msg, page] = queueHandler.get(interaction.channel).get(interaction.user);
                queueHandler.get(interaction.channel).set(interaction.user, [msg, --page, queueHandler.get(interaction.channel).get(interaction.user)[2]]);
                const [queueBuilder, row] = util.constructQueue(queue, page);
                (await msg).edit({ content : queueBuilder, components : [row]});
                return await await interaction.deferUpdate();
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
                return await await interaction.deferUpdate();
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
                return await await interaction.deferUpdate();
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
                    return await queue.delete();
                }
                queue.node.skipTo(queue.tracks.data[0]);
                if (queueHandler.get(interaction.channel) && queueHandler.get(interaction.channel).get(interaction.user) && (queueHandler.get(interaction.channel).get(interaction.user)[2] > new Date().getTime() - 600000)) {
                    try {
                        let [msg, page] = queueHandler.get(interaction.channel).get(interaction.user);
                        const [queueBuilder, row] = util.constructQueue(queue, page);
                        (await msg).edit({ content : queueBuilder, components : [row]});
                        return await await interaction.deferUpdate();
                    }
                    catch (err) {
                        return await console.log("Error : " + err);
                    }
                }
                const [queueBuilder, row] = util.constructQueue(queue);
                const msg = await interaction.channel.send({ content : queueBuilder, components : [row], ephemeral: true});
                queueHandler.set(interaction.channel, new Map());
                queueHandler.get(interaction.channel).set(interaction.user, [msg, 1, new Date().getTime()]);
            }
            catch (error) {
                console.log(error);
                return await interaction.channel.send(`Something went wrong: ${error.message}`);
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
        else if (interaction.customId === 'refreshInfo') {
            const [content, row] = await Embed.info(interaction);
            try {
                return await interaction.reply({ content : content, components : row ? [row] : null, ephemeral : true });
            }
            catch (error) {
                console.error("Failed to refresh info");
                return;
            }
        }
    }
    

    if (!interaction.isCommand() || !interaction.guildId) return;

    if (interaction.commandName === "ping") {
        await interaction.deferReply({ ephemeral: true });
        const reply = await interaction.fetchReply();
        const ping = reply.createdTimestamp - interaction.createdTimestamp;
        return await interaction.followUp({content : `\`\`\`elm\nPong!\nUser's latency : ${ping} ms\nBot's latency  : ${client.ws.ping} ms\`\`\``});
    }
    else if (interaction.commandName === "balance") {
        await mongo.findOne("Users", { userId: interaction.user.id }).then(async user => {
            if (!user) {
                await mongo.insertOne("Users", {
                    name: interaction.user.username,
                    userId: interaction.user.id,
                    balance: { 'usd': 0 }
                }).then(() => {
                    return interaction.reply({ content: `Your current balance is $0`, ephemeral: true });
                });
            }
            else {
                return interaction.reply({ content: `Your current balance is $${user.balance.usd}`, ephemeral: true });
            }
        });
        return;
    }
    else if (interaction.commandName === "ws") {
        const state = interaction.options.get('condition').value;   
        if (state === "start") {
            if (wordScrambleChannels.has(interaction.channel)) {
                await interaction.reply({ content: "A game is already running in this channel!", ephemeral: true });
            }
            else {
                
                await util.getScrambledWord().then(word => {
                    const ws = new WordScramble(word.scrambled, word.answer);
                    wordScrambleChannels.set(interaction.channel, ws);
                    interaction.channel.send({ embeds : [Embed.wordScramble(word, ws.getQuestionNumber())]})
                });
            }
        }
        else {
            if (!wordScrambleChannels.has(interaction.channel)) {
                await interaction.reply({ content: "Word scramble is currently not started yet!", ephemeral: true });
            }
            else {
                wordScrambleChannels.delete(interaction.channel);
                await interaction.reply({ content: "Thank you for playing word scramble!"});
            }
        }
        return;
    }

    else if (interaction.commandName === "help") {
        return await interaction.reply({ embeds : [Embed.showCommands(interaction)], ephemeral : true });
    }
    else if (interaction.commandName === "info") {
        const [content, row] = await Embed.info(interaction);
        return await interaction.reply({ content : content, components : row ? [row] : null, ephemeral : true });
    }

    if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
        return await interaction.reply({ content: "You are not in a voice channel!", ephemeral: true });
    }
    



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
        console.log("play command called");
        await interaction.deferReply();
        const query = interaction.options.get("query").value;
        const search_engine = interaction.options.get("search_engine");
        console.log("got params");
        
        const queue = player.nodes.create(interaction.guild, {
            metadata: interaction.channel,
            leaveOnEmpty: false,
            leaveOnEnd: false,
            selfDeaf: true,
            volume: 100,
        });
        
        console.log("player nodes created");

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
            console.log("player created");
        }

        let searchResult = await player
        .search(query, {
            requestedBy: interaction.user,
            searchEngine: search_engine ? search_engine.value : QueryType.AUTO,
        })
        .catch((error) => {
            console.log(error);
        });
        console.log("found a result");

        let similarity = 0;

        if (!searchResult || !searchResult.tracks.length) {
            if (search_engine && search_engine.type != 3) {
                await interaction.followUp({ content: "No results were found!" });
            }
            /*const availableEngines = [QueryType.SPOTIFY_PLAYLIST,
                QueryType.SPOTIFY_ALBUM,
                QueryType.SPOTIFY_SONG]*/
            const availableEngines = []
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
                console.log(searchResult);
                //return await interaction.followUp({ content: "No results were found!" });
            }
        }

        if (searchResult.tracks.length) {
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
                    if (!lyrics.length || !lyrics[0].plainLyrics) return await interaction.followUp({embeds: [Embed.alert(`No close matches found for **"${query}"**. Please try refining your search.`)]});

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
            queue.removeTrack(queue.tracks.data[0]);
            
            return;
        }

        if (!searchResult.playlist) {
            await interaction.followUp(`📔 | Added [${searchResult.tracks[0].description ?? searchResult.tracks[0].title}](<${searchResult.tracks[0].url}>) to queue **[${Math.round(similarity*100)}% match]**`);
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
                embeds: success ? [Embed.alert(`Skipped track to **${queue.tracks.data[0].description ?? queue.tracks.data[0].title}**`, 0x85C1E9)] : [Embed.alert("Something went wrong while we were trying to skip the current track. Try again later")]
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
                return await interaction.reply({ content: "```" + first.plainLyrics + "```" });
            }

            
            const syncedLyrics = queue.syncedLyrics(first);
            
            let lyricsBuilder = "```md\n";
            await interaction.reply({ content: "```make\nLive lyrics is now enabled. Keep in mind that the generated lyrics might not be 100% accurate as this feature is still in early development```" });
            
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
                    lyricsBuilder = "```md\n";
                    lyricsBuilder += `[${Math.round(timestamp / queue.currentTrack.durationMS * 100)}%]: ${lyrics}\n`;
                    await interaction.editReply({
                        content: lyricsBuilder + "```"
                    });
                }
            });
    
            syncedLyrics.subscribe();
            

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
            return await interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true });
        }
        
        queue.delete();
        await interaction.deferReply();
        return await interaction.followUp({ content: "⏹️  Player stopped!" });
    }

    else if (interaction.commandName === "queue") {
        const queue = player.nodes.get(interaction.guildId);

        if (!queue || !queue.isPlaying()) return await interaction.reply({ content : "Queue list is empty. Use /play to add some tracks", ephemeral: true });
        const [queueBuilder, row] = util.constructQueue(queue);
        
        const msg = await interaction.reply({ content : queueBuilder, components : [row], ephemeral: true});
        
        queueHandler.set(interaction.channel, new Map());
        queueHandler.get(interaction.channel).set(interaction.user, [msg, 1, new Date().getTime()]);
    } 

    else if (interaction.commandName === "remove") {
        const index = interaction.options.get("index").value;
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            return await interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true});
        }
        if (index < 1 || index > queue.tracks.data.length) {
            return await interaction.reply({ embeds: [Embed.alert(`Index must be in between 1 to ${queue.tracks.data.length}`)] , ephemeral: true})
        }
        const trackToRemove = queue.tracks.data[index-1]
        const success = queue.removeTrack(trackToRemove);
        await interaction.deferReply();
        return await interaction.followUp({
            embeds: success ? [Embed.alert(`Removed ${trackToRemove.cleanTitle} from queue`, 0x6FA8DC)] : [Embed.alert(`Failed to remove ${trackToRemove.cleanTitle} from queue`)]
        });
    } 
    else if (interaction.commandName === "pause") {
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            return await interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true});
        }
        if (!queue.node.isPaused()) {
            const success = queue.node.pause();
            await interaction.deferReply();
            return await interaction.followUp({embeds : success ? [Embed.alert('Track paused. Use **/resume** to resume', 0xF0B27A)] : [Embed.alert('Something went wrong while trying to pause the current track')]});
        }
        
        return await interaction.reply({content : 'Player is already paused. Use **/resume** to resume', ephemeral : true});
    }
    else if (interaction.commandName === "resume") {
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            return await interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true});
        }
        if (!queue.node.isPaused()) {
            return await interaction.reply({content : 'Player is currently not paused', ephemeral : true});   
        }
        await interaction.deferReply();
        const success = queue.node.resume();
        return await interaction.followUp({embeds : success ? [Embed.alert('Track resumed playing',  0x73C6B6)] : [Embed.alert('Something went wrong while trying to resume the current track')]});
    }
    else if (interaction.commandName === "jump") {
        const index = interaction.options.get("index").value;
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            return await interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true});
        }
        if (index < 1 || index > queue.tracks.data.length) {
            return await interaction.reply({ embeds: [Embed.alert(`Index must be in between 1 to ${queue.tracks.data.length}`)] , ephemeral: true})
        }
        await interaction.deferReply();
        
        if (queue.repeatMode === QueueRepeatMode.QUEUE) {
            for (let i=0;i<index-1;i++) {
                queue.addTrack(queue.tracks.data[0]);
                if (!queue.removeTrack(queue.tracks.data[0])) {
                    return await interaction.followUp({embed : [Embed.alert(`Something went wrong`)]});
                }
            }
            queue.node.skipTo(queue.tracks.data[0]);
        }
        else queue.node.skipTo(queue.tracks.data[index-1]);

        return await interaction.followUp({
            embeds: [Embed.alert(`Skipped ${index-1} tracks`, 0x6FA8DC)]
        });
    }
    else if (interaction.commandName === "shuffle") {
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            return await interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true});
        }
        await interaction.deferReply();
        queue.tracks.shuffle();
        return await interaction.followUp({
            embeds: queue.tracks.data ? [Embed.alert(`Shuffled the playlist!`, 0x73C6B6)] : [Embed.alert('Cannot shuffle the current playlist')]
        });
    }
    else {
        return await interaction.reply({
            content: "Unknown command!",
            ephemeral: true
        });
    }
});

module.exports = { client, socketMessages };
client.login(process.env.TOKEN);
