// 공통 유틸리티 함수
const Utils = {
  getCurrentPage() {
    return document.body.dataset.page;
  },
  isPage(pageName) {
    return this.getCurrentPage() === pageName;
  },
  createElement(type, className, styles = {}) {
    const element = document.createElement(type);
    if (className) element.className = className;
    Object.assign(element.style, styles);
    return element;
  }
};

// 이미지 필터 클래스
class ImageFilter {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.image = null;
    this.originalImageData = null;
    this.imageArea = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
  }

  loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.image = new Image();
        this.image.onload = () => {
          const targetSize = 350;
          const canvas = this.canvas;

          const ratio = Math.min(
            targetSize / this.image.width,
            targetSize / this.image.height
          );

          const width = this.image.width * ratio;
          const height = this.image.height * ratio;

          canvas.width = targetSize;
          canvas.height = targetSize;

          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.fillRect(0, 0, targetSize, targetSize);

          const x = (targetSize - width) / 2;
          const y = (targetSize - height) / 2;

          this.imageArea = {
            x: Math.floor(x),
            y: Math.floor(y),
            width: Math.floor(width),
            height: Math.floor(height)
          };

          this.ctx.drawImage(this.image, x, y, width, height);
          this.originalImageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
          resolve();
        };
        this.image.onerror = reject;
        this.image.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  isInsideImageArea(x, y) {
    return x >= this.imageArea.x &&
      x < this.imageArea.x + this.imageArea.width &&
      y >= this.imageArea.y &&
      y < this.imageArea.y + this.imageArea.height;
  }

  reset() {
    if (this.originalImageData) {
      this.ctx.putImageData(this.originalImageData, 0, 0);
    }
  }

  grayscale(intensity = 100) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const factor = intensity / 100;

    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const i = (y * this.canvas.width + x) * 4;

        if (this.isInsideImageArea(x, y)) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = data[i] + (avg - data[i]) * factor;
          data[i + 1] = data[i + 1] + (avg - data[i + 1]) * factor;
          data[i + 2] = data[i + 2] + (avg - data[i + 2]) * factor;
        }
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  sepia(intensity = 100) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const factor = intensity / 100;

    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const i = (y * this.canvas.width + x) * 4;

        if (this.isInsideImageArea(x, y)) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const tr = Math.min(255, (r * (1 - factor)) + (((r * 0.393) + (g * 0.769) + (b * 0.189)) * factor));
          const tg = Math.min(255, (g * (1 - factor)) + (((r * 0.349) + (g * 0.686) + (b * 0.168)) * factor));
          const tb = Math.min(255, (b * (1 - factor)) + (((r * 0.272) + (g * 0.534) + (b * 0.131)) * factor));

          data[i] = tr;
          data[i + 1] = tg;
          data[i + 2] = tb;
        }
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  brightness(value) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const i = (y * this.canvas.width + x) * 4;

        if (this.isInsideImageArea(x, y)) {
          data[i] = Math.min(255, Math.max(0, data[i] + value));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + value));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + value));
        }
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  contrast(value) {
    const factor = (259 * (value + 255)) / (255 * (259 - value));
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const i = (y * this.canvas.width + x) * 4;

        if (this.isInsideImageArea(x, y)) {
          data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
          data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
          data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
        }
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }
}

