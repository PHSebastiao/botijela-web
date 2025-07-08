/**
 * Loading Wrapper - Theme-aware loading overlay for AJAX operations
 * Blocks elements during AJAX requests with appropriate theme styling
 */

class LoadingWrapper {
  constructor() {
    this.activeLoaders = new Set();
    this.injectStyles();
  }

  /**
   * Inject CSS styles for the loading wrapper
   */
  injectStyles() {
    const styleId = 'loading-wrapper-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .loading-wrapper {
        position: relative;
        pointer-events: none;
        user-select: none;
      }

      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1050;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: inherit;
        transition: all 0.3s ease;
      }

      /* Light theme overlay */
      [data-bs-theme=light] .loading-overlay {
        background-color: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(2px);
      }

      /* Dark theme overlay */
      [data-bs-theme=dark] .loading-overlay {
        background-color: rgba(17, 17, 17, 0.8);
        backdrop-filter: blur(2px);
      }

      /* Spinner styles */
      .loading-spinner {
        width: 2rem;
        height: 2rem;
        border: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      /* Light theme spinner */
      [data-theme="light"] .loading-spinner,
      :root:not([data-theme="dark"]) .loading-spinner {
        border-top-color: #007bff;
        border-right-color: #007bff;
      }

      /* Dark theme spinner */
      [data-theme="dark"] .loading-spinner {
        border-top-color: #0d6efd;
        border-right-color: #0d6efd;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Small spinner for smaller elements */
      .loading-spinner-sm {
        width: 1.25rem;
        height: 1.25rem;
        border-width: 1px;
      }

      /* Large spinner for larger elements */
      .loading-spinner-lg {
        width: 3rem;
        height: 3rem;
        border-width: 3px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Show loading overlay on target element
   * @param {string|HTMLElement|jQuery} target - Element to show loading on
   * @param {Object} options - Configuration options
   */
  show(target, options = {}) {
    const $target = $(target);
    if (!$target.length) return;

    const config = {
      spinnerSize: 'default', // 'sm', 'default', 'lg'
      ...options
    };

    $target.each((_, element) => {
      const $element = $(element);
      const loaderId = this.generateLoaderId($element);
      
      // Skip if already loading
      if (this.activeLoaders.has(loaderId)) return;
      
      this.activeLoaders.add(loaderId);
      
      // Add wrapper class and store original pointer-events
      const originalPointerEvents = $element.css('pointer-events');
      $element.data('original-pointer-events', originalPointerEvents);
      $element.addClass('loading-wrapper');
      
      // Create overlay
      const spinnerClass = config.spinnerSize === 'sm' ? 'loading-spinner-sm' : 
                          config.spinnerSize === 'lg' ? 'loading-spinner-lg' : '';
      
      const overlay = $(`
        <div class="loading-overlay" data-loader-id="${loaderId}">
          <div class="loading-spinner ${spinnerClass}"></div>
        </div>
      `);
      
      $element.append(overlay);
      
      // Trigger reflow for smooth animation
      overlay[0].offsetHeight;
      overlay.css('opacity', '1');
    });
  }

  /**
   * Hide loading overlay from target element
   * @param {string|HTMLElement|jQuery} target - Element to hide loading from
   */
  hide(target) {
    const $target = $(target);
    if (!$target.length) return;

    $target.each((_, element) => {
      const $element = $(element);
      const loaderId = this.generateLoaderId($element);
      
      // Skip if not loading
      if (!this.activeLoaders.has(loaderId)) return;
      
      this.activeLoaders.delete(loaderId);
      
      // Find and remove overlay immediately
      const $overlay = $element.find(`.loading-overlay[data-loader-id="${loaderId}"]`);
      if ($overlay.length) {
        $overlay.css('opacity', '0');
        setTimeout(() => $overlay.remove(), 300);
      }
      
      // Immediately restore element state
      $element.removeClass('loading-wrapper');
      const originalPointerEvents = $element.data('original-pointer-events');
      if (originalPointerEvents) {
        $element.css('pointer-events', originalPointerEvents);
      } else {
        $element.css('pointer-events', '');
      }
      $element.removeData('original-pointer-events');
      
      // Clean up any orphaned overlays
      $element.find('.loading-overlay').remove();
    });
  }

  /**
   * Generate unique loader ID for element
   * @param {jQuery} $element - jQuery element
   * @returns {string} Unique loader ID
   */
  generateLoaderId($element) {
    return `loader-${$element.attr('id') || Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if element is currently loading
   * @param {string|HTMLElement|jQuery} target - Element to check
   * @returns {boolean} True if loading
   */
  isLoading(target) {
    const $target = $(target);
    if (!$target.length) return false;
    
    const loaderId = this.generateLoaderId($target);
    return this.activeLoaders.has(loaderId);
  }

  /**
   * Force cleanup of loading state (useful when DOM content is replaced)
   * @param {string|HTMLElement|jQuery} target - Element to cleanup
   */
  forceCleanup(target) {
    const $target = $(target);
    if (!$target.length) return;

    $target.each((_, element) => {
      const $element = $(element);
      const loaderId = this.generateLoaderId($element);
      
      // Remove from active loaders
      this.activeLoaders.delete(loaderId);
      
      // Remove any classes and restore styles
      $element.removeClass('loading-wrapper');
      $element.css('pointer-events', '');
      $element.removeData('original-pointer-events');
      
      // Remove any overlays
      $element.find('.loading-overlay').remove();
    });
  }

  /**
   * Wrap an AJAX request with loading states
   * @param {string|HTMLElement|jQuery} target - Element to show loading on
   * @param {Promise|jqXHR} ajaxPromise - AJAX promise or jQuery XHR
   * @param {Object} options - Configuration options
   * @returns {Promise} Promise that resolves/rejects with the AJAX result
   */
  wrap(target, ajaxPromise, options = {}) {
    this.show(target, options);
    
    const promise = Promise.resolve(ajaxPromise);
    
    promise.finally(() => {
      this.hide(target);
    });
    
    return promise;
  }
}

// Create global instance
window.loadingWrapper = new LoadingWrapper();

// jQuery plugin
$.fn.showLoading = function(options) {
  window.loadingWrapper.show(this, options);
  return this;
};

$.fn.hideLoading = function() {
  window.loadingWrapper.hide(this);
  return this;
};

$.fn.isLoading = function() {
  return window.loadingWrapper.isLoading(this);
};

$.fn.wrapLoading = function(ajaxPromise, options) {
  return window.loadingWrapper.wrap(this, ajaxPromise, options);
};

$.fn.forceCleanupLoading = function() {
  window.loadingWrapper.forceCleanup(this);
  return this;
};
