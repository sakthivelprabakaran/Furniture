import { USDZExporter } from '../rendering/USDZExporter.js';

export class ARController {
  constructor(sceneGraph) {
    this.sceneGraph = sceneGraph;
    this.exporter = new USDZExporter();
  }

  /**
   * Detect if current browser is on iOS (iPhone/iPad/iPod)
   */
  isIOS() {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

  /**
   * Generate USDZ Blob from current 3D Scene Graph
   */
  async generateUSDZBlob(scene) {
    const targetScene = scene || this.sceneGraph;
    if (!targetScene) return null;
    return await this.exporter.parse(targetScene);
  }

  /**
   * Launch Native iOS AR Quick Look Camera or Desktop QR Code Modal
   */
  async launchAR(scene) {
    const isIOSDevice = this.isIOS();

    // Show Loading Spinner / Status Toast
    this._showToast('⏳ Generating 1:1 Scale AR Model...');

    try {
      const usdzBlob = await this.generateUSDZBlob(scene);
      if (!usdzBlob) {
        this._showToast('❌ Failed to generate AR model');
        return;
      }

      const blobUrl = URL.createObjectURL(usdzBlob);

      if (isIOSDevice) {
        // Trigger Native iOS AR Quick Look Camera Mode!
        const anchor = document.createElement('a');
        anchor.setAttribute('rel', 'ar');
        anchor.setAttribute('id', 'usdz-ar-link');
        anchor.appendChild(document.createElement('img'));
        anchor.href = blobUrl;
        document.body.appendChild(anchor);

        anchor.click();

        setTimeout(() => {
          document.body.removeChild(anchor);
        }, 1000);

        this._showToast('📱 Opening Native iOS AR Camera...');
      } else {
        // Desktop / Laptop: Display QR Code Modal so user can scan with iPhone!
        this._showQRCodeModal(blobUrl);
        this._showToast('📱 Scan QR Code with your iPhone Camera!');
      }
    } catch (err) {
      console.error('AR Export Error:', err);
      this._showToast('⚠️ AR Quick Look Export Failed');
    }
  }

  _showToast(msg) {
    let toast = document.getElementById('ar-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ar-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(18, 20, 32, 0.92);
        color: #fff;
        padding: 12px 24px;
        border-radius: 30px;
        font-size: 0.9rem;
        font-weight: 600;
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        z-index: 99999;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';

    setTimeout(() => {
      toast.style.opacity = '0';
    }, 4000);
  }

  _showQRCodeModal(blobUrl) {
    let modal = document.getElementById('ar-qr-modal');
    if (modal) {
      modal.remove();
    }

    const currentUrl = window.location.href;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}`;

    modal = document.createElement('div');
    modal.id = 'ar-qr-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
    `;

    modal.innerHTML = `
      <div style="background:#151828;border:1px solid rgba(255,255,255,0.2);border-radius:20px;padding:32px;text-align:center;max-width:380px;box-shadow:0 20px 50px rgba(0,0,0,0.6);color:#fff;">
        <div style="font-size:1.4rem;font-weight:700;margin-bottom:8px;">📱 View in AR on iPhone</div>
        <div style="font-size:0.85rem;color:#aaa;margin-bottom:20px;">Scan this QR code with your iPhone Camera to place this custom furniture in your room at 1:1 scale!</div>
        
        <div style="background:#fff;padding:12px;border-radius:12px;display:inline-block;margin-bottom:20px;">
          <img src="${qrApiUrl}" alt="Scan QR Code" style="width:200px;height:200px;display:block;">
        </div>

        <div>
          <button id="close-ar-modal" style="background:linear-gradient(135deg,#d4a373 0%,#b8864a 100%);border:none;color:#111;padding:10px 24px;border-radius:24px;font-weight:700;cursor:pointer;font-size:0.9rem;">Done</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('close-ar-modal').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }
}
