<template>
  <aside class="sidebar">
    <div class="profile-section clickable" @click="triggerUpload" title="Click to change photo">
      <div class="avatar-container">
        <img 
          v-if="userAvatar" 
          :src="userAvatar" 
          alt="Profile" 
          class="avatar"
        />
        <img 
          v-else-if="username"
          :src="`https://ui-avatars.com/api/?name=${username}&background=d2691e&color=fff`"
          alt="Initials"
          class="avatar"
        />
        <div v-else class="avatar-placeholder"></div>

        <div v-if="isUploading" class="upload-overlay">⌛</div>
      </div>
      
      <h3 v-if="username" class="username">@{{ username }}</h3>
      <span class="hint-text" v-if="username">Edit Photo</span>
    </div>

    <input 
      type="file" 
      ref="fileInput" 
      @change="handleFileUpload" 
      accept="image/*" 
      style="display: none" 
    />

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
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const router = useRouter();
const username = ref('');
const userAvatar = ref('');
const fileInput = ref(null);
const isUploading = ref(false);

onMounted(() => {
  const storedUser = localStorage.getItem('username');
  const storedAvatar = localStorage.getItem('avatarUrl');
  
  if (storedUser) username.value = storedUser;
  // Handle case where avatarUrl might be the string "undefined"
  if (storedAvatar && storedAvatar !== 'undefined' && storedAvatar !== 'null') {
    userAvatar.value = storedAvatar;
  }
});

const triggerUpload = () => {
  if (!username.value) return; // Don't trigger if not logged in
  fileInput.value.click();
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  isUploading.value = true;
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(`${API_URL}/api/auth/login`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    // Update State & Storage
    userAvatar.value = res.data.avatarUrl;
    localStorage.setItem('avatarUrl', res.data.avatarUrl);
    alert("Profile picture updated!");
  } catch (err) {
    alert("Upload failed.");
    console.error(err);
  } finally {
    isUploading.value = false;
  }
};

const logout = () => {
  localStorage.clear();
  router.push('/');
};
</script>

<style scoped>
.sidebar {
  width: 250px;
  background-color: #3d2b1f;
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

.profile-section {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(210, 105, 30, 0.3);
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.profile-section.clickable {
  cursor: pointer;
  transition: background 0.3s;
  border-radius: 8px;
}
.profile-section.clickable:hover {
  background-color: rgba(210, 105, 30, 0.1);
}
.profile-section:hover .hint-text {
  opacity: 1;
}

.avatar-container {
  position: relative;
  width: 100px;
  height: 100px;
  margin-bottom: 10px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #d2691e;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px dashed #553e2e;
  background-color: rgba(0,0,0,0.2);
}

.upload-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  border-radius: 50%;
  display: flex; justify-content: center; align-items: center;
  color: white; font-size: 2rem;
}

.username {
  font-size: 1.2rem;
  color: #d2691e;
  margin: 0;
  font-weight: 600;
}

.hint-text {
  font-size: 0.75rem;
  color: #a67c52;
  opacity: 0;
  transition: opacity 0.3s;
  margin-top: 5px;
}

.nav-links { display: flex; flex-direction: column; gap: 15px; flex-grow: 1; }
.nav-item { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #e0e0e0; padding: 12px; border-radius: 8px; transition: 0.3s; }
.nav-item:hover, .nav-item.router-link-active { background-color: #553e2e; color: #fff; }
.btn-logout { background: transparent; border: 1px solid #d2691e; color: #d2691e; padding: 10px; width: 100%; border-radius: 6px; cursor: pointer; margin-top: auto; font-weight: bold; }
.btn-logout:hover { background: #d2691e; color: #fff; }
</style>