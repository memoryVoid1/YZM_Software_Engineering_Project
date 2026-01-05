<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="brand-header">
        <h1>Join Us</h1>
        <p>Start your reading journey today.</p>
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>Username</label>
          <input 
            v-model="form.username" 
            type="text" 
            placeholder="Choose a username" 
            required 
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input 
            v-model="form.password" 
            type="password" 
            placeholder="Choose a strong password" 
            required 
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Creating Account...' : 'Sign Up' }}
        </button>

        <p class="error-msg" v-if="errorMessage">{{ errorMessage }}</p>
      </form>

      <div class="auth-footer">
        <p>Already have an account? <router-link to="/">Log In</router-link></p>
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

const handleRegister = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    await axios.post(`${API_URL}api/auth/register`, form.value);
    // On success, go to login page
    alert('Account created! Please log in.');
    router.push('/');
  } catch (err) {
    errorMessage.value = err.response?.data?.error || 'Registration failed.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* REUSING THE SAME STYLES AS LOGIN FOR CONSISTENCY */

.auth-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.auth-card {
  background-color: rgba(44, 30, 20, 0.95);
  padding: 40px;
  border-radius: 16px;
  border: 1px solid #d2691e;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 400px;
  text-align: center;
  backdrop-filter: blur(10px);
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
  box-sizing: border-box; 
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #d2691e;
  background-color: #4a3525;
}

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