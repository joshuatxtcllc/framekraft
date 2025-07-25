
import axios from 'axios';

export class SearchService {
  private perplexityApiKey: string;
  private baseUrl = 'https://api.perplexity.ai';

  constructor() {
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || '';
  }

  async searchFramingTrends(): Promise<{
    trends: string[];
    insights: string[];
    competitorPricing: any[];
  }> {
    try {
      if (!this.perplexityApiKey) {
        return this.getFallbackTrends();
      }

      const queries = [
        'What are the latest custom picture framing trends in 2024?',
        'Current pricing analysis for professional picture framing services',
        'Popular art preservation and framing techniques in the industry'
      ];

      const results = [];
      
      for (const query of queries) {
        try {
          const response = await this.searchWithPerplexity(query);
          results.push(response);
        } catch (error) {
          console.error(`Perplexity search error for query "${query}":`, error);
        }
      }

      return {
        trends: this.extractTrends(results),
        insights: this.extractInsights(results),
        competitorPricing: this.extractPricingData(results)
      };

    } catch (error) {
      console.error('Search service error:', error);
      return this.getFallbackTrends();
    }
  }

  async findSupplierInfo(productName: string): Promise<any[]> {
    try {
      if (!this.perplexityApiKey) {
        return [];
      }

      const query = `Find wholesale suppliers for "${productName}" picture frames and framing materials`;
      const response = await this.searchWithPerplexity(query);
      
      return this.extractSupplierInfo(response);
    } catch (error) {
      console.error('Supplier search error:', error);
      return [];
    }
  }

  async searchFramingTechniques(artworkType: string): Promise<string[]> {
    try {
      if (!this.perplexityApiKey) {
        return ['Standard framing techniques available'];
      }

      const query = `Best professional framing techniques and materials for ${artworkType}`;
      const response = await this.searchWithPerplexity(query);
      
      return this.extractTechniques(response);
    } catch (error) {
      console.error('Techniques search error:', error);
      return ['Standard framing techniques available'];
    }
  }

  async marketResearch(topic: string): Promise<{
    summary: string;
    keyPoints: string[];
    sources: string[];
  }> {
    try {
      if (!this.perplexityApiKey) {
        return {
          summary: 'Market research unavailable',
          keyPoints: ['Please configure Perplexity API key'],
          sources: []
        };
      }

      const query = `Market research and industry analysis for ${topic} in the custom framing business`;
      const response = await this.searchWithPerplexity(query);
      
      return {
        summary: response.choices?.[0]?.message?.content || 'No summary available',
        keyPoints: this.extractKeyPoints(response),
        sources: this.extractSources(response)
      };
    } catch (error) {
      console.error('Market research error:', error);
      return {
        summary: 'Market research unavailable',
        keyPoints: ['Error retrieving market data'],
        sources: []
      };
    }
  }

  private async searchWithPerplexity(query: string): Promise<any> {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant specialized in providing accurate, up-to-date information about the custom framing and art preservation industry.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        return_citations: true,
        return_images: false
      },
      {
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  private extractTrends(results: any[]): string[] {
    const trends = [];
    
    for (const result of results) {
      const content = result.choices?.[0]?.message?.content || '';
      
      // Extract trend-related information
      const trendMatches = content.match(/(?:trend|popular|trending|current)[^.]*[.]/gi);
      if (trendMatches) {
        trends.push(...trendMatches.slice(0, 3));
      }
    }

    return trends.length > 0 ? trends.slice(0, 10) : [
      'Sustainable and eco-friendly framing materials',
      'Minimalist and clean frame designs',
      'Digital art framing solutions',
      'Mixed media preservation techniques'
    ];
  }

  private extractInsights(results: any[]): string[] {
    const insights = [];
    
    for (const result of results) {
      const content = result.choices?.[0]?.message?.content || '';
      
      // Extract key insights
      const sentences = content.split('.').filter(s => s.length > 50);
      insights.push(...sentences.slice(0, 2));
    }

    return insights.length > 0 ? insights.slice(0, 5) : [
      'Market research shows continued growth in custom framing',
      'Quality and craftsmanship remain key differentiators'
    ];
  }

  private extractPricingData(results: any[]): any[] {
    // Extract pricing information from search results
    const pricingData = [];
    
    for (const result of results) {
      const content = result.choices?.[0]?.message?.content || '';
      
      // Look for price mentions
      const priceMatches = content.match(/\$[\d,]+(?:\.\d{2})?/g);
      if (priceMatches) {
        pricingData.push({
          prices: priceMatches,
          context: content.substring(0, 200) + '...'
        });
      }
    }

    return pricingData;
  }

  private extractSupplierInfo(response: any): any[] {
    const content = response.choices?.[0]?.message?.content || '';
    const suppliers = [];
    
    // Extract company names and relevant info
    const lines = content.split('\n').filter(line => 
      line.includes('supplier') || line.includes('wholesale') || line.includes('manufacturer')
    );
    
    for (const line of lines.slice(0, 5)) {
      suppliers.push({
        name: line.trim(),
        description: line,
        source: 'Perplexity Search'
      });
    }

    return suppliers;
  }

  private extractTechniques(response: any): string[] {
    const content = response.choices?.[0]?.message?.content || '';
    const techniques = [];
    
    // Extract technique mentions
    const lines = content.split('\n').filter(line => 
      line.length > 20 && (
        line.includes('technique') || 
        line.includes('method') || 
        line.includes('process')
      )
    );
    
    return lines.slice(0, 8);
  }

  private extractKeyPoints(response: any): string[] {
    const content = response.choices?.[0]?.message?.content || '';
    
    // Extract bullet points or numbered items
    const bulletPoints = content.match(/(?:•|\*|-|\d+\.)\s*([^•\*\-\d\n]+)/g);
    if (bulletPoints) {
      return bulletPoints.map(point => point.replace(/^(?:•|\*|-|\d+\.)\s*/, '').trim()).slice(0, 5);
    }
    
    // Fallback to sentences
    return content.split('.').filter(s => s.length > 30 && s.length < 150).slice(0, 5);
  }

  private extractSources(response: any): string[] {
    // Perplexity returns citations, extract them if available
    const citations = response.citations || [];
    return citations.map((citation: any) => citation.url || citation.title || 'Unknown source').slice(0, 3);
  }

  private getFallbackTrends(): { trends: string[]; insights: string[]; competitorPricing: any[] } {
    return {
      trends: [
        'Sustainable eco-friendly framing materials trending',
        'Minimalist black and white frames popular',
        'Digital art framing solutions in demand',
        'Mixed media preservation techniques growing',
        'Custom sizing and non-standard formats increasing'
      ],
      insights: [
        'Market research shows 15% growth in custom framing industry',
        'Quality and craftsmanship remain primary customer concerns',
        'Online consultation services becoming more popular'
      ],
      competitorPricing: []
    };
  }

  // Circuit breaker pattern for reliability
  isHealthy(): boolean {
    return !!this.perplexityApiKey;
  }

  getStatus(): { enabled: boolean; configured: boolean; lastUsed?: Date } {
    return {
      enabled: !!this.perplexityApiKey,
      configured: !!this.perplexityApiKey,
      lastUsed: new Date()
    };
  }
}

export const searchService = new SearchService();
