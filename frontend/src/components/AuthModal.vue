<template>
  <div class="auth-modal-overlay" @click.self="handleClose">
    <div class="auth-modal">
      <button v-if="allowClose" @click="$emit('close')" class="close-button">×</button>
      <h2>Sign In Required</h2>
      <p>Please sign in to add and view places</p>
      <button @click="handleGoogleSignIn" class="google-button">
        Sign in with Google
      </button>
    </div>
  </div>
</template>

<script>
import { auth } from '../services/auth';

export default {
  name: 'AuthModal',
  props: {
    allowClose: {
      type: Boolean,
      default: false
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
    const { data, error } = await auth.signInWithGoogle();
    if (error) throw error;
    
    // No need to emit here as the auth state change will handle it
    emit('close');
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
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  position: relative;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

h2 {
  margin: 0 0 15px 0;
  color: #333;
}

p {
  margin-bottom: 20px;
  color: #666;
}

.google-button {
  width: 100%;
  padding: 12px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.google-button:hover {
  background: #357ae8;
}
</style>
