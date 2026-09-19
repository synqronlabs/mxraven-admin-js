/**
 * Storage integration models.
 *
 * @packageDocumentation
 */

/**
 * Wire representation of a tenant storage integration.
 *
 * @public
 */
export interface StorageIntegrationData {
  /** Integration identifier. */
  readonly id: string;
  /** Owning tenant identifier. */
  readonly tenantId: string;
  /** Immutable storage reference. */
  readonly storageRef: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** Whether the integration is active. */
  readonly isActive: boolean;
  /** Whether credentials are stored for the integration. */
  readonly credentialsPresent: boolean;
}

/**
 * Request body for `POST /v2/tenants/{slug}/storage-integrations`.
 *
 * @public
 */
export interface CreateStorageIntegrationRequest {
  /** Immutable reference; starts with a letter or digit. */
  readonly storageRef: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** Object-storage access key. */
  readonly accessKey: string;
  /** Object-storage secret key. */
  readonly secretKey: string;
  /** Bucket name. */
  readonly bucketName: string;
  /** Bucket region. */
  readonly region: string;
  /** Endpoint URL; an empty string selects the AWS default. */
  readonly endpointUrl: string;
  /** Whether to force path-style addressing. Defaults to `false`. */
  readonly forcePathStyle?: boolean;
}

/**
 * Request body for `PUT /v2/tenants/{slug}/storage-integrations/{id}`.
 *
 * @public
 */
export interface UpdateStorageIntegrationRequest {
  /** Human-readable name. */
  readonly displayName: string;
  /** Object-storage access key. */
  readonly accessKey: string;
  /** Object-storage secret key. */
  readonly secretKey: string;
  /** Bucket name. */
  readonly bucketName: string;
  /** Bucket region. */
  readonly region: string;
  /** Endpoint URL; an empty string selects the AWS default. */
  readonly endpointUrl: string;
  /** Whether to force path-style addressing. Defaults to `false`. */
  readonly forcePathStyle?: boolean;
}
