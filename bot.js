const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

const BOT_TOKEN = 'Bot_Token'; // token of the bot
const CLIENT_ID = 'ID_Bot'; // id of the bot

let autoLineData = [];

const dataFilePath = './autoline_data.json';
if (fs.existsSync(dataFilePath)) {
    try {
        const rawData = fs.readFileSync(dataFilePath, 'utf8');
        autoLineData = JSON.parse(rawData || '[]');
    } catch (error) {
        console.error('Error reading JSON file:', error);
        autoLineData = [];
    }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const commands = [
    new SlashCommandBuilder()
        .setName('add-autoline')
        .setDescription('Add an image URL and channels for auto-sending')
        .addStringOption(option =>
            option.setName('image_url')
                .setDescription('Image URL')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel_1')
                .setDescription('First channel')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel_2')
                .setDescription('Second channel'))
        .addChannelOption(option =>
            option.setName('channel_3')
                .setDescription('Third channel'))
        .addChannelOption(option =>
            option.setName('channel_4')
                .setDescription('Fourth channel'))
        .addChannelOption(option =>
            option.setName('channel_5')
                .setDescription('Fifth channel'))
        .addChannelOption(option =>
            option.setName('channel_6')
                .setDescription('Sixth channel'))
        .addChannelOption(option =>
            option.setName('channel_7')
                .setDescription('Seventh channel'))
        .addChannelOption(option =>
            option.setName('channel_8')
                .setDescription('Eighth channel'))
        .addChannelOption(option =>
            option.setName('channel_9')
                .setDescription('Ninth channel'))
        .addChannelOption(option =>
            option.setName('channel_10')
                .setDescription('Tenth channel')),
    new SlashCommandBuilder()
        .setName('remove-autoline')
        .setDescription('Remove an image URL from auto-sending list')
        .addStringOption(option =>
            option.setName('image_url')
                .setDescription('Image URL to remove')
                .setRequired(true)),
];

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'add-autoline') {
        const imageUrl = options.getString('image_url');
        const channels = [];
        for (let i = 1; i <= 10; i++) {
            const channel = options.getChannel(`channel_${i}`);
            if (channel) channels.push(channel.id);
        }

        if (channels.length === 0) {
            await interaction.reply({ content: 'You must add at least one channel!', ephemeral: true });
            return;
        }

        autoLineData.push({ imageUrl, channels });
        fs.writeFileSync(dataFilePath, JSON.stringify(autoLineData, null, 2));

        await interaction.reply({ content: `Image ${imageUrl} has been added to the auto-sending list for the selected channels.`, ephemeral: true });
    }

    if (commandName === 'remove-autoline') {
        const imageUrl = options.getString('image_url');

        const index = autoLineData.findIndex(data => data.imageUrl === imageUrl);
        if (index === -1) {
            await interaction.reply({ content: 'The specified image URL was not found!', ephemeral: true });
            return;
        }

        autoLineData.splice(index, 1);
        fs.writeFileSync(dataFilePath, JSON.stringify(autoLineData, null, 2));

        await interaction.reply({ content: `Image ${imageUrl} has been removed from the auto-sending list.`, ephemeral: true });
    }
});

const lastMessageTimestamps = new Map();

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    autoLineData.forEach(data => {
        if (data.channels.includes(message.channel.id)) {
            const lastMessageTimestamp = lastMessageTimestamps.get(message.channel.id) || 0;
            const now = Date.now();

            if (now - lastMessageTimestamp > 1000) { 
                message.channel.send({
                    files: [data.imageUrl],
                }).catch(console.error);

                lastMessageTimestamps.set(message.channel.id, now);
            }
        }
    });
});

client.login(BOT_TOKEN);
