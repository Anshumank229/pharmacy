// Using India Post API (free, no key required)
export const fetchPincodeDetails = async (pincode) => {
  try {
    // Validate pincode format (6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      return { success: false, error: 'Invalid pincode format' };
    }

    // Option 1: India Post API (free, no key)
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await response.json();

    if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
      const postOffices = data[0].PostOffice;
      
      // Get unique cities and states
      const cities = [...new Set(postOffices.map(po => po.District))];
      const states = [...new Set(postOffices.map(po => po.State))];
      
      return {
        success: true,
        cities,
        states,
        postOffices: postOffices.map(po => po.Name)
      };
    } else {
      return { success: false, error: 'Invalid pincode' };
    }

    // Option 2: Zippopotam.us API (alternative if India Post fails)
    /*
    const response = await fetch(`https://api.zippopotam.us/IN/${pincode}`);
    if (!response.ok) throw new Error('Invalid pincode');
    
    const data = await response.json();
    const places = data.places;
    
    return {
      success: true,
      cities: [...new Set(places.map(p => p['place name']))],
      states: [...new Set(places.map(p => p['state']))],
    };
    */

  } catch (error) {
    console.error('Pincode fetch error:', error);
    return { success: false, error: 'Failed to fetch pincode details' };
  }
};