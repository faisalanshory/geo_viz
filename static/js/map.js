// Definisi palet warna
const colorPalette = {
    fills: [
        '#FF3366', // Merah muda
        '#4CAF50', // Hijau
        '#2196F3', // Biru
        '#FFC107', // Kuning
        '#9C27B0', // Ungu
        '#FF5722'  // Oranye
    ],
    outlines: [
        '#FFFFFF', // Putih
        '#E0E0E0', // Abu-abu terang
        '#000000', // Hitam
        '#333333'  // Abu-abu gelap
    ]
};

// Fungsi untuk mengatur style GeoJSON
function style(feature, layerStyle) {
    return {
        fillColor: layerStyle.fillColor,
        weight: 2,
        opacity: layerStyle.opacity,
        color: layerStyle.outlineColor,
        fillOpacity: layerStyle.fillOpacity
    };
}

// Fungsi untuk menangani interaksi hover
function highlightFeature(e, layerId) {
    const layer = e.target;
    layer.setStyle({
        fillOpacity: 0.9,
        weight: 3
    });
    updateDataTable(layer.feature.properties);
}

function resetHighlight(e, layerId) {
    const layer = layers.get(layerId);
    if (layer) {
        layer.layer.resetStyle(e.target);
    }
}

// Inisialisasi variabel global
let map;
const layers = new Map();
let activeLayerId = null;
let dataTable;

// Tunggu sampai DOM sepenuhnya dimuat
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Pastikan semua elemen yang dibutuhkan ada
    const layersList = document.getElementById('layers-list');
    const mapElement = document.getElementById('map');
    const uploadForm = document.getElementById('upload-form');
    const dataTableElement = document.getElementById('data-table');

    if (!layersList) console.error('layers-list not found');
    if (!mapElement) console.error('map not found');
    if (!uploadForm) console.error('upload-form not found');
    if (!dataTableElement) console.error('data-table not found');

    if (!layersList || !mapElement || !uploadForm || !dataTableElement) {
        console.error('Required elements not found');
        return;
    }

    // Inisialisasi peta
    map = L.map('map').setView([-2.5, 118], 5);

    // Tambahkan CartoDB Dark Matter basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Inisialisasi DataTable
    dataTable = $(dataTableElement).DataTable({
        scrollY: '50vh',
        scrollCollapse: true,
        paging: false,
        searching: false,
        info: false
    });

    // Setup file upload handler
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        const fileInput = document.getElementById('geojson-file');
        const file = fileInput.files[0];
        
        if (file) {
            console.log('Reading file:', file.name);
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    const layerId = addLayer(data, file.name.replace('.geojson', ''));
                    if (layerId) {
                        console.log('Layer added successfully from file');
                        fileInput.value = '';
                    }
                } catch (error) {
                    console.error('Error parsing file:', error);
                    alert('Error loading GeoJSON file: ' + error.message);
                }
            };

            reader.onerror = function(e) {
                console.error('Error reading file:', e);
                alert('Error reading file');
            };

            reader.readAsText(file);
        } else {
            console.warn('No file selected');
        }
    });

    // Load initial data
    console.log('Loading initial data...');
    fetch('/data')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Initial data loaded');
            addLayer(data, 'Initial Layer');
        })
        .catch(error => {
            console.error('Error loading initial data:', error);
            alert('Error loading initial data: ' + error.message);
        });

    // Handle window resize
    window.addEventListener('resize', () => {
        map.invalidateSize();
    });
});

// Fungsi untuk update data table
function updateDataTable(properties) {
    dataTable.clear();
    Object.entries(properties).forEach(([key, value]) => {
        dataTable.row.add([key, value]);
    });
    dataTable.draw();
}

// Fungsi untuk menggenerate ID unik
function generateLayerId() {
    return 'layer_' + Date.now();
}

