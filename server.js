const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static('.'));

// Get port from environment variable or use 3000
const PORT = process.env.PORT || 3000;

// Store active games
const games = new Map();

// Game rooms storage
const gameRooms = {};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  
  // Player requests to create a new game
  socket.on('createGame', (playerName) => {
    const roomId = generateRoomId();
    
    // Create a new game room
    gameRooms[roomId] = {
      id: roomId,
      players: [{
        id: socket.id,
        name: playerName,
        role: 'player1'
      }],
      gameState: {
        player1: { leftHand: 1, rightHand: 1 },
        player2: { leftHand: 1, rightHand: 1 },
        currentTurn: 'player1'
      }
    };
    
    // Join the room
    socket.join(roomId);
    
    // Send room info back to the creator
    socket.emit('gameCreated', {
      roomId,
      role: 'player1',
      gameState: gameRooms[roomId].gameState
    });
    
    console.log(`Game created by ${playerName}, Room ID: ${roomId}`);
  });
  
  // Player requests to join an existing game
  socket.on('joinGame', (data) => {
    const { roomId, playerName } = data;
    const room = gameRooms[roomId];
    
    // Check if room exists and has space
    if (!room) {
      socket.emit('error', { message: 'Game room not found!' });
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('error', { message: 'Game room is full!' });
      return;
    }
    
    // Add player to the room
    room.players.push({
      id: socket.id,
      name: playerName,
      role: 'player2'
    });
    
    // Join the room
    socket.join(roomId);
    
    // Notify both players
    socket.emit('gameJoined', {
      roomId,
      role: 'player2',
      gameState: room.gameState
    });
    
    io.to(roomId).emit('gameReady', {
      players: room.players.map(p => ({
        name: p.name,
        role: p.role
      })),
      gameState: room.gameState
    });
    
    console.log(`${playerName} joined room ${roomId}`);
  });
  
  // Handle player moves
  socket.on('makeMove', (data) => {
    const { roomId, action, handChoice, targetHand } = data;
    const room = gameRooms[roomId];
    
    if (!room) {
      socket.emit('error', { message: 'Game room not found!' });
      return;
    }
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'Player not found in this game!' });
      return;
    }
    
    const { gameState } = room;
    
    // Check if it's the player's turn
    if (gameState.currentTurn !== player.role) {
      socket.emit('error', { message: 'Not your turn!' });
      return;
    }
    
    // Process the move based on action type
    let moveSuccessful = false;
    
    if (action === 'attack') {
      moveSuccessful = processAttack(gameState, player.role, handChoice, targetHand);
    } else if (action === 'split') {
      moveSuccessful = processSplit(gameState, player.role, handChoice, targetHand);
    }
    
    if (moveSuccessful) {
      // Switch turns
      gameState.currentTurn = gameState.currentTurn === 'player1' ? 'player2' : 'player1';
      
      // Check for game over condition
      const gameOver = checkGameOver(gameState);
      
      // Broadcast updated game state to all players in the room
      io.to(roomId).emit('gameUpdated', {
        gameState,
        gameOver
      });
    } else {
      socket.emit('error', { message: 'Invalid move!' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
    
    // Find and clean up any rooms this player was in
    for (const roomId in gameRooms) {
      const room = gameRooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        // Notify other player that this player left
        socket.to(roomId).emit('playerLeft', {
          playerName: room.players[playerIndex].name
        });
        
        // Remove the room if it was the last player
        if (room.players.length <= 1) {
          delete gameRooms[roomId];
          console.log(`Room ${roomId} deleted`);
        } else {
          // Remove the player from the room
          room.players.splice(playerIndex, 1);
        }
        
        break;
      }
    }
  });
});

// Helper functions
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function processAttack(gameState, playerRole, attackingHand, targetHand) {
  const attacker = gameState[playerRole];
  const defender = gameState[playerRole === 'player1' ? 'player2' : 'player1'];
  
  // Get attack value (left or right hand)
  const attackValue = attackingHand === 'left' ? attacker.leftHand : attacker.rightHand;
  
  // Validate attack
  if (attackValue === 0) return false;
  
  // Get target hand value
  const targetHandValue = targetHand === 'left' ? defender.leftHand : defender.rightHand;
  
  // Validate target
  if (targetHandValue === 0) return false;
  
  // Perform attack
  if (targetHand === 'left') {
    defender.leftHand = (defender.leftHand + attackValue) % 5;
    if (defender.leftHand === 0) defender.leftHand = 0; // Ensure 0 is actually 0, not 5
  } else {
    defender.rightHand = (defender.rightHand + attackValue) % 5;
    if (defender.rightHand === 0) defender.rightHand = 0;
  }
  
  return true;
}

function processSplit(gameState, playerRole, newLeftValue, newRightValue) {
  const player = gameState[playerRole];
  const currentTotal = player.leftHand + player.rightHand;
  
  // Validate split - total must be same, and values can't be the same as before
  if (newLeftValue + newRightValue !== currentTotal) return false;
  if (newLeftValue === player.leftHand && newRightValue === player.rightHand) return false;
  if (newLeftValue < 0 || newRightValue < 0) return false;
  
  // Perform split
  player.leftHand = newLeftValue;
  player.rightHand = newRightValue;
  
  return true;
}

function checkGameOver(gameState) {
  const player1Defeated = gameState.player1.leftHand === 0 && gameState.player1.rightHand === 0;
  const player2Defeated = gameState.player2.leftHand === 0 && gameState.player2.rightHand === 0;
  
  if (player1Defeated) {
    return { winner: 'player2' };
  } else if (player2Defeated) {
    return { winner: 'player1' };
  }
  
  return null;
}

// Start server
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 