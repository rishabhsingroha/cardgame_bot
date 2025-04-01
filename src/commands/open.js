const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { BOT_CONFIG } = require('../utils/cardGenerator');
const { generatePack } = require('../utils/cardGenerator');
const { getUser, createUser, updateLastOpened, addToInventory } = require('../utils/database');

const RARITY_COLORS = {
    Common: 0x95a5a6,
    Uncommon: 0x2ecc71,
    Rare: 0x3498db,
    Legendary: 0x9b59b6,
    Mythic: 0xf1c40f
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('open')
        .setDescription('Open a card pack'),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            // Get or create user
            let user = await getUser(interaction.user.id);
            if (!user) {
                await createUser(interaction.user.id);
                user = await getUser(interaction.user.id);
            }

            // Check cooldown
            const now = Date.now();
            if (user.lastOpened && (now - user.lastOpened) < BOT_CONFIG.pack.cooldown) {
                const remainingTime = BOT_CONFIG.pack.cooldown - (now - user.lastOpened);
                const hours = Math.floor(remainingTime / 3600000);
                const minutes = Math.floor((remainingTime % 3600000) / 60000);

                return await interaction.editReply({
                    content: `You need to wait ${hours}h ${minutes}m before opening another pack!`
                });
            }

            // Generate pack
            const pack = await generatePack(require('../utils/database'));

            // Add cards to inventory
            for (const card of pack) {
                await addToInventory(interaction.user.id, card.id, card.isFoil);
            }

            // Update last opened timestamp
            await updateLastOpened(interaction.user.id);

            // Create embeds for each card
            const embeds = pack.map(card => {
                const imagePath = card.isFoil ? card.image.replace('.png', '_foil.png') : card.image;
                const embed = new EmbedBuilder()
                    .setTitle(card.name)
                    .setDescription(`Rarity: ${card.rarity}`)
                    .setColor(RARITY_COLORS[card.rarity] || 0x95a5a6)
                    .setImage(`attachment://${path.basename(imagePath)}`);

                if (card.isFoil) {
                    embed.setFooter({ text: '✨ Foil' });
                }

                return { embed, imagePath };
            });

            // Send response with all cards
            await interaction.editReply({
                content: '🎉 Here are your cards:',
                embeds: embeds.map(({ embed }) => embed),
                files: embeds.map(({ imagePath }) => path.join(process.cwd(), imagePath))
            });

        } catch (error) {
            console.error('Error in open command:', error);
            await interaction.editReply({
                content: 'There was an error while opening your pack. Please try again later.'
            });
        }
    }
};