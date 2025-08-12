/**
 * Data loading logic for refinement page
 * Validates session parameters and prepares page for loading
 */

import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, params }) => {
  // Get session ID from URL parameters
  const sessionId = url.searchParams.get('session');
  const source = url.searchParams.get('source') || 'direct-link';
  
  // Validate required parameters
  if (!sessionId) {
    throw error(400, {
      message: 'No image session provided',
      details: 'Please navigate to this page from the main application'
    });
  }
  
  // Return page data
  return {
    sessionId,
    source,
    timestamp: Date.now()
  };
};