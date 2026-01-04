<template>
  <div v-if="isAuthPage" class="auth-layout">
    <router-view />
  </div>

  <div v-else class="dashboard-layout">
    <AppSidebar />
    <main class="dashboard-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from './components/AppSidebar.vue';

const route = useRoute();

const isAuthPage = computed(() => {
  return ['/', '/login', '/register'].includes(route.path);
});
</script>

<style>
/* GLOBAL RESET */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background-color: #2c1e14; /* Fallback background color */
  font-family: 'Segoe UI', sans-serif;
  color: #ecf0f1;
}

#app {
  height: 100%;
}

/* =========================================
   LAYOUT 1: AUTH STYLES (Login/Register)
   ========================================= */
.auth-layout {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* RE-APPLY BACKGROUND IMAGE HERE */
  /* This ensures the login page always has the library background */
  background-image: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), 
                    url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1350&q=80');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* =========================================
   LAYOUT 2: DASHBOARD STYLES (Sidebar + Content)
   ========================================= */
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: #2c1e14; /* Specific background for dashboard */
}

.dashboard-content {
  flex-grow: 1;
  margin-left: 250px; /* Exact width of your sidebar */
  width: calc(100% - 250px);
  min-height: 100vh;
  box-sizing: border-box;
}

/* Scrollbar Polish */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #2c1e14; }
::-webkit-scrollbar-thumb { background: #d2691e; border-radius: 4px; }
</style>