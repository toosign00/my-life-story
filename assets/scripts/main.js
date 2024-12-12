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

// 전체 페이지 스크립트
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
  document.querySelectorAll('.hobby--item, .nav--back').forEach(link => {
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
  if (Utils.isPage('stargazing')) {
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
  const storyData = {
    // 질문
    start: {
      text: "당신은 길을 걸어가다가 짝사랑하는 그/그녀를 만났습니다. 그/그녀는 당신에게 반갑게 인사를 건냈습니다.",
      choices: [
        { text: "수줍게 인사를 한다", next: "shy_greeting" },
        { text: "인사를 피하고 서둘러 자리를 뜬다", next: "run_away" }
      ]
    },
    // 선택지
    shy_greeting: {
      text: "당신은 수줍게 손을 흔들며 인사를 했습니다. 그/그녀는 당신의 귀여운 모습에 미소를 지었습니다.",
      choices: [
        { text: "오늘 날씨가 좋다고 말한다", next: "weather_talk" },
        { text: "급하게 자리를 피한다", next: "run_away" }
      ]
    },
    // 선택지
    run_away: {
      text: "당신은 긴장한 나머지 자리를 피했습니다. 도망치듯 그 자리를 벗어나며 아쉬움이 남습니다.",
      choices: [
        { text: "처음부터 다시", next: "start" }
      ]
    },
    // 질문
    weather_talk: {
      text: "\"날씨가 정말 좋네.\" 당신의 말에 그/그녀는 고개를 끄덕이며 \"그러게. 같이 산책이라도 할까?\" 라고 제안합니다.",
      choices: [
        { text: "수줍게 수락한다", next: "daily_talk" },
        { text: "다음에 하자고 한다", next: "next_time" }
      ]
    },
    //선택지
    next_time: {
      text: "\"아... 그래..! 다음에 하자.\" 그/그녀의 표정에서 실망감이 보입니다. 그녀는 당신에 대한 마음을 접기 시작합니다.",
      choices: [
        { text: "처음부터 다시", next: "start" }
      ]
    },
    // 선택지
    daily_talk: {
      text: "일상적인 대화를 나누며 당신들은 서로에 대해 더 알아가게 됩니다. 대화가 즐겁게 이어집니다.",
      choices: [
        { text: "더 깊은 이야기를 나눈다", next: "deep_talk" },
        { text: "갑자기 급한 일이 있다며 자리를 피한다", next: "disappointed__talk" }
      ]
    },
    // 선택지 엔딩
    deep_talk: {
      text: "대화가 깊어질수록 서로에 대한 이해도 깊어집니다. 특별한 인연의 시작이 될 것 같네요. 행복하세요.",
      choices: [
        { text: "처음부터 다시", next: "start" }
      ]
    },
    disappointed__talk: {
      text: "\"갑자기 어디가는거야..? \" 그/그녀는 실망한 표정으로 당신을 보며 자리를 떠납니다.",
      choices: [
        { text: "처음부터 다시", next: "start" }
      ]
    }
  };


  let writingText = document.querySelector('.writing--text');
  let choicesDiv = document.querySelector('.choices');
  let currentScene = 'start';
  let isTyping = false;

  // 타이핑 효과 함수
  function typeWriter(text, element, callback) {
    isTyping = true;
    let index = 0;
    element.textContent = '';

    // 타이핑 효과
    function type() {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(type, 30); // 타이핑 속도 조정
      } else {
        isTyping = false;
        if (callback) callback();
      }
    }

    // 타이핑 시작
    type();
  }

  // 선택지 함수
  function showChoices(choices) {
    choicesDiv.innerHTML = '';
    choices.forEach(choice => {
      const button = document.createElement('button');
      button.textContent = choice.text;
      button.classList.add('choice-btn');
      button.addEventListener('click', () => {
        if (!isTyping) {
          updateScene(choice.next);
        }
      });
      choicesDiv.appendChild(button);
    });
    choicesDiv.style.opacity = '1';
  }

  // 씬 업데이트 함수
  function updateScene(sceneId) {
    currentScene = sceneId;
    const scene = storyData[sceneId];
    choicesDiv.style.opacity = '0';

    typeWriter(scene.text, writingText, () => {
      showChoices(scene.choices);
    });
  }

  // 페이지 로드 완료 후 게임 시작
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      updateScene('start');
    }, 1000); // 1000ms 후 시작
  });
}


