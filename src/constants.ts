export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  color: string;
}

export const DUMMY_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Neon Pulse',
    artist: 'Cyber Synth',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Stable test URL
    color: '#ff00ff', // Magenta
  },
  {
    id: '2',
    title: 'Grid Runner',
    artist: 'Digital Ghost',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Stable test URL
    color: '#00ffff', // Cyan
  },
  {
    id: '3',
    title: 'Synth Dreams',
    artist: 'Retro Wave',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', // Stable test URL
    color: '#39ff14', // Lime
  },
];

export const LOSE_TRACK = {
  id: 'lose',
  title: 'Game Over',
  artist: 'System Error',
  url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', // Stable test URL
  color: '#ff4444',
};
