// Health Analytics Component - Advanced charting and analytics for health data
class HealthAnalytics {
    constructor() {
        this.charts = new Map();
        this.chartColors = {
            primary: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#06b6d4',
            purple: '#8b5cf6'
        };
    }

    // Advanced Weight Chart with Trend Analysis and Statistical Insights
    createWeightChart(canvas, data, options = {}) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const chartWidth = rect.width;
        const chartHeight = rect.height;
        const padding = 60;
        const plotWidth = chartWidth - (padding * 2);
        const plotHeight = chartHeight - (padding * 2);

        // Enhanced data processing with statistical analysis
        const weights = data.map(d => d.weight);
        const dates = data.map(d => new Date(d.date));
        const statistics = this.calculateStatistics(weights);
        
        const minWeight = Math.min(statistics.min - 1, options.idealWeight ? options.idealWeight - 2 : statistics.min - 1);
        const maxWeight = Math.max(statistics.max + 1, options.idealWeight ? options.idealWeight + 2 : statistics.max + 1);
        const weightRange = maxWeight - minWeight;

        // Clear canvas
        ctx.clearRect(0, 0, chartWidth, chartHeight);

        // Draw background with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
        gradient.addColorStop(0, '#fafafa');
        gradient.addColorStop(1, '#ffffff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, chartWidth, chartHeight);

        // Draw enhanced grid with statistical zones
        this.drawEnhancedGrid(ctx, padding, plotWidth, plotHeight, minWeight, maxWeight, weightRange, options);

        // Draw confidence intervals if enabled
        if (options.showConfidenceInterval !== false && data.length > 3) {
            this.drawConfidenceInterval(ctx, data, padding, plotWidth, plotHeight, minWeight, weightRange);
        }

        // Draw moving average if enabled
        if (options.showMovingAverage !== false && data.length > 3) {
            this.drawMovingAverage(ctx, data, padding, plotWidth, plotHeight, minWeight, weightRange, options.movingAverageWindow || 7);
        }

        // Draw trend line with enhanced analysis
        if (options.showTrend !== false) {
            this.drawEnhancedTrendLine(ctx, data, padding, plotWidth, plotHeight, minWeight, weightRange);
        }

        // Draw ideal weight zone if provided
        if (options.idealWeight) {
            this.drawIdealWeightZone(ctx, options.idealWeight, padding, plotWidth, plotHeight, minWeight, weightRange, options.idealWeightTolerance || 0.5);
        }

        // Draw weight line with enhanced styling
        this.drawEnhancedWeightLine(ctx, data, padding, plotWidth, plotHeight, minWeight, weightRange);

        // Draw data points with enhanced information
        this.drawEnhancedDataPoints(ctx, data, padding, plotWidth, plotHeight, minWeight, weightRange, statistics);

        // Draw statistical annotations
        if (options.showStatistics !== false) {
            this.drawStatisticalAnnotations(ctx, statistics, padding, plotWidth, plotHeight, minWeight, weightRange);
        }

        // Draw axes with enhanced labels
        this.drawEnhancedWeightAxes(ctx, data, padding, plotWidth, plotHeight, minWeight, maxWeight, weightRange);

        // Draw enhanced legend
        if (options.showLegend !== false) {
            this.drawEnhancedWeightLegend(ctx, chartWidth, options, statistics);
        }

        // Add enhanced interactivity
        this.addEnhancedChartInteractivity(canvas, data, padding, plotWidth, plotHeight, minWeight, weightRange, statistics);

        return {
            canvas,
            data,
            options,
            statistics,
            destroy: () => this.destroyChart(canvas)
        };
    }

    // Multi-metric Vitals Chart
    createVitalsChart(canvas, data, metrics = ['temperature', 'heart_rate', 'respiratory_rate']) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const chartWidth = rect.width;
        const chartHeight = rect.height;
        const padding = 60;
        const plotWidth = chartWidth - (padding * 2);
        const plotHeight = chartHeight - (padding * 2);

        // Clear canvas
        ctx.clearRect(0, 0, chartWidth, chartHeight);

        // Draw background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, chartWidth, chartHeight);

        // Draw grid
        this.drawGrid(ctx, padding, plotWidth, plotHeight, 5, 6);

