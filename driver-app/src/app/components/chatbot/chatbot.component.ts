// src/app/components/chatbot/chatbot.component.ts
import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ChatbotService } from '../../services/chatbot';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  time: string;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class ChatbotComponent {
  @ViewChild('chatMessages') chatMessages!: ElementRef;
  isOpen = false;
  userMessage = '';
  messages: Message[] = [
    { text: "Bonjour ! Posez-moi une question sur votre conso.", sender: 'bot', time: this.getTime() }
  ];

  constructor(private chatbotService: ChatbotService) {}

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) setTimeout(() => this.scroll(), 100);
  }

  sendMessage() {
    if (!this.userMessage.trim()) return;
    const msg = this.userMessage.trim();
    this.messages.push({ text: msg, sender: 'user', time: this.getTime() });
    this.userMessage = '';

    const prompt = `
Tu es l'assistant IA d'Agil Fleet.
Données :
- Véhicule : Renault Clio
- Dernier plein : 50L le 10/11/2025
- Conso moyenne : 7.8 L/100km
- Prochain plein : 48L le 13/11/2025

Question : ${msg}

Réponds court, en français, utile.
`.trim();

    this.chatbotService.generateResponse(prompt).subscribe({
      next: (chunk) => {
        if (this.messages[this.messages.length - 1].sender !== 'bot') {
          this.messages.push({ text: '', sender: 'bot', time: this.getTime() });
        }
        this.messages[this.messages.length - 1].text += chunk;
        this.scroll();
      },
      error: (err) => {
        this.messages.push({ text: 'Erreur. Réessayez.', sender: 'bot', time: this.getTime() });
        console.error(err);
      }
    });
  }

  getTime(): string {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  scroll() {
    setTimeout(() => {
      if (this.chatMessages) {
        this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
      }
    }, 50);
  }
}