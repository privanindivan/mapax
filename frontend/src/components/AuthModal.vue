<template>
  <div class="auth-modal-overlay" @click.self="handleClose">
    <div class="auth-modal">
      <button v-if="allowClose" @click="$emit('close')" class="close-button">×</button>
      <h2>Sign In Required</h2>
      <p>Please sign in to add and view places</p>
      <button @click="handleGoogleSignIn" class="google-button">
        <span class="google-icon">G</span>
        Sign in with Google
      </button>
    </div>
  </div>
</template>

<script>
import { supabase } from '../services/supabase';

export default {
  name: 'AuthModal',
  props: {
    allowClose: {
      type: Boolean,
      default: true
    }
  },
  emits: ['close', 'auth-success'],
  setup(props, { emit }) {
    const handleClose = () => {
      if (props.allowClose) {
        emit('close');
      }
    };

    const handleGoogleSignIn = async () => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
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

        if (error) {
          console.error('Google sign in error:', error);
          alert('Failed to sign in with Google. Please try again.');
          return;
        }
        // The redirect will happen automatically
      } catch (error) {
        console.error('Error signing in with Google:', error);
        alert('Failed to sign in with Google. Please try again.');
      }
    };

    return {
      handleGoogleSignIn,
      handleClose
    };
  }
};
</script>

<style scoped>
.auth-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
}

.auth-modal {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  position: relative;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.close-button {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.05);
}

h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 24px;
  font-weight: bold;
}

p {
  margin-bottom: 25px;
  color: #666;
  font-size: 16px;
  line-height: 1.5;
}

.google-button {
  width: 100%;
  padding: 12px 20px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: background-color 0.2s;
  position: relative;
}

.google-button:hover {
  background: #357ae8;
}

.google-icon {
  background: white;
  color: #4285f4;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}
</style>
