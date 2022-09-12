/*
 * Copyright 2022 The Backstage Authors
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

import {
  createServiceFactory,
  createServiceRef,
  discoveryServiceRef,
} from '@backstage/backend-plugin-api';
import { CatalogApi, CatalogClient } from '@backstage/catalog-client';

/**
 * The catalogService provides the catalog API.
 * @alpha
 */
export const catalogServiceRef = createServiceRef<CatalogApi>({
  id: 'catalog-client',
  defaultFactory: async service =>
    createServiceFactory({
      service,
      deps: {
        discoveryApi: discoveryServiceRef,
      },
      async factory() {
        return async ({ discoveryApi }) => {
          return new CatalogClient({ discoveryApi });
        };
      },
    }),
});
