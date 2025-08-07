// js/app.js

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
    
    /**
     * Initialize the application.
     * This function sets up all the main components, event listeners,
     * and loads the initial data.
     */
    initialize() {
        // Get DOM elements
        this.svg = d3.select("#family-tree");
        const detailsPanelEl = document.getElementById('details-panel');
        const detailsContentEl = document.getElementById('details-content');
        
        // Initialize core components
        this.treeRenderer = new TreeRenderer(this.svg, this.dataManager);
        this.detailsPanel = new DetailsPanel(detailsPanelEl, detailsContentEl, this.dataManager);
        
        // Set up the callback for when a node is selected.
        this.treeRenderer.setNodeSelectCallback((node) => {
            this.detailsPanel.showPerson(node);
            // **FIX**: Return focus to the tree container after a click.
            // A setTimeout is used to ensure this runs after the current browser
            // event cycle, fixing a timing issue where focus could be lost.
            setTimeout(() => document.getElementById('tree-container').focus(), 0);
        });
        
        // Set up all other event listeners for buttons and inputs
        this.setupEventListeners();
        
        // Load the initial sample data to populate the tree on page load
        this.loadSampleData();
    }
    
    setupEventListeners() {
        // Button event listeners
        document.getElementById('loadDataBtn').addEventListener('click', () => this.loadDataFromURL());
        document.getElementById('sampleDataBtn').addEventListener('click', () => this.loadSampleData());
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('autoZoomBtn').addEventListener('click', () => this.autoZoom());
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.resetZoom());

        // ✅ Fix: close button event
        document.getElementById('closeDetailsBtn').addEventListener('click', () => {
            this.detailsPanel.clear(); // or .hide()
        });

        // Allow pressing 'Enter' on the URL input to load data
        document.getElementById('csvUrl').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadDataFromURL();
            }
        });
    }

    
    /**
     * Load and process data from the provided Google Sheets CSV URL.
     */
    async loadDataFromURL() {
        const urlInput = document.getElementById('csvUrl');
        const url = urlInput.value.trim();
        
        if (!url) {
            console.error('Please enter a valid CSV URL. Cannot load data.');
            // In a real app, you would show a user-friendly message here instead of an alert.
            return;
        }
        
        this.showLoading();
        
        const timestamp = Date.now();
        const cacheBypassUrl = `${url}&_=${timestamp}`;
        const result = await this.dataManager.loadFromURL(cacheBypassUrl);
        
        if (result.success) {
            this.renderTree();
            this.showSuccess('Data loaded successfully!');
        } else {
            console.error(`Error loading data: ${result.error}. Reverting to sample data.`);
            // If loading fails, fall back to the sample data.
            this.loadSampleData();
        }
    }
    
    /**
     * Load the built-in sample data.
     */
    loadSampleData() {
        const result = this.dataManager.loadSampleData();
        if (result.success) {
            this.renderTree();
            this.showSuccess('Sample data loaded!');
        }
    }
    
    /**
     * Render the entire tree with the current data.
     * This function is called whenever new data is loaded.
     */
    renderTree() {
        // Clear any previously shown person details
        this.detailsPanel.clear();
        
        // Use the renderer to draw the SVG tree
        const mainGroup = this.treeRenderer.render();
        
        // Create a new ZoomControls instance for the newly rendered tree
        this.zoomControls = new ZoomControls(this.svg, mainGroup);
        
        // Auto-fit the tree to the view with a small delay to ensure rendering is complete
        setTimeout(() => {
            if (this.zoomControls) {
                this.zoomControls.autoFit();
            }
        }, 100);
        
        // Set up keyboard controls on the container for the new zoom instance
        const treeContainer = document.getElementById('tree-container');
        if (this.zoomControls) {
            this.zoomControls.setupKeyboardControls(treeContainer);
        }
    }
    
    /**
     * Zoom control wrappers that call the methods on the zoomControls instance.
     */
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
    
    /**
     * UI feedback methods.
     */
    showLoading() {
        console.log('Loading data...');
        // A more advanced implementation would show a spinner or loading bar.
    }
    
    showSuccess(message) {
        console.log(message);
        // A more advanced implementation would show a temporary success message (toast).
    }
}
