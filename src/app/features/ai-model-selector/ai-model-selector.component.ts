import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import {
  MultiAIProviderService,
  AIProvider,
  AIModel,
} from '../../core/services/multi-ai-provider.service';

@Component({
  selector: 'app-ai-model-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  template: `
    <div class="ai-selector">
      <div class="selector-header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>psychology</mat-icon>
          </div>
          <div class="header-text">
            <h2>AI Content Generation</h2>
            <p>Select your preferred AI model for generating SEO-optimized articles</p>
          </div>
        </div>

        <!-- Current Selection Badge -->
        @if (getActiveModel()) {
          <div class="active-badge">
            <span class="badge-label">Active:</span>
            <span class="badge-value">{{ getActiveModel()?.name }}</span>
          </div>
        }
      </div>

      <!-- Provider Tabs -->
      <div class="provider-tabs">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'providers'"
          (click)="activeTab.set('providers')"
        >
          <mat-icon>apps</mat-icon>
          All Providers
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'default'"
          (click)="activeTab.set('default')"
        >
          <mat-icon>star</mat-icon>
          Default Model
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'test'"
          (click)="activeTab.set('test')"
        >
          <mat-icon>science</mat-icon>
          Test
        </button>
      </div>

      <!-- Providers Tab -->
      @if (activeTab() === 'providers') {
        <div class="tab-content">
          <!-- Free Providers Section -->
          <div class="section">
            <h3 class="section-title">
              <mat-icon>bolt</mat-icon>
              Free & Local Models
            </h3>
            <div class="provider-grid free">
              @for (provider of getFreeProviders(); track provider.id) {
                <div
                  class="provider-card"
                  [class.selected]="selectedProvider()?.id === provider.id"
                  (click)="selectProvider(provider)"
                >
                  <div class="card-header">
                    <div class="provider-icon" [style.background]="provider.color + '20'">
                      {{ provider.logo }}
                    </div>
                    <div class="provider-status">
                      @if (selectedProvider()?.id === provider.id) {
                        <mat-icon class="status-active">check_circle</mat-icon>
                      } @else {
                        <mat-icon class="status-inactive">radio_button_unchecked</mat-icon>
                      }
                    </div>
                  </div>
                  <div class="card-body">
                    <h4>{{ provider.name }}</h4>
                    <p class="description">{{ getProviderDescription(provider) }}</p>
                  </div>
                  <div class="card-footer">
                    <span class="model-badge">{{ provider.models.length }} models</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- API Providers Section -->
          <div class="section">
            <h3 class="section-title">
              <mat-icon>key</mat-icon>
              API Providers
              <span class="subtitle">Requires API key</span>
            </h3>
            <div class="provider-grid api">
              @for (provider of getApiProviders(); track provider.id) {
                <div
                  class="provider-card"
                  [class.selected]="selectedProvider()?.id === provider.id"
                  [class.has-key]="hasApiKey(provider.id)"
                  (click)="selectProvider(provider)"
                >
                  <div class="card-header">
                    <div class="provider-icon" [style.background]="provider.color + '20'">
                      {{ provider.logo }}
                    </div>
                    <div class="provider-status">
                      @if (selectedProvider()?.id === provider.id) {
                        <mat-icon class="status-active">check_circle</mat-icon>
                      } @else if (hasApiKey(provider.id)) {
                        <mat-icon class="status-key">vpn_key</mat-icon>
                      } @else {
                        <mat-icon class="status-locked">lock</mat-icon>
                      }
                    </div>
                  </div>
                  <div class="card-body">
                    <h4>{{ provider.name }}</h4>
                    <p class="description">{{ getProviderDescription(provider) }}</p>
                  </div>
                  <div class="card-footer">
                    <span class="model-badge">{{ provider.models.length }} models</span>
                    @if (hasApiKey(provider.id)) {
                      <span class="status-badge configured">
                        <mat-icon>check</mat-icon>
                        Configured
                      </span>
                    } @else {
                      <span class="status-badge required">
                        <mat-icon>add</mat-icon>
                        Add Key
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Default Model Tab -->
      @if (activeTab() === 'default') {
        <div class="tab-content">
          <div class="default-info">
            <mat-icon>info</mat-icon>
            <p>
              Select your default AI model. This model will be used for content generation when no
              specific model is chosen.
            </p>
          </div>

          <div class="default-options">
            @for (provider of getAllAvailableProviders(); track provider.id) {
              <div
                class="default-option"
                [class.selected]="isDefaultProvider(provider.id)"
                (click)="setDefaultProvider(provider.id)"
              >
                <div class="option-icon" [style.background]="provider.color + '20'">
                  {{ provider.logo }}
                </div>
                <div class="option-content">
                  <h4>{{ provider.name }}</h4>
                  <div class="option-model">
                    @if (isDefaultProvider(provider.id)) {
                      <mat-form-field appearance="outline" class="model-dropdown">
                        <mat-select
                          [value]="getDefaultModel(provider.id)"
                          (selectionChange)="setDefaultModel(provider.id, $event.value)"
                          (click)="$event.stopPropagation()"
                        >
                          @for (model of provider.models; track model.id) {
                            <mat-option [value]="model.id">
                              {{ model.name }}
                              <span class="model-specs">{{
                                formatContext(model.contextWindow)
                              }}</span>
                            </mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    } @else {
                      <span class="default-model-name">{{ provider.models[0]?.name }}</span>
                    }
                  </div>
                </div>
                @if (isDefaultProvider(provider.id)) {
                  <mat-icon class="check-icon">check_circle</mat-icon>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Test Tab -->
      @if (activeTab() === 'test') {
        <div class="tab-content">
          <div class="test-section">
            <div class="test-header">
              <h3>
                <mat-icon>science</mat-icon>
                Test AI Generation
              </h3>
              @if (getActiveModel()) {
                <div class="active-model-chip">
                  <span>{{ getActiveModel()?.name }}</span>
                </div>
              }
            </div>

            <div class="test-input-row">
              <mat-form-field appearance="outline" class="test-input">
                <mat-label>Enter a keyword to test</mat-label>
                <input
                  matInput
                  [(ngModel)]="testKeyword"
                  placeholder="e.g., iPhone 16 Pro review"
                />
                <mat-icon matPrefix>search</mat-icon>
              </mat-form-field>
              <button
                mat-flat-button
                class="test-btn"
                (click)="testGeneration()"
                [disabled]="!testKeyword.trim() || testing()"
              >
                @if (testing()) {
                  <mat-spinner diameter="20"></mat-spinner>
                  Generating...
                } @else {
                  <mat-icon>auto_awesome</mat-icon>
                  Generate
                }
              </button>
            </div>

            @if (testError()) {
              <div class="test-error">
                <mat-icon>error</mat-icon>
                <div class="error-content">
                  <strong>Generation Failed</strong>
                  <p>{{ testError() }}</p>
                </div>
              </div>
            }

            @if (testResult()) {
              <div class="test-result">
                <div class="result-header">
                  <h4>
                    <mat-icon>check_circle</mat-icon>
                    Generation Successful
                  </h4>
                  <button mat-icon-button (click)="clearTestResult()">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <div class="result-body">
                  <h3>{{ testResult()!.title }}</h3>
                  <div class="result-meta">
                    <span class="meta-item">
                      <mat-icon>text_fields</mat-icon>
                      {{ testResult()!.wordCount }} words
                    </span>
                    <span class="meta-item">
                      <mat-icon>auto_awesome</mat-icon>
                      {{ getActiveModel()?.name }}
                    </span>
                  </div>
                  <div class="result-preview" [innerHTML]="testResult()!.preview"></div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- API Key Modal -->
      @if (showApiKeyModal()) {
        <div class="modal-overlay" (click)="closeApiKeyModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-icon" [style.background]="selectedProvider()!.color + '20'">
                {{ selectedProvider()!.logo }}
              </div>
              <div class="modal-title">
                <h3>Configure {{ selectedProvider()!.name }}</h3>
                <p>Enter your API key to enable this provider</p>
              </div>
              <button mat-icon-button (click)="closeApiKeyModal()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="modal-body">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>API Key</mat-label>
                <input
                  matInput
                  [type]="showApiKey() ? 'text' : 'password'"
                  [(ngModel)]="apiKeyInput"
                  [placeholder]="getApiKeyPlaceholder()"
                />
                <button mat-icon-button matSuffix (click)="toggleShowApiKey()">
                  <mat-icon>{{ showApiKey() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>

              <a [href]="getApiKeyUrl()" target="_blank" class="get-key-link">
                <mat-icon>open_in_new</mat-icon>
                Get API Key from {{ selectedProvider()!.name }}
              </a>
            </div>

            <div class="modal-footer">
              <button mat-button (click)="closeApiKeyModal()">Cancel</button>
              <button
                mat-flat-button
                class="save-btn"
                (click)="saveApiKey()"
                [disabled]="!apiKeyInput.trim()"
              >
                <mat-icon>save</mat-icon>
                Save API Key
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .ai-selector {
        max-width: 1200px;
        margin: 0 auto;
        padding: 24px;
      }

      /* Header */
      .selector-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding: 24px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 20px;
        border: 1px solid rgba(233, 69, 96, 0.2);
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .header-icon {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: white;
        }
      }

      .header-text {
        h2 {
          margin: 0 0 4px;
          font-size: 24px;
          font-weight: 700;
          color: white;
        }

        p {
          margin: 0;
          color: #888;
          font-size: 14px;
        }
      }

      .active-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: rgba(0, 217, 165, 0.1);
        border: 1px solid rgba(0, 217, 165, 0.3);
        border-radius: 30px;

        .badge-label {
          color: #888;
          font-size: 12px;
        }

        .badge-value {
          color: #00d9a5;
          font-weight: 600;
          font-size: 14px;
        }
      }

      /* Tabs */
      .provider-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 24px;
        padding: 8px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 16px;
      }

      .tab-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: transparent;
        border: none;
        border-radius: 12px;
        color: #888;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        &:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        &.active {
          background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
          color: white;
        }
      }

      /* Tab Content */
      .tab-content {
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Section */
      .section {
        margin-bottom: 32px;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 20px;
        font-size: 16px;
        font-weight: 600;
        color: white;

        mat-icon {
          color: #e94560;
        }

        .subtitle {
          margin-left: auto;
          font-size: 12px;
          font-weight: 400;
          color: #666;
        }
      }

      /* Provider Grid */
      .provider-grid {
        display: grid;
        gap: 16px;

        &.free {
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }

        &.api {
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        }
      }

      /* Provider Card */
      .provider-card {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border: 2px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: rgba(233, 69, 96, 0.3);
          transform: translateY(-2px);
        }

        &.selected {
          border-color: #00d9a5;
          background: linear-gradient(
            135deg,
            rgba(0, 217, 165, 0.1) 0%,
            rgba(0, 184, 148, 0.05) 100%
          );
        }

        &.has-key {
          border-color: rgba(0, 217, 165, 0.3);
        }
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .provider-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }

      .provider-status {
        mat-icon {
          &.status-active {
            color: #00d9a5;
          }
          &.status-inactive {
            color: #444;
          }
          &.status-key {
            color: #00d9a5;
          }
          &.status-locked {
            color: #666;
          }
        }
      }

      .card-body {
        margin-bottom: 16px;

        h4 {
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 600;
          color: white;
        }

        .description {
          margin: 0;
          font-size: 13px;
          color: #888;
          line-height: 1.5;
        }
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .model-badge {
        padding: 4px 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        font-size: 11px;
        color: #888;
      }

      .status-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 500;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }

        &.connected {
          background: rgba(0, 217, 165, 0.1);
          color: #00d9a5;
        }

        &.disconnected {
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
        }

        &.configured {
          background: rgba(0, 217, 165, 0.1);
          color: #00d9a5;
        }

        &.required {
          background: rgba(100, 181, 246, 0.1);
          color: #64b5f6;
        }
      }

      /* Default Options */
      .default-info {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        background: rgba(100, 181, 246, 0.1);
        border: 1px solid rgba(100, 181, 246, 0.2);
        border-radius: 12px;
        margin-bottom: 24px;

        mat-icon {
          color: #64b5f6;
          flex-shrink: 0;
        }

        p {
          margin: 0;
          color: #a0a0b8;
          font-size: 13px;
          line-height: 1.5;
        }
      }

      .default-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .default-option {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        background: rgba(255, 255, 255, 0.03);
        border: 2px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(233, 69, 96, 0.3);
        }

        &.selected {
          border-color: #00d9a5;
          background: rgba(0, 217, 165, 0.05);
        }

        .option-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .option-content {
          flex: 1;

          h4 {
            margin: 0 0 4px;
            font-size: 15px;
            font-weight: 600;
            color: white;
          }

          .option-model {
            .default-model-name {
              font-size: 13px;
              color: #888;
            }

            .model-dropdown {
              width: 200px;
            }
          }
        }

        .check-icon {
          color: #00d9a5;
          font-size: 24px;
        }
      }

      /* Test Section */
      .test-section {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        padding: 24px;
      }

      .test-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        h3 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          font-size: 18px;
          color: white;

          mat-icon {
            color: #e94560;
          }
        }
      }

      .active-model-chip {
        padding: 6px 14px;
        background: rgba(0, 217, 165, 0.1);
        border: 1px solid rgba(0, 217, 165, 0.3);
        border-radius: 20px;
        font-size: 13px;
        color: #00d9a5;
      }

      .test-input-row {
        display: flex;
        gap: 12px;
        align-items: flex-start;

        .test-input {
          flex: 1;
        }

        .test-btn {
          height: 56px;
          padding: 0 24px;
          background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
          color: white;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      .test-error {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-top: 16px;
        padding: 16px;
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.2);
        border-radius: 12px;

        mat-icon {
          color: #ff6b6b;
          flex-shrink: 0;
        }

        .error-content {
          strong {
            display: block;
            color: #ff6b6b;
            margin-bottom: 4px;
          }

          p {
            margin: 0;
            color: #a0a0b8;
            font-size: 13px;
          }
        }
      }

      .test-result {
        margin-top: 20px;
        background: rgba(0, 217, 165, 0.05);
        border: 1px solid rgba(0, 217, 165, 0.2);
        border-radius: 12px;
        overflow: hidden;
      }

      .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: rgba(0, 217, 165, 0.1);
        border-bottom: 1px solid rgba(0, 217, 165, 0.1);

        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 14px;
          color: #00d9a5;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }

      .result-body {
        padding: 20px;

        h3 {
          margin: 0 0 12px;
          font-size: 18px;
          color: white;
        }

        .result-meta {
          display: flex;
          gap: 20px;
          margin-bottom: 16px;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: #888;

            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
              color: #00d9a5;
            }
          }
        }

        .result-preview {
          max-height: 200px;
          overflow: hidden;
          position: relative;
          font-size: 13px;
          color: #a0a0b8;
          line-height: 1.6;

          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: linear-gradient(transparent, rgba(0, 217, 165, 0.05));
          }
        }
      }

      /* Modal */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease;
      }

      .modal-content {
        width: 90%;
        max-width: 480px;
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        overflow: hidden;
      }

      .modal-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);

        .modal-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .modal-title {
          flex: 1;

          h3 {
            margin: 0 0 4px;
            font-size: 18px;
            color: white;
          }

          p {
            margin: 0;
            font-size: 13px;
            color: #888;
          }
        }
      }

      .modal-body {
        padding: 24px;

        .get-key-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          color: #64b5f6;
          text-decoration: none;
          font-size: 13px;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 24px;
        background: rgba(255, 255, 255, 0.02);
        border-top: 1px solid rgba(255, 255, 255, 0.05);

        .save-btn {
          background: linear-gradient(135deg, #00d9a5 0%, #00b894 100%);
          color: white;
        }
      }

      /* Material Overrides */
      ::ng-deep {
        .mat-mdc-form-field {
          .mdc-text-field--outlined {
            --mdc-outlined-text-field-container-shape: 12px;
          }
        }

        .mat-mdc-select-value {
          color: white;
        }
      }

      .full-width {
        width: 100%;
      }

      .model-specs {
        margin-left: 8px;
        color: #888;
        font-size: 11px;
      }
    `,
  ],
})
export class AiModelSelectorComponent implements OnInit {
  providers: AIProvider[] = [];
  selectedProvider = signal<AIProvider | null>(null);
  selectedModel = signal<AIModel | null>(null);
  activeTab = signal<'providers' | 'default' | 'test'>('providers');
  showApiKeyModal = signal(false);

  apiKeyInput = '';
  showApiKey = signal(false);
  testKeyword = '';
  testing = signal(false);
  testResult = signal<{ title: string; wordCount: number; preview: string } | null>(null);
  testError = signal<string | null>(null);

  constructor(
    private multiAI: MultiAIProviderService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.providers = this.multiAI.providers;
    const providerId = this.multiAI.getSelectedProvider();
    if (providerId && providerId !== 'auto') {
      const provider = this.providers.find((p) => p.id === providerId);
      if (provider) {
        this.selectedProvider.set(provider);
        const modelId = this.multiAI.getSelectedModel();
        const model = provider.models.find((m) => m.id === modelId);
        this.selectedModel.set(model || provider.models[0] || null);
      }
    }
  }

  getFreeProviders(): AIProvider[] {
    return this.providers.filter((p) => !p.requiresApiKey);
  }

  getApiProviders(): AIProvider[] {
    return this.providers.filter((p) => p.requiresApiKey);
  }

  getAllAvailableProviders(): AIProvider[] {
    return this.multiAI.getAvailableProviders();
  }

  getActiveModel(): AIModel | null {
    const provider = this.multiAI.getActiveProvider();
    if (provider) {
      const modelId = this.multiAI.getSelectedModel();
      return provider.models.find((m) => m.id === modelId) || provider.models[0];
    }
    return null;
  }

  getProviderDescription(provider: AIProvider): string {
    switch (provider.id) {
      case 'opencode':
        return 'Free local AI server with powerful models';
      case 'ollama':
        return 'Run open-source models on your machine';
      case 'google':
        return 'Google Gemini - Multimodal AI with 1M context';
      case 'openai':
        return 'GPT-4o - Most capable AI model';
      case 'anthropic':
        return 'Claude - Safe and helpful AI assistant';
      case 'groq':
        return 'Free tier with Llama 3.3 70B';
      case 'xai':
        return 'Grok 3 - Real-time knowledge access';
      default:
        return `${provider.models.length} models available`;
    }
  }

  selectProvider(provider: AIProvider): void {
    this.selectedProvider.set(provider);
    this.multiAI.setProvider(provider.id);

    if (provider.models.length > 0) {
      this.selectModel(provider.models[0]);
    }

    this.apiKeyInput = this.multiAI.getApiKey(provider.id);

    if (provider.requiresApiKey && !this.hasApiKey(provider.id)) {
      this.showApiKeyModal.set(true);
    }
  }

  selectModel(model: AIModel): void {
    this.selectedModel.set(model);
    this.multiAI.setModel(model.id);
  }

  hasApiKey(providerId: string): boolean {
    return !!this.multiAI.getApiKey(providerId);
  }

  isOpenCodeConnected(): boolean {
    return this.multiAI.isOpenCodeConnected();
  }

  closeApiKeyModal(): void {
    this.showApiKeyModal.set(false);
  }

  toggleShowApiKey(): void {
    this.showApiKey.update((v) => !v);
  }

  saveApiKey(): void {
    if (this.apiKeyInput.trim() && this.selectedProvider()) {
      this.multiAI.setApiKey(this.selectedProvider()!.id, this.apiKeyInput.trim());
      this.snackBar.open('API key saved successfully!', 'Close', { duration: 3000 });
      this.closeApiKeyModal();
    }
  }

  getApiKeyPlaceholder(): string {
    if (!this.selectedProvider()) return '';
    const prefix = this.selectedProvider()!.apiKeyPrefix || '';
    return prefix ? `${prefix}...` : 'Enter your API key';
  }

  getApiKeyUrl(): string {
    const urls: { [key: string]: string } = {
      openai: 'https://platform.openai.com/api-keys',
      anthropic: 'https://console.anthropic.com/settings/keys',
      google: 'https://aistudio.google.com/app/apikey',
      groq: 'https://console.groq.com/keys',
      xai: 'https://console.x.ai',
      mistral: 'https://console.mistral.ai',
      deepseek: 'https://platform.deepseek.com',
      perplexity: 'https://www.perplexity.ai/settings',
      cohere: 'https://dashboard.cohere.com/api-keys',
    };
    return urls[this.selectedProvider()?.id || ''] || '#';
  }

  formatContext(context: number): string {
    if (context >= 1000000) return (context / 1000000).toFixed(0) + 'M context';
    if (context >= 1000) return (context / 1000).toFixed(0) + 'K context';
    return context + ' context';
  }

  formatTokens(tokens: number): string {
    if (tokens >= 1000) return (tokens / 1000).toFixed(0) + 'K';
    return tokens.toString();
  }

  isDefaultProvider(providerId: string): boolean {
    return this.multiAI.getSelectedProvider() === providerId;
  }

  getDefaultProvider(): string {
    return this.multiAI.getSelectedProvider();
  }

  getDefaultProviderName(): string {
    const provider = this.multiAI.getActiveProvider();
    return provider?.name || 'None selected';
  }

  getDefaultModel(providerId: string): string {
    if (this.multiAI.getSelectedProvider() === providerId) {
      return this.multiAI.getSelectedModel();
    }
    const provider = this.providers.find((p) => p.id === providerId);
    return provider?.models[0]?.id || '';
  }

  getDefaultModelName(): string {
    const provider = this.multiAI.getActiveProvider();
    const modelId = this.multiAI.getSelectedModel();
    if (provider) {
      const model = provider.models.find((m) => m.id === modelId);
      return model?.name || modelId;
    }
    return 'Auto';
  }

  setDefaultProvider(providerId: string): void {
    const provider = this.providers.find((p) => p.id === providerId);
    if (provider) {
      this.multiAI.setProvider(providerId);
      if (provider.models.length > 0) {
        this.multiAI.setModel(provider.models[0].id);
      }
    }
  }

  setDefaultModel(providerId: string, modelId: string): void {
    this.multiAI.setProvider(providerId);
    this.multiAI.setModel(modelId);
  }

  testGeneration(): void {
    if (!this.testKeyword.trim()) return;

    this.testing.set(true);
    this.testError.set(null);
    this.testResult.set(null);

    this.multiAI.generateTestContent(this.testKeyword).subscribe({
      next: (result) => {
        this.testing.set(false);
        this.testResult.set({
          title: result.title || 'Generated Article',
          wordCount: result.content?.split(/\s+/).length || 0,
          preview: result.content || '',
        });
      },
      error: (err) => {
        this.testing.set(false);
        this.testError.set(err.message || 'Generation failed');
      },
    });
  }

  clearTestResult(): void {
    this.testResult.set(null);
    this.testKeyword = '';
  }
}
