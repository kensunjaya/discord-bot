require('dotenv').config();
const {EmbedBuilder, Client, IntentsBitField, GuildMember} = require('discord.js');
const { Player, QueryType, PlayerEvent, PlayerEventsEmitter } = require("discord-player");
const { EmbedMessage } = require('./embed.js');

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
// const emitter= new PlayerEventsEmitter(client);
const Embed = new EmbedMessage();

player.handleVoiceState = (oldState, newState) => {
    console.log("My voice state changed!");
};

// player.addListener("trackStart", (oldOne, newOne) => {
//     console.log("addLIstener succeeded");
//     if (newOne.status == "idle") {
//         console.log("The song finished");
//     }
// });


client.on('ready', (c) => {
    console.log(`${c.user.tag} is online`);
}) // access events, listens when our bot is ready

client.on('voiceStateUpdate', (oldState, newState) => {  
    player.handleVoiceState(oldState, newState);
});

player.on("error", (queue, error) => {
    console.log(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);
});

player.on("connectionError", (queue, error) => {
    console.log(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
});

player.on("trackStart", (queue, track) => {
    console.log("Started playing music")
    queue.metadata.send(`🎶 | Started playing: **${track.title}** in **${queue.connection.channel.name}**!`);
});

player.on("trackAdd", (queue, track) => {
    console.log("Track added")
    queue.metadata.send(`🎶 | Track **${track.title}** queued!`);
});

player.on("botDisconnect", (queue) => {
    console.log("Manually disconnected")
    queue.metadata.send("❌ | I was manually disconnected from the voice channel, clearing queue!");
});

player.on("channelEmpty", (queue) => {
    queue.metadata.send("❌ | Nobody is in the voice channel, leaving...");
});

player.on("queueEnd", (queue) => {
    queue.metadata.send("✅ | Queue finished!");
});

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;
    if (!client.application?.owner) await client.application?.fetch();

    if (message.content === "!deploy" && message.author.id === client.application?.owner?.id) {
        await message.guild.commands.set([
            {
                name: "play",
                description: "Plays a track",
                options: [
                    {
                        name: "query",
                        type: 3,
                        description: "The track you want to play",
                        required: true
                    },
                    {
                        name: "search_engine",
                        type: 3,
                        description: "Search engine to find your tracks, default is AUTO",
                        required: false,
                        choices: [
                            {
                                name: "YouTube",
                                value: QueryType.YOUTUBE
                            },
                            {
                                name: "Spotify",
                                value: QueryType.SPOTIFY_SONG
                            },
                            {
                                name: "SpotifyPlaylist",
                                value: QueryType.SPOTIFY_PLAYLIST
                            },
                            {
                                name: "SpotifyAlbum",
                                value: QueryType.SPOTIFY_ALBUM
                            },
                            {
                                name: "Soundcloud",
                                value: QueryType.SOUNDCLOUD
                            },
                        ],
                        default: QueryType.AUTO
                    }
                ]
            },
            {
                name: "p",
                description: "Plays a track",
                options: [
                    {
                        name: "query",
                        type: 3,
                        description: "The track you want to play",
                        required: true
                    },
                    {
                        name: "search_engine",
                        type: 3,
                        description: "Search engine to find your tracks, default is AUTO",
                        required: false,
                        choices: [
                            {
                                name: "YouTube",
                                value: QueryType.YOUTUBE
                            },
                            {
                                name: "Spotify",
                                value: QueryType.SPOTIFY_SONG
                            },
                            {
                                name: "SpotifyPlaylist",
                                value: QueryType.SPOTIFY_PLAYLIST
                            },
                            {
                                name: "SpotifyAlbum",
                                value: QueryType.SPOTIFY_ALBUM
                            },
                            {
                                name: "Soundcloud",
                                value: QueryType.SOUNDCLOUD
                            },
                        ],
                        default: QueryType.AUTO
                    }
                ]
            },
            {
                name: "skip",
                description: "Skip the current track"
            },
            {
                name: "stop",
                description: "Stop / disconnect the bot"
            },
            {
                name: "queue",
                description: "Show the queue list"
            },
            {
                name: "remove",
                description: "Remove a track from queue",
                options: [{
                    name: "index",
                    type: 4,
                    description: "The index of track to remove",
                    required: true
                }]
            }
        ]);

        await message.reply("Deployed!");
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand() || !interaction.guildId) return;

    if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
        return void interaction.reply({ content: "You are not in a voice channel!", ephemeral: true });
    }

    await player.extractors.loadDefault();
    
    if (interaction.commandName === "play" || interaction.commandName === "p") {
        await interaction.deferReply();
        
        const query = interaction.options.get("query").value;
        const search_engine = interaction.options.get("search_engine");

        let searchResult = await player
            .search(query, {
                requestedBy: interaction.user,
                searchEngine: search_engine ? search_engine.value : QueryType.AUTO,
            })
            .catch(() => {});

        if (!searchResult || !searchResult.tracks.length) {
            if (search_engine) return void interaction.followUp({ content: "No results were found!" });
            const availableEngines = [QueryType.SPOTIFY_PLAYLIST,
                QueryType.SPOTIFY_ALBUM,
                QueryType.SPOTIFY_SONG,
                QueryType.YOUTUBE,
                QueryType.YOUTUBE_PLAYLIST]
            for (let i=0;i<availableEngines.length;i++) {
                searchResult = await player
                .search(query, {
                    requestedBy: interaction.user,
                    searchEngine: availableEngines[i]
                })
                .catch(() => {});
                if (searchResult) break;
            }
            if (!searchResult || !searchResult.tracks.length) {
                return void interaction.followUp({ content: "No results were found, We've tried using all search engines!" });
            }
        }

        const queue = player.nodes.create(interaction.guild, {
            metadata: interaction.channel
        });
        
        try {
            if (!queue.connection) await queue.connect(interaction.member.voice.channel);
        } catch {
            void player.deleteQueue(interaction.guildId);
            return void interaction.followUp({ content: "Could not join your voice channel!" });
        }

        if (searchResult.playlist) {
            searchResult.playlist.tracks.map(track => {
                queue.addTrack(track);
            });
        }
        else {
            queue.addTrack(searchResult.tracks[0]);
        }
        console.log(searchResult.playlist)

        if (!queue.isPlaying()) {
            await queue.play(queue.tracks.data[0]);
            await interaction.followUp({embeds : [Embed.musicPlaying(queue.currentTrack)]});
            queue.removeTrack(queue.currentTrack);
            return;
        }
        
        // searchResult.playlist ? queue.addTracks(searchResult.tracks) : queue.addTrack(searchResult.tracks[0]);
        
        
        await interaction.followUp(`📝 | Added ${searchResult.tracks[0]} to queue list`);
    
    } 
    else if (interaction.commandName === "skip") {
        
        await interaction.deferReply();
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            return void interaction.followUp({ embeds: [Embed.exception('❌ | No music is being played!')] , ephemeral: true});
        }
        if (!queue.tracks.data.length) {
            interaction.followUp({ embeds: [Embed.exception('🛑 | Stopped the player due to empty queue', 0xDEB600)] });
            return void queue.delete();
        }
        
        queue.dispatcher.end();
        await queue.play(queue.tracks.data[0]);
        const currentTrack = queue.tracks.data[0]
        const success = queue.removeTrack(queue.tracks.data[0]);
        
        
        return void interaction.followUp({
            embeds: success ? [Embed.musicPlaying(currentTrack)] : [Embed.exception("Something went wrong while we were trying to skip the current track. Try again later")]
        });
    } 
    else if (interaction.commandName === "stop") {
        await interaction.deferReply();
        const queue = player.nodes.get(interaction.guildId);

        if (!queue || !queue.isPlaying()) {
            return void interaction.followUp({ embeds: [Embed.exception('❌ | No music is being played!')] , ephemeral: true });
        }
        
        queue.delete();
        return void interaction.followUp({ content: "🛑 | Stopped the player!" });
    } 
    else if (interaction.commandName === "queue") {
        await interaction.deferReply();
        const queue = player.nodes.get(interaction.guildId);

        if (!queue) return void interaction.followUp({ content : "Queue list is empty. Use /play to add some tracks", ephemeral: true });
        let counter = 0;
        let queueBuilder = '```json\n' + `SHOWING QUEUE LIST - [${queue.tracks.data.length} Tracks]\n\n`;
        // let embeddedQueue = new EmbedBuilder()
        //         .setColor(0xD7D67C)
        //         .setAuthor({ name: `Songs in queue - [${queue.tracks.data.length} Tracks]`, iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
        queueBuilder += `► Now playing ${queue.currentTrack.description}\n`
        let undisplayedTracks;
        queue.tracks.data.forEach((track, index) => {
            if ((queue.Builder += `${index}. ${track.description} -- 【${track.duration}】\n`).length < 1800) {
                queueBuilder += `${++index}. ${track.description} -- 【${track.duration}】\n`;
                undisplayedTracks = index;
            }
            // embeddedQueue.addFields({name : `${counter++}. ${track.description} - [${track.duration}]`, value : '\u200B'})
            // console.log(track.description)
        })
        undisplayedTracks = queue.tracks.data.length - undisplayedTracks;
        if (undisplayedTracks) queueBuilder +=  `and ${undisplayedTracks} more ..\n`;
        queueBuilder += '\n⬑ This is the end of the queue```';
        return void interaction.followUp({ content : queueBuilder });

    } 
    else if (interaction.commandName === "remove") {
        await interaction.deferReply();
        const index = interaction.options.get("index").value;
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            return void interaction.followUp({ embeds: [Embed.exception('❌ | No music is being played!')] , ephemeral: true});
        }
        if (index < 1 || index > queue.tracks.data.length) {
            return void interaction.followUp({ embeds: [Embed.exception(`Index must be in between 1 to ${queue.tracks.data.length}`)] , ephemeral: true})
        }
        const trackToRemove = queue.tracks.data[index-1]
        const success = queue.removeTrack(trackToRemove);
        return void interaction.followUp({
            embeds: success ? [Embed.exception(`Removed ${trackToRemove.title} from queue`, 0x6FA8DC)] : [Embed.exception(`Failed to remove ${trackToRemove.title} from queue`)]
        });
    } 
    else {
        interaction.reply({
            content: "Unknown command!",
            ephemeral: true
        });
    }
});

client.login(process.env.TOKEN);