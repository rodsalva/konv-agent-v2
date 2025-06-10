/**
 * Pipeline Orchestrator
 * Manages the execution flow of pipeline stages
 */

import { logger } from '@/utils/logger';
import { PipelineStage, IPipelineStageContext, IPipelineStageResult } from './pipeline-stage';
import { EventBus } from '@/events/event-bus';

export interface IPipelineOptions {
  name: string;
  eventBus?: EventBus;
  continueOnError?: boolean;
  publishEvents?: boolean;
}

export class Pipeline<T, R> {
  private name: string;
  private stages: PipelineStage<any, any>[] = [];
  private eventBus?: EventBus;
  private continueOnError: boolean;
  private publishEvents: boolean;

  constructor(options: IPipelineOptions) {
    this.name = options.name;
    this.eventBus = options.eventBus;
    this.continueOnError = options.continueOnError || false;
    this.publishEvents = options.publishEvents !== false;

    logger.info(`Pipeline initialized: ${this.name}`, {
      name: this.name,
      continueOnError: this.continueOnError,
      publishEvents: this.publishEvents
    });
  }

  /**
   * Add a stage to the pipeline
   * @param stage The pipeline stage to add
   */
  public addStage<S, U>(stage: PipelineStage<S, U>): Pipeline<T, R> {
    this.stages.push(stage);
    logger.debug(`Added stage to pipeline: ${stage.getName()}`, {
      pipeline: this.name,
      stage: stage.getName(),
      stageIndex: this.stages.length - 1
    });
    return this;
  }

  /**
   * Add multiple stages to the pipeline
   * @param stages The pipeline stages to add
   */
  public addStages<S, U>(stages: PipelineStage<S, U>[]): Pipeline<T, R> {
    stages.forEach(stage => this.addStage(stage));
    return this;
  }

