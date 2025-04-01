const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserInventory } = require('../utils/database');

const RARITY_COLORS = {
    Common: 0x95a5a6,
    Uncommon: 0x2ecc71,
    Rare: 0x3498db,
    Legendary: 0x9b59b6,
    Mythic: 0xf1c40f
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('View card collection')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User whose inventory to view')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number')
                .setMinValue(1)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('rarity')
                .setDescription('Filter by rarity')
                .addChoices(
                    { name: 'Common', value: 'Common' },
                    { name: 'Uncommon', value: 'Uncommon' },
                    { name: 'Rare', value: 'Rare' },
                    { name: 'Legendary', value: 'Legendary' },
                    { name: 'Mythic', value: 'Mythic' }
                )
                .setRequired(false)),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const targetUser = interaction.options.getUser('user') || interaction.user;
            const page = interaction.options.getInteger('page') || 1;
            const rarity = interaction.options.getString('rarity');

            const inventory = await getUserInventory(targetUser.id, page, rarity);

            if (!inventory || inventory.length === 0) {
                return await interaction.editReply({
                    content: rarity
                        ? `No ${rarity.toLowerCase()} cards found in ${targetUser.username}'s inventory!`
                        : `${targetUser.username}'s inventory is empty!`
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(`${targetUser.username}'s Card Collection`)
                .setDescription(rarity ? `Showing ${rarity} cards - Page ${page}` : `Page ${page}`)
                .setColor(rarity ? RARITY_COLORS[rarity] : 0x2ecc71)
                .setTimestamp();

            // Group cards by name to show count
            const cardGroups = inventory.reduce((groups, card) => {
                const key = `${card.name}${card.is_foil ? ' (Foil)' : ''}`;
                if (!groups[key]) {
                    groups[key] = {
                        name: card.name,
                        rarity: card.rarity,
                        isFoil: card.is_foil,
                        count: 0
                    };
                }
                groups[key].count++;
                return groups;
            }, {});

            // Add fields for each unique card
            Object.values(cardGroups).forEach(card => {
                const foilIndicator = card.isFoil ? ' ✨' : '';
                embed.addFields({
                    name: `${card.name}${foilIndicator}`,
                    value: `Rarity: ${card.rarity}\nQuantity: ${card.count}`,
                    inline: true
                });
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in inventory command:', error);
            await interaction.editReply({
                content: 'There was an error while fetching the inventory. Please try again later.'
            });
        }
    }
};