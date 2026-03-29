import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SeoAnalyzerService } from './seo-analyzer.service';
import { ContentOptions, GeneratedContent } from '../models';
import { SearchService, ResearchData } from './search.service';
import { MultiAIProviderService } from './multi-ai-provider.service';
import { WordPressService } from './wordpress.service';
import { ServerlessService } from './serverless.service';

@Injectable({
  providedIn: 'root',
})
export class ContentGeneratorService {
  private groqApiKey: string = '';
  private geminiApiKey: string = '';
  private anthropicApiKey: string = '';
  private grokApiKey: string = '';
  private openaiApiKey: string = '';
  private mistralApiKey: string = '';
  private ollamaApiKey: string = '';
  private ollamaUrl: string = 'http://localhost:11434';
  private opencodeApiKey: string = '';
  private opencodeUrl: string = 'http://localhost:4096';
  private searchService: SearchService;

  private readonly MODEL_PRIORITY = {
    BEST: [
      { id: 'gemini-2.5-pro', provider: 'google', name: 'Gemini 2.5 Pro', hasWebSearch: false },
      { id: 'gemini-2.5-flash', provider: 'google', name: 'Gemini 2.5 Flash', hasWebSearch: false },
      { id: 'grok-3', provider: 'xai', name: 'Grok 3', hasWebSearch: true },
      { id: 'gpt-4o', provider: 'openai', name: 'GPT-4o', hasWebSearch: false },
    ],
    LOCAL: [
      { id: 'qwen3:8b', provider: 'ollama', name: 'Qwen 3 8B (Local)', hasWebSearch: false },
      {
        id: 'deepseek-coder-v2:16b',
        provider: 'ollama',
        name: 'DeepSeek Coder 16B (Local)',
        hasWebSearch: false,
      },
    ],
    GOOD: [
      {
        id: 'gemini-2.5-flash-lite',
        provider: 'google',
        name: 'Gemini 2.5 Flash Lite',
        hasWebSearch: false,
      },
      { id: 'gemini-2.0-flash', provider: 'google', name: 'Gemini 2.0 Flash', hasWebSearch: false },
      { id: 'gpt-4o-mini', provider: 'openai', name: 'GPT-4o Mini', hasWebSearch: false },
    ],
    FREE: [
      {
        id: 'gemini-2.5-flash',
        provider: 'google',
        name: 'Gemini 2.5 Flash (Free)',
        hasWebSearch: false,
      },
      {
        id: 'llama-3.3-70b-versatile',
        provider: 'groq',
        name: 'Llama 3.3 70B',
        hasWebSearch: false,
      },
      {
        id: 'mistral-large-latest',
        provider: 'mistral',
        name: 'Mistral Large',
        hasWebSearch: false,
      },
    ],
  };

  constructor(
    private seoAnalyzer: SeoAnalyzerService,
    private multiAI: MultiAIProviderService,
    private wordpress: WordPressService,
    private serverless: ServerlessService,
  ) {
    this.loadApiKeyFromSettings();
    this.searchService = new SearchService();
    this.checkOllamaConnection();
  }

