class MovieManager {
    constructor() {
        this.movies = this.loadMovies();
        this.filteredMovies = [...this.movies];
        this.currentPage = 1;
        this.moviesPerPage = 6;
        this.currentView = 'grid';
        this.editingMovie = null;
        this.initializeEventListeners();
        this.updateDisplay();
        this.updateStats();
        this.updateGenreFilter();
    }
    loadMovies() {
        try {
            const stored = localStorage.getItem('cinemanager_movies');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Erro ao carregar filmes:', error);
            return [];
        }
    }
    saveMovies() {
        try {
            localStorage.setItem('cinemanager_movies', JSON.stringify(this.movies));
        } catch (error) {
            console.error('Erro ao salvar filmes:', error);
            this.showToast('Erro ao salvar dados!', 'error');
        }
    }
    initializeEventListeners() {
        document.getElementById('movieForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addMovie();
        });
        document.getElementById('clearForm').addEventListener('click', () => {
            this.clearForm();
        });
        this.initializeStarRating('starsContainer', 'movieRating', 'ratingText');
        this.initializeStarRating('editStarsContainer', 'editMovieRating');
        document.getElementById('searchInput').addEventListener('input', () => {
            this.applyFilters();
        });
        document.getElementById('genreFilter').addEventListener('change', () => {
            this.applyFilters();
        });
        document.getElementById('sortSelect').addEventListener('change', () => {
            this.applyFilters();
        });
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });
        document.getElementById('gridViewBtn').addEventListener('click', () => {
            this.setView('grid');
        });
        document.getElementById('listViewBtn').addEventListener('click', () => {
            this.setView('list');
        });
        document.getElementById('prevPage').addEventListener('click', () => {
            this.changePage(-1);
        });
        document.getElementById('nextPage').addEventListener('click', () => {
            this.changePage(1);
        });
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportMovies();
        });
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importMovies(e.target.files[0]);
        });
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAllMovies();
        });
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeEditModal();
        });
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeEditModal();
        });
        document.getElementById('saveEdit').addEventListener('click', () => {
            this.saveEditedMovie();
        });
        this.setupRealTimeValidation();
    }
    initializeStarRating(containerId, inputId, textId = null) {
        const container = document.getElementById(containerId);
        const input = document.getElementById(inputId);
        const textElement = textId ? document.getElementById(textId) : null;
        const stars = container.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                const rating = index + 1;
                input.value = rating;
                stars.forEach((s, i) => {
                    s.classList.toggle('active', i < rating);
                });
                if (textElement) {
                    const ratingTexts = [
                        'Terrível 😞',
                        'Ruim 😕',
                        'Regular 😐',
                        'Bom 😊',
                        'Excelente 🤩'
                    ];
                    textElement.textContent = ratingTexts[rating - 1];
                }
            });
            star.addEventListener('mouseenter', () => {
                const rating = index + 1;
                stars.forEach((s, i) => {
                    s.style.filter = i < rating ? 'grayscale(0%)' : 'grayscale(100%)';
                    s.style.transform = i < rating ? 'scale(1.1)' : 'scale(1)';
                });
            });
        });
        container.addEventListener('mouseleave', () => {
            const currentRating = parseInt(input.value) || 0;
            stars.forEach((s, i) => {
                const isActive = i < currentRating;
                s.style.filter = isActive ? 'grayscale(0%)' : 'grayscale(100%)';
                s.style.transform = isActive ? 'scale(1.2)' : 'scale(1)';
            });
        });
    }
    setupRealTimeValidation() {
        const nameInput = document.getElementById('movieName');
        const yearInput = document.getElementById('movieYear');
        const genreSelect = document.getElementById('movieGenre');
        nameInput.addEventListener('input', () => {
            this.validateField('movieName');
        });
        yearInput.addEventListener('input', () => {
            this.validateField('movieYear');
        });
        genreSelect.addEventListener('change', () => {
            this.validateField('movieGenre');
        });
    }
    validateField(fieldName) {
        const field = document.getElementById(fieldName);
        const feedback = document.getElementById(fieldName.replace('movie', '').toLowerCase() + 'Feedback');
        let isValid = true;
        let message = '';
        switch (fieldName) {
            case 'movieName':
                const name = field.value.trim();
                if (!name) {
                    isValid = false;
                    message = '❌ Nome é obrigatório';
                } else if (name.length < 2) {
                    isValid = false;
                    message = '❌ Nome deve ter pelo menos 2 caracteres';
                } else if (this.movies.some(movie => movie.name.toLowerCase() === name.toLowerCase())) {
                    isValid = false;
                    message = '❌ Este filme já está cadastrado';
                } else {
                    message = '✅ Nome válido';
                }
                break;
            case 'movieYear':
                const year = parseInt(field.value);
                const currentYear = new Date().getFullYear();
                if (!year) {
                    isValid = false;
                    message = '❌ Ano é obrigatório';
                } else if (year < 1888 || year > currentYear + 10) {
                    isValid = false;
                    message = `❌ Ano deve estar entre 1888 e ${currentYear + 10}`;
                } else {
                    message = '✅ Ano válido';
                }
                break;
            case 'movieGenre':
                if (!field.value) {
                    isValid = false;
                    message = '❌ Gênero é obrigatório';
                } else {
                    message = '✅ Gênero válido';
                }
                break;
        }
        feedback.textContent = message;
        feedback.className = `input-feedback ${isValid ? 'success' : 'error'}`;
        field.style.borderColor = isValid ? '#27ae60' : '#e74c3c';
        return isValid;
    }
    addMovie() {
        const name = document.getElementById('movieName').value.trim();
        const year = parseInt(document.getElementById('movieYear').value);
        const genre = document.getElementById('movieGenre').value;
        const rating = parseInt(document.getElementById('movieRating').value);
        const isNameValid = this.validateField('movieName');
        const isYearValid = this.validateField('movieYear');
        const isGenreValid = this.validateField('movieGenre');
        if (!isNameValid || !isYearValid || !isGenreValid) {
            this.showToast('❌ Por favor, corrija os erros no formulário!', 'error');
            return;
        }
        if (rating === 0) {
            this.showToast('⭐ Por favor, adicione uma avaliação!', 'error');
            return;
        }
        const newMovie = {
            id: Date.now(),
            name,
            year,
            genre,
            rating,
            dateAdded: new Date().toISOString()
        };
        this.movies.unshift(newMovie);
        this.saveMovies();
        this.applyFilters();
        this.updateStats();
        this.updateGenreFilter();
        this.clearForm();
        this.showToast(`🎬 "${name}" foi adicionado com sucesso!`, 'success');
    }
    clearForm() {
        document.getElementById('movieForm').reset();
        document.getElementById('movieRating').value = '0';
        document.querySelectorAll('#starsContainer .star').forEach(star => {
            star.classList.remove('active');
        });
        document.getElementById('ratingText').textContent = 'Clique nas estrelas para avaliar';
        document.querySelectorAll('.input-feedback').forEach(feedback => {
            feedback.textContent = '';
            feedback.className = 'input-feedback';
        });
        document.querySelectorAll('input, select').forEach(field => {
            field.style.borderColor = '#e1e8ed';
        });
        document.getElementById('movieName').focus();
    }
    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        const genreFilter = document.getElementById('genreFilter').value;
        const sortBy = document.getElementById('sortSelect').value;
        this.filteredMovies = this.movies.filter(movie => {
            const matchesSearch = movie.name.toLowerCase().includes(searchTerm) ||
                                movie.genre.toLowerCase().includes(searchTerm) ||
                                movie.year.toString().includes(searchTerm);
            const matchesGenre = !genreFilter || movie.genre === genreFilter;
            return matchesSearch && matchesGenre;
        });
        this.sortMovies(sortBy);
        this.currentPage = 1;
        this.updateDisplay();
    }
    sortMovies(sortBy) {
        switch (sortBy) {
            case 'newest':
                this.filteredMovies.sort((a, b) => b.year - a.year);
                break;
            case 'oldest':
                this.filteredMovies.sort((a, b) => a.year - b.year);
                break;
            case 'name':
                this.filteredMovies.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'rating':
                this.filteredMovies.sort((a, b) => b.rating - a.rating);
                break;
        }
    }
    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('genreFilter').value = '';
        document.getElementById('sortSelect').value = 'newest';
        this.applyFilters();
        this.showToast('🔄 Filtros limpos!', 'info');
    }
    setView(view) {
        this.currentView = view;
        document.getElementById('gridViewBtn').classList.toggle('active', view === 'grid');
        document.getElementById('listViewBtn').classList.toggle('active', view === 'list');
        const container = document.getElementById('moviesContainer');
        container.classList.toggle('list-view', view === 'list');
        this.updateDisplay();
    }
    updateDisplay() {
        this.displayMovies();
        this.updatePagination();
    }
    displayMovies() {
        const container = document.getElementById('moviesContainer');
        const emptyState = document.getElementById('emptyState');
        const startIndex = (this.currentPage - 1) * this.moviesPerPage;
        const endIndex = startIndex + this.moviesPerPage;
        const moviesToShow = this.filteredMovies.slice(startIndex, endIndex);
        if (this.filteredMovies.length === 0) {
            container.innerHTML = '';
            container.appendChild(emptyState);
            return;
        }
        if (container.contains(emptyState)) {
            container.removeChild(emptyState);
        }
        container.innerHTML = moviesToShow.map(movie => this.createMovieHTML(movie)).join('');
    }
    createMovieHTML(movie) {
        const stars = '⭐'.repeat(movie.rating) + '☆'.repeat(5 - movie.rating);
        const genreEmoji = this.getGenreEmoji(movie.genre);
        const barcode = this.generateBarcode();
        return `
            <div class="movie-card ${this.currentView === 'list' ? 'list-view' : ''}" data-movie-id="${movie.id}">
                <div class="ticket-header">
                    <span class="ticket-label">🎬 CINEMA VINTAGE</span>
                    <span class="ticket-number">No. ${movie.id}</span>
                </div>
                <div class="movie-header">
                    <h3 class="movie-title">${movie.name}</h3>
                    <div class="movie-actions">
                        <button class="movie-btn btn-edit" onclick="movieManager.openEditModal(${movie.id})">
                            ✏️ Editar
                        </button>
                        <button class="movie-btn btn-delete" onclick="movieManager.deleteMovie(${movie.id})">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
                <div class="movie-details">
                    <div class="movie-info">
                        <div class="movie-year">
                            📅 ${movie.year}
                        </div>
                        <div class="movie-genre">
                            ${genreEmoji} ${movie.genre}
                        </div>
                    </div>
                    <div class="movie-rating">
                        <span>Avaliação:</span>
                        <div class="stars">
                            ${stars}
                        </div>
                        <span>(${movie.rating}/5)</span>
                    </div>
                </div>
                <div class="ticket-footer">
                    <div class="barcode">${barcode}</div>
                    <div class="ticket-date">ADMIT ONE - ${new Date(movie.dateAdded).toLocaleDateString('pt-BR')}</div>
                </div>
            </div>
        `;
    }
    generateBarcode() {
        const barcodeChars = '█▌▐║│┃▍▎▏▊▋';
        let barcode = '';
        for (let i = 0; i < 15; i++) {
            barcode += barcodeChars[Math.floor(Math.random() * barcodeChars.length)];
        }
        return barcode;
    }
    getGenreEmoji(genre) {
        const genreEmojis = {
            'Ação': '🔥',
            'Aventura': '🗺️',
            'Comédia': '😄',
            'Drama': '🎭',
            'Terror': '👻',
            'Romance': '💕',
            'Ficção Científica': '🚀',
            'Fantasia': '🧙‍♂️',
            'Suspense': '🔍',
            'Animação': '🎨',
            'Documentário': '📹',
            'Musical': '🎵'
        };
        return genreEmojis[genre] || '🎬';
    }
    updatePagination() {
        const totalPages = Math.ceil(this.filteredMovies.length / this.moviesPerPage);
        const paginationContainer = document.getElementById('paginationContainer');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const paginationInfo = document.getElementById('paginationInfo');
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        paginationContainer.style.display = 'flex';
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages;
        paginationInfo.textContent = `Página ${this.currentPage} de ${totalPages}`;
    }
    changePage(direction) {
        const totalPages = Math.ceil(this.filteredMovies.length / this.moviesPerPage);
        const newPage = this.currentPage + direction;
        if (newPage >= 1 && newPage <= totalPages) {
            this.currentPage = newPage;
            this.updateDisplay();
            document.querySelector('.movies-section').scrollIntoView({
                behavior: 'smooth'
            });
        }
    }
    deleteMovie(movieId) {
        const movie = this.movies.find(m => m.id === movieId);
        if (!movie) return;
        if (confirm(`🗑️ Tem certeza que deseja excluir "${movie.name}"?`)) {
            this.movies = this.movies.filter(m => m.id !== movieId);
            this.filteredMovies = this.filteredMovies.filter(m => m.id !== movieId);
            this.saveMovies();
            setTimeout(() => {
                this.updateDisplay();
                this.updateStats();
                this.updateGenreFilter();
            }, 10);
            this.showToast(`🗑️ "${movie.name}" foi excluído!`, 'info');
        }
    }
    openEditModal(movieId) {
        this.editingMovie = this.movies.find(m => m.id === movieId);
        if (!this.editingMovie) return;
        document.getElementById('editMovieName').value = this.editingMovie.name;
        document.getElementById('editMovieYear').value = this.editingMovie.year;
        document.getElementById('editMovieGenre').value = this.editingMovie.genre;
        document.getElementById('editMovieRating').value = this.editingMovie.rating;
        const stars = document.querySelectorAll('#editStarsContainer .star');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < this.editingMovie.rating);
        });
        document.getElementById('editModal').classList.add('show');
    }
    closeEditModal() {
        document.getElementById('editModal').classList.remove('show');
        this.editingMovie = null;
    }
    saveEditedMovie() {
        if (!this.editingMovie) return;
        const name = document.getElementById('editMovieName').value.trim();
        const year = parseInt(document.getElementById('editMovieYear').value);
        const genre = document.getElementById('editMovieGenre').value;
        const rating = parseInt(document.getElementById('editMovieRating').value);
        if (!name || !year || !genre || rating === 0) {
            this.showToast('❌ Todos os campos são obrigatórios!', 'error');
            return;
        }
        const currentYear = new Date().getFullYear();
        if (year < 1888 || year > currentYear + 10) {
            this.showToast(`❌ Ano deve estar entre 1888 e ${currentYear + 10}!`, 'error');
            return;
        }
        const duplicateExists = this.movies.some(movie =>
            movie.id !== this.editingMovie.id &&
            movie.name.toLowerCase() === name.toLowerCase()
        );
        if (duplicateExists) {
            this.showToast('❌ Já existe um filme com este nome!', 'error');
            return;
        }
        this.editingMovie.name = name;
        this.editingMovie.year = year;
        this.editingMovie.genre = genre;
        this.editingMovie.rating = rating;
        this.saveMovies();
        this.updateDisplay();
        this.updateStats();
        this.updateGenreFilter();
        this.closeEditModal();
        this.showToast(`✏️ "${name}" foi atualizado!`, 'success');
    }
    updateStats() {
        const totalMovies = this.movies.length;
        const genres = [...new Set(this.movies.map(movie => movie.genre))];
        const averageYear = totalMovies > 0
            ? Math.round(this.movies.reduce((sum, movie) => sum + movie.year, 0) / totalMovies)
            : '-';
        document.getElementById('totalMovies').textContent = totalMovies;
        document.getElementById('totalGenres').textContent = genres.length;
        document.getElementById('averageYear').textContent = averageYear;
        this.animateNumber('totalMovies', totalMovies);
        this.animateNumber('totalGenres', genres.length);
    }
    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const currentValue = parseInt(element.textContent) || 0;
        const increment = targetValue > currentValue ? 1 : -1;
        const duration = 50;
        if (currentValue === targetValue) return;
        const interval = setInterval(() => {
            const newValue = parseInt(element.textContent) + increment;
            element.textContent = newValue;
            if (newValue === targetValue) {
                clearInterval(interval);
            }
        }, duration);
    }
    updateGenreFilter() {
        const genreFilter = document.getElementById('genreFilter');
        const currentValue = genreFilter.value;
        const genres = [...new Set(this.movies.map(movie => movie.genre))].sort();
        genreFilter.innerHTML = '<option value="">Todos os gêneros</option>';
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = `${this.getGenreEmoji(genre)} ${genre}`;
            genreFilter.appendChild(option);
        });
        if (genres.includes(currentValue)) {
            genreFilter.value = currentValue;
        }
    }
    exportMovies() {
        if (this.movies.length === 0) {
            this.showToast('❌ Não há filmes para exportar!', 'error');
            return;
        }
        const dataToExport = {
            movies: this.movies,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cinemanager-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('💾 Lista exportada com sucesso!', 'success');
    }
    importMovies(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.movies || !Array.isArray(data.movies)) {
                    throw new Error('Formato de arquivo inválido');
                }
                const importedMovies = data.movies.filter(movie =>
                    movie.name && movie.year && movie.genre && movie.rating
                );
                if (importedMovies.length === 0) {
                    throw new Error('Nenhum filme válido encontrado no arquivo');
                }
                const message = `📥 Importar ${importedMovies.length} filmes?\n\nIsso irá substituir sua lista atual.`;
                if (confirm(message)) {
                    this.movies = importedMovies.map(movie => ({
                        ...movie,
                        id: Date.now() + Math.random(),
                        dateAdded: movie.dateAdded || new Date().toISOString()
                    }));
                    this.saveMovies();
                    this.updateDisplay();
                    this.updateStats();
                    this.updateGenreFilter();
                    this.applyFilters();
                    this.showToast(`📥 ${importedMovies.length} filmes importados!`, 'success');
                }
            } catch (error) {
                console.error('Erro ao importar:', error);
                this.showToast('❌ Erro ao importar arquivo!', 'error');
            }
        };
        reader.readAsText(file);
        document.getElementById('importFile').value = '';
    }
    clearAllMovies() {
        if (this.movies.length === 0) {
            this.showToast('❌ Não há filmes para excluir!', 'error');
            return;
        }
        const message = `🗑️ Tem certeza que deseja excluir TODOS os ${this.movies.length} filmes?\n\nEsta ação não pode ser desfeita!`;
        if (confirm(message)) {
            this.movies = [];
            this.saveMovies();
            this.updateDisplay();
            this.updateStats();
            this.updateGenreFilter();
            this.clearFilters();
            this.showToast('🗑️ Todos os filmes foram excluídos!', 'info');
        }
    }
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-message">${message}</div>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
}
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
let movieManager;
document.addEventListener('DOMContentLoaded', () => {
    movieManager = new MovieManager();
    movieManager.applyFilters();
    setTimeout(() => {
        if (movieManager.movies.length === 0) {
            movieManager.showToast('🎬 Bem-vindo ao CineManager Pro! Adicione seu primeiro filme!', 'info');
        } else {
            movieManager.showToast(`🍿 Bem-vindo de volta! Você tem ${movieManager.movies.length} filme(s) cadastrado(s).`, 'success');
        }
    }, 1000);
});
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    if (e.key === 'Escape') {
        const modal = document.getElementById('editModal');
        if (modal.classList.contains('show')) {
            movieManager.closeEditModal();
        }
    }
});
document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        movieManager.closeEditModal();
    }
});
window.movieManager = movieManager;