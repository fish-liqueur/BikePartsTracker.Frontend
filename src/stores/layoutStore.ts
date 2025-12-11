import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Notify, Loading } from 'quasar';

export interface NotificationOptions {
  type?: 'positive' | 'negative' | 'warning' | 'info';
  message: string;
  caption?: string;
  position?: 'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right' | 'center';
  timeout?: number;
  actions?: Array<{ label: string; color?: string; handler?: () => void }>;
  icon?: string;
  color?: string;
  textColor?: string;
  multiLine?: boolean;
}

export const useLayoutStore = defineStore('layout', () => {
  // Drawer
  const drawerOpen = ref(false);
  const drawerToggle = () => {
    drawerOpen.value = !drawerOpen.value;
    console.log('drawerToggle ', drawerOpen.value);
  };

  // Ajax-bar state
  const ajaxBarActive = ref(false);
  const ajaxBarProgress = ref(0);

  // Notification queue (if needed for custom handling)
  const notificationQueue = ref<NotificationOptions[]>([]);

  /**
   * Show a notification using Quasar's Notify
   */
  const showNotification = (options: NotificationOptions | string) => {
    if (typeof options === 'string') {
      // Simple string notification
      Notify.create({
        message: options,
        type: 'info',
        position: 'top',
      });
      return;
    }

    // Full options notification
    Notify.create({
      type: options.type || 'info',
      message: options.message,
      caption: options.caption,
      position: options.position || 'top',
      timeout: options.timeout ?? 5000,
      actions: options.actions,
      icon: options.icon,
      color: options.color,
      textColor: options.textColor,
      multiLine: options.multiLine,
    });
  };

  /**
   * Convenience methods for different notification types
   */
  const showSuccess = (message: string, caption?: string) => {
    showNotification({
      type: 'positive',
      message,
      caption,
    });
  };

  const showError = (message: string, caption?: string) => {
    showNotification({
      type: 'negative',
      message,
      caption,
    });
  };

  const showWarning = (message: string, caption?: string) => {
    showNotification({
      type: 'warning',
      message,
      caption,
    });
  };

  const showInfo = (message: string, caption?: string) => {
    showNotification({
      type: 'info',
      message,
      caption,
    });
  };

  /**
   * Ajax-bar control methods
   * These methods control the loading indicator state.
   * To actually control Quasar's ajax-bar component, use the useLayout composable
   * which provides methods that work with $q.
   */
  const startAjaxBar = () => {
    ajaxBarActive.value = true;
    ajaxBarProgress.value = 0;
  };

  const stopAjaxBar = () => {
    ajaxBarActive.value = false;
    ajaxBarProgress.value = 100;
    // Reset after animation
    setTimeout(() => {
      ajaxBarProgress.value = 0;
    }, 300);
  };

  const setAjaxBarProgress = (progress: number) => {
    ajaxBarProgress.value = Math.min(100, Math.max(0, progress));
  };

  /**
   * Loading indicator (spinner) methods
   * For blocking operations that need a full-screen spinner
   */
  const showLoading = (message?: string) => {
    Loading.show({
      message: message || 'Loading...',
    });
  };

  const hideLoading = () => {
    Loading.hide();
  };

  /**
   * Helper to wrap async operations with ajax-bar state
   * Note: This only updates the store state. To control the actual ajax-bar
   * component, use the useLayout composable which provides withAjaxBar.
   */
  const withAjaxBarState = async <T>(promise: Promise<T>): Promise<T> => {
    startAjaxBar();
    try {
      const result = await promise;
      return result;
    } finally {
      stopAjaxBar();
    }
  };

  /**
   * Helper to wrap async operations with loading spinner
   */
  const withLoading = async <T>(
    promise: Promise<T>,
    message?: string
  ): Promise<T> => {
    showLoading(message);
    try {
      const result = await promise;
      return result;
    } finally {
      hideLoading();
    }
  };

  return {
    // State
    drawerOpen,
    ajaxBarActive,
    ajaxBarProgress,
    notificationQueue,

    // Actions
    drawerToggle,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    startAjaxBar,
    stopAjaxBar,
    setAjaxBarProgress,
    showLoading,
    hideLoading,
    withAjaxBarState,
    withLoading,
  };
});

