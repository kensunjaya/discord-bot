require('dotenv').config();
const {EmbedBuilder, Client, IntentsBitField, GuildMember} = require('discord.js');
const { Player, QueryType } = require("discord-player");

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

client.on('ready', (c) => {
    console.log(`${c.user.tag} is online`);
}) // access events, listens when our bot is ready

player.on("error", (queue, error) => {
    console.log(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);
});

player.on("connectionError", (queue, error) => {
    console.log(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
});

player.on("trackStart", (queue, track) => {
    queue.metadata.send(`🎶 | Started playing: **${track.title}** in **${queue.connection.channel.name}**!`);
});

player.on("trackAdd", (queue, track) => {
    queue.metadata.send(`🎶 | Track **${track.title}** queued!`);
});

player.on("botDisconnect", (queue) => {
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
    
    if (interaction.commandName === "play") {
        await interaction.deferReply();
        
        const query = interaction.options.get("query").value;
        console.log(query);
        
        const searchResult = await player
            .search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO
            })
            .catch(() => {});
        
        // console.log(searchResult.tracks[0]);
        if (!searchResult || !searchResult.tracks.length) {
            return void interaction.followUp({ content: "No results were found!" });
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

        const msg = await interaction.followUp({ content: `⌛ | Loading your ${searchResult.playlist ? "playlist" : "track"}...` });
        if (!queue.isPlaying()) {
            await queue.play(searchResult.tracks[0]);
            await msg.edit(`Now playing ${searchResult.tracks[0]}`);
            return;
        }
        searchResult.playlist ? queue.addTracks(searchResult.tracks) : queue.addTrack(searchResult.tracks[0]);
        await msg.edit(`📝 | Added ${searchResult.tracks[0]} to queue list`);
    
    } else if (interaction.commandName === "skip") {
        await interaction.deferReply();
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            return void interaction.followUp({ content: "❌ | No music is being played!" });
        }
        const currentTrack = queue.currentTrack;
        queue.dispatcher.end();
        await queue.play(queue.tracks.data[0]);
        
        const success = queue.removeTrack(queue.tracks.data[0]);

        return void interaction.followUp({
            content: success ? `✅ | Skipped **${currentTrack}**!` : "❌ | Something went wrong!"
        });
    } else if (interaction.commandName === "stop") {
        await interaction.deferReply();
        const queue = player.nodes.get(interaction.guildId);

        if (!queue || !queue.isPlaying()) {
            return void interaction.followUp({ content: "❌ | No music is being played!" });
        }
        
        queue.delete();
        return void interaction.followUp({ content: "🛑 | Stopped the player!" });
    } else if (interaction.commandName === "queue") {
        await interaction.deferReply();
        const queue = player.nodes.get(interaction.guildId);

        if (!queue) return void interaction.followUp({ content : "Queue list is empty. Use /play to add some tracks" });
        let counter = 0;
        let queueBuilder = '```json\n' + `SHOWING QUEUE LIST - [${queue.tracks.data.length} Tracks]\n\n`;
        // let embeddedQueue = new EmbedBuilder()
        //         .setColor(0xD7D67C)
        //         .setAuthor({ name: `Songs in queue - [${queue.tracks.data.length} Tracks]`, iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
                
        queue.tracks.data.map(track => {
            queueBuilder += `${++counter}. ${track.description} -- 【${track.duration}】\n`;
            // embeddedQueue.addFields({name : `${counter++}. ${track.description} - [${track.duration}]`, value : '\u200B'})
            // console.log(track.description)
        })
        queueBuilder += '\n⬑ This is the end of the queue```';
        return void interaction.followUp({ content : queueBuilder });

    } else {
        interaction.reply({
            content: "Unknown command!",
            ephemeral: true
        });
    }
});

client.login(process.env.TOKEN);