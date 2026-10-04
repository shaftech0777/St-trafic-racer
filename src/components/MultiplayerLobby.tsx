import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Copy, Check, Play, Car, ShieldCheck, Wifi, WifiOff, PlusCircle, LogIn, RefreshCw } from 'lucide-react';
import { MultiplayerClient, NetworkRoom, NetworkPlayer } from '../network/multiplayerClient';
import { CarSpec, GameSettings } from '../types/game';
import { AVAILABLE_CARS } from '../data/cars';
import { soundManager } from '../audio/soundManager';
import { haptics } from '../utils/haptics';

interface MultiplayerLobbyProps {
  client: MultiplayerClient;
  settings: GameSettings;
  availableCars: CarSpec[];
  defaultCarId: string;
  onBack: () => void;
  onStartMultiplayerRace: (room: NetworkRoom, myPlayerId: string) => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  client,
  settings,
  availableCars,
  defaultCarId,
  onBack,
  onStartMultiplayerRace,
}) => {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('st_racer_player_name') || 'Racer Driver';
  });
  const [selectedCarId, setSelectedCarId] = useState(defaultCarId);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoiningModalOpen, setIsJoiningModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const [currentRoom, setCurrentRoom] = useState<NetworkRoom | null>(client.currentRoom);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(client.myPlayerId);
  const [isConnected, setIsConnected] = useState(client.isConnected);

  // Sync player name to localStorage
  useEffect(() => {
    localStorage.setItem('st_racer_player_name', playerName);
  }, [playerName]);

  // Connect & listen to WebSocket client callbacks
  useEffect(() => {
    client.setCallbacks({
      onConnected: () => {
        setIsConnected(true);
        setIsConnecting(false);
        setErrorMessage(null);
      },
      onDisconnected: () => {
        setIsConnected(false);
        setIsConnecting(false);
      },
      onRoomCreated: (room, pId) => {
        setCurrentRoom(room);
        setMyPlayerId(pId);
        setErrorMessage(null);
      },
      onRoomJoined: (room, pId) => {
        setCurrentRoom(room);
        setMyPlayerId(pId);
        setIsJoiningModalOpen(false);
        setErrorMessage(null);
      },
      onRoomUpdated: (room) => {
        setCurrentRoom(room);
      },
      onRaceStarting: () => {
        if (client.currentRoom && client.myPlayerId) {
          onStartMultiplayerRace(client.currentRoom, client.myPlayerId);
        }
      },
      onError: (msg) => {
        setErrorMessage(msg);
        setIsConnecting(false);
      },
    });

    if (!client.isConnected) {
      setIsConnecting(true);
      client.connect();
    }
  }, [client, onStartMultiplayerRace]);

  const handleCreateRoom = async () => {
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    setErrorMessage(null);

    if (!client.isConnected) {
      setIsConnecting(true);
      const ok = await client.connect();
      if (!ok) return;
    }

    client.createRoom(playerName, selectedCarId);
  };

  const handleJoinRoom = async (codeToJoin?: string) => {
    const code = (codeToJoin || joinCodeInput).trim().toUpperCase();
    if (!code) {
      setErrorMessage('Please enter a valid room code.');
      return;
    }

    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    setErrorMessage(null);

    if (!client.isConnected) {
      setIsConnecting(true);
      const ok = await client.connect();
      if (!ok) return;
    }

    client.joinRoom(code, playerName, selectedCarId);
  };

  const handleToggleReady = () => {
    if (!currentRoom || !myPlayerId) return;
    const me = currentRoom.players.find((p) => p.id === myPlayerId);
    if (!me) return;

    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    client.updateProfile(!me.isReady, selectedCarId, playerName);
  };

  const handleSelectCarInLobby = (carId: string) => {
    setSelectedCarId(carId);
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();

    if (currentRoom && myPlayerId) {
      const me = currentRoom.players.find((p) => p.id === myPlayerId);
      client.updateProfile(me?.isReady ?? false, carId, playerName);
    }
  };

  const handleStartRaceHost = () => {
    if (!currentRoom || !myPlayerId) return;
    haptics.nitro(settings.hapticsEnabled);
    soundManager.playClick();
    client.startRace();
  };

  const handleCopyCode = () => {
    if (!currentRoom) return;
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    try {
      navigator.clipboard.writeText(currentRoom.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Safe fallback
    }
  };

  const handleLeaveRoom = () => {
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    client.leaveRoom();
    setCurrentRoom(null);
  };

  const handleBack = () => {
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    if (currentRoom) {
      client.leaveRoom();
    }
    onBack();
  };

  const myPlayer = currentRoom?.players.find((p) => p.id === myPlayerId);
  const isHost = myPlayer?.isHost ?? false;
  const canStartRace = isHost && (currentRoom?.players.length ?? 0) >= 1;

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 bg-slate-100/95 dark:bg-[#06080e]/95 backdrop-blur-xl pointer-events-auto overflow-y-auto">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 active:scale-95 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menu</span>
        </button>

        <div className="text-center">
          <h2 className="font-racing text-2xl font-bold text-slate-900 dark:text-white tracking-wide">
            MULTIPLAYER
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Real-Time Highway Battles</p>
        </div>

        {/* Server Connection Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium shadow-sm">
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                {isConnecting ? 'CONNECTING...' : 'OFFLINE'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Error Alert Message */}
      {errorMessage && (
        <div className="w-full max-w-sm mx-auto mt-2 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 text-center animate-shake">
          {errorMessage}
        </div>
      )}

      {/* VIEW 1: OUTSIDE ROOM - CREATE OR JOIN */}
      {!currentRoom ? (
        <div className="w-full max-w-sm mx-auto my-auto space-y-4 py-4">
          {/* Driver Name Card */}
          <div className="bg-white/90 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-sm">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Driver Name
            </label>
            <input
              type="text"
              maxLength={14}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your handle..."
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Car Selector Pills */}
          <div className="bg-white/90 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-sm">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Select Racing Machine
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableCars.map((car) => {
                const isSelected = car.id === selectedCarId;
                return (
                  <button
                    key={car.id}
                    onClick={() => setSelectedCarId(car.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: car.bodyColor }} />
                    <span className="truncate">{car.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleCreateRoom}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-racing text-xl font-extrabold tracking-wider rounded-xl shadow-xl glow-cyan active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
              <span>CREATE ROOM</span>
            </button>

            <button
              onClick={() => setIsJoiningModalOpen(true)}
              className="w-full py-3.5 px-6 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-racing text-xl font-extrabold tracking-wider rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5 stroke-[2.5] text-amber-500 dark:text-amber-400" />
              <span>JOIN WITH CODE</span>
            </button>
          </div>
        </div>
      ) : (
        /* VIEW 2: INSIDE ROOM LOBBY */
        <div className="w-full max-w-sm mx-auto my-auto space-y-4 py-3">
          {/* Room Code Banner */}
          <div className="bg-white/95 dark:bg-slate-950/80 border border-cyan-500/40 rounded-2xl p-4 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                ROOM CODE
              </span>
              <span className="font-mono-num text-3xl font-black text-cyan-600 dark:text-cyan-400 tracking-wider">
                {currentRoom.code}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 rounded-xl text-xs font-bold text-cyan-600 dark:text-cyan-400 active:scale-95 transition-all"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'COPIED!' : 'COPY'}</span>
            </button>
          </div>

          {/* Connected Players Grid */}
          <div className="bg-white/90 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-500" /> Connected Racers ({currentRoom.players.length}/{currentRoom.maxPlayers})
              </span>
            </div>

            <div className="space-y-2">
              {currentRoom.players.map((p) => {
                const car = AVAILABLE_CARS.find((c) => c.id === p.carId) || AVAILABLE_CARS[0];
                const isMe = p.id === myPlayerId;

                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isMe
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-slate-900 dark:text-white'
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: car.bodyColor }} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm leading-tight">{p.name}</span>
                          {p.isHost && (
                            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded text-[9px] font-black">
                              HOST
                            </span>
                          )}
                          {isMe && (
                            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">(YOU)</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{car.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {p.isReady ? (
                        <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-md text-[10px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> READY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-slate-500 dark:text-slate-400 rounded-md text-[10px] font-semibold">
                          NOT READY
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* In-Lobby Car Quick Picker */}
          <div className="bg-white/90 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-2xl p-3 space-y-1.5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Change Car
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {availableCars.map((car) => {
                const isSelected = car.id === selectedCarId;
                return (
                  <button
                    key={car.id}
                    onClick={() => handleSelectCarInLobby(car.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-600 dark:text-cyan-400'
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: car.bodyColor }} />
                    <span className="truncate max-w-[80px]">{car.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="space-y-2 pt-1">
            {!isHost ? (
              <button
                onClick={handleToggleReady}
                className={`w-full py-3.5 px-6 font-racing text-xl font-extrabold tracking-wider rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 ${
                  myPlayer?.isReady
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 glow-cyan'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 glow-orange'
                }`}
              >
                <span>{myPlayer?.isReady ? 'READY! (TAP TO UNREADY)' : 'SET READY'}</span>
              </button>
            ) : (
              <button
                onClick={handleStartRaceHost}
                disabled={!canStartRace}
                className={`w-full py-3.5 px-6 font-racing text-xl font-extrabold tracking-wider rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 ${
                  canStartRace
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-slate-950 glow-orange active:scale-95'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>START MULTIPLAYER RACE</span>
              </button>
            )}

            <button
              onClick={handleLeaveRoom}
              className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors text-center"
            >
              Leave Room
            </button>
          </div>
        </div>
      )}

      {/* Modal: Enter Room Code */}
      {isJoiningModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-[#06080e]/90 backdrop-blur-md">
          <div className="w-full max-w-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="font-racing text-xl font-bold text-slate-900 dark:text-white text-center">
              ENTER ROOM CODE
            </h3>

            <input
              type="text"
              maxLength={6}
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. RACE7"
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-center font-mono-num text-2xl font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest focus:outline-none focus:border-cyan-500"
            />

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setIsJoiningModalOpen(false)}
                className="py-2.5 px-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleJoinRoom()}
                className="py-2.5 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-racing font-extrabold tracking-wider shadow-md"
              >
                JOIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
