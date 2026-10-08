const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Connexion réseau sécurisée pour Render et Socket.io
const io = new Server(server, {
    cors: { origin: "*" },
    transports: ['websocket', 'polling']
});

// CORRECTION ICI : "Public" avec un P majuscule pour correspondre à ton dossier GitHub
app.use(express.static(path.join(__dirname, 'Public')));

// Gestion élémentaire des salons de jeu en ligne
const rooms = new Map();

io.on('connection', (socket) => {
    console.log(`[CONNEXION] Joueur connecté au serveur : ${socket.id}`);

    // Action : Créer une partie
    socket.on('createGame', (data) => {
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        rooms.set(roomCode, { host: socket.id, players: [data.playerName] });
        socket.join(roomCode);
        socket.emit('gameCreated', { roomCode: roomCode });
        console.log(`[SALON] Partie créée avec le code : ${roomCode}`);
    });

    // Action : Rejoindre une partie par son code
    socket.on('joinGame', (data) => {
        const code = data.roomCode?.toUpperCase();
        if (rooms.has(code)) {
            rooms.get(code).players.push(data.playerName);
            socket.join(code);
            io.to(code).emit('lobbyUpdate', { players: rooms.get(code).players });
            console.log(`[SALON] ${data.playerName} a rejoint la salle : ${code}`);
        } else {
            socket.emit('joinError', "Le code de salle n'existe pas ou est invalide.");
        }
    });

    socket.on('disconnect', () => {
        console.log(`[DECONNEXION] Joueur déconnecté : ${socket.id}`);
    });
});

// Lancement automatique sur le port réseau attribué par Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[SERVEUR EN LIGNE] Le jeu tourne sur le port : ${PORT}`);
});
