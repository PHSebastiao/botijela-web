class BaseApiService {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.options = {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    };
  }

  async request(endpoint, method = "GET", data = null) {
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
      let errorMsg = response.statusText;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorJson = await response.json();
          if (errorJson && errorJson.error) {
            errorMsg = errorJson.error;
          }
        }
      } catch (e) {
        // ignore JSON parse errors
      }
      throw new Error(errorMsg);
    }

    // Only parse JSON if there is content
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const text = await response.text();
      if (text) {
        return JSON.parse(text);
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  async get(endpoint) {
    return await this.request(endpoint);
  }

  async post(endpoint, data) {
    return await this.request(endpoint, "POST", data);
  }

  async put(endpoint, data) {
    return await this.request(endpoint, "PUT", data);
  }
  
  async patch(endpoint, data) {
    return await this.request(endpoint, "PATCH", data);
  }

  async delete(endpoint) {
    return await this.request(endpoint, "DELETE");
  }
}

export default BaseApiService;
