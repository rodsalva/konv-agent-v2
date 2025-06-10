/**
 * Competitor Event Definitions
 */

import { CompetitorID, BenchmarkID, FeatureCategory } from '@/types/competitor.types';

// Competitor event names
export enum CompetitorEventType {
  // Competitor events
  COMPETITOR_ADDED = 'competitor.added',
  COMPETITOR_UPDATED = 'competitor.updated',
  COMPETITOR_REMOVED = 'competitor.removed',
  
  // Feature events
  FEATURE_COMPARISON_ADDED = 'feature.comparison.added',
  FEATURE_COMPARISON_UPDATED = 'feature.comparison.updated',
  
  // Benchmark events
  BENCHMARK_REPORT_CREATED = 'benchmark.report.created',
  BENCHMARK_REPORT_UPDATED = 'benchmark.report.updated',
  BENCHMARK_REPORT_PUBLISHED = 'benchmark.report.published'
}

// Base competitor event interface
export interface ICompetitorEvent {
  eventType: CompetitorEventType;
  timestamp: number;
  correlationId?: string;
}

// Competitor added event
export interface ICompetitorAddedEvent extends ICompetitorEvent {
  eventType: CompetitorEventType.COMPETITOR_ADDED;
  competitorId: CompetitorID;
  name: string;
}

// Competitor updated event
export interface ICompetitorUpdatedEvent extends ICompetitorEvent {
  eventType: CompetitorEventType.COMPETITOR_UPDATED;
  competitorId: CompetitorID;
  updatedFields?: string[];
}

// Competitor removed event
export interface ICompetitorRemovedEvent extends ICompetitorEvent {
  eventType: CompetitorEventType.COMPETITOR_REMOVED;
  competitorId: CompetitorID;
}

// Feature comparison added event
export interface IFeatureComparisonAddedEvent extends ICompetitorEvent {
  eventType: CompetitorEventType.FEATURE_COMPARISON_ADDED;
  featureId: string;
  competitorId: string;
  category: FeatureCategory;
  isGap: boolean;
  isAdvantage: boolean;
}

// Feature comparison updated event
export interface IFeatureComparisonUpdatedEvent extends ICompetitorEvent {
  eventType: CompetitorEventType.FEATURE_COMPARISON_UPDATED;
  featureId: string;
  competitorId: string;
  isGap?: boolean;
  isAdvantage?: boolean;
}

// Benchmark report created event
export interface IBenchmarkReportCreatedEvent extends ICompetitorEvent {
  eventType: CompetitorEventType.BENCHMARK_REPORT_CREATED;
  benchmarkId: BenchmarkID;
  title: string;
  competitors: number;
}

// Benchmark report updated event
export interface IBenchmarkReportUpdatedEvent extends ICompetitorEvent {
  eventType: CompetitorEventType.BENCHMARK_REPORT_UPDATED;
  benchmarkId: BenchmarkID;
  updatedFields?: string[];
}

// Benchmark report published event
export interface IBenchmarkReportPublishedEvent extends ICompetitorEvent {
  eventType: CompetitorEventType.BENCHMARK_REPORT_PUBLISHED;
  benchmarkId: BenchmarkID;
  title: string;
  publishedBy?: string;
}

// Union type for all competitor events
export type CompetitorEvent = 
  | ICompetitorAddedEvent
  | ICompetitorUpdatedEvent
  | ICompetitorRemovedEvent
  | IFeatureComparisonAddedEvent
  | IFeatureComparisonUpdatedEvent
  | IBenchmarkReportCreatedEvent
  | IBenchmarkReportUpdatedEvent
  | IBenchmarkReportPublishedEvent;

// Helper functions to create events
export const createCompetitorAddedEvent = (
  competitorId: CompetitorID,
  name: string,
  correlationId?: string
): ICompetitorAddedEvent => ({
  eventType: CompetitorEventType.COMPETITOR_ADDED,
  timestamp: Date.now(),
  correlationId,
  competitorId,
  name
});

export const createCompetitorUpdatedEvent = (
  competitorId: CompetitorID,
  updatedFields?: string[],
  correlationId?: string
): ICompetitorUpdatedEvent => ({
  eventType: CompetitorEventType.COMPETITOR_UPDATED,
  timestamp: Date.now(),
  correlationId,
  competitorId,
  updatedFields
});

export const createFeatureComparisonAddedEvent = (
  featureId: string,
  competitorId: string,
  category: FeatureCategory,
  isGap: boolean,
  isAdvantage: boolean,
  correlationId?: string
): IFeatureComparisonAddedEvent => ({
  eventType: CompetitorEventType.FEATURE_COMPARISON_ADDED,
  timestamp: Date.now(),
  correlationId,
  featureId,
  competitorId,
  category,
  isGap,
  isAdvantage
});

export const createBenchmarkReportCreatedEvent = (
  benchmarkId: BenchmarkID,
  title: string,
  competitors: number,
  correlationId?: string
): IBenchmarkReportCreatedEvent => ({
  eventType: CompetitorEventType.BENCHMARK_REPORT_CREATED,
  timestamp: Date.now(),
  correlationId,
  benchmarkId,
  title,
  competitors
});

export const createBenchmarkReportPublishedEvent = (
  benchmarkId: BenchmarkID,
  title: string,
  publishedBy?: string,
  correlationId?: string
): IBenchmarkReportPublishedEvent => ({
  eventType: CompetitorEventType.BENCHMARK_REPORT_PUBLISHED,
  timestamp: Date.now(),
  correlationId,
  benchmarkId,
  title,
  publishedBy
});