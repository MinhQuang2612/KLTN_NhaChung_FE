/**
 * Utility functions để tính toán và xử lý tuổi từ dateOfBirth
 */

export class AgeUtils {
  /**
   * Tính tuổi từ ngày sinh
   * @param dateOfBirth - Ngày sinh theo format YYYY-MM-DD
   * @returns Tuổi hiện tại
   */
  static calculateAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 0;
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Validate tuổi (18-100)
   * @param dateOfBirth - Ngày sinh theo format YYYY-MM-DD
   * @returns true nếu tuổi hợp lệ
   */
  static validateAge(dateOfBirth: string): boolean {
    const age = this.calculateAge(dateOfBirth);
    return age >= 18 && age <= 100;
  }

  /**
   * Kiểm tra xem có đủ 18 tuổi không
   * @param dateOfBirth - Ngày sinh theo format YYYY-MM-DD
   * @returns true nếu đủ 18 tuổi
   */
  static isAdult(dateOfBirth: string): boolean {
    const age = this.calculateAge(dateOfBirth);
    return age >= 18;
  }

  /**
   * Validate ngày sinh
   * @param dateOfBirth - Ngày sinh theo format YYYY-MM-DD
   * @returns Object chứa isValid và message
   */
  static validateDateOfBirth(dateOfBirth: string): { isValid: boolean; message?: string } {
    if (!dateOfBirth) {
      return { isValid: false, message: "Vui lòng nhập ngày sinh" };
    }

    const date = new Date(dateOfBirth);
    const today = new Date();
    
    // Kiểm tra format ngày
    if (isNaN(date.getTime())) {
      return { isValid: false, message: "Ngày sinh không hợp lệ" };
    }

    // Kiểm tra ngày sinh không được trong tương lai
    if (date > today) {
      return { isValid: false, message: "Ngày sinh không được trong tương lai" };
    }

    // Kiểm tra tuổi
    const age = this.calculateAge(dateOfBirth);
    if (age < 18) {
      return { isValid: false, message: "Bạn phải đủ 18 tuổi để sử dụng dịch vụ này" };
    }
    if (age > 100) {
      return { isValid: false, message: "Tuổi không được vượt quá 100" };
    }

    return { isValid: true };
  }

  /**
   * Format ngày sinh để hiển thị
   * @param dateOfBirth - Ngày sinh theo format YYYY-MM-DD
   * @returns Ngày sinh theo format DD/MM/YYYY
   */
  static formatDateOfBirth(dateOfBirth: string): string {
    if (!dateOfBirth) return "";
    
    const date = new Date(dateOfBirth);
    return date.toLocaleDateString('vi-VN');
  }

  /**
   * Lấy thông tin tuổi chi tiết
   * @param dateOfBirth - Ngày sinh theo format YYYY-MM-DD
   * @returns Object chứa age, formattedDate, ageText
   */
  static getAgeInfo(dateOfBirth: string): {
    age: number;
    formattedDate: string;
    ageText: string;
  } {
    const age = this.calculateAge(dateOfBirth);
    const formattedDate = this.formatDateOfBirth(dateOfBirth);
    
    return {
      age,
      formattedDate,
      ageText: `${age} tuổi`
    };
  }

  /**
   * Tính ngày sinh từ tuổi (cho migration)
   * @param age - Tuổi
   * @returns Ngày sinh theo format YYYY-MM-DD
   */
  static calculateDateOfBirthFromAge(age: number): string {
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    const birthDate = new Date(birthYear, today.getMonth(), today.getDate());
    
    return birthDate.toISOString().split('T')[0];
  }

  /**
   * Lấy danh sách năm sinh cho select dropdown
   * @param minAge - Tuổi tối thiểu (default: 18)
   * @param maxAge - Tuổi tối đa (default: 100)
   * @returns Array các năm sinh
   */
  static getBirthYears(minAge: number = 18, maxAge: number = 100): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    
    for (let i = currentYear - minAge; i >= currentYear - maxAge; i--) {
      years.push(i);
    }
    
    return years;
  }
}
