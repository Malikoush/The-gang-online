import { randomInt } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sans I/O pour éviter la confusion visuelle

export function generateRoomCode(existing: (code: string) => boolean): string {
  let code: string;
  do {
    code = Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  } while (existing(code));
  return code;
}
