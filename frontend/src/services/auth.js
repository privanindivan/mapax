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
          redirectTo: window.location.origin,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Exception during Google sign in:', error);
      return { data: null, error };
    }
  }, // Added comma here

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
  }, // Added comma here

  async handleAuthCallback() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session) {
        console.log('Auth callback successful:', session);
        return { data: session, error: null };
      }
      return { data: null, error: null };
    } catch (error) {
      console.error('Auth callback error:', error);
      return { data: null, error };
    }
  }
};
