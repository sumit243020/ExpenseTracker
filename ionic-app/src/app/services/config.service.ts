import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RuntimeConfig {
  apiUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config: RuntimeConfig = { apiUrl: environment.apiUrl || '' };

  constructor(private readonly http: HttpClient) {}

  async load(): Promise<void> {
    try {
      const remote = await firstValueFrom(
        this.http.get<RuntimeConfig>('assets/config.json', {
          headers: { 'Cache-Control': 'no-cache' },
        }),
      );
      if (remote?.apiUrl != null && String(remote.apiUrl).trim() !== '') {
        this.config = {
          apiUrl: String(remote.apiUrl).trim().replace(/\/$/, ''),
        };
      }
    } catch {
      // keep environment defaults
    }
  }

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  setApiUrl(url: string): void {
    this.config = { apiUrl: (url || '').trim().replace(/\/$/, '') };
  }
}
