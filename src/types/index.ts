// Shared TypeScript interfaces for the application

export interface ChooseUsCard {
  id: number;
  text: string;
  title: string;
  image: string;
}

export interface Partner {
  id: number;
  image: string;
}

export interface BlogPost {
  id: number;
  image: string;
  title: string;
  letter: string;
  date: string;
  hot: boolean;
}
