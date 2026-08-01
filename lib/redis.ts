import Redis from "ioredis";

// Global cache interface
export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delByPattern(pattern: string): Promise<void>;
}

// In-Memory Fallback Cache implementation for development / fallback environments
class InMemoryCache implements CacheProvider {
  private cache = new Map<string, { value: unknown; expiresAt: number | null }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiresAt !== null && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    // Convert glob pattern (e.g. projects:*) to regex
    const regexStr =
      "^" +
      pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, (ch) =>
        ch === "*" ? ".*" : `\\${ch}`,
      ) +
      "$";
    const regex = new RegExp(regexStr);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Redis-backed cache that silently falls back to in-memory storage when Redis
 * is unreachable (e.g. REDIS_URL points at localhost but no server is running).
 */
class ResilientRedisCache implements CacheProvider {
  private client: Redis;
  private fallback = new InMemoryCache();
  private useFallback = false;
  private fallbackLogged = false;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        // Stop retrying quickly; fall back to memory instead of blocking requests.
        if (times > 2) return null;
        return Math.min(times * 200, 1000);
      },
    });

    this.client.on("error", () => {
      this.activateFallback("connection error");
    });

    this.client.on("ready", () => {
      if (this.useFallback) {
        console.log("✅ Redis reconnected. Resuming Redis cache.");
      }
      this.useFallback = false;
    });
  }

  private activateFallback(reason: string) {
    if (!this.useFallback) {
      this.useFallback = true;
    }
    if (!this.fallbackLogged) {
      this.fallbackLogged = true;
      console.warn(
        `⚠️ Redis unavailable (${reason}). Falling back to in-memory cache for this process.`,
      );
      // Stop further reconnect spam once we've decided to fall back.
      void this.client.quit().catch(() => {
        this.client.disconnect();
      });
    }
  }

  private async ensureConnected(): Promise<boolean> {
    if (this.useFallback) return false;

    const status = this.client.status;
    if (status === "ready") return true;
    if (status === "connecting" || status === "connect") return false;
    if (status === "end" || status === "close") {
      this.activateFallback("client closed");
      return false;
    }

    try {
      await this.client.connect();
      return true;
    } catch {
      this.activateFallback("connect failed");
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!(await this.ensureConnected())) {
      return this.fallback.get<T>(key);
    }

    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      this.activateFallback("get failed");
      return this.fallback.get<T>(key);
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    // Always write to memory so reads stay consistent if Redis drops mid-request.
    await this.fallback.set(key, value, ttlSeconds);

    if (!(await this.ensureConnected())) return;

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.set(key, serialized, "EX", ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
    } catch {
      this.activateFallback("set failed");
    }
  }

  async del(key: string): Promise<void> {
    await this.fallback.del(key);
    if (!(await this.ensureConnected())) return;

    try {
      await this.client.del(key);
    } catch {
      this.activateFallback("del failed");
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    await this.fallback.delByPattern(pattern);
    if (!(await this.ensureConnected())) return;

    try {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== "0");
    } catch {
      this.activateFallback("delByPattern failed");
    }
  }
}

// Singleton helper to persist connection cache across Next.js dev server hot-reloads
const globalForCache = globalThis as unknown as {
  cacheProviderV2: CacheProvider | undefined;
};

const redisUrl = process.env.REDIS_URL?.trim();

const globalForCacheLog = globalThis as unknown as {
  cacheProviderLogShown?: boolean;
};

function createCacheProvider(): CacheProvider {
  if (!redisUrl) {
    if (!globalForCacheLog.cacheProviderLogShown) {
      globalForCacheLog.cacheProviderLogShown = true;
      console.warn(
        "⚠️ WARNING: REDIS_URL is not set. Caching will fall back to in-memory mode. " +
          "This cache is local to the current Node process and not shared across serverless instances.",
      );
    }
    return new InMemoryCache();
  }

  if (!globalForCacheLog.cacheProviderLogShown) {
    globalForCacheLog.cacheProviderLogShown = true;
    console.log(
      "🚀 Redis cache configured (will fall back to memory if Redis is down).",
    );
  }
  return new ResilientRedisCache(redisUrl);
}

export const cache: CacheProvider =
  globalForCache.cacheProviderV2 || createCacheProvider();

// Always pin to globalThis so Next.js route isolates reuse one store in dev.
globalForCache.cacheProviderV2 = cache;
