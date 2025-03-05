export const metadata = {
  title: 'About Us | Lawn Genius',
  description: 'Learn about Lawn Genius and our commitment to exceptional lawn care services.',
}

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About Lawn Genius</h1>
        
        <div className="prose prose-lg">
          <p className="text-gray-600 mb-6">
            At Lawn Genius, we're passionate about creating and maintaining beautiful outdoor spaces. 
            With years of experience in lawn care and landscaping, our team of professionals brings 
            expertise and dedication to every project.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">Our Mission</h2>
          <p className="text-gray-600 mb-6">
            Our mission is to provide exceptional lawn care services that enhance the beauty and value 
            of your property while promoting environmental sustainability. We believe in using the best 
            practices and products to ensure your lawn remains healthy and vibrant throughout the year.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">Why Choose Us</h2>
          <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
            <li>Licensed and insured professionals</li>
            <li>Customized lawn care programs</li>
            <li>Environmentally responsible practices</li>
            <li>State-of-the-art equipment</li>
            <li>Exceptional customer service</li>
            <li>Satisfaction guaranteed</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-primary-700 mb-2">Quality</h3>
              <p className="text-gray-600">
                We never compromise on the quality of our work, using only the best materials and 
                techniques.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-primary-700 mb-2">Reliability</h3>
              <p className="text-gray-600">
                Count on us to be there when you need us, delivering consistent, professional service.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-primary-700 mb-2">Innovation</h3>
              <p className="text-gray-600">
                We stay current with the latest lawn care techniques and sustainable practices.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-primary-700 mb-2">Integrity</h3>
              <p className="text-gray-600">
                We conduct our business with honesty, transparency, and respect for our clients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}