// Utility để map ward name -> district sử dụng legacy-district-mapping.json

import districtMappingData from '@/config/legacy-district-mapping.json';

type DistrictMapping = {
  version: string;
  generatedAt: string;
  source: string;
  mappings: {
    [cityCode: string]: {
      [districtKey: string]: {
        old_name: string;
        aliases: string[];
        province_code: string;
        current_wards: Array<{
          ward_code: string;
          ward_name: string;
        }>;
      };
    };
  };
};

const mapping = districtMappingData as DistrictMapping;

/**
 * Normalize ward name: loại bỏ "Phường", "Xã", "Quận", "TP.", "Thành phố" và lowercase
 */
function normalizeWardName(ward: string): string {
  if (!ward) return '';
  return ward
    .toLowerCase()
    .replace(/^(phường|xã|quận|tp\.|thành phố|huyện|thị xã)\s*/i, '')
    .trim();
}

/**
 * Tìm district từ ward name sử dụng mapping
 * @param ward - Tên ward (ví dụ: "Phường Hạnh Thông", "An Nhơn")
 * @param cityCode - Mã thành phố (ví dụ: "hcm", "hn"), mặc định là "hcm"
 * @returns Tên district (ví dụ: "quận gò vấp") hoặc null nếu không tìm thấy
 */
export function getDistrictFromWard(ward: string, cityCode: string = 'hcm'): string | null {
  if (!ward) return null;
  
  const normalizedWard = normalizeWardName(ward);
  const cityMappings = mapping.mappings[cityCode.toLowerCase()];
  
  if (!cityMappings) return null;
  
  // Tìm trong tất cả districts của city
  for (const [districtKey, districtData] of Object.entries(cityMappings)) {
    // Kiểm tra trong current_wards
    const foundWard = districtData.current_wards.find(w => {
      const normalizedWardName = normalizeWardName(w.ward_name);
      return normalizedWardName === normalizedWard ||
             normalizedWardName.includes(normalizedWard) ||
             normalizedWard.includes(normalizedWardName);
    });
    
    if (foundWard) {
      // Trả về old_name của district (ví dụ: "Quận Gò Vấp")
      return districtData.old_name.toLowerCase();
    }
  }
  
  return null;
}

/**
 * Kiểm tra xem hai ward có cùng district không
 * @param ward1 - Tên ward thứ nhất
 * @param ward2 - Tên ward thứ hai
 * @param cityCode - Mã thành phố, mặc định là "hcm"
 * @returns true nếu cùng district, false nếu không
 */
export function areWardsInSameDistrict(
  ward1: string,
  ward2: string,
  cityCode: string = 'hcm'
): boolean {
  const district1 = getDistrictFromWard(ward1, cityCode);
  const district2 = getDistrictFromWard(ward2, cityCode);
  
  if (!district1 || !district2) return false;
  
  // Normalize district names để so sánh
  const normalizeDistrict = (d: string) => d.toLowerCase().replace(/^(quận|huyện|thị xã|thành phố)\s*/i, '').trim();
  
  return normalizeDistrict(district1) === normalizeDistrict(district2);
}

/**
 * Lấy tất cả wards trong một district
 * @param districtName - Tên district (ví dụ: "Quận Gò Vấp", "gò vấp")
 * @param cityCode - Mã thành phố, mặc định là "hcm"
 * @returns Array of ward names hoặc empty array
 */
export function getWardsInDistrict(districtName: string, cityCode: string = 'hcm'): string[] {
  if (!districtName) return [];
  
  const cityMappings = mapping.mappings[cityCode.toLowerCase()];
  if (!cityMappings) return [];
  
  const normalizedDistrict = districtName.toLowerCase().replace(/^(quận|huyện|thị xã|thành phố)\s*/i, '').trim();
  
  // Tìm district trong mappings
  for (const [districtKey, districtData] of Object.entries(cityMappings)) {
    const normalizedKey = districtKey.toLowerCase().replace(/^(quận|huyện|thị xã|thành phố)\s*/i, '').trim();
    const normalizedOldName = districtData.old_name.toLowerCase().replace(/^(quận|huyện|thị xã|thành phố)\s*/i, '').trim();
    
    if (normalizedKey === normalizedDistrict || normalizedOldName === normalizedDistrict) {
      return districtData.current_wards.map(w => normalizeWardName(w.ward_name));
    }
  }
  
  return [];
}

