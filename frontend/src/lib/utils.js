const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/";

export async function fetchJSON(path) {
    return new Promise((resolve, reject) => {
        fetch(API_BASE_URL + path)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => resolve(data))
            .catch(error => reject(error));
    });
}