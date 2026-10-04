import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- MULTIPLAYER ROOM TYPES & STATE ---
export interface PlayerState {
  id: string;
  name: string;
  carId: string;
  isHost: boolean;
  isReady: boolean;
  xPos: number;
  zDistance: number;
  speed: number;
  score: number;
  isNitroActive: boolean;
  isBraking: boolean;
  isCrashed: boolean;
  isFinished: boolean;
  finishTime?: number;
}

export interface RoomState {
  code: string;
  status: 'lobby' | 'countdown' | 'playing' | 'finished';
  maxPlayers: number;
  createdAt: number;
  players: Map<string, PlayerState>;
  sockets: Map<string, WebSocket>;
}

const rooms = new Map<string, RoomState>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function sanitizeRoom(room: RoomState) {
  return {
    code: room.code,
    status: room.status,
    maxPlayers: room.maxPlayers,
    players: Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      carId: p.carId,
      isHost: p.isHost,
      isReady: p.isReady,
      xPos: p.xPos,
      zDistance: p.zDistance,
      speed: p.speed,
      score: p.score,
      isNitroActive: p.isNitroActive,
      isBraking: p.isBraking,
      isCrashed: p.isCrashed,
      isFinished: p.isFinished,
    })),
  };
}

function broadcastToRoom(room: RoomState, message: object, excludeSocketId?: string) {
  const payload = JSON.stringify(message);
  room.sockets.forEach((socket, id) => {
    if (id !== excludeSocketId && socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  });
}

// REST API for room inspection / status
app.get('/api/rooms', (_req, res) => {
  const publicRooms = Array.from(rooms.values())
    .filter((r) => r.status === 'lobby' && r.players.size < r.maxPlayers)
    .map((r) => sanitizeRoom(r));
  res.json({ success: true, rooms: publicRooms });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size, timestamp: Date.now() });
});

// --- WEBSOCKET SERVER SETUP ---
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

