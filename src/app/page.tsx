'use client'
import dynamic from 'next/dynamic'
import Script from 'next/script'

// Import Map dengan dynamic untuk menghindari SSR issues
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div>Loading map...</div>
})

export default function Home() {
  return (
    <>
      <div id="control-panel">
        <div className="panel-section">
          <h3>Layers</h3>
          <div id="layers-list"></div>
          <form id="upload-form">
            <input type="file" id="geojson-file" accept=".geojson,.json" />
            <button type="submit">Add Layer</button>
          </form>
        </div>

        <div className="panel-section">
          <h3>Feature Properties</h3>
          <div id="table-container">
            <table id="data-table" className="display">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div id="map">
        <Map />
      </div>

      {/* Scripts */}
      <Script src="https://code.jquery.com/jquery-3.6.0.min.js" />
      <Script src="https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js" />
      <Script src="https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/pickr.min.js" />
    </>
  )
} 