  private async checkOllamaConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        const models = data.models?.map((m: any) => m.name) || [];
        console.log('Ollama connected! Available models:', models.join(', '));
        this.ollamaApiKey = 'local';
      }
    } catch (e) {
      console.log('Ollama not running on localhost:11434');
    }
    await this.checkOpenCodeConnection();
  }

  private async checkOpenCodeConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.opencodeUrl}/global/health`);
      if (response.ok) {
        const data = await response.json();
        console.log('OpenCode AI connected! Version:', data.version);
        this.opencodeApiKey = 'local';
      }
    } catch (e) {
      console.log('OpenCode not running on localhost:4096');
    }
  }

  private loadApiKeyFromSettings(): void {
    try {
      const settings = localStorage.getItem('wp_settings');
      if (settings) {
        const parsed = JSON.parse(settings);

        // Load all API keys directly
        if (parsed.ai?.geminiApiKey) {
          this.geminiApiKey = parsed.ai.geminiApiKey;
          console.log('Gemini API key loaded');
        }
        if (parsed.ai?.openaiApiKey) {
          this.openaiApiKey = parsed.ai.openaiApiKey;
          console.log('OpenAI API key loaded');
        }
        if (parsed.ai?.anthropicApiKey) {
          this.anthropicApiKey = parsed.ai.anthropicApiKey;
          console.log('Claude API key loaded');
        }
        if (parsed.ai?.groqApiKey) {
          this.groqApiKey = parsed.ai.groqApiKey;
          console.log('Groq API key loaded');
        }
        if (parsed.ai?.grokApiKey) {
          this.grokApiKey = parsed.ai.grokApiKey;
          console.log('Grok API key loaded');
        }
        if (parsed.ai?.mistralApiKey) {
          this.mistralApiKey = parsed.ai.mistralApiKey;
          console.log('Mistral API key loaded');
        }
        if (parsed.ai?.ollamaUrl) {
          this.ollamaUrl = parsed.ai.ollamaUrl;
        }
      }
    } catch (e) {
      console.log('Could not load API key from settings');
    }
  }

  updateApiKey(key: string): void {
    if (!key) {
      this.groqApiKey = '';
      this.geminiApiKey = '';
      this.anthropicApiKey = '';
      this.grokApiKey = '';
      this.openaiApiKey = '';
      this.mistralApiKey = '';
      return;
    }

    if (key.startsWith('gsk_')) {
      this.groqApiKey = key;
      console.log('Groq API key loaded:', key.substring(0, 10) + '...');
    } else if (key.startsWith('xai-')) {
      this.grokApiKey = key;
      console.log('Grok API key loaded:', key.substring(0, 10) + '...');
    } else if (key.startsWith('AIza')) {
      this.geminiApiKey = key;
      console.log('Gemini API key loaded');
    } else if (key.startsWith('sk-ant-')) {
      this.anthropicApiKey = key;
      console.log('Claude API key loaded');
    } else if (key.startsWith('sk-')) {
      this.openaiApiKey = key;
      console.log('OpenAI API key loaded');
    } else if (key.startsWith('mis')) {
      this.mistralApiKey = key;
      console.log('Mistral API key loaded');
    } else {
      console.log('No valid API key detected, using built-in generator');
      this.groqApiKey = '';
      this.geminiApiKey = '';
      this.anthropicApiKey = '';
      this.grokApiKey = '';
      this.openaiApiKey = '';
      this.mistralApiKey = '';
    }
  }

  getBestAvailableModel(): { id: string; provider: string; name: string; hasWebSearch: boolean } {
    const savedProvider = this.multiAI.getSelectedProvider();
    const savedModel = this.multiAI.getSelectedModel();
    console.log('=== GET BEST MODEL ===');
    console.log('Saved Provider:', savedProvider);
    console.log('Saved Model:', savedModel);

    // If user has selected a specific provider, use it
    if (savedProvider && savedProvider !== 'auto') {
      const provider = this.multiAI.getActiveProvider();
      if (provider) {
        const apiKey = this.multiAI.getApiKey(provider.id);
        console.log('Provider:', provider.name, '- API Key:', apiKey ? 'SET' : 'NOT SET');

        // Check if API key is required but not set
        if (provider.requiresApiKey && !apiKey) {
          console.log('Provider requires API key but none set - falling back');
        } else {
          // Use the selected model or first available model
          const model = provider.models.find((m) => m.id === savedModel) || provider.models[0];
          if (model) {
            console.log('Returning model:', model.name, 'from provider:', provider.id);
            return {
              id: model.id,
              provider: provider.id,
              name: model.name,
              hasWebSearch: false,
            };
          }
        }
      }
    }

    // Fallback chain - use any available API
    if (this.multiAI.getApiKey('google')) {
      console.log('Fallback: Using Google Gemini');
      return this.MODEL_PRIORITY.BEST[0];
    }
    if (this.multiAI.getApiKey('openai')) {
      console.log('Fallback: Using OpenAI');
      return this.MODEL_PRIORITY.BEST[2];
    }
    if (this.multiAI.getApiKey('xai')) {
      console.log('Fallback: Using Grok');
      return this.MODEL_PRIORITY.BEST[1];
    }
    if (this.ollamaApiKey) {
      console.log('Fallback: Using Ollama');
      return this.MODEL_PRIORITY.LOCAL[0];
    }
    if (this.multiAI.getApiKey('groq')) {
      console.log('Fallback: Using Groq');
      return this.MODEL_PRIORITY.FREE[0];
    }

    console.log('No API available - using local generator');
    return { id: 'fallback', provider: 'none', name: 'No API Key', hasWebSearch: false };
  }

  isOllamaAvailable(): boolean {
    return !!this.ollamaApiKey;
  }

  isOpenCodeAvailable(): boolean {
    return !!this.opencodeApiKey;
  }

  getOpenCodeUrl(): string {
    return this.opencodeUrl;
  }

  getAvailableOllamaModels(): string[] {
    return ['qwen3:8b', 'qwen2.5-coder:latest', 'deepseek-coder-v2:16b'];
  }

  getOllamaUrl(): string {
    return this.ollamaUrl;
  }

  generateContentWithLiveData(options: ContentOptions): Observable<GeneratedContent> {
    console.log('=== PARALLEL CONTENT GENERATION WITH LIVE DATA ===');
    console.log('Keyword:', options.keyword);

    this.searchService.updateApiKeys({ grokKey: this.multiAI.getApiKey('xai') });

    return this.searchService.researchTopic(options.keyword).pipe(
      switchMap((researchData: ResearchData) => {
        console.log('Research complete. Sources:', researchData.stats.sources.join(', '));
        console.log('Results found:', researchData.stats.totalResults);

        if (researchData.searchResults.length > 0) {
          console.log(
            'Sample results:',
            researchData.searchResults.slice(0, 3).map((r) => r.title),
          );
        }

        return this.generateFromResearch(options, researchData);
      }),
      catchError((err) => {
        console.log('Research failed, using standard generation:', err.message);
        return this.generateContent(options);
      }),
    );
  }

  private generateFromResearch(
    options: ContentOptions,
    researchData: ResearchData,
  ): Observable<GeneratedContent> {
    const keyword = options.keyword;
    const wordCount = options.wordCount;
    const bestModel = this.getBestAvailableModel();

    console.log('Using BEST MODEL:', bestModel.name, `(${bestModel.provider})`);

    if (researchData.searchResults.length > 0) {
      console.log('Generating article from LIVE DATA...');

      const facts = this.extractFacts(researchData.searchResults);
      const stats = this.extractStats(researchData.searchResults);
      const dates = this.extractDates(researchData.searchResults);

      const prompt = this.buildResearchBasedPrompt(
        keyword,
        wordCount,
        facts,
        stats,
        dates,
        researchData,
      );

      switch (bestModel.provider) {
        case 'opencode':
          return this.generateWithOpenCode(options);
        case 'xai':
          return this.generateWithGrokResearch(prompt, options);
        case 'openai':
          return this.generateWithOpenAIResearch(prompt, options);
        case 'ollama':
          return this.generateWithOllamaChat(options);
        case 'google':
          return this.generateWithGeminiResearch(prompt, options);
        case 'groq':
          return this.generateWithGroqResearch(prompt, options);
        case 'mistral':
          return this.generateWithMistralResearch(prompt, options);
        case 'anthropic':
          return this.generateWithClaudeResearch(prompt, options);
        default:
          if (this.opencodeApiKey) return this.generateWithOpenCode(options);
          if (this.ollamaApiKey) return this.generateWithOllamaChat(options);
          if (this.multiAI.getApiKey('groq')) return this.generateWithGroqResearch(prompt, options);
          if (this.multiAI.getApiKey('google'))
            return this.generateWithGeminiResearch(prompt, options);
          if (this.multiAI.getApiKey('xai')) return this.generateWithGrokResearch(prompt, options);
          if (this.multiAI.getApiKey('anthropic'))
            return this.generateWithClaudeResearch(prompt, options);
      }
    }

    console.log('No research data, falling back to standard generation');
    return this.generateContent(options);
  }

  private buildResearchBasedPrompt(
    keyword: string,
    wordCount: number,
    facts: string,
    stats: string,
    dates: string[],
    researchData: ResearchData,
  ): string {
    const datesStr = dates.length > 0 ? dates.join(', ') : 'Early 2026';

    const specsStr =
      researchData.specs && researchData.specs.length > 0
        ? '\n\nPRODUCT SPECIFICATIONS:\n' +
          researchData.specs
            .map(
              (s, i) =>
                `Product ${i + 1}: ${Object.entries(s)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ')}`,
            )
            .join('\n')
        : '';

    const imagesStr =
      researchData.images && researchData.images.length > 0
        ? '\n\nIMAGES FOR ARTICLE:\n' +
          researchData.images
            .slice(0, 5)
            .map((img, i) => `[image-${i + 1}]: ${img}`)
            .join('\n')
        : '';

    return `Write a comprehensive, SEO-optimized article about "${keyword}" based on VERIFIED LIVE DATA from 2026.

CURRENT DATE: March 29, 2026

VERIFIED FACTS FROM RECENT SOURCES:
${facts}

LATEST STATISTICS:
${stats || 'Statistics vary by source - use general industry knowledge'}

RECENT DEVELOPMENTS (${datesStr}):
${researchData.searchResults
  .slice(0, 5)
  .map((r, i) => `${i + 1}. ${r.title}: ${r.snippet}`)
  .join('\n')}
${specsStr}
${imagesStr}

CRITICAL RULES:
1. ONLY use facts from the provided verified data above
2. If you don't know something, say "According to recent sources..." and stay general
3. NEVER invent product names, prices, or specifications not in the data
4. Include the keyword "${keyword}" in the first sentence
5. Include "${keyword}" in at least 4 different H2 headings
6. Keyword density: 1.5-2.5%
7. Include specific product specifications, prices, and release dates where available
8. Add at least 2-3 relevant images using the provided image URLs: [image-1], [image-2], etc.

ARTICLE STRUCTURE (8-10 H2 SECTIONS):
- Introduction (keyword in first sentence, include main image)
- Product Overview / Key Features (with specs)
- Detailed Specifications (processor, display, camera, battery, etc.)
- Price and Availability
- Comparison with competitors
- Pros and Cons
- Verdict / Should You Buy
- FAQ section (5 questions)
- Conclusion

FORMAT: HTML with <h2>, <p>, <ul>, <li>, <img> tags.
Include images like: <img src="[image-1]" alt="${keyword}" style="max-width:100%;margin:20px 0;" />
Word count: ${wordCount}+ words.`;
  }

  private generateWithGrokResearch(
    prompt: string,
    options: ContentOptions,
  ): Observable<GeneratedContent> {
    const messages = [
      {
        role: 'system',
        content: `You are a senior tech journalist. You MUST only write facts that are verified in your provided data. Do NOT make up product names, prices, or specifications. Current date: March 25, 2026. Write naturally and engagingly.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    return this.serverless.generateWithGrok(messages, 'grok-3').pipe(
      map((data: any) => {
        if (data.choices?.[0]?.message?.content) {
          return this.processGeneratedContent(data.choices[0].message.content, options);
        } else {
          throw new Error(data.error?.message || 'Invalid response');
        }
      }),
      catchError((err) => {
        console.log('Grok: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private generateWithGroqResearch(
    prompt: string,
    options: ContentOptions,
  ): Observable<GeneratedContent> {
    const messages = [
      {
        role: 'system',
        content: `You are a senior tech journalist. You MUST only write facts that are verified in your provided data. Do NOT make up product names, prices, or specifications. Current date: March 25, 2026. Write naturally and engagingly.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    return this.serverless.generateWithGroq(messages, 'llama-3.3-70b-versatile').pipe(
      map((data: any) => {
        if (data.choices?.[0]?.message?.content) {
          return this.processGeneratedContent(data.choices[0].message.content, options);
        } else {
          throw new Error(data.error?.message || 'Invalid response');
        }
      }),
      catchError((err) => {
        console.log('Groq: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private generateWithClaudeResearch(
    prompt: string,
    options: ContentOptions,
  ): Observable<GeneratedContent> {
    const savedModel = this.multiAI.getSelectedModel();
    const provider = this.multiAI.getActiveProvider();
    const model = provider?.models.find((m) => m.id === savedModel) || provider?.models[0];
    const modelId = model?.id || 'claude-sonnet-4-5-20251120';

    const messages = [
      {
        role: 'user',
        content: `You are a senior tech journalist. You MUST only write facts that are verified in your provided data. Do NOT make up product names, prices, or specifications. Current date: March 2026. Write naturally and engagingly.\n\n${prompt}`,
      },
    ];

    return this.serverless.generateWithClaude(messages, modelId).pipe(
      map((data: any) => {
        if (data.content?.[0]?.text) {
          return this.processGeneratedContent(data.content[0].text, options);
        } else {
          throw new Error(data.error?.message || 'Invalid response');
        }
      }),
      catchError((err) => {
        console.log('Claude: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private generateWithOpenAIResearch(
    prompt: string,
    options: ContentOptions,
  ): Observable<GeneratedContent> {
    const messages = [
      {
        role: 'system',
        content: `You are a senior tech journalist. You MUST only write facts that are verified in your provided data. Do NOT make up product names, prices, or specifications. Current date: March 2026. Write naturally and engagingly.`,
      },
      { role: 'user', content: prompt },
    ];

    return this.serverless.generateWithOpenAI(messages, 'gpt-4o').pipe(
      map((data: any) => {
        if (data.choices?.[0]?.message?.content) {
          return this.processGeneratedContent(data.choices[0].message.content, options);
        } else {
          throw new Error(data.error?.message || 'Invalid response');
        }
      }),
      catchError((err) => {
        console.log('OpenAI: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private generateWithGeminiResearch(
    prompt: string,
    options: ContentOptions,
  ): Observable<GeneratedContent> {
    console.log('GEMINI: Making serverless API request...');

    const contents = [{ parts: [{ text: prompt }] }];

    return this.serverless.generateWithGemini(contents, 'gemini-2.5-flash', 0.5).pipe(
      map((data: any) => {
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return this.processGeneratedContent(data.candidates[0].content.parts[0].text, options);
        } else {
          throw new Error(data.error?.message || 'Invalid response');
        }
      }),
      catchError((err) => {
        console.log('Gemini: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private generateWithMistralResearch(
    prompt: string,
    options: ContentOptions,
  ): Observable<GeneratedContent> {
    const messages = [
      {
        role: 'system',
        content: `You are a senior tech journalist. You MUST only write facts that are verified in your provided data. Do NOT make up product names, prices, or specifications. Current date: March 2026. Write naturally and engagingly.`,
      },
      { role: 'user', content: prompt },
    ];

    return this.serverless.generateWithMistral(messages, 'mistral-large-latest').pipe(
      map((data: any) => {
        if (data.choices?.[0]?.message?.content) {
          return this.processGeneratedContent(data.choices[0].message.content, options);
        } else {
          throw new Error(data.error?.message || 'Invalid response');
        }
      }),
      catchError((err) => {
        console.log('Mistral: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private extractFacts(results: any[]): string {
    return results
      .slice(0, 10)
      .map((r, i) => `${i + 1}. ${r.snippet || r.description || ''}`)
      .join('\n');
  }

  private extractStats(results: any[]): string {
    const statRegex = /\d+(?:\.\d+)?%|\d+(?:\.\d+)?\s*(?:million|billion|thousand|x)/gi;
    const stats: string[] = [];

    for (const result of results) {
      const text = result.snippet || result.description || '';
      const matches = text.match(statRegex);
      if (matches) {
        stats.push(...matches.slice(0, 2));
      }
    }

    return [...new Set(stats)].slice(0, 10).join('\n');
  }

  private extractDates(results: any[]): string[] {
    const dateRegex =
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s*202[56]|\b(?:20[25]\d)[-\/]\d{2}[-\/]\d{2}\b/gi;
    const dates: string[] = [];

    for (const result of results) {
      const text =
        String(result.snippet || result.description || '') + ' ' + String(result.date || '');
      const matches = text.match(dateRegex);
      if (matches) {
        dates.push(...matches);
      }
    }

    return [...new Set(dates)].slice(0, 5);
  }

  generateContent(options: ContentOptions): Observable<GeneratedContent> {
    const bestModel = this.getBestAvailableModel();
    console.log('=== CONTENT GENERATION ===');
    console.log('Keyword:', options.keyword);
    console.log('Best Available Model:', bestModel.name, `(${bestModel.provider})`);
    console.log('Grok API Key:', this.multiAI.getApiKey('xai') ? 'SET' : 'NOT SET');
    console.log('Claude API Key:', this.multiAI.getApiKey('anthropic') ? 'SET' : 'NOT SET');
    console.log('OpenAI API Key:', this.multiAI.getApiKey('openai') ? 'SET' : 'NOT SET');
    console.log('Gemini API Key:', this.multiAI.getApiKey('google') ? 'SET' : 'NOT SET');
    console.log('Groq API Key:', this.multiAI.getApiKey('groq') ? 'SET' : 'NOT SET');
    console.log('Mistral API Key:', this.multiAI.getApiKey('mistral') ? 'SET' : 'NOT SET');
    console.log('OpenCode API:', this.opencodeApiKey ? 'CONNECTED' : 'NOT CONNECTED');

    switch (bestModel.provider) {
      case 'opencode':
        console.log('Using OpenCode AI (LOCAL) for content generation...');
        return this.generateWithOpenCode(options).pipe(
          catchError(() => {
            console.log('OpenCode failed, falling back...');
            return this.fallbackToOtherAPIs(options);
          }),
        );
      case 'xai':
        console.log('Using Grok 3 (BEST) for content generation...');
        return this.generateWithGrok(options).pipe(
          catchError((err) => {
            console.log('Grok Error:', err.message);
            return this.fallbackToOtherAPIs(options);
          }),
        );
      case 'openai':
        console.log('Using GPT-4o (BEST) for content generation...');
        return this.generateWithOpenAI(options).pipe(
          catchError(() => {
            console.log('GPT-4o failed, falling back...');
            return this.fallbackToOtherAPIs(options);
          }),
        );
      case 'ollama':
        console.log('Using Ollama (LOCAL) for content generation...');
        return this.generateWithOllama(options).pipe(
          catchError(() => {
            console.log('Ollama failed, falling back...');
            return this.fallbackToOtherAPIs(options);
          }),
        );
      case 'google':
        console.log('Using Gemini 2.0 Flash (BEST FREE) for content generation...');
        return this.generateWithGemini(options).pipe(
          catchError(() => {
            console.log('Gemini failed, falling back...');
            return this.fallbackToOtherAPIs(options);
          }),
        );
      case 'groq':
        console.log('Using Llama 3.3 70B (FREE) for content generation...');
        return this.generateWithGroq(options).pipe(
          catchError(() => {
            console.log('Groq failed, falling back...');
            return this.generateLocally(options);
          }),
        );
      case 'mistral':
        console.log('Using Mistral Large for content generation...');
        return this.generateWithMistral(options).pipe(
          catchError(() => {
            console.log('Mistral failed, falling back...');
            return this.generateLocally(options);
          }),
        );
      case 'anthropic':
        console.log('Using Claude for content generation...');
        return this.generateWithClaude(options).pipe(
          catchError((err) => {
            console.log('Claude Error:', err.message);
            return this.generateLocally(options);
          }),
        );
      default:
        console.log('Using built-in generator (no API key)');
        return this.generateLocally(options);
    }
  }

  private generateWithOpenAI(options: ContentOptions): Observable<GeneratedContent> {
    const keyword = options.keyword;
    const wordCount = options.wordCount;
    const tone = options.tone || 'professional';

    const prompt = `Write a complete, high-quality, SEO-optimized article about "${keyword}". 

Requirements:
- Word count: ${wordCount}+ words
- Tone: ${tone}, natural, conversational
- Structure: 6-8 detailed H2 sections with substantial paragraphs
- Include bullet points for key takeaways
- SEO: Include keyword "${keyword}" naturally in first 100 words, 1.5-2.5% density throughout
- Include FAQ section for featured snippets optimization
- MUST include actual examples and practical advice

Format output with HTML tags: <h2>, <p>, <ul>, <li> only.
Start directly with the article content. No preamble.`;

    const messages = [
      {
        role: 'system',
        content: `You are a senior tech journalist at a major publication. You write detailed, engaging articles that rank well in search engines. Current date: March 2026.`,
      },
      { role: 'user', content: prompt },
    ];

    return this.serverless.generateWithOpenAI(messages, 'gpt-4o').pipe(
      map((data: any) => {
        if (data.choices?.[0]?.message?.content) {
          return this.processGeneratedContent(data.choices[0].message.content, options);
        } else {
          throw new Error(data.error?.message || 'Invalid response');
        }
      }),
      catchError((err) => {
        console.log('OpenAI: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private generateWithOpenCode(options: ContentOptions): Observable<GeneratedContent> {
    const keyword = options.keyword;
    const wordCount = options.wordCount;
    const tone = options.tone || 'professional';

    const prompt = `You are a professional SEO content writer. Write a comprehensive, well-structured article about "${keyword}".

Requirements:
- Minimum ${wordCount} words
- Include the keyword "${keyword}" naturally in the first 100 words
- Use keyword 4-6 times throughout (1.5-2.5% density)
- Structure: Introduction, 6-8 detailed H2 sections, FAQ section, Conclusion
- Include practical examples and actionable advice
- Add bullet points for key takeaways in each section
- Write in a ${tone}, engaging tone

Format with HTML tags ONLY: <h2>, <p>, <ul>, <li>
Start immediately with the article content. No preamble or explanation.

IMPORTANT: Return ONLY the article content in HTML format.`;

    return new Observable((observer) => {
      const sessionId = `article_${Date.now()}`;

      fetch(`${this.opencodeUrl}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
        .then((res) => res.json())
        .then((session) => {
          const actualSessionId = session.id || session.ID || sessionId;

          return fetch(`${this.opencodeUrl}/session/${actualSessionId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parts: [{ type: 'text', text: prompt }],
            }),
          });
        })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`OpenCode API Error: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          let content = '';

          if (data.parts && Array.isArray(data.parts)) {
            for (const part of data.parts) {
              if (part.type === 'text' && part.text) {
                content += part.text;
              }
            }
          }

          if (!content && data.content) {
            content =
              typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
          }

          if (!content && data.message?.content) {
            content = data.message.content;
          }

          if (!content) {
            content = data.response || data.text || data.message || '';
          }

          if (content) {
            const processed = this.processGeneratedContent(content, options);
            observer.next(processed);
            observer.complete();
          } else {
            console.log('OpenCode response:', JSON.stringify(data).substring(0, 500));
            throw new Error('Empty response from OpenCode');
          }
        })
        .catch((err) => {
          console.error('OpenCode generation error:', err);
          observer.error(err);
        });
    });
  }

  private generateWithOllama(options: ContentOptions): Observable<GeneratedContent> {
    const keyword = options.keyword;
    const wordCount = options.wordCount;
    const tone = options.tone || 'professional';

    const systemPrompt = `You are a professional content writer specializing in SEO-optimized articles. You write detailed, well-structured articles that rank well in search engines. Current date: March 2026.

Guidelines:
- Write comprehensive articles with 6-8 H2 sections
- Include the focus keyword naturally in the first paragraph (1.5-2.5% density)
- Add bullet points for key takeaways
- Include an FAQ section at the end
- Format with HTML tags: <h2>, <p>, <ul>, <li>
- Write in a ${tone} tone
- Never invent facts - only write what you know well`;

    const prompt = `Write a comprehensive SEO-optimized article about "${keyword}".

Requirements:
- Minimum ${wordCount} words
- Include the keyword "${keyword}" naturally in the first 100 words
- Use keyword 4-6 times throughout the article
- Structure: Introduction, 6-8 detailed H2 sections, FAQ, Conclusion
- Include practical examples and actionable advice
- Add bullet points for key takeaways in each section

Format output with HTML tags only: <h2>, <p>, <ul>, <li>
Start immediately with the article content. No preamble or explanation.`;

    return new Observable((observer) => {
      fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3:8b',
          prompt: prompt,
          system: systemPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 8192,
          },
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Ollama Error: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.response) {
            const processed = this.processGeneratedContent(data.response, options);
            observer.next(processed);
            observer.complete();
          } else {
            throw new Error('Invalid Ollama response');
          }
        })
        .catch((err) => {
          console.error('Ollama generation error:', err);
          observer.error(err);
        });
    });
  }

  private generateWithOllamaChat(options: ContentOptions): Observable<GeneratedContent> {
    const keyword = options.keyword;
    const wordCount = options.wordCount;
    const tone = options.tone || 'professional';

    const prompt = `Write a comprehensive SEO-optimized article about "${keyword}".

Requirements:
- Minimum ${wordCount} words
- Include the keyword "${keyword}" naturally in the first 100 words
- Use keyword 4-6 times throughout the article
- Structure: Introduction, 6-8 detailed H2 sections, FAQ, Conclusion
- Include practical examples and actionable advice
- Add bullet points for key takeaways in each section

Format output with HTML tags only: <h2>, <p>, <ul>, <li>
Start immediately with the article content. No preamble or explanation.`;

    return new Observable((observer) => {
      fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3:8b',
          messages: [
            {
              role: 'system',
              content: `You are a professional content writer specializing in SEO-optimized articles. Write detailed, well-structured articles. Format with HTML tags: <h2>, <p>, <ul>, <li>. Tone: ${tone}.`,
            },
            { role: 'user', content: prompt },
          ],
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 8192,
          },
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Ollama Error: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.message?.content) {
            const processed = this.processGeneratedContent(data.message.content, options);
            observer.next(processed);
            observer.complete();
          } else {
            throw new Error('Invalid Ollama response');
          }
        })
        .catch((err) => {
          console.error('Ollama chat error:', err);
          observer.error(err);
        });
    });
  }

  private generateWithMistral(options: ContentOptions): Observable<GeneratedContent> {
    const keyword = options.keyword;
    const wordCount = options.wordCount;
    const tone = options.tone || 'professional';

    const prompt = `Write a complete, high-quality, SEO-optimized article about "${keyword}". 

Requirements:
- Word count: ${wordCount}+ words
- Tone: ${tone}, natural, conversational
- Structure: 6-8 detailed H2 sections with substantial paragraphs
- Include bullet points for key takeaways
- SEO: Include keyword "${keyword}" naturally in first 100 words, 1.5-2.5% density throughout
- Include FAQ section for featured snippets optimization
- MUST include actual examples and practical advice

Format output with HTML tags: <h2>, <p>, <ul>, <li> only.
Start directly with the article content. No preamble.`;

    const messages = [
      {
        role: 'system',
        content: `You are a senior tech journalist at a major publication. You write detailed, engaging articles that rank well in search engines. Current date: March 2026.`,
      },
      { role: 'user', content: prompt },
    ];

    return this.serverless.generateWithMistral(messages, 'mistral-large-latest').pipe(
      map((data: any) => {
        if (data.choices?.[0]?.message?.content) {
          return this.processGeneratedContent(data.choices[0].message.content, options);
        } else {
          throw new Error(data.error?.message || 'Invalid response');
        }
      }),
      catchError((err) => {
        console.log('Mistral: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private fallbackToOtherAPIs(options: ContentOptions): Observable<GeneratedContent> {
    if (this.multiAI.getApiKey('openai')) {
      return this.generateWithOpenAI(options).pipe(
        catchError(() => {
          console.log('GPT-4o failed, trying Gemini...');
          return this.generateWithGemini(options).pipe(
            catchError(() => {
              console.log('Gemini failed, trying Groq...');
              return this.generateWithGroq(options).pipe(
                catchError(() => {
                  console.log('All APIs failed, using local generator');
                  return this.generateLocally(options);
                }),
              );
            }),
          );
        }),
      );
    }
    return this.generateWithGemini(options).pipe(
      catchError(() => {
        return this.generateWithClaude(options).pipe(
          catchError(() => this.generateLocally(options)),
        );
      }),
    );
  }

  generateViralTechContent(
    keyword: string,
    wordCount: number = 1500,
  ): Observable<GeneratedContent> {
    const viralPrompt = `Write a viral tech article about "${keyword}" that will rank #1 on Google in 2026.

CRITICAL SEO & WRITING RULES - FOLLOW THESE EXACTLY:
1. NEVER use these phrases: "in today's world", "it's worth mentioning", "let's dive deep", "the bottom line", "at the end of the day", "leveraging", "cutting-edge", "game-changer", "revolutionary"
2. NEVER start paragraphs with "Furthermore", "Moreover", "Additionally", "In conclusion", "It's important to"
3. NEVER use filler phrases - get to the point immediately
4. Use contractions freely (don't, can't, it's, we've, I've)
5. Mix sentence lengths - some short, some long
6. Write like a real journalist or tech reviewer, not a robot
7. MUST include the keyword "${keyword}" in the FIRST SENTENCE of the first paragraph
8. MUST include "${keyword}" in at least 4 different H2 headings
9. MUST include 3-5 internal links: [internal-link: related-topic]
10. MUST include 3-5 external links to authoritative sources: [external-link: source-name]

ARTICLE STRUCTURE (MINIMUM 6 H2 HEADINGS):
- H2 heading 1: Must contain "${keyword}"
- H2 heading 2: Must contain "${keyword}"
- H2 heading 3: Must contain "${keyword}"
- H2 heading 4: Can be related topic
- H2 heading 5: Can be related topic
- H2 heading 6: Conclusion/FAQ style
- First paragraph must hook the reader - include keyword in first sentence
- Include real statistics, dates, and specific product names from 2025-2026
- Bullet points only when listing practical items
- End with a thought-provoking question or call-to-action

SEO REQUIREMENTS:
- ${keyword} in the first 50 words (MANDATORY)
- Keyword density: 1.5-2% throughout article
- ${keyword} in at least 4 H2 headings (MANDATORY)
- Use ${keyword} variations naturally in text
- Meta description will be auto-generated
- Include FAQ schema ready content

Word count: ${wordCount}+ words
Format: HTML only with <h2>, <p>, <ul>, <li>, <strong> tags`;

    if (this.multiAI.getApiKey('xai')) {
      return this.generateWithGrokViral(keyword, viralPrompt, wordCount);
    }
    if (this.multiAI.getApiKey('anthropic')) {
      return this.generateWithClaudeViral(keyword, viralPrompt, wordCount);
    }
    if (this.multiAI.getApiKey('groq')) {
      return this.generateWithGroqViral(keyword, viralPrompt, wordCount);
    }
    if (this.multiAI.getApiKey('google')) {
      return this.generateWithGeminiViral(keyword, viralPrompt, wordCount);
    }
    return this.generateViralTechLocally(keyword, wordCount);
  }

  private generateWithGrokViral(
    keyword: string,
    prompt: string,
    wordCount: number,
  ): Observable<GeneratedContent> {
    const messages = [
      {
        role: 'system',
        content: `You are a senior tech journalist at a major publication like The Verge, TechCrunch, or Wired. You've been writing about technology for 10+ years. Your articles are known for being:
- Sharp and opinionated, not wishy-washy
- Full of specific details, names, dates, prices
- Written in a voice that sounds like you, not generic
- Structured for both readers and search engines
- Controversial take when warranted (but backed by facts)
- Always up-to-date with 2025-2026 technology trends

You NEVER sound like an AI. You sound like a experienced human writer who knows their stuff.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    return this.serverless.generateWithGrok(messages, 'grok-3').pipe(
      map((data: any) => {
        if (data.choices?.[0]?.message?.content) {
          return this.processViralContent(data.choices[0].message.content, keyword, wordCount);
        } else {
          throw new Error(data.error?.message || 'Invalid Grok response');
        }
      }),
      catchError((err) => {
        console.log('Grok Viral: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private generateWithGrok(options: ContentOptions): Observable<GeneratedContent> {
    console.log('GROK: Making serverless API request');
    const keyword = options.keyword;
    const wordCount = options.wordCount;

    const prompt = `Write a complete, high-quality, SEO-optimized article about "${keyword}". 

CRITICAL: You MUST use real-time web search to get the LATEST and MOST ACCURATE information about "${keyword}". Do NOT make up product names, specifications, dates, or prices. Only include information you find from web search.

Requirements:
- Word count: ${wordCount}+ words
- Tone: Natural, conversational, human-like writing
- Structure: 6-8 detailed H2 sections with substantial paragraphs
- Include bullet points for key takeaways
- SEO: Include keyword "${keyword}" naturally in first 100 words, 1.5-2.5% density throughout
- Include FAQ section for featured snippets optimization
- MUST include actual dates, prices, and specifications from web search

Format output with HTML tags: <h2>, <p>, <ul>, <li> only.
Start directly with the article content. No preamble.`;

    const messages = [
      {
        role: 'system',
        content:
          'You are a senior tech journalist. You MUST search the web for real-time information before writing. NEVER hallucinate product names, specs, prices, or dates. Only write facts you find from web search. Current date: March 25, 2026.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    return this.serverless.generateWithGrok(messages, 'grok-3').pipe(
      map((data: any) => {
        if (data.choices?.[0]?.message?.content) {
          return this.processGeneratedContent(data.choices[0].message.content, options);
        } else {
          throw new Error(data.error?.message || 'Invalid Grok response');
        }
      }),
      catchError((err) => {
        console.log('Grok: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private generateWithGroqViral(
    keyword: string,
    prompt: string,
    wordCount: number,
  ): Observable<GeneratedContent> {
    const messages = [
      {
        role: 'system',
        content: `You are a senior tech journalist at a major publication like The Verge, TechCrunch, or Wired. You've been writing about technology for 10+ years. Your articles are known for being:
- Sharp and opinionated, not wishy-washy
- Full of specific details, names, dates, prices
- Written in a voice that sounds like you, not generic
- Structured for both readers and search engines
- Controversial take when warranted (but backed by facts)
- Always up-to-date with 2025-2026 technology trends

You NEVER sound like an AI. You sound like a experienced human writer who knows their stuff.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    return this.serverless.generateWithGroq(messages, 'llama-3.3-70b-versatile').pipe(
      map((data: any) => {
        if (data.choices?.[0]?.message?.content) {
          return this.processViralContent(data.choices[0].message.content, keyword, wordCount);
        } else {
          throw new Error(data.error?.message || 'Invalid response');
        }
      }),
      catchError((err) => {
        console.log('Groq Viral: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private generateWithGeminiViral(
    keyword: string,
    prompt: string,
    wordCount: number,
  ): Observable<GeneratedContent> {
    const contents = [{ parts: [{ text: prompt }] }];

    return this.serverless.generateWithGemini(contents, 'gemini-2.5-flash', 0.85).pipe(
      map((data: any) => {
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return this.processViralContent(
            data.candidates[0].content.parts[0].text,
            keyword,
            wordCount,
          );
        } else {
          throw new Error(data.error?.message || 'Invalid response');
        }
      }),
      catchError((err) => {
        console.log('Gemini Viral: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private generateWithClaudeViral(
    keyword: string,
    prompt: string,
    wordCount: number,
  ): Observable<GeneratedContent> {
    const messages = [{ role: 'user', content: prompt }];

    return this.serverless.generateWithClaude(messages, 'claude-sonnet-4-5-20251120', 10000).pipe(
      map((data: any) => {
        if (data.content?.[0]?.text) {
          return this.processViralContent(data.content[0].text, keyword, wordCount);
        } else {
          throw new Error(data.error?.message || 'Invalid Claude response');
        }
      }),
      catchError((err) => {
        console.log('Claude Viral: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private generateViralTechLocally(
    keyword: string,
    wordCount: number,
  ): Observable<GeneratedContent> {
    const sections = this.generateViralSections(keyword, wordCount);
    const title = this.generateViralTitle(keyword);
    const metaDesc = this.generateMetaDescription(keyword, sections);

    let content = `<h2>${title.replace(/<[^>]+>/g, '')}</h2>\n\n${sections}`;
    content = this.addInternalLinks(content, keyword);
    content = this.addExternalLinks(content);

    return of({
      title,
      content,
      metaDescription: metaDesc,
      focusKeyword: keyword,
      suggestedTags: this.generateViralTags(keyword),
      featuredImage: null,
      contentImages: [],
      images: [],
      specs: [],
    });
  }

  private generateViralSections(keyword: string, wordCount: number): string {
    const templates = this.getViralSectionTemplates(keyword);
    const sectionCount = Math.max(6, Math.floor(wordCount / 200));
    let sections = '';

    for (let i = 0; i < sectionCount; i++) {
      const template = templates[i % templates.length];
      sections += '\n\n' + template;
    }

    return sections;
  }

  private getViralSectionTemplates(keyword: string): string[] {
    return [
      `<h2>${keyword} - What You Need to Know</h2>

<p>${keyword} has become one of the most talked-about topics in technology today. Whether you're a tech enthusiast or just someone curious about what's new, understanding ${keyword} is becoming increasingly important.</p>

<p>This comprehensive guide breaks down everything you need to know about ${keyword}, from the basics to advanced insights. Let's dive right in.</p>`,

      `<h2>Understanding ${keyword}: The Fundamentals</h2>

<p>At its core, ${keyword} represents a significant shift in how we approach technology. Understanding the fundamentals is essential before diving deeper into specific applications and use cases.</p>

<p>The key principles behind ${keyword} include:</p>
<ul>
<li>User-centered design that prioritizes real-world needs</li>
<li>Seamless integration with existing workflows</li>
<li>Continuous improvement based on user feedback</li>
<li>Accessibility across multiple platforms and devices</li>
</ul>

<p>These fundamentals explain why ${keyword} has gained such traction in recent months.</p>`,

      `<h2>The Benefits of ${keyword}</h2>

<p>Why should you care about ${keyword}? The benefits are substantial and wide-ranging:</p>

<ul>
<li><strong>Efficiency</strong>: Streamlined processes save valuable time</li>
<li><strong>Cost-effective</strong>: Reduces overhead in multiple areas</li>
<li><strong>Scalability</strong>: Grows with your needs</li>
<li><strong>Innovation</strong>: Opens doors to new possibilities</li>
</ul>

<p>These advantages explain why adoption continues to accelerate across industries.</p>`,

      `<h2>Common Challenges and How to Overcome Them</h2>

<p>Like any technology, ${keyword} comes with its own set of challenges:</p>

<p><strong>The Learning Curve</strong>: Getting started can feel overwhelming. Solution: Start with basic features and gradually expand your knowledge.</p>

<p><strong>Integration Issues</strong>: Connecting with existing systems isn't always smooth. Solution: Take advantage of documentation and community support.</p>

<p><strong>Privacy Concerns</strong>: Data security is a valid concern. Solution: Research the platform's security measures and best practices.</p>`,

      `<h2>Getting Started With ${keyword}</h2>

<p>Ready to explore ${keyword}? Here's how to begin:</p>

<ol>
<li>Research the basics and understand what ${keyword} does</li>
<li>Identify your specific use case or goal</li>
<li>Start with free trials or basic tiers if available</li>
<li>Join communities and forums for support</li>
<li>Practice regularly to build proficiency</li>
</ol>

<p>Remember: everyone starts somewhere. The key is consistent learning and application.</p>`,

      `<h2>The Future of ${keyword}</h2>

<p>What does the future hold for ${keyword}? Industry experts predict continued growth and innovation. Key trends include improved accessibility, better integration capabilities, and more competitive pricing as the market matures.</p>

<p>For those invested in ${keyword}, the trajectory looks promising. The technology continues to evolve, offering new features and capabilities that expand its utility.</p>`,

      `<h2>Is ${keyword} Right for You?</h2>

<p>The decision to adopt ${keyword} depends on your specific needs and circumstances. Consider these factors:</p>

<ul>
<li>Do you have a genuine need that ${keyword} addresses?</li>
<li>Can you dedicate time to learning the system?</li>
<li>Does the investment align with your budget?</li>
<li>Are you prepared for the initial adjustment period?</li>
</ul>

<p>If you answered yes to these questions, ${keyword} might be worth exploring further.</p>`,

      `<h2>Final Thoughts on ${keyword}</h2>

<p>${keyword} represents an important development in technology that's worth understanding. Whether you decide to adopt it or not, being informed about ${keyword} helps you make better decisions about your tech stack.</p>

<p>The technology landscape continues to evolve rapidly. Staying curious and open-minded about developments like ${keyword} positions you well for the future.</p>`,
    ];
  }

  private generateViralTitle(keyword: string): string {
    const templates = [
      `${this.capitalize(keyword)}: The Complete Breakdown Nobody Asked For`,
      `${this.capitalize(keyword)} - What Actually Works in 2026`,
      `I Tested ${this.capitalize(keyword)} for 30 Days: Here's the Truth`,
      `The Ultimate ${this.capitalize(keyword)} Guide (Based on Real Testing)`,
      `${this.capitalize(keyword)} Review: Brutally Honest Assessment`,
      `Why ${this.capitalize(keyword)} Might Actually Be Worth It`,
      `${this.capitalize(keyword)} vs The Competition: Real Differences`,
      `Everything Wrong With ${this.capitalize(keyword)} (And How to Fix It)`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateMetaDescription(keyword: string, content: string): string {
    const plainText = content.replace(/<[^>]*>/g, '').substring(0, 150);
    const sentences = plainText.split('.');
    let meta = '';

    for (const sentence of sentences) {
      if ((meta + sentence).length < 155) {
        meta += (meta ? '. ' : '') + sentence;
      } else {
        break;
      }
    }

    if (!meta.toLowerCase().includes(keyword.toLowerCase())) {
      meta = `${keyword}: ` + meta;
    }

    return meta.substring(0, 160).trim() + '...';
  }

  private addInternalLinks(content: string, keyword: string): string {
    const internalLinkPlaceholders = content.match(/\[internal-link: [^\]]+\]/g) || [];
    let linkCount = 0;

    for (const placeholder of internalLinkPlaceholders) {
      const topic = placeholder.match(/\[internal-link: ([^\]]+)\]/)?.[1] || 'related-topic';
      const slug = topic.toLowerCase().replace(/\s+/g, '-');
      const link = `<a href="https://dastgeertech.studio/${slug}">${topic}</a>`;
      content = content.replace(placeholder, link);
      linkCount++;
      if (linkCount >= 3) break;
    }

    return content;
  }

  private addExternalLinks(content: string): string {
    const sources = [
      { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Main_Page' },
      { name: 'TechCrunch', url: 'https://techcrunch.com' },
      { name: 'The Verge', url: 'https://www.theverge.com' },
      { name: 'Wired', url: 'https://www.wired.com' },
      { name: 'Ars Technica', url: 'https://arstechnica.com' },
    ];

    const externalLinkPlaceholders = content.match(/\[external-link: [^\]]+\]/g) || [];
    let sourceIndex = 0;

    for (const placeholder of externalLinkPlaceholders) {
      const sourceName =
        placeholder.match(/\[external-link: ([^\]]+)\]/)?.[1] ||
        sources[sourceIndex % sources.length].name;
      const source =
        sources.find((s) => s.name.toLowerCase().includes(sourceName.toLowerCase())) ||
        sources[sourceIndex % sources.length];
      const link = `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${sourceName}</a>`;
      content = content.replace(placeholder, link);
      sourceIndex++;
      if (sourceIndex >= 3) break;
    }

    return content;
  }

  private generateViralTags(keyword: string): string[] {
    const baseTags = [
      keyword,
      this.capitalize(keyword),
      'technology',
      'tech news',
      '2026 tech',
      'product review',
      'buying guide',
      'tech tips',
    ];

    const words = keyword.toLowerCase().split(/\s+/);
    if (words.length > 1) {
      baseTags.push(words[0], words[words.length - 1]);
    }

    return [...new Set(baseTags)].slice(0, 8);
  }

  private processViralContent(
    content: string,
    keyword: string,
    wordCount: number,
  ): GeneratedContent {
    let title = '';

    const h2Matches = content.match(/<h2[^>]*>([^<]+)<\/h2>/gi);
    if (h2Matches && h2Matches.length > 0) {
      const firstH2 = h2Matches[0].replace(/<[^>]*>/g, '').trim();
      if (firstH2.length > 10 && firstH2.length < 70) {
        title = firstH2;
      }
    }

    if (!title) {
      title = this.generateViralTitle(keyword);
    }

    content = this.addInternalLinks(content, keyword);
    content = this.addExternalLinks(content);

    const metaDescription = this.seoAnalyzer.generateMetaDescription(content, keyword, 155);

    return {
      title,
      content,
      metaDescription,
      focusKeyword: keyword,
      suggestedTags: this.generateViralTags(keyword),
      featuredImage: null,
      contentImages: [],
      images: [],
      specs: [],
    };
  }

  private generateWithGroq(options: ContentOptions): Observable<GeneratedContent> {
    console.log('GROQ: Making serverless API request');
    const keyword = options.keyword;
    const wordCount = options.wordCount;

    const prompt = `Write a complete, high-quality, SEO-optimized article about "${keyword}". 

IMPORTANT: If you do not know verified facts about "${keyword}" (exact specs, prices, release dates, processor names), use GENERAL technology knowledge for the "${keyword}" topic. Do NOT invent fake product names like "Exynos 1680" or fake launch dates. Write about the topic with accurate, general knowledge available up to your knowledge cutoff.

CRITICAL SEO REQUIREMENTS FOR 100 SCORE:
1. Include "${keyword}" in the FIRST SENTENCE of the first paragraph
2. Include "${keyword}" in at least 4 different H2 headings
3. Keyword density must be 1.5-2.5% throughout
4. Include 3-5 external links to authoritative sources
5. Include 2-3 internal links to related articles
6. Add a FAQ section at the end with 5 questions
7. Meta description should be auto-generated

ARTICLE STRUCTURE (8-10 H2 HEADINGS):
- Introduction with keyword in first sentence
- Section with keyword in H2
- Section with keyword in H2
- Section with keyword in H2
- Related topic section
- Practical tips/actionable advice
- Comparison or analysis section
- FAQ section (5 questions)
- Conclusion with call-to-action

Requirements:
- Word count: ${wordCount}+ words
- Tone: Natural, conversational, human-like writing
- Include bullet points for key takeaways
- Use contractions freely
- Mix short and long sentences

Format output with HTML tags: <h2>, <p>, <ul>, <li> only.
Start directly with the article content. No preamble.`;

    const messages = [
      {
        role: 'system',
        content:
          'You are a tech journalist. IMPORTANT: If you do not have verified information about specific products (processors, phone models, etc.), write using general industry knowledge. NEVER make up fake specs like "Exynos 1680" or fake dates like "March 2026". Use facts you know for certain. Current date context: March 2026.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    return this.serverless.generateWithGroq(messages, 'llama-3.3-70b-versatile').pipe(
      map((data: any) => {
        if (data.choices?.[0]?.message?.content) {
          return this.processGeneratedContent(data.choices[0].message.content, options);
        } else {
          throw new Error(data.error?.message || 'Invalid Groq response');
        }
      }),
      catchError((err) => {
        console.log('Groq: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private generateWithGemini(options: ContentOptions): Observable<GeneratedContent> {
    const keyword = options.keyword;
    const wordCount = options.wordCount;
    const tone = this.getToneDescription(options.tone);

    const prompt = `Write a complete ${wordCount}+ word article about "${keyword}". 

Requirements:
- Tone: ${tone}
- Natural human-like writing, not robotic
- 6-8 H2 sections with detailed paragraphs
- Include bullet points
- SEO optimized with keyword "${keyword}"

IMPORTANT: Include image placeholders in your article using this format:
[featured-image: ${keyword} hero image]
[intro-image: ${keyword} related image]
[product-image: ${keyword} product/feature image]

Add these placeholders naturally in relevant sections.

Format with HTML tags: <h2>, <p>, <ul>, <li> tags.`;

    const contents = [{ parts: [{ text: prompt }] }];

    return this.serverless.generateWithGemini(contents, 'gemini-2.5-flash', 0.9).pipe(
      map((data: any) => {
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return this.processGeneratedContent(data.candidates[0].content.parts[0].text, options);
        } else {
          throw new Error(data.error?.message || 'Invalid response');
        }
      }),
      catchError((err) => {
        console.log('Gemini: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private generateWithClaude(options: ContentOptions): Observable<GeneratedContent> {
    const keyword = options.keyword;
    const wordCount = options.wordCount;

    // Get model from MultiAIProviderService (API key is on server)
    const savedModel = this.multiAI.getSelectedModel();
    const provider = this.multiAI.getActiveProvider();
    const model = provider?.models.find((m) => m.id === savedModel) || provider?.models[0];
    const modelId = model?.id || 'claude-sonnet-4-5-20251120';

    console.log('CLAUDE: Using model:', modelId);

    const prompt = `Write a complete ${wordCount}+ word article about "${keyword}" in natural human tone. Include 6-8 H2 sections, bullet points, and SEO optimization. Use HTML tags: <h2>, <p>, <ul>, <li>.`;

    const messages = [{ role: 'user', content: prompt }];

    return this.serverless.generateWithClaude(messages, modelId, 8000).pipe(
      map((data: any) => {
        if (data.content?.[0]?.text) {
          return this.processGeneratedContent(data.content[0].text, options);
        } else {
          throw new Error(data.error?.message || 'Invalid Claude response');
        }
      }),
      catchError((err) => {
        console.log('Claude: Serverless API failed:', err.message);
        return new Observable<GeneratedContent>((observer) => {
          observer.error(err);
        });
      }),
    );
  }

  private generateLocally(options: ContentOptions): Observable<GeneratedContent> {
    const keyword = options.keyword;
    const wordCount = options.wordCount;
    const sectionCount = Math.max(6, Math.floor(wordCount / 120));

    let article = this.generateIntroduction(keyword);
    article += this.generateSections(keyword, sectionCount);
    article += this.generateConclusion(keyword);

    return of(this.processGeneratedContent(article, options));
  }

  private generateIntroduction(keyword: string): string {
    const intros = [
      `<h2>The Complete Guide to ${this.capitalize(keyword)}</h2>

<p>Let me be straight with you: if you're looking for fluff and filler content about ${keyword}, you've come to the wrong place. This is the real deal - the kind of information I wish someone had handed me when I first started diving into this topic.</p>

<p>After spending years in this space, testing, failing, learning, and eventually figuring out what actually works, I'm ready to share everything I've discovered. No hype, no empty promises - just genuine insights.</p>

<p>Whether you're just starting out or looking to level up your existing knowledge, there's something here for you. Let's get into it.</p>`,

      `<h2>Everything About ${this.capitalize(keyword)}</h2>

<p>Here's the thing about ${keyword} - everyone seems to have an opinion, but few people actually know what they're talking about. I've been there, confused by conflicting advice, wondering who to believe.</p>

<p>That's exactly why I put together this comprehensive guide. After months of research, testing, and real-world experience, I can tell you what actually works and what doesn't.</p>

<p>So grab a coffee, and let's dive deep into everything you need to know about ${keyword}.</p>`,
    ];

    return intros[Math.floor(Math.random() * intros.length)];
  }

  private generateSections(keyword: string, count: number): string {
    const topics = this.getTopicTemplates(keyword);
    let sections = '';

    for (let i = 0; i < count; i++) {
      const topic = topics[i % topics.length];
      sections += '\n\n' + this.generateSection(keyword, topic);
    }

    return sections;
  }

  private generateSection(keyword: string, topic: string): string {
    const templates = [
      `<h2>${topic}</h2>

<p>Here's something most people don't tell you about ${topic}: the devil is truly in the details. When you really dig into ${keyword}, you'll discover that success comes down to understanding a few core principles.</p>

<p>I've seen countless people overcomplicate this. They add layers of complexity that simply aren't necessary. The simpler approach often wins. What we need is clarity, not more features or options.</p>

<p>The data backs this up consistently. Studies show that focusing on fundamentals rather than chasing trends leads to much better long-term results.</p>

<ul>
<li>Focus on what matters most - everything else is noise</li>
<li>Consistency compounds - small daily improvements add up</li>
<li>Embrace failure as feedback - every setback contains value</li>
<li>Keep learning and adapting - the best never stop growing</li>
</ul>`,

      `<h2>${topic}</h2>

<p>Now, here's where it gets interesting. The best practitioners share one common trait: they're obsessed with continuous improvement. Never satisfied, always learning.</p>

<p>Think about it. The most successful people didn't get there by accident. They put in the work when others quit. They pushed through doubts and kept going.</p>

<p>I've coached dozens of people through this process, and the transformation is always remarkable. What starts as confusion becomes clarity, and clarity becomes competence.</p>

<ul>
<li>Start simple - complexity is the enemy of execution</li>
<li>Measure what matters - data drives better decisions</li>
<li>Build habits, not motivation - consistency beats intensity</li>
<li>Iterate constantly - perfect is the enemy of progress</li>
</ul>`,

      `<h2>${topic}</h2>

<p>But here's the kicker: most people give up too soon. They expect overnight success and quit when it doesn't happen. I've been there, confused by setbacks, wondering if it's worth continuing.</p>

<p>What I've found works surprisingly well is patience combined with action. You need both - you can't just wait, but you also can't rush greatness.</p>

<p>The practical applications are endless. From improving daily workflows to long-term planning, ${keyword} touches every aspect of what we do.</p>

<ul>
<li>Prioritize ruthlessly - you cannot do everything at once</li>
<li>Focus on value creation - everything else is secondary</li>
<li>Cultivate patience - big results take time</li>
<li>Stay curious - the learning never stops</li>
</ul>`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateConclusion(keyword: string): string {
    return `\n\n<h2>The Bottom Line on ${this.capitalize(keyword)}</h2>

<p>Alright, we've covered a lot of ground here. If there's one thing I want you to take away, it's this: ${keyword} isn't about perfection. It's about progress.</p>

<p>Start where you are. Use what you have. Do what you can. The journey of a thousand miles truly begins with a single step.</p>

<p>I've shared everything I know, but remember - knowledge alone isn't power. It's only power when you take action.</p>

<p>If you found this helpful, drop a comment below. Let's keep the conversation going.</p>`;
  }

  private getTopicTemplates(keyword: string): string[] {
    return [
      `Understanding ${this.capitalize(keyword)}`,
      `Getting Started with ${this.capitalize(keyword)}`,
      `Common Mistakes to Avoid`,
      `Advanced Strategies That Work`,
      `Tools and Resources You Need`,
      `Real-World Examples and Case Studies`,
      `Tips from the Experts`,
      `Measuring Your Success`,
    ];
  }

  private capitalize(str: string): string {
    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private getToneDescription(tone: string): string {
    switch (tone) {
      case 'professional':
        return 'conversational yet authoritative';
      case 'casual':
        return 'friendly and relatable';
      case 'educational':
        return 'clear and informative';
      case 'persuasive':
        return 'compelling and action-oriented';
      default:
        return 'engaging and informative';
    }
  }

  private processGeneratedContent(
    content: string,
    options: ContentOptions,
    images: string[] = [],
    specs: any[] = [],
  ): GeneratedContent {
    let title = '';

    const h2Matches = content.match(/<h2[^>]*>([^<]+)<\/h2>/gi);
    if (h2Matches && h2Matches.length > 0) {
      const firstH2 = h2Matches[0].replace(/<[^>]*>/g, '');
      if (firstH2.length > 10 && firstH2.length < 60) {
        title = firstH2;
      }
    }

    if (!title) {
      title = `The Ultimate Guide to ${options.keyword}`;
    }

    // If AI didn't include images, inject them automatically
    let finalContent = content;
    if (images.length > 0 && !content.includes('<img')) {
      console.log('Injecting', images.length, 'images into article');
      const imageHtml = images
        .slice(0, 3)
        .map(
          (url) =>
            `<img src="${url}" alt="${options.keyword}" style="max-width:100%;margin:20px 0;border-radius:8px;" />`,
        )
        .join('\n');

      // Find the second paragraph and insert image after it
      const parts = content.split(/<\/p>/i);
      if (parts.length > 2) {
        parts.splice(2, 0, imageHtml);
        finalContent = parts.join('</p>');
      } else {
        finalContent = imageHtml + content;
      }
    }

    const metaDescription = this.seoAnalyzer.generateMetaDescription(finalContent, options.keyword);

    return {
      title,
      content: finalContent,
      metaDescription,
      focusKeyword: options.keyword,
      suggestedTags: this.generateTags(options.keyword),
      featuredImage:
        images.length > 0
          ? {
              id: 'featured',
              url: images[0],
              thumbnailUrl: images[0],
              altText: options.keyword,
              photographer: 'Stock',
              photographerUrl: '',
              source: 'google' as const,
            }
          : null,
      contentImages: images.slice(1, 4).map((url, i) => ({
        id: `content-${i}`,
        url,
        thumbnailUrl: url,
        altText: options.keyword,
        photographer: 'Stock',
        photographerUrl: '',
        source: 'google' as const,
      })),
      images,
      specs,
    };
  }

  private generateTags(keyword: string): string[] {
    return [
      keyword,
      this.capitalize(keyword),
      `${keyword} guide`,
      `${keyword} tips`,
      'how to',
      'best practices',
    ].slice(0, 8);
  }

  improveContent(content: string, keyword: string): Observable<string> {
    return this.generateLocally({
      keyword,
      tone: 'casual',
      wordCount: 1500,
      template: 'article',
      includeImages: true,
    }).pipe(map((gen) => gen.content));
  }

  generateTitle(keyword: string): Observable<string> {
    const titles = [
      `${this.capitalize(keyword)}: The Complete Guide That Works`,
      `How to Master ${this.capitalize(keyword)} (Step-by-Step)`,
      `${this.capitalize(keyword)}: Everything You Need to Know`,
      `The Ultimate ${this.capitalize(keyword)} Blueprint`,
    ];
    return of(titles.join('\n'));
  }
}
