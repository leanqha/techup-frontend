import axios from "axios";

const api = axios.create({
    baseURL: "http://46.37.123.72:8080/api/v1",
    withCredentials: true,
});

export default api;