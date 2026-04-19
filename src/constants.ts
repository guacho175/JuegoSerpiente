export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  color: string;
}

// Tracks lofi / ambient / chillwave - libres de copyright (Pixabay CDN)
// Se han seleccionado variantes suaves, relajadas y no tan "eléctricas" a petición.
export const DUMMY_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Lofi Study',
    artist: 'FASSounds',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    color: '#00ffff',
  },
  {
    id: '2',
    title: 'Rainy Night',
    artist: 'Chillstep',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/18/audio_1ccb6f500d.mp3',
    color: '#c084fc',
  },
  {
    id: '3',
    title: 'Acoustic Chill',
    artist: 'MusicForVideos',
    url: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_972cb7b264.mp3',
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
