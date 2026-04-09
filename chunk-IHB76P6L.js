import{a as T}from"./chunk-EAPKXSV4.js";import{a as S,b as C,c as k}from"./chunk-J2OIVKXI.js";import{F as c,Hc as I,R as A,Y as v,aa as f,f as u,n as b,o as y,p as d,t as g}from"./chunk-53BGFLSJ.js";var w=class m{constructor(e){this.http=e;this.loadApiKeys()}googleApiKey="";loadApiKeys(){let e=localStorage.getItem("ai_multi_settings");if(e){let t=JSON.parse(e);this.googleApiKey=t.apiKeys?.google||""}if(!this.googleApiKey){let t=localStorage.getItem("wp_settings");if(t){let r=JSON.parse(t);this.googleApiKey=r.ai?.geminiApiKey||""}}}setApiUrl(e){}getApiUrl(){return""}getGoogleApiKey(){let e=localStorage.getItem("ai_multi_settings");return e&&JSON.parse(e).apiKeys?.google||""}generateWithGoogle(e,t,r,i){let n=this.getGoogleApiKey();return n?b(fetch(`https://generativelanguage.googleapis.com/v1beta/models/${t}:generateContent?key=${n}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:e,generationConfig:{temperature:r,maxOutputTokens:i}})}).then(s=>s.json())).pipe(g(s=>{if(s.error)throw new Error(s.error.message||"Google API error");return s}),c(s=>d(()=>new Error(s.message||"Google API request failed")))):d(()=>new Error("Google API key not configured. Please add your API key in AI Models settings."))}generateWithClaude(e,t,r){return d(()=>new Error("Claude requires API key configuration. Please use Gemini or another provider."))}generateWithGemini(e,t,r){return this.generateWithGoogle(e,t||"gemini-2.5-flash",r||.7,8192)}generateWithOpenAI(e,t,r){return d(()=>new Error("OpenAI requires API key configuration. Please use Gemini or another provider."))}generateWithGroq(e,t,r){return d(()=>new Error("Groq requires API key configuration. Please use Gemini or another provider."))}generateWithMistral(e,t,r){return d(()=>new Error("Mistral requires API key configuration. Please use Gemini or another provider."))}generateWithGrok(e,t,r){return d(()=>new Error("Grok requires API key configuration. Please use Gemini or another provider."))}testConnection(){return this.generateWithGemini([{parts:[{text:"Say OK"}]}],"gemini-2.5-flash",.5)}static \u0275fac=function(t){return new(t||m)(f(I))};static \u0275prov=v({token:m,factory:m.\u0275fac,providedIn:"root"})};var E=class m{constructor(e,t,r,i){this.seoAnalyzer=e;this.multiAI=t;this.wordpress=r;this.serverless=i;this.loadApiKeyFromSettings(),this.searchService=new S}groqApiKey="";geminiApiKey="";anthropicApiKey="";grokApiKey="";openaiApiKey="";mistralApiKey="";ollamaUrl="http://localhost:11434";searchService;isOllamaAvailable(){return!1}MODEL_PRIORITY={BEST:[{id:"gemini-3.1-pro-preview",provider:"google",name:"Gemini 3.1 Pro",hasWebSearch:!1},{id:"gemini-2.5-pro",provider:"google",name:"Gemini 2.5 Pro",hasWebSearch:!1},{id:"gemini-3-flash-preview",provider:"google",name:"Gemini 3 Flash",hasWebSearch:!1},{id:"gemini-2.5-flash",provider:"google",name:"Gemini 2.5 Flash",hasWebSearch:!1},{id:"grok-3",provider:"xai",name:"Grok 3",hasWebSearch:!0},{id:"gpt-4o",provider:"openai",name:"GPT-4o",hasWebSearch:!1}],LOCAL:[],GOOD:[{id:"gemini-3.1-flash-lite-preview",provider:"google",name:"Gemini 3.1 Flash Lite",hasWebSearch:!1},{id:"gemini-2.5-flash-lite",provider:"google",name:"Gemini 2.5 Flash Lite",hasWebSearch:!1},{id:"gpt-4o-mini",provider:"openai",name:"GPT-4o Mini",hasWebSearch:!1}],FREE:[{id:"gemini-2.5-flash",provider:"google",name:"Gemini 2.5 Flash (Free)",hasWebSearch:!1},{id:"llama-3.3-70b-versatile",provider:"groq",name:"Llama 3.3 70B",hasWebSearch:!1},{id:"mistral-large-latest",provider:"mistral",name:"Mistral Large",hasWebSearch:!1}]};loadApiKeyFromSettings(){try{let e=localStorage.getItem("wp_settings");if(e){let t=JSON.parse(e);t.ai?.geminiApiKey&&(this.geminiApiKey=t.ai.geminiApiKey,console.log("Gemini API key loaded")),t.ai?.openaiApiKey&&(this.openaiApiKey=t.ai.openaiApiKey,console.log("OpenAI API key loaded")),t.ai?.anthropicApiKey&&(this.anthropicApiKey=t.ai.anthropicApiKey,console.log("Claude API key loaded")),t.ai?.groqApiKey&&(this.groqApiKey=t.ai.groqApiKey,console.log("Groq API key loaded")),t.ai?.grokApiKey&&(this.grokApiKey=t.ai.grokApiKey,console.log("Grok API key loaded")),t.ai?.mistralApiKey&&(this.mistralApiKey=t.ai.mistralApiKey,console.log("Mistral API key loaded"))}}catch{console.log("Could not load API key from settings")}}updateApiKey(e){if(!e){this.groqApiKey="",this.geminiApiKey="",this.anthropicApiKey="",this.grokApiKey="",this.openaiApiKey="",this.mistralApiKey="";return}e.startsWith("gsk_")?(this.groqApiKey=e,console.log("Groq API key loaded:",e.substring(0,10)+"...")):e.startsWith("xai-")?(this.grokApiKey=e,console.log("Grok API key loaded:",e.substring(0,10)+"...")):e.startsWith("AIza")?(this.geminiApiKey=e,console.log("Gemini API key loaded")):e.startsWith("sk-ant-")?(this.anthropicApiKey=e,console.log("Claude API key loaded")):e.startsWith("sk-")?(this.openaiApiKey=e,console.log("OpenAI API key loaded")):e.startsWith("mis")?(this.mistralApiKey=e,console.log("Mistral API key loaded")):(console.log("No valid API key detected, using built-in generator"),this.groqApiKey="",this.geminiApiKey="",this.anthropicApiKey="",this.grokApiKey="",this.openaiApiKey="",this.mistralApiKey="")}getBestAvailableModel(){let e=this.multiAI.getSelectedProvider(),t=this.multiAI.getSelectedModel();if(console.log("=== GET BEST MODEL ==="),console.log("Saved Provider:",e),console.log("Saved Model:",t),e&&e!=="auto"){let r=this.multiAI.getActiveProvider();if(console.log("Active Provider:",r?.name,r?.id),r){let i=this.multiAI.getApiKey(r.id);if(console.log("Provider:",r.name,"- API Key:",i?"SET":"NOT SET"),r.requiresApiKey&&!i)console.log("Provider requires API key but none set - falling back");else{let n=r.models.find(s=>s.id===t);if(!n){console.log("Saved model not found in provider, searching all providers...");for(let s of this.multiAI.providers){let o=s.models.find(a=>a.id===t);if(o){n=o,console.log("Found model in provider:",s.name);break}}}if(n=n||r.models[0],n)return console.log("Returning model:",n.name,"from provider:",r.id),{id:n.id,provider:r.id,name:n.name,hasWebSearch:!1}}}}return this.multiAI.getApiKey("google")?(console.log("Fallback: Using Google Gemini"),this.MODEL_PRIORITY.BEST[0]):this.multiAI.getApiKey("openai")?(console.log("Fallback: Using OpenAI"),this.MODEL_PRIORITY.BEST[2]):this.multiAI.getApiKey("xai")?(console.log("Fallback: Using Grok"),this.MODEL_PRIORITY.BEST[1]):this.multiAI.getApiKey("groq")?(console.log("Fallback: Using Groq"),this.MODEL_PRIORITY.FREE[0]):(console.log("No API available - using local generator"),{id:"fallback",provider:"none",name:"No API Key",hasWebSearch:!1})}generateContentWithLiveData(e){return console.log("=== PARALLEL CONTENT GENERATION WITH LIVE DATA ==="),console.log("Keyword:",e.keyword),this.searchService.updateApiKeys({grokKey:this.multiAI.getApiKey("xai")}),this.searchService.researchTopic(e.keyword).pipe(A(t=>(console.log("Research complete. Sources:",t.stats.sources.join(", ")),console.log("Results found:",t.stats.totalResults),t.searchResults.length>0&&console.log("Sample results:",t.searchResults.slice(0,3).map(r=>r.title)),this.generateFromResearch(e,t))),c(t=>(console.log("Research failed, using standard generation:",t.message),this.generateContent(e))))}generateFromResearch(e,t){let r=e.keyword,i=e.wordCount,n=this.getBestAvailableModel();if(console.log("Using BEST MODEL:",n.name,`(${n.provider})`),t.searchResults.length>0){console.log("Generating article from LIVE DATA...");let s=this.extractFacts(t.searchResults),o=this.extractStats(t.searchResults),a=this.extractDates(t.searchResults),l=this.buildResearchBasedPrompt(r,i,s,o,a,t);switch(n.provider){case"google":return this.generateWithGeminiResearch(l,e);case"groq":return this.generateWithGroqResearch(l,e);case"mistral":return this.generateWithMistralResearch(l,e);case"anthropic":return this.generateWithClaudeResearch(l,e);default:if(this.multiAI.getApiKey("groq"))return this.generateWithGroqResearch(l,e);if(this.multiAI.getApiKey("google"))return this.generateWithGeminiResearch(l,e);if(this.multiAI.getApiKey("xai"))return this.generateWithGrokResearch(l,e);if(this.multiAI.getApiKey("anthropic"))return this.generateWithClaudeResearch(l,e)}}return console.log("No research data, falling back to standard generation"),this.generateContent(e)}buildResearchBasedPrompt(e,t,r,i,n,s){let o=n.length>0?n.join(", "):"Early 2026",a=s.specs&&s.specs.length>0?`

PRODUCT SPECIFICATIONS:
`+s.specs.map((h,p)=>`Product ${p+1}: ${Object.entries(h).map(([G,O])=>`${G}: ${O}`).join(", ")}`).join(`
`):"",l=s.images&&s.images.length>0?`

IMAGES FOR ARTICLE:
`+s.images.slice(0,5).map((h,p)=>`[image-${p+1}]: ${h}`).join(`
`):"";return`Write a comprehensive, SEO-optimized article about "${e}" based on VERIFIED LIVE DATA from 2026.

CURRENT DATE: March 29, 2026

VERIFIED FACTS FROM RECENT SOURCES:
${r}

LATEST STATISTICS:
${i||"Statistics vary by source - use general industry knowledge"}

RECENT DEVELOPMENTS (${o}):
${s.searchResults.slice(0,5).map((h,p)=>`${p+1}. ${h.title}: ${h.snippet}`).join(`
`)}
${a}
${l}

CRITICAL RULES:
1. ONLY use facts from the provided verified data above
2. If you don't know something, say "According to recent sources..." and stay general
3. NEVER invent product names, prices, or specifications not in the data
4. Include the keyword "${e}" in the first sentence
5. Include "${e}" in at least 4 different H2 headings
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
Include images like: <img src="[image-1]" alt="${e}" style="max-width:100%;margin:20px 0;" />
Word count: ${t}+ words.`}generateWithGrokResearch(e,t){let r=[{role:"system",content:"You are a senior tech journalist. You MUST only write facts that are verified in your provided data. Do NOT make up product names, prices, or specifications. Current date: March 25, 2026. Write naturally and engagingly."},{role:"user",content:e}];return this.serverless.generateWithGrok(r,"grok-3").pipe(g(i=>{if(i.choices?.[0]?.message?.content)return this.processGeneratedContent(i.choices[0].message.content,t);throw new Error(i.error?.message||"Invalid response")}),c(i=>(console.log("Grok: Serverless API failed:",i.message),new u(n=>{n.error(i)}))))}generateWithGroqResearch(e,t){let r=[{role:"system",content:"You are a senior tech journalist. You MUST only write facts that are verified in your provided data. Do NOT make up product names, prices, or specifications. Current date: March 25, 2026. Write naturally and engagingly."},{role:"user",content:e}];return this.serverless.generateWithGroq(r,"llama-3.3-70b-versatile").pipe(g(i=>{if(i.choices?.[0]?.message?.content)return this.processGeneratedContent(i.choices[0].message.content,t);throw new Error(i.error?.message||"Invalid response")}),c(i=>(console.log("Groq: Serverless API failed:",i.message),new u(n=>{n.error(i)}))))}generateWithClaudeResearch(e,t){let r=this.multiAI.getSelectedModel(),i=this.multiAI.getActiveProvider(),s=(i?.models.find(a=>a.id===r)||i?.models[0])?.id||"claude-sonnet-4-6-20250514",o=[{role:"user",content:`You are a senior tech journalist. You MUST only write facts that are verified in your provided data. Do NOT make up product names, prices, or specifications. Current date: March 2026. Write naturally and engagingly.

${e}`}];return this.serverless.generateWithClaude(o,s).pipe(g(a=>{if(a.content?.[0]?.text)return this.processGeneratedContent(a.content[0].text,t);throw new Error(a.error?.message||"Invalid response")}),c(a=>(console.log("Claude: Serverless API failed:",a.message),new u(l=>{l.error(a)}))))}generateWithOpenAIResearch(e,t){let r=[{role:"system",content:"You are a senior tech journalist. You MUST only write facts that are verified in your provided data. Do NOT make up product names, prices, or specifications. Current date: March 2026. Write naturally and engagingly."},{role:"user",content:e}];return this.serverless.generateWithOpenAI(r,"gpt-4o").pipe(g(i=>{if(i.choices?.[0]?.message?.content)return this.processGeneratedContent(i.choices[0].message.content,t);throw new Error(i.error?.message||"Invalid response")}),c(i=>(console.log("OpenAI: Serverless API failed:",i.message),new u(n=>{n.error(i)}))))}getSelectedGeminiModel(){let e=this.multiAI.getSelectedModel();return e&&e!=="auto"?e:"gemini-2.5-flash"}generateWithGeminiResearch(e,t){console.log("GEMINI: Making serverless API request...");let r=[{parts:[{text:e}]}],i=this.getSelectedGeminiModel();return console.log("Using Gemini model:",i),this.serverless.generateWithGemini(r,i,.5).pipe(g(n=>{if(n.candidates?.[0]?.content?.parts?.[0]?.text)return this.processGeneratedContent(n.candidates[0].content.parts[0].text,t);throw new Error(n.error?.message||"Invalid response")}),c(n=>(console.log("Gemini: Serverless API failed:",n.message),new u(s=>{s.error(n)}))))}generateWithMistralResearch(e,t){let r=[{role:"system",content:"You are a senior tech journalist. You MUST only write facts that are verified in your provided data. Do NOT make up product names, prices, or specifications. Current date: March 2026. Write naturally and engagingly."},{role:"user",content:e}];return this.serverless.generateWithMistral(r,"mistral-large-latest").pipe(g(i=>{if(i.choices?.[0]?.message?.content)return this.processGeneratedContent(i.choices[0].message.content,t);throw new Error(i.error?.message||"Invalid response")}),c(i=>(console.log("Mistral: Serverless API failed:",i.message),new u(n=>{n.error(i)}))))}extractFacts(e){return e.slice(0,10).map((t,r)=>`${r+1}. ${t.snippet||t.description||""}`).join(`
`)}extractStats(e){let t=/\d+(?:\.\d+)?%|\d+(?:\.\d+)?\s*(?:million|billion|thousand|x)/gi,r=[];for(let i of e){let s=(i.snippet||i.description||"").match(t);s&&r.push(...s.slice(0,2))}return[...new Set(r)].slice(0,10).join(`
`)}extractDates(e){let t=/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s*202[56]|\b(?:20[25]\d)[-\/]\d{2}[-\/]\d{2}\b/gi,r=[];for(let i of e){let s=(String(i.snippet||i.description||"")+" "+String(i.date||"")).match(t);s&&r.push(...s)}return[...new Set(r)].slice(0,5)}generateContent(e){let t=this.getBestAvailableModel();switch(console.log("=== CONTENT GENERATION ==="),console.log("Keyword:",e.keyword),console.log("Best Available Model:",t.name,`(${t.provider})`),console.log("Grok API Key:",this.multiAI.getApiKey("xai")?"SET":"NOT SET"),console.log("Claude API Key:",this.multiAI.getApiKey("anthropic")?"SET":"NOT SET"),console.log("OpenAI API Key:",this.multiAI.getApiKey("openai")?"SET":"NOT SET"),console.log("Gemini API Key:",this.multiAI.getApiKey("google")?"SET":"NOT SET"),console.log("Groq API Key:",this.multiAI.getApiKey("groq")?"SET":"NOT SET"),console.log("Mistral API Key:",this.multiAI.getApiKey("mistral")?"SET":"NOT SET"),t.provider){case"xai":return console.log("Using Grok 3 (BEST) for content generation..."),this.generateWithGrok(e).pipe(c(i=>(console.log("Grok Error:",i.message),this.fallbackToOtherAPIs(e))));case"openai":return console.log("Using GPT-4o (BEST) for content generation..."),this.generateWithOpenAI(e).pipe(c(()=>(console.log("GPT-4o failed, falling back..."),this.fallbackToOtherAPIs(e))));case"google":let r=this.getSelectedGeminiModel();return console.log(`Using ${r} for content generation...`),this.generateWithGemini(e).pipe(c(()=>(console.log("Gemini failed, falling back..."),this.fallbackToOtherAPIs(e))));case"groq":return console.log("Using Llama 3.3 70B (FREE) for content generation..."),this.generateWithGroq(e).pipe(c(()=>(console.log("Groq failed, falling back..."),this.generateLocally(e))));case"mistral":return console.log("Using Mistral Large for content generation..."),this.generateWithMistral(e).pipe(c(()=>(console.log("Mistral failed, falling back..."),this.generateLocally(e))));case"anthropic":return console.log("Using Claude for content generation..."),this.generateWithClaude(e).pipe(c(i=>(console.log("Claude Error:",i.message),this.generateLocally(e))));default:return console.log("Using built-in generator (no API key)"),this.generateLocally(e)}}generateWithOpenAI(e){let t=e.keyword,r=e.wordCount,i=e.tone||"professional",n=`Write a complete, high-quality, SEO-optimized article about "${t}". 

Requirements:
- Word count: ${r}+ words
- Tone: ${i}, natural, conversational
- Structure: 6-8 detailed H2 sections with substantial paragraphs
- Include bullet points for key takeaways
- SEO: Include keyword "${t}" naturally in first 100 words, 1.5-2.5% density throughout
- Include FAQ section for featured snippets optimization
- MUST include actual examples and practical advice

Format output with HTML tags: <h2>, <p>, <ul>, <li> only.
Start directly with the article content. No preamble.`,s=[{role:"system",content:"You are a senior tech journalist at a major publication. You write detailed, engaging articles that rank well in search engines. Current date: March 2026."},{role:"user",content:n}];return this.serverless.generateWithOpenAI(s,"gpt-4o").pipe(g(o=>{if(o.choices?.[0]?.message?.content)return this.processGeneratedContent(o.choices[0].message.content,e);throw new Error(o.error?.message||"Invalid response")}),c(o=>(console.log("OpenAI: Serverless API failed:",o.message),new u(a=>{a.error(o)}))))}generateWithOllama(e){let t=e.keyword,r=e.wordCount,n=`You are a seasoned tech journalist and content writer with years of experience covering technology topics. You write like a human editor at a major tech publication, not like an AI. Your writing is engaging, opinionated when appropriate, and feels like someone who actually uses and tests these products wrote it. Current date: March 2026.

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
- Tone: ${e.tone||"professional"} - but make it sound like you actually mean it
- Never fabricate specs, prices, or release dates. If unsure, use general language like "expected to launch" or "rumored to feature"
- Write as if you're sharing this with a friend who follows tech but isn't an expert`,s=`Write a comprehensive SEO-optimized article about "${t}".

Requirements:
- Minimum ${r} words
- Include the keyword "${t}" naturally in the first 100 words
- Use keyword 4-6 times throughout the article
- Structure: Introduction, 6-8 detailed H2 sections, FAQ, Conclusion
- Include practical examples and actionable advice
- Add bullet points for key takeaways in each section

Format output with HTML tags only: <h2>, <p>, <ul>, <li>
Start immediately with the article content. No preamble or explanation.`;return new u(o=>{fetch(`${this.ollamaUrl}/api/generate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"qwen3:8b",prompt:s,system:n,stream:!1,options:{temperature:.7,num_predict:8192}})}).then(a=>{if(!a.ok)throw new Error(`Ollama Error: ${a.status}`);return a.json()}).then(a=>{if(a.response){let l=this.processGeneratedContent(a.response,e);o.next(l),o.complete()}else throw new Error("Invalid Ollama response")}).catch(a=>{console.error("Ollama generation error:",a),o.error(a)})})}generateWithOllamaChat(e){let t=e.keyword,r=e.wordCount,i=e.tone||"professional",n=`Write a comprehensive SEO-optimized article about "${t}".

Requirements:
- Minimum ${r} words
- Include the keyword "${t}" naturally in the first 100 words
- Use keyword 4-6 times throughout the article
- Structure: Introduction, 6-8 detailed H2 sections, FAQ, Conclusion
- Include practical examples and actionable advice
- Add bullet points for key takeaways in each section

Format output with HTML tags only: <h2>, <p>, <ul>, <li>
Start immediately with the article content. No preamble or explanation.`;return new u(s=>{fetch(`${this.ollamaUrl}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"qwen3:8b",messages:[{role:"system",content:`You are a professional content writer specializing in SEO-optimized articles. Write detailed, well-structured articles. Format with HTML tags: <h2>, <p>, <ul>, <li>. Tone: ${i}.`},{role:"user",content:n}],stream:!1,options:{temperature:.7,num_predict:8192}})}).then(o=>{if(!o.ok)throw new Error(`Ollama Error: ${o.status}`);return o.json()}).then(o=>{if(o.message?.content){let a=this.processGeneratedContent(o.message.content,e);s.next(a),s.complete()}else throw new Error("Invalid Ollama response")}).catch(o=>{console.error("Ollama chat error:",o),s.error(o)})})}generateWithMistral(e){let t=e.keyword,r=e.wordCount,i=e.tone||"professional",n=`Write a complete, high-quality, SEO-optimized article about "${t}".

CRITICAL SEO REQUIREMENTS (90+ score):
1. "${t}" MUST appear in the FIRST SENTENCE
2. "${t}" MUST be in at least 4 different H2 headings
3. Keyword density: 1.5-2.5% (use ${t} naturally 5-8 times total)
4. Word count: ${r}+ words minimum
5. Include FAQ section at end for featured snippets

STRUCTURE:
<h2>${t} - What You Need to Know</h2>
[Start first paragraph with "${t}" - this is critical]

<h2>Key Features of ${t}</h2>
<h2>How ${t} Works</h2>
<h2>${t} Performance & Results</h2>
<h2>Getting Started with ${t}</h2>
<h2>Common Questions About ${t}</h2>
- What is ${t}?
- How does ${t} benefit users?
- Is ${t} worth it?
<h2>Conclusion - ${t} in 2026</h2>

HUMAN WRITING:
- Use contractions: it's, don't, won't, can't
- Vary sentence length naturally
- Sound like a knowledgeable friend, not AI
- Include specific details and numbers
- Never use: "delving into", "comprehensive guide", "game-changer", "leveraging"

Format: HTML only with <h2>, <p>, <ul>, <li>, <strong>. No markdown. Start immediately.`,s=[{role:"system",content:"You are a senior tech journalist at a major publication. You write detailed, engaging articles that rank well in search engines. Current date: March 2026."},{role:"user",content:n}];return this.serverless.generateWithMistral(s,"mistral-large-latest").pipe(g(o=>{if(o.choices?.[0]?.message?.content)return this.processGeneratedContent(o.choices[0].message.content,e);throw new Error(o.error?.message||"Invalid response")}),c(o=>(console.log("Mistral: Serverless API failed:",o.message),new u(a=>{a.error(o)}))))}fallbackToOtherAPIs(e){return this.multiAI.getApiKey("openai")?this.generateWithOpenAI(e).pipe(c(()=>(console.log("GPT-4o failed, trying Gemini..."),this.generateWithGemini(e).pipe(c(()=>(console.log("Gemini failed, trying Groq..."),this.generateWithGroq(e).pipe(c(()=>(console.log("All APIs failed, using local generator"),this.generateLocally(e)))))))))):this.generateWithGemini(e).pipe(c(()=>this.generateWithClaude(e).pipe(c(()=>this.generateLocally(e)))))}generateViralTechContent(e,t=1500){let r=`Write a comprehensive, expert-level tech article about "${e}" optimized for Google and AI search in 2026.

## CRITICAL SEO RULES (90+ Score):

### KEYWORD PLACEMENT:
1. "${e}" MUST be in FIRST SENTENCE of first paragraph
2. "${e}" MUST appear in 5+ different H2 headings
3. "${e}" MUST appear in conclusion
4. Keyword density: 1.5-2.5% (5-8 times total)
5. Use "${e}" variations naturally

### ARTICLE STRUCTURE (7-8 H2s):
<h2>${e}: Complete Guide for 2026</h2>
[Start with "${e}" - direct answer]

<h2>How ${e} Works: Technical Deep Dive</h2>
<h2>Key Features of ${e} You Need to Know</h2>
<h2>${e} Performance: Real-World Results</h2>
<h2>${e} vs Alternatives: Honest Comparison</h2>
<h2>Getting Started with ${e}: Step-by-Step</h2>
<h2>Common Questions About ${e}</h2>
- What exactly is ${e}?
- How does ${e} benefit users?
- Is ${e} worth it in 2026?
- What's the future of ${e}?
<h2>${e} in 2026: Final Verdict</h2>

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

Word count: ${t}+ words
Format: Pure HTML. Start immediately.`;return this.multiAI.getApiKey("xai")?this.generateWithGrokViral(e,r,t):this.multiAI.getApiKey("anthropic")?this.generateWithClaudeViral(e,r,t):this.multiAI.getApiKey("groq")?this.generateWithGroqViral(e,r,t):this.multiAI.getApiKey("google")?this.generateWithGeminiViral(e,r,t):this.generateViralTechLocally(e,t)}generateWithGrokViral(e,t,r){let i=[{role:"system",content:`You are a senior tech journalist at a major publication like The Verge, TechCrunch, or Wired. You've been writing about technology for 10+ years. Your articles are known for being:
- Sharp and opinionated, not wishy-washy
- Full of specific details, names, dates, prices
- Written in a voice that sounds like you, not generic
- Structured for both readers and search engines
- Controversial take when warranted (but backed by facts)
- Always up-to-date with 2025-2026 technology trends

You NEVER sound like an AI. You sound like a experienced human writer who knows their stuff.`},{role:"user",content:t}];return this.serverless.generateWithGrok(i,"grok-3").pipe(g(n=>{if(n.choices?.[0]?.message?.content)return this.processViralContent(n.choices[0].message.content,e,r);throw new Error(n.error?.message||"Invalid Grok response")}),c(n=>(console.log("Grok Viral: Serverless API failed:",n.message),new u(s=>{s.error(n)}))))}generateWithGrok(e){console.log("GROK: Making serverless API request");let t=e.keyword,r=e.wordCount,i=`Write a complete, high-quality, SEO-optimized article about "${t}". 

CRITICAL: You MUST use real-time web search to get the LATEST and MOST ACCURATE information about "${t}". Do NOT make up product names, specifications, dates, or prices. Only include information you find from web search.

Requirements:
- Word count: ${r}+ words
- Tone: Natural, conversational, human-like writing
- Structure: 6-8 detailed H2 sections with substantial paragraphs
- Include bullet points for key takeaways
- SEO: Include keyword "${t}" naturally in first 100 words, 1.5-2.5% density throughout
- Include FAQ section for featured snippets optimization
- MUST include actual dates, prices, and specifications from web search

Format output with HTML tags: <h2>, <p>, <ul>, <li> only.
Start directly with the article content. No preamble.`,n=[{role:"system",content:"You are a senior tech journalist. You MUST search the web for real-time information before writing. NEVER hallucinate product names, specs, prices, or dates. Only write facts you find from web search. Current date: March 25, 2026."},{role:"user",content:i}];return this.serverless.generateWithGrok(n,"grok-3").pipe(g(s=>{if(s.choices?.[0]?.message?.content)return this.processGeneratedContent(s.choices[0].message.content,e);throw new Error(s.error?.message||"Invalid Grok response")}),c(s=>(console.log("Grok: Serverless API failed:",s.message),new u(o=>{o.error(s)}))))}generateWithGroqViral(e,t,r){let i=[{role:"system",content:`You are a senior tech journalist at a major publication like The Verge, TechCrunch, or Wired. You've been writing about technology for 10+ years. Your articles are known for being:
- Sharp and opinionated, not wishy-washy
- Full of specific details, names, dates, prices
- Written in a voice that sounds like you, not generic
- Structured for both readers and search engines
- Controversial take when warranted (but backed by facts)
- Always up-to-date with 2025-2026 technology trends

You NEVER sound like an AI. You sound like a experienced human writer who knows their stuff.`},{role:"user",content:t}];return this.serverless.generateWithGroq(i,"llama-3.3-70b-versatile").pipe(g(n=>{if(n.choices?.[0]?.message?.content)return this.processViralContent(n.choices[0].message.content,e,r);throw new Error(n.error?.message||"Invalid response")}),c(n=>(console.log("Groq Viral: Serverless API failed:",n.message),new u(s=>{s.error(n)}))))}generateWithGeminiViral(e,t,r){let i=[{parts:[{text:t}]}],n=this.getSelectedGeminiModel();return this.serverless.generateWithGemini(i,n,.85).pipe(g(s=>{if(s.candidates?.[0]?.content?.parts?.[0]?.text)return this.processViralContent(s.candidates[0].content.parts[0].text,e,r);throw new Error(s.error?.message||"Invalid response")}),c(s=>(console.log("Gemini Viral: Serverless API failed:",s.message),new u(o=>{o.error(s)}))))}generateWithClaudeViral(e,t,r){let i=[{role:"user",content:t}];return this.serverless.generateWithClaude(i,"claude-sonnet-4-6-20250514",1e4).pipe(g(n=>{if(n.content?.[0]?.text)return this.processViralContent(n.content[0].text,e,r);throw new Error(n.error?.message||"Invalid Claude response")}),c(n=>(console.log("Claude Viral: Serverless API failed:",n.message),new u(s=>{s.error(n)}))))}generateViralTechLocally(e,t){let r=this.generateViralSections(e,t),i=this.generateViralTitle(e),n=this.generateMetaDescription(e,r),s=e.toLowerCase().replace(/[^a-z0-9\s]/g,"").replace(/\s+/g,"-"),o=`<h2>${i.replace(/<[^>]+>/g,"")}</h2>

<p>${e} has been generating a lot of buzz lately, and for good reason. After spending time with the latest developments, I wanted to put together something useful for anyone trying to understand what's going on in this space.</p>

<p>This isn't another breathless promotional piece. Instead, I'll walk through what actually matters - the details that make a real difference whether you're deciding on a purchase, planning a project, or just staying informed.</p>

${r}

<h2>Common Questions About ${this.capitalize(e)}</h2>

<p>Based on what I'm seeing come up repeatedly, here are straight answers:</p>

<ul>
<li><strong>What's the bottom line?</strong> ${e} delivers real improvements that you'll notice in daily use, not just on paper.</li>
<li><strong>Who should pay attention?</strong> Anyone working in this space, considering an upgrade, or curious about where things are heading.</li>
<li><strong>Any downsides?</strong> Early adopter growing pains exist, but nothing deal-breaking for most users.</li>
<li><strong>Should you jump in now?</strong> Depends on your situation - new to the space? Wait for v1.1. Already invested? The transition path is solid.</li>
</ul>

<h2>Wrapping Up</h2>

<p>${e} isn't a revolution overnight - but it's meaningful progress that moves things forward. The kind of update that, a year from now, you'll be glad you understood early.</p>

<p>The tech keeps evolving, and I'll keep tracking what's worth your attention. Check back for updates as things develop.</p>`;return o=this.addInternalLinks(o,e,s),o=this.addExternalLinks(o),y({title:i,content:o,metaDescription:n,focusKeyword:e,suggestedTags:this.generateViralTags(e),featuredImage:null,contentImages:[],images:[],specs:[]})}generateViralSections(e,t){let r=this.getViralSectionTemplates(e),i=Math.max(6,Math.floor(t/200)),n="";for(let s=0;s<i;s++){let o=r[s%r.length];n+=`

`+o}return n}getViralSectionTemplates(e){return[`<h2>${e}: What Makes It Different</h2>

<p>${e} isn't just another incremental update - it represents a meaningful shift in what's possible. If you've been watching the tech space, you know this one stands out from the crowd.</p>

<p>Here's the thing that makes ${e} special: it's designed with real-world usability in mind. This isn't technology for technology's sake. It's practical innovation that solves actual problems.</p>

<p>The numbers speak for themselves. Early adopters report significant improvements in their workflows, with some seeing productivity gains of up to 40%. That's not marketing speak - that's measurable results.</p>`,`<h2>Key Features of ${e} You Should Know</h2>

<p>Let's break down the features that matter most:</p>

<ul>
<li><strong>Performance</strong>: Built for speed without sacrificing reliability. Users report noticeably faster response times compared to previous solutions.</li>
<li><strong>Integration</strong>: Plays well with existing tools. You don't need to rebuild your entire workflow to adopt ${e}.</li>
<li><strong>Accessibility</strong>: Available across platforms. Whether you're on desktop, mobile, or tablet, the experience remains consistent.</li>
<li><strong>Security</strong>: Enterprise-grade protection built in. Your data stays protected with industry-standard encryption.</li>
</ul>

<p>These aren't just bullet points - they're features that directly impact how you work.</p>`,`<h2>Real-World Applications of ${e}</h2>

<p>Where does ${e} actually shine? Let me give you some concrete examples:</p>

<p><strong>For Content Creators</strong>: Streamlined workflows mean less time wrestling with tools and more time creating. The automation features handle the tedious stuff so you can focus on what matters.</p>

<p><strong>For Businesses</strong>: The scalability means it grows with your needs. Start small, expand when ready - no need to rip and replace down the road.</p>

<p><strong>For Individual Users</strong>: The learning curve is surprisingly gentle. Within a few days, most users report feeling comfortable with the core features.</p>

<p>The practical applications are limited only by imagination. Early adopters are already finding creative uses the developers didn't anticipate.</p>`,`<h2>How ${e} Compares to Alternatives</h2>

<p>Let's be honest - you're probably wondering how ${e} stacks up against what else is out there. Here's the honest comparison:</p>

<p><strong>vs. Legacy Solutions</strong>: The gap is significant. Legacy systems were designed for a different era. ${e} takes advantage of modern infrastructure and capabilities.</p>

<p><strong>vs. Other Newcomers</strong>: Some alternatives exist, but they often lack the polish and comprehensive feature set. ${e} has had time to mature and shows it.</p>

<p><strong>The Verdict</strong>: For most use cases, ${e} offers the best balance of features, performance, and value. The competition exists, but ${e} leads in key areas.</p>`,`<h2>Pricing and Availability of ${e}</h2>

<p>Here's the good news: ${e} is accessible to everyone. Multiple tiers ensure there's an option for every budget:</p>

<ul>
<li><strong>Free Tier</strong>: Perfect for trying things out. Limited features, but enough to get a feel for the platform.</li>
<li><strong>Professional</strong>: For individuals and small teams. Most users find this tier has everything they need.</li>
<li><strong>Enterprise</strong>: For larger organizations with advanced requirements. Custom solutions available.</li>
</ul>

<p>Currently, ${e} is available in over 50 countries with localized versions. Support is available 24/7 through multiple channels.</p>`,`<h2>Common Mistakes to Avoid with ${e}</h2>

<p>Having helped hundreds of users get started with ${e}, I've seen the same mistakes repeatedly. Here's how to avoid them:</p>

<p><strong>Mistake #1: Trying to Use Everything at Once</strong></p>
<p>Don't get overwhelmed. Start with one or two features, master them, then expand. The platform has depth - respect the learning curve.</p>

<p><strong>Mistake #2: Ignoring the Community</strong></p>
<p>The community around ${e} is active and helpful. Before struggling alone, check forums and discussion groups. Someone has likely solved your problem already.</p>

<p><strong>Mistake #3: Skipping Updates</strong></p>
<p>Regular updates bring new features and security patches. Enable automatic updates when possible.</p>

<p><strong>Mistake #4: Not Backing Up</strong></p>
<p>Whatever you're creating, maintain regular backups. It's insurance that costs nothing but saves everything.</p>`,`<h2>Expert Tips for Getting the Most from ${e}</h2>

<p>Want to take your ${e} skills to the next level? Try these expert-approved strategies:</p>

<p><strong>Keyboard Shortcuts</strong>: Save hours of time by learning the shortcuts. Most power users swear by them.</p>

<p><strong>Automation Rules</strong>: Set up automation for repetitive tasks. What takes 10 minutes manually can run automatically in seconds.</p>

<p><strong>Regular Reviews</strong>: Schedule weekly reviews of your ${e} setup. Optimization is ongoing, not one-time.</p>

<p><strong>Template Library</strong>: Create templates for your most common tasks. Reusable templates multiply your productivity.</p>`,`<h2>${this.capitalize(e)}: The Bottom Line</h2>

<p>After extensive testing and real-world use, here's my honest assessment of ${e}:</p>

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

<p><strong>The Bottom Line</strong>: ${e} delivers on its promises. It's not perfect - what is? - but it comes closer than most alternatives. Whether you're a beginner or an experienced user, you'll find value here.</p>

<p>Rating: 4.5 out of 5 stars. Highly recommended.</p>`]}generateViralTitle(e){let t=[`${this.capitalize(e)}: The Complete Breakdown Nobody Asked For`,`${this.capitalize(e)} - What Actually Works in 2026`,`I Tested ${this.capitalize(e)} for 30 Days: Here's the Truth`,`The Ultimate ${this.capitalize(e)} Guide (Based on Real Testing)`,`${this.capitalize(e)} Review: Brutally Honest Assessment`,`Why ${this.capitalize(e)} Might Actually Be Worth It`,`${this.capitalize(e)} vs The Competition: Real Differences`,`Everything Wrong With ${this.capitalize(e)} (And How to Fix It)`];return t[Math.floor(Math.random()*t.length)]}generateMetaDescription(e,t){let i=t.replace(/<[^>]*>/g,"").substring(0,150).split("."),n="";for(let s of i)if((n+s).length<155)n+=(n?". ":"")+s;else break;return n.toLowerCase().includes(e.toLowerCase())||(n=`${e}: `+n),n.substring(0,160).trim()+"..."}addInternalLinks(e,t,r=""){let i=e.match(/\[internal-link: [^\]]+\]/g)||[],n=0,s=this.getRelatedTopics(t);for(let o of i){let a=o.match(/\[internal-link: ([^\]]+)\]/)?.[1]||s[n]||"related-topic",h=`<a href="/${a.toLowerCase().replace(/[^a-z0-9\s]/g,"").replace(/\s+/g,"-")}" title="Learn more about ${a}">${a}</a>`;if(e=e.replace(o,h),n++,n>=3)break}return e}getRelatedTopics(e){let t=e.toLowerCase(),r={ai:["Machine Learning","Neural Networks","Deep Learning","AI Tools"],robot:["Automation","Machine Learning","Future Technology","Artificial Intelligence"],phone:["Smartphones","Mobile Technology","5G","Android","iOS"],laptop:["Computers","Productivity","Windows","MacBook"],gaming:["Video Games","Esports","PC Gaming","Console Gaming"],car:["Electric Vehicles","Autonomous Driving","Automotive Tech","Tesla"],vr:["Virtual Reality","Metaverse","AR","Immersive Tech"],tv:["Streaming","Smart TV","Entertainment","OLED"],computer:["Computing","Hardware","Software","Technology"],watch:["Wearables","Fitness","Smart Devices","Health Tech"]};for(let[i,n]of Object.entries(r))if(t.includes(i))return n;return["Technology Trends","Product Reviews","Buying Guide","How To","Best Practices","Industry News","Future Tech","Innovation"]}addExternalLinks(e){let t=[{name:"Wikipedia",url:"https://en.wikipedia.org/wiki/Main_Page"},{name:"TechCrunch",url:"https://techcrunch.com"},{name:"The Verge",url:"https://www.theverge.com"},{name:"Wired",url:"https://www.wired.com"},{name:"Ars Technica",url:"https://arstechnica.com"}],r=e.match(/\[external-link: [^\]]+\]/g)||[],i=0;for(let n of r){let s=n.match(/\[external-link: ([^\]]+)\]/)?.[1]||t[i%t.length].name,a=`<a href="${(t.find(l=>l.name.toLowerCase().includes(s.toLowerCase()))||t[i%t.length]).url}" target="_blank" rel="noopener noreferrer">${s}</a>`;if(e=e.replace(n,a),i++,i>=3)break}return e}generateViralTags(e){let t=[e,this.capitalize(e),"technology","tech news","2026 tech","product review","buying guide","tech tips"],r=e.toLowerCase().split(/\s+/);return r.length>1&&t.push(r[0],r[r.length-1]),[...new Set(t)].slice(0,8)}processViralContent(e,t,r){let i="",n=e.match(/<h2[^>]*>([^<]+)<\/h2>/gi);if(n&&n.length>0){let a=n[0].replace(/<[^>]*>/g,"").trim();a.length>10&&a.length<70&&(i=a)}i||(i=this.generateViralTitle(t));let s=t.toLowerCase().replace(/[^a-z0-9\s]/g,"").replace(/\s+/g,"-");e=this.addInternalLinks(e,t,s),e=this.addExternalLinks(e);let o=this.seoAnalyzer.generateMetaDescription(e,t,155);return{title:i,content:e,metaDescription:o,focusKeyword:t,suggestedTags:this.generateViralTags(t),featuredImage:null,contentImages:[],images:[],specs:[]}}generateWithGroq(e){console.log("GROQ: Making serverless API request");let t=e.keyword,r=e.wordCount,i=`Write a complete, high-quality, SEO-optimized article about "${t}". 

IMPORTANT: If you do not know verified facts about "${t}" (exact specs, prices, release dates, processor names), use GENERAL technology knowledge for the "${t}" topic. Do NOT invent fake product names like "Exynos 1680" or fake launch dates. Write about the topic with accurate, general knowledge available up to your knowledge cutoff.

CRITICAL SEO REQUIREMENTS FOR 100 SCORE:
1. Include "${t}" in the FIRST SENTENCE of the first paragraph
2. Include "${t}" in at least 4 different H2 headings
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
- Word count: ${r}+ words
- Tone: Natural, conversational, human-like writing
- Include bullet points for key takeaways
- Use contractions freely
- Mix short and long sentences

Format output with HTML tags: <h2>, <p>, <ul>, <li> only.
Start directly with the article content. No preamble.`,n=[{role:"system",content:'You are a tech journalist. IMPORTANT: If you do not have verified information about specific products (processors, phone models, etc.), write using general industry knowledge. NEVER make up fake specs like "Exynos 1680" or fake dates like "March 2026". Use facts you know for certain. Current date context: March 2026.'},{role:"user",content:i}];return this.serverless.generateWithGroq(n,"llama-3.3-70b-versatile").pipe(g(s=>{if(s.choices?.[0]?.message?.content)return this.processGeneratedContent(s.choices[0].message.content,e);throw new Error(s.error?.message||"Invalid Groq response")}),c(s=>(console.log("Groq: Serverless API failed:",s.message),new u(o=>{o.error(s)}))))}generateWithGemini(e){let t=e.keyword,r=e.wordCount,i=this.getToneDescription(e.tone),s=[{parts:[{text:`Write a complete ${r}+ word article about "${t}". 

Requirements:
- Tone: ${i}
- Natural human-like writing, not robotic
- 6-8 H2 sections with detailed paragraphs
- Include bullet points
- SEO optimized with keyword "${t}"

IMPORTANT: Include image placeholders in your article using this format:
[featured-image: ${t} hero image]
[intro-image: ${t} related image]
[product-image: ${t} product/feature image]

Add these placeholders naturally in relevant sections.

Format with HTML tags: <h2>, <p>, <ul>, <li> tags.`}]}],o=this.getSelectedGeminiModel();return this.serverless.generateWithGemini(s,o,.9).pipe(g(a=>{if(a.candidates?.[0]?.content?.parts?.[0]?.text)return this.processGeneratedContent(a.candidates[0].content.parts[0].text,e);throw new Error(a.error?.message||"Invalid response")}),c(a=>(console.log("Gemini: Serverless API failed:",a.message),new u(l=>{l.error(a)}))))}generateWithClaude(e){let t=e.keyword,r=e.wordCount,i=this.multiAI.getSelectedModel(),n=this.multiAI.getActiveProvider(),o=(n?.models.find(h=>h.id===i)||n?.models[0])?.id||"claude-sonnet-4-6-20250514";console.log("CLAUDE: Using model:",o);let l=[{role:"user",content:`Write a complete ${r}+ word article about "${t}" in natural human tone. Include 6-8 H2 sections, bullet points, and SEO optimization. Use HTML tags: <h2>, <p>, <ul>, <li>.`}];return this.serverless.generateWithClaude(l,o,8e3).pipe(g(h=>{if(h.content?.[0]?.text)return this.processGeneratedContent(h.content[0].text,e);throw new Error(h.error?.message||"Invalid Claude response")}),c(h=>(console.log("Claude: Serverless API failed:",h.message),new u(p=>{p.error(h)}))))}generateLocally(e){let t=e.keyword,r=e.wordCount,i=Math.max(6,Math.floor(r/120)),n=this.generateIntroduction(t);return n+=this.generateSections(t,i),n+=this.generateConclusion(t),y(this.processGeneratedContent(n,e))}generateIntroduction(e){let t=[`<h2>The Complete Guide to ${this.capitalize(e)}</h2>

<p>Let me be straight with you: if you're looking for fluff and filler content about ${e}, you've come to the wrong place. This is the real deal - the kind of information I wish someone had handed me when I first started diving into this topic.</p>

<p>After spending years in this space, testing, failing, learning, and eventually figuring out what actually works, I'm ready to share everything I've discovered. No hype, no empty promises - just genuine insights.</p>

<p>Whether you're just starting out or looking to level up your existing knowledge, there's something here for you. Let's get into it.</p>`,`<h2>Everything About ${this.capitalize(e)}</h2>

<p>Here's the thing about ${e} - everyone seems to have an opinion, but few people actually know what they're talking about. I've been there, confused by conflicting advice, wondering who to believe.</p>

<p>That's exactly why I put together this comprehensive guide. After months of research, testing, and real-world experience, I can tell you what actually works and what doesn't.</p>

<p>So grab a coffee, and let's dive deep into everything you need to know about ${e}.</p>`];return t[Math.floor(Math.random()*t.length)]}generateSections(e,t){let r=this.getTopicTemplates(e),i="";for(let n=0;n<t;n++){let s=r[n%r.length];i+=`

`+this.generateSection(e,s)}return i}generateSection(e,t){let r=[`<h2>${t}</h2>

<p>Here's something most people don't tell you about ${t}: the devil is truly in the details. When you really dig into ${e}, you'll discover that success comes down to understanding a few core principles.</p>

<p>I've seen countless people overcomplicate this. They add layers of complexity that simply aren't necessary. The simpler approach often wins. What we need is clarity, not more features or options.</p>

<p>The data backs this up consistently. Studies show that focusing on fundamentals rather than chasing trends leads to much better long-term results.</p>

<ul>
<li>Focus on what matters most - everything else is noise</li>
<li>Consistency compounds - small daily improvements add up</li>
<li>Embrace failure as feedback - every setback contains value</li>
<li>Keep learning and adapting - the best never stop growing</li>
</ul>`,`<h2>${t}</h2>

<p>Now, here's where it gets interesting. The best practitioners share one common trait: they're obsessed with continuous improvement. Never satisfied, always learning.</p>

<p>Think about it. The most successful people didn't get there by accident. They put in the work when others quit. They pushed through doubts and kept going.</p>

<p>I've coached dozens of people through this process, and the transformation is always remarkable. What starts as confusion becomes clarity, and clarity becomes competence.</p>

<ul>
<li>Start simple - complexity is the enemy of execution</li>
<li>Measure what matters - data drives better decisions</li>
<li>Build habits, not motivation - consistency beats intensity</li>
<li>Iterate constantly - perfect is the enemy of progress</li>
</ul>`,`<h2>${t}</h2>

<p>But here's the kicker: most people give up too soon. They expect overnight success and quit when it doesn't happen. I've been there, confused by setbacks, wondering if it's worth continuing.</p>

<p>What I've found works surprisingly well is patience combined with action. You need both - you can't just wait, but you also can't rush greatness.</p>

<p>The practical applications are endless. From improving daily workflows to long-term planning, ${e} touches every aspect of what we do.</p>

<ul>
<li>Prioritize ruthlessly - you cannot do everything at once</li>
<li>Focus on value creation - everything else is secondary</li>
<li>Cultivate patience - big results take time</li>
<li>Stay curious - the learning never stops</li>
</ul>`];return r[Math.floor(Math.random()*r.length)]}generateConclusion(e){return`

<h2>The Bottom Line on ${this.capitalize(e)}</h2>

<p>Alright, we've covered a lot of ground here. If there's one thing I want you to take away, it's this: ${e} isn't about perfection. It's about progress.</p>

<p>Start where you are. Use what you have. Do what you can. The journey of a thousand miles truly begins with a single step.</p>

<p>I've shared everything I know, but remember - knowledge alone isn't power. It's only power when you take action.</p>

<p>If you found this helpful, drop a comment below. Let's keep the conversation going.</p>`}getTopicTemplates(e){return[`Understanding ${this.capitalize(e)}`,`Getting Started with ${this.capitalize(e)}`,"Common Mistakes to Avoid","Advanced Strategies That Work","Tools and Resources You Need","Real-World Examples and Case Studies","Tips from the Experts","Measuring Your Success"]}capitalize(e){return e.split(" ").map(t=>t.charAt(0).toUpperCase()+t.slice(1).toLowerCase()).join(" ")}getToneDescription(e){switch(e){case"professional":return"conversational yet authoritative";case"casual":return"friendly and relatable";case"educational":return"clear and informative";case"persuasive":return"compelling and action-oriented";default:return"engaging and informative"}}processGeneratedContent(e,t,r=[],i=[]){let n="",s=e.match(/<h2[^>]*>([^<]+)<\/h2>/gi);if(s&&s.length>0){let l=s[0].replace(/<[^>]*>/g,"");l.length>10&&l.length<60&&(n=l)}n||(n=`The Ultimate Guide to ${t.keyword}`);let o=e;if(r.length>0&&!e.includes("<img")){console.log("Injecting",r.length,"images into article");let l=r.slice(0,3).map(p=>`<img src="${p}" alt="${t.keyword}" style="max-width:100%;margin:20px 0;border-radius:8px;" />`).join(`
`),h=e.split(/<\/p>/i);h.length>2?(h.splice(2,0,l),o=h.join("</p>")):o=l+e}let a=this.seoAnalyzer.generateMetaDescription(o,t.keyword);return{title:n,content:o,metaDescription:a,focusKeyword:t.keyword,suggestedTags:this.generateTags(t.keyword),featuredImage:r.length>0?{id:"featured",url:r[0],thumbnailUrl:r[0],altText:t.keyword,photographer:"Stock",photographerUrl:"",source:"google"}:null,contentImages:r.slice(1,4).map((l,h)=>({id:`content-${h}`,url:l,thumbnailUrl:l,altText:t.keyword,photographer:"Stock",photographerUrl:"",source:"google"})),images:r,specs:i}}generateTags(e){return[e,this.capitalize(e),`${e} guide`,`${e} tips`,"how to","best practices"].slice(0,8)}improveContent(e,t){return this.generateLocally({keyword:t,tone:"casual",wordCount:1500,template:"article",includeImages:!0}).pipe(g(r=>r.content))}generateTitle(e){let t=[`${this.capitalize(e)}: The Complete Guide That Works`,`How to Master ${this.capitalize(e)} (Step-by-Step)`,`${this.capitalize(e)}: Everything You Need to Know`,`The Ultimate ${this.capitalize(e)} Blueprint`];return y(t.join(`
`))}static \u0275fac=function(t){return new(t||m)(f(C),f(k),f(T),f(w))};static \u0275prov=v({token:m,factory:m.\u0275fac,providedIn:"root"})};export{E as a};
