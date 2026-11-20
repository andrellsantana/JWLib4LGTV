/** Formato reduzido de um vídeo, guardado em cache na TV. */
export interface VideoFile {
  label: string; // 240p, 360p, 480p, 720p
  url: string;
  subtitles?: string; // .vtt
  height: number;
}

export interface Video {
  id: string; // naturalKey, ex.: pub-jwb-143_T_1_VIDEO
  langAgnosticId: string; // ex.: pub-jwb-143_1_VIDEO (para trocar de idioma)
  title: string;
  description: string;
  published: string; // ISO
  duration: number; // segundos
  durationText: string; // 1:00:00
  thumb: string; // 16:9 pequena
  image: string; // 16:9 grande
  files: VideoFile[];
  category: string; // nome da categoria
  categoryKey: string;
  subcategory: string;
}

export interface Subcategory {
  key: string;
  name: string;
  videos: Video[];
}

export interface Category {
  key: string;
  name: string;
  description: string;
  subcategories: Subcategory[];
}

export interface Catalog {
  fetchedAt: string;
  language: string;
  latest: Video[];
  categories: Category[];
}
