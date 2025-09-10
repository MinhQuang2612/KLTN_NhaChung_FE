const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Province {
  provinceCode: string;
  provinceName: string;
}

export interface Ward {
  wardCode: string;
  wardName: string;
}

export interface Address {
  street?: string; // Optional theo API guide
  ward: string;
  city: string;
  specificAddress?: string; // Thay thế houseNumber
  showSpecificAddress?: boolean; // Thay thế showHouseNumber
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  additionalInfo?: string;
}

class AddressService {
  private baseURL = `${API_BASE_URL}/addresses`;

  async getProvinces(): Promise<Province[]> {
    try {
      const response = await fetch(`${this.baseURL}/provinces`);
      if (!response.ok) {
        throw new Error('Failed to fetch provinces');
      }
      const data = await response.json();
      
      // Remove duplicates based on provinceCode and provinceName
      const uniqueProvinces = data.reduce((acc: Province[], current: Province) => {
        const existsByCode = acc.find(province => province.provinceCode === current.provinceCode);
        const existsByName = acc.find(province => province.provinceName === current.provinceName);
        
        // Only add if neither code nor name exists
        if (!existsByCode && !existsByName) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      // Sort by provinceName
      return uniqueProvinces.sort((a: Province, b: Province) => a.provinceName.localeCompare(b.provinceName, 'vi'));
    } catch (error) {
      return [];
    }
  }

  async getWardsByProvince(provinceCode: string): Promise<Ward[]> {
    try {
      const response = await fetch(`${this.baseURL}/wards?provinceCode=${provinceCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch wards');
      }
      const data = await response.json();
      
      // Remove duplicates based on wardCode and wardName
      const uniqueWards = data.reduce((acc: Ward[], current: Ward) => {
        const existsByCode = acc.find(ward => ward.wardCode === current.wardCode);
        const existsByName = acc.find(ward => ward.wardName === current.wardName);
        
        // Only add if neither code nor name exists
        if (!existsByCode && !existsByName) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      // Sort by wardName
      return uniqueWards.sort((a: Ward, b: Ward) => a.wardName.localeCompare(b.wardName, 'vi'));
    } catch (error) {
      return [];
    }
  }

  // Helper function to format address for display
  formatAddressForDisplay(address: Address): string {
    const parts = [];
    
    // Street + Specific address (if available)
    if (address.street) {
      if (address.specificAddress && address.showSpecificAddress) {
        parts.push(`${address.specificAddress} ${address.street}`);
      } else {
        parts.push(address.street);
      }
    } else if (address.specificAddress && address.showSpecificAddress) {
      parts.push(address.specificAddress);
    }
    
    // Ward (no district anymore)
    if (address.ward) {
      parts.push(address.ward);
    }
    
    // City (shortened)
    if (address.city) {
      // Shorten common city names
      let cityName = address.city;
      if (cityName.includes('Thành phố Hồ Chí Minh')) {
        cityName = 'TP.HCM';
      } else if (cityName.includes('Thành phố Hà Nội')) {
        cityName = 'Hà Nội';
      } else if (cityName.includes('Thành phố')) {
        cityName = cityName.replace('Thành phố ', 'TP.');
      } else if (cityName.includes('Tỉnh')) {
        cityName = cityName.replace('Tỉnh ', '');
      }
      parts.push(cityName);
    }
    
    return parts.join(', ');
  }

  // Helper to format short address: ward + city only
  formatWardCity(address?: Partial<Address> | null): string {
    if (!address) return '';
    const wardName = address.ward || address.wardName || '';
    let cityName = address.city || address.provinceName || '';
    if (cityName.includes('Thành phố Hồ Chí Minh')) {
      cityName = 'TP.HCM';
    } else if (cityName.includes('Thành phố Hà Nội')) {
      cityName = 'Hà Nội';
    } else if (cityName.includes('Thành phố')) {
      cityName = cityName.replace('Thành phố ', 'TP.');
    } else if (cityName.includes('Tỉnh')) {
      cityName = cityName.replace('Tỉnh ', '');
    }
    return [wardName, cityName].filter(Boolean).join(', ');
  }

}

export const addressService = new AddressService();
