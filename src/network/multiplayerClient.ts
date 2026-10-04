export interface NetworkPlayer {
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
  // Interpolation targets for smooth ghost rendering
  targetXPos?: number;
  targetZDistance?: number;
  targetSpeed?: number;
  lastUpdateTs?: number;
}

export interface NetworkRoom {
  code: string;
  status: 'lobby' | 'countdown' | 'playing' | 'finished';
  maxPlayers: number;
  players: NetworkPlayer[];
}

export interface OpponentUpdate {
  playerId: string;
  xPos: number;
  zDistance: number;
  speed: number;
  score: number;
  isNitroActive: boolean;
  isBraking: boolean;
  isCrashed: boolean;
}

export type NetworkEventCallback = {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onRoomCreated?: (room: NetworkRoom, myPlayerId: string) => void;
  onRoomJoined?: (room: NetworkRoom, myPlayerId: string) => void;
  onRoomUpdated?: (room: NetworkRoom) => void;
  onRaceStarting?: (countdownSeconds: number) => void;
  onOpponentUpdate?: (update: OpponentUpdate) => void;
  onPlayerStatusChange?: (data: { playerId: string; isCrashed: boolean; isFinished: boolean; allDone: boolean; room: NetworkRoom }) => void;
  onError?: (message: string) => void;
};

export class MultiplayerClient {
  private socket: WebSocket | null = null;
  private serverUrl: string;
  public myPlayerId: string | null = null;
  public currentRoom: NetworkRoom | null = null;
  public isConnected = false;
  private callbacks: NetworkEventCallback = {};

  constructor(customUrl?: string) {
    if (customUrl) {
      this.serverUrl = customUrl;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      this.serverUrl = `${protocol}//${host}/ws`;
    }
  }

  public setCallbacks(cb: NetworkEventCallback) {
    this.callbacks = { ...this.callbacks, ...cb };
  }

  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
        resolve(true);
        return;
      }

      try {
        this.socket = new WebSocket(this.serverUrl);

        this.socket.onopen = () => {
          this.isConnected = true;
          this.callbacks.onConnected?.();
          resolve(true);
        };

        this.socket.onclose = () => {
          this.isConnected = false;
          this.callbacks.onDisconnected?.();
        };

        this.socket.onerror = (err) => {
          console.error('Multiplayer client WebSocket error:', err);
          this.isConnected = false;
          this.callbacks.onError?.('Failed to connect to multiplayer server.');
          resolve(false);
        };

        this.socket.onmessage = (evt) => {
          this.handleMessage(evt.data);
        };
      } catch (err) {
        console.error('Failed to construct WebSocket:', err);
        this.callbacks.onError?.('Invalid server URL or WebSocket restricted.');
        resolve(false);
      }
    });
  }

  private handleMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);
      const type = msg.type;

      if (type === 'room_created') {
        this.myPlayerId = msg.playerId;
        this.currentRoom = msg.room;
        this.callbacks.onRoomCreated?.(msg.room, msg.playerId);
      } else if (type === 'room_joined') {
        this.myPlayerId = msg.playerId;
        this.currentRoom = msg.room;
        this.callbacks.onRoomJoined?.(msg.room, msg.playerId);
      } else if (type === 'player_joined' || type === 'room_updated' || type === 'player_left') {
        this.currentRoom = msg.room;
        this.callbacks.onRoomUpdated?.(msg.room);
      } else if (type === 'race_starting') {
        this.currentRoom = msg.room;
        this.callbacks.onRaceStarting?.(msg.countdownSeconds || 3);
      } else if (type === 'opponent_update') {
        this.callbacks.onOpponentUpdate?.({
          playerId: msg.playerId,
          xPos: msg.xPos,
          zDistance: msg.zDistance,
          speed: msg.speed,
          score: msg.score,
          isNitroActive: msg.isNitroActive,
          isBraking: msg.isBraking,
          isCrashed: msg.isCrashed,
        });
      } else if (type === 'player_status_change') {
        this.currentRoom = msg.room;
        this.callbacks.onPlayerStatusChange?.({
          playerId: msg.playerId,
          isCrashed: msg.isCrashed,
          isFinished: msg.isFinished,
          allDone: msg.allDone,
          room: msg.room,
        });
      } else if (type === 'error') {
        this.callbacks.onError?.(msg.message);
      }
    } catch (e) {
      console.error('Error handling server WebSocket payload:', e);
    }
  }

  public createRoom(playerName: string, carId: string) {
    this.send({
      type: 'create_room',
      playerName,
      carId,
    });
  }

  public joinRoom(code: string, playerName: string, carId: string) {
    this.send({
      type: 'join_room',
      code,
      playerName,
      carId,
    });
  }

  public updateProfile(isReady: boolean, carId: string, playerName: string) {
    this.send({
      type: 'update_profile',
      isReady,
      carId,
      playerName,
    });
  }

  public startRace() {
    this.send({
      type: 'start_race',
    });
  }

  public sendPlayerUpdate(physics: {
    xPos: number;
    zDistance: number;
    speed: number;
    score: number;
    isNitroActive: boolean;
    isBraking: boolean;
    isCrashed: boolean;
  }) {
    this.send({
      type: 'player_update',
      ...physics,
    });
  }

  public sendCrash() {
    this.send({
      type: 'player_crash',
    });
  }

  public leaveRoom() {
    this.send({
      type: 'leave_room',
    });
    this.currentRoom = null;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentRoom = null;
  }

  private send(obj: object) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(obj));
    }
  }
}
