import { supabase } from './supabase';

export const auth = {
  async getUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting user:', error);
        return null;
      }
      return user;
    } catch (error) {
      console.error('Exception getting user:', error);
      return null;
    }
  },

async signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // Changed this
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    if (error) {
      console.error('Google sign in error:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Exception during Google sign in:', error);
    return { data: null, error };
  }
}

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      return { error };
    } catch (error) {
      console.error('Exception during sign out:', error);
      return { error };
    }
  },

  // Add this to handle the callback
  async handleAuthCallback() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session) {
        console.log('Auth callback successful:', session);
        return { data: session, error: null };
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      return { data: null, error };
    }
  }
};
