/**
 * Event Bus Tests
 */
import { EventBus } from '@/events/event-bus';

describe('EventBus', () => {
  let eventBus: EventBus;
  
  beforeEach(() => {
    eventBus = new EventBus();
  });
  
  it('should initialize with empty subscribers', () => {
    const subscribers = eventBus.getSubscribers();
    expect(subscribers).toEqual({});
  });
  
  it('should allow subscription to events', () => {
    const mockHandler = jest.fn();
    eventBus.subscribe('test.event', mockHandler);
    
    const subscribers = eventBus.getSubscribers();
    expect(subscribers).toHaveProperty('test.event');
    expect(subscribers['test.event']).toContain(mockHandler);
  });
  
  it('should allow unsubscription from events', () => {
    const mockHandler = jest.fn();
    eventBus.subscribe('test.event', mockHandler);
    
    // Verify subscription
    let subscribers = eventBus.getSubscribers();
    expect(subscribers['test.event']).toContain(mockHandler);
    
    // Unsubscribe
    eventBus.unsubscribe('test.event', mockHandler);
    
    // Verify unsubscription
    subscribers = eventBus.getSubscribers();
    expect(subscribers['test.event']).not.toContain(mockHandler);
  });
  
  it('should publish events to subscribers', () => {
    const mockHandler1 = jest.fn();
    const mockHandler2 = jest.fn();
    const eventData = { id: '123', value: 'test' };
    
    eventBus.subscribe('test.event', mockHandler1);
    eventBus.subscribe('test.event', mockHandler2);
    eventBus.subscribe('other.event', mockHandler2);
    
    // Publish event
    eventBus.publish('test.event', eventData);
    
    // Verify handlers were called
    expect(mockHandler1).toHaveBeenCalledWith(eventData);
    expect(mockHandler2).toHaveBeenCalledWith(eventData);
    expect(mockHandler2).toHaveBeenCalledTimes(1); // Not called for 'other.event'
  });
  
  it('should handle errors in event handlers gracefully', () => {
    const mockHandler1 = jest.fn().mockImplementation(() => {
      throw new Error('Handler error');
    });
    const mockHandler2 = jest.fn();
    const eventData = { id: '123', value: 'test' };
    
    // Mock console.error to avoid polluting test output
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    eventBus.subscribe('test.event', mockHandler1);
    eventBus.subscribe('test.event', mockHandler2);
    
    // Publish event
    eventBus.publish('test.event', eventData);
    
    // Verify second handler was still called despite error in first
    expect(mockHandler1).toHaveBeenCalledWith(eventData);
    expect(mockHandler2).toHaveBeenCalledWith(eventData);
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  it('should do nothing when publishing to event with no subscribers', () => {
    const eventData = { id: '123', value: 'test' };
    
    // This should not throw an error
    eventBus.publish('nonexistent.event', eventData);
  });
  
  it('should do nothing when unsubscribing handler that is not subscribed', () => {
    const mockHandler = jest.fn();
    
    // This should not throw an error
    eventBus.unsubscribe('nonexistent.event', mockHandler);
  });
});