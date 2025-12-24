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

// Documentation page types
export interface DocumentationItem {
  id: number;
  title: string;
  description: string;
  iconName: string;
}

export interface BudgetSubItem {
  name: string;
  amount: number;
}

export interface BudgetDetail {
  name: string;
  amount: number;
  subItems?: BudgetSubItem[];
}

export interface BudgetCategory {
  id: number;
  category: string;
  amount: number;
  percentage: number;
  details: BudgetDetail[];
}
