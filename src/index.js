require('dotenv').config();
const {Client, IntentsBitField} = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});

client.on('ready', (c) => {
    console.log(`${c.user.tag} is online`);
}) // access events, listens when our bot is ready

client.on('messageCreate', (message) => {
    if (message.author.bot) {
        return;
    }
    console.log(message.channel)
})

client.login(process.env.TOKEN);


