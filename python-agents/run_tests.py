#!/usr/bin/env python3
"""
Test runner for the MercadoLivre AI Agent system
"""

import unittest
import sys
import os
import argparse

def run_tests(test_pattern=None, verbose=False):
    """
    Run all tests or tests matching a specific pattern
    
    Args:
        test_pattern: Optional pattern to match test files (e.g., 'diverse_persona')
        verbose: Whether to show detailed test output
    """
    # Set up test discovery
    test_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tests')
    
    # Create test loader
    loader = unittest.TestLoader()
    
    # Discover tests
    if test_pattern:
        pattern = f'test_{test_pattern}*.py'
    else:
        pattern = 'test_*.py'
    
    suite = loader.discover(test_dir, pattern=pattern)
    
    # Run tests
    verbosity = 2 if verbose else 1
    runner = unittest.TextTestRunner(verbosity=verbosity)
    result = runner.run(suite)
    
    # Return non-zero exit code if tests failed
    return 0 if result.wasSuccessful() else 1

if __name__ == '__main__':
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Run MercadoLivre AI Agent tests')
    parser.add_argument(
        '--pattern', '-p', 
        help='Pattern to match test files (e.g., "diverse_persona")'
    )
    parser.add_argument(
        '--verbose', '-v', 
        action='store_true', 
        help='Show detailed test output'
    )
    
    args = parser.parse_args()
    
    # Run tests
    sys.exit(run_tests(args.pattern, args.verbose))