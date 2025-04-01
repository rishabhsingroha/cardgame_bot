const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(process.env.DB_PATH);

function initializeDatabase() {
    db.serialize(() => {
        // Create Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            lastOpened INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create Cards table
        db.run(`CREATE TABLE IF NOT EXISTS cards (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            rarity TEXT NOT NULL,
            image TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create Inventory table
        db.run(`CREATE TABLE IF NOT EXISTS inventory (
            user_id TEXT,
            card_id TEXT,
            is_foil BOOLEAN,
            obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (card_id) REFERENCES cards(id)
        )`);

        // Create Trades table
        db.run(`CREATE TABLE IF NOT EXISTS trades (
            id TEXT PRIMARY KEY,
            sender_id TEXT,
            receiver_id TEXT,
            card_id TEXT,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (receiver_id) REFERENCES users(id),
            FOREIGN KEY (card_id) REFERENCES cards(id)
        )`);
    });
}

// User operations
async function getUser(userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });
}

async function createUser(userId) {
    return new Promise((resolve, reject) => {
        db.run('INSERT OR IGNORE INTO users (id) VALUES (?)', [userId], (err) => {
            if (err) reject(err);
            resolve();
        });
    });
}

async function updateLastOpened(userId) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE users SET lastOpened = ? WHERE id = ?', 
            [Date.now(), userId], 
            (err) => {
                if (err) reject(err);
                resolve();
            });
    });
}

// Card operations
async function addCard(cardData) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO cards (id, name, rarity, image) VALUES (?, ?, ?, ?)',
            [cardData.id, cardData.name, cardData.rarity, cardData.image],
            (err) => {
                if (err) reject(err);
                resolve();
            });
    });
}

async function getCard(cardId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM cards WHERE id = ?', [cardId], (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });
}

async function getCardsByRarity(rarity) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM cards WHERE rarity = ?', [rarity], (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
}

// Inventory operations
async function addToInventory(userId, cardId, isFoil) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO inventory (user_id, card_id, is_foil) VALUES (?, ?, ?)',
            [userId, cardId, isFoil],
            (err) => {
                if (err) reject(err);
                resolve();
            });
    });
}

async function getUserInventory(userId, page = 1, rarity = null) {
    const limit = 10;
    const offset = (page - 1) * limit;
    let query = `
        SELECT i.*, c.name, c.rarity, c.image
        FROM inventory i
        JOIN cards c ON i.card_id = c.id
        WHERE i.user_id = ?
    `;
    const params = [userId];

    if (rarity) {
        query += ' AND c.rarity = ?';
        params.push(rarity);
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
}

// Trade operations
async function createTrade(senderId, receiverId, cardId) {
    const tradeId = Date.now().toString();
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO trades (id, sender_id, receiver_id, card_id, status) VALUES (?, ?, ?, ?, ?)',
            [tradeId, senderId, receiverId, cardId, 'pending'],
            (err) => {
                if (err) reject(err);
                resolve(tradeId);
            });
    });
}

async function updateTradeStatus(tradeId, status) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE trades SET status = ? WHERE id = ?',
            [status, tradeId],
            (err) => {
                if (err) reject(err);
                resolve();
            });
    });
}

module.exports = {
    initializeDatabase,
    getUser,
    createUser,
    updateLastOpened,
    addCard,
    getCard,
    getCardsByRarity,
    addToInventory,
    getUserInventory,
    createTrade,
    updateTradeStatus
};