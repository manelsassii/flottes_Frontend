// src/app/services/camera.service.ts
import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';

@Injectable({
  providedIn: 'root'
})
export class CameraService {

  // Détecte si on est en PWA / Desktop
  private get isDesktop(): boolean {
    return !((window as any).Capacitor?.isNativePlatform?.() || false);
  }

  async takePhoto(): Promise<string> {
    if (this.isDesktop) {
      // ==== WEBCAM DIRECTE SANS CAPACITOR ====
      return await this.openWebcamAndCapture();
    } else {
      // ==== MOBILE : Capacitor natif ====
      const photo = await Camera.getPhoto({
        quality: 95,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        direction: CameraDirection.Front,
        correctOrientation: true
      });
      return photo.dataUrl!;
    }
  }

  private async openWebcamAndCapture(): Promise<string> {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(stream => {
          const video = document.createElement('video');
          video.srcObject = stream;
          video.autoplay = true;
          video.playsInline = true;
          video.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;z-index:9999;background:#000;';

          const overlay = document.createElement('div');
          overlay.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:99999;">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:320px;height:420px;border:5px solid #0f0;border-radius:50%;box-shadow:0 0 40px #0f0;"></div>
              <ion-button fill="solid" color="light" style="position:fixed;bottom:50px;left:50%;transform:translateX(-50%);z-index:999999;font-size:18px;">
                Prendre la photo
              </ion-button>
            </div>
          `;

          const btn = overlay.querySelector('ion-button');
          btn!.onclick = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')!.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

            stream.getTracks().forEach(t => t.stop());
            video.remove();
            overlay.remove();

            resolve(dataUrl);
          };

          document.body.appendChild(video);
          document.body.appendChild(overlay);

          // Photo auto après 5s
          setTimeout(() => btn?.dispatchEvent(new Event('click')), 5000);
        })
        .catch(() => {
          reject('Webcam refusée');
        });
    });
  }
}