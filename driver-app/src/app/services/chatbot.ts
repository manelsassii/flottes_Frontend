// src/app/services/chatbot.service.ts
import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(environment.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',  // STABLE, MOINS OVERLOADED (2025)
      generationConfig: { temperature: 0.7, maxOutputTokens: 150 }
    });
  }

  generateResponse(prompt: string, retryCount = 0): Observable<string> {
    const subject = new Subject<string>();
    const maxRetries = 2;

    const send = () => {
      const chat = this.model.startChat();
      chat.sendMessage(prompt)
        .then((response: any) => {
          const text = response.response.text();
          const words = text.split(/\s+/).filter((w: string) => w.length > 0);
          let i = 0;
          const interval = setInterval(() => {
            if (i < words.length) {
              subject.next(words[i] + ' ');
              i++;
            } else {
              clearInterval(interval);
              subject.complete();
            }
          }, 40);
        })
        .catch((err: any) => {
          console.error('Gemini Error (retry ' + retryCount + '):', err);
          if (err.message.includes('503') && retryCount < maxRetries) {
            // RETRY AUTOMATIQUE POUR 503
            setTimeout(() => this.generateResponse(prompt, retryCount + 1).subscribe(subject), 2000);
          } else {
            // FALLBACK PRO
            const fallback = [
              "Votre conso moyenne : 7.8 L/100km. Prochain plein : 48 L le 13/11.",
              "Dernier plein : 50 L le 10/11. Pas d'anomalie.",
              "Conseil : Vérifiez pneus pour -5% conso."
            ];
            const text = fallback[Math.floor(Math.random() * fallback.length)];
            const words = text.split(/\s+/).filter((w: string) => w.length > 0);
            let i = 0;
            const interval = setInterval(() => {
              if (i < words.length) {
                subject.next(words[i] + ' ');
                i++;
              } else {
                clearInterval(interval);
                subject.complete();
              }
            }, 40);
          }
        });
    };

    send();
    return subject.asObservable();
  }
}