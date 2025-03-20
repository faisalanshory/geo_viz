export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to Geo-Viz</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Interactive Geographic Visualization Platform
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature Cards */}
          <div className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Map Visualization</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Explore geographic data through interactive maps
            </p>
          </div>

          <div className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Data Analysis</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Analyze geographic patterns and trends
            </p>
          </div>

          <div className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Custom Visualizations</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Create and share custom geographic visualizations
            </p>
          </div>
        </section>
      </div>
    </main>
  )
} 