// Tambahkan fungsi untuk membuat legenda
function createLegend(properties, colorScale) {
    const div = document.createElement('div');
    div.className = 'legend-control';
    
    const title = document.createElement('div');
    title.className = 'legend-title';
    title.textContent = 'Legend';
    div.appendChild(title);

    const items = document.createElement('div');
    items.className = 'legend-items';
    
    colorScale.forEach(({value, color}) => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <span class="legend-color" style="background-color: ${color}"></span>
            <span class="legend-label">${value}</span>
        `;
        items.appendChild(item);
    });
    
    div.appendChild(items);
    return div;
}

// Update createLayerItem function
function createLayerItem(id, name) {
    try {
        console.log('Creating layer item:', id, name);
        const div = document.createElement('div');
        div.className = 'layer-item';
        div.setAttribute('data-layer-id', id);

        // Split the HTML to separate header and controls
        div.innerHTML = `
            <div class="layer-item-header">
                <span class="layer-name">${name}</span>
                <div class="layer-controls">
                    <button class="layer-control-btn visibility-toggle active" title="Toggle Visibility">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="layer-control-btn zoom-to-layer" title="Zoom to Layer">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="layer-control-btn remove-layer" title="Remove Layer">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="layer-style-controls">
                <div class="style-section">
                    <!-- Basic Style Controls -->
                    <div class="color-controls">
                        <div class="color-control">
                            <label>Fill</label>
                            <div class="color-picker-wrapper fill-color-picker"></div>
                        </div>
                        <div class="color-control">
                            <label>Outline</label>
                            <div class="color-picker-wrapper outline-color-picker"></div>
                        </div>
                    </div>
                    
                    <!-- Opacity Control -->
                    <div class="slider-control">
                        <label>Opacity</label>
                        <input type="range" class="opacity-slider" min="0" max="100" value="70">
                        <span class="opacity-value">70%</span>
                    </div>

                    <!-- Color By Property -->
                    <div class="color-by-section">
                        <label>Color By Property</label>
                        <select class="color-by-property">
                            <option value="">Solid Color</option>
                        </select>
                    </div>

                    <!-- Tooltip Fields -->
                    <div class="tooltip-section">
                        <label>Show in Tooltip</label>
                        <div class="tooltip-fields"></div>
                    </div>

                    <!-- Filter Section -->
                    <div class="filter-section">
                        <label>Filter Data</label>
                        <div class="filter-list"></div>
                        <button class="add-filter-btn">
                            <i class="fas fa-plus"></i> Add Filter
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add click handler for header to toggle controls
        const header = div.querySelector('.layer-item-header');
        header.addEventListener('click', (e) => {
            if (!e.target.closest('.layer-control-btn')) {
                div.classList.toggle('expanded');
            }
        });

        return div;
    } catch (error) {
        console.error('Error in createLayerItem:', error);
        throw error;
    }
}

// Update setupLayerControls function
function setupLayerControls(layerElement, layerId) {
    const layer = layers.get(layerId);
    if (!layer) return;

    // Setup basic controls (visibility, zoom, remove)
    setupBasicControls(layerElement, layerId);

    // Setup opacity control
    setupOpacityControl(layerElement, layerId);

    // Setup color by property
    setupColorByProperty(layerElement, layerId);

    // Setup tooltip fields
    setupTooltipFields(layerElement, layerId);

    // Setup filters
    setupFilters(layerElement, layerId);

    // Initialize color pickers
    initializeLayerColorPickers(layerElement, layerId);
}

// Add new control setup functions
function setupBasicControls(layerElement, layerId) {
    // Visibility toggle
    const visibilityBtn = layerElement.querySelector('.visibility-toggle');
    if (visibilityBtn) {
        visibilityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLayerVisibility(layerId);
        });
    }

    // Zoom to layer
    const zoomBtn = layerElement.querySelector('.zoom-to-layer');
    if (zoomBtn) {
        zoomBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            zoomToLayer(layerId);
        });
    }

    // Remove layer
    const removeBtn = layerElement.querySelector('.remove-layer');
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeLayer(layerId);
        });
    }

    // Layer selection
    layerElement.addEventListener('click', () => setActiveLayer(layerId));
}