// game 페이지 스크립트
if (Utils.isPage('game')) {
  // 초기 변수 설정
  let clicks = 0;
  let timeLeft = 10;
  let timerId;

  // DOM 요소
  const clickButton = document.querySelector('.clickButton');
  const startButton = document.querySelector('.startButton');
  const timerDisplay = document.getElementById('timer');
  const clickDisplay = document.getElementById('clickCount');

  // 오디오 관련 변수
  let audioContext;
  let clickBuffer;

  // 오디오 초기화
  async function initAudio() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const response = await fetch('/assets/sounds/click.mp3');
      const data = await response.arrayBuffer();
      clickBuffer = await audioContext.decodeAudioData(data);
    } catch (error) {
      console.error('오디오 초기화 실패:', error);
    }
  }

  // 클릭 사운드 재생
  function playClickSound() {
    if (!audioContext || !clickBuffer) return;
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    source.buffer = clickBuffer;
    gainNode.gain.value = 0.3; // 볼륨 설정

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
  }

  // 게임 시작
  function startGame() {
    clicks = 0;
    timeLeft = 10;
    clickDisplay.textContent = clicks;
    timerDisplay.textContent = timeLeft;
    clickButton.disabled = false;
    startButton.disabled = true;

    timerId = setInterval(() => {
      timerDisplay.textContent = --timeLeft;
      if (timeLeft <= 0) endGame();
    }, 1000);
  }

  // 게임 종료
  function endGame() {
    clearInterval(timerId);
    clickButton.disabled = true;
    startButton.disabled = false;
    alert(`게임 종료! 총 클릭 수: ${clicks}`);
  }

  // 클릭 이벤트
  clickButton.addEventListener('click', () => {
    clickDisplay.textContent = ++clicks;
    playClickSound();
  });

  // 시작 버튼 이벤트
  startButton.addEventListener('click', startGame);

  // 오디오 초기화
  initAudio();
}

// guitar 페이지 스크립트
if (Utils.isPage('guitar')) {
  // 오디오 관련 상수와 변수
  let audioContext = new (window.AudioContext || window.webkitAudioContext)();
  let audioElement = new Audio();

  // 코드 데이터
  const chords = [
    { name: 'C', audio: './assets/sounds/major-c.wav' },
    { name: 'D', audio: './assets/sounds/major-d.wav' },
    { name: 'E', audio: './assets/sounds/major-e.wav' },
    { name: 'F', audio: './assets/sounds/major-f.wav' },
    { name: 'G', audio: './assets/sounds/major-g.wav' },
    { name: 'A', audio: './assets/sounds/major-a.wav' },
    { name: 'Am', audio: './assets/sounds/minor-a.wav' },
    { name: 'Em', audio: './assets/sounds/minor-e.wav' },
    { name: 'Dm', audio: './assets/sounds/minor-d.wav' }
  ];

  // DOM 요소
  const playButton = document.getElementById('playSound');
  const resultElement = document.getElementById('result');
  const errorElement = document.getElementById('error');
  const optionButtons = document.querySelectorAll('.chord-btn');

  let currentChord = null;

  // 오디오 로드 체크
  function preloadAudio() {
    chords.forEach(chord => {
      const tempAudio = new Audio();
      tempAudio.src = chord.audio;
    });
  }

  // 게임 초기화
  function initGame() {
    preloadAudio();
    newRound();

    // 옵션 버튼 클릭 이벤트
    optionButtons.forEach(button => {
      button.addEventListener('click', () => {
        checkAnswer(button.dataset.chord);
      });
    });

    // 재생 버튼 클릭 이벤트
    playButton.addEventListener('click', playChordAudio);
  }

  // 새로운 라운드 시작
  function newRound() {
    currentChord = chords[Math.floor(Math.random() * chords.length)];
    resultElement.textContent = '';
    errorElement.textContent = '';
    playButton.disabled = false;
  }

  // 정답 체크
  function checkAnswer(answer) {
    if (answer === currentChord.name) {
      resultElement.textContent = '정답입니다! 🎸';
      resultElement.style.color = 'green';
    } else {
      resultElement.textContent = `틀렸습니다. 정답은 ${currentChord.name}입니다.`;
      resultElement.style.color = 'red';
    }

    playButton.disabled = true;

    setTimeout(() => {
      newRound();
    }, 2000);
  }

  // 코드 소리 재생
  function playChordAudio() {
    if (currentChord) {
      playButton.disabled = true;

      audioElement.src = currentChord.audio;
      audioElement.play().catch(() => {
        errorElement.textContent = '오디오 재생에 실패했습니다.';
      });

      audioElement.onended = () => {
        playButton.disabled = false;
      };
    }
  }

  // 게임 시작
  initGame();
}


