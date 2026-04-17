export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  color: string;
}

// Tracks lofi / ambient / chillwave - libres de copyright (Pixabay CDN)
export const DUMMY_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Midnight City',
    artist: 'Lofi Dreams',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946b12aa5e.mp3',
    color: '#00ffff',
  },
  {
    id: '2',
    title: 'Neon Rain',
    artist: 'Ambient Wave',
    url: 'https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc508520.mp3',
    color: '#c084fc',
  },
  {
    id: '3',
    title: 'Digital Drift',
    artist: 'Cyber Lofi',
    url: 'https://cdn.pixabay.com/download/audio/2023/01/17/audio_8e3afacba5.mp3',
    color: '#4ade80',
  },
];

// Sonido corto 8-bit de game over (efecto de sonido, no canción)
export const LOSE_TRACK = {
  id: 'lose',
  title: 'Sistema caído',
  artist: 'Error 404',
  url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_8e28cfb2c6.mp3',
  color: '#f43f5e',
};
