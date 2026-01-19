import axios from 'axios';

const BASE_URL =
  import.meta.env.MODE === 'development'
    ? ''
    : import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: BASE_URL,
});