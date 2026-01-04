import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Import the router.js you just created

const app = createApp(App)

app.use(router) // This is the critical connection
app.mount('#app')