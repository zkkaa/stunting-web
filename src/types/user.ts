export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  no_hp: string | null;
  password: string; // hash, tidak pernah dikirim ke client dalam bentuk plain
  profile_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Data user yang aman ditaruh di state/localStorage (password sudah di-strip)
export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  no_hp: string | null;
  profile_image: string | null;
}