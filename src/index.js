require('dotenv').config();
const {EmbedBuilder, Client, IntentsBitField, GuildMember} = require('discord.js');
const { Player, QueryType } = require("discord-player");
const { EmbedMessage } = require('./embed.js');
const { interactionCommands } = require('./commands.js');

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
const Embed = new EmbedMessage();
const guildHandler = new Map();

client.on('ready', (c) => {
    console.log(`${c.user.tag} is online`);
}) // access events, listens when our bot is ready

player.events.on("playerStart", async (queue, track) => {
    if (guildHandler.get(queue.guild)) {
        if (guildHandler.get(queue.guild).commandName === 'play' && !queue.tracks.data.length) {
            await guildHandler.get(queue.guild).followUp({embeds : [Embed.musicPlaying(track)]});
        }
        else {
            await guildHandler.get(queue.guild).channel.send({embeds : [Embed.musicPlaying(track)]});
        }
        // guildHandler.set(queue.guild, newInteraction);
    }
});

player.events.on('disconnect', (queue) => {
    guildHandler.delete(queue.guild);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;
    console.log(`[${message.guild.name} (${message.channel.name})] : [${message.author.username}] >> ${message.content}`)
    if (!client.application?.owner) await client.application?.fetch();

    if (message.content === "!deploy" && message.author.id === client.application?.owner?.id) {
        await message.guild.commands.set(interactionCommands);

        await message.reply("Deployed!");
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand() || !interaction.guildId) return;

    console.log(`[${interaction.guild.name} (${interaction.channel.name})] : [${interaction.user.username}] => ${interaction}`)

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
                return void interaction.followUp({ content: "No results were found!" });
            }
        }

        const queue = player.nodes.create(interaction.guild, {
            metadata: interaction.channel,
            leaveOnEmpty: false,
            leaveOnEnd: false,
            selfDeaf: true,
        });
        
        try {
            if (!queue.connection) await queue.connect(interaction.member.voice.channel);
        } catch {
            void player.deleteQueue(interaction.guildId);
            return void interaction.followUp({ content: "Could not join your voice channel!" });
        }

        // searchResult.playlist.tracks = shuffle(searchResult.playlist.tracks);

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
            guildHandler.set(interaction.guild, interaction);
            queue.removeTrack(queue.tracks.data[0]);
            return;
        }
        if (!searchResult.playlist) {
            await interaction.followUp(`📝 | Added **${searchResult.tracks[0].description}** to queue list`);
        }
        
    
    } 
    else if (interaction.commandName === "skip") {
        const queue = player.nodes.get(interaction.guildId);
        
        if (!queue || !queue.isPlaying()) {
            return void interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true});
        }
        await interaction.deferReply();
        if (!queue.tracks.data.length) {
            interaction.followUp({ embeds: [Embed.alert('⏹️  Stopped the player due to empty queue', 0xDEB600)] });
            return void queue.delete();
        }
        
        const success = queue.node.skipTo(queue.tracks.data[0]);
        // await queue.node.play(queue.tracks.data[0]);
        // const currentTrack = queue.tracks.data[0];
        // const success = queue.removeTrack(currentTrack);
        
        return void interaction.followUp({
            embeds: success ? [Embed.alert(`Skipped track to **${queue.tracks.data[0].description}**`, 0x85C1E9)] : [Embed.alert("Something went wrong while we were trying to skip the current track. Try again later")]
        });
    } 
    else if (interaction.commandName === "stop") {
        const queue = player.nodes.get(interaction.guildId);

        if (!queue || !queue.isPlaying()) {
            return void interaction.reply({ embeds: [Embed.alert('No music is being played!')] , ephemeral: true });
        }
        
        queue.delete();
        await interaction.deferReply();
        return void interaction.followUp({ content: "⏹️  Stopped the player!" });
    } 
    else if (interaction.commandName === "queue") {
        const queue = player.nodes.get(interaction.guildId);

        if (!queue) return void interaction.reply({ content : "Queue list is empty. Use /play to add some tracks", ephemeral: true });
        let queueBuilder = '```json\n' + `SHOWING QUEUE LIST - [${queue.tracks.data.length} Tracks]\n\n`;
        // let embeddedQueue = new EmbedBuilder()
        //         .setColor(0xD7D67C)
        //         .setAuthor({ name: `Songs in queue - [${queue.tracks.data.length} Tracks]`, iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
        queueBuilder += `► Now playing ${queue.currentTrack.description}\n`
        let undisplayedTracks;
        queue.tracks.data.forEach((track, index) => {
            if ((queueBuilder + `${index}. ${track.description} -- 【${track.duration}】\n`).length < 1800) {
                queueBuilder += `${++index}. ${track.description} -- 【${track.duration}】\n`;
                undisplayedTracks = index;
            }
            // embeddedQueue.addFields({name : `${counter++}. ${track.description} - [${track.duration}]`, value : '\u200B'})
        })
        undisplayedTracks = queue.tracks.data.length - undisplayedTracks;
        if (undisplayedTracks) queueBuilder +=  `and ${undisplayedTracks} more ..\n`;
        queueBuilder += '\n⬑ This is the end of the queue```';
        await interaction.deferReply();
        return void interaction.followUp({ content : queueBuilder });

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
            embeds: success ? [Embed.alert(`Removed ${trackToRemove.title} from queue`, 0x6FA8DC)] : [Embed.alert(`Failed to remove ${trackToRemove.title} from queue`)]
        });
    } 
    else if (interaction.commandName === "help") {
        return void interaction.reply({ embeds : [Embed.showCommands(interaction)], ephemeral : true });
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
        
        for (let i=0;i<index-1;i++) {
            if (!queue.removeTrack(queue.tracks.data[0])) {
                return void interaction.followUp({embed : [Embed.alert(`Something went wrong`)]});
            }
        }
        queue.node.skipTo(queue.tracks.data[0]);
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
            embeds: queue.tracks.data ? [Embed.alert(`Tracks has been shuffled!`, 0x73C6B6)] : [Embed.alert('Cannot shuffle tracks')]
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