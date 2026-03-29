import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./features/post-creator/post-creator.component').then(
            (m) => m.PostCreatorComponent,
          ),
      },
      {
        path: 'posts',
        loadComponent: () =>
          import('./features/post-list/post-list.component').then((m) => m.PostListComponent),
      },
      {
        path: 'scheduler',
        loadComponent: () =>
          import('./features/scheduler/scheduler.component').then((m) => m.SchedulerComponent),
      },
      {
        path: 'tech-auto-poster',
        loadComponent: () =>
          import('./features/tech-auto-poster/tech-auto-poster.component').then(
            (m) => m.TechAutoPosterComponent,
          ),
      },
      {
        path: 'ai-auto-poster',
        loadComponent: () =>
          import('./features/ai-auto-poster/ai-auto-poster.component').then(
            (m) => m.AiAutoPosterComponent,
          ),
      },
      {
        path: 'ai-models',
        loadComponent: () =>
          import('./features/ai-model-selector/ai-model-selector.component').then(
            (m) => m.AiModelSelectorComponent,
          ),
      },
      {
        path: 'content-tools',
        loadComponent: () =>
          import('./features/content-tools/content-tools.component').then(
            (m) => m.ContentToolsComponent,
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics-dashboard/analytics-dashboard.component').then(
            (m) => m.AnalyticsDashboardComponent,
          ),
      },
      {
        path: 'content-calendar',
        loadComponent: () =>
          import('./features/content-calendar/content-calendar.component').then(
            (m) => m.ContentCalendarComponent,
          ),
      },
      {
        path: 'seo-center',
        loadComponent: () =>
          import('./features/seo-dashboard/seo-dashboard.component').then(
            (m) => m.SeoDashboardComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'search-engine-manager',
        loadComponent: () =>
          import('./features/search-engine-manager/search-engine-manager.component').then(
            (m) => m.SearchEngineManagerComponent,
          ),
      },
      {
        path: 'social-campaigns',
        loadComponent: () =>
          import('./features/social-campaigns/social-campaigns.component').then(
            (m) => m.SocialCampaignsComponent,
          ),
      },
      {
        path: 'backlink-manager',
        loadComponent: () =>
          import('./features/backlink-manager/backlink-manager.component').then(
            (m) => m.BacklinkManagerComponent,
          ),
      },
      {
        path: 'keyword-tracker',
        loadComponent: () =>
          import('./features/keyword-tracker/keyword-tracker.component').then(
            (m) => m.KeywordTrackerComponent,
          ),
      },
      {
        path: 'competitor-analyzer',
        loadComponent: () =>
          import('./features/competitor-analyzer/competitor-analyzer.component').then(
            (m) => m.CompetitorAnalyzerComponent,
          ),
      },
      {
        path: 'site-health',
        loadComponent: () =>
          import('./features/site-health/site-health.component').then((m) => m.SiteHealthComponent),
      },
      {
        path: 'schema-generator',
        loadComponent: () =>
          import('./features/schema-generator/schema-generator.component').then(
            (m) => m.SchemaGeneratorComponent,
          ),
      },
      {
        path: 'internal-links',
        loadComponent: () =>
          import('./features/internal-link-analyzer/internal-link-analyzer.component').then(
            (m) => m.InternalLinkAnalyzerComponent,
          ),
      },
      {
        path: 'brand-mentions',
        loadComponent: () =>
          import('./features/brand-mentions/brand-mentions.component').then(
            (m) => m.BrandMentionsComponent,
          ),
      },
      {
        path: 'local-seo',
        loadComponent: () =>
          import('./features/local-seo/local-seo.component').then((m) => m.LocalSeoComponent),
      },
      {
        path: 'content-gap',
        loadComponent: () =>
          import('./features/content-gap/content-gap.component').then((m) => m.ContentGapComponent),
      },
      {
        path: 'outreach-manager',
        loadComponent: () =>
          import('./features/outreach-manager/outreach-manager.component').then(
            (m) => m.OutreachManagerComponent,
          ),
      },
      {
        path: 'guest-post-finder',
        loadComponent: () =>
          import('./features/guest-post-finder/guest-post-finder.component').then(
            (m) => m.GuestPostFinderComponent,
          ),
      },
      {
        path: 'serp-tracker',
        loadComponent: () =>
          import('./features/serp-tracker/serp-tracker.component').then(
            (m) => m.SerpTrackerComponent,
          ),
      },
      {
        path: 'speed-monitor',
        loadComponent: () =>
          import('./features/speed-monitor/speed-monitor.component').then(
            (m) => m.SpeedMonitorComponent,
          ),
      },
      {
        path: 'seo-audit',
        loadComponent: () =>
          import('./features/seo-audit/seo-audit.component').then((m) => m.SeoAuditComponent),
      },
      {
        path: 'link-opportunities',
        loadComponent: () =>
          import('./features/link-opportunities/link-opportunities.component').then(
            (m) => m.LinkOpportunitiesComponent,
          ),
      },
      {
        path: 'traffic-analyzer',
        loadComponent: () =>
          import('./features/traffic-analyzer/traffic-analyzer.component').then(
            (m) => m.TrafficAnalyzerComponent,
          ),
      },
      {
        path: 'rank-checker',
        loadComponent: () =>
          import('./features/rank-checker/rank-checker.component').then(
            (m) => m.RankCheckerComponent,
          ),
      },
      {
        path: 'meta-analyzer',
        loadComponent: () =>
          import('./features/meta-analyzer/meta-analyzer.component').then(
            (m) => m.MetaAnalyzerComponent,
          ),
      },
      {
        path: 'image-optimizer',
        loadComponent: () =>
          import('./features/image-optimizer/image-optimizer.component').then(
            (m) => m.ImageOptimizerComponent,
          ),
      },
      {
        path: 'robots-txt-editor',
        loadComponent: () =>
          import('./features/robots-txt-editor/robots-txt-editor.component').then(
            (m) => m.RobotsTxtEditorComponent,
          ),
      },
      {
        path: 'sitemap-generator',
        loadComponent: () =>
          import('./features/sitemap-generator/sitemap-generator.component').then(
            (m) => m.SitemapGeneratorComponent,
          ),
      },
      {
        path: 'canonical-url-checker',
        loadComponent: () =>
          import('./features/canonical-url-checker/canonical-url-checker.component').then(
            (m) => m.CanonicalUrlCheckerComponent,
          ),
      },
      {
        path: 'redirect-manager',
        loadComponent: () =>
          import('./features/redirect-manager/redirect-manager.component').then(
            (m) => m.RedirectManagerComponent,
          ),
      },
      {
        path: 'master-tools',
        loadComponent: () =>
          import('./features/master-tools/master-tools.component').then(
            (m) => m.MasterToolsComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
