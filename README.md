# Discord Card Collection Bot

A Discord bot for collecting and trading cards with pack opening mechanics, rarity systems, and trading functionality.

## Features

- Pack opening system with regular and chase cards
- Foil card variants with specified probabilities
- Card rarity system (Common, Uncommon, Rare, Legendary, Mythic)
- Inventory management with pagination and filters
- Trading system between users
- Admin commands for card management and user statistics

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here
   ADMIN_USERS=comma_separated_admin_user_ids
   DB_PATH=./data/cards.db
   ```

4. Create a `cards` directory in the root folder for storing card images

5. Deploy slash commands:
   ```bash
   node src/deploy-commands.js
   ```

6. Start the bot:
   ```bash
   npm start
   ```

## Commands

### User Commands
- `/open` - Open a card pack (24h cooldown)
- `/inventory [user] [page] [rarity]` - View card collection
- `/trade @user <card-id>` - Initiate a trade with another user

### Admin Commands
- `/admin addcard <name> <rarity> <image>` - Add a new card
- `/admin checkuser @user` - View detailed user statistics

## Card System

### Pack Structure
- 5 Regular cards
  - Foil chance: 1/16 (max 2 per pack)
  - Rarities: Common (65%), Uncommon (25%), Rare (10%)

- 1 Chase card
  - Foil chance: 1/10
  - Rarities: Uncommon (50%), Rare (35%), Legendary (12%), Mythic (3%)

## Development

To run the bot in development mode with auto-reload:
```bash
npm run dev
```

## Database

The bot uses SQLite for data storage with the following tables:
- Users: Stores user data and pack opening cooldowns
- Cards: Stores card information and images
- Inventory: Tracks user card collections
- Trades: Manages trading system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request