const video = document.getElementById('video')

function myFunction() {
    setTimeout(showPage, 3000);
}

function showPage() {
    document.getElementById("loader").style.display = "none";
    document.getElementById("video").style.display = "block";
}

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)


function start() {
    navigator.mediaDevices.getUserMedia({
            video: true
        })
        .then(stream => video.srcObject = stream);
}

video.addEventListener('play', async() => {
    const canvas = faceapi.createCanvasFromMedia(video)
    const myDiv = document.getElementById("content");
    myDiv.append(canvas)
    const displaySize = {
        width: video.width,
        height: video.height
    }
    const labeledFaceDescriptors = await loadLabeledImages();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
    faceapi.matchDimensions(canvas, displaySize)
    setInterval(async() => {
        const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box
            const drawBox = new faceapi.draw.DrawBox(box, {
                label: result.toString()
            })
            drawBox.draw(canvas)
        })
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    }, 100)
})


function loadLabeledImages() {
    const labels = ['Benedict Cumberbatch', 'Emma Watson', 'Martin Freeman', 'Pulkit Singh']
    return Promise.all(
        labels.map(async label => {
            const descriptions = []
            for (let i = 1; i < 11; i++) {
                const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/Purukitto/faceDetection/main/src/${label}/${i}.jpg`)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                descriptions.push(detections.descriptor)
            }
            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}