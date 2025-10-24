export type Repository = {
  id: number;
  node_id?: string;
  name: string;
  full_name: string;
  private?: boolean;
  owner: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
  };
  html_url: string;
  description: string;
  forks_count: number;
  url?: string;
  forks_url?: string;
  keys_url?: string;
  collaborators_url?: string;
  stargazers_count: number;
  language?: string;
  updated_at?: string;
  created_at?: string;
  topics?: string[];
};