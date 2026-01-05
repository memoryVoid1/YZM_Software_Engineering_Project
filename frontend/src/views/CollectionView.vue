<template>
  <div class="collection-container">
    
    <header class="page-header">
      <div class="header-content">
        <h1>My Library</h1>
        <p class="subtitle">Manage your reading journey.</p>
      </div>
      <div class="search-wrapper">
        <input 
          v-model="searchQuery" 
          @keyup.enter="searchBooks" 
          type="text" 
          placeholder="Search for new books..." 
          class="search-input"
        />
        <button @click="searchBooks" class="btn-search">Find</button>
      </div>
    </header>

    <section v-if="searchResults.length > 0" class="results-pane">
      <div class="section-title">
        <h2>Search Results</h2>
        <button @click="clearSearch" class="btn-close">Close ✖</button>
      </div>
      
      <div class="books-grid">
        <div v-for="book in searchResults" :key="book.id" class="book-card result-card">
          <img 
            :src="book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/150x220?text=No+Cover'" 
            alt="Cover" 
            class="book-cover" 
          />
          <div class="card-details">
            <h3 :title="book.volumeInfo.title">{{ book.volumeInfo.title || 'Untitled' }}</h3>
            <p>{{ book.volumeInfo.authors?.join(', ') || 'Unknown Author' }}</p>
            <button @click="addBook(book)" class="btn-add">+ Add</button>
          </div>
        </div>
      </div>
    </section>

    <section class="library-pane">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div> Loading your books...
      </div>
      
      <div v-else-if="userBooks.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <p>Your library is empty.</p>
        <small>Use the search bar above to add your first book.</small>
      </div>

      <div v-else class="books-grid">
        <div 
          v-for="book in userBooks" 
          :key="book._id" 
          class="book-card saved-card"
          @click="openEditModal(book)"
        >
          <div class="status-badge" :class="getStatusClass(book.status)">
            {{ book.status || 'To Read' }}
          </div>
          
          <img 
            :src="book.coverUrl || 'https://via.placeholder.com/150x220?text=No+Cover'" 
            alt="Cover" 
            class="book-cover" 
          />
          
          <div class="card-details">
            <h3 :title="book.title">{{ book.title || 'Untitled' }}</h3>
            <p>{{ book.author || 'Unknown Author' }}</p>
            
            <div class="stars-display">
              <span 
                v-for="n in 5" 
                :key="n" 
                class="star" 
                :class="{ filled: n <= (book.rating || 0) }"
              >★</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h2>Edit Book</h2>
        <div class="modal-body">
          <label>Status</label>
          <select v-model="selectedBook.status">
            <option>To Read</option>
            <option>Reading</option>
            <option>Read</option>
          </select>

          <label>Rating</label>
          <div class="star-rating-input">
            <span 
              v-for="n in 5" 
              :key="n" 
              @click="selectedBook.rating = n"
              :class="{ active: n <= selectedBook.rating }"
            >★</span>
          </div>

          <label>Notes</label>
          <textarea v-model="selectedBook.comment" placeholder="Add a personal note..."></textarea>
        </div>
        <div class="modal-actions">
          <button @click="deleteBook" class="btn-delete">Delete</button>
          <div class="right-actions">
            <button @click="closeModal" class="btn-cancel">Cancel</button>
            <button @click="saveChanges" class="btn-save">Save</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();

// State
const searchQuery = ref('');
const searchResults = ref([]);
const userBooks = ref([]); // This is the list that was failing to load
const loading = ref(true);
const showModal = ref(false);
const selectedBook = ref({});

// API Configuration
const API_URL = import.meta.env.VITE_API_URL;
const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// 1. FIX: simplified fetch logic to match the working Ranking page

 // Inside src/views/CollectionView.vue

const fetchLibrary = async () => {
  loading.value = true;
  const token = localStorage.getItem('token');

  if (!token) {
    loading.value = false;
    router.push('/');
    return;
  }

  try {
    // 👇 CHANGED: Using the "rankings" endpoint because we know it works!
    const res = await axios.get(`${API_URL}api/books/rankings`, getAuthHeader());
    
    // Direct assignment
    userBooks.value = res.data;
    
    console.log("✅ Books loaded via Rankings endpoint:", userBooks.value);
  } catch (err) {
    console.error("Fetch error:", err);
    // If token is invalid, log out
    if (err.response && err.response.status === 401) {
      localStorage.clear();
      router.push('/');
    }
  } finally {
    loading.value = false;
  }
};


// 2. Search Google Books
const searchBooks = async () => {
  if (!searchQuery.value) return;
  try {
    const res = await axios.get(`${API_URL}api/search?query=${searchQuery.value}`);
    searchResults.value = res.data;
  } catch (err) {
    alert("Search failed.");
  }
};

const clearSearch = () => {
  searchResults.value = [];
  searchQuery.value = '';
};

