document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    const salesHistory = JSON.parse(localStorage.getItem('salesHistory')) || [];
    const inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    const currentCurrency = JSON.parse(localStorage.getItem('currency')) || { symbol: 'R', code: 'ZAR' };

    console.log('Loaded data:', { salesHistory, inventory, currentCurrency });

    updateDashboardStats(salesHistory, inventory, currentCurrency);
    createSalesChart(salesHistory, currentCurrency);
    createItemsSoldChart(salesHistory);
    createProfitChart(salesHistory, currentCurrency);
    createProfitPerItemChart(salesHistory, currentCurrency);
    createProfitMarginChart(salesHistory, currentCurrency);
    generateInsights(salesHistory, inventory);
});

function updateDashboardStats(salesHistory, inventory, currency) {
    // Total Sales in Currency
    const totalRevenue = salesHistory.reduce((sum, sale) => sum + sale.total, 0);
    document.getElementById('totalRevenue').textContent = 
        `${currency.symbol}${totalRevenue.toFixed(2)}`;

    // Total Items Sold
    const totalItemsSold = salesHistory.reduce((sum, sale) => sum + sale.quantity, 0);
    document.getElementById('totalSales').textContent = totalItemsSold;

    // Total Cost of Purchases
    const totalCost = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('profitMargin').textContent = 
        `${currency.symbol}${totalCost.toFixed(2)}`;

    // Low Stock Alert
    const lowStockItems = inventory.filter(item => item.quantity <= 5).length;
    document.getElementById('lowStockCount').textContent = lowStockItems;
}

// Common chart options
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1.5, // Reduced from 2
    plugins: {
        legend: {
            display: true,
            position: 'top',
            labels: {
                boxWidth: 12,
                font: {
                    size: 11 // Smaller font size
                }
            }
        },
        title: {
            font: {
                size: 13 // Smaller title size
            }
        }
    },
    scales: {
        x: {
            ticks: {
                font: {
                    size: 10 // Smaller axis labels
                }
            }
        },
        y: {
            ticks: {
                font: {
                    size: 10 // Smaller axis labels
                }
            }
        }
    }
};

function createSalesChart(salesHistory, currency) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    // Group sales by date
    const salesByDate = {};
    salesHistory.forEach(sale => {
        const date = new Date(sale.date).toLocaleDateString();
        salesByDate[date] = (salesByDate[date] || 0) + sale.total;
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(salesByDate),
            datasets: [{
                label: `Sales (${currency.code})`,
                data: Object.values(salesByDate),
                borderColor: '#4CAF50',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Total Sales Over Time'
                }
            }
        }
    });
}

function createItemsSoldChart(salesHistory) {
    const ctx = document.getElementById('topItemsChart').getContext('2d');
    
    // Count items sold
    const itemCounts = {};
    salesHistory.forEach(sale => {
        itemCounts[sale.itemName] = (itemCounts[sale.itemName] || 0) + sale.quantity;
    });

    // Sort by quantity
    const sortedItems = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5 items

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedItems.map(item => item[0]),
            datasets: [{
                label: 'Units Sold',
                data: sortedItems.map(item => item[1]),
                backgroundColor: '#2196F3'
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Top Selling Items'
                }
            }
        }
    });
}

function createProfitChart(salesHistory, currency) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Calculate profit per day
    const profitByDate = {};
    salesHistory.forEach(sale => {
        const date = new Date(sale.date).toLocaleDateString();
        const profit = sale.quantity * (sale.salePrice - sale.originalPrice);
        profitByDate[date] = (profitByDate[date] || 0) + profit;
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(profitByDate),
            datasets: [{
                label: `Profit (${currency.code})`,
                data: Object.values(profitByDate),
                borderColor: '#E91E63',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Profit Over Time'
                }
            }
        }
    });
}

function createProfitPerItemChart(salesHistory, currency) {
    const ctx = document.getElementById('profitChart').getContext('2d');
    
    // Calculate profit per item
    const profitPerItem = {};
    salesHistory.forEach(sale => {
        const profit = sale.quantity * (sale.salePrice - sale.originalPrice);
        profitPerItem[sale.itemName] = (profitPerItem[sale.itemName] || 0) + profit;
    });

    // Sort by profit
    const sortedProfits = Object.entries(profitPerItem)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5 profitable items

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedProfits.map(item => item[0]),
            datasets: [{
                label: `Profit (${currency.code})`,
                data: sortedProfits.map(item => item[1]),
                backgroundColor: '#9C27B0'
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Most Profitable Items'
                }
            }
        }
    });
}

