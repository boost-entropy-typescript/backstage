/*
 * Copyright 2021 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Config, ConfigReader } from '@backstage/config';
import cacheManager from 'cache-manager';
// @ts-expect-error
import Memcache from 'memcache-pp';
// @ts-expect-error
import memcachedStore from 'cache-manager-memcached-store';
import { DefaultCacheClient, CacheClient } from './CacheClient';
import { PluginCacheManager } from './types';

/**
 * Implements a Cache Manager which will automatically create new cache clients
 * for plugins when requested. All requested cacheclients are created with the
 * credentials provided.
 */
export class CacheManager {
  /**
   * Keys represented supported `backend.cache.store` values, mapped to
   * factories that return cacheManager.Cache instances appropriate to the
   * store.
   */
  private readonly storeFactories = {
    memcache: this.getMemcacheClient,
    memory: this.getMemoryClient,
    none: this.getNoneClient,
  };

  /**
   * Creates a new CacheManager instance by reading from the `backend` config
   * section, specifically the `.cache` key.
   *
   * @param config The loaded application configuration.
   */
  static fromConfig(config: Config): CacheManager {
    // If no `backend.cache` config is provided, instantiate the CacheManager
    // with empty config; allowing a "none" cache client will be returned.
    return new CacheManager(
      config.getOptionalConfig('backend.cache') || new ConfigReader(undefined),
    );
  }

  private constructor(private readonly config: Config) {}

  /**
   * Generates a CacheManagerInstance for consumption by plugins.
   *
   * @param pluginId The plugin that the cache manager should be created for. Plugin names should be unique.
   */
  forPlugin(pluginId: string): PluginCacheManager {
    return {
      getClient: ({ defaultTtl }): CacheClient => {
        const concreteClient = this.getClientWithTtl(defaultTtl);
        return new DefaultCacheClient({
          client: concreteClient,
          pluginId: pluginId,
        });
      },
    };
  }

  private getClientWithTtl(ttl: number): cacheManager.Cache {
    const store = this.config.getOptionalString(
      'store',
    ) as keyof CacheManager['storeFactories'];

    if (this.storeFactories.hasOwnProperty(store)) {
      return this.storeFactories[store].call(this, ttl);
    }
    return this.storeFactories.none.call(this, ttl);
  }

  private getMemcacheClient(defaultTtl: number): cacheManager.Cache {
    const hosts = this.config.getStringArray('connection.hosts');
    const netTimeout = this.config.getOptionalNumber('connection.netTimeout');
    return cacheManager.caching({
      store: memcachedStore,
      driver: Memcache,
      options: {
        hosts,
        ...(netTimeout && { netTimeout }),
      },
      ttl: defaultTtl,
    });
  }

  private getMemoryClient(defaultTtl: number): cacheManager.Cache {
    return cacheManager.caching({
      store: 'memory',
      ttl: defaultTtl,
    });
  }

  private getNoneClient(defaultTtl: number): cacheManager.Cache {
    return cacheManager.caching({
      store: 'none',
      ttl: defaultTtl,
    });
  }
}