// 3. Add Book
const addBook = async (googleBook) => {
  const newBook = {
    title: googleBook.volumeInfo.title || 'Untitled',
    author: googleBook.volumeInfo.authors ? googleBook.volumeInfo.authors[0] : 'Unknown',
    coverUrl: googleBook.volumeInfo.imageLinks?.thumbnail || '',
    status: 'To Read',
    rating: 0
  };

  try {
    const res = await axios.post(`${API_URL}api/books/add`, newBook, getAuthHeader());
    // Add to local list immediately so you don't have to refresh
    userBooks.value.push(res.data); 
    alert("Book added to library!");
  } catch (err) {
    console.error(err);
    alert("Error adding book.");
  }
};

// 4. Modal & Editing Logic
const openEditModal = (book) => {
  selectedBook.value = { ...book };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveChanges = async () => {
  try {
    await axios.patch(
      `${API_URL}api/books/${selectedBook.value._id}`, 
      { 
        status: selectedBook.value.status, 
        rating: selectedBook.value.rating,
        comment: selectedBook.value.comment 
      }, 
      getAuthHeader()
    );
    
    // Update the UI locally to match the change
    const index = userBooks.value.findIndex(b => b._id === selectedBook.value._id);
    if (index !== -1) userBooks.value[index] = selectedBook.value;
    
    closeModal();
  } catch (err) {
    alert("Failed to save changes");
  }
};

const deleteBook = async () => {
  if(!confirm("Remove this book from your library?")) return;
  try {
    await axios.delete(`${API_URL}api/books/${selectedBook.value._id}`, getAuthHeader());
    // Remove from UI locally
    userBooks.value = userBooks.value.filter(b => b._id !== selectedBook.value._id);
    closeModal();
  } catch (err) {
    alert("Failed to delete");
  }
};

// Helper for badges
const getStatusClass = (status) => {
  if (status === 'Read') return 'badge-green';
  if (status === 'Reading') return 'badge-yellow';
  return 'badge-gray';
};

// Load books when page opens
onMounted(() => {
  fetchLibrary();
});
</script>


<style scoped>
/* Page Layout */
.collection-container {
  padding: 40px 60px;
  width: 100%;
  box-sizing: border-box;
  color: #ecf0f1;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  border-bottom: 2px solid #3d2b1f;
  padding-bottom: 20px;
}
.header-content h1 { margin: 0; color: #d2691e; font-size: 2.5rem; }
.subtitle { margin: 5px 0 0 0; color: #a0a0a0; }

/* Search */
.search-wrapper { display: flex; gap: 10px; flex-grow: 1; max-width: 400px; }
.search-input { width: 100%; padding: 12px; background: #3d2b1f; border: 1px solid #553e2e; color: #fff; border-radius: 8px; }
.btn-search { background: #d2691e; color: #fff; border: none; padding: 0 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }

/* Grid Layout - AUTO RESPONSIVE */
.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 25px;
}

/* Book Cards */
.book-card {
  background: #3d2b1f;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%; /* Ensures equal height in grid */
}
.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.4);
}

/* Images */
.book-cover {
  width: 100%;
  height: 260px;
  object-fit: cover;
  background: #2a1b12; /* Placeholder color while loading */
}

/* Details */
.card-details {
  padding: 15px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.card-details h3 { font-size: 1rem; margin: 0 0 5px 0; color: #eee; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-details p { font-size: 0.85rem; color: #aaa; margin: 0 0 10px 0; }

/* Status Badge */
.status-badge {
  position: absolute; top: 10px; right: 10px;
  padding: 4px 10px; border-radius: 20px;
  font-size: 0.7rem; font-weight: bold; color: #2c1e14;
  z-index: 2; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}
.badge-green { background: #2ecc71; }
.badge-yellow { background: #f1c40f; }
.badge-gray { background: #bdc3c7; }

/* Stars */
.stars-display { margin-top: auto; } /* Pushes stars to bottom of card */
.star { color: #555; font-size: 1.1rem; }
.star.filled { color: #f1c40f; }

/* Empty State */
.empty-state {
  text-align: center; padding: 60px;
  background: rgba(61, 43, 31, 0.5); border-radius: 12px;
  border: 2px dashed #553e2e;
}
.empty-icon { font-size: 3rem; margin-bottom: 15px; }

/* Modals */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.85); z-index: 2000;
  display: flex; justify-content: center; align-items: center;
}
.modal-content {
  background: #2c1e14; padding: 30px; border-radius: 12px;
  width: 90%; max-width: 400px; border: 1px solid #d2691e;
}
.modal-body { display: flex; flex-direction: column; gap: 15px; margin: 20px 0; }
.modal-body select, .modal-body textarea {
  background: #3d2b1f; color: #fff; border: 1px solid #553e2e; padding: 10px; border-radius: 6px;
}
.star-rating-input span { font-size: 2rem; cursor: pointer; color: #444; }
.star-rating-input span.active { color: #f1c40f; }

.modal-actions { display: flex; justify-content: space-between; }
.btn-save { background: #d2691e; color: #fff; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; }
.btn-delete { background: #c0392b; color: #fff; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; }
.btn-cancel { background: transparent; color: #aaa; border: 1px solid #777; padding: 8px 15px; border-radius: 6px; cursor: pointer; margin-right: 10px; }
</style>