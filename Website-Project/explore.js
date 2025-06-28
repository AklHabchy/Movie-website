class MovieExplorer {
  constructor() {
    this.apiKey = 'f556ef48'; 
    this.apiUrl = 'https://www.omdbapi.com/';
    this.searchForm = document.getElementById('searchForm');
    this.searchInput = document.getElementById('searchInput');
    this.moviesContainer = document.getElementById('moviesContainer');
    this.errorMessage = document.getElementById('errorMessage');
    this.loadingSpinner = document.getElementById('loadingSpinner');
    this.recentSearchesContainer = document.getElementById('recentSearches');
    this.paginationNav = document.getElementById('paginationNav');
    this.movieModal = new bootstrap.Modal(document.getElementById('movieModal'));
    this.movieModalBody = document.getElementById('movieModalBody');
    this.currentQuery = '';
    this.currentPage = 1;
    this.totalResults = 0;
    this.favorites = this.loadFavorites();
    this.init();
  }

  init() {
    this.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = this.searchInput.value.trim();
      if (query) {
        this.currentQuery = query;
        this.currentPage = 1;
        this.saveRecentSearch(query);
        this.fetchMovies(query, 1);
      }
    });
    this.renderRecentSearches();
    this.recentSearchesContainer.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        this.searchInput.value = e.target.textContent;
        this.currentQuery = e.target.textContent;
        this.currentPage = 1;
        this.fetchMovies(this.currentQuery, 1);
      }
    });
    this.paginationNav.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        const page = parseInt(e.target.dataset.page, 10);
        if (!isNaN(page)) {
          this.currentPage = page;
          this.fetchMovies(this.currentQuery, page);
        }
      }
    });
    this.moviesContainer.addEventListener('click', (e) => {
      // Details modal
      const card = e.target.closest('.movie-card');
      if (card && e.target.classList.contains('details-link')) {
        const imdbID = card.dataset.imdbid;
        this.showMovieDetails(imdbID);
      }
      // Favorites
      if (e.target.classList.contains('favorite-btn')) {
        const imdbID = e.target.closest('.movie-card').dataset.imdbid;
        this.toggleFavorite(imdbID);
        this.renderMovies(this.lastMovies);
      }
    });
    // Show favorites on load if any
    if (!this.currentQuery && this.favorites.length) {
      this.renderMovies(this.favorites, true);
    }
  }

  async fetchMovies(query, page = 1) {
    this.showError('');
    this.showSpinner(true);
    this.moviesContainer.innerHTML = '';
    this.paginationNav.innerHTML = '';
    try {
      const response = await fetch(`${this.apiUrl}?apikey=${this.apiKey}&s=${encodeURIComponent(query)}&page=${page}`);
      const data = await response.json();
      if (data.Response === 'True') {
        this.totalResults = parseInt(data.totalResults, 10);
        this.lastMovies = data.Search;
        this.renderMovies(data.Search);
        this.renderPagination(page, this.totalResults);
      } else {
        this.showError(data.Error || 'No movies found.');
      }
    } catch (error) {
      this.showError('Failed to fetch movies. Please try again later.');
    } finally {
      this.showSpinner(false);
    }
  }

  renderMovies(movies, isFavorites = false) {
    if (!movies || !movies.length) {
      this.showError('No movies found.');
      return;
    }
    this.moviesContainer.innerHTML = movies.map(movie => {
      const isFavorited = this.isFavorited(movie.imdbID);
      return `
        <div class="col-md-4 col-sm-6">
          <div class="movie-card p-3 h-100 d-flex flex-column align-items-center position-relative" data-imdbid="${movie.imdbID}">
            <button class="favorite-btn${isFavorited ? ' favorited' : ''}" title="Add to Favorites">&#10084;</button>
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${movie.Title}" class="img-fluid mb-3" style="max-height: 300px;">
            <h5 class="mb-1 text-center">${movie.Title}</h5>
            <p class="mb-0 text-muted">${movie.Year}</p>
            <button class="btn btn-outline-primary mt-2 details-link">Details</button>
          </div>
        </div>
      `;
    }).join('');
    if (isFavorites && !movies.length) {
      this.moviesContainer.innerHTML = '<p class="text-center">No favorites yet.</p>';
    }
  }

  async showMovieDetails(imdbID) {
    this.showSpinner(true);
    this.movieModalBody.innerHTML = '';
    try {
      const response = await fetch(`${this.apiUrl}?apikey=${this.apiKey}&i=${imdbID}&plot=full`);
      const movie = await response.json();
      if (movie.Response === 'True') {
        this.movieModalBody.innerHTML = `
          <div class="row">
            <div class="col-md-4 text-center mb-3 mb-md-0">
              <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${movie.Title}" class="img-fluid">
            </div>
            <div class="col-md-8">
              <h3>${movie.Title} (${movie.Year})</h3>
              <p><strong>Genre:</strong> ${movie.Genre}</p>
              <p><strong>Director:</strong> ${movie.Director}</p>
              <p><strong>Actors:</strong> ${movie.Actors}</p>
              <p><strong>Plot:</strong> ${movie.Plot}</p>
              <p><strong>IMDB Rating:</strong> ${movie.imdbRating}</p>
              <p><strong>Runtime:</strong> ${movie.Runtime}</p>
              <p><strong>Language:</strong> ${movie.Language}</p>
            </div>
          </div>
        `;
        this.movieModal.show();
      } else {
        this.movieModalBody.innerHTML = `<p class="text-danger">${movie.Error || 'Details not found.'}</p>`;
        this.movieModal.show();
      }
    } catch (error) {
      this.movieModalBody.innerHTML = '<p class="text-danger">Failed to load details.</p>';
      this.movieModal.show();
    } finally {
      this.showSpinner(false);
    }
  }

  showSpinner(show) {
    if (show) {
      this.loadingSpinner.classList.remove('d-none');
    } else {
      this.loadingSpinner.classList.add('d-none');
    }
  }

  showError(message) {
    if (message) {
      this.errorMessage.textContent = message;
      this.errorMessage.classList.remove('d-none');
    } else {
      this.errorMessage.classList.add('d-none');
    }
  }

  // Recent Searches
  saveRecentSearch(query) {
    let searches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    searches = searches.filter(q => q.toLowerCase() !== query.toLowerCase());
    searches.unshift(query);
    if (searches.length > 5) searches = searches.slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(searches));
    this.renderRecentSearches();
  }
  renderRecentSearches() {
    const searches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    if (!searches.length) {
      this.recentSearchesContainer.innerHTML = '';
      return;
    }
    this.recentSearchesContainer.innerHTML = searches.map(q => `<button class="btn btn-outline-secondary btn-sm">${q}</button>`).join(' ');
  }

  // Pagination
  renderPagination(current, totalResults) {
    const totalPages = Math.ceil(totalResults / 10);
    if (totalPages <= 1) {
      this.paginationNav.innerHTML = '';
      return;
    }
    let html = '';
    for (let i = 1; i <= totalPages && i <= 5; i++) {
      html += `<button class="btn btn-sm ${i === current ? 'btn-primary' : 'btn-outline-primary'} mx-1" data-page="${i}">${i}</button>`;
    }
    if (totalPages > 5) html += '<span class="mx-2">...</span>';
    this.paginationNav.innerHTML = html;
  }

  // Favorites
  loadFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  }
  saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(this.favorites));
  }
  isFavorited(imdbID) {
    return this.favorites.some(m => m.imdbID === imdbID);
  }
  toggleFavorite(imdbID) {
    const idx = this.favorites.findIndex(m => m.imdbID === imdbID);
    if (idx > -1) {
      this.favorites.splice(idx, 1);
    } else {
      const movie = this.lastMovies.find(m => m.imdbID === imdbID);
      if (movie) this.favorites.push(movie);
    }
    this.saveFavorites();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MovieExplorer();
}); 