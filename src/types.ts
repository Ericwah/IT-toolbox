export interface Person {
  id: string;
  name: string;
}

export interface Group {
  id: number;
  members: Person[];
}

export type AppTab = 'source' | 'draw' | 'group';
