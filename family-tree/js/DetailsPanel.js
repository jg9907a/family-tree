// js/DetailsPanel.js

export class DetailsPanel {
    constructor(panelElement, contentElement, dataManager) {
        this.panel = panelElement;
        this.content = contentElement;
        this.dataManager = dataManager;
    }

    showPerson(person) {
        let html = this.generatePersonHTML(person);
        this.content.innerHTML = html;
        this.panel.classList.add('active');
    }

    hide() {
        this.panel.classList.remove('active');
    }

    clear() {
        this.content.innerHTML = '';
        this.hide();
    }

    generatePersonHTML(person) {
        let html = '';

        // Basic Info
        html += this.createDetailItem('Name', person.Name);
        html += this.createDetailItem('Generation', person.generation);
        if (person.BirthYear) {
            html += this.createDetailItem('Birth Year', person.BirthYear);
        }

        // Spouses
        if (person.spouses && person.spouses.length > 0) {
            html += '<div class="spouse-section">';
            html += '<strong>Relationships:</strong>';
            person.spouses.forEach((spouseInfo, index) => {
                const spouse = this.dataManager.findPerson(spouseInfo.id);
                if (spouse) {
                    const statusClass = spouseInfo.status?.toLowerCase() || 'unknown';
                    html += `
                        <div class="spouse-item ${statusClass}">
                            <strong>Spouse ${index + 1}:</strong> ${spouse.Name}
                            <span class="marriage-status ${statusClass}">${spouseInfo.status}</span>
                            ${spouseInfo.years ? `<br><small>Years: ${spouseInfo.years}</small>` : ''}
                        </div>
                    `;
                }
            });
            html += '</div>';
        } else if (person.hasSpouse && person.SpouseID) {
            const spouse = this.dataManager.getSpouse(person);
            html += this.createDetailItem('Spouse', spouse ? spouse.Name : 'Not found');
        }

        // Parents
        if (person.hasParents) {
            const parents = this.dataManager.getParents(person);
            if (parents.length > 0) {
                let parentsList = parents.map(p => `&nbsp;&nbsp;• ${p.Name}`).join('<br>');
                html += this.createDetailItem('Parents', '<br>' + parentsList);
            }
        }

        // Children grouped by other parent
        const children = this.dataManager.getChildren(person.ID);
        if (children.length > 0) {
            const childrenByParent = {};
            children.forEach(child => {
                const otherParentId = child.Parent1ID === person.ID ? child.Parent2ID : child.Parent1ID;
                const otherParent = otherParentId ? this.dataManager.findPerson(otherParentId) : null;
                const key = otherParent ? otherParent.Name : 'Unknown';
                if (!childrenByParent[key]) childrenByParent[key] = [];
                childrenByParent[key].push(child);
            });

            html += '<div class="detail-item"><strong>Children:</strong><br>';
            Object.entries(childrenByParent).forEach(([parentName, kids]) => {
                if (Object.keys(childrenByParent).length > 1) {
                    html += `<small style="color: #666;">With ${parentName}:</small><br>`;
                }
                kids.forEach(child => {
                    html += `&nbsp;&nbsp;• ${child.Name}<br>`;
                });
            });
            html += '</div>';
        }

        // Extra stats
        html += this.generateAdditionalInfo(person);
        return html;
    }

    createDetailItem(label, value) {
        return `
            <div class="detail-item">
                <strong>${label}:</strong> ${value}
            </div>
        `;
    }

    generateAdditionalInfo(person) {
        let html = '';

        // Approximate age
        if (person.BirthYear) {
            const currentYear = new Date().getFullYear();
            const age = currentYear - parseInt(person.BirthYear);
            if (!isNaN(age)) {
                html += this.createDetailItem('Approximate Age', `${age} years`);
            }
        }

        // Descendants
        const descendants = this.countDescendants(person.ID);
        if (descendants > 0) {
            html += this.createDetailItem('Total Descendants', descendants);
        }

        // Siblings
        const siblings = this.countSiblings(person);
        if (siblings > 0) {
            html += this.createDetailItem('Number of Siblings', siblings);
        }

        return html;
    }

    countDescendants(personId, counted = new Set()) {
        let count = 0;
        const children = this.dataManager.getChildren(personId);
        for (const child of children) {
            if (!counted.has(child.ID)) {
                counted.add(child.ID);
                count++;
                count += this.countDescendants(child.ID, counted);
            }
        }
        return count;
    }

    countSiblings(person) {
        if (!person.hasParents) return 0;
        const all = this.dataManager.getData();
        return all.filter(p =>
            p.ID !== person.ID &&
            p.Parent1ID === person.Parent1ID &&
            p.Parent2ID === person.Parent2ID
        ).length;
    }
}
