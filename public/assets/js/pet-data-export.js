// Comprehensive Pet Health Data Export System
class PetHealthDataExporter {
    constructor(apiClient, healthAnalytics) {
        this.apiClient = apiClient;
        this.analytics = healthAnalytics;
        this.exportFormats = {
            pdf: 'PDF Report',
            csv: 'CSV Data',
            json: 'JSON Data',
            excel: 'Excel Spreadsheet',
            veterinary: 'Veterinary Report'
        };
        this.exportTemplates = new Map();
        this.initializeTemplates();
    }

    // Initialize export templates
    initializeTemplates() {
        // Veterinary report template
        this.exportTemplates.set('veterinary', {
            name: 'Veterinary Report',
            description: 'Comprehensive health report for veterinary consultation',
            sections: [
                'pet_information',
                'health_summary',
                'weight_history',
                'vital_signs',
                'medications',
                'vaccination_history',
                'health_events',
                'recommendations'
            ],
            format: 'pdf'
        });

        // Weight management template
        this.exportTemplates.set('weight_management', {
            name: 'Weight Management Report',
            description: 'Focused report on weight trends and body condition',
            sections: [
                'pet_information',
                'weight_analysis',
                'body_condition_tracking',
                'nutrition_recommendations',
                'activity_correlation'
            ],
            format: 'pdf'
        });

        // Medication tracking template
        this.exportTemplates.set('medication_tracking', {
            name: 'Medication Tracking Report',
            description: 'Detailed medication history and adherence report',
            sections: [
                'pet_information',
                'current_medications',
                'medication_history',
                'adherence_analysis',
                'side_effects_monitoring'
            ],
            format: 'pdf'
        });

        // Data backup template
        this.exportTemplates.set('data_backup', {
            name: 'Complete Data Backup',
            description: 'Full backup of all pet health data',
            sections: ['all_data'],
            format: 'json'
        });
    }

