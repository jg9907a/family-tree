// js/DataManager.js

import { SAMPLE_DATA } from './config.js';

export class DataManager {
    constructor() {
        this.familyData = [];
    }

    async loadFromURL(url) {
        if (!url) return { success: false, error: 'URL is required.' };
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Network error: ${response.statusText}`);
            const text = await response.text();
            const parsedData = d3.csvParse(text);
            if (!parsedData || parsedData.length === 0) throw new Error('No data found in CSV.');
            this.familyData = this._processData(parsedData);
            return { success: true };
        } catch (error) {
            console.error('Error loading data:', error);
            return { success: false, error: error.message };
        }
    }

    loadSampleData() {
        this.familyData = this._processData(SAMPLE_DATA);
        return { success: true };
    }

    _processData(rawData) {
        return rawData
            .filter(d => d.ID && d.Name && d.generation)
            .map(d => ({
                ...d,
                generation: +d.generation,
                hasSpouse: !!d.SpouseID,
                hasParents: !!d.Parent1ID && !!d.Parent2ID,
            }));
    }

    getData() {
        return this.familyData;
    }

    findPerson(id) {
        return this.familyData.find(p => p.ID === id);
    }
    
    getSpouse(person) {
        return person.hasSpouse ? this.findPerson(person.SpouseID) : null;
    }

    getParents(person) {
        if (!person.hasParents) return [];
        return [this.findPerson(person.Parent1ID), this.findPerson(person.Parent2ID)].filter(Boolean);
    }

    getChildren(personId) {
        return this.familyData.filter(p => p.Parent1ID === personId || p.Parent2ID === personId);
    }
}