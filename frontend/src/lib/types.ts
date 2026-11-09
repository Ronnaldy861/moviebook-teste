
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

  // Novos campos
  creator: string | null;
  company: string | null;
  length: number | null;
  age_rating: string;

  // Capa
  cover_url: string | null;

  // Vários gêneros
  genres: Genre[];
  genre_ids: number[];

  // Campos antigos mantidos temporariamente
  author: string | null;
  genre: string | null;
  genre_id: number | null;

  created_by: number | null;

  // Avaliações
  rating_avg: number | null;
  rating_count: number;
}