wss.on('connection', (ws) => {
  let playerId: string | null = null;
  let roomCode: string | null = null;

  ws.on('message', (rawMessage) => {
    try {
      const data = JSON.parse(rawMessage.toString());
      const type = data.type;

      // 1. CREATE ROOM
      if (type === 'create_room') {
        const { playerName, carId } = data;
        let code = generateRoomCode();
        while (rooms.has(code)) {
          code = generateRoomCode();
        }

        playerId = 'p_' + Math.random().toString(36).substring(2, 9);
        roomCode = code;

        const player: PlayerState = {
          id: playerId,
          name: playerName || 'Racer Host',
          carId: carId || 'specter_gt',
          isHost: true,
          isReady: true,
          xPos: 0,
          zDistance: 0,
          speed: 0,
          score: 0,
          isNitroActive: false,
          isBraking: false,
          isCrashed: false,
          isFinished: false,
        };

        const newRoom: RoomState = {
          code,
          status: 'lobby',
          maxPlayers: 3,
          createdAt: Date.now(),
          players: new Map([[playerId, player]]),
          sockets: new Map([[playerId, ws]]),
        };

        rooms.set(code, newRoom);

        ws.send(
          JSON.stringify({
            type: 'room_created',
            playerId,
            room: sanitizeRoom(newRoom),
          })
        );
      }

      // 2. JOIN ROOM
      else if (type === 'join_room') {
        const { code, playerName, carId } = data;
        const targetCode = (code || '').toUpperCase().trim();
        const room = rooms.get(targetCode);

        if (!room) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: `Room "${targetCode}" not found. Please check code.`,
            })
          );
          return;
        }

        if (room.players.size >= room.maxPlayers) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: `Room "${targetCode}" is full (max ${room.maxPlayers} players).`,
            })
          );
          return;
        }

        if (room.status !== 'lobby') {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: `Race in room "${targetCode}" has already started.`,
            })
          );
          return;
        }

        playerId = 'p_' + Math.random().toString(36).substring(2, 9);
        roomCode = targetCode;

        const player: PlayerState = {
          id: playerId,
          name: playerName || `Racer ${room.players.size + 1}`,
          carId: carId || 'specter_gt',
          isHost: false,
          isReady: false,
          xPos: 0,
          zDistance: 0,
          speed: 0,
          score: 0,
          isNitroActive: false,
          isBraking: false,
          isCrashed: false,
          isFinished: false,
        };

        room.players.set(playerId, player);
        room.sockets.set(playerId, ws);

        ws.send(
          JSON.stringify({
            type: 'room_joined',
            playerId,
            room: sanitizeRoom(room),
          })
        );

        broadcastToRoom(room, {
          type: 'player_joined',
          player,
          room: sanitizeRoom(room),
        });
      }

      // 3. SET READY / CAR CHANGE
      else if (type === 'update_profile') {
        if (!roomCode || !playerId) return;
        const room = rooms.get(roomCode);
        if (!room) return;
        const player = room.players.get(playerId);
        if (!player) return;

        if (typeof data.isReady === 'boolean') player.isReady = data.isReady;
        if (data.carId) player.carId = data.carId;
        if (data.playerName) player.name = data.playerName;

        broadcastToRoom(room, {
          type: 'room_updated',
          room: sanitizeRoom(room),
        });
      }

      // 4. START RACE (HOST ONLY)
      else if (type === 'start_race') {
        if (!roomCode || !playerId) return;
        const room = rooms.get(roomCode);
        if (!room) return;
        const player = room.players.get(playerId);

        if (!player || !player.isHost) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Only the host can start the race.',
            })
          );
          return;
        }

        room.status = 'playing';

        broadcastToRoom(room, {
          type: 'race_starting',
          countdownSeconds: 3,
          room: sanitizeRoom(room),
        });
      }

      // 5. PLAYER PHYSICS UPDATE (10-15 Hz)
      else if (type === 'player_update') {
        if (!roomCode || !playerId) return;
        const room = rooms.get(roomCode);
        if (!room || room.status !== 'playing') return;
        const player = room.players.get(playerId);
        if (!player) return;

        player.xPos = data.xPos ?? player.xPos;
        player.zDistance = data.zDistance ?? player.zDistance;
        player.speed = data.speed ?? player.speed;
        player.score = data.score ?? player.score;
        player.isNitroActive = !!data.isNitroActive;
        player.isBraking = !!data.isBraking;
        player.isCrashed = !!data.isCrashed;

        // Broadcast lightweight movement update to opponents
        broadcastToRoom(
          room,
          {
            type: 'opponent_update',
            playerId,
            xPos: player.xPos,
            zDistance: player.zDistance,
            speed: player.speed,
            score: player.score,
            isNitroActive: player.isNitroActive,
            isBraking: player.isBraking,
            isCrashed: player.isCrashed,
          },
          playerId
        );
      }

      // 6. PLAYER FINISH / CRASH
      else if (type === 'player_finish' || type === 'player_crash') {
        if (!roomCode || !playerId) return;
        const room = rooms.get(roomCode);
        if (!room) return;
        const player = room.players.get(playerId);
        if (!player) return;

        if (type === 'player_crash') {
          player.isCrashed = true;
        }
        player.isFinished = true;
        player.finishTime = Date.now();

        // Check if all players are crashed/finished
        const allDone = Array.from(room.players.values()).every((p) => p.isFinished || p.isCrashed);

        broadcastToRoom(room, {
          type: 'player_status_change',
          playerId,
          isCrashed: player.isCrashed,
          isFinished: player.isFinished,
          score: player.score,
          zDistance: player.zDistance,
          allDone,
          room: sanitizeRoom(room),
        });

        if (allDone) {
          room.status = 'finished';
        }
      }

      // 7. LEAVE ROOM
      else if (type === 'leave_room') {
        handleDisconnect(ws, playerId, roomCode);
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    handleDisconnect(ws, playerId, roomCode);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    handleDisconnect(ws, playerId, roomCode);
  });
});

function handleDisconnect(_ws: WebSocket, playerId: string | null, roomCode: string | null) {
  if (!roomCode || !playerId) return;
  const room = rooms.get(roomCode);
  if (!room) return;

  room.players.delete(playerId);
  room.sockets.delete(playerId);

  if (room.players.size === 0) {
    rooms.delete(roomCode);
  } else {
    // If host disconnected, promote next player
    const remainingPlayers = Array.from(room.players.values());
    if (!remainingPlayers.some((p) => p.isHost)) {
      remainingPlayers[0].isHost = true;
    }

    broadcastToRoom(room, {
      type: 'player_left',
      playerId,
      room: sanitizeRoom(room),
    });
  }
}

// Dev Mode vs Production Middleware setup
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await vite.transformIndexHtml(
          url,
          `<!doctype html><html><head></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`
        );
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, () => {
    console.log(`ST Trafic Racer Server running on http://localhost:${PORT}`);
  });
}

setupServer();