// travel 페이지 스크립트
if (Utils.isPage('travel')) {
  // Slider 클래스
  class Slider {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      this.slides = this.container.querySelector('.slides');
      this.dots = this.container.querySelector('.dots');
      this.currentIndex = 0;
      this.totalSlides = this.container.querySelectorAll('.slide').length;

      this.createDots();
      this.updateSlidePosition();
    }

    // 도트 생성
    createDots() {
      for (let i = 0; i < this.totalSlides; i++) {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        dot.onclick = () => this.currentSlide(i + 1);
        this.dots.appendChild(dot);
      }
    }

    // 현재 슬라이드로 이동
    currentSlide(n) {
      if (n >= 1 && n <= this.totalSlides) {
        this.currentIndex = n - 1;
        this.updateSlidePosition();
      }
    }

    // 슬라이드 위치 업데이트
    updateSlidePosition() {
      this.slides.style.transform = `translateX(${-this.currentIndex * 100}%)`;
      this.updateDots();
    }

    // 도트 업데이트
    updateDots() {
      const dots = this.container.querySelectorAll('.dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === this.currentIndex);
      });
    }
  }

  // 슬라이더 생성
  const slider1 = new Slider('slider1');

  // 슬라이더 추가 시 ID 부여 후 변수로 생성 가능
  // ex ) const slider2 = new Slider('slider2');
  // 이미지 개수에 따라 dot 자동 생성 및 슬라이드 이동 가능
}


// development 페이지 스크립트
if (Utils.isPage('development')) {
  const emojiContainer = document.querySelector('.emoji--container');

  emojiContainer.addEventListener('click', () => {
    emojiContainer.classList.toggle('flipped');
    emojiContainer.classList.add('spinning');
  });
}

// sticker 페이지 스크립트
if (Utils.isPage('stickers')) {
  // 스티커 컨테이너와 개별 스티커 요소 선택
  const stickersContainer = document.querySelector('.stickers');
  const stickerBg = document.querySelector('.sticker--bg');
  const stickers = document.querySelectorAll('.sticker');

  // 스티커 컨테이너의 스타일 수정
  stickersContainer.style.position = 'relative';

  // 각 스티커에 대한 이벤트 설정
  stickers.forEach((sticker, index) => {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;


    function dragStart(e) {
      if (e.type === "touchstart") {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
      } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
      }

      if (e.target === sticker) {
        isDragging = true;
        sticker.style.cursor = 'grabbing';
        sticker.style.zIndex = '1000';
      }
    }

    function dragEnd() {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      sticker.style.cursor = 'grab';
      sticker.style.zIndex = '1';
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();

        if (e.type === "touchmove") {
          currentX = e.touches[0].clientX - initialX;
          currentY = e.touches[0].clientY - initialY;
        } else {
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
        }

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, sticker);
      }
    }

    function setTranslate(xPos, yPos, el) {
      el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }

    // 마우스 이벤트
    sticker.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // 터치 이벤트
    sticker.addEventListener('touchstart', dragStart);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', dragEnd);
  });
}