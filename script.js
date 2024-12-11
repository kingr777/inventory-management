let inventory = [];
let salesHistory = [];
let currentCurrency = {
    code: 'ZAR',
    symbol: 'R'
};

const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'INR': '₹',
    'ZAR': 'R'
};

// Function to export data
function exportInventoryData() {
    const exportData = {
        currency: currentCurrency,
        inventory: inventory,
        salesHistory: salesHistory,
        exportDate: new Date().toLocaleString()
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const fileName = `inventory_backup_${new Date().toISOString().slice(0,10)}.json`;
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Function to save to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('inventory', JSON.stringify(inventory));
        localStorage.setItem('salesHistory', JSON.stringify(salesHistory));
        localStorage.setItem('currency', JSON.stringify(currentCurrency));
    } catch (error) {
        console.error('Save error:', error);
        alert('Error saving data to localStorage');
    }
}

// Function to save settings
function saveSettings() {
    try {
        localStorage.setItem('currency', JSON.stringify(currentCurrency));
    } catch (error) {
        console.error('Settings save error:', error);
        alert('Error saving settings');
    }
}

// Function to update inventory display
function updateInventoryDisplay(items = inventory) {
    const inventoryList = document.getElementById('inventoryList');
    if (!inventoryList) {
        console.error('Inventory list element not found');
        return;
    }

    console.log('Updating inventory display with items:', items); // Debug log

    inventoryList.innerHTML = '';

    if (items.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center;">No items in inventory</td>';
        inventoryList.appendChild(row);
        return;
    }

    items.forEach(item => {
        console.log('Creating row for item:', item); // Debug log
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name || 'N/A'}</td>
            <td>${item.quantity || 0}</td>
            <td>${currentCurrency.symbol}${(item.price || 0).toFixed(2)}</td>
            <td>${item.description || ''}</td>
            <td>
                <button onclick="sellItem(${item.id})" class="sell-btn">Sell</button>
                <button onclick="deleteItem(${item.id})" class="delete-btn">Delete</button>
            </td>
        `;
        inventoryList.appendChild(row);
    });

    // Save to localStorage after update
    saveToLocalStorage();
}

// Function to update sales history display
function updateSalesHistory() {
    const salesList = document.getElementById('salesHistory');
    if (!salesList) {
        console.error('Sales history element not found');
        return;
    }

    console.log('Updating sales history:', salesHistory); // Debug log

    salesList.innerHTML = '';

    if (salesHistory.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" style="text-align: center;">No sales recorded</td>';
        salesList.appendChild(row);
        return;
    }

    // Sort sales by date (most recent first)
    const sortedSales = [...salesHistory].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    sortedSales.forEach(sale => {
        const row = document.createElement('tr');
        
        // Calculate price difference percentage
        const priceDiff = ((sale.salePrice - sale.originalPrice) / sale.originalPrice * 100).toFixed(1);
        const priceChange = priceDiff != 0 ? 
            `(${priceDiff > 0 ? '+' : ''}${priceDiff}%)` : '';

        row.innerHTML = `
            <td>${sale.date}</td>
            <td>${sale.itemName}</td>
            <td>${sale.quantity}</td>
            <td>${currentCurrency.symbol}${sale.originalPrice.toFixed(2)}</td>
            <td>${currentCurrency.symbol}${sale.salePrice.toFixed(2)} ${priceChange}</td>
            <td>${currentCurrency.symbol}${sale.total.toFixed(2)}</td>
        `;
        salesList.appendChild(row);
    });

    // Update total sales if element exists
    const totalElement = document.getElementById('totalSales');
    if (totalElement) {
        const totalSales = salesHistory.reduce((sum, sale) => sum + sale.total, 0);
        totalElement.textContent = `${currentCurrency.symbol}${totalSales.toFixed(2)}`;
    }
}

// Main event listener
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded'); // Debug log

    // Load saved data
    const savedCurrency = localStorage.getItem('currency');
    const savedInventory = localStorage.getItem('inventory');
    const savedSales = localStorage.getItem('salesHistory');

    if (savedCurrency) {
        currentCurrency = JSON.parse(savedCurrency);
        const currencySelect = document.getElementById('currencySelect');
        if (currencySelect) {
            currencySelect.value = currentCurrency.code;
        }
    }

    if (savedInventory) {
        inventory = JSON.parse(savedInventory);
    }

    if (savedSales) {
        salesHistory = JSON.parse(savedSales);
    }

    // Initialize form submission
    const form = document.getElementById('inventoryForm');
    console.log('Form element:', form); // Debug log
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submitted'); // Debug log

            const newItem = {
                id: Date.now(),
                name: document.getElementById('itemName').value,
                quantity: parseInt(document.getElementById('quantity').value) || 0,
                price: parseFloat(document.getElementById('price').value) || 0,
                description: document.getElementById('description').value || ''
            };

            console.log('Adding new item:', newItem); // Debug log
            inventory.push(newItem);
            
            // Update display and save
            updateInventoryDisplay();
            saveToLocalStorage();
            
            // Reset form
            this.reset();
            
            // Show confirmation
            alert('Item added successfully!');
        });
    } else {
        console.error('Form element not found');
    }

    // Initialize export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            console.log('Export clicked'); // Debug log
            exportInventoryData();
        });
    }

    // Initialize import button and file input
    const importBtn = document.getElementById('importBtn');
    const fileInput = document.getElementById('fileInput');
    
    if (importBtn && fileInput) {
        importBtn.addEventListener('click', function() {
            fileInput.click();
        });

        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    console.log('Imported data:', importedData); // Debug log

                    if (importedData.currency && importedData.inventory) {
                        currentCurrency = importedData.currency;
                        inventory = importedData.inventory;
                        salesHistory = importedData.salesHistory || [];
                        
                        const currencySelect = document.getElementById('currencySelect');
                        if (currencySelect) {
                            currencySelect.value = currentCurrency.code;
                        }
                    } else {
                        inventory = JSON.parse(e.target.result);
                    }

                    saveToLocalStorage();
                    saveSettings();
                    updateInventoryDisplay();
                    updateSalesHistory();
                    alert('Import successful!');
                } catch (error) {
                    console.error('Import error:', error);
                    alert('Error importing file. Please make sure it\'s a valid JSON file.');
                }
            };
            reader.readAsText(file);
        });
    }

    // Initialize currency select
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
        currencySelect.addEventListener('change', function(e) {
            currentCurrency.code = e.target.value;
            currentCurrency.symbol = currencySymbols[e.target.value];
            saveSettings();
            updateInventoryDisplay();
            updateSalesHistory();
        });
    }

    // Initial display update
    updateInventoryDisplay();
    updateSalesHistory();
});

function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        inventory = inventory.filter(item => item.id !== id);
        saveToLocalStorage();
        updateInventoryDisplay();
    }
};

window.sellItem = function(id) {
    const item = inventory.find(item => item.id === id);
    if (!item) return;

    const sellQuantity = prompt(`How many ${item.name} would you like to sell? (Available: ${item.quantity})`);
    const quantity = parseInt(sellQuantity);

    if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid quantity.');
        return;
    }

    if (quantity > item.quantity) {
        alert('Not enough items in stock!');
        return;
    }

    const suggestedPrice = item.price;
    const customPrice = prompt(
        `Enter sale price per unit\nRegular price: ${currentCurrency.symbol}${suggestedPrice.toFixed(2)}`,
        suggestedPrice
    );
    const salePrice = parseFloat(customPrice);

    if (isNaN(salePrice) || salePrice < 0) {
        alert('Please enter a valid price.');
        return;
    }

    item.quantity -= quantity;

    const sale = {
        id: Date.now(),
        itemId: item.id,
        itemName: item.name,
        quantity: quantity,
        originalPrice: item.price,
        salePrice: salePrice,
        total: quantity * salePrice,
        date: new Date().toLocaleString()
    };
    
    salesHistory.push(sale);

    if (item.quantity === 0) {
        if (confirm('Item is now out of stock. Would you like to remove it from inventory?')) {
            inventory = inventory.filter(i => i.id !== id);
        }
    }

    const discount = sale.originalPrice > sale.salePrice ? 
        `(${((1 - sale.salePrice / sale.originalPrice) * 100).toFixed(1)}% discount)` : 
        sale.salePrice > sale.originalPrice ? 
        `(${((sale.salePrice / sale.originalPrice - 1) * 100).toFixed(1)}% markup)` : '';

    alert(
        `Sale completed!\n` +
        `Quantity: ${quantity}\n` +
        `Price per unit: ${currentCurrency.symbol}${salePrice.toFixed(2)} ${discount}\n` +
        `Total: ${currentCurrency.symbol}${sale.total.toFixed(2)}`
    );

    saveToLocalStorage();
    updateInventoryDisplay();
    updateSalesHistory();
};
