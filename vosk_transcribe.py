import sys
import os
from vosk import Model, KaldiRecognizer
import wave
import json

# Yeh audio file ka path lega
if len(sys.argv) < 2:
    print(json.dumps({"error": "No file path given"}))
    sys.exit(1)

audio_path = sys.argv[1]

# Vosk ka model load karo
model = Model("model")

# Audio file read karo
wf = wave.open(audio_path, "rb")
rec = KaldiRecognizer(model, wf.getframerate())

result_text = ""

while True:
    data = wf.readframes(4000)
    if len(data) == 0:
        break
    if rec.AcceptWaveform(data):
        part_result = json.loads(rec.Result())
        result_text += part_result.get('text', '')

part_result = json.loads(rec.FinalResult())
result_text += part_result.get('text', '')

print(json.dumps({"transcript": result_text}))
