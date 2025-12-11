import { inject } from 'vue';
import { useLayoutStore } from '@/stores/layoutStore';
import type { QAjaxBar } from 'quasar';

/**
 * Composable that combines the layout store with Quasar's $q instance
 * for easy access to notifications and ajax-bar from any component.
 * 
 * Usage:
 * ```ts
 * const { showSuccess, withAjaxBar } = useLayout()
 * 
 * // Show a notification
 * showSuccess('Operation completed!')
 * 
 * // Wrap an async operation with ajax-bar
 * await withAjaxBar(fetchData())
 * ```
 */
export function useLayout() {
  const layoutStore = useLayoutStore();
  const ajaxBarRef = inject<{ value: QAjaxBar | null }>('ajaxBar', { value: null });

  /**
   * Start the ajax-bar (loading indicator at top of page)
   */
  const startAjaxBar = () => {
    layoutStore.startAjaxBar();
    ajaxBarRef.value?.start();
  };

  /**
   * Stop the ajax-bar
   */
  const stopAjaxBar = () => {
    layoutStore.stopAjaxBar();
    ajaxBarRef.value?.stop();
  };

  /**
   * Set ajax-bar progress (0-100)
   * Note: QAjaxBar doesn't expose setPercentage directly.
   * Progress is typically managed internally by the component.
   */
  const setAjaxBarProgress = (progress: number) => {
    layoutStore.setAjaxBarProgress(progress);
    // QAjaxBar manages progress internally, so we only update store state
  };

  /**
   * Wrap an async operation with ajax-bar
   * Automatically shows loading indicator and hides it when done
   */
  const withAjaxBar = async <T>(promise: Promise<T>): Promise<T> => {
    startAjaxBar();
    try {
      const result = await promise;
      return result;
    } finally {
      stopAjaxBar();
    }
  };

  return {
    // Notification methods (from store)
    showNotification: layoutStore.showNotification,
    showSuccess: layoutStore.showSuccess,
    showError: layoutStore.showError,
    showWarning: layoutStore.showWarning,
    showInfo: layoutStore.showInfo,

    // Loading spinner methods (from store)
    showLoading: layoutStore.showLoading,
    hideLoading: layoutStore.hideLoading,
    withLoading: layoutStore.withLoading,

    // Ajax-bar methods (combined with $q)
    startAjaxBar,
    stopAjaxBar,
    setAjaxBarProgress,
    withAjaxBar,

    // Store state (read-only)
    ajaxBarActive: layoutStore.ajaxBarActive,
    ajaxBarProgress: layoutStore.ajaxBarProgress,
  };
}

