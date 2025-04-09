import axios from 'axios';

export default axios.create({
  baseURL: 'http://localhost:5000', // Replace with your backend's address if it's different
});