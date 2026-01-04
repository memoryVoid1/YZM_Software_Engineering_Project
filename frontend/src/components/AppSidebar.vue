<template>
  <aside class="sidebar">
    <div class="profile-section clickable" @click="goToCollection">
      <div class="avatar-container">
        <img 
          v-if="username"
          :src="`https://ui-avatars.com/api/?name=${username}&background=d2691e&color=fff`" 
          alt="Profile" 
          class="avatar"
        />
        <div v-else class="avatar-placeholder"></div>
      </div>
      
      <h3 v-if="username" class="username">@{{ username }}</h3>
    </div>

    <nav class="nav-links">
      <router-link to="/collection" class="nav-item">
        <span class="icon">📚</span> My Collection
      </router-link>
      <router-link to="/rankings" class="nav-item">
        <span class="icon">🏆</span> Rankings
      </router-link>
    </nav>

    <div class="logout-section">
      <button @click="logout" class="btn-logout">Sign Out</button>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');

onMounted(() => {
  const storedUser = localStorage.getItem('username');
  if (storedUser) {
    username.value = storedUser;
  }
});

const goToCollection = () => {
  router.push('/collection');
};

const logout = () => {
  localStorage.clear();
  router.push('/');
};
</script>

<style scoped>
/* Sidebar Container */
.sidebar {
  width: 250px;
  background-color: #3d2b1f; /* Dark Coffee Color */
  color: #ecf0f1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-right: 2px solid #d2691e;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  box-sizing: border-box;
}

/* Profile Section */
.profile-section {
  display: flex;
  flex-direction: column; /* Stacks items vertically */
  align-items: center;    /* Centers items horizontally */
  justify-content: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(210, 105, 30, 0.3);
  min-height: 160px;
}

.profile-section.clickable {
  cursor: pointer;
  transition: background-color 0.3s ease;
  border-radius: 8px;
}

.profile-section.clickable:hover {
  background-color: rgba(210, 105, 30, 0.1);
}

.avatar-container {
  margin-bottom: 15px; /* Adds space between image and text */
  display: flex;
  justify-content: center;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #d2691e;
  object-fit: cover;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px dashed #553e2e;
  background-color: rgba(0,0,0,0.2);
}

.username {
  font-size: 1.2rem;
  color: #d2691e;
  margin: 0;
  font-weight: 600;
  text-align: center;
  word-break: break-word; /* Prevents long usernames from breaking layout */
}

/* Navigation Links */
.nav-links {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex-grow: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #e0e0e0;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 1.1rem;
}

.nav-item:hover {
  background-color: #553e2e;
  color: #fff;
  transform: translateX(5px);
}

.nav-item.router-link-active {
  background-color: #d2691e;
  color: #fff;
}

.icon {
  font-size: 1.3rem;
}

/* Logout Button */
.logout-section {
  margin-top: auto;
}

.btn-logout {
  background: transparent;
  border: 1px solid #d2691e;
  color: #d2691e;
  padding: 12px;
  width: 100%;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
  font-size: 1rem;
}

.btn-logout:hover {
  background: #d2691e;
  color: #fff;
}
</style>