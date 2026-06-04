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
    const regexStr = "^" + pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, (ch) => (ch === "*" ? ".*" : `\\${ch}`)) + "$";
    const regex = new RegExp(regexStr);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// Redis Cache implementation using ioredis
class RedisCache implements CacheProvider {
  private client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: true, // Do not block application startup
    });

    this.client.on("error", (err) => {
      console.error("❌ Redis connection error:", err);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      console.error(`❌ Error getting key ${key} from Redis:`, err);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.set(key, serialized, "EX", ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (err) {
      console.error(`❌ Error setting key ${key} in Redis:`, err);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      console.error(`❌ Error deleting key ${key} from Redis:`, err);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== "0");
    } catch (err) {
      console.error(`❌ Error deleting pattern ${pattern} from Redis:`, err);
    }
  }
}

// Singleton helper to persist connection cache across Next.js dev server hot-reloads
const globalForCache = globalThis as unknown as {
  cacheProvider: CacheProvider | undefined;
};

const redisUrl = process.env.REDIS_URL;

export const cache: CacheProvider =
  globalForCache.cacheProvider ||
  (redisUrl ? new RedisCache(redisUrl) : new InMemoryCache());

if (process.env.NODE_ENV !== "production") {
  globalForCache.cacheProvider = cache;
}

if (!redisUrl) {
  console.warn(
    "⚠️ WARNING: REDIS_URL is not set. Caching will fall back to in-memory mode. " +
      "This cache is local to the current Node process and not shared across serverless instances."
  );
} else {
  console.log("🚀 Redis cache initialized successfully.");
}
