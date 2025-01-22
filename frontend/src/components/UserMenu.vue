<template>
  <div class="user-menu">
    <button v-if="!user" @click="$emit('login')" class="login-button">
      Log In
    </button>
    <button v-else @click="$emit('logout')" class="user-icon-button">
      Log Out
    </button>
  </div>
</template>

<script>
export default {
  name: 'UserMenu',
  props: {
    user: {
      type: Object,
      default: null
    }
  },
  computed: {
    truncatedEmail() {
      if (!this.user?.email) return '';
      const [username] = this.user.email.split('@');
      return username.length > 8 ? username.slice(0, 8) + '...' : username;
    }
  },
  emits: ['login', 'logout']
};
</script>

<style scoped>
.user-menu {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1000;
}

.login-button,
.logout-button {
  padding: 4px 8px;
 background: white !important; 
  border: none;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-email {
  font-size: 14px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}




</style>
