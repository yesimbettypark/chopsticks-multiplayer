# Multiplayer Chopsticks Game

A web-based multiplayer version of the classic Chopsticks game.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:3000/multiplayer.html in your browser

## Deployment to Render.com

1. Create a new Web Service on Render.com
2. Connect your GitHub repository
3. Use these settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
   - Plan: Free

## How to Play

1. One player creates a game and gets a room code
2. The other player joins using the room code
3. Take turns attacking or splitting your fingers
4. First player to get both opponent's hands to 0 wins!

## Game Rules

- Each player starts with 1 finger on each hand
- On your turn, you can either:
  - Attack: Add your hand's value to an opponent's hand
  - Split: Redistribute your fingers between your hands
- If a hand reaches 5, it becomes 0
- First player to get both opponent's hands to 0 wins

## Files

- `server.js`: The Node.js server that handles game logic and player connections
- `multiplayer.html`: The client-side game with UI
- `chopsticks.html`: A standalone version that can be played locally
- `package.json`: Node.js dependencies

## Development

For development with automatic server restart:

```bash
npm run dev
```

## Technologies Used

- Node.js and Express for the server
- Socket.io for real-time communication
- p5.js for the hand visualizations
- HTML/CSS/JavaScript for the client-side UI 