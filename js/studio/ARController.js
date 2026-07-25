import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';
import * as THREE from 'three';

export class ARController {
  constructor(sceneGraph) {
    this.sceneGraph = sceneGraph;
    this.exporter = new USDZExporter();
    this.localIp = '192.168.29.13';
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
   * Generate USDZ Blob from current 3D Scene Graph using official Three.js USDZExporter
   */
  async generateUSDZBlob(scene) {
    const targetScene = scene || this.sceneGraph;
    if (!targetScene) return null;

    try {
      // Clone scene to safely convert any non-MeshStandardMaterial (like MeshPhysicalMaterial) to MeshStandardMaterial
      const clonedScene = targetScene.clone(true);
      clonedScene.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          const newMats = mats.map(m => {
            if (!m.isMeshStandardMaterial) {
              return new THREE.MeshStandardMaterial({
                color: m.color ? m.color.clone() : new THREE.Color(0xffffff),
                roughness: m.roughness !== undefined ? m.roughness : 0.5,
                metalness: m.metalness !== undefined ? m.metalness : 0.0,
                opacity: m.opacity !== undefined ? m.opacity : 1.0,
                transparent: !!m.transparent
              });
            }
            return m;
          });
          child.material = Array.isArray(child.material) ? newMats : newMats[0];
        }
      });

      // Call parseAsync() which returns a Promise resolving to Uint8Array!
      const usdzUint8Array = await this.exporter.parseAsync(clonedScene, {
        quickLookCompatible: true
      });

      return new Blob([usdzUint8Array], { type: 'model/vnd.usdz+zip' });
    } catch (err) {
      console.error('Three.js USDZExporter parseAsync Error:', err);
      return null;
    }
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
        // Trigger Native iOS AR Quick Look Camera Mode on iPhone!
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

    // Wi-Fi accessible local IP URL for iPhone Safari
    const mobileUrl = `http://${this.localIp}:8088/studio.html`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(mobileUrl)}`;

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
      <div style="background:#151828;border:1px solid rgba(255,255,255,0.2);border-radius:20px;padding:32px;text-align:center;max-width:420px;box-shadow:0 20px 50px rgba(0,0,0,0.6);color:#fff;">
        <div style="font-size:1.4rem;font-weight:700;margin-bottom:8px;">📱 Open on your iPhone</div>
        <div style="font-size:0.85rem;color:#aaa;margin-bottom:16px;">AR requires an iPhone or iPad camera. Scan this QR code with your iPhone camera (connected to the same Wi-Fi):</div>
        
        <div style="background:#fff;padding:12px;border-radius:12px;display:inline-block;margin-bottom:16px;">
          <img src="${qrApiUrl}" alt="Scan QR Code" style="width:200px;height:200px;display:block;">
        </div>

        <div style="font-size:0.8rem;color:#d4a373;margin-bottom:20px;word-break:break-all;">
          Or open Safari on iPhone: <b>http://${this.localIp}:8088/studio.html</b>
        </div>

        <div style="display:flex;gap:12px;justify-content:center;">
          <a href="${blobUrl}" download="plant_stand_1to1.usdz" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:10px 16px;border-radius:24px;font-weight:600;text-decoration:none;font-size:0.85rem;">📥 AirDrop .USDZ</a>
          <button id="close-ar-modal" style="background:linear-gradient(135deg,#d4a373 0%,#b8864a 100%);border:none;color:#111;padding:10px 24px;border-radius:24px;font-weight:700;cursor:pointer;font-size:0.85rem;">Close</button>
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
