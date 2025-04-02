const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { BOT_CONFIG, generatePack } = require('../utils/cardGenerator');
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

            // Create embeds for each card and prepare files to send
            const embeds = [];
            const files = [];
            
            for (const card of pack) {
                // Determine image path for foil or regular card
                let imagePath = card.isFoil ? card.image.replace('.png', '_foil.png') : card.image;
                let fullPath = path.join(process.cwd(), imagePath);
                
                // Check if the image exists, if not (for foil), fall back to regular image
                if (!fs.existsSync(fullPath) && card.isFoil) {
                    imagePath = card.image; // Fall back to regular image path
                    fullPath = path.join(process.cwd(), imagePath);
                }
                
                // Create the embed with the correct image path
                const embed = new EmbedBuilder()
                    .setTitle(card.name)
                    .setDescription(`Rarity: ${card.rarity}`)
                    .setColor(RARITY_COLORS[card.rarity] || 0x95a5a6)
                    .setImage(`attachment://${path.basename(imagePath)}`);

                if (card.isFoil) {
                    embed.setFooter({ text: '✨ Foil' });
                }
                
                // Add the embed and file to their respective arrays
                embeds.push(embed);
                files.push(fullPath);
            }

            await interaction.editReply({
                content: '🎉 Here are your cards:',
                embeds: embeds,
                files: files
            });

        } catch (error) {
            console.error('Error in open command:', error);
            await interaction.editReply({
                content: 'There was an error while opening your pack. Please try again later.'
            });
        }
    }
};