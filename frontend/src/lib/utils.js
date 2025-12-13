export async function fetchJSON(path) {
    return new Promise((resolve, reject) => {
        fetch("/api/" + path)
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