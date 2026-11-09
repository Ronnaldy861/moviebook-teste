export interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
}

export interface Work {
  id: number;
  title: string;
  type: "filme" | "livro";
  synopsis: string;
  year: number;
  cover_url: string | null;
  genre: string | null;
  genre_id: number | null;
  created_by: number;
  rating_avg: number;
  rating_count: number;
}