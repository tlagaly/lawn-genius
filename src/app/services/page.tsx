export const metadata = {
  title: 'Our Services | Lawn Genius',
  description: 'Professional lawn care services including mowing, landscaping, fertilization, and maintenance.',
}

export default function ServicesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Our Services</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Lawn Maintenance</h2>
          <p className="text-gray-600">Regular mowing, edging, and trimming to keep your lawn looking its best.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Fertilization</h2>
          <p className="text-gray-600">Custom fertilization programs to promote healthy grass growth.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Weed Control</h2>
          <p className="text-gray-600">Targeted treatment to eliminate and prevent unwanted weeds.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Landscaping</h2>
          <p className="text-gray-600">Design and installation of beautiful, sustainable landscapes.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Aeration</h2>
          <p className="text-gray-600">Core aeration to improve soil health and grass root development.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Seasonal Cleanup</h2>
          <p className="text-gray-600">Spring and fall cleanup services to maintain your property year-round.</p>
        </div>
      </div>
    </div>
  )
}