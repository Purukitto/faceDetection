const imageUpload = document.getElementById('imageUpload')

function myFunction() {
    setTimeout(showPage, 3000);
}

function showPage() {
    document.getElementById("loader").style.display = "none";
    document.getElementById("button-wrap").style.display = "block";
}

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start() {
    const container = document.createElement('div')
    container.style.position = 'relative'
    const myDiv = document.getElementById("content");
    myDiv.append(container)
    const labeledFaceDescriptors = await loadLabeledImages()
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
    let image
    let canvas
    const myButton = document.getElementById("new-button");
    // myButton.style.backgroundColor = "green"
    myButton.style.backgroundImage = "linear-gradient(to right, #4da8da, #007cc7)"
    myButton.innerHTML = "Click here to upload image"

    imageUpload.addEventListener('change', async() => {
        if (image) image.remove()
        if (canvas) canvas.remove()
        image = await faceapi.bufferToImage(imageUpload.files[0])
        container.append(image)
        canvas = faceapi.createCanvasFromMedia(image)
        container.append(canvas)
        const displaySize = {
            width: image.width,
            height: image.height
        }
        faceapi.matchDimensions(canvas, displaySize)
        const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box
            const drawBox = new faceapi.draw.DrawBox(box, {
                label: result.toString()
            })
            drawBox.draw(canvas)
        })
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    })
}

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