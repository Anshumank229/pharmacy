import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import {
  ShoppingCart,
  Heart,
  Share2,
  CheckCircle,
  AlertTriangle,
  Info,
  Shield,
  Star,
  Clock,
  Package,
  Droplets,
  Pill,
  Scale,
  Thermometer,
  Leaf,
  Wheat,
  AlertCircle,
  ArrowLeft,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import WishlistButton from '../components/WishlistButton';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('uses');
  const [similarMedicines, setSimilarMedicines] = useState([]);

  useEffect(() => {
    fetchMedicineDetails();
  }, [id]);

  const fetchMedicineDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/medicines/${id}`);
      setMedicine(res.data);
      
      // Fetch similar medicines from same category
      if (res.data.category) {
        const similarRes = await api.get('/medicines', {
          params: { 
            category: res.data.category,
            limit: 4,
            exclude: id
          }
        });
        setSimilarMedicines(similarRes.data.medicines || []);
      }
    } catch (error) {
      console.error('Failed to fetch medicine:', error);
      toast.error('Failed to load medicine details');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    try {
      await api.post('/cart/add', { medicineId: id, quantity });
      toast.success('Added to cart!');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Please log in to add items to cart');
      } else {
        toast.error('Failed to add to cart');
      }
    }
  };

  const calculateDiscount = () => {
    if (!medicine?.mrp || !medicine?.price) return 0;
    return Math.round(((medicine.mrp - medicine.price) / medicine.mrp) * 100);
  };

  const InfoSection = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );

  const PillTag = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
      <Icon className="w-4 h-4 text-blue-600" />
      <span className="text-sm">
        <span className="text-gray-500">{label}:</span>{' '}
        <span className="font-medium text-gray-900">{value}</span>
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Medicine Not Found</h2>
          <button
            onClick={() => navigate('/shop')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse Shop
          </button>
        </div>
      </div>
    );
  }

  const discount = calculateDiscount();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <ol className="flex items-center gap-2 flex-wrap">
            <li><button onClick={() => navigate('/')} className="hover:text-blue-600">Home</button></li>
            <li>/</li>
            <li><button onClick={() => navigate('/shop')} className="hover:text-blue-600">Shop</button></li>
            <li>/</li>
            <li><button onClick={() => navigate(`/shop?category=${medicine.category}`)} className="hover:text-blue-600">{medicine.category}</button></li>
            <li>/</li>
            <li className="text-gray-900 font-medium truncate">{medicine.name}</li>
          </ol>
        </nav>

        {/* Main Product Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Product Image */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-gray-100 rounded-2xl p-8 flex items-center justify-center h-96">
                <img
                  src={medicine.imageUrl || 'https://via.placeholder.com/400'}
                  alt={medicine.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              
              {/* Prescription Badge - Added */}
              {medicine.requiresPrescription && (
                <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Rx Required
                </div>
              )}

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <WishlistButton medicine={medicine} />
                <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Discount Badge */}
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {discount}% OFF
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title & Rating */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{medicine.name}</h1>
                  {medicine.requiresPrescription && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                      <FileText className="w-4 h-4" />
                      Prescription Required
                    </span>
                  )}
                </div>
                <p className="text-lg text-gray-600 mb-2">{medicine.genericName}</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < (medicine.rating || 4) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">
                      ({medicine.reviewCount || 124} reviews)
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">|</span>
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </span>
                </div>
              </div>

              {/* Quick Info Tags */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <PillTag icon={Package} label="Form" value={medicine.packagingForm || 'Tablet'} />
                <PillTag icon={Scale} label="Strength" value={medicine.strength || '500mg'} />
                <PillTag icon={Droplets} label="Pack Size" value={medicine.packageSize || '15 tablets'} />
                <PillTag icon={Pill} label="Type" value={medicine.dosageForm || 'Tablet'} />
                <PillTag icon={Thermometer} label="Storage" value={medicine.storageConditions || 'Room temp'} />
                <PillTag icon={Clock} label="Shelf Life" value={medicine.shelfLife || '24 months'} />
              </div>

              {/* Price Section */}
              <div className="bg-blue-50 rounded-xl p-6">
                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                  <span className="text-3xl font-bold text-blue-600">₹{medicine.price}</span>
                  {medicine.mrp > medicine.price && (
                    <>
                      <span className="text-lg text-gray-400 line-through">₹{medicine.mrp}</span>
                      <span className="text-sm text-green-600 font-semibold bg-green-100 px-2 py-1 rounded">
                        Save ₹{medicine.mrp - medicine.price}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">Inclusive of all taxes</p>
                
                {/* Prescription Warning - Added */}
                {medicine.requiresPrescription && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Prescription Required</p>
                        <p className="text-xs text-yellow-700">
                          This medicine requires a valid prescription. You'll need to upload it at checkout.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantity & Add to Cart */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 border-x border-gray-300 font-medium min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={addToCart}
                    disabled={medicine.stock === 0}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {medicine.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>

              {/* Key Highlights */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Key Highlights</h3>
                <ul className="space-y-2">
                  {medicine.benefits?.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  )) || (
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Provides fast relief from acidity and gas</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Dietary Info */}
              <div className="flex flex-wrap gap-3">
                {medicine.vegetarian && (
                  <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                    <Leaf className="w-4 h-4" />
                    <span>Vegetarian</span>
                  </div>
                )}
                {medicine.sugarFree && (
                  <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    <span>🍬</span>
                    <span>Sugar Free</span>
                  </div>
                )}
                {medicine.glutenFree && (
                  <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                    <Wheat className="w-4 h-4" />
                    <span>Gluten Free</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {[
                { id: 'uses', label: 'Uses' },
                { id: 'ingredients', label: 'Ingredients' },
                { id: 'sideEffects', label: 'Side Effects' },
                { id: 'warnings', label: 'Warnings' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Uses Tab */}
            {activeTab === 'uses' && (
              <div className="space-y-6">
                <InfoSection title="What is this medicine used for?">
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {medicine.uses?.map((use, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span>{use}</span>
                      </li>
                    )) || (
                      <>
                        <li className="flex items-start gap-2 text-gray-700">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <span>Acidity and heartburn</span>
                        </li>
                        <li className="flex items-start gap-2 text-gray-700">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <span>Gas and bloating</span>
                        </li>
                        <li className="flex items-start gap-2 text-gray-700">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <span>Indigestion</span>
                        </li>
                      </>
                    )}
                  </ul>
                </InfoSection>

                <InfoSection title="How to use?">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-gray-700 mb-3">
                      {medicine.howToUse || 'Take as directed by your physician. Usually 1-2 tablets after meals or when symptoms appear.'}
                    </p>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Do not exceed the recommended dosage. Consult your doctor if symptoms persist.</span>
                    </div>
                  </div>
                </InfoSection>
              </div>
            )}

            {/* Ingredients Tab */}
            {activeTab === 'ingredients' && (
              <div className="space-y-6">
                <InfoSection title="Active Ingredients">
                  <div className="space-y-3">
                    {medicine.activeIngredients?.map((ing, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Pill className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">{ing.name} {ing.strength}</h4>
                          <p className="text-sm text-gray-600">{ing.role}</p>
                        </div>
                      </div>
                    )) || (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Pill className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">Calcium Carbonate 500mg + Simethicone 25mg</h4>
                          <p className="text-sm text-gray-600">Neutralizes excess acid and relieves gas</p>
                        </div>
                      </div>
                    )}
                  </div>
                </InfoSection>

                <InfoSection title="Other Ingredients">
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {medicine.inactiveIngredients?.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    )) || (
                      <>
                        <li>Microcrystalline Cellulose</li>
                        <li>Maize Starch</li>
                        <li>Povidone</li>
                        <li>Magnesium Stearate</li>
                        <li>Mint Flavour</li>
                      </>
                    )}
                  </ul>
                </InfoSection>
              </div>
            )}

            {/* Side Effects Tab */}
            {activeTab === 'sideEffects' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">Common side effects</h4>
                    <p className="text-sm text-yellow-700">Most side effects are mild and temporary.</p>
                  </div>
                </div>

                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {medicine.sideEffects?.map((effect, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2" />
                      <span>{effect}</span>
                    </li>
                  )) || (
                    <>
                      <li className="flex items-start gap-2 text-gray-700">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2" />
                        <span>Constipation</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2" />
                        <span>Nausea</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2" />
                        <span>Diarrhea</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            )}

            {/* Warnings Tab */}
            {activeTab === 'warnings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Pregnancy
                    </h4>
                    <p className="text-sm text-red-700">
                      {medicine.pregnancyWarning || 'Consult your doctor before using this medicine during pregnancy'}
                    </p>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Alcohol
                    </h4>
                    <p className="text-sm text-orange-700">
                      {medicine.alcoholWarning || 'Avoid alcohol while taking this medicine'}
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Kidney Issues
                    </h4>
                    <p className="text-sm text-yellow-700">
                      {medicine.kidneyWarning || 'Use with caution if you have kidney problems'}
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Liver Issues
                    </h4>
                    <p className="text-sm text-yellow-700">
                      {medicine.liverWarning || 'Consult doctor if you have liver disease'}
                    </p>
                  </div>
                </div>

                {medicine.warnings?.map((warning, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{warning}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Manufacturer Information */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Manufacturer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 mb-1">Manufactured By</p>
              <p className="font-semibold text-gray-900">{medicine.manufacturer || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Marketed By</p>
              <p className="font-semibold text-gray-900">{medicine.manufacturer || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">License Number</p>
              <p className="font-semibold text-gray-900">{medicine.licenseNumber || 'M/123/456'}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Schedule Type</p>
              <p className="font-semibold text-gray-900">{medicine.scheduleType || 'H'}</p>
            </div>
          </div>
        </div>

        {/* Prescription Info - Added */}
        {medicine.requiresPrescription && (
          <div className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden mb-8 p-6 border border-yellow-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-yellow-800 mb-2">Prescription Information</h3>
                <p className="text-yellow-700 mb-3">
                  This medicine requires a valid prescription from a registered medical practitioner.
                </p>
                <ul className="space-y-1 text-sm text-yellow-700 list-disc list-inside">
                  <li>Upload your prescription at checkout</li>
                  <li>Our pharmacists will verify it within 24-48 hours</li>
                  <li>You'll be notified via email once approved</li>
                  <li>Order will be processed only after approval</li>
                </ul>
                <button
                  onClick={() => navigate('/upload-prescription')}
                  className="mt-4 inline-flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Upload Prescription
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Similar Medicines - Fully Clickable Cards */}
        {similarMedicines.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Medicines</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarMedicines.map((med) => (
                <div
                  key={med._id}
                  onClick={() => navigate(`/product/${med._id}`)}
                  className="group border border-gray-200 rounded-lg p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white"
                >
                  <div className="w-full h-32 bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    <img
                      src={med.imageUrl || 'https://via.placeholder.com/150'}
                      alt={med.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150';
                      }}
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {med.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-1">{med.manufacturer || 'Generic'}</p>
                  {med.requiresPrescription && (
                    <span className="inline-flex items-center gap-1 mb-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                      <FileText className="w-3 h-3" />
                      Rx
                    </span>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold text-blue-600">₹{med.price}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.success(`Added ${med.name} to cart!`);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Quick Add"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${med._id}`);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;