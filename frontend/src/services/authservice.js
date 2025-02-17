import axios from 'axios'

const API_URL = 'http://145.223.96.50:3002/api/v1/employees'

export const authService = {
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password
      })
      return response.data
    } catch (error) {
      throw error
    }
  }
}