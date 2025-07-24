
import { google } from 'googleapis';

const customSearch = google.customsearch('v1');

export class SearchService {
  async searchFramingTrends(): Promise<{
    trends: string[];
    insights: string[];
    competitorPricing: any[];
  }> {
    try {
      const searchQueries = [
        'custom picture framing trends 2024',
        'picture frame pricing market analysis',
        'art preservation framing techniques'
      ];

      const results = [];
      
      for (const query of searchQueries) {
        const response = await customSearch.cse.list({
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: query,
          auth: process.env.GOOGLE_API_KEY,
          num: 5,
        });
        
        results.push(...(response.data.items || []));
      }

      return {
        trends: results.map(item => item.title || '').filter(Boolean).slice(0, 10),
        insights: results.map(item => item.snippet || '').filter(Boolean).slice(0, 5),
        competitorPricing: [] // Would need additional processing
      };

    } catch (error) {
      console.error('Search service error:', error);
      return {
        trends: ['Classic wood frames remain popular', 'Eco-friendly materials trending'],
        insights: ['Market research unavailable'],
        competitorPricing: []
      };
    }
  }

  async findSupplierInfo(productName: string): Promise<any[]> {
    try {
      const response = await customSearch.cse.list({
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        q: `"${productName}" picture frame supplier wholesale`,
        auth: process.env.GOOGLE_API_KEY,
        num: 3,
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Supplier search error:', error);
      return [];
    }
  }
}

export const searchService = new SearchService();
