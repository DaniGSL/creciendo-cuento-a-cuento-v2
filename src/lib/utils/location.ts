export interface LocationOption {
  value: string;
  key: string;
  emoji: string;
}

export const LOCATIONS: LocationOption[] = [
  { value: "Casa",        key: "loc_casa",       emoji: "🏠" },
  { value: "Bosque",      key: "loc_bosque",     emoji: "🌲" },
  { value: "Ciudad",      key: "loc_ciudad",     emoji: "🏙️" },
  { value: "Playa",       key: "loc_playa",      emoji: "🌊" },
  { value: "Montaña",     key: "loc_montana",    emoji: "🏔️" },
  { value: "Espacio",     key: "loc_espacio",    emoji: "🚀" },
  { value: "País mágico", key: "loc_pais_magico",emoji: "🏰" },
  { value: "Escuela",     key: "loc_escuela",    emoji: "🏫" },
  { value: "Otro",        key: "loc_otro",       emoji: "✏️" },
];
