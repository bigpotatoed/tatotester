let mediaRecorder;
let audioChunks = [];
let stream = null;

// Counters
let count = 1;
const maxCount = 12;
const answerMaxCount = 20;
const counter = document.getElementById("counter");

// Recording
const heading = document.getElementById("heading");
const recBtn = document.getElementById("recBtn");
const recordingAudio = new Audio();
const recStrings = document.getElementById("recStrings");

const answerBtn = document.getElementById("answerBtn");

const recordingPage = document.getElementById("recordingPage");
const transitionPage = document.getElementById("transitionPage");
const gameStartUI = document.getElementById("gameStartUI");
const answerPage = document.getElementById("answerPage");
const finishPage = document.getElementById("finishPage");
const promotionPage = document.getElementById("promotionPage")

const answerStrings = document.getElementById("answerStrings");

const playingAudio = new Audio();

const debugBtn = document.getElementById("debug");

// Find an audio format this browser supports
const CANDIDATES = [
    "audio/webm;codecs=opus",
    "audio/ogg;codecs=opus",
    "audio/mp4",   
    "audio/wav",   
    "audio/webm",
];
const mimeType = CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
if (!mimeType) 
{
    throw new Error("No supported audio format found");
}

// Saved recordings
let lastBlob = null;
const savedAudios = [];

let answerList = [];
let currentAnswerIndex = 1;
const answerDisplayImg = document.getElementById("answerDisplayImg");
const answerCounter = document.getElementById("answerCounter");

// Images
const displayImg = document.getElementById("displayImg")
let selectImgIndex = 0;
let images = [
    "img1.png",
    "img2.png",
    "img3.png",
    "img4.png",
    "img5.png",
    "img6.png",
    "img7.png",
    "img8.png",
    "img9.png",
    "img10.png",
    "img11.png",
    "img12.png"
]

// Shuffle an array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function createRandomAnswerList()
{
    answerList = [];

    for(let i = 0; i < maxCount; i++)
    {
        answerList.push(i);
    }

    const remaining = answerMaxCount - maxCount;
    for(let j = 0; j < remaining; j++)
    {
        const randomIndex = Math.floor(Math.random() * maxCount);
        answerList.push(randomIndex);
    }

    shuffle(answerList);
    console.log(answerList);
}

// Image ALT fallback (shows the number from img<N>.png)
function setImageErrorHandler(img) {
    img.onerror = () => {
        const match = img.src.match(/img(\d+)\./);
        if(match)
        {
            img.alt = match[1];
        } 
        else 
        {
            img.alt = "Image error";
        }
    };
}

// Initial display
displayImg.src = images[0];
setImageErrorHandler(displayImg)

function stopStream()
{
    if(stream)
    {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
    }
}

async function recBtnClick()
{
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        recBtn.querySelector("img").src = "recBtn.png"; 
        heading.src = "headBefore.png"
        recStrings.src = "strings2Before.png"
        return;
    }

    if (!stream) 
    {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    mediaRecorder = new MediaRecorder(stream,{mimeType});

    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        const audioURL = URL.createObjectURL(audioBlob);
        lastBlob = audioBlob;  

        // Release the previous URL if there is one
        if (recordingAudio._url) 
        {
            URL.revokeObjectURL(recordingAudio._url);
        }
        recordingAudio._url = audioURL;
        recordingAudio.src = audioURL;

        recBtn.querySelector("img").src = "recBtn.png";
        heading.src = "headBefore.png"
        recStrings.src = "strings2Before.png"

        savedAudios.push(lastBlob);

        count++;

        stopStream();

        // After 12 recordings, go to the game start screen
        if (count > maxCount) {
            recordingPage.style.display = "none";
            gameStartUI.style.display = "block";

            createRandomAnswerList();
            currentAnswerIndex = 1;

            return;
        }

        displayImg.src = images[count - 1];

        recordingPage.style.display = "none";
        transitionPage.style.display = "block";
    };

    mediaRecorder.start();
    recBtn.querySelector("img").src = "stopBtn.png";
    heading.src = "headAfter.png"
    recStrings.src = "strings2After.png"
};

function returnBtnClick()
{
    recordingPage.style.display = "none";
    transitionPage.style.display = "block";
}

function goNextRecording()
{
    transitionPage.style.display = "none";
    recordingPage.style.display = "block";
}

function goAnswerPage()
{
    gameStartUI.style.display = "none";
    answerPage.style.display = "block";

    setQuestion();
}

function returnBeforeRecording()
{
    if(count <= 1)
    {
        return;
    }

    savedAudios.pop();

    count--;

    displayImg.src = images[count - 1];

    recordingPage.style.display = "block";
    transitionPage.style.display = "none";
}

function answerBtnClick()
{
    const index = answerList[currentAnswerIndex - 1];
    const answerImg = images[index];

    answerDisplayImg.src = answerImg;
    setImageErrorHandler(answerDisplayImg);

    answerStrings.src = "strings6.png";

    playBtn.style.display = "none";
    answerDisplayImg.style.display = "block";

    answerBtn.querySelector("img").src = "answerAfter.png";

    answerBtn.onclick = goNextQuestion;
}

function goNextQuestion()
{
    currentAnswerIndex++;

    playBtn.style.display = "block";
    answerDisplayImg.style.display = "none";

    answerStrings.src = "strings5.png";

    answerBtn.querySelector("img").src = "answerBefore.png";

    answerBtn.onclick = answerBtnClick;

    if(currentAnswerIndex > answerMaxCount)
    {
        answerPage.style.display = "none";
        finishPage.style.display = "block";

        return;
    }

    setQuestion();
}

function setQuestion()
{
    answerCounter.textContent = `${currentAnswerIndex}/${answerMaxCount}`;

    const index = answerList[currentAnswerIndex - 1];
    const blob = savedAudios[index];

    const url = URL.createObjectURL(blob);
    playingAudio.src = url;

    // Release when playback ends
    playingAudio.onended = () => { URL.revokeObjectURL(url); playingAudio.onended = null; };

    answerDisplayImg.src = "img0.png";
    answerDisplayImg.alt = "?";

    answerBtn.style.display = "block";
}

function playRecording()
{
    playingAudio.play();
};

function goPromotionPage()
{
    finishPage.style.display = "none";
    promotionPage.style.display = "block";
}

function resetGame()
{
    savedAudios.length = 0;
    lastBlob = null;

    count = 1;
    currentAnswerIndex = 1;
    answerList = [];

    displayImg.src = images[0];
    setImageErrorHandler(displayImg);

    answerDisplayImg.style.display = "none";
    playBtn.style.display = "block";
    answerBtn.querySelector("img").src = "answerBefore.png";
    answerStrings.src = "strings5.png";

    finishPage.style.display = "none";
    promotionPage.style.display = "none";
    answerPage.style.display = "none";
    gameStartUI.style.display = "none";
    transitionPage.style.display = "none";
    recordingPage.style.display = "block"; 

    heading.src = "headBefore.png";
    recStrings.src = "strings2Before.png";

    stopStream();
}

debugBtn.onclick = () =>{
    const dummyData = new Uint8Array([0]); 
    const dummyBlob = new Blob([dummyData], { type: mimeType });

    // Fill savedAudios with 12 dummy recordings
    savedAudios.length = 0;

    for (let i = 0; i < maxCount; i++) {
        savedAudios.push(dummyBlob);
    }

    // Set counters to the recording-complete state
    count = maxCount;

    // Skip the recording page
    recordingPage.style.display = "none";
    finishPage.style.display = "block";

    createRandomAnswerList();
    currentAnswerIndex = 1;
}