    // Main export function
    async exportHealthData(petId, options = {}) {
        const {
            format = 'pdf',
            template = 'veterinary',
            dateRange = 'all',
            includeCharts = true,
            includePhotos = false,
            customSections = null
        } = options;

        try {
            // Fetch comprehensive health data
            const healthData = await this.fetchComprehensiveHealthData(petId, dateRange);
            const pet = healthData.pet;

            // Determine sections to include
            const sections = customSections || this.exportTemplates.get(template)?.sections || ['all_data'];

            // Generate export based on format
            switch (format) {
                case 'pdf':
                    return await this.generatePDFReport(pet, healthData, sections, { includeCharts, includePhotos });
                case 'csv':
                    return await this.generateCSVExport(pet, healthData, sections);
                case 'json':
                    return await this.generateJSONExport(pet, healthData, sections);
                case 'excel':
                    return await this.generateExcelExport(pet, healthData, sections);
                case 'veterinary':
                    return await this.generateVeterinaryReport(pet, healthData, { includeCharts, includePhotos });
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            throw new Error(`Failed to export health data: ${error.message}`);
        }
    }

    // Fetch comprehensive health data
    async fetchComprehensiveHealthData(petId, dateRange) {
        const endDate = new Date();
        let startDate = new Date();

        // Calculate date range
        switch (dateRange) {
            case '1_month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case '3_months':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case '6_months':
                startDate.setMonth(startDate.getMonth() - 6);
                break;
            case '1_year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case 'all':
            default:
                startDate = new Date('2020-01-01'); // Far back date
                break;
        }

        // Fetch all health data
        const [
            pet,
            weightHistory,
            vitalsHistory,
            healthRecords,
            medications,
            vaccinations,
            vetVisits,
            activityHistory,
            nutritionPlans
        ] = await Promise.all([
            this.apiClient.get(`/pets/${petId}`),
            this.apiClient.get(`/pets/${petId}/health/weight`, { start_date: startDate.toISOString(), end_date: endDate.toISOString() }),
            this.apiClient.get(`/pets/${petId}/health/vitals`, { start_date: startDate.toISOString(), end_date: endDate.toISOString() }),
            this.apiClient.get(`/pets/${petId}/health/records`, { start_date: startDate.toISOString(), end_date: endDate.toISOString() }),
            this.apiClient.get(`/pets/${petId}/medications`),
            this.apiClient.get(`/pets/${petId}/vaccinations`),
            this.apiClient.get(`/pets/${petId}/vet-visits`, { start_date: startDate.toISOString(), end_date: endDate.toISOString() }),
            this.apiClient.get(`/pets/${petId}/activity`, { start_date: startDate.toISOString(), end_date: endDate.toISOString() }),
            this.apiClient.get(`/pets/${petId}/nutrition/plans`)
        ]);

        return {
            pet: pet.data,
            weightHistory: weightHistory.data,
            vitalsHistory: vitalsHistory.data,
            healthRecords: healthRecords.data,
            medications: medications.data,
            vaccinations: vaccinations.data,
            vetVisits: vetVisits.data,
            activityHistory: activityHistory.data,
            nutritionPlans: nutritionPlans.data,
            exportDate: new Date(),
            dateRange: { start: startDate, end: endDate }
        };
    }

    // Generate PDF report
    async generatePDFReport(pet, healthData, sections, options = {}) {
        // This would typically use a PDF library like jsPDF or PDFKit
        // For now, we'll create a comprehensive HTML structure that can be converted to PDF
        
        const reportHTML = this.generateReportHTML(pet, healthData, sections, options);
        
        // Convert HTML to PDF (implementation would depend on chosen PDF library)
        const pdfBlob = await this.convertHTMLToPDF(reportHTML);
        
        return {
            filename: `${pet.name}_health_report_${this.formatDate(new Date())}.pdf`,
            blob: pdfBlob,
            type: 'application/pdf'
        };
    }

    // Generate comprehensive HTML report
    generateReportHTML(pet, healthData, sections, options = {}) {
        const { includeCharts = true, includePhotos = false } = options;
        
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${pet.name} - Health Report</title>
                <style>${this.getReportCSS()}</style>
            </head>
            <body>
                <div class="report-container">
                    ${this.generateReportHeader(pet, healthData)}
        `;

        // Generate sections
        sections.forEach(section => {
            switch (section) {
                case 'pet_information':
                    html += this.generatePetInformationSection(pet);
                    break;
                case 'health_summary':
                    html += this.generateHealthSummarySection(pet, healthData);
                    break;
                case 'weight_history':
                case 'weight_analysis':
                    html += this.generateWeightSection(pet, healthData, includeCharts);
                    break;
                case 'vital_signs':
                    html += this.generateVitalSignsSection(healthData, includeCharts);
                    break;
                case 'medications':
                case 'current_medications':
                case 'medication_history':
                    html += this.generateMedicationsSection(healthData);
                    break;
                case 'vaccination_history':
                    html += this.generateVaccinationSection(healthData);
                    break;
                case 'health_events':
                    html += this.generateHealthEventsSection(healthData);
                    break;
                case 'activity_correlation':
                    html += this.generateActivitySection(healthData, includeCharts);
                    break;
                case 'recommendations':
                    html += this.generateRecommendationsSection(pet, healthData);
                    break;
                case 'all_data':
                    html += this.generateAllDataSections(pet, healthData, includeCharts);
                    break;
            }
        });

        html += `
                    ${this.generateReportFooter(healthData)}
                </div>
            </body>
            </html>
        `;

        return html;
    }

    // Generate report sections
    generateReportHeader(pet, healthData) {
        return `
            <div class="report-header">
                <div class="header-content">
                    <h1>${pet.name} - Health Report</h1>
                    <div class="report-info">
                        <div class="pet-photo">
                            ${pet.photo_url ? `<img src="${pet.photo_url}" alt="${pet.name}">` : '<div class="no-photo">No Photo</div>'}
                        </div>
                        <div class="report-details">
                            <p><strong>Generated:</strong> ${this.formatDateTime(healthData.exportDate)}</p>
                            <p><strong>Data Range:</strong> ${this.formatDate(healthData.dateRange.start)} to ${this.formatDate(healthData.dateRange.end)}</p>
                            <p><strong>Report Type:</strong> Comprehensive Health Report</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generatePetInformationSection(pet) {
        return `
            <div class="report-section">
                <h2>Pet Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Name:</label>
                        <span>${pet.name}</span>
                    </div>
                    <div class="info-item">
                        <label>Species:</label>
                        <span>${pet.species}</span>
                    </div>
                    <div class="info-item">
                        <label>Breed:</label>
                        <span>${pet.breed || 'Mixed/Unknown'}</span>
                    </div>
                    <div class="info-item">
                        <label>Age:</label>
                        <span>${pet.age} years</span>
                    </div>
                    <div class="info-item">
                        <label>Gender:</label>
                        <span>${pet.gender}</span>
                    </div>
                    <div class="info-item">
                        <label>Current Weight:</label>
                        <span>${pet.current_weight || 'Not recorded'}kg</span>
                    </div>
                    <div class="info-item">
                        <label>Ideal Weight:</label>
                        <span>${pet.ideal_weight || 'Not set'}kg</span>
                    </div>
                    <div class="info-item">
                        <label>Activity Level:</label>
                        <span>${pet.activity_level || 'Moderate'}</span>
                    </div>
                    <div class="info-item">
                        <label>Body Condition Score:</label>
                        <span>${pet.body_condition_score || 'Not assessed'}/9</span>
                    </div>
                </div>
            </div>
        `;
    }

    generateHealthSummarySection(pet, healthData) {
        const healthScore = this.analytics.calculateHealthScore(pet, healthData);
        const insights = this.analytics.generateHealthInsights(pet, healthData);
        
        return `
            <div class="report-section">
                <h2>Health Summary</h2>
                <div class="health-summary">
                    <div class="health-score">
                        <h3>Overall Health Score</h3>
                        <div class="score-display score-${healthScore >= 80 ? 'good' : healthScore >= 60 ? 'fair' : 'poor'}">
                            ${healthScore}/100
                        </div>
                        <p class="score-description">
                            ${healthScore >= 80 ? 'Excellent health status' : 
                              healthScore >= 60 ? 'Good health with minor concerns' : 
                              'Health needs attention'}
                        </p>
                    </div>
                    
                    <div class="health-metrics">
                        <h3>Key Metrics</h3>
                        <ul>
                            <li>Total Health Records: ${healthData.healthRecords.length}</li>
                            <li>Weight Measurements: ${healthData.weightHistory.length}</li>
                            <li>Vet Visits: ${healthData.vetVisits.length}</li>
                            <li>Active Medications: ${healthData.medications.filter(m => m.status === 'active').length}</li>
                            <li>Vaccinations: ${healthData.vaccinations.length}</li>
                        </ul>
                    </div>
                    
                    ${insights.length > 0 ? `
                        <div class="health-insights">
                            <h3>Current Health Insights</h3>
                            <ul>
                                ${insights.map(insight => `
                                    <li class="insight-${insight.type}">
                                        <strong>${insight.title}:</strong> ${insight.message}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    generateWeightSection(pet, healthData, includeCharts) {
        const weightStats = this.analytics.calculateStatistics(healthData.weightHistory.map(w => w.weight));
        const weightTrend = this.analytics.calculateTrend(healthData.weightHistory, 'weight');
        
        return `
            <div class="report-section">
                <h2>Weight Analysis</h2>
                
                ${weightStats ? `
                    <div class="weight-statistics">
                        <h3>Weight Statistics</h3>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <label>Current Weight:</label>
                                <span>${pet.current_weight}kg</span>
                            </div>
                            <div class="stat-item">
                                <label>Average Weight:</label>
                                <span>${weightStats.mean.toFixed(1)}kg</span>
                            </div>
                            <div class="stat-item">
                                <label>Weight Range:</label>
                                <span>${weightStats.min.toFixed(1)} - ${weightStats.max.toFixed(1)}kg</span>
                            </div>
                            <div class="stat-item">
                                <label>Standard Deviation:</label>
                                <span>±${weightStats.stdDev.toFixed(1)}kg</span>
                            </div>
                            <div class="stat-item">
                                <label>Trend:</label>
                                <span class="trend-${weightTrend.direction}">${weightTrend.direction} (${weightTrend.confidence} confidence)</span>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="weight-history">
                    <h3>Weight History</h3>
                    ${includeCharts ? '<div class="chart-placeholder">[Weight Chart Would Be Here]</div>' : ''}
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Weight (kg)</th>
                                <th>Change</th>
                                <th>Body Condition</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${healthData.weightHistory.map(entry => `
                                <tr>
                                    <td>${this.formatDate(entry.date)}</td>
                                    <td>${entry.weight}</td>
                                    <td>${entry.change ? (entry.change > 0 ? '+' : '') + entry.change.toFixed(1) : '-'}</td>
                                    <td>${entry.body_condition_score || '-'}</td>
                                    <td>${entry.notes || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generateMedicationsSection(healthData) {
        const activeMeds = healthData.medications.filter(m => m.status === 'active');
        const inactiveMeds = healthData.medications.filter(m => m.status !== 'active');
        
        return `
            <div class="report-section">
                <h2>Medications</h2>
                
                ${activeMeds.length > 0 ? `
                    <div class="active-medications">
                        <h3>Current Medications</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Medication</th>
                                    <th>Dosage</th>
                                    <th>Frequency</th>
                                    <th>Started</th>
                                    <th>Prescribed By</th>
                                    <th>Purpose</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${activeMeds.map(med => `
                                    <tr>
                                        <td>${med.name}</td>
                                        <td>${med.dosage}</td>
                                        <td>${med.frequency}</td>
                                        <td>${this.formatDate(med.start_date)}</td>
                                        <td>${med.prescribed_by || '-'}</td>
                                        <td>${med.purpose || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
                
                ${inactiveMeds.length > 0 ? `
                    <div class="medication-history">
                        <h3>Medication History</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Medication</th>
                                    <th>Dosage</th>
                                    <th>Period</th>
                                    <th>Status</th>
                                    <th>Prescribed By</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${inactiveMeds.map(med => `
                                    <tr>
                                        <td>${med.name}</td>
                                        <td>${med.dosage}</td>
                                        <td>${this.formatDate(med.start_date)} - ${med.end_date ? this.formatDate(med.end_date) : 'Ongoing'}</td>
                                        <td>${med.status}</td>
                                        <td>${med.prescribed_by || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Generate CSV export
    async generateCSVExport(pet, healthData, sections) {
        const csvData = [];
        
        // Add pet information
        csvData.push(['Pet Information']);
        csvData.push(['Name', pet.name]);
        csvData.push(['Species', pet.species]);
        csvData.push(['Breed', pet.breed || '']);
        csvData.push(['Age', pet.age]);
        csvData.push(['Current Weight', pet.current_weight || '']);
        csvData.push(['']);

        // Add weight history
        if (sections.includes('weight_history') || sections.includes('all_data')) {
            csvData.push(['Weight History']);
            csvData.push(['Date', 'Weight (kg)', 'Body Condition Score', 'Notes']);
            healthData.weightHistory.forEach(entry => {
                csvData.push([
                    this.formatDate(entry.date),
                    entry.weight,
                    entry.body_condition_score || '',
                    entry.notes || ''
                ]);
            });
            csvData.push(['']);
        }

        // Add medications
        if (sections.includes('medications') || sections.includes('all_data')) {
            csvData.push(['Medications']);
            csvData.push(['Name', 'Dosage', 'Frequency', 'Start Date', 'End Date', 'Status', 'Prescribed By']);
            healthData.medications.forEach(med => {
                csvData.push([
                    med.name,
                    med.dosage,
                    med.frequency,
                    this.formatDate(med.start_date),
                    med.end_date ? this.formatDate(med.end_date) : '',
                    med.status,
                    med.prescribed_by || ''
                ]);
            });
            csvData.push(['']);
        }

        // Convert to CSV string
        const csvString = csvData.map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        
        return {
            filename: `${pet.name}_health_data_${this.formatDate(new Date())}.csv`,
            blob: blob,
            type: 'text/csv'
        };
    }

    // Generate JSON export
    async generateJSONExport(pet, healthData, sections) {
        const exportData = {
            pet: pet,
            export_info: {
                generated_at: healthData.exportDate,
                date_range: healthData.dateRange,
                sections: sections
            }
        };

        // Add selected sections
        if (sections.includes('weight_history') || sections.includes('all_data')) {
            exportData.weight_history = healthData.weightHistory;
        }
        if (sections.includes('vital_signs') || sections.includes('all_data')) {
            exportData.vitals_history = healthData.vitalsHistory;
        }
        if (sections.includes('medications') || sections.includes('all_data')) {
            exportData.medications = healthData.medications;
        }
        if (sections.includes('vaccination_history') || sections.includes('all_data')) {
            exportData.vaccinations = healthData.vaccinations;
        }
        if (sections.includes('health_events') || sections.includes('all_data')) {
            exportData.health_records = healthData.healthRecords;
            exportData.vet_visits = healthData.vetVisits;
        }
        if (sections.includes('activity_correlation') || sections.includes('all_data')) {
            exportData.activity_history = healthData.activityHistory;
        }

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
        
        return {
            filename: `${pet.name}_health_data_${this.formatDate(new Date())}.json`,
            blob: blob,
            type: 'application/json'
        };
    }

    // Render export interface
    renderExportInterface(petId) {
        return `
            <div class="health-export-interface">
                <div class="export-header">
                    <h3>Export Health Data</h3>
                    <p>Generate comprehensive reports and data exports for veterinary visits, insurance, or personal records.</p>
                </div>
                
                <form class="export-form" data-pet-id="${petId}">
                    <div class="form-section">
                        <h4>Export Template</h4>
                        <div class="template-options">
                            ${Array.from(this.exportTemplates.entries()).map(([key, template]) => `
                                <label class="template-option">
                                    <input type="radio" name="template" value="${key}" ${key === 'veterinary' ? 'checked' : ''}>
                                    <div class="template-card">
                                        <h5>${template.name}</h5>
                                        <p>${template.description}</p>
                                        <div class="template-format">Format: ${template.format.toUpperCase()}</div>
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4>Export Format</h4>
                        <div class="format-options">
                            ${Object.entries(this.exportFormats).map(([key, label]) => `
                                <label class="format-option">
                                    <input type="radio" name="format" value="${key}" ${key === 'pdf' ? 'checked' : ''}>
                                    <span>${label}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4>Date Range</h4>
                        <select name="dateRange" class="form-select">
                            <option value="1_month">Last Month</option>
                            <option value="3_months" selected>Last 3 Months</option>
                            <option value="6_months">Last 6 Months</option>
                            <option value="1_year">Last Year</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                    
                    <div class="form-section">
                        <h4>Additional Options</h4>
                        <div class="export-options">
                            <label class="option-checkbox">
                                <input type="checkbox" name="includeCharts" checked>
                                <span>Include Charts and Graphs</span>
                            </label>
                            <label class="option-checkbox">
                                <input type="checkbox" name="includePhotos">
                                <span>Include Pet Photos</span>
                            </label>
                            <label class="option-checkbox">
                                <input type="checkbox" name="includeAnalytics" checked>
                                <span>Include Health Analytics</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn--secondary" data-action="preview-export">
                            👁️ Preview
                        </button>
                        <button type="submit" class="btn btn--primary">
                            📥 Generate Export
                        </button>
                    </div>
                </form>
                
                <div class="export-history">
                    <h4>Recent Exports</h4>
                    <div class="export-history-list" id="export-history-list">
                        <!-- Export history will be populated here -->
                    </div>
                </div>
            </div>
        `;
    }

    // Handle export form submission
    async handleExportRequest(formData, petId) {
        const options = {
            format: formData.get('format'),
            template: formData.get('template'),
            dateRange: formData.get('dateRange'),
            includeCharts: formData.has('includeCharts'),
            includePhotos: formData.has('includePhotos'),
            includeAnalytics: formData.has('includeAnalytics')
        };

        try {
            // Show loading state
            this.showExportProgress('Generating export...');
            
            const exportResult = await this.exportHealthData(petId, options);
            
            // Download the file
            this.downloadFile(exportResult);
            
            // Add to export history
            this.addToExportHistory(petId, options, exportResult);
            
            this.hideExportProgress();
            this.showExportSuccess('Export generated successfully!');
            
        } catch (error) {
            this.hideExportProgress();
            this.showExportError(`Export failed: ${error.message}`);
        }
    }

    // Utility methods
    downloadFile(exportResult) {
        const url = URL.createObjectURL(exportResult.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportResult.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    formatDateTime(date) {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getReportCSS() {
        return `
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .report-container { max-width: 800px; margin: 0 auto; }
            .report-header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .report-section { margin-bottom: 30px; page-break-inside: avoid; }
            .report-section h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            .info-grid, .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .info-item, .stat-item { display: flex; justify-content: space-between; padding: 5px 0; }
            .data-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .data-table th { background-color: #f5f5f5; font-weight: bold; }
            .chart-placeholder { height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; margin: 15px 0; }
            .health-score { text-align: center; margin: 20px 0; }
            .score-display { font-size: 48px; font-weight: bold; margin: 10px 0; }
            .score-good { color: #10b981; }
            .score-fair { color: #f59e0b; }
            .score-poor { color: #ef4444; }
            .trend-increasing { color: #ef4444; }
            .trend-decreasing { color: #10b981; }
            .trend-stable { color: #6b7280; }
            @media print { .report-section { page-break-inside: avoid; } }
        `;
    }

    showExportProgress(message) {
        // Implementation for showing progress
        console.log('Export progress:', message);
    }

    hideExportProgress() {
        // Implementation for hiding progress
        console.log('Export progress hidden');
    }

    showExportSuccess(message) {
        // Implementation for showing success message
        console.log('Export success:', message);
    }

    showExportError(message) {
        // Implementation for showing error message
        console.error('Export error:', message);
    }

    addToExportHistory(petId, options, result) {
        // Implementation for adding to export history
        console.log('Added to export history:', { petId, options, result });
    }

    // Mock implementation for HTML to PDF conversion
    async convertHTMLToPDF(html) {
        // In a real implementation, this would use a library like jsPDF, Puppeteer, or similar
        // For now, return a mock blob
        return new Blob([html], { type: 'text/html' });
    }

    // Additional helper methods for report generation
    generateAllDataSections(pet, healthData, includeCharts) {
        return [
            this.generatePetInformationSection(pet),
            this.generateHealthSummarySection(pet, healthData),
            this.generateWeightSection(pet, healthData, includeCharts),
            this.generateVitalSignsSection(healthData, includeCharts),
            this.generateMedicationsSection(healthData),
            this.generateVaccinationSection(healthData),
            this.generateHealthEventsSection(healthData),
            this.generateActivitySection(healthData, includeCharts),
            this.generateRecommendationsSection(pet, healthData)
        ].join('');
    }

    generateVitalSignsSection(healthData, includeCharts) {
        return `
            <div class="report-section">
                <h2>Vital Signs</h2>
                ${includeCharts ? '<div class="chart-placeholder">[Vitals Chart Would Be Here]</div>' : ''}
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Temperature (°C)</th>
                            <th>Heart Rate (bpm)</th>
                            <th>Respiratory Rate</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${healthData.vitalsHistory.map(entry => `
                            <tr>
                                <td>${this.formatDate(entry.date)}</td>
                                <td>${entry.temperature || '-'}</td>
                                <td>${entry.heart_rate || '-'}</td>
                                <td>${entry.respiratory_rate || '-'}</td>
                                <td>${entry.notes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    generateVaccinationSection(healthData) {
        return `
            <div class="report-section">
                <h2>Vaccination History</h2>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Vaccine</th>
                            <th>Batch Number</th>
                            <th>Veterinarian</th>
                            <th>Next Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${healthData.vaccinations.map(vacc => `
                            <tr>
                                <td>${this.formatDate(vacc.date)}</td>
                                <td>${vacc.vaccine_name}</td>
                                <td>${vacc.batch_number || '-'}</td>
                                <td>${vacc.veterinarian || '-'}</td>
                                <td>${vacc.next_due ? this.formatDate(vacc.next_due) : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    generateHealthEventsSection(healthData) {
        const allEvents = [
            ...healthData.healthRecords.map(r => ({ ...r, type: 'health_record' })),
            ...healthData.vetVisits.map(v => ({ ...v, type: 'vet_visit' }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        return `
            <div class="report-section">
                <h2>Health Events Timeline</h2>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Provider</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allEvents.map(event => `
                            <tr>
                                <td>${this.formatDate(event.date)}</td>
                                <td>${event.type.replace('_', ' ')}</td>
                                <td>${event.description || event.reason || event.title}</td>
                                <td>${event.provider || event.veterinarian || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    generateActivitySection(healthData, includeCharts) {
        return `
            <div class="report-section">
                <h2>Activity Tracking</h2>
                ${includeCharts ? '<div class="chart-placeholder">[Activity Chart Would Be Here]</div>' : ''}
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Duration (minutes)</th>
                            <th>Activity Type</th>
                            <th>Intensity</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${healthData.activityHistory.map(activity => `
                            <tr>
                                <td>${this.formatDate(activity.date)}</td>
                                <td>${activity.duration}</td>
                                <td>${activity.type || '-'}</td>
                                <td>${activity.intensity || '-'}</td>
                                <td>${activity.notes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    generateRecommendationsSection(pet, healthData) {
        const insights = this.analytics.generateHealthInsights(pet, healthData);
        
        return `
            <div class="report-section">
                <h2>Health Recommendations</h2>
                <div class="recommendations-list">
                    ${insights.map(insight => `
                        <div class="recommendation-item">
                            <h4>${insight.title}</h4>
                            <p>${insight.message}</p>
                            <div class="recommendation-priority">Priority: ${insight.type}</div>
                        </div>
                    `).join('')}
                    
                    <div class="general-recommendations">
                        <h4>General Health Maintenance</h4>
                        <ul>
                            <li>Schedule regular veterinary checkups (annually for adult pets, bi-annually for senior pets)</li>
                            <li>Maintain consistent weight monitoring and body condition assessment</li>
                            <li>Keep vaccination schedule up to date</li>
                            <li>Monitor for changes in appetite, behavior, or activity levels</li>
                            <li>Ensure proper dental care and oral health maintenance</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    generateReportFooter(healthData) {
        return `
            <div class="report-footer">
                <hr>
                <p><small>
                    This report was generated on ${this.formatDateTime(healthData.exportDate)} 
                    from the Animal Nutrition Management System. 
                    This information is for reference purposes and should not replace professional veterinary advice.
                </small></p>
            </div>
        `;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PetHealthDataExporter;
} else {
    window.PetHealthDataExporter = PetHealthDataExporter;
}