export interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Work {
  id: number;
  title: string;
  type: "filme" | "livro";
  synopsis: string | null;
  year: number | null;
  cover_url: string | null;
  genre: string | null;       // gêneros juntos: "Ação / Drama"
  genres: string[];           // nomes dos gêneros
  genre_ids: number[];        // ids dos gêneros
  creator: string | null;     // diretor ou autor
  company: string | null;     // estúdio ou editora
  length: number | null;      // minutos ou páginas
  age_rating: string | null;
  created_by: number | null;
  rating_avg: number | null;
  rating_count: number;
}

export interface Review {
  id: number;
  user_name: string;
  score: number;
  comment: string | null;
  created_at: string;
}

export interface MyStatus {
  is_favorite: boolean;
  my_score: number | null;
  my_comment: string | null;
}