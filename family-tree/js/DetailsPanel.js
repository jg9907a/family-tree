// js/DetailsPanel.js

export class DetailsPanel {
    constructor(panelElement, contentElement, dataManager) {
        this.panel = panelElement;
        this.content = contentElement;
        this.dataManager = dataManager;
    }
    
    /**
     * Show details for a selected person
     */
    showPerson(person) {
        let html = this.generatePersonHTML(person);
        this.content.innerHTML = html;
        this.panel.classList.add('active');
    }
    
    /**
     * Hide the details panel
     */
    hide() {
        this.panel.classList.remove('active');
    }
    
    /**
     * Generate HTML for person details
     */
    generatePersonHTML(person) {
        let html = '';
        
        // Basic information
        html += this.createDetailItem('Name', person.Name);
        html += this.createDetailItem('Generation', person.generation);
        
        if (person.BirthYear) {
            html += this.createDetailItem('Birth Year', person.BirthYear);
        }
        
        // Spouse information
        if (person.hasSpouse) {
            const spouse = this.dataManager.getSpouse(person);
            html += this.createDetailItem('Spouse', spouse ? spouse.Name : 'Not found');
        }
        
        // Parents information
        if (person.hasParents) {
            const parents = this.dataManager.getParents(person);
            if (parents.length > 0) {
                let parentsList = parents.map(p => `&nbsp;&nbsp;• ${p.Name}`).join('<br>');
                html += this.createDetailItem('Parents', '<br>' + parentsList);
            }
        }
        
        // Children information
        const children = this.dataManager.getChildren(person.ID);
        if (children.length > 0) {
            let childrenList = children.map(c => `&nbsp;&nbsp;• ${c.Name}`).join('<br>');
            html += this.createDetailItem('Children', '<br>' + childrenList);
        }
        
        // Additional information (can be extended)
        html += this.generateAdditionalInfo(person);
        
        return html;
    }
    
    /**
     * Create a detail item HTML
     */
    createDetailItem(label, value) {
        return `
            <div class="detail-item">
                <strong>${label}:</strong> ${value}
            </div>
        `;
    }
    
    /**
     * Generate additional information if available
     */
    generateAdditionalInfo(person) {
        let html = '';
        
        // Calculate age if birth year is available
        if (person.BirthYear) {
            const currentYear = new Date().getFullYear();
            const birthYear = parseInt(person.BirthYear);
            if (!isNaN(birthYear)) {
                const age = currentYear - birthYear;
                html += this.createDetailItem('Approximate Age', `${age} years`);
            }
        }
        
        // Count descendants
        const descendants = this.countDescendants(person.ID);
        if (descendants > 0) {
            html += this.createDetailItem('Total Descendants', descendants);
        }
        
        // Count siblings
        const siblings = this.countSiblings(person);
        if (siblings > 0) {
            html += this.createDetailItem('Number of Siblings', siblings);
        }
        
        return html;
    }
    
    /**
     * Count all descendants of a person
     */
    countDescendants(personId, counted = new Set()) {
        let count = 0;
        const children = this.dataManager.getChildren(personId);
        
        children.forEach(child => {
            if (!counted.has(child.ID)) {
                counted.add(child.ID);
                count++;
                count += this.countDescendants(child.ID, counted);
            }
        });
        
        return count;
    }
    
    /**
     * Count siblings of a person
     */
    countSiblings(person) {
        if (!person.hasParents) return 0;
        
        const allChildren = this.dataManager.getData().filter(p => 
            p.Parent1ID === person.Parent1ID && 
            p.Parent2ID === person.Parent2ID &&
            p.ID !== person.ID
        );
        
        return allChildren.length;
    }
    
    /**
     * Clear the panel content
     */
    clear() {
        this.content.innerHTML = '';
        this.hide();
    }
}