import re

with open('index.html', 'r') as f:
    content = f.read()

# Remove parseMidiText
content = re.sub(
    r'function parseMidiText\(midiText\) \{[\s\S]*?\}\n',
    '',
    content
)

# Remove generateFullSong
content = re.sub(
    r'function generateFullSong\(\) \{[\s\S]*?return song\.trim\(\);\n\}\n',
    '',
    content
)

# Remove shuffleArray
content = re.sub(
    r'function shuffleArray\(array\) \{[\s\S]*?return array;\n\}\n',
    '',
    content
)

# Insert <script src="utils.js"></script> before <script>
content = content.replace('<script>', '<script src="utils.js"></script>\n<script>')

with open('index.html', 'w') as f:
    f.write(content)
