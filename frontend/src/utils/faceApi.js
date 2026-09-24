import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export const loadModels = async () => {
    if (modelsLoaded) return true;
    try {
        const MODEL_URL = '/models';
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        modelsLoaded = true;
        return true;
    } catch (e) {
        console.error('Error loading face-api models', e);
        return false;
    }
};

export const getFaceDescriptor = async (imageElement) => {
    if (!modelsLoaded) await loadModels();
    
    // Detect a single face with landmarks and descriptor
    const detection = await faceapi
        .detectSingleFace(imageElement)
        .withFaceLandmarks()
        .withFaceDescriptor();
        
    if (!detection) {
        return null; // No face detected
    }
    
    return detection.descriptor;
};

export const compareDescriptors = (descriptor1, descriptor2, threshold = 0.6) => {
    // Descriptor can be a Float32Array or standard array
    const d1 = new Float32Array(Object.values(descriptor1));
    const d2 = new Float32Array(Object.values(descriptor2));
    
    const distance = faceapi.euclideanDistance(d1, d2);
    return {
        match: distance < threshold,
        distance: distance
    };
};
