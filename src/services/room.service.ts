import valkey from "../lib/valkey.js";

const isValidRoom = (room: string) => {
  const isValid =
    room === "global" ||
    room.startsWith("lobby-") ||
    room.startsWith("game-session");
  return isValid;
};

const addPlayerToRoom = async (playerId: string, room: string) => {
  await valkey.sadd(`room:${room}`, playerId);
};

const removePlayerFromRoom = async (playerId: string, room: string) => {
  await valkey.srem(`room:${room}`, playerId);
};

const isPlayerInRoom = async (playerId: string, room: string) => {
  const isMember = await valkey.sismember(`room:${room}`, playerId);
  return isMember;
};

export default {
  isValidRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  isPlayerInRoom
};
