// Unit tests untuk map.js
describe('Layer Management', () => {
    beforeEach(() => {
        // Setup DOM elements needed
        document.body.innerHTML = `
            <div id="layers-list"></div>
            <div id="map"></div>
            <table id="data-table"></table>
        `;
        
        // Reset layers
        layers.clear();
        activeLayerId = null;
    });

    test('should create layer item', () => {
        const id = 'test_layer_1';
        const name = 'Test Layer';
        const item = createLayerItem(id, name);
        
        expect(item.getAttribute('data-layer-id')).toBe(id);
        expect(item.querySelector('.layer-name').textContent).toBe(name);
        expect(item.querySelector('.visibility-toggle')).toBeTruthy();
        expect(item.querySelector('.zoom-to-layer')).toBeTruthy();
        expect(item.querySelector('.remove-layer')).toBeTruthy();
    });

    test('should add layer to map and list', () => {
        const testData = {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                properties: { name: 'Test' },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[0,0], [1,0], [1,1], [0,1], [0,0]]]
                }
            }]
        };

        addLayer(testData, 'Test Layer');
        
        const layersList = document.getElementById('layers-list');
        expect(layersList.children.length).toBe(1);
        expect(layers.size).toBe(1);
    });
}); 