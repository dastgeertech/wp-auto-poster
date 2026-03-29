import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  SchemaGeneratorService,
  SchemaType,
  GeneratedSchema,
} from '../../core/services/schema-generator.service';

@Component({
  selector: 'app-schema-generator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="schema-container">
      <header class="page-header">
        <div class="header-content">
          <h1><mat-icon>code</mat-icon> Schema Markup Generator</h1>
          <p>Generate structured data for rich snippets in search results</p>
        </div>
      </header>

      <mat-tab-group animationDuration="300ms">
        <mat-tab label="Schema Types">
          <div class="tab-content">
            <div class="schema-types-grid">
              @for (type of schemaTypes; track type.id) {
                <mat-card class="schema-type-card" (click)="selectSchemaType(type)">
                  <mat-icon>{{ type.icon }}</mat-icon>
                  <h3>{{ type.name }}</h3>
                  <p>{{ type.description }}</p>
                </mat-card>
              }
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Create Schema">
          <div class="tab-content">
            @if (selectedType) {
              <div class="schema-form">
                <h2>{{ selectedType.name }}</h2>
                <p>{{ selectedType.description }}</p>
                <div class="form-grid">
                  @for (field of selectedType.fields; track field.key) {
                    <mat-form-field
                      appearance="outline"
                      [class.full-width]="field.type === 'textarea'"
                    >
                      <mat-label>{{ field.label }}</mat-label>
                      @if (field.type === 'textarea') {
                        <textarea
                          matInput
                          [(ngModel)]="formData[field.key]"
                          [placeholder]="field.placeholder || ''"
                          rows="3"
                        ></textarea>
                      } @else if (field.type === 'select') {
                        <mat-select [(ngModel)]="formData[field.key]">
                          @for (opt of field.options; track opt) {
                            <mat-option [value]="opt">{{ opt }}</mat-option>
                          }
                        </mat-select>
                      } @else {
                        <input
                          matInput
                          [type]="field.type"
                          [(ngModel)]="formData[field.key]"
                          [placeholder]="field.placeholder || ''"
                        />
                      }
                      @if (field.required) {
                        <mat-error>This field is required</mat-error>
                      }
                    </mat-form-field>
                  }
                </div>
                <div class="form-actions">
                  <button mat-raised-button color="primary" (click)="generateSchema()">
                    <mat-icon>auto_fix_high</mat-icon>
                    Generate Schema
                  </button>
                </div>
              </div>
            } @else {
              <div class="empty-state">
                <mat-icon>touch_app</mat-icon>
                <h3>Select a Schema Type</h3>
                <p>Choose a schema type from the previous tab to get started</p>
              </div>
            }
          </div>
        </mat-tab>

        <mat-tab label="Generated Schemas">
          <div class="tab-content">
            @if (generatedSchema()) {
              <mat-card class="schema-output">
                <mat-card-header>
                  <h3>Generated JSON-LD</h3>
                  <button mat-icon-button (click)="copyToClipboard()">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </mat-card-header>
                <mat-card-content>
                  <pre>{{ generatedSchema() }}</pre>
                </mat-card-content>
              </mat-card>
            }
            <div class="saved-schemas">
              <h3>Saved Schemas</h3>
              @for (schema of savedSchemas(); track schema.id) {
                <mat-card class="saved-schema-card">
                  <div class="schema-info">
                    <span class="schema-type">{{ schema.type }}</span>
                    <span class="schema-date">{{ schema.createdAt | date: 'short' }}</span>
                  </div>
                  <button mat-icon-button (click)="loadSchema(schema)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button (click)="deleteSchema(schema.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </mat-card>
              } @empty {
                <p class="no-schemas">No saved schemas yet</p>
              }
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .schema-container {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }
      .page-header {
        margin-bottom: 24px;
        h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          font-size: 28px;
          color: #fff;
          mat-icon {
            color: #e94560;
          }
        }
        p {
          margin: 8px 0 0;
          color: #a0a0b8;
        }
      }
      .schema-types-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
        margin-top: 20px;
      }
      .schema-type-card {
        background: #1a1a2e;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 24px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
        &:hover {
          border-color: #e94560;
          transform: translateY(-2px);
        }
        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: #e94560;
          margin-bottom: 12px;
        }
        h3 {
          margin: 0 0 8px;
          color: #fff;
        }
        p {
          margin: 0;
          font-size: 13px;
          color: #a0a0b8;
        }
      }
      .schema-form {
        background: #1a1a2e;
        border-radius: 12px;
        padding: 24px;
        h2 {
          margin: 0 0 8px;
          color: #fff;
        }
        p {
          margin: 0 0 24px;
          color: #a0a0b8;
        }
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      }
      .full-width {
        grid-column: 1 / -1;
      }
      .form-actions {
        margin-top: 24px;
        display: flex;
        gap: 12px;
      }
      .schema-output {
        background: #1a1a2e;
        margin-bottom: 24px;
        mat-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          h3 {
            margin: 0;
            color: #fff;
          }
        }
        pre {
          background: #16213e;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          color: #4caf50;
          font-size: 13px;
        }
      }
      .saved-schemas {
        h3 {
          margin: 0 0 16px;
          color: #fff;
        }
      }
      .saved-schema-card {
        background: #1a1a2e;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        margin-bottom: 8px;
        .schema-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          .schema-type {
            font-weight: 600;
            color: #fff;
          }
          .schema-date {
            font-size: 12px;
            color: #a0a0b8;
          }
        }
      }
      .empty-state {
        text-align: center;
        padding: 60px;
        color: #a0a0b8;
        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          opacity: 0.3;
        }
        h3 {
          margin: 16px 0 8px;
          color: #fff;
        }
      }
      .no-schemas {
        color: #a0a0b8;
        text-align: center;
      }
    `,
  ],
})
export class SchemaGeneratorComponent implements OnInit {
  schemaTypes: SchemaType[] = [];
  selectedType: SchemaType | null = null;
  formData: Record<string, string> = {};
  generatedSchema = signal<string>('');
  savedSchemas = signal<GeneratedSchema[]>([]);

  constructor(
    private schemaService: SchemaGeneratorService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.schemaTypes = this.schemaService.getSchemaTypes();
    this.savedSchemas.set(this.schemaService.getGeneratedSchemas());
  }

  selectSchemaType(type: SchemaType): void {
    this.selectedType = type;
    this.formData = {};
  }

  generateSchema(): void {
    if (!this.selectedType) return;
    const jsonLd = this.schemaService.generateJsonLd(this.selectedType.id, this.formData);
    this.generatedSchema.set(jsonLd);
    this.schemaService.saveSchema(this.selectedType.id, jsonLd);
    this.savedSchemas.set(this.schemaService.getGeneratedSchemas());
    this.snackBar.open('Schema generated and saved!', 'Close', { duration: 3000 });
  }

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.generatedSchema());
    this.snackBar.open('Copied to clipboard!', 'Close', { duration: 2000 });
  }

  loadSchema(schema: GeneratedSchema): void {
    this.generatedSchema.set(schema.jsonLd);
    this.snackBar.open('Schema loaded!', 'Close', { duration: 2000 });
  }

  deleteSchema(id: string): void {
    this.schemaService.deleteSchema(id);
    this.savedSchemas.set(this.schemaService.getGeneratedSchemas());
  }
}
