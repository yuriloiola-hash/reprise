'use client';

import { useEffect } from 'react';

export function DeviceDetector() {
  useEffect(() => {
    function detectDevice() {
      const w = window.innerWidth;
      const body = document.body;
      body.classList.remove('device-mobile', 'device-tablet', 'device-desktop');

      if (w < 768) {
        body.classList.add('device-mobile');
        body.setAttribute('data-device', 'mobile');
      } else if (w < 1024) {
        body.classList.add('device-tablet');
        body.setAttribute('data-device', 'tablet');
      } else {
        body.classList.add('device-desktop');
        body.setAttribute('data-device', 'desktop');
      }
    }

    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  return null;
}
