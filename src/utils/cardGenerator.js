const BOT_CONFIG = {
    pack: {
        cooldown: 86400000, // 24 hours in milliseconds
        structure: {
            regularCards: 5,
            chaseCard: 1,
            probabilities: {
                regular: {
                    foil: { chance: 1/16, max: 2 },
                    rarity: { Common: 65, Uncommon: 25, Rare: 10 }
                },
                chase: {
                    foil: { chance: 1/10 },
                    rarity: { Uncommon: 50, Rare: 35, Legendary: 12, Mythic: 3 }
                }
            }
        }
    }
};

function weightedRandom(weights) {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (const [item, weight] of Object.entries(weights)) {
        random -= weight;
        if (random <= 0) return item;
    }
    
    return Object.keys(weights)[0]; // Fallback
}

function generateRegularCard() {
    const { regular } = BOT_CONFIG.pack.structure.probabilities;
    const isFoil = Math.random() < regular.foil.chance;
    const rarity = weightedRandom(regular.rarity);
    
    return { isFoil, rarity };
}

function generateChaseCard() {
    const { chase } = BOT_CONFIG.pack.structure.probabilities;
    const isFoil = Math.random() < chase.foil.chance;
    const rarity = weightedRandom(chase.rarity);
    
    return { isFoil, rarity };
}

async function generatePack(db) {
    const regularCards = [];
    let foilCount = 0;
    
    // Generate regular cards
    while (regularCards.length < BOT_CONFIG.pack.structure.regularCards) {
        const card = generateRegularCard();
        if (card.isFoil) {
            if (foilCount < BOT_CONFIG.pack.structure.probabilities.regular.foil.max) {
                foilCount++;
                regularCards.push(card);
            } else {
                card.isFoil = false;
                regularCards.push(card);
            }
        } else {
            regularCards.push(card);
        }
    }
    
    // Generate chase card
    const chaseCard = generateChaseCard();
    
    // Get actual cards from database based on generated rarities
    const pack = [];
    
    for (const cardInfo of regularCards) {
        const cards = await db.getCardsByRarity(cardInfo.rarity);
        if (cards && cards.length > 0) {
            const randomCard = cards[Math.floor(Math.random() * cards.length)];
            pack.push({
                ...randomCard,
                isFoil: cardInfo.isFoil
            });
        }
    }
    
    const chaseCards = await db.getCardsByRarity(chaseCard.rarity);
    if (chaseCards && chaseCards.length > 0) {
        const randomChaseCard = chaseCards[Math.floor(Math.random() * chaseCards.length)];
        pack.push({
            ...randomChaseCard,
            isFoil: chaseCard.isFoil
        });
    }
    
    return pack;
}

module.exports = {
    BOT_CONFIG,
    generatePack
};