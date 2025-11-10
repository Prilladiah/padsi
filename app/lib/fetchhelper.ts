export interface FetchResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export async function fetchWithTimeout<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  const {
    timeout = 17000,      // default timeout 17 detik
    retries = 1,          // default retry 1 kali
    retryDelay = 1500,    // jeda antar retry 1.5 detik
    ...fetchOptions       // sisanya = opsi asli fetch()
  } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errMsg = await response.text();
        return {
          success: false,
          error: errMsg || response.statusText,
          status: response.status,
        };
      }

      const data = (await response.json()) as T;
      return { success: true, data, status: response.status };

    } catch (error: any) {
      clearTimeout(timer);
      console.error(`❌ Fetch attempt ${attempt + 1} failed:`, error.message);

      // retry jika masih ada kesempatan
      if (attempt < retries) {
        console.log(`⏳ Retrying after ${retryDelay}ms...`);
        await new Promise((r) => setTimeout(r, retryDelay));
        continue;
      }

      // setelah retry terakhir gagal
      return { success: false, error: error.message };
    }
  }

  return { success: false, error: 'Network request failed' };
}
