// js/app.js

import { DataManager } from './DataManager.js';
import { TreeRenderer } from './TreeRenderer.js';
import { ZoomControls } from './ZoomControls.js';
import { DetailsPanel } from './DetailsPanel.js';

export class FamilyTreeApp {
    constructor() {
        // Select DOM elements once
        this.svg = d3.select("#family-tree");
        this.treeContainer = document.getElementById('tree-container');
        const detailsPanelEl = document.getElementById('details-panel');
        const detailsContentEl = document.getElementById('details-content');

        // Initialize modules
        this.dataManager = new DataManager();
        this.detailsPanel = new DetailsPanel(detailsPanelEl, detailsContentEl, this.dataManager);
        this.treeRenderer = new TreeRenderer(this.svg, this.dataManager);
        this.zoomControls = new ZoomControls(this.svg);
    }

    initialize() {
        this.setupEventListeners();
        this.treeRenderer.setNodeSelectCallback((node) => {
            this.detailsPanel.showPerson(node);
        });
        // Load initial sample data
        this.loadSampleData();
    }

    setupEventListeners() {
        document.getElementById('loadDataBtn').addEventListener('click', () => this.loadDataFromURL());
        document.getElementById('sampleDataBtn').addEventListener('click', () => this.loadSampleData());
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomControls.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomControls.zoomOut());
        document.getElementById('autoZoomBtn').addEventListener('click', () => this.autoZoom());
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.zoomControls.reset());
        this.zoomControls.setupKeyboardControls(this.treeContainer);
    }

    async loadDataFromURL() {
        const url = document.getElementById('csvUrl').value.trim();
        const result = await this.dataManager.loadFromURL(url);
        if (result.success) {
            this.renderTree();
        } else {
            alert(`Error: ${result.error}. Using sample data instead.`);
            this.loadSampleData();
        }
    }

    loadSampleData() {
        this.dataManager.loadSampleData();
        this.renderTree();
    }

    renderTree() {
        this.detailsPanel.hide();
        const mainGroup = this.treeRenderer.render();
        this.zoomControls.setMainGroup(mainGroup); // Update zoom controls with the new group
    }

    autoZoom() {
        const bounds = this.treeRenderer.getBounds();
        if (bounds) {
            this.zoomControls.autoFit(bounds);
        }
    }
}