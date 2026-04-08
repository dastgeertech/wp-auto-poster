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
  private ollamaUrl: string = 'http://localhost:11434';
  private searchService: SearchService;

  isOllamaAvailable(): boolean {
    return false;
  }

  private readonly MODEL_PRIORITY = {
    BEST: [
      {
        id: 'gemini-3.1-pro-preview',
        provider: 'google',
        name: 'Gemini 3.1 Pro',
        hasWebSearch: false,
      },
      { id: 'gemini-2.5-pro', provider: 'google', name: 'Gemini 2.5 Pro', hasWebSearch: false },
      {
        id: 'gemini-3-flash-preview',
        provider: 'google',
        name: 'Gemini 3 Flash',
        hasWebSearch: false,
      },
      { id: 'gemini-2.5-flash', provider: 'google', name: 'Gemini 2.5 Flash', hasWebSearch: false },
      { id: 'grok-3', provider: 'xai', name: 'Grok 3', hasWebSearch: true },
      { id: 'gpt-4o', provider: 'openai', name: 'GPT-4o', hasWebSearch: false },
    ],
    LOCAL: [],
    GOOD: [
      {
        id: 'gemini-3.1-flash-lite-preview',
        provider: 'google',
        name: 'Gemini 3.1 Flash Lite',
        hasWebSearch: false,
      },
      {
        id: 'gemini-2.5-flash-lite',
        provider: 'google',
        name: 'Gemini 2.5 Flash Lite',
        hasWebSearch: false,
      },
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

    // If user has selected a specific provider (not 'auto'), use it
    if (savedProvider && savedProvider !== 'auto') {
      const provider = this.multiAI.getActiveProvider();
      console.log('Active Provider:', provider?.name, provider?.id);

      if (provider) {
        const apiKey = this.multiAI.getApiKey(provider.id);
        console.log('Provider:', provider.name, '- API Key:', apiKey ? 'SET' : 'NOT SET');

        // Check if API key is required but not set
        if (provider.requiresApiKey && !apiKey) {
          console.log('Provider requires API key but none set - falling back');
        } else {
          // Use the selected model or first available model
          let selectedModel = provider.models.find((m) => m.id === savedModel);

          // If saved model not found in provider's models, try to find in any provider
          if (!selectedModel) {
            console.log('Saved model not found in provider, searching all providers...');
            for (const p of this.multiAI.providers) {
              const found = p.models.find((m) => m.id === savedModel);
              if (found) {
                selectedModel = found;
                console.log('Found model in provider:', p.name);
                break;
              }
            }
          }

          // Fallback to first model in provider if still not found
          selectedModel = selectedModel || provider.models[0];

          if (selectedModel) {
            console.log('Returning model:', selectedModel.name, 'from provider:', provider.id);
            return {
              id: selectedModel.id,
              provider: provider.id,
              name: selectedModel.name,
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

    if (this.multiAI.getApiKey('groq')) {
      console.log('Fallback: Using Groq');
      return this.MODEL_PRIORITY.FREE[0];
    }

    console.log('No API available - using local generator');
    return { id: 'fallback', provider: 'none', name: 'No API Key', hasWebSearch: false };
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
        case 'google':
          return this.generateWithGeminiResearch(prompt, options);
        case 'groq':
          return this.generateWithGroqResearch(prompt, options);
        case 'mistral':
          return this.generateWithMistralResearch(prompt, options);
        case 'anthropic':
          return this.generateWithClaudeResearch(prompt, options);
        default:
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
    const modelId = model?.id || 'claude-sonnet-4-6-20250514';

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

  private getSelectedGeminiModel(): string {
    const model = this.multiAI.getSelectedModel();
    if (model && model !== 'auto') {
      return model;
    }
    return 'gemini-2.5-flash';
  }

  private generateWithGeminiResearch(
    prompt: string,
    options: ContentOptions,
  ): Observable<GeneratedContent> {
    console.log('GEMINI: Making serverless API request...');

    const contents = [{ parts: [{ text: prompt }] }];
    const model = this.getSelectedGeminiModel();
    console.log('Using Gemini model:', model);

    return this.serverless.generateWithGemini(contents, model, 0.5).pipe(
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

    switch (bestModel.provider) {
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

      case 'google':
        const geminiModel = this.getSelectedGeminiModel();
        console.log(`Using ${geminiModel} for content generation...`);
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

  private generateWithOllama(options: ContentOptions): Observable<GeneratedContent> {
    const keyword = options.keyword;
    const wordCount = options.wordCount;
    const tone = options.tone || 'professional';

    const systemPrompt = `You are a seasoned tech journalist and content writer with years of experience covering technology topics. You write like a human editor at a major tech publication, not like an AI. Your writing is engaging, opinionated when appropriate, and feels like someone who actually uses and tests these products wrote it. Current date: March 2026.

Guidelines:
- Write like a real human writer, not AI - vary sentence length, use contractions, mix short punchy sentences with longer flowing ones
- Include specific details, numbers, and facts you've encountered or know well
- Add occasional conversational asides and parenthetical thoughts (like "which surprised me" or "interestingly enough")
- Write with a distinctive voice - confident but not robotic
- Use transition words naturally, not forced: "Meanwhile", "On the other hand", "Building on that", "Here's the thing"
- Avoid these dead giveaways of AI writing: "In this comprehensive guide", "delving into", "it is worth noting", "first and foremost", "crucially", starting every section with "Understanding" or "Exploring"
- Structure: 6-8 detailed H2 sections with natural flowing prose
- Include bullet points only when genuinely helpful for quick scanning
- End with FAQ addressing real questions people ask
- Format with HTML tags: <h2>, <p>, <ul>, <li>, <strong>
- Tone: ${tone} - but make it sound like you actually mean it
- Never fabricate specs, prices, or release dates. If unsure, use general language like "expected to launch" or "rumored to feature"
- Write as if you're sharing this with a friend who follows tech but isn't an expert`;

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

CRITICAL SEO REQUIREMENTS (90+ score):
1. "${keyword}" MUST appear in the FIRST SENTENCE
2. "${keyword}" MUST be in at least 4 different H2 headings
3. Keyword density: 1.5-2.5% (use ${keyword} naturally 5-8 times total)
4. Word count: ${wordCount}+ words minimum
5. Include FAQ section at end for featured snippets

STRUCTURE:
<h2>${keyword} - What You Need to Know</h2>
[Start first paragraph with "${keyword}" - this is critical]

<h2>Key Features of ${keyword}</h2>
<h2>How ${keyword} Works</h2>
<h2>${keyword} Performance & Results</h2>
<h2>Getting Started with ${keyword}</h2>
<h2>Common Questions About ${keyword}</h2>
- What is ${keyword}?
- How does ${keyword} benefit users?
- Is ${keyword} worth it?
<h2>Conclusion - ${keyword} in 2026</h2>

HUMAN WRITING:
- Use contractions: it's, don't, won't, can't
- Vary sentence length naturally
- Sound like a knowledgeable friend, not AI
- Include specific details and numbers
- Never use: "delving into", "comprehensive guide", "game-changer", "leveraging"

Format: HTML only with <h2>, <p>, <ul>, <li>, <strong>. No markdown. Start immediately.`;

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
    const viralPrompt = `Write a comprehensive, expert-level tech article about "${keyword}" optimized for Google and AI search in 2026.

## CRITICAL SEO RULES (90+ Score):

### KEYWORD PLACEMENT:
1. "${keyword}" MUST be in FIRST SENTENCE of first paragraph
2. "${keyword}" MUST appear in 5+ different H2 headings
3. "${keyword}" MUST appear in conclusion
4. Keyword density: 1.5-2.5% (5-8 times total)
5. Use "${keyword}" variations naturally

### ARTICLE STRUCTURE (7-8 H2s):
<h2>${keyword}: Complete Guide for 2026</h2>
[Start with "${keyword}" - direct answer]

<h2>How ${keyword} Works: Technical Deep Dive</h2>
<h2>Key Features of ${keyword} You Need to Know</h2>
<h2>${keyword} Performance: Real-World Results</h2>
<h2>${keyword} vs Alternatives: Honest Comparison</h2>
<h2>Getting Started with ${keyword}: Step-by-Step</h2>
<h2>Common Questions About ${keyword}</h2>
- What exactly is ${keyword}?
- How does ${keyword} benefit users?
- Is ${keyword} worth it in 2026?
- What's the future of ${keyword}?
<h2>${keyword} in 2026: Final Verdict</h2>

### E-E-A-T (Expertise, Authority, Trust):
- Write as an expert who has tested this technology
- Include specific specs, prices, dates if certain
- Use "reports suggest" if unsure about specifics
- Reference TechCrunch, The Verge, Ars Technica

### AI SEARCH OPTIMIZATION:
- Each section answers ONE clear question
- Start with direct answers, then expand
- Short declarative sentences for key points
- End with Sources section

### HUMAN WRITING:
- Use contractions: it's, don't, won't, can't
- Vary sentence length: short + long
- Sound like a knowledgeable friend
- NEVER: 'delving into', 'comprehensive guide', 'leveraging', 'game-changer', 'revolutionary'
- NEVER start: 'Furthermore', 'Moreover', 'Additionally', 'In conclusion'

### EXTERNAL LINKS:
- 2-3 links to techcrunch.com, theverge.com, arstechnica.com
- Use descriptive anchor text
- Place naturally in context

### FORMATTING:
- HTML only: <h2>, <p>, <ul>, <li>, <strong>, <blockquote>
- Short paragraphs (2-4 sentences)
- Bullet points for genuine lists
- End with Sources: [links]

Word count: ${wordCount}+ words
Format: Pure HTML. Start immediately.`;

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
    const model = this.getSelectedGeminiModel();

    return this.serverless.generateWithGemini(contents, model, 0.85).pipe(
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

    return this.serverless.generateWithClaude(messages, 'claude-sonnet-4-6-20250514', 10000).pipe(
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
    const slug = keyword
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');

    let content = `<h2>${title.replace(/<[^>]+>/g, '')}</h2>\n\n<p>${keyword} has been generating a lot of buzz lately, and for good reason. After spending time with the latest developments, I wanted to put together something useful for anyone trying to understand what's going on in this space.</p>\n\n<p>This isn't another breathless promotional piece. Instead, I'll walk through what actually matters - the details that make a real difference whether you're deciding on a purchase, planning a project, or just staying informed.</p>\n\n${sections}\n\n<h2>Common Questions About ${this.capitalize(keyword)}</h2>

<p>Based on what I'm seeing come up repeatedly, here are straight answers:</p>

<ul>
<li><strong>What's the bottom line?</strong> ${keyword} delivers real improvements that you'll notice in daily use, not just on paper.</li>
<li><strong>Who should pay attention?</strong> Anyone working in this space, considering an upgrade, or curious about where things are heading.</li>
<li><strong>Any downsides?</strong> Early adopter growing pains exist, but nothing deal-breaking for most users.</li>
<li><strong>Should you jump in now?</strong> Depends on your situation - new to the space? Wait for v1.1. Already invested? The transition path is solid.</li>
</ul>

<h2>Wrapping Up</h2>

<p>${keyword} isn't a revolution overnight - but it's meaningful progress that moves things forward. The kind of update that, a year from now, you'll be glad you understood early.</p>

<p>The tech keeps evolving, and I'll keep tracking what's worth your attention. Check back for updates as things develop.</p>`;

    content = this.addInternalLinks(content, keyword, slug);
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
      `<h2>${keyword}: What Makes It Different</h2>

<p>${keyword} isn't just another incremental update - it represents a meaningful shift in what's possible. If you've been watching the tech space, you know this one stands out from the crowd.</p>

<p>Here's the thing that makes ${keyword} special: it's designed with real-world usability in mind. This isn't technology for technology's sake. It's practical innovation that solves actual problems.</p>

<p>The numbers speak for themselves. Early adopters report significant improvements in their workflows, with some seeing productivity gains of up to 40%. That's not marketing speak - that's measurable results.</p>`,

      `<h2>Key Features of ${keyword} You Should Know</h2>

<p>Let's break down the features that matter most:</p>

<ul>
<li><strong>Performance</strong>: Built for speed without sacrificing reliability. Users report noticeably faster response times compared to previous solutions.</li>
<li><strong>Integration</strong>: Plays well with existing tools. You don't need to rebuild your entire workflow to adopt ${keyword}.</li>
<li><strong>Accessibility</strong>: Available across platforms. Whether you're on desktop, mobile, or tablet, the experience remains consistent.</li>
<li><strong>Security</strong>: Enterprise-grade protection built in. Your data stays protected with industry-standard encryption.</li>
</ul>

<p>These aren't just bullet points - they're features that directly impact how you work.</p>`,

      `<h2>Real-World Applications of ${keyword}</h2>

<p>Where does ${keyword} actually shine? Let me give you some concrete examples:</p>

<p><strong>For Content Creators</strong>: Streamlined workflows mean less time wrestling with tools and more time creating. The automation features handle the tedious stuff so you can focus on what matters.</p>

<p><strong>For Businesses</strong>: The scalability means it grows with your needs. Start small, expand when ready - no need to rip and replace down the road.</p>

<p><strong>For Individual Users</strong>: The learning curve is surprisingly gentle. Within a few days, most users report feeling comfortable with the core features.</p>

<p>The practical applications are limited only by imagination. Early adopters are already finding creative uses the developers didn't anticipate.</p>`,

      `<h2>How ${keyword} Compares to Alternatives</h2>

<p>Let's be honest - you're probably wondering how ${keyword} stacks up against what else is out there. Here's the honest comparison:</p>

<p><strong>vs. Legacy Solutions</strong>: The gap is significant. Legacy systems were designed for a different era. ${keyword} takes advantage of modern infrastructure and capabilities.</p>

<p><strong>vs. Other Newcomers</strong>: Some alternatives exist, but they often lack the polish and comprehensive feature set. ${keyword} has had time to mature and shows it.</p>

<p><strong>The Verdict</strong>: For most use cases, ${keyword} offers the best balance of features, performance, and value. The competition exists, but ${keyword} leads in key areas.</p>`,

      `<h2>Pricing and Availability of ${keyword}</h2>

<p>Here's the good news: ${keyword} is accessible to everyone. Multiple tiers ensure there's an option for every budget:</p>

<ul>
<li><strong>Free Tier</strong>: Perfect for trying things out. Limited features, but enough to get a feel for the platform.</li>
<li><strong>Professional</strong>: For individuals and small teams. Most users find this tier has everything they need.</li>
<li><strong>Enterprise</strong>: For larger organizations with advanced requirements. Custom solutions available.</li>
</ul>

<p>Currently, ${keyword} is available in over 50 countries with localized versions. Support is available 24/7 through multiple channels.</p>`,

      `<h2>Common Mistakes to Avoid with ${keyword}</h2>

<p>Having helped hundreds of users get started with ${keyword}, I've seen the same mistakes repeatedly. Here's how to avoid them:</p>

<p><strong>Mistake #1: Trying to Use Everything at Once</strong></p>
<p>Don't get overwhelmed. Start with one or two features, master them, then expand. The platform has depth - respect the learning curve.</p>

<p><strong>Mistake #2: Ignoring the Community</strong></p>
<p>The community around ${keyword} is active and helpful. Before struggling alone, check forums and discussion groups. Someone has likely solved your problem already.</p>

<p><strong>Mistake #3: Skipping Updates</strong></p>
<p>Regular updates bring new features and security patches. Enable automatic updates when possible.</p>

<p><strong>Mistake #4: Not Backing Up</strong></p>
<p>Whatever you're creating, maintain regular backups. It's insurance that costs nothing but saves everything.</p>`,

      `<h2>Expert Tips for Getting the Most from ${keyword}</h2>

<p>Want to take your ${keyword} skills to the next level? Try these expert-approved strategies:</p>

<p><strong>Keyboard Shortcuts</strong>: Save hours of time by learning the shortcuts. Most power users swear by them.</p>

<p><strong>Automation Rules</strong>: Set up automation for repetitive tasks. What takes 10 minutes manually can run automatically in seconds.</p>

<p><strong>Regular Reviews</strong>: Schedule weekly reviews of your ${keyword} setup. Optimization is ongoing, not one-time.</p>

<p><strong>Template Library</strong>: Create templates for your most common tasks. Reusable templates multiply your productivity.</p>`,

      `<h2>${this.capitalize(keyword)}: The Bottom Line</h2>

<p>After extensive testing and real-world use, here's my honest assessment of ${keyword}:</p>

<p><strong>Pros:</strong></p>
<ul>
<li>Excellent performance and reliability</li>
<li>Thoughtful, intuitive design</li>
<li>Strong community support</li>
<li>Regular updates and improvements</li>
<li>Good value for the price</li>
</ul>

<p><strong>Cons:</strong></p>
<ul>
<li>Initial learning curve (but not unreasonable)</li>
<li>Some advanced features require higher tiers</li>
<li>Documentation could be more detailed</li>
</ul>

<p><strong>The Bottom Line</strong>: ${keyword} delivers on its promises. It's not perfect - what is? - but it comes closer than most alternatives. Whether you're a beginner or an experienced user, you'll find value here.</p>

<p>Rating: 4.5 out of 5 stars. Highly recommended.</p>`,
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

  private addInternalLinks(content: string, keyword: string, siteSlug: string = ''): string {
    const internalLinkPlaceholders = content.match(/\[internal-link: [^\]]+\]/g) || [];
    let linkCount = 0;

    const relatedTopics = this.getRelatedTopics(keyword);

    for (const placeholder of internalLinkPlaceholders) {
      const topic =
        placeholder.match(/\[internal-link: ([^\]]+)\]/)?.[1] ||
        relatedTopics[linkCount] ||
        'related-topic';
      const slug = topic
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      const link = `<a href="/${slug}" title="Learn more about ${topic}">${topic}</a>`;
      content = content.replace(placeholder, link);
      linkCount++;
      if (linkCount >= 3) break;
    }

    return content;
  }

  private getRelatedTopics(keyword: string): string[] {
    const keywordLower = keyword.toLowerCase();
    const techTopics: { [key: string]: string[] } = {
      ai: ['Machine Learning', 'Neural Networks', 'Deep Learning', 'AI Tools'],
      robot: ['Automation', 'Machine Learning', 'Future Technology', 'Artificial Intelligence'],
      phone: ['Smartphones', 'Mobile Technology', '5G', 'Android', 'iOS'],
      laptop: ['Computers', 'Productivity', 'Windows', 'MacBook'],
      gaming: ['Video Games', 'Esports', 'PC Gaming', 'Console Gaming'],
      car: ['Electric Vehicles', 'Autonomous Driving', 'Automotive Tech', 'Tesla'],
      vr: ['Virtual Reality', 'Metaverse', 'AR', 'Immersive Tech'],
      tv: ['Streaming', 'Smart TV', 'Entertainment', 'OLED'],
      computer: ['Computing', 'Hardware', 'Software', 'Technology'],
      watch: ['Wearables', 'Fitness', 'Smart Devices', 'Health Tech'],
    };

    for (const [key, topics] of Object.entries(techTopics)) {
      if (keywordLower.includes(key)) {
        return topics;
      }
    }

    return [
      'Technology Trends',
      'Product Reviews',
      'Buying Guide',
      'How To',
      'Best Practices',
      'Industry News',
      'Future Tech',
      'Innovation',
    ];
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

    const slug = keyword
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    content = this.addInternalLinks(content, keyword, slug);
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
    const model = this.getSelectedGeminiModel();

    return this.serverless.generateWithGemini(contents, model, 0.9).pipe(
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
    const modelId = model?.id || 'claude-sonnet-4-6-20250514';

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
