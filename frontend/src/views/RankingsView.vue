<template>
  <div class="container">
    <header class="header">
      <h1>Personal Rankings</h1>
      <router-link to="/collection" class="back-link">← Back</router-link>
    </header>

    <div class="ranking-list">
      <div v-for="(book, index) in books" :key="book._id" class="rank-card">
        <span class="rank-num">#{{ index + 1 }}</span>
        <img :src="book.coverUrl" class="rank-img" />
        <div class="rank-info">
          <h3>{{ book.title }}</h3>
          <p class="rating">Score: {{ book.rating }} / 5 ⭐</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const books = ref([]);

onMounted(async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_URL}books/rankings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  books.value = res.data;
});
</script>

<style scoped>
.container { padding: 40px; max-width: 800px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--primary); padding-bottom: 10px; }
.back-link { color: var(--primary); text-decoration: none; }
.rank-card { display: flex; align-items: center; background: var(--card-bg); margin: 15px 0; padding: 15px; border-radius: 10px; gap: 20px; }
.rank-num { font-size: 2rem; font-weight: bold; color: var(--primary); width: 50px; }
.rank-img { width: 60px; height: 90px; object-fit: cover; }
.rank-info h3 { margin: 0; font-size: 1.2rem; }
.rating { color: #ffd700; margin-top: 5px; }
</style>