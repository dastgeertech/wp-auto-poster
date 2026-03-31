import{a as U,c as z}from"./chunk-LLW3VPZI.js";import"./chunk-X5TSA4BP.js";import{a as N,b as F}from"./chunk-4SH45IUK.js";import"./chunk-CS5RL5QQ.js";import"./chunk-2S6UCPCU.js";import{c as R,g as A,i as B,n as I}from"./chunk-W3ZJDQYF.js";import"./chunk-DMZZBIM3.js";import"./chunk-6CEIW5JD.js";import"./chunk-RSJ7AVN5.js";import{Cc as D,Da as r,Dd as S,Ed as k,Gd as y,Id as T,Ja as M,Jb as n,Kb as p,Pa as h,Pb as P,Qb as O,Rb as E,bb as _,cb as C,eb as f,fa as b,fb as g,ga as w,gb as u,ib as e,jb as t,ra as m,rb as v,tb as c,vb as x}from"./chunk-53BGFLSJ.js";var j=(a,o)=>o.name;function W(a,o){if(a&1&&(e(0,"li",18),n(1),t()),a&2){let i=o.$implicit;r(),p(i)}}function G(a,o){if(a&1&&(e(0,"div",10)(1,"h3")(2,"mat-icon"),n(3,"warning"),t(),n(4," Validation Issues"),t(),e(5,"ul"),g(6,W,2,1,"li",18,f),t()()),a&2){let i=x();r(6),u(i.validationErrors())}}function $(a,o){if(a&1&&(e(0,"li",19),n(1),t()),a&2){let i=o.$implicit;r(),p(i)}}function q(a,o){if(a&1&&(e(0,"div",11)(1,"h3")(2,"mat-icon"),n(3,"lightbulb"),t(),n(4," Suggestions"),t(),e(5,"ul"),g(6,$,2,1,"li",19,f),t()()),a&2){let i=x();r(6),u(i.suggestions())}}function L(a,o){if(a&1){let i=v();e(0,"div",20),c("click",function(){let s=b(i).$implicit,d=x();return w(d.applyTemplate(s.content))}),e(1,"mat-icon"),n(2),t(),e(3,"span"),n(4),t()()}if(a&2){let i=o.$implicit;r(2),p(i.icon),r(2),p(i.name)}}var V=class a{constructor(o){this.snackBar=o}robotsContent=m(`User-agent: *
Allow: /
Disallow: /wp-admin/
Disallow: /wp-includes/
Disallow: /wp-content/plugins/
Disallow: /wp-content/cache/
Disallow: /wp-json/
Disallow: /?s=
Disallow: /*/trackback/
Disallow: /*/feed/
Disallow: /*/comments/

Sitemap: https://yoursite.com/sitemap.xml
`);validationErrors=m([]);suggestions=m([]);templates=[{name:"WordPress Default",icon:"wordpress",content:`User-agent: *
Allow: /
Disallow: /wp-admin/
Disallow: /wp-includes/

Sitemap: https://yoursite.com/sitemap.xml
`},{name:"Block All Bots",icon:"block",content:`User-agent: *
Disallow: /
`},{name:"Allow Google Only",icon:"search",content:`User-agent: Googlebot
Allow: /

User-agent: *
Disallow: /
`},{name:"E-commerce",icon:"shopping_cart",content:`User-agent: *
Allow: /
Disallow: /cart/
Disallow: /checkout/
Disallow: /my-account/
Disallow: /wp-admin/

Sitemap: https://yoursite.com/sitemap.xml
`},{name:"Blog Only",icon:"article",content:`User-agent: *
Allow: /
Disallow: /wp-admin/
Disallow: /wp-includes/
Disallow: /trackback/
Disallow: /comments/

Sitemap: https://yoursite.com/sitemap.xml
`},{name:"Aggressive SEO",icon:"trending_up",content:`User-agent: *
Allow: /
Disallow: /wp-admin/
Disallow: /wp-includes/
Disallow: /?s=
Disallow: /page/
Crawl-delay: 1

Sitemap: https://yoursite.com/sitemap.xml
`}];onContentChange(){this.validationErrors.set([]),this.suggestions.set([])}validateRobots(){let o=this.robotsContent(),i=[],l=[];o.includes("User-agent:")||i.push("Missing User-agent directive"),!o.includes("Disallow:")&&!o.includes("Allow:")&&i.push("No Disallow or Allow rules defined"),o.includes("Disallow: /")&&o.includes("Allow: /")&&i.push("Conflicting Disallow and Allow rules for root path"),o.toLowerCase().includes("sitemap:")||l.push("Consider adding a Sitemap directive"),o.includes("Crawl-delay")||l.push("Consider adding Crawl-delay for better server performance"),o.includes("Disallow: /wp-includes/")&&o.includes("Allow: /wp-includes/")&&i.push("Conflicting rules for wp-includes directory"),this.validationErrors.set(i),this.suggestions.set(l)}resetToDefault(){this.robotsContent.set(`User-agent: *
Allow: /
Disallow: /wp-admin/
Disallow: /wp-includes/
Disallow: /wp-content/plugins/
Disallow: /wp-content/cache/
Disallow: /wp-json/
Disallow: /?s=
Disallow: /*/trackback/
Disallow: /*/feed/
Disallow: /*/comments/

Sitemap: https://yoursite.com/sitemap.xml
`),this.snackBar.open("Reset to default","Close",{duration:2e3})}applyTemplate(o){this.robotsContent.set(o),this.snackBar.open("Template applied","Close",{duration:2e3})}saveRobots(){localStorage.setItem("robots_txt",this.robotsContent()),this.snackBar.open("Robots.txt saved!","Close",{duration:2e3})}static \u0275fac=function(i){return new(i||a)(M(N))};static \u0275cmp=h({type:a,selectors:[["app-robots-txt-editor"]],decls:68,vars:3,consts:[[1,"robots-editor"],[1,"page-header"],[1,"editor-card"],[1,"editor-toolbar"],[1,"file-path"],[1,"toolbar-actions"],["mat-stroked-button","",3,"click"],["mat-flat-button","",1,"save-btn",3,"click"],[1,"editor-area"],["placeholder","Enter robots.txt content...","spellcheck","false",3,"ngModelChange","input","ngModel"],[1,"validation-panel"],[1,"suggestions-panel"],[1,"templates-section"],[1,"template-grid"],[1,"template-card"],[1,"rules-guide"],[1,"rule-list"],[1,"rule-item"],[1,"error"],[1,"suggestion"],[1,"template-card",3,"click"]],template:function(i,l){i&1&&(e(0,"div",0)(1,"div",1)(2,"h1")(3,"mat-icon"),n(4,"settings_ethernet"),t(),n(5," Robots.txt Editor"),t(),e(6,"p"),n(7,"Manage your site's robots.txt file to control search engine crawling"),t()(),e(8,"div",2)(9,"div",3)(10,"span",4),n(11,"robots.txt"),t(),e(12,"div",5)(13,"button",6),c("click",function(){return l.validateRobots()}),e(14,"mat-icon"),n(15,"check_circle"),t(),n(16," Validate "),t(),e(17,"button",6),c("click",function(){return l.resetToDefault()}),e(18,"mat-icon"),n(19,"refresh"),t(),n(20," Reset Default "),t(),e(21,"button",7),c("click",function(){return l.saveRobots()}),e(22,"mat-icon"),n(23,"save"),t(),n(24," Save "),t()()(),e(25,"div",8)(26,"textarea",9),E("ngModelChange",function(d){return O(l.robotsContent,d)||(l.robotsContent=d),d}),c("input",function(){return l.onContentChange()}),t()(),_(27,G,8,0,"div",10),_(28,q,8,0,"div",11),t(),e(29,"div",12)(30,"h2")(31,"mat-icon"),n(32,"library_add"),t(),n(33," Quick Templates"),t(),e(34,"div",13),g(35,L,5,2,"div",14,j),t()(),e(37,"div",15)(38,"h2")(39,"mat-icon"),n(40,"help"),t(),n(41," Common Rules Guide"),t(),e(42,"div",16)(43,"div",17)(44,"code"),n(45,"User-agent: *"),t(),e(46,"span"),n(47,"Applies to all crawlers"),t()(),e(48,"div",17)(49,"code"),n(50,"Disallow: /wp-admin/"),t(),e(51,"span"),n(52,"Blocks admin directory"),t()(),e(53,"div",17)(54,"code"),n(55,"Allow: /wp-admin/admin-ajax.php"),t(),e(56,"span"),n(57,"Permits AJAX requests"),t()(),e(58,"div",17)(59,"code"),n(60,"Sitemap: https://yoursite.com/sitemap.xml"),t(),e(61,"span"),n(62,"Points to your sitemap"),t()(),e(63,"div",17)(64,"code"),n(65,"Crawl-delay: 1"),t(),e(66,"span"),n(67,"1 second delay between requests"),t()()()()()),i&2&&(r(26),P("ngModel",l.robotsContent),r(),C(l.validationErrors().length>0?27:-1),r(),C(l.suggestions().length>0?28:-1),r(7),u(l.templates))},dependencies:[D,I,R,A,B,k,S,T,y,z,U,F],styles:[".robots-editor[_ngcontent-%COMP%]{padding:32px;max-width:1200px;margin:0 auto}.page-header[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]{display:flex;align-items:center;gap:12px;margin:0 0 8px;font-size:28px;color:#fff}.page-header[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:#e94560}.page-header[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{margin:0 0 24px;color:#a0a0b8}.editor-card[_ngcontent-%COMP%]{background:#1a1a2e;border-radius:12px;overflow:hidden;margin-bottom:32px}.editor-toolbar[_ngcontent-%COMP%]{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#16213e;border-bottom:1px solid rgba(255,255,255,.05)}.editor-toolbar[_ngcontent-%COMP%]   .file-path[_ngcontent-%COMP%]{font-family:monospace;color:#4caf50;font-size:14px}.editor-toolbar[_ngcontent-%COMP%]   .toolbar-actions[_ngcontent-%COMP%]{display:flex;gap:12px}.save-btn[_ngcontent-%COMP%]{background:#e94560!important;color:#fff!important}.editor-area[_ngcontent-%COMP%]{padding:0}.editor-area[_ngcontent-%COMP%]   textarea[_ngcontent-%COMP%]{width:100%;min-height:400px;background:#0f0f1a;color:#e0e0e0;border:none;padding:20px;font-family:Courier New,monospace;font-size:14px;line-height:1.6;resize:vertical;outline:none}.validation-panel[_ngcontent-%COMP%], .suggestions-panel[_ngcontent-%COMP%]{padding:20px}.validation-panel[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%], .suggestions-panel[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%]{display:flex;align-items:center;gap:8px;margin:0 0 12px;font-size:14px;color:#fff}.validation-panel[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%], .suggestions-panel[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]{list-style:none;padding:0;margin:0}.validation-panel[_ngcontent-%COMP%]   li[_ngcontent-%COMP%], .suggestions-panel[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]{padding:8px 12px;margin-bottom:8px;border-radius:6px;font-size:13px}.validation-panel[_ngcontent-%COMP%]{background:#f443361a;border-top:1px solid rgba(244,67,54,.3)}.validation-panel[_ngcontent-%COMP%]   .error[_ngcontent-%COMP%]{background:#f4433633;color:#f44336}.suggestions-panel[_ngcontent-%COMP%]{background:#4caf501a;border-top:1px solid rgba(76,175,80,.3)}.suggestions-panel[_ngcontent-%COMP%]   .suggestion[_ngcontent-%COMP%]{background:#4caf5033;color:#4caf50}.templates-section[_ngcontent-%COMP%], .rules-guide[_ngcontent-%COMP%]{margin-bottom:32px}.templates-section[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%], .rules-guide[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{display:flex;align-items:center;gap:8px;margin:0 0 16px;font-size:18px;color:#fff}.templates-section[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%], .rules-guide[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:#e94560}.template-grid[_ngcontent-%COMP%]{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}.template-card[_ngcontent-%COMP%]{display:flex;align-items:center;gap:12px;padding:16px;background:#1a1a2e;border-radius:8px;cursor:pointer;transition:all .2s}.template-card[_ngcontent-%COMP%]:hover{background:#16213e}.template-card[_ngcontent-%COMP%]:hover   mat-icon[_ngcontent-%COMP%]{color:#e94560}.template-card[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:#a0a0b8}.template-card[_ngcontent-%COMP%]   span[_ngcontent-%COMP%]{font-size:14px;color:#e0e0e0}.rule-list[_ngcontent-%COMP%]{display:grid;gap:8px}.rule-item[_ngcontent-%COMP%]{display:flex;align-items:center;gap:16px;padding:12px 16px;background:#1a1a2e;border-radius:8px}.rule-item[_ngcontent-%COMP%]   code[_ngcontent-%COMP%]{background:#0f0f1a;padding:4px 12px;border-radius:4px;color:#4caf50;font-family:monospace;font-size:13px}.rule-item[_ngcontent-%COMP%]   span[_ngcontent-%COMP%]{color:#a0a0b8;font-size:14px}"]})};export{V as RobotsTxtEditorComponent};
