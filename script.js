let handleId = 0;
let milliseconds = 0;

const timerDisplay = document.getElementById("timer")
const go = document.getElementById("go")
const stop = document.getElementById("stop")
const reset = document.getElementById("reset")

function updateTime() {
    milliseconds += 10; // 10 밀리세컨드 증가
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    seconds %= 60;
    minutes %= 60;

    let ms = milliseconds % 1000; // 밀리세컨드 계산

    // 시간, 분, 초, 밀리세컨드를 두 자리 숫자로 표시
    timerDisplay.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${padMilli(ms)}`;
}

// 숫자를 두 자리 문자열로 변환 (시, 분, 초)
function pad(number) {
    return number < 10 ? '0' + number : number;
}

// 밀리세컨드를 세 자리 문자열로 변환
function padMilli(number) {
    if (number < 10) {
        return '00' + number;
    } else if (number < 100) {
        return '0' + number;
    } else {
        return number;
    }
}

// '시작' 버튼 클릭 이벤트
go.onclick = function() {
    if(handleId == 0) {
        handleId = setInterval(updateTime, 10);
    }
}

// '정지' 버튼 클릭 이벤트
stop.onclick = function() {
    clearInterval(handleId);
    handleId = 0;
}

// '리셋' 버튼 클릭 이벤트
reset.onclick = function() {
    clearInterval(handleId);
    handleId = 0;
    milliseconds = 0;
    timerDisplay.textContent = "00:00:00.000";
}