// 메인 실행 코드
document.addEventListener('DOMContentLoaded', () => {
  // 페이지 로드 시 컨테이너 표시
  const container = document.querySelector('.poster') || document.querySelector('.content');
  if (container) {
    container.style.opacity = '0';
    requestAnimationFrame(() => {
      container.style.opacity = '';
    });
  }

  // 페이지 전환 링크 이벤트 처리
  document.querySelectorAll('.hobby--item, .nav-back').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const href = link.getAttribute('href');
      const container = document.querySelector('.poster') || document.querySelector('.content');

      if (container) {
        document.body.classList.add('transitioning');
        container.classList.add('leaving');
        container.addEventListener('animationend', () => {
          window.location.href = href;
        }, { once: true });
      }
    });
  });

  // reading 페이지 스크립트
  if (Utils.isPage('reading')) {
    document.querySelectorAll('.book--front').forEach(book => {
      book.addEventListener('mouseenter', function () {
        this.closest('.book--item').classList.add('book--rotate');
      });

      book.addEventListener('mouseleave', function () {
        this.closest('.book--item').classList.remove('book--rotate');
      });

      book.addEventListener('click', function () {
        this.closest('.book--item').classList.add('book--flip');
      });
    });

    document.querySelectorAll('.book--back').forEach(bookBack => {
      bookBack.addEventListener('click', function () {
        this.closest('.book--item').classList.remove('book--flip');
      });
    });
  }

  // star 페이지 스크립트
  if (Utils.isPage('star')) {
    let currentStarColor = '#F5C817';

    const colorPicker = document.getElementById('starColor');
    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => {
        currentStarColor = e.target.value;
        document.querySelectorAll('.star path').forEach(starPath => {
          starPath.style.fill = currentStarColor;
        });
      });
    }

    function createStar() {
      const star = Utils.createElement('div', 'star', {
        right: `${Math.random() * 100}%`
      });

      const svgString = `
        <svg height="24px" width="24px" viewBox="0 0 47.94 47.94">
          <path style="fill:${currentStarColor};" d="M26.285,2.486l5.407,10.956c0.376,0.762,1.103,1.29,1.944,1.412l12.091,1.757 c2.118,0.308,2.963,2.91,1.431,4.403l-8.749,8.528c-0.608,0.593-0.886,1.448-0.742,2.285l2.065,12.042 c0.362,2.109-1.852,3.717-3.746,2.722l-10.814-5.685c-0.752-0.395-1.651-0.395-2.403,0l-10.814,5.685 c-1.894,0.996-4.108-0.613-3.746-2.722l2.065-12.042c0.144-0.837-0.134-1.692-0.742-2.285l-8.749-8.528 c-1.532-1.494-0.687-4.096,1.431-4.403l12.091-1.757c0.841-0.122,1.568-0.65,1.944-1.412l5.407-10.956 C22.602,0.567,25.338,0.567,26.285,2.486z"/>
        </svg>
      `;

      star.innerHTML = svgString;
      star.addEventListener('animationend', () => {
        star.remove();
      });
      document.querySelector('.star--wrap').appendChild(star);
    }

    setInterval(createStar, 100);
  }

  // photo 페이지 스크립트
  if (Utils.isPage('photo')) {
    const filter = new ImageFilter('myCanvas');

    // 파일 입력 이벤트 처리
    document.getElementById('fileInput')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        // 필터값 초기화
        document.getElementById('grayscale').value = 0;
        document.getElementById('sepia').value = 0;
        document.getElementById('brightness').value = 0;
        document.getElementById('contrast').value = 0;

        // 표시되는 값도 초기화
        document.getElementById('grayscaleValue').textContent = '0';
        document.getElementById('sepiaValue').textContent = '0';
        document.getElementById('brightnessValue').textContent = '0';
        document.getElementById('contrastValue').textContent = '0';

        await filter.loadImage(file);
        applyFilters();
      }
    });

    // 필터 적용 함수
    window.applyFilters = function () {
      if (!filter.image) return;

      const grayscaleValue = parseInt(document.getElementById('grayscale').value);
      const sepiaValue = parseInt(document.getElementById('sepia').value);
      const brightnessValue = parseInt(document.getElementById('brightness').value);
      const contrastValue = parseInt(document.getElementById('contrast').value);

      document.getElementById('grayscaleValue').textContent = grayscaleValue;
      document.getElementById('sepiaValue').textContent = sepiaValue;
      document.getElementById('brightnessValue').textContent = brightnessValue;
      document.getElementById('contrastValue').textContent = contrastValue;

      filter.reset();

      if (grayscaleValue > 0) filter.grayscale(grayscaleValue);
      if (sepiaValue > 0) filter.sepia(sepiaValue);
      if (brightnessValue !== 0) filter.brightness(brightnessValue);
      if (contrastValue !== 0) filter.contrast(contrastValue);
    };

    // 이미지 초기화 함수
    window.resetImage = function () {
      if (!filter.image) return;

      document.getElementById('grayscale').value = 0;
      document.getElementById('sepia').value = 0;
      document.getElementById('brightness').value = 0;
      document.getElementById('contrast').value = 0;

      document.getElementById('grayscaleValue').textContent = '0';
      document.getElementById('sepiaValue').textContent = '0';
      document.getElementById('brightnessValue').textContent = '0';
      document.getElementById('contrastValue').textContent = '0';

      filter.reset();
    };

    window.saveImage = async function () {
      if (!filter.image) return;

      try {
        // 임시 캔버스 생성
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = filter.image.naturalWidth;
        tempCanvas.height = filter.image.naturalHeight;
        const tempCtx = tempCanvas.getContext('2d');

        // 원본 이미지 그리기
        tempCtx.drawImage(filter.image, 0, 0);

        // 필터값 가져오기
        const grayscaleValue = parseInt(document.getElementById('grayscale').value);
        const sepiaValue = parseInt(document.getElementById('sepia').value);
        const brightnessValue = parseInt(document.getElementById('brightness').value);
        const contrastValue = parseInt(document.getElementById('contrast').value);

        // 이미지 데이터 처리
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;

        // 필터 적용
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          // 그레이스케일 적용
          if (grayscaleValue > 0) {
            const factor = grayscaleValue / 100;
            const avg = (r + g + b) / 3;
            r = r + (avg - r) * factor;
            g = g + (avg - g) * factor;
            b = b + (avg - b) * factor;
          }

          // 세피아 적용
          if (sepiaValue > 0) {
            const factor = sepiaValue / 100;
            const tr = Math.min(255, (r * (1 - factor)) + (((r * 0.393) + (g * 0.769) + (b * 0.189)) * factor));
            const tg = Math.min(255, (g * (1 - factor)) + (((r * 0.349) + (g * 0.686) + (b * 0.168)) * factor));
            const tb = Math.min(255, (b * (1 - factor)) + (((r * 0.272) + (g * 0.534) + (b * 0.131)) * factor));
            r = tr;
            g = tg;
            b = tb;
          }

          // 밝기 적용
          if (brightnessValue !== 0) {
            r = Math.min(255, Math.max(0, r + brightnessValue));
            g = Math.min(255, Math.max(0, g + brightnessValue));
            b = Math.min(255, Math.max(0, b + brightnessValue));
          }

          // 대비 적용
          if (contrastValue !== 0) {
            const factor = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));
            r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
            g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
            b = Math.min(255, Math.max(0, factor * (b - 128) + 128));
          }

          // 수정된 픽셀값 저장
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }

        // 수정된 이미지 데이터를 캔버스에 그리기
        tempCtx.putImageData(imageData, 0, 0);

        // Blob으로 변환하여 저장
        const blob = await new Promise(resolve => {
          tempCanvas.toBlob(resolve, 'image/png');
        });

        // URL 생성 및 다운로드
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'filtered-image.png';
        link.href = url;

        // 클릭 이벤트를 기다림
        await new Promise(resolve => {
          link.onclick = resolve;
          link.click();
        });

        // cleanup
        URL.revokeObjectURL(url);
        tempCanvas.remove();

      } catch (error) {
        console.error('이미지 저장 중 오류 발생:', error);
      }
    };
  }
});

// write 페이지 스크립트
if (Utils.isPage('writing')) {

}
