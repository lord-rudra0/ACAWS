Face-API.js model weights directory

Place the following files here if you want to load models locally instead of the CDN:
- tiny_face_detector_model-weights_manifest.json
- face_landmark_68_model-weights_manifest.json
- face_recognition_model-weights_manifest.json
- face_expression_model-weights_manifest.json

You can download compatible weights from the official repo:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

If this folder is empty, the app will automatically fall back to the CDN:
https://justadudewhohacks.github.io/face-api.js/models
