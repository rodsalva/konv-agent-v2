/**
 * Pipeline Stage Base Class
 * Defines the interface and basic functionality for all pipeline stages
 */

import { logger } from '@/utils/logger';

export interface IPipelineStageOptions {
  name: string;
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  [key: string]: unknown;
}

export interface IPipelineStageContext<T> {
  data: T;
  metadata: {
    stageStartTime: number;
    correlationId?: string;
    retryCount?: number;
    prevStage?: string;
    nextStage?: string;
    [key: string]: unknown;
  };
}

export interface IPipelineStageResult<T, R> {
  success: boolean;
  data?: R;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  context: IPipelineStageContext<T>;
  executionTimeMs: number;
}

export abstract class PipelineStage<T, R> {
  protected name: string;
  protected enabled: boolean;
  protected timeout: number;
  protected retries: number;
  protected options: IPipelineStageOptions;

  constructor(options: IPipelineStageOptions) {
    this.name = options.name;
    this.enabled = options.enabled !== false;
    this.timeout = options.timeout || 30000; // Default 30s timeout
    this.retries = options.retries || 0; // Default no retries
    this.options = options;
    
    logger.debug(`Pipeline stage initialized: ${this.name}`, {
      name: this.name,
      enabled: this.enabled,
      timeout: this.timeout,
      retries: this.retries
    });
  }

  /**
   * Process data through this pipeline stage
   * @param context The pipeline context with data and metadata
   */
  public async process(context: IPipelineStageContext<T>): Promise<IPipelineStageResult<T, R>> {
    if (!this.enabled) {
      logger.debug(`Skipping disabled pipeline stage: ${this.name}`, {
        name: this.name,
        correlationId: context.metadata.correlationId
      });
      return {
        success: true,
        data: context.data as unknown as R, // Pass through as-is
        context,
        executionTimeMs: 0
      };
    }

    const startTime = Date.now();
    context.metadata.stageStartTime = startTime;

    try {
      // Set up timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Pipeline stage ${this.name} timed out after ${this.timeout}ms`));
        }, this.timeout);
      });

      // Execute with timeout
      const result = await Promise.race([
        this.execute(context),
        timeoutPromise
      ]);

      const endTime = Date.now();
      const executionTimeMs = endTime - startTime;

      logger.debug(`Pipeline stage completed: ${this.name}`, {
        name: this.name,
        executionTimeMs,
        correlationId: context.metadata.correlationId
      });

      return {
        success: true,
        data: result,
        context,
        executionTimeMs
      };
    } catch (error) {
      const endTime = Date.now();
      const executionTimeMs = endTime - startTime;

      logger.error(`Pipeline stage failed: ${this.name}`, {
        name: this.name,
        error,
        executionTimeMs,
        correlationId: context.metadata.correlationId
      });

      // Check if we should retry
      const retryCount = context.metadata.retryCount || 0;
      if (retryCount < this.retries) {
        logger.info(`Retrying pipeline stage: ${this.name} (${retryCount + 1}/${this.retries})`, {
          name: this.name,
          retryCount: retryCount + 1,
          correlationId: context.metadata.correlationId
        });

        // Update retry count and try again
        return this.process({
          ...context,
          metadata: {
            ...context.metadata,
            retryCount: retryCount + 1
          }
        });
      }

      return {
        success: false,
        error: {
          code: 'PIPELINE_STAGE_ERROR',
          message: `Error in pipeline stage ${this.name}: ${error instanceof Error ? error.message : String(error)}`,
          details: error
        },
        context,
        executionTimeMs
      };
    }
  }

  /**
   * Get the name of this pipeline stage
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Check if this pipeline stage is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable or disable this pipeline stage
   * @param enabled Whether to enable or disable the stage
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.debug(`Pipeline stage ${this.name} ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Abstract method to be implemented by each pipeline stage
   * @param context The pipeline context with data and metadata
   */
  protected abstract execute(context: IPipelineStageContext<T>): Promise<R>;
}