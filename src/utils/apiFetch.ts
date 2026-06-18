// Safe interceptable fetch utility to bypass read-only window.fetch constraints in secure iframe environments

export interface OfflineStateInterface {
  isOffline: boolean;
  handleFetch: null | ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>);
}

export const offlineState: OfflineStateInterface = {
  isOffline: false,
  handleFetch: null
};

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (offlineState.isOffline && offlineState.handleFetch) {
    try {
      return await offlineState.handleFetch(input, init);
    } catch (err) {
      console.error("Offline interceptor handler failed, falling back to window.fetch:", err);
    }
  }
  return window.fetch(input, init);
}
