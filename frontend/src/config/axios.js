import axios from 'axios';


const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

const token = localStorage.getItem('token');
if (token && token !== 'null') {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}


export default axiosInstance;   