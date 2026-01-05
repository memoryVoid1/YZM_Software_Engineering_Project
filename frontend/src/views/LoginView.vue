<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="brand-header">
        <h1>BookHeaven</h1>
        <p>Welcome back, Reader.</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Username</label>
          <input 
            v-model="form.username" 
            type="text" 
            placeholder="Enter your username" 
            required 
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input 
            v-model="form.password" 
            type="password" 
            placeholder="" 
            required 
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Signing In...' : 'Sign In' }}
        </button>

        <p class="error-msg" v-if="errorMessage">{{ errorMessage }}</p>
      </form>

      <div class="auth-footer">
        <p>New here? <router-link to="/register">Create an Account</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const form = ref({ username: '', password: '' });
const errorMessage = ref('');
const loading = ref(false);
const API_URL = import.meta.env.VITE_API_URL;

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';
  
  try {
    const res = await axios.post(`${API_URL}/auth/login`, form.value);
    
    // Save token AND username for the sidebar
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('username', form.value.username);
    
    // Redirect to collection
    router.push('/collection');
  } catch (err) {
    errorMessage.value = err.response?.data?.error || 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Center the card content */
.auth-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Glassmorphism Card Style */
.auth-card {
  background-color: rgba(44, 30, 20, 0.95); /* Deep brown, slightly transparent */
  padding: 40px;
  border-radius: 16px;
  border: 1px solid #d2691e;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 400px;
  text-align: center;
  backdrop-filter: blur(10px); /* Blurs the background image behind the card */
}

.brand-header h1 {
  color: #d2691e;
  margin: 0 0 10px 0;
  font-size: 2.5rem;
}

.brand-header p {
  color: #a0a0a0;
  margin-bottom: 30px;
}

/* Inputs */
.form-group {
  margin-bottom: 20px;
  text-align: left;
}

.form-group label {
  display: block;
  color: #d2691e;
  margin-bottom: 8px;
  font-weight: bold;
  font-size: 0.9rem;
}

input {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #553e2e;
  background-color: #3d2b1f;
  color: #fff;
  font-size: 1rem;
  box-sizing: border-box; /* Ensures padding doesn't break width */
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #d2691e;
  background-color: #4a3525;
}

/* Button */
.btn-primary {
  width: 100%;
  padding: 14px;
  background-color: #d2691e;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  margin-top: 10px;
}

.btn-primary:hover {
  background-color: #b35a1a;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  background-color: #7f8c8d;
  cursor: not-allowed;
}

/* Footer Links */
.auth-footer {
  margin-top: 20px;
  font-size: 0.9rem;
  color: #ccc;
}

.auth-footer a {
  color: #d2691e;
  text-decoration: none;
  font-weight: bold;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.error-msg {
  color: #e74c3c;
  margin-top: 15px;
  font-size: 0.9rem;
}
</style>