        // Draw each metric
        metrics.forEach((metric, index) => {
            const metricData = data.filter(d => d[metric] !== null && d[metric] !== undefined);
            if (metricData.length === 0) return;

            const values = metricData.map(d => d[metric]);
            const minValue = Math.min(...values) * 0.9;
            const maxValue = Math.max(...values) * 1.1;
            const valueRange = maxValue - minValue;

            const color = Object.values(this.chartColors)[index % Object.keys(this.chartColors).length];
            
            this.drawVitalsLine(ctx, metricData, metric, padding, plotWidth, plotHeight, minValue, valueRange, color);
        });

        // Draw legend for vitals
        this.drawVitalsLegend(ctx, chartWidth, metrics);

        return {
            canvas,
            data,
            metrics,
            destroy: () => this.destroyChart(canvas)
        };
    }

    // Activity Level Chart (Bar Chart)
    createActivityChart(canvas, data) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const chartWidth = rect.width;
        const chartHeight = rect.height;
        const padding = 60;
        const plotWidth = chartWidth - (padding * 2);
        const plotHeight = chartHeight - (padding * 2);

        // Clear canvas
        ctx.clearRect(0, 0, chartWidth, chartHeight);

        // Draw background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, chartWidth, chartHeight);

        // Process activity data
        const maxDuration = Math.max(...data.map(d => d.duration));
        const barWidth = plotWidth / data.length * 0.8;
        const barSpacing = plotWidth / data.length * 0.2;

        // Draw bars
        data.forEach((activity, index) => {
            const barHeight = (activity.duration / maxDuration) * plotHeight;
            const x = padding + (index * (barWidth + barSpacing));
            const y = padding + plotHeight - barHeight;

            // Color based on intensity
            let color = this.chartColors.info;
            if (activity.intensity === 'high') color = this.chartColors.error;
            else if (activity.intensity === 'moderate') color = this.chartColors.warning;
            else if (activity.intensity === 'low') color = this.chartColors.success;

            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw activity type label
            ctx.fillStyle = '#6b7280';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(activity.type, x + barWidth / 2, padding + plotHeight + 20);
        });

        // Draw y-axis labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = (maxDuration / 5) * i;
            const y = padding + plotHeight - (plotHeight / 5) * i;
            ctx.fillText(Math.round(value) + ' min', padding - 10, y + 4);
        }

        return {
            canvas,
            data,
            destroy: () => this.destroyChart(canvas)
        };
    }

    // Health Score Gauge Chart
    createHealthScoreGauge(canvas, score, maxScore = 100) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const chartWidth = rect.width;
        const chartHeight = rect.height;
        const centerX = chartWidth / 2;
        const centerY = chartHeight / 2;
        const radius = Math.min(chartWidth, chartHeight) / 2 - 20;

        // Clear canvas
        ctx.clearRect(0, 0, chartWidth, chartHeight);

        // Draw background arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
        ctx.lineWidth = 20;
        ctx.strokeStyle = '#e5e7eb';
        ctx.stroke();

        // Draw score arc
        const scoreAngle = Math.PI + (Math.PI * (score / maxScore));
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, scoreAngle);
        ctx.lineWidth = 20;
        
        // Color based on score
        if (score >= 80) ctx.strokeStyle = this.chartColors.success;
        else if (score >= 60) ctx.strokeStyle = this.chartColors.warning;
        else ctx.strokeStyle = this.chartColors.error;
        
        ctx.stroke();

        // Draw score text
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(score), centerX, centerY - 10);
        
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText('Health Score', centerX, centerY + 15);

        return {
            canvas,
            score,
            maxScore,
            destroy: () => this.destroyChart(canvas)
        };
    }

    // Medication Adherence Chart
    createMedicationChart(canvas, medicationData) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const chartWidth = rect.width;
        const chartHeight = rect.height;
        const padding = 40;

        // Clear canvas
        ctx.clearRect(0, 0, chartWidth, chartHeight);

        // Draw medication adherence as horizontal bars
        const barHeight = 30;
        const barSpacing = 10;
        const totalHeight = medicationData.length * (barHeight + barSpacing);
        const startY = (chartHeight - totalHeight) / 2;

        medicationData.forEach((med, index) => {
            const y = startY + index * (barHeight + barSpacing);
            const adherenceWidth = (chartWidth - padding * 2) * (med.adherence / 100);

            // Background bar
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(padding, y, chartWidth - padding * 2, barHeight);

            // Adherence bar
            let color = this.chartColors.success;
            if (med.adherence < 80) color = this.chartColors.warning;
            if (med.adherence < 60) color = this.chartColors.error;

            ctx.fillStyle = color;
            ctx.fillRect(padding, y, adherenceWidth, barHeight);

            // Medication name
            ctx.fillStyle = '#1f2937';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(med.name, padding + 10, y + barHeight / 2 + 5);

            // Adherence percentage
            ctx.textAlign = 'right';
            ctx.fillText(med.adherence + '%', chartWidth - padding - 10, y + barHeight / 2 + 5);
        });

        return {
            canvas,
            data: medicationData,
            destroy: () => this.destroyChart(canvas)
        };
    }

    // Helper Methods
    drawGrid(ctx, padding, width, height, horizontalLines, verticalLines) {
        ctx.strokeStyle = '#f3f4f6';
        ctx.lineWidth = 1;

        // Horizontal lines
        for (let i = 0; i <= horizontalLines; i++) {
            const y = padding + (height / horizontalLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + width, y);
            ctx.stroke();
        }

        // Vertical lines
        for (let i = 0; i <= verticalLines; i++) {
            const x = padding + (width / verticalLines) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, padding + height);
            ctx.stroke();
        }
    }

    drawTrendLine(ctx, data, padding, width, height, minWeight, weightRange) {
        if (data.length < 2) return;

        // Calculate linear regression
        const n = data.length;
        const sumX = data.reduce((sum, _, i) => sum + i, 0);
        const sumY = data.reduce((sum, d) => sum + d.weight, 0);
        const sumXY = data.reduce((sum, d, i) => sum + i * d.weight, 0);
        const sumXX = data.reduce((sum, _, i) => sum + i * i, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Draw trend line
        ctx.strokeStyle = this.chartColors.warning;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();

        const startY = padding + height - ((intercept - minWeight) / weightRange) * height;
        const endY = padding + height - (((slope * (n - 1) + intercept) - minWeight) / weightRange) * height;

        ctx.moveTo(padding, startY);
        ctx.lineTo(padding + width, endY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawIdealWeightLine(ctx, idealWeight, padding, width, height, minWeight, weightRange) {
        const y = padding + height - ((idealWeight - minWeight) / weightRange) * height;
        
        ctx.strokeStyle = this.chartColors.success;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + width, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = this.chartColors.success;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Ideal: ${idealWeight}kg`, padding + 10, y - 5);
    }

    drawWeightLine(ctx, data, padding, width, height, minWeight, weightRange) {
        ctx.strokeStyle = this.chartColors.primary;
        ctx.lineWidth = 3;
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + (width / (data.length - 1)) * index;
            const y = padding + height - ((point.weight - minWeight) / weightRange) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    }

    drawDataPoints(ctx, data, padding, width, height, minWeight, weightRange) {
        data.forEach((point, index) => {
            const x = padding + (width / (data.length - 1)) * index;
            const y = padding + height - ((point.weight - minWeight) / weightRange) * height;
            
            // Outer circle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();
            
            // Inner circle
            ctx.fillStyle = this.chartColors.primary;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    drawWeightAxes(ctx, data, padding, width, height, minWeight, maxWeight, weightRange) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';

        // Y-axis labels (weight)
        for (let i = 0; i <= 5; i++) {
            const weight = minWeight + (weightRange / 5) * (5 - i);
            const y = padding + (height / 5) * i;
            ctx.textAlign = 'right';
            ctx.fillText(weight.toFixed(1) + ' kg', padding - 10, y + 4);
        }

        // X-axis labels (dates)
        ctx.textAlign = 'center';
        const labelInterval = Math.ceil(data.length / 6);
        for (let i = 0; i < data.length; i += labelInterval) {
            const x = padding + (width / (data.length - 1)) * i;
            const date = new Date(data[i].date);
            const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            ctx.fillText(label, x, padding + height + 20);
        }
    }

    drawWeightLegend(ctx, chartWidth, options) {
        const legendY = 20;
        let legendX = chartWidth - 200;

        ctx.font = '12px sans-serif';
        
        // Current weight
        ctx.fillStyle = this.chartColors.primary;
        ctx.fillRect(legendX, legendY, 15, 3);
        ctx.fillStyle = '#1f2937';
        ctx.textAlign = 'left';
        ctx.fillText('Current Weight', legendX + 20, legendY + 10);

        // Trend line
        if (options.showTrend !== false) {
            legendX += 120;
            ctx.strokeStyle = this.chartColors.warning;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(legendX, legendY + 2);
            ctx.lineTo(legendX + 15, legendY + 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#1f2937';
            ctx.fillText('Trend', legendX + 20, legendY + 10);
        }
    }

    drawVitalsLine(ctx, data, metric, padding, width, height, minValue, valueRange, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + (width / (data.length - 1)) * index;
            const y = padding + height - ((point[metric] - minValue) / valueRange) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();

        // Draw data points
        ctx.fillStyle = color;
        data.forEach((point, index) => {
            const x = padding + (width / (data.length - 1)) * index;
            const y = padding + height - ((point[metric] - minValue) / valueRange) * height;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    drawVitalsLegend(ctx, chartWidth, metrics) {
        const legendY = 20;
        let legendX = chartWidth - 300;

        ctx.font = '12px sans-serif';
        
        metrics.forEach((metric, index) => {
            const color = Object.values(this.chartColors)[index % Object.keys(this.chartColors).length];
            const label = metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            ctx.fillStyle = color;
            ctx.fillRect(legendX, legendY, 15, 3);
            ctx.fillStyle = '#1f2937';
            ctx.textAlign = 'left';
            ctx.fillText(label, legendX + 20, legendY + 10);
            
            legendX += 100;
        });
    }

    addChartInteractivity(canvas, data, padding, width, height, minWeight, weightRange) {
        const tooltip = this.createTooltip();
        
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Find closest data point
            let closestIndex = -1;
            let closestDistance = Infinity;

            data.forEach((point, index) => {
                const x = padding + (width / (data.length - 1)) * index;
                const y = padding + height - ((point.weight - minWeight) / weightRange) * height;
                const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));

                if (distance < closestDistance && distance < 20) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            });

            if (closestIndex >= 0) {
                const point = data[closestIndex];
                const date = new Date(point.date).toLocaleDateString();
                tooltip.show(e.clientX, e.clientY, `${date}<br>Weight: ${point.weight}kg`);
                canvas.style.cursor = 'pointer';
            } else {
                tooltip.hide();
                canvas.style.cursor = 'default';
            }
        });

        canvas.addEventListener('mouseleave', () => {
            tooltip.hide();
            canvas.style.cursor = 'default';
        });
    }

    createTooltip() {
        let tooltip = document.getElementById('chart-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'chart-tooltip';
            tooltip.style.cssText = `
                position: fixed;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
                z-index: 1000;
                display: none;
            `;
            document.body.appendChild(tooltip);
        }

        return {
            show: (x, y, content) => {
                tooltip.innerHTML = content;
                tooltip.style.left = x + 10 + 'px';
                tooltip.style.top = y - 30 + 'px';
                tooltip.style.display = 'block';
            },
            hide: () => {
                tooltip.style.display = 'none';
            }
        };
    }

    destroyChart(canvas) {
        const chartId = canvas.id;
        if (this.charts.has(chartId)) {
            this.charts.delete(chartId);
        }
        
        // Remove event listeners
        const newCanvas = canvas.cloneNode(true);
        canvas.parentNode.replaceChild(newCanvas, canvas);
    }

    // Enhanced Statistical Analysis Methods
    calculateStatistics(values) {
        if (values.length === 0) return null;
        
        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        
        // Calculate variance and standard deviation
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        // Calculate percentiles
        const q1Index = Math.floor(sorted.length * 0.25);
        const q3Index = Math.floor(sorted.length * 0.75);
        const medianIndex = Math.floor(sorted.length * 0.5);
        
        return {
            count: values.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: mean,
            median: sorted[medianIndex],
            q1: sorted[q1Index],
            q3: sorted[q3Index],
            stdDev: stdDev,
            variance: variance,
            range: sorted[sorted.length - 1] - sorted[0],
            iqr: sorted[q3Index] - sorted[q1Index]
        };
    }

    calculateTrend(data, metric = 'weight') {
        if (data.length < 2) return { slope: 0, direction: 'stable' };

        const values = data.map(d => d[metric]);
        const n = values.length;
        const sumX = values.reduce((sum, _, i) => sum + i, 0);
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
        const sumXX = values.reduce((sum, _, i) => sum + i * i, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Calculate R-squared
        const yMean = sumY / n;
        const ssTotal = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
        const ssRes = values.reduce((sum, val, i) => {
            const predicted = slope * i + intercept;
            return sum + Math.pow(val - predicted, 2);
        }, 0);
        const rSquared = 1 - (ssRes / ssTotal);
        
        let direction = 'stable';
        let strength = 'weak';
        
        if (Math.abs(slope) > 0.1) {
            direction = slope > 0 ? 'increasing' : 'decreasing';
            if (rSquared > 0.7) strength = 'strong';
            else if (rSquared > 0.4) strength = 'moderate';
        }

        return { 
            slope, 
            intercept, 
            direction, 
            strength,
            rSquared,
            confidence: rSquared > 0.5 ? 'high' : rSquared > 0.3 ? 'medium' : 'low'
        };
    }

    // Enhanced drawing methods for advanced charts
    drawEnhancedGrid(ctx, padding, width, height, minWeight, maxWeight, weightRange, options) {
        // Draw standard grid
        this.drawGrid(ctx, padding, width, height, 5, 6);
        
        // Add statistical zones if enabled
        if (options.showStatisticalZones && options.statistics) {
            const stats = options.statistics;
            
            // Draw standard deviation zones
            const meanY = padding + height - ((stats.mean - minWeight) / weightRange) * height;
            const stdDevHeight = (stats.stdDev / weightRange) * height;
            
            // 1 standard deviation zone (68% of data)
            ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            ctx.fillRect(padding, meanY - stdDevHeight, width, stdDevHeight * 2);
            
            // 2 standard deviation zone (95% of data)
            ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
            ctx.fillRect(padding, meanY - stdDevHeight * 2, width, stdDevHeight * 4);
        }
    }

    drawConfidenceInterval(ctx, data, padding, width, height, minWeight, weightRange) {
        if (data.length < 3) return;
        
        const weights = data.map(d => d.weight);
        const stats = this.calculateStatistics(weights);
        const confidenceLevel = 0.95; // 95% confidence interval
        const tValue = 1.96; // Approximate t-value for 95% CI with large sample
        const marginOfError = tValue * (stats.stdDev / Math.sqrt(stats.count));
        
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.beginPath();
        
        // Draw upper confidence bound
        data.forEach((point, index) => {
            const x = padding + (width / (data.length - 1)) * index;
            const upperBound = point.weight + marginOfError;
            const y = padding + height - ((upperBound - minWeight) / weightRange) * height;
            
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        // Draw lower confidence bound (reverse order)
        for (let i = data.length - 1; i >= 0; i--) {
            const x = padding + (width / (data.length - 1)) * i;
            const lowerBound = data[i].weight - marginOfError;
            const y = padding + height - ((lowerBound - minWeight) / weightRange) * height;
            ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        ctx.fill();
    }

    drawMovingAverage(ctx, data, padding, width, height, minWeight, weightRange, window) {
        const movingAverageData = this.calculateMovingAverage(data, 'weight', window);
        
        ctx.strokeStyle = this.chartColors.purple;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();

        movingAverageData.forEach((point, index) => {
            const x = padding + (width / (data.length - 1)) * index;
            const y = padding + height - ((point.weight_ma - minWeight) / weightRange) * height;
            
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawEnhancedTrendLine(ctx, data, padding, width, height, minWeight, weightRange) {
        if (data.length < 2) return;

        const trend = this.calculateTrend(data, 'weight');
        
        // Choose color based on trend strength and direction
        let color = this.chartColors.warning;
        if (trend.strength === 'strong') {
            color = trend.direction === 'increasing' ? this.chartColors.error : this.chartColors.success;
        } else if (trend.strength === 'moderate') {
            color = this.chartColors.warning;
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = trend.strength === 'strong' ? 3 : 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();

        const startY = padding + height - ((trend.intercept - minWeight) / weightRange) * height;
        const endY = padding + height - (((trend.slope * (data.length - 1) + trend.intercept) - minWeight) / weightRange) * height;

        ctx.moveTo(padding, startY);
        ctx.lineTo(padding + width, endY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Add trend confidence indicator
        if (trend.confidence === 'high') {
            ctx.fillStyle = color;
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${trend.direction} (${Math.round(trend.rSquared * 100)}% fit)`, padding + width - 10, padding + 20);
        }
    }

    drawIdealWeightZone(ctx, idealWeight, padding, width, height, minWeight, weightRange, tolerance) {
        const upperBound = idealWeight + tolerance;
        const lowerBound = idealWeight - tolerance;
        
        const upperY = padding + height - ((upperBound - minWeight) / weightRange) * height;
        const lowerY = padding + height - ((lowerBound - minWeight) / weightRange) * height;
        
        // Draw ideal zone
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fillRect(padding, upperY, width, lowerY - upperY);
        
        // Draw ideal weight line
        const idealY = padding + height - ((idealWeight - minWeight) / weightRange) * height;
        ctx.strokeStyle = this.chartColors.success;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(padding, idealY);
        ctx.lineTo(padding + width, idealY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = this.chartColors.success;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Ideal: ${idealWeight}kg (±${tolerance}kg)`, padding + 10, idealY - 5);
    }

    drawEnhancedWeightLine(ctx, data, padding, width, height, minWeight, weightRange) {
        // Create gradient for the line
        const gradient = ctx.createLinearGradient(padding, 0, padding + width, 0);
        gradient.addColorStop(0, this.chartColors.primary);
        gradient.addColorStop(1, this.chartColors.info);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + (width / (data.length - 1)) * index;
            const y = padding + height - ((point.weight - minWeight) / weightRange) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Add area fill under the line
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = padding + (width / (data.length - 1)) * index;
            const y = padding + height - ((point.weight - minWeight) / weightRange) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        // Close the area to the bottom
        const lastX = padding + width;
        const firstX = padding;
        const bottomY = padding + height;
        
        ctx.lineTo(lastX, bottomY);
        ctx.lineTo(firstX, bottomY);
        ctx.closePath();
        ctx.fill();
    }

    drawEnhancedDataPoints(ctx, data, padding, width, height, minWeight, weightRange, statistics) {
        data.forEach((point, index) => {
            const x = padding + (width / (data.length - 1)) * index;
            const y = padding + height - ((point.weight - minWeight) / weightRange) * height;
            
            // Determine point color based on deviation from mean
            let pointColor = this.chartColors.primary;
            if (statistics) {
                const deviation = Math.abs(point.weight - statistics.mean);
                if (deviation > statistics.stdDev * 2) {
                    pointColor = this.chartColors.error; // Outlier
                } else if (deviation > statistics.stdDev) {
                    pointColor = this.chartColors.warning; // Above 1 std dev
                }
            }
            
            // Outer circle (white border)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, 2 * Math.PI);
            ctx.fill();
            
            // Inner circle with color coding
            ctx.fillStyle = pointColor;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add small indicator for notes if present
            if (point.notes) {
                ctx.fillStyle = this.chartColors.warning;
                ctx.beginPath();
                ctx.arc(x + 8, y - 8, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }

    drawStatisticalAnnotations(ctx, statistics, padding, width, height, minWeight, weightRange) {
        if (!statistics) return;
        
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#6b7280';
        
        // Mean line
        const meanY = padding + height - ((statistics.mean - minWeight) / weightRange) * height;
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(padding, meanY);
        ctx.lineTo(padding + width, meanY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Mean label
        ctx.textAlign = 'right';
        ctx.fillText(`Mean: ${statistics.mean.toFixed(1)}kg`, padding + width - 5, meanY - 5);
        
        // Range annotation
        ctx.textAlign = 'left';
        ctx.fillText(`Range: ${statistics.range.toFixed(1)}kg`, padding + 5, padding + 15);
        ctx.fillText(`Std Dev: ±${statistics.stdDev.toFixed(1)}kg`, padding + 5, padding + 30);
    }

    drawEnhancedWeightAxes(ctx, data, padding, width, height, minWeight, maxWeight, weightRange) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';

        // Y-axis labels (weight) with better formatting
        for (let i = 0; i <= 5; i++) {
            const weight = minWeight + (weightRange / 5) * (5 - i);
            const y = padding + (height / 5) * i;
            ctx.textAlign = 'right';
            ctx.fillText(weight.toFixed(1) + ' kg', padding - 10, y + 4);
            
            // Add grid line
            ctx.strokeStyle = '#f3f4f6';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding - 5, y);
            ctx.lineTo(padding, y);
            ctx.stroke();
        }

        // X-axis labels (dates) with better spacing
        ctx.textAlign = 'center';
        const maxLabels = Math.min(8, data.length);
        const labelInterval = Math.max(1, Math.floor(data.length / maxLabels));
        
        for (let i = 0; i < data.length; i += labelInterval) {
            const x = padding + (width / (data.length - 1)) * i;
            const date = new Date(data[i].date);
            const label = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: data.length > 30 ? '2-digit' : undefined
            });
            ctx.fillText(label, x, padding + height + 20);
            
            // Add tick mark
            ctx.strokeStyle = '#f3f4f6';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, padding + height);
            ctx.lineTo(x, padding + height + 5);
            ctx.stroke();
        }
        
        // Axis labels
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(20, padding + height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Weight (kg)', 0, 0);
        ctx.restore();
        
        ctx.fillText('Date', padding + width / 2, padding + height + 45);
    }

    drawEnhancedWeightLegend(ctx, chartWidth, options, statistics) {
        const legendY = 20;
        let legendX = chartWidth - 300;

        ctx.font = '12px sans-serif';
        
        // Weight line
        ctx.strokeStyle = this.chartColors.primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(legendX, legendY + 2);
        ctx.lineTo(legendX + 15, legendY + 2);
        ctx.stroke();
        ctx.fillStyle = '#1f2937';
        ctx.textAlign = 'left';
        ctx.fillText('Weight', legendX + 20, legendY + 6);
        legendX += 70;

        // Moving average
        if (options.showMovingAverage !== false) {
            ctx.strokeStyle = this.chartColors.purple;
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(legendX, legendY + 2);
            ctx.lineTo(legendX + 15, legendY + 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#1f2937';
            ctx.fillText('Moving Avg', legendX + 20, legendY + 6);
            legendX += 90;
        }

        // Trend line
        if (options.showTrend !== false) {
            ctx.strokeStyle = this.chartColors.warning;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(legendX, legendY + 2);
            ctx.lineTo(legendX + 15, legendY + 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#1f2937';
            ctx.fillText('Trend', legendX + 20, legendY + 6);
            legendX += 60;
        }

        // Ideal weight zone
        if (options.idealWeight) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
            ctx.fillRect(legendX, legendY, 15, 8);
            ctx.fillStyle = '#1f2937';
            ctx.fillText('Ideal Zone', legendX + 20, legendY + 6);
        }
    }

    addEnhancedChartInteractivity(canvas, data, padding, width, height, minWeight, weightRange, statistics) {
        const tooltip = this.createEnhancedTooltip();
        
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Find closest data point
            let closestIndex = -1;
            let closestDistance = Infinity;

            data.forEach((point, index) => {
                const x = padding + (width / (data.length - 1)) * index;
                const y = padding + height - ((point.weight - minWeight) / weightRange) * height;
                const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));

                if (distance < closestDistance && distance < 25) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            });

            if (closestIndex >= 0) {
                const point = data[closestIndex];
                const date = new Date(point.date).toLocaleDateString();
                
                // Calculate change from previous point
                let changeText = '';
                if (closestIndex > 0) {
                    const change = point.weight - data[closestIndex - 1].weight;
                    const changeIcon = change > 0 ? '↗' : change < 0 ? '↘' : '→';
                    changeText = `<br>Change: ${changeIcon} ${change > 0 ? '+' : ''}${change.toFixed(1)}kg`;
                }
                
                // Statistical context
                let statText = '';
                if (statistics) {
                    const deviation = point.weight - statistics.mean;
                    const deviationText = deviation > 0 ? `+${deviation.toFixed(1)}` : deviation.toFixed(1);
                    statText = `<br>vs Mean: ${deviationText}kg`;
                }
                
                const tooltipContent = `
                    <strong>${date}</strong><br>
                    Weight: ${point.weight}kg${changeText}${statText}
                    ${point.notes ? `<br><em>${point.notes}</em>` : ''}
                `;
                
                tooltip.show(e.clientX, e.clientY, tooltipContent);
                canvas.style.cursor = 'pointer';
            } else {
                tooltip.hide();
                canvas.style.cursor = 'default';
            }
        });

        canvas.addEventListener('mouseleave', () => {
            tooltip.hide();
            canvas.style.cursor = 'default';
        });
        
        // Add click handler for detailed view
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Find clicked data point
            data.forEach((point, index) => {
                const x = padding + (width / (data.length - 1)) * index;
                const y = padding + height - ((point.weight - minWeight) / weightRange) * height;
                const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));

                if (distance < 15) {
                    // Emit event for detailed view
                    canvas.dispatchEvent(new CustomEvent('dataPointClick', {
                        detail: { point, index }
                    }));
                }
            });
        });
    }

    createEnhancedTooltip() {
        let tooltip = document.getElementById('enhanced-chart-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'enhanced-chart-tooltip';
            tooltip.style.cssText = `
                position: fixed;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 13px;
                line-height: 1.4;
                pointer-events: none;
                z-index: 1000;
                display: none;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                max-width: 250px;
            `;
            document.body.appendChild(tooltip);
        }

        return {
            show: (x, y, content) => {
                tooltip.innerHTML = content;
                tooltip.style.left = x + 15 + 'px';
                tooltip.style.top = y - 40 + 'px';
                tooltip.style.display = 'block';
                
                // Adjust position if tooltip goes off screen
                const rect = tooltip.getBoundingClientRect();
                if (rect.right > window.innerWidth) {
                    tooltip.style.left = x - rect.width - 15 + 'px';
                }
                if (rect.top < 0) {
                    tooltip.style.top = y + 15 + 'px';
                }
            },
            hide: () => {
                tooltip.style.display = 'none';
            }
        };
    }

    calculateMovingAverage(data, metric = 'weight', window = 7) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            const start = Math.max(0, i - Math.floor(window / 2));
            const end = Math.min(data.length, i + Math.ceil(window / 2));
            const subset = data.slice(start, end);
            const average = subset.reduce((sum, d) => sum + d[metric], 0) / subset.length;
            result.push({ ...data[i], [`${metric}_ma`]: average });
        }
        return result;
    }

    calculateHealthScore(pet, healthData) {
        let score = 100;
        
        // Weight score (30% of total)
        if (pet.current_weight && pet.ideal_weight) {
            const weightRatio = pet.current_weight / pet.ideal_weight;
            if (weightRatio < 0.85 || weightRatio > 1.15) score -= 20;
            else if (weightRatio < 0.9 || weightRatio > 1.1) score -= 10;
        }

        // Activity score (25% of total)
        const activityScore = this.calculateActivityScore(healthData.activity);
        score -= (100 - activityScore) * 0.25;

        // Medication adherence (20% of total)
        if (healthData.medications && healthData.medications.length > 0) {
            const avgAdherence = healthData.medications.reduce((sum, med) => sum + (med.adherence || 100), 0) / healthData.medications.length;
            score -= (100 - avgAdherence) * 0.2;
        }

        // Health alerts penalty (15% of total)
        if (healthData.alerts && healthData.alerts.length > 0) {
            const highPriorityAlerts = healthData.alerts.filter(alert => alert.severity === 'high').length;
            const mediumPriorityAlerts = healthData.alerts.filter(alert => alert.severity === 'medium').length;
            score -= (highPriorityAlerts * 10 + mediumPriorityAlerts * 5);
        }

        // Regular checkups bonus (10% of total)
        const lastCheckup = healthData.records?.find(r => r.type === 'vet_visit');
        if (lastCheckup) {
            const daysSinceCheckup = (new Date() - new Date(lastCheckup.date)) / (1000 * 60 * 60 * 24);
            if (daysSinceCheckup > 365) score -= 10;
            else if (daysSinceCheckup > 180) score -= 5;
        } else {
            score -= 10;
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    calculateActivityScore(activityData) {
        if (!activityData || !activityData.progress) return 70;
        return Math.min(100, activityData.progress);
    }

    generateHealthInsights(pet, healthData) {
        const insights = [];

        // Weight insights
        if (pet.current_weight && pet.ideal_weight) {
            const weightRatio = pet.current_weight / pet.ideal_weight;
            if (weightRatio > 1.1) {
                insights.push({
                    type: 'warning',
                    title: 'Weight Management',
                    message: `${pet.name} is ${Math.round((weightRatio - 1) * 100)}% above ideal weight. Consider adjusting diet and exercise.`,
                    action: 'Create Weight Loss Plan'
                });
            } else if (weightRatio < 0.9) {
                insights.push({
                    type: 'warning',
                    title: 'Weight Concern',
                    message: `${pet.name} is ${Math.round((1 - weightRatio) * 100)}% below ideal weight. Consult with veterinarian.`,
                    action: 'Schedule Vet Visit'
                });
            }
        }

        // Activity insights
        if (healthData.activity && healthData.activity.progress < 60) {
            insights.push({
                type: 'info',
                title: 'Activity Level',
                message: `${pet.name}'s activity level is below recommended. Increase daily exercise and playtime.`,
                action: 'Plan Activities'
            });
        }

        // Medication insights
        if (healthData.medications) {
            const missedMeds = healthData.medications.filter(med => med.adherence < 80);
            if (missedMeds.length > 0) {
                insights.push({
                    type: 'error',
                    title: 'Medication Adherence',
                    message: `Missed doses detected for ${missedMeds.map(m => m.name).join(', ')}. Set up reminders.`,
                    action: 'Setup Reminders'
                });
            }
        }

        return insights;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthAnalytics;
} else {
    window.HealthAnalytics = HealthAnalytics;
}