function setupOpacityControl(layerElement, layerId) {
    const opacitySlider = layerElement.querySelector('.opacity-slider');
    const opacityValue = layerElement.querySelector('.opacity-value');
    const layer = layers.get(layerId);
    
    if (!opacitySlider || !opacityValue || !layer) return;

    // Make opacity value editable
    opacityValue.contentEditable = true;

    // Set initial value
    opacitySlider.value = layer.style.fillOpacity * 100;
    opacityValue.textContent = `${Math.round(layer.style.fillOpacity * 100)}%`;

    // Update on slider change
    opacitySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        updateOpacity(value);
    });

    // Update on manual input
    opacityValue.addEventListener('blur', () => {
        let value = parseInt(opacityValue.textContent);
        value = Math.min(100, Math.max(0, value || 0));
        updateOpacity(value);
    });

    opacityValue.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            opacityValue.blur();
        }
    });

    function updateOpacity(value) {
        opacitySlider.value = value;
        opacityValue.textContent = `${value}%`;
        layer.style.fillOpacity = value / 100;
        layer.layer.setStyle({
            fillOpacity: value / 100
        });
    }
}

function setupColorByProperty(layerElement, layerId) {
    const layer = layers.get(layerId);
    const select = layerElement.querySelector('.color-by-property');
    if (!select || !layer) return;

    // Get numeric properties from the layer
    const properties = getLayerProperties(layer);
    const numericProps = properties.filter(prop => {
        const value = layer.layer.getLayers()[0].feature.properties[prop];
        return typeof value === 'number';
    });

    // Add options to select
    numericProps.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop;
        option.textContent = prop;
        select.appendChild(option);
    });

    // Handle property selection
    select.addEventListener('change', (e) => {
        const property = e.target.value;
        if (property) {
            applyColorScale(layerId, property);
        } else {
            resetLayerStyle(layerId);
        }
    });
}