  /**
   * Process data through the entire pipeline
   * @param initialData The initial data to process
   * @param metadata Additional metadata for the pipeline context
   */
  public async process(initialData: T, metadata: Record<string, unknown> = {}): Promise<IPipelineStageResult<any, R>> {
    if (this.stages.length === 0) {
      logger.warn(`Pipeline ${this.name} has no stages`);
      return {
        success: false,
        error: {
          code: 'PIPELINE_NO_STAGES',
          message: 'Pipeline has no stages'
        },
        context: {
          data: initialData,
          metadata: {
            stageStartTime: Date.now(),
            ...metadata
          }
        },
        executionTimeMs: 0
      };
    }

    const pipelineStartTime = Date.now();
    const correlationId = (metadata.correlationId as string) || `pipeline-${this.name}-${pipelineStartTime}`;
    
    logger.info(`Starting pipeline: ${this.name}`, {
      pipeline: this.name,
      correlationId,
      stagesCount: this.stages.length
    });

    // Publish pipeline started event if event bus is available
    if (this.eventBus && this.publishEvents) {
      await this.eventBus.publish(`pipeline.${this.name}.started`, {
        pipeline: this.name,
        data: initialData,
        timestamp: pipelineStartTime,
        correlationId
      }, {
        correlationId,
        publisher: `pipeline.${this.name}`
      });
    }

    let currentData: any = initialData;
    let lastResult: IPipelineStageResult<any, any> | null = null;

    // Process each stage in sequence
    for (let i = 0; i < this.stages.length; i++) {
      const stage = this.stages[i];
      const prevStageName = i > 0 ? this.stages[i - 1].getName() : undefined;
      const nextStageName = i < this.stages.length - 1 ? this.stages[i + 1].getName() : undefined;

      // Skip disabled stages
      if (!stage.isEnabled()) {
        logger.debug(`Skipping disabled stage: ${stage.getName()}`, {
          pipeline: this.name,
          stage: stage.getName(),
          correlationId
        });
        continue;
      }

      // Create context for this stage
      const context: IPipelineStageContext<any> = {
        data: currentData,
        metadata: {
          stageStartTime: Date.now(),
          correlationId,
          prevStage: prevStageName,
          nextStage: nextStageName,
          pipelineStartTime,
          pipelineName: this.name,
          stageIndex: i,
          ...metadata
        }
      };

      // Process this stage
      logger.debug(`Processing stage: ${stage.getName()}`, {
        pipeline: this.name,
        stage: stage.getName(),
        stageIndex: i,
        correlationId
      });

      try {
        // Execute the stage
        lastResult = await stage.process(context);

        // Publish stage completed event if event bus is available
        if (this.eventBus && this.publishEvents) {
          await this.eventBus.publish(`pipeline.${this.name}.stage.completed`, {
            pipeline: this.name,
            stage: stage.getName(),
            stageIndex: i,
            success: lastResult.success,
            executionTimeMs: lastResult.executionTimeMs,
            timestamp: Date.now(),
            correlationId
          }, {
            correlationId,
            publisher: `pipeline.${this.name}`
          });
        }

        // Check for errors
        if (!lastResult.success) {
          logger.error(`Stage failed: ${stage.getName()}`, {
            pipeline: this.name,
            stage: stage.getName(),
            error: lastResult.error,
            correlationId
          });

          // Publish stage error event if event bus is available
          if (this.eventBus && this.publishEvents) {
            await this.eventBus.publish(`pipeline.${this.name}.stage.error`, {
              pipeline: this.name,
              stage: stage.getName(),
              stageIndex: i,
              error: lastResult.error,
              timestamp: Date.now(),
              correlationId
            }, {
              correlationId,
              publisher: `pipeline.${this.name}`
            });
          }

          // Stop pipeline if continueOnError is false
          if (!this.continueOnError) {
            logger.info(`Stopping pipeline due to error in stage: ${stage.getName()}`, {
              pipeline: this.name,
              stage: stage.getName(),
              correlationId
            });
            break;
          }
        }

        // Update current data for next stage
        if (lastResult.success && lastResult.data !== undefined) {
          currentData = lastResult.data;
        }
      } catch (error) {
        // This should not happen as stage.process should handle all errors
        logger.error(`Unexpected error in pipeline stage: ${stage.getName()}`, {
          pipeline: this.name,
          stage: stage.getName(),
          error,
          correlationId
        });

        lastResult = {
          success: false,
          error: {
            code: 'PIPELINE_UNEXPECTED_ERROR',
            message: `Unexpected error in pipeline stage ${stage.getName()}: ${error instanceof Error ? error.message : String(error)}`,
            details: error
          },
          context,
          executionTimeMs: Date.now() - context.metadata.stageStartTime
        };

        // Publish stage error event if event bus is available
        if (this.eventBus && this.publishEvents) {
          await this.eventBus.publish(`pipeline.${this.name}.stage.error`, {
            pipeline: this.name,
            stage: stage.getName(),
            stageIndex: i,
            error: lastResult.error,
            timestamp: Date.now(),
            correlationId
          }, {
            correlationId,
            publisher: `pipeline.${this.name}`
          });
        }

        // Stop pipeline if continueOnError is false
        if (!this.continueOnError) {
          logger.info(`Stopping pipeline due to unexpected error in stage: ${stage.getName()}`, {
            pipeline: this.name,
            stage: stage.getName(),
            correlationId
          });
          break;
        }
      }
    }

    const pipelineEndTime = Date.now();
    const pipelineExecutionTimeMs = pipelineEndTime - pipelineStartTime;

    // Create final result
    const finalResult: IPipelineStageResult<any, R> = lastResult ? {
      ...lastResult,
      executionTimeMs: pipelineExecutionTimeMs
    } : {
      success: false,
      error: {
        code: 'PIPELINE_NO_RESULT',
        message: 'Pipeline did not produce any result'
      },
      context: {
        data: initialData,
        metadata: {
          stageStartTime: pipelineStartTime,
          correlationId,
          pipelineStartTime,
          pipelineName: this.name,
          ...metadata
        }
      },
      executionTimeMs: pipelineExecutionTimeMs
    };

    // Log pipeline completion
    logger.info(`Pipeline completed: ${this.name}`, {
      pipeline: this.name,
      success: finalResult.success,
      executionTimeMs: pipelineExecutionTimeMs,
      correlationId
    });

    // Publish pipeline completed event if event bus is available
    if (this.eventBus && this.publishEvents) {
      await this.eventBus.publish(`pipeline.${this.name}.completed`, {
        pipeline: this.name,
        success: finalResult.success,
        error: finalResult.error,
        executionTimeMs: pipelineExecutionTimeMs,
        timestamp: pipelineEndTime,
        correlationId
      }, {
        correlationId,
        publisher: `pipeline.${this.name}`
      });
    }

    return finalResult;
  }

  /**
   * Get the name of this pipeline
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get the number of stages in this pipeline
   */
  public getStagesCount(): number {
    return this.stages.length;
  }

  /**
   * Get the stages in this pipeline
   */
  public getStages(): PipelineStage<any, any>[] {
    return [...this.stages];
  }
}