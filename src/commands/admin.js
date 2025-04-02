const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addCard } = require('../utils/database');
const { handleCardImageUpload } = require('../utils/fileUpload');
const path = require('path');

const ADMIN_USERS = process.env.ADMIN_USERS.split(',');

function isAdmin(userId) {
    return ADMIN_USERS.includes(userId);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('addcard')
                .setDescription('Add a new card')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Card name')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('rarity')
                        .setDescription('Card rarity')
                        .addChoices(
                            { name: 'Common', value: 'Common' },
                            { name: 'Uncommon', value: 'Uncommon' },
                            { name: 'Rare', value: 'Rare' },
                            { name: 'Legendary', value: 'Legendary' },
                            { name: 'Mythic', value: 'Mythic' }
                        )
                        .setRequired(true))
                .addAttachmentOption(option =>
                    option.setName('image')
                        .setDescription('Card image file')
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('foil')
                        .setDescription('Whether the card is foil')
                        .setRequired(false))),

    async execute(interaction) {
        try {
            if (!isAdmin(interaction.user.id)) {
                return await interaction.reply({
                    content: 'You do not have permission to use admin commands!',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'addcard') {
                const name = interaction.options.getString('name');
                const rarity = interaction.options.getString('rarity');
                const imageAttachment = interaction.options.getAttachment('image');
                const isFoil = interaction.options.getBoolean('foil') || false;
                const cardId = Date.now().toString();

                // Handle image upload
                const imagePath = await handleCardImageUpload(imageAttachment);

                await addCard({
                    id: cardId,
                    name,
                    rarity,
                    image: imagePath,
                    is_foil: isFoil
                });

                const embed = new EmbedBuilder()
                    .setTitle('✅ Card Added')
                    .addFields(
                        { name: 'Name', value: name },
                        { name: 'Rarity', value: rarity },
                        { name: 'ID', value: cardId },
                        { name: 'Foil', value: isFoil ? '✨ Yes' : 'No' }
                    )
                    .setImage(`attachment://${path.basename(imagePath)}`)
                    .setThumbnail(interaction.guild.iconURL())
                    .setColor(0x2ecc71)
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [embed],
                    files: [path.join(process.cwd(), imagePath)]
                });
            }

        } catch (error) {
            console.error('Error in admin command:', error);
            await interaction.editReply({
                content: 'There was an error while executing the admin command. Please try again later.'
            });
        }
    }
};