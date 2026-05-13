import { supabase } from '@/lib/supabase';

/**
 * Returns the currently authenticated user.
 * Throws an error if the user is not authenticated.
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }
  return user;
}
