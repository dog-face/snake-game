export interface Game {
  id: string;
  title: string;
  description: string;
  route: string;
  thumbnail?: string;
  available: boolean;
}

export const GAMES: Game[] = [
  {
    id: 'snake',
    title: 'Snake',
    description: 'Classic snake game. Eat food to grow longer and increase your score!',
    route: '/games/snake',
    available: true,
  },
  {
    id: 'fps',
    title: 'FPS Arena',
    description: '3D first-person shooter arena. Coming soon!',
    route: '/games/fps',
    available: false,
  },
];