function setupFilters(layerElement, layerId) {
    const addFilterBtn = layerElement.querySelector('.add-filter-btn');
    const filterList = layerElement.querySelector('.filter-list');
    const layer = layers.get(layerId);
    
    if (!addFilterBtn || !filterList || !layer) {
        console.error('Filter elements not found');
        return;
    }

    // Get layer properties for filter options
    const properties = getLayerProperties(layer);
    
    // Clear existing filters
    filterList.innerHTML = '';
    
    // Add click handler for add filter button
    addFilterBtn.onclick = () => {
        const filterItem = document.createElement('div');
        filterItem.className = 'filter-item';
        filterItem.innerHTML = `
            <div class="filter-content">
                <select class="filter-property">
                    ${properties.map(prop => `<option value="${prop}">${prop}</option>`).join('')}
                </select>
                <select class="filter-operator">
                    <option value="=">=</option>
                    <option value="<"><</option>
                    <option value=">">></option>
                    <option value="contains">Contains</option>
                </select>
                <input type="text" class="filter-value" placeholder="Value">
                <button class="remove-filter-btn" title="Remove Filter">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add remove filter handler
        const removeBtn = filterItem.querySelector('.remove-filter-btn');
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            filterItem.remove();
            applyFilters(layerId);
        };

        // Add change handlers for filter inputs
        const inputs = filterItem.querySelectorAll('select, input');
        inputs.forEach(input => {
            input.onchange = () => applyFilters(layerId);
        });

        filterList.appendChild(filterItem);
    };
}

function setupTooltipFields(layerElement, layerId) {
    const layer = layers.get(layerId);
    const tooltipFields = layerElement.querySelector('.tooltip-fields');
    
    if (!tooltipFields || !layer) {
        console.error('Tooltip elements not found');
        return;
    }

    // Get properties from layer
    const properties = getLayerProperties(layer);
    
    // Clear existing fields
    tooltipFields.innerHTML = '';
    
    // Add checkbox for each property
    properties.forEach(prop => {
        const field = document.createElement('div');
        field.className = 'tooltip-field';
        field.innerHTML = `
            <label class="tooltip-checkbox">
                <input type="checkbox" value="${prop}">
                <span>${prop}</span>
            </label>
        `;

        const checkbox = field.querySelector('input');
        checkbox.onchange = () => {
            const selectedFields = Array.from(tooltipFields.querySelectorAll('input:checked'))
                .map(input => input.value);
            updateTooltips(layerId, selectedFields);
        };

        tooltipFields.appendChild(field);
    });
}

// Update initializeLayerColorPickers function
function initializeLayerColorPickers(layerElement, layerId) {
    const layer = layers.get(layerId);
    if (!layer) return;

    const fillPickerEl = layerElement.querySelector('.fill-color-picker');
    const outlinePickerEl = layerElement.querySelector('.outline-color-picker');

    if (!fillPickerEl || !outlinePickerEl) {
        console.error('Color picker elements not found');
        return;
    }

    const pickerConfig = {
        theme: 'classic',
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: {
                input: true,
                save: true
            }
        }
    };

    // Fill color picker
    const fillPicker = new Pickr({
        ...pickerConfig,
        el: fillPickerEl,
        default: layer.style.fillColor,
        swatches: colorPalette.fills
    });

    // Outline color picker
    const outlinePicker = new Pickr({
        ...pickerConfig,
        el: outlinePickerEl,
        default: layer.style.outlineColor,
        swatches: colorPalette.outlines
    });

    // Add event listeners
    fillPicker.on('save', (color) => {
        if (color) {
            layer.style.fillColor = color.toHEXA().toString();
            updateLayerStyle(layerId);
        }
        fillPicker.hide();
    });

    outlinePicker.on('save', (color) => {
        if (color) {
            layer.style.outlineColor = color.toHEXA().toString();
            updateLayerStyle(layerId);
        }
        outlinePicker.hide();
    });
}

// Update addLayer function
function addLayer(geojsonData, name) {
    try {
        console.log('Starting addLayer...');
        
        const layersList = document.getElementById('layers-list');
        if (!layersList) {
            throw new Error('Layers list element not found');
        }

        const layerId = generateLayerId();
        const layerStyle = {
            fillColor: colorPalette.fills[layers.size % colorPalette.fills.length],
            outlineColor: colorPalette.outlines[0],
            opacity: 1,
            fillOpacity: 0.7
        };

        // Create layer item first
        const layerItem = createLayerItem(layerId, name || `Layer ${layers.size + 1}`);
        if (!layerItem) {
            throw new Error('Failed to create layer item');
        }

        // Create GeoJSON layer
        const geojsonLayer = L.geoJSON(geojsonData, {
            style: feature => style(feature, layerStyle),
            onEachFeature: (feature, layer) => {
                layer.on({
                    mouseover: e => highlightFeature(e, layerId),
                    mouseout: e => resetHighlight(e, layerId),
                    click: e => {
                        updateDataTable(feature.properties);
                        setActiveLayer(layerId);
                    }
                });
            }
        }).addTo(map);

        // Save layer data
        layers.set(layerId, {
            layer: geojsonLayer,
            style: layerStyle,
            name: name || `Layer ${layers.size + 1}`
        });

        // Add layer item to list
        layersList.appendChild(layerItem);

        // Setup controls after DOM is updated
        setTimeout(() => {
            setupLayerControls(layerItem, layerId);
        }, 0);

        // Set as active layer
        setActiveLayer(layerId);
        
        // Fit bounds
        map.fitBounds(geojsonLayer.getBounds());

        return layerId;

    } catch (error) {
        console.error('Error in addLayer:', error);
        alert('Error adding layer: ' + error.message);
        return null;
    }
}

// Fungsi untuk mengatur layer aktif
function setActiveLayer(layerId) {
    // Remove active class from all layers
    document.querySelectorAll('.layer-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected layer
    const layerItem = document.querySelector(`.layer-item[data-layer-id="${layerId}"]`);
    if (layerItem) {
        layerItem.classList.add('active');
    }
    
    activeLayerId = layerId;
    const layer = layers.get(layerId);
}

// Fungsi untuk toggle visibility layer
function toggleLayerVisibility(layerId) {
    const layerItem = document.querySelector(`.layer-item[data-layer-id="${layerId}"]`);
    const toggle = layerItem.querySelector('.visibility-toggle');
    const layer = layers.get(layerId);
    
    if (layer) {
        if (map.hasLayer(layer.layer)) {
            map.removeLayer(layer.layer);
            toggle.classList.remove('active');
        } else {
            map.addLayer(layer.layer);
            toggle.classList.add('active');
        }
    }
}

// Add zoom to layer function
function zoomToLayer(layerId) {
    const layer = layers.get(layerId);
    if (layer && layer.layer.getBounds) {
        map.fitBounds(layer.layer.getBounds(), {
            padding: [50, 50]
        });
    }
}

// Update removeLayer function
function removeLayer(layerId) {
    if (layers.has(layerId)) {
        const layer = layers.get(layerId);
        map.removeLayer(layer.layer);
        document.querySelector(`.layer-item[data-layer-id="${layerId}"]`).remove();
        layers.delete(layerId);
        
        if (layers.size === 0) {
            activeLayerId = null;
            dataTable.clear().draw();
        } else if (activeLayerId === layerId) {
            setActiveLayer(layers.keys().next().value);
        }
    }
}

// Add color scale functions
function updateColorScale(layerId, property) {
    const layer = layers.get(layerId);
    if (!layer) return;

    // Get unique values and their range
    const values = new Set();
    layer.layer.eachLayer(l => {
        if (l.feature && l.feature.properties) {
            values.add(l.feature.properties[property]);
        }
    });

    // Create color scale based on data type and range
    const colorScale = createColorScale(Array.from(values), 
        layerElement.querySelector('.color-scheme').value);

    // Update layer style
    layer.layer.setStyle(feature => ({
        fillColor: colorScale(feature.properties[property]),
        color: layer.style.outlineColor,
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7
    }));

    // Update legend
    updateLegend(layerId, property, colorScale);
}

// Add applyFilters function
function applyFilters(layerId) {
    const layer = layers.get(layerId);
    if (!layer) return;

    const filterItems = document.querySelectorAll(`.layer-item[data-layer-id="${layerId}"] .filter-item`);
    const filters = Array.from(filterItems).map(item => ({
        property: item.querySelector('.filter-property').value,
        operator: item.querySelector('.filter-operator').value,
        value: item.querySelector('.filter-value').value
    }));

    layer.layer.eachLayer(featureLayer => {
        let show = true;
        const properties = featureLayer.feature.properties;

        filters.forEach(filter => {
            const value = properties[filter.property];
            switch (filter.operator) {
                case '=':
                    show = show && (value == filter.value);
                    break;
                case '<':
                    show = show && (Number(value) < Number(filter.value));
                    break;
                case '>':
                    show = show && (Number(value) > Number(filter.value));
                    break;
                case 'contains':
                    show = show && value.toString().toLowerCase().includes(filter.value.toLowerCase());
                    break;
            }
        });

        featureLayer.setStyle({
            opacity: show ? 1 : 0.1,
            fillOpacity: show ? layer.style.fillOpacity : 0.1
        });
    });
}

// Add updateTooltips function
function updateTooltips(layerId, fields) {
    const layer = layers.get(layerId);
    if (!layer) return;

    layer.layer.eachLayer(featureLayer => {
        if (fields.length > 0) {
            const tooltipContent = fields.map(field => {
                const value = featureLayer.feature.properties[field];
                return `<strong>${field}:</strong> ${value}`;
            }).join('<br>');
            
            featureLayer.bindTooltip(tooltipContent, {
                permanent: false,
                direction: 'auto'
            });
        } else {
            featureLayer.unbindTooltip();
        }
    });
}

// Update updateLayerStyle function
function updateLayerStyle(layerId) {
    const layer = layers.get(layerId);
    if (!layer) return;

    layer.layer.setStyle(feature => ({
        fillColor: layer.style.fillColor,
        color: layer.style.outlineColor,
        weight: 2,
        opacity: 1,
        fillOpacity: layer.style.fillOpacity
    }));
}

// Update getLayerProperties function
function getLayerProperties(layer) {
    const properties = new Set();
    if (layer && layer.layer) {
        const firstLayer = layer.layer.getLayers()[0];
        if (firstLayer && firstLayer.feature && firstLayer.feature.properties) {
            Object.keys(firstLayer.feature.properties).forEach(prop => {
                properties.add(prop);
            });
        }
    }
    return Array.from(properties);
} 