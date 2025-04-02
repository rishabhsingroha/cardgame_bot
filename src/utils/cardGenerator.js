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
    // Always make chase cards foil as per requirement
    const isFoil = true;
    const rarity = weightedRandom(chase.rarity);
    
    return { isFoil, rarity };
}

async function generatePack(db) {
    const pack = [];
    
    // Generate and process regular cards first - exactly 5 cards
    // These cards will NOT be foil (as per requirement, only chase cards should be foil)
    for (let i = 0; i < BOT_CONFIG.pack.structure.regularCards && pack.length < BOT_CONFIG.pack.structure.regularCards; i++) {
        const cardInfo = generateRegularCard();
        // Force regular cards to not be foil
        cardInfo.isFoil = false;
        
        const cards = await db.getCardsByRarity(cardInfo.rarity);
        if (cards && cards.length > 0) {
            const randomCard = cards[Math.floor(Math.random() * cards.length)];
            pack.push({
                ...randomCard,
                isFoil: false // Ensure regular cards are never foil
            });
        }
    }
    
    // Ensure we have exactly the right number of regular cards
    if (pack.length > BOT_CONFIG.pack.structure.regularCards) {
        // If we somehow got more cards than needed, trim the excess
        pack.splice(BOT_CONFIG.pack.structure.regularCards);
    }
    
    // Generate and process chase card - exactly 1 card
    // This card WILL be foil (as per requirement, chase cards should be foil)
    if (pack.length === BOT_CONFIG.pack.structure.regularCards) {
        const chaseInfo = generateChaseCard();
        // Force chase card to be foil
        chaseInfo.isFoil = true;
        
        const chaseCards = await db.getCardsByRarity(chaseInfo.rarity);
        if (chaseCards && chaseCards.length > 0) {
            const randomChaseCard = chaseCards[Math.floor(Math.random() * chaseCards.length)];
            pack.push({
                ...randomChaseCard,
                isFoil: true // Ensure chase card is always foil
            });
        }
    }
    
    return pack;
}

module.exports = {
    BOT_CONFIG,
    generatePack
};