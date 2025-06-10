/**
 * Event Bus System
 * Simple in-memory event bus implementation for event-driven architecture
 */

import { logger } from '@/utils/logger';

// Event handler type
export type EventHandler<T = unknown> = (data: T, metadata?: EventMetadata) => Promise<void> | void;

// Event metadata
export interface EventMetadata {
  correlationId?: string;
  timestamp: number;
  publisher: string;
  [key: string]: unknown;
}

// Event bus class
export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, Array<EventHandler<any>>> = new Map();
  
  // Singleton pattern
  private constructor() {
    logger.info('EventBus initialized');
  }
  
  // Get singleton instance
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  /**
   * Subscribe to an event
   * @param eventName The name of the event to subscribe to
   * @param handler The handler function to call when the event is published
   */
  public subscribe<T>(eventName: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    
    const eventHandlers = this.handlers.get(eventName);
    if (eventHandlers) {
      eventHandlers.push(handler);
      logger.debug(`Subscribed to event ${eventName}`, { 
        eventName, 
        handlersCount: eventHandlers.length 
      });
    }
  }
  
  /**
   * Unsubscribe from an event
   * @param eventName The name of the event to unsubscribe from
   * @param handler The handler function to remove
   */
  public unsubscribe<T>(eventName: string, handler: EventHandler<T>): void {
    const eventHandlers = this.handlers.get(eventName);
    if (eventHandlers) {
      const index = eventHandlers.indexOf(handler);
      if (index !== -1) {
        eventHandlers.splice(index, 1);
        logger.debug(`Unsubscribed from event ${eventName}`, { 
          eventName, 
          handlersCount: eventHandlers.length 
        });
      }
    }
  }
  
  /**
   * Publish an event
   * @param eventName The name of the event to publish
   * @param data The data to pass to handlers
   * @param metadata Additional metadata for the event
   */
  public async publish<T>(
    eventName: string, 
    data: T, 
    metadata?: Omit<EventMetadata, 'timestamp'>
  ): Promise<void> {
    const eventHandlers = this.handlers.get(eventName);
    
    if (!eventHandlers || eventHandlers.length === 0) {
      logger.debug(`No handlers for event ${eventName}`);
      return;
    }
    
    const eventMetadata: EventMetadata = {
      timestamp: Date.now(),
      publisher: metadata?.publisher || 'system',
      ...metadata
    };
    
    logger.debug(`Publishing event ${eventName}`, { 
      eventName, 
      handlersCount: eventHandlers.length,
      correlationId: eventMetadata.correlationId
    });
    
    // Execute handlers in parallel
    try {
      await Promise.all(
        eventHandlers.map(handler => 
          Promise.resolve(handler(data, eventMetadata))
            .catch(error => {
              logger.error(`Error in event handler for ${eventName}`, { 
                error, 
                eventName,
                correlationId: eventMetadata.correlationId
              });
            })
        )
      );
    } catch (error) {
      logger.error(`Error publishing event ${eventName}`, { 
        error, 
        eventName,
        correlationId: eventMetadata.correlationId
      });
    }
  }
  
  /**
   * Check if an event has subscribers
   * @param eventName The name of the event to check
   */
  public hasSubscribers(eventName: string): boolean {
    const eventHandlers = this.handlers.get(eventName);
    return Boolean(eventHandlers && eventHandlers.length > 0);
  }
  
  /**
   * Get the number of subscribers for an event
   * @param eventName The name of the event to check
   */
  public getSubscribersCount(eventName: string): number {
    const eventHandlers = this.handlers.get(eventName);
    return eventHandlers ? eventHandlers.length : 0;
  }
  
  /**
   * Clear all handlers for an event
   * @param eventName The name of the event to clear
   */
  public clearEvent(eventName: string): void {
    this.handlers.delete(eventName);
    logger.debug(`Cleared all handlers for event ${eventName}`, { eventName });
  }
  
  /**
   * Clear all events and handlers
   */
  public clearAll(): void {
    this.handlers.clear();
    logger.info('Cleared all event handlers');
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();
export default eventBus;