function createProfitMarginChart(salesHistory, currency) {
    const ctx = document.getElementById('profitMarginChart').getContext('2d');
    
    // Calculate profit margin per day (profit/revenue * 100)
    const marginByDate = {};
    const salesByDate = {};
    
    salesHistory.forEach(sale => {
        const date = new Date(sale.date).toLocaleDateString();
        const revenue = sale.quantity * sale.salePrice;
        const cost = sale.quantity * sale.originalPrice;
        const profit = revenue - cost;
        
        if (!salesByDate[date]) {
            salesByDate[date] = { revenue: 0, profit: 0 };
        }
        
        salesByDate[date].revenue += revenue;
        salesByDate[date].profit += profit;
    });

    // Calculate margin percentage for each date
    Object.keys(salesByDate).forEach(date => {
        const margin = (salesByDate[date].profit / salesByDate[date].revenue) * 100;
        marginByDate[date] = margin;
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(marginByDate),
            datasets: [{
                label: 'Profit Margin %',
                data: Object.values(marginByDate),
                borderColor: '#FF9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Profit Margin Over Time'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => `${value.toFixed(1)}%`
                    }
                }
            }
        }
    });
}

// Add event listener for date range changes
document.getElementById('dateRange').addEventListener('change', (e) => {
    console.log('Date range changed:', e.target.value);
    const days = parseInt(e.target.value);
    const salesHistory = JSON.parse(localStorage.getItem('salesHistory')) || [];
    const inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    const currentCurrency = JSON.parse(localStorage.getItem('currency')) || { symbol: 'R', code: 'ZAR' };

    const filteredSales = filterDataByDays(salesHistory, days);
    console.log('Filtered sales:', filteredSales);

    updateDashboardStats(filteredSales, inventory, currentCurrency);
    createSalesChart(filteredSales, currentCurrency);
    createItemsSoldChart(filteredSales);
    createProfitChart(filteredSales, currentCurrency);
    createProfitPerItemChart(filteredSales, currentCurrency);
    createProfitMarginChart(filteredSales, currentCurrency);
    generateInsights(filteredSales, inventory);
});

function filterDataByDays(data, days) {
    if (days === 'all') return data;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return data.filter(item => new Date(item.date) > cutoffDate);
}

// Add this function to wait for charts to render
function getChartsImages() {
    return new Promise((resolve) => {
        const charts = document.querySelectorAll('canvas');
        const images = [];
        
        charts.forEach(canvas => {
            const image = canvas.toDataURL('image/png', 1.0);
            images.push({
                canvas,
                image
            });
        });
        
        resolve(images);
    });
}

