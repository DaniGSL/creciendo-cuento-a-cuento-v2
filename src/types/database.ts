/**
 * Supabase database types.
 * This file will be overwritten when you run:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 *
 * For now, types are defined manually to match the migration schema.
 */

export type ReadingLevel =
  | "infantil"
  | "primaria_baja"
  | "primaria_media"
  | "primaria_alta"
  | "secundaria"
  | "adulto";

export type StoryLanguage =
  | "español"
  | "catalán"
  | "gallego"
  | "inglés"
  | "francés"
  | "holandés"
  | "alemán"
  | "árabe"
  | "urdu";

export type StoryGenre =
  | "Aventura"
  | "Fantasía"
  | "Cuento de hadas"
  | "Fábula"
  | "Misterio"
  | "Leyenda"
  | "Ciencia ficción"
  | "Humor"
  | "Cuento de Cuna"
  | "Otro";

export interface AccessCode {
  code: string;
  label: string | null; // encrypted at app level
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  code_hash: string;
  lang_ui: string;
  created_at: string;
  last_access: string;
  is_active: boolean;
}

export interface Character {
  id: string;
  profile_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface StoryCharacter {
  id: string;
  name: string;
  description: string;
}

export interface Story {
  id: string;
  profile_id: string;
  title: string;
  content: string;
  genre: StoryGenre;
  language: StoryLanguage;
  reading_level: ReadingLevel;
  reading_time: number; // minutes
  characters: StoryCharacter[];
  is_favorite: boolean;
  rating: number | null; // 1-5
  created_at: string;
}

// Generic Supabase Database type (used for createClient<Database>)
export interface Database {
  public: {
    Tables: {
      access_codes: {
        Row: AccessCode;
        Insert: Omit<AccessCode, "created_at">;
        Update: Partial<Omit<AccessCode, "code">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id" | "created_at" | "last_access">;
        Update: Partial<Omit<Profile, "id">>;
      };
      characters: {
        Row: Character;
        Insert: Omit<Character, "id" | "created_at">;
        Update: Partial<Omit<Character, "id" | "profile_id">>;
      };
      stories: {
        Row: Story;
        Insert: Omit<Story, "id" | "created_at" | "is_favorite" | "rating">;
        Update: Partial<
          Pick<Story, "title" | "is_favorite" | "rating">
        >;
      };
    };
  };
}
