class BaseApiService {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.options = {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    };
  }

  async request(endpoint, method = "GET", data = null) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        method,
        headers: this.options.headers,
        credentials: "include",
      };

      if (data) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(url, config);

      if (!response.ok) {
        console.error(response.type, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(error);
    }
  }

  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, data) {
    return this.request(endpoint, "POST", data);
  }

  put(endpoint, data) {
    return this.request(endpoint, "PUT", data);
  }

  delete(endpoint) {
    return this.request(endpoint, "DELETE");
  }
}

export default BaseApiService;