// Update the download functionality
document.getElementById('downloadBtn').addEventListener('click', async () => {
    try {
        // Show loading message
        const loadingMsg = document.createElement('div');
        loadingMsg.style.position = 'fixed';
        loadingMsg.style.top = '50%';
        loadingMsg.style.left = '50%';
        loadingMsg.style.transform = 'translate(-50%, -50%)';
        loadingMsg.style.padding = '20px';
        loadingMsg.style.background = 'white';
        loadingMsg.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        loadingMsg.style.borderRadius = '5px';
        loadingMsg.style.zIndex = '1000';
        loadingMsg.textContent = 'Generating PDF...';
        document.body.appendChild(loadingMsg);

        const element = document.querySelector('.main-content');
        const dateRange = document.getElementById('dateRange').value;
        const dateText = dateRange === 'all' ? 'All Time' : `Last ${dateRange} Days`;
        
        // Create a clone of the element
        const clone = element.cloneNode(true);
        
        // Update title
        const title = clone.querySelector('h1');
        title.textContent += ` - ${dateText}`;
        
        // Add generation date
        const dateDiv = document.createElement('div');
        dateDiv.style.textAlign = 'right';
        dateDiv.style.marginTop = '10px';
        dateDiv.style.fontSize = '12px';
        dateDiv.textContent = `Generated on: ${new Date().toLocaleString()}`;
        clone.insertBefore(dateDiv, clone.firstChild);

        // Get chart images before PDF generation
        const chartImages = await getChartsImages();
        
        // Replace canvas elements with images in the clone
        chartImages.forEach(({canvas, image}) => {
            const canvasInClone = clone.querySelector(`canvas[id="${canvas.id}"]`);
            if (canvasInClone) {
                const img = document.createElement('img');
                img.src = image;
                img.style.width = '100%';
                img.style.height = 'auto';
                canvasInClone.parentNode.replaceChild(img, canvasInClone);
            }
        });

        // Configure PDF options
        const opt = {
            margin: 10,
            filename: `business_analytics_${dateText.toLowerCase().replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: false
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait' 
            }
        };

        // Generate PDF
        await html2pdf().set(opt).from(clone).save();

        // Remove loading message
        document.body.removeChild(loadingMsg);
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Please try again.');
        // Remove loading message if there's an error
        const loadingMsg = document.querySelector('div[style*="position: fixed"]');
        if (loadingMsg) {
            document.body.removeChild(loadingMsg);
        }
    }
}); 

// Add this new function for generating insights
function generateInsights(salesHistory, inventory) {
    console.log('Generating insights with:', { salesHistory, inventory });

    // Top Performer Analysis
    const topPerformerDiv = document.getElementById('topPerformer');
    if (!topPerformerDiv) {
        console.error('topPerformer element not found');
        return;
    }
    const topPerformerContent = analyzeTopPerformers(salesHistory);
    const topPerformerContentDiv = topPerformerDiv.querySelector('.insight-content');
    if (!topPerformerContentDiv) {
        console.error('insight-content not found in topPerformer');
        return;
    }
    topPerformerContentDiv.innerHTML = topPerformerContent;

    // Stock Recommendations
    const stockRecsDiv = document.getElementById('stockRecommendations');
    if (!stockRecsDiv) {
        console.error('stockRecommendations element not found');
        return;
    }
    const stockRecsContent = analyzeInventory(inventory, salesHistory);
    const stockRecsContentDiv = stockRecsDiv.querySelector('.insight-content');
    if (!stockRecsContentDiv) {
        console.error('insight-content not found in stockRecommendations');
        return;
    }
    stockRecsContentDiv.innerHTML = stockRecsContent;

    // Pricing Insights
    const pricingDiv = document.getElementById('pricingInsights');
    if (!pricingDiv) {
        console.error('pricingInsights element not found');
        return;
    }
    const pricingContent = analyzePricing(salesHistory);
    const pricingContentDiv = pricingDiv.querySelector('.insight-content');
    if (!pricingContentDiv) {
        console.error('insight-content not found in pricingInsights');
        return;
    }
    pricingContentDiv.innerHTML = pricingContent;
}

function analyzeTopPerformers(salesHistory) {
    if (salesHistory.length === 0) return '<p>No sales data available yet</p>';

    // Group sales by item with more detailed metrics
    const itemStats = {};
    let totalRevenue = 0;

    salesHistory.forEach(sale => {
        if (!itemStats[sale.itemName]) {
            itemStats[sale.itemName] = {
                revenue: 0,
                quantity: 0,
                profit: 0,
                transactions: 0
            };
        }
        const profit = (sale.salePrice - sale.originalPrice) * sale.quantity;
        itemStats[sale.itemName].revenue += sale.total;
        itemStats[sale.itemName].quantity += sale.quantity;
        itemStats[sale.itemName].profit += profit;
        itemStats[sale.itemName].transactions += 1;
        totalRevenue += sale.total;
    });

    // Calculate percentages and sort items
    Object.keys(itemStats).forEach(item => {
        itemStats[item].revenueShare = (itemStats[item].revenue / totalRevenue * 100).toFixed(1);
    });

    const sortedByRevenue = Object.entries(itemStats)
        .sort((a, b) => b[1].revenue - a[1].revenue);
    const sortedByProfit = Object.entries(itemStats)
        .sort((a, b) => b[1].profit - a[1].profit);
    const sortedByQuantity = Object.entries(itemStats)
        .sort((a, b) => b[1].quantity - a[1].quantity);

    return `
        <div class="insight-item">
            <h4>Top Revenue Generator</h4>
            <p>📈 <strong>${sortedByRevenue[0][0]}</strong> 
               (${sortedByRevenue[0][1].revenueShare}% of total revenue)</p>
            
            <h4>Most Units Sold</h4>
            <p>📦 <strong>${sortedByQuantity[0][0]}</strong> 
               (${sortedByQuantity[0][1].quantity} units)</p>
            
            <h4>Most Profitable</h4>
            <p>💰 <strong>${sortedByProfit[0][0]}</strong></p>
        </div>
    `;
}

function analyzeInventory(inventory, salesHistory) {
    if (!inventory.length) return '<p>No inventory data available yet</p>';
    if (!salesHistory.length) return '<p>No sales data available yet</p>';

    // Calculate daily sales rate for each item
    const salesRate = {};
    const msPerDay = 1000 * 60 * 60 * 24;
    const now = new Date();

    // Group sales by item and calculate daily rate
    salesHistory.forEach(sale => {
        if (!salesRate[sale.itemName]) {
            salesRate[sale.itemName] = {
                totalSold: 0,
                firstSaleDate: new Date(sale.date),
                lastSaleDate: new Date(sale.date)
            };
        }
        salesRate[sale.itemName].totalSold += sale.quantity;
        const saleDate = new Date(sale.date);
        if (saleDate < salesRate[sale.itemName].firstSaleDate) {
            salesRate[sale.itemName].firstSaleDate = saleDate;
        }
        if (saleDate > salesRate[sale.itemName].lastSaleDate) {
            salesRate[sale.itemName].lastSaleDate = saleDate;
        }
    });

    let recommendations = '<ul>';

    inventory.forEach(item => {
        const itemSales = salesRate[item.name];
        if (itemSales) {
            const daysSinceFirst = Math.max(1, (now - itemSales.firstSaleDate) / msPerDay);
            const dailyRate = itemSales.totalSold / daysSinceFirst;
            const daysUntilStockout = item.quantity / dailyRate;

            if (daysUntilStockout < 7) {
                recommendations += `
                    <li>🚨 <strong>Urgent Restock Needed:</strong> ${item.name}<br>
                    <small>Current stock will last only ${Math.ceil(daysUntilStockout)} days at current sales rate</small></li>`;
            } else if (daysUntilStockout < 14) {
                recommendations += `
                    <li>⚠️ <strong>Plan Restock Soon:</strong> ${item.name}<br>
                    <small>${Math.ceil(daysUntilStockout)} days of stock remaining</small></li>`;
            }

            if (item.quantity > dailyRate * 30) {
                recommendations += `
                    <li>📉 <strong>High Stock Level:</strong> ${item.name}<br>
                    <small>Current stock exceeds 30 days of typical sales</small></li>`;
            }
        } else {
            recommendations += `
                <li>❓ <strong>No Sales Data:</strong> ${item.name}<br>
                <small>Consider marketing or reviewing pricing</small></li>`;
        }
    });

    recommendations += '</ul>';
    return recommendations || '<p>No immediate stock actions required</p>';
}

function analyzePricing(salesHistory) {
    if (salesHistory.length === 0) return '<p>No sales data available yet</p>';

    const priceAnalysis = {};
    
    // Group sales by item for price analysis
    salesHistory.forEach(sale => {
        if (!priceAnalysis[sale.itemName]) {
            priceAnalysis[sale.itemName] = {
                prices: [],
                quantities: [],
                margins: [],
                totalRevenue: 0,
                totalQuantity: 0
            };
        }
        
        const margin = ((sale.salePrice - sale.originalPrice) / sale.originalPrice * 100);
        priceAnalysis[sale.itemName].prices.push(sale.salePrice);
        priceAnalysis[sale.itemName].quantities.push(sale.quantity);
        priceAnalysis[sale.itemName].margins.push(margin);
        priceAnalysis[sale.itemName].totalRevenue += sale.total;
        priceAnalysis[sale.itemName].totalQuantity += sale.quantity;
    });

    let insights = '<ul>';
    
    Object.entries(priceAnalysis).forEach(([item, data]) => {
        const avgMargin = data.margins.reduce((a, b) => a + b, 0) / data.margins.length;
        const avgPrice = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
        const maxPrice = Math.max(...data.prices);
        const minPrice = Math.min(...data.prices);
        
        // Find quantities sold at different price points
        const highPriceQty = data.quantities[data.prices.indexOf(maxPrice)];
        const lowPriceQty = data.quantities[data.prices.indexOf(minPrice)];

        if (maxPrice > minPrice) {
            if (highPriceQty >= lowPriceQty) {
                insights += `
                    <li>💎 <strong>${item}:</strong><br>
                    <small>Strong sales at higher prices - consider gradual price increase</small></li>`;
            }
            if (lowPriceQty > highPriceQty * 1.5) {
                insights += `
                    <li>🏷️ <strong>${item}:</strong><br>
                    <small>Price sensitive - promotions are effective</small></li>`;
            }
        }

        if (avgMargin < 15) {
            insights += `
                <li>⚠️ <strong>${item}:</strong><br>
                <small>Low margin (${avgMargin.toFixed(1)}%) - review pricing strategy</small></li>`;
        } else if (avgMargin > 50) {
            insights += `
                <li>✨ <strong>${item}:</strong><br>
                <small>High margin (${avgMargin.toFixed(1)}%) - good profit potential</small></li>`;
        }
    });

    insights += '</ul>';
    return insights || '<p>No significant pricing insights available</p>';
}