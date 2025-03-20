import L from 'leaflet';
import $ from 'jquery';
import 'datatables.net';

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
function style(feature: any, layerStyle: any) {
    return {
        fillColor: layerStyle.fillColor,
        weight: 2,
        opacity: layerStyle.opacity,
        color: layerStyle.outlineColor,
        fillOpacity: layerStyle.fillOpacity
    };
}

export function initializeMap(map: L.Map) {
    const layers = new Map();
    let activeLayerId = null;
    let dataTable: any;

    // Tambahkan CartoDB Dark Matter basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Inisialisasi DataTable
    $(document).ready(() => {
        dataTable = $('#data-table').DataTable({
            scrollY: '50vh',
            scrollCollapse: true,
            paging: false,
            searching: false,
            info: false
        });
    });

    // Setup file upload handler
    document.getElementById('upload-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('geojson-file') as HTMLInputElement;
        const file = fileInput.files?.[0];
        
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    addLayer(data, file.name.replace('.geojson', ''));
                    fileInput.value = '';
                } catch (error) {
                    console.error('Error parsing file:', error);
                    alert('Error loading GeoJSON file');
                }
            };

            reader.readAsText(file);
        }
    });

    // Fungsi untuk menambah layer
    function addLayer(geojsonData: any, name: string) {
        const layerId = Math.random().toString(36).substr(2, 9);
        const layerStyle = {
            fillColor: colorPalette.fills[layers.size % colorPalette.fills.length],
            outlineColor: colorPalette.outlines[0],
            opacity: 1,
            fillOpacity: 0.7
        };

        // Create GeoJSON layer
        const geojsonLayer = L.geoJSON(geojsonData, {
            style: feature => style(feature, layerStyle),
            onEachFeature: (feature, layer) => {
                layer.on({
                    mouseover: e => {
                        const layer = e.target;
                        layer.setStyle({
                            fillOpacity: 0.9,
                            weight: 3
                        });
                        if (feature.properties) {
                            updateDataTable(feature.properties);
                        }
                    },
                    mouseout: e => {
                        geojsonLayer.resetStyle(e.target);
                    },
                    click: e => {
                        if (feature.properties) {
                            updateDataTable(feature.properties);
                        }
                    }
                });
            }
        }).addTo(map);

        // Save layer data
        layers.set(layerId, {
            layer: geojsonLayer,
            style: layerStyle,
            name: name
        });

        // Add to layers list
        addLayerToList(layerId, name);

        // Fit bounds
        map.fitBounds(geojsonLayer.getBounds());
    }

    // Fungsi untuk update data table
    function updateDataTable(properties: any) {
        if (dataTable) {
            dataTable.clear();
            Object.entries(properties).forEach(([key, value]) => {
                dataTable.row.add([key, value]);
            });
            dataTable.draw();
        }
    }

    // Fungsi untuk menambah layer ke list
    function addLayerToList(layerId: string, name: string) {
        const layersList = document.getElementById('layers-list');
        if (!layersList) return;

        const layerItem = document.createElement('div');
        layerItem.className = 'layer-item';
        layerItem.innerHTML = `
            <div class="layer-item-header">
                <span class="layer-name">${name}</span>
                <div class="layer-controls">
                    <button class="layer-control-btn visibility-toggle active" title="Toggle visibility">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="layer-control-btn" title="Remove layer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        const visibilityBtn = layerItem.querySelector('.visibility-toggle');
        const removeBtn = layerItem.querySelector('.layer-control-btn:last-child');

        visibilityBtn?.addEventListener('click', () => {
            const layer = layers.get(layerId);
            if (layer) {
                if (map.hasLayer(layer.layer)) {
                    map.removeLayer(layer.layer);
                    visibilityBtn.classList.remove('active');
                } else {
                    map.addLayer(layer.layer);
                    visibilityBtn.classList.add('active');
                }
            }
        });

        removeBtn?.addEventListener('click', () => {
            const layer = layers.get(layerId);
            if (layer) {
                map.removeLayer(layer.layer);
                layers.delete(layerId);
                layerItem.remove();
            }
        });

        layersList.appendChild(layerItem);
    }
} 