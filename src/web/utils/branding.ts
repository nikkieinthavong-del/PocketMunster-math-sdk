export function rebrandText(s: string): string {
  return s
    .replace(/Pokémon/gi, 'PocketMonsters')
    .replace(/Pokemon/gi, 'PocketMonsters')
    .replace(/Pok[eé]/gi, 'Pocket');
}