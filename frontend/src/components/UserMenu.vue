<template>
  <div class="user-menu">
    <button v-if="!user" @click="$emit('login')" class="login-button">
      Sign In
    </button>
    <div v-else class="user-info">
      <span class="user-email">{{ truncatedEmail }}</span>
      <button @click="$emit('logout')" class="logout-button">
        Sign Out
      </button>
    </div>
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
  padding: 8px 16px;
  background: white;
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

.logout-button {
  background: #ff4081;
  color: white;
}
</style>