import { DataManager } from './DataManager.js';
import { TreeRenderer } from './TreeRenderer.js';
import { ZoomControls } from './ZoomControls.js';
import { DetailsPanel } from './DetailsPanel.js';

export class FamilyTreeApp {
    constructor() {
        this.dataManager = new DataManager();
        this.treeRenderer = null;
        this.zoomControls = null;
        this.detailsPanel = null;
        this.svg = null;
    }

    initialize() {
        this.svg = d3.select("#family-tree");
        const detailsPanelEl = document.getElementById('details-panel');
        const detailsContentEl = document.getElementById('details-content');

        this.treeRenderer = new TreeRenderer(this.svg, this.dataManager);
        this.detailsPanel = new DetailsPanel(detailsPanelEl, detailsContentEl, this.dataManager);

        this.treeRenderer.setNodeSelectCallback((node) => {
            this.detailsPanel.showPerson(node);
            setTimeout(() => document.getElementById('tree-container').focus(), 0);
        });

        this.setupEventListeners();
        this.loadSampleData();
        this.setupResizeHandler();
    }

    setupEventListeners() {
        document.getElementById('loadDataBtn').addEventListener('click', () => this.loadDataFromURL());
        document.getElementById('sampleDataBtn').addEventListener('click', () => this.loadSampleData());
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('autoZoomBtn').addEventListener('click', () => this.autoZoom());
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.resetZoom());

        document.getElementById('closeDetailsBtn').addEventListener('click', () => {
            this.detailsPanel.clear();
        });

        document.getElementById('csvUrl').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadDataFromURL();
            }
        });

        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        const clearSearchBtn = document.getElementById('clearSearchBtn');

        let searchTimeout;
        const debounceSearch = (func, delay) => {
            return (...args) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => func.apply(this, args), delay);
            };
        };

        searchInput.addEventListener('input', debounceSearch((e) => {
            const searchTerm = e.target.value;

            if (!this.treeRenderer) return;

            if (searchTerm.trim()) {
                clearSearchBtn.classList.add('active');
                const matches = this.treeRenderer.searchAndHighlight(searchTerm);

                if (matches.length > 0) {
                    searchResults.classList.add('active');
                    searchResults.innerHTML = `
                        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
                            Found ${matches.length} result${matches.length > 1 ? 's' : ''}:
                        </div>
                        ${matches.map(person => `
                            <div class="search-result-item" data-person-id="${person.ID}">
                                <strong>${person.Name}</strong>
                                ${person.BirthYear ? ` (b. ${person.BirthYear})` : ''}
                                - Generation ${person.generation}
                            </div>
                        `).join('')}
                    `;

                    searchResults.querySelectorAll('.search-result-item').forEach(item => {
                        item.addEventListener('click', () => {
                            const personId = item.getAttribute('data-person-id');
                            const person = matches.find(p => p.ID === personId);
                            if (person) {
                                this.treeRenderer.focusOnNode(person);
                                this.detailsPanel.showPerson(person);
                            }
                        });
                    });

                    if (matches[0]) {
                        this.treeRenderer.focusOnNode(matches[0]);
                    }
                } else {
                    searchResults.classList.add('active');
                    searchResults.innerHTML = `
                        <div style="color: #999; padding: 10px; text-align: center;">
                            No matches found for "${searchTerm}"
                        </div>
                    `;
                }
            } else {
                this.clearSearch();
            }
        }, 300));

        clearSearchBtn.addEventListener('click', () => {
            this.clearSearch();
            searchInput.focus();
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
                searchInput.blur();
            }
        });

        // === Instructions Toggle Functionality (No localStorage version) ===
        const toggleInstructionsBtn = document.getElementById('toggleInstructionsBtn');
        const instructionsContent = document.getElementById('instructionsContent');

        if (!toggleInstructionsBtn || !instructionsContent) {
            console.error('Toggle button or instructions content not found');
            return;
        }

        let isCollapsed = false;

        toggleInstructionsBtn.addEventListener('click', () => {
            if (!isCollapsed) {
                instructionsContent.style.transition = 'all 0.3s ease';
                instructionsContent.style.opacity = '0';
                instructionsContent.style.transform = 'translateY(-10px)';

                setTimeout(() => {
                    instructionsContent.style.display = 'none';
                    toggleInstructionsBtn.textContent = '+';
                    isCollapsed = true;
                }, 300);
            } else {
                instructionsContent.style.display = 'block';
                toggleInstructionsBtn.textContent = '−';
                isCollapsed = false;

                instructionsContent.offsetHeight; // Force reflow

                instructionsContent.style.opacity = '0';
                instructionsContent.style.transform = 'translateY(-10px)';

                setTimeout(() => {
                    instructionsContent.style.transition = 'all 0.3s ease';
                    instructionsContent.style.opacity = '1';
                    instructionsContent.style.transform = 'translateY(0)';
                }, 10);
            }
        });
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        const clearSearchBtn = document.getElementById('clearSearchBtn');

        searchInput.value = '';
        searchResults.classList.remove('active');
        searchResults.innerHTML = '';
        clearSearchBtn.classList.remove('active');

        if (this.treeRenderer) {
            this.treeRenderer.clearHighlights();
        }
    }

    async loadDataFromURL() {
        const urlInput = document.getElementById('csvUrl');
        const url = urlInput.value.trim();

        if (!url) {
            console.error('Please enter a valid CSV URL. Cannot load data.');
            return;
        }

        this.showLoading();

        const timestamp = Date.now();
        const cacheBypassUrl = `${url}&_=${timestamp}`;
        const result = await this.dataManager.loadFromURL(cacheBypassUrl);

        if (result.success) {
            this.renderTree();
            this.showSuccess('Data loaded successfully!');
            this.clearSearch();
        } else {
            console.error(`Error loading data: ${result.error}. Reverting to sample data.`);
            this.loadSampleData();
        }
    }

    loadSampleData() {
        const result = this.dataManager.loadSampleData();
        if (result.success) {
            this.renderTree();
            this.showSuccess('Sample data loaded!');
            this.clearSearch();
        }
    }

    renderTree() {
        this.detailsPanel.clear();

        const mainGroup = this.treeRenderer.render();
        this.zoomControls = new ZoomControls(this.svg, mainGroup);

        setTimeout(() => {
            if (this.zoomControls) {
                this.zoomControls.autoFit();
            }
        }, 100);

        const treeContainer = document.getElementById('tree-container');
        if (this.zoomControls) {
            this.zoomControls.setupKeyboardControls(treeContainer);
        }
    }

    zoomIn() {
        if (this.zoomControls) this.zoomControls.zoomIn();
    }

    zoomOut() {
        if (this.zoomControls) this.zoomControls.zoomOut();
    }

    autoZoom() {
        if (this.zoomControls) this.zoomControls.autoFit();
    }

    resetZoom() {
        if (this.zoomControls) this.zoomControls.reset();
    }

    showLoading() {
        console.log('Loading data...');
    }

    showSuccess(message) {
        console.log(message);
    }

    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.treeRenderer) {
                    this.treeRenderer.handleResize();
                }
            }, 250);
        });
    }
}
