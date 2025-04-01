const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCard, getUserInventory, createTrade, updateTradeStatus } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trade')
        .setDescription('Initiate a trade with another user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to trade with')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('card-id')
                .setDescription('ID of the card you want to trade')
                .setRequired(true)),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const targetUser = interaction.options.getUser('user');
            const cardId = interaction.options.getString('card-id');

            // Check if user is trying to trade with themselves
            if (targetUser.id === interaction.user.id) {
                return await interaction.editReply({
                    content: 'You cannot trade with yourself!'
                });
            }

            // Check if the card exists and user owns it
            const card = await getCard(cardId);
            if (!card) {
                return await interaction.editReply({
                    content: 'Invalid card ID!'
                });
            }

            const inventory = await getUserInventory(interaction.user.id);
            const hasCard = inventory.some(item => item.card_id === cardId);

            if (!hasCard) {
                return await interaction.editReply({
                    content: 'You do not own this card!'
                });
            }

            // Create trade entry
            const tradeId = await createTrade(interaction.user.id, targetUser.id, cardId);

            // Create trade confirmation embed
            const embed = new EmbedBuilder()
                .setTitle('🤝 Trade Offer')
                .setDescription(`${interaction.user.username} wants to trade with you!`)
                .addFields(
                    { name: 'Card', value: card.name },
                    { name: 'Rarity', value: card.rarity },
                    { name: 'Trade ID', value: tradeId }
                )
                .setImage(card.image)
                .setColor(0x3498db)
                .setTimestamp();

            // Send trade confirmation message
            const confirmMessage = await interaction.editReply({
                content: `<@${targetUser.id}>, you have a new trade offer!`,
                embeds: [embed],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 3,
                                label: 'Accept',
                                custom_id: `trade_accept_${tradeId}`
                            },
                            {
                                type: 2,
                                style: 4,
                                label: 'Decline',
                                custom_id: `trade_decline_${tradeId}`
                            }
                        ]
                    }
                ]
            });

            // Create collector for button interactions
            const collector = confirmMessage.createMessageComponentCollector({
                time: 300000 // 5 minutes
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== targetUser.id) {
                    await i.reply({
                        content: 'This trade is not for you!',
                        ephemeral: true
                    });
                    return;
                }

                const [action, , id] = i.customId.split('_');

                if (id !== tradeId) return;

                if (action === 'trade_accept') {
                    await updateTradeStatus(tradeId, 'accepted');
                    await i.update({
                        content: '✅ Trade accepted!',
                        components: []
                    });
                } else if (action === 'trade_decline') {
                    await updateTradeStatus(tradeId, 'declined');
                    await i.update({
                        content: '❌ Trade declined!',
                        components: []
                    });
                }

                collector.stop();
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    await updateTradeStatus(tradeId, 'expired');
                    await interaction.editReply({
                        content: '⏰ Trade offer expired!',
                        components: []
                    });
                }
            });

        } catch (error) {
            console.error('Error in trade command:', error);
            await interaction.editReply({
                content: 'There was an error while processing the trade. Please try again later.'
            });
        